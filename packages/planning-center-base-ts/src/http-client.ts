import ky, { type KyInstance } from 'ky';
import { OAuth2Client, OAuth2Fetch } from '@badgateway/oauth2-client';
import type { PcoClientConfig } from './config';
import type { JsonValue } from './json-api';
import { PcoRateLimiter } from './rate-limiter';
import { PcoApiError, rateLimitHeadersFromResponse } from './errors';
import { createDebugLogger, logRequestStart, logRequestComplete } from './debug';
import { getAuthHeader } from './auth';
import { ensureRecord, getRequestUrl, isRecord, isErrorObject } from './typed';
import type { HttpRequestOptions, HttpResponse } from './http-client-types';

export type { HttpRequestOptions, HttpResponse } from './http-client-types';

function getOAuthClientId(auth: Extract<PcoClientConfig['auth'], { type: 'oauth' }>): string {
  return String(auth.clientId ?? (typeof process !== 'undefined' ? process.env?.PCO_APP_ID : undefined) ?? '');
}

function getOAuthClientSecret(auth: Extract<PcoClientConfig['auth'], { type: 'oauth' }>): string | undefined {
  const v = auth.clientSecret ?? (typeof process !== 'undefined' ? process.env?.PCO_APP_SECRET : undefined);
  return v != null ? String(v) : undefined;
}

const OAUTH_AUTH_METHOD = 'client_secret_post' satisfies 'client_secret_post';

function getOAuthClientConfig(auth: Extract<PcoClientConfig['auth'], { type: 'oauth' }>, origin: string) {
  return {
    server: origin,
    tokenEndpoint: '/oauth/token',
    clientId: getOAuthClientId(auth),
    clientSecret: getOAuthClientSecret(auth),
    authenticationMethod: OAUTH_AUTH_METHOD,
  } satisfies { server: string; tokenEndpoint: string; clientId: string; clientSecret: string | undefined; authenticationMethod: 'client_secret_post' };
}

function getOutboundMethod(input: RequestInfo | URL, init?: RequestInit): string {
  if (init?.method) return init.method;
  if (input instanceof Request) return input.method;
  return 'GET';
}

function getBodyInfoFromInit(init?: RequestInit): string {
  if (init?.body == null) return '';
  if (typeof init.body === 'string') return `body=${init.body.length}`;
  return 'body=present';
}

function getOutboundBodyInfo(input: RequestInfo | URL, init?: RequestInit): string {
  const fromInit = getBodyInfoFromInit(init);
  if (fromInit) return fromInit;
  if (input instanceof Request && input.body != null) return 'body=present';
  return '';
}

function logOutboundRequest(config: PcoClientConfig, input: RequestInfo | URL, init?: RequestInit): void {
  const logger = createDebugLogger(config);
  if (!logger.enabled) return;
  const method = getOutboundMethod(input, init);
  const url = getRequestUrl(input);
  const bodyInfo = getOutboundBodyInfo(input, init);
  const msg = bodyInfo ? `outbound fetch: ${method} ${url} ${bodyInfo}` : `outbound fetch: ${method} ${url}`;
  logger.log(msg);
}

function createOAuthFetch(config: PcoClientConfig, baseURL: string): (input: RequestInfo | URL, init?: RequestInit) => Promise<Response> {
  const auth = config.auth;
  if (auth.type !== 'oauth') throw new Error('Expected oauth auth');
  const origin = new URL(baseURL).origin;
  const client = new OAuth2Client(getOAuthClientConfig(auth, origin));
  const oauthFetch = new OAuth2Fetch({
    client,
    getStoredToken: () => ({ accessToken: auth.accessToken, refreshToken: auth.refreshToken, expiresAt: null }),
    storeToken: (t) => {
      auth.accessToken = t.accessToken;
      auth.refreshToken = t.refreshToken ?? auth.refreshToken;
      void auth.onRefresh({ accessToken: t.accessToken, refreshToken: auth.refreshToken });
    },
    getNewToken: async () => null,
    onError: (err) => void auth.onRefreshFailure(err),
    scheduleRefresh: false,
  });
  return (input: RequestInfo | URL, init?: RequestInit) => {
    logOutboundRequest(config, input, init);
    return oauthFetch.fetch(input instanceof URL ? input.toString() : input, init);
  };
}

function createStaticAuthFetch(config: PcoClientConfig): (input: RequestInfo | URL, init?: RequestInit) => Promise<Response> {
  return (input: RequestInfo | URL, init?: RequestInit) => {
    logOutboundRequest(config, input, init);
    const url = getRequestUrl(input);
    const headers = new Headers(init?.headers);
    const h = getAuthHeader(config.auth);
    if (h) headers.set('Authorization', h);
    return fetch(url, { ...init, headers });
  };
}

function createAuthFetch(config: PcoClientConfig, baseURL: string): (input: RequestInfo | URL, init?: RequestInit) => Promise<Response> {
  return config.auth.type === 'oauth' ? createOAuthFetch(config, baseURL) : createStaticAuthFetch(config);
}

type ParamValue = string | number | boolean | null | undefined | object;

function isScalarParam(v: ParamValue): v is string | number | boolean {
  return v !== undefined && v !== null && (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean');
}

function buildSearchParams(params: HttpRequestOptions['params']): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  if (!params) return out;
  for (const [k, v] of Object.entries(params)) {
    if (isScalarParam(v)) out[k] = v;
  }
  return out;
}

type ErrorObject = import('./json-api').ErrorObject;

function parseErrorData(raw: Record<string, JsonValue>): { errors?: ErrorObject[] } {
  if (!Array.isArray(raw.errors)) return {};
  const errors = raw.errors.filter((e): e is ErrorObject => isErrorObject(e));
  return { errors };
}

/**
 * HTTP client for PCO APIs: auth, retries, rate limiting, and JSON:API error handling.
 * Used by BaseModule and package clients (People, Check-ins). Prefer using PcoClient /
 * PcoCheckInsClient rather than constructing this directly unless you need low-level requests.
 */
export class PcoHttpClient {
  private config: PcoClientConfig;
  private rateLimiter: PcoRateLimiter;
  private kyInstance: KyInstance;
  private requestCounter = 0;

  /** @param config Auth, baseURL, timeout, and optional debug options. */
  constructor(config: PcoClientConfig) {
    this.config = config;
    this.rateLimiter = new PcoRateLimiter(100, 20000);
    const baseURL = (config.baseURL ?? 'https://api.planningcenteronline.com/people/v2').replace(/\/$/, '');
    const timeout = config.timeout ?? 30000;
    this.kyInstance = ky.create({
      prefixUrl: baseURL,
      timeout,
      fetch: createAuthFetch(config, baseURL),
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...config.headers },
      throwHttpErrors: false,
      retry: { limit: 5 },
      hooks: {
        beforeRetry: [async () => this.rateLimiter.waitForAvailability()],
      },
    });
  }

  private requestId(): string {
    return `req_${Date.now()}_${++this.requestCounter}`;
  }

  private applyRateLimit(response: Response): void {
    this.rateLimiter.updateFromHeaders(rateLimitHeadersFromResponse(response));
    this.rateLimiter.recordRequest();
  }

  private async executeOnce(
    path: string,
    options: HttpRequestOptions,
    kyOpts: { searchParams: Record<string, string | number | boolean>; timeout: number; prefixUrl?: string },
  ): Promise<Response> {
    const method = options.method;
    if (method === 'GET') return this.kyInstance.get(path, kyOpts);
    if (method === 'POST') return this.kyInstance.post(path, { ...kyOpts, json: this.buildBody(options) });
    if (method === 'PATCH') return this.kyInstance.patch(path, { ...kyOpts, json: this.buildBody(options) });
    if (method === 'DELETE') return this.kyInstance.delete(path, kyOpts);
    return this.kyInstance(path, { method, ...kyOpts });
  }

  private async runWith429Retry(
    path: string,
    options: HttpRequestOptions,
    kyOpts: { searchParams: Record<string, string | number | boolean>; timeout: number; prefixUrl?: string },
  ): Promise<Response> {
    let response: Response = await this.executeOnce(path, options, kyOpts);
    for (let i = 0; i < 5 && response.status === 429; i++) {
      this.applyRateLimit(response);
      await this.rateLimiter.waitForAvailability();
      response = await this.executeOnce(path, options, kyOpts);
    }
    this.applyRateLimit(response);
    return response;
  }

  private async throwIfNotOk(response: Response): Promise<void> {
    if (response.status === 429) throw new Error('Rate limit exceeded after retries');
    if (!response.ok) {
      const raw = await response.json().catch((): Record<string, JsonValue> => ({}));
      const errorData = isRecord(raw) ? parseErrorData(raw) : {};
      throw PcoApiError.fromFetchError(response, errorData);
    }
  }

  private responseToHeaders(response: Response): Record<string, string> {
    const out: Record<string, string> = {};
    response.headers.forEach((v, k) => { out[k] = v; });
    return out;
  }

  private async parseSuccessBody<T>(response: Response, options: HttpRequestOptions): Promise<T> {
    if (options.method === 'DELETE' || response.status === 204) {
      /* eslint-disable-next-line no-restricted-syntax -- generic empty; T not constructible */
      return {} as T;
    }
    const raw = await response.json();
    const data = ensureRecord(raw);
    /* eslint-disable-next-line no-restricted-syntax -- FlattenedResourceResult→TOut; no type guard for generic */
    return data as T;
  }

  private buildKyOpts(options: HttpRequestOptions): { searchParams: Record<string, string | number | boolean>; timeout: number; prefixUrl?: string } {
    const path = options.endpoint.startsWith('http') ? options.endpoint : options.endpoint.replace(/^\//, '');
    const isAbsolute = path.startsWith('http');
    return {
      searchParams: buildSearchParams(options.params),
      timeout: options.timeout ?? this.config.timeout ?? 30000,
      ...(isAbsolute && { prefixUrl: '' }),
    };
  }

  /** Execute an HTTP request. Throws PcoApiError on non-2xx; retries on 429. */
  async request<T = Record<string, JsonValue>>(options: HttpRequestOptions): Promise<HttpResponse<T>> {
    const requestId = this.requestId();
    const start = Date.now();
    const logger = createDebugLogger(this.config);
    if (logger.enabled) logRequestStart(this.config, { method: options.method, endpoint: options.endpoint, requestId, params: options.params });

    await this.rateLimiter.waitForAvailability();

    const path = options.endpoint.startsWith('http') ? options.endpoint : options.endpoint.replace(/^\//, '');
    const response = await this.runWith429Retry(path, options, this.buildKyOpts(options));
    await this.throwIfNotOk(response);

    const headersRecord = this.responseToHeaders(response);
    const duration = Date.now() - start;
    if (logger.enabled) logRequestComplete(this.config, { method: options.method, endpoint: options.endpoint, status: response.status, duration, requestId });

    const data = await this.parseSuccessBody<T>(response, options);
    return { data, status: response.status, headers: headersRecord, requestId, duration };
  }

  private buildBody(options: HttpRequestOptions): { data: { type: string; attributes: Record<string, JsonValue>; relationships?: Record<string, JsonValue> } } {
    const data = options.data != null && isRecord(options.data) ? options.data : {};
    const type = this.inferType(options.endpoint);
    const { relationships, ...attributes } = data;
    const body: { data: { type: string; attributes: Record<string, JsonValue>; relationships?: Record<string, JsonValue> } } = {
      data: { type, attributes: isRecord(attributes) ? attributes : {} },
    };
    if (isRecord(relationships)) body.data.relationships = relationships;
    return body;
  }

  private inferType(endpoint: string): string {
    const parts = endpoint.split('/').filter(Boolean);
    const last = parts[parts.length - 1] ?? '';
    const pascal = last.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('');
    if (pascal.length > 3 && pascal.endsWith('s')) return pascal.slice(0, -1);
    return pascal;
  }

  /** Current rate limit state (count, limit, period). Updated after each request. */
  getRateLimitInfo() {
    return this.rateLimiter.getRateLimitInfo();
  }

  /** Authorization header value for use in external requests (e.g. file upload to PCO upload service). */
  getAuthHeader(): string {
    return getAuthHeader(this.config.auth);
  }
}
