/**
 * v2.0.0 HTTP Client
 */

import type { PcoClientConfig } from './types/config';
import { PcoEventEmitter, RequestIdGenerator, PerformanceMetrics, RateLimitTracker } from './monitoring';
import { PcoRateLimiter } from './rate-limiter';
import { PcoApiError } from './errors/api-error';
import { createDebugLogger } from './debug';

export interface HttpRequestOptions {
    method: string;
    endpoint: string;
    data?: any;
    params?: Record<string, any>;
    headers?: Record<string, string>;
    timeout?: number;
}

export interface HttpResponse<T = any> {
    data: T;
    status: number;
    headers: Record<string, string>;
    requestId: string;
    duration: number;
    /** Set when the request succeeded after one or more retries (e.g. 429/401). */
    retryCount?: number;
}

export class PcoHttpClient {
    private config: PcoClientConfig;
    private eventEmitter: PcoEventEmitter;
    private requestIdGenerator: RequestIdGenerator;
    private performanceMetrics: PerformanceMetrics;
    private rateLimitTracker: RateLimitTracker;
    private rateLimiter: PcoRateLimiter;

    constructor(config: PcoClientConfig, eventEmitter: PcoEventEmitter) {
        this.config = config;
        this.eventEmitter = eventEmitter;
        this.requestIdGenerator = new RequestIdGenerator();
        this.performanceMetrics = new PerformanceMetrics();
        this.rateLimitTracker = new RateLimitTracker();

        // Initialize rate limiter
        this.rateLimiter = new PcoRateLimiter(100, 20000); // 100 requests per 20 seconds
    }

    /** Log only when config.debug is set; no-op otherwise */
    private debugLog(message: string, data?: unknown): void {
        const logger = createDebugLogger(this.config);
        if (logger.enabled) logger.log(message, data);
    }

    async request<T = any>(options: HttpRequestOptions): Promise<HttpResponse<T>> {
        const requestId = this.requestIdGenerator.generate();
        const startTime = Date.now();

        // Emit request start event
        this.eventEmitter.emit({
            type: 'request:start',
            endpoint: options.endpoint,
            method: options.method,
            requestId,
            timestamp: new Date().toISOString(),
            ...(Object.keys(options.params || {}).length > 0 && { params: options.params as Record<string, unknown> }),
        });

        try {
            this.debugLog('http  rate limiter waiting', { method: options.method, endpoint: options.endpoint });
            await this.rateLimiter.waitForAvailability();
            this.debugLog('http  rate limiter acquired', { method: options.method, endpoint: options.endpoint });

            const response = await this.makeRequest<T>(options, requestId);
            const duration = Date.now() - startTime;

            // Record performance metrics
            this.performanceMetrics.record(`${options.method} ${options.endpoint}`, duration, true);

            // Update rate limit tracking
            this.updateRateLimitTracking(options.endpoint, response.headers);

            // Emit request complete event
            const headers = response.headers;
            const rateLimitRemaining = this.getRateLimitRemaining(headers);
            const rateLimitLimit = this.getRateLimitLimit(headers);
            const responseSummary = this.getResponseSummary(response.data);
            this.eventEmitter.emit({
                type: 'request:complete',
                endpoint: options.endpoint,
                method: options.method,
                status: response.status,
                duration,
                requestId,
                timestamp: new Date().toISOString(),
                ...(Object.keys(options.params || {}).length > 0 && { params: options.params as Record<string, unknown> }),
                ...(response.retryCount != null && response.retryCount > 0 && { retryCount: response.retryCount }),
                ...(rateLimitRemaining != null && { rateLimitRemaining }),
                ...(rateLimitLimit != null && { rateLimitLimit }),
                ...(responseSummary && { responseSummary }),
            });

            this.debugLog('http  request complete', {
                method: options.method,
                endpoint: options.endpoint,
                status: response.status,
                duration,
                requestId,
            });

            return response;
        } catch (error) {
            const duration = Date.now() - startTime;

            // Record performance metrics
            this.performanceMetrics.record(`${options.method} ${options.endpoint}`, duration, false);

            // Emit request error event
            this.eventEmitter.emit({
                type: 'request:error',
                endpoint: options.endpoint,
                method: options.method,
                error: error as Error,
                requestId,
                timestamp: new Date().toISOString(),
                ...(Object.keys(options.params || {}).length > 0 && { params: options.params as Record<string, unknown> }),
            });

            throw error;
        }
    }

    private async makeRequest<T>(options: HttpRequestOptions, requestId: string, retryCount: number = 0): Promise<HttpResponse<T>> {
        if (retryCount > 0) {
            this.debugLog('http  retry attempt', { method: options.method, endpoint: options.endpoint, retryCount });
        }
        const baseURL = this.config.baseURL || 'https://api.planningcenteronline.com/people/v2';
        let url = options.endpoint.startsWith('http') ? options.endpoint : `${baseURL}${options.endpoint}`;

        // Add query parameters
        if (options.params) {
            const searchParams = new URLSearchParams();
            Object.entries(options.params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    searchParams.append(key, String(value));
                }
            });
            const queryString = searchParams.toString();
            if (queryString) {
                url += url.includes('?') ? `&${queryString}` : `?${queryString}`;
            }
        }

        // Prepare headers
        const headers: Record<string, string> = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            ...this.config.headers,
            ...options.headers,
        };

        // Add authentication
        this.addAuthentication(headers);

        // Prepare request options
        const requestOptions: RequestInit = {
            headers,
            method: options.method,
        };

        // Add body for POST/PATCH requests
        if ((options.method === 'POST' || options.method === 'PATCH') && options.data) {
            // Determine resource type from endpoint
            const resourceType = this.getResourceTypeFromEndpoint(options.endpoint);

            // Separate attributes and relationships
            const { relationships, ...attributes } = options.data;

            const jsonApiData: any = {
                data: {
                    type: resourceType,
                    attributes
                }
            };

            // Add relationships if present
            if (relationships) {
                jsonApiData.data.relationships = relationships;
            }

            requestOptions.body = JSON.stringify(jsonApiData);
        }

        // Add timeout
        const timeout = options.timeout || this.config.timeout || 30000;
        // Note: AbortController may not be available in all Node.js versions or polyfills
        let controller: AbortController | undefined;
        let timeoutId: NodeJS.Timeout;

        try {
            controller = new AbortController();
            timeoutId = setTimeout(() => controller && controller.abort(), timeout);
            if (controller) {
                requestOptions.signal = controller.signal;
            }
        } catch (error) {
            // AbortController not available, skip timeout
            timeoutId = setTimeout(() => {}, 0); // No-op
        }

        try {
            this.debugLog('http  fetch', { method: options.method, endpoint: options.endpoint, url });
            let response = await fetch(url, requestOptions);

            if (!response) {
                this.debugLog('http  fetch returned null, using HTTPS fallback', { url });
                response = await this.makeHttpsRequest(url, requestOptions);
            }

            this.debugLog('http  response', { method: options.method, endpoint: options.endpoint, status: response?.status });
            if (!response) {
                throw new Error('Both fetch and HTTPS fallback returned null/undefined response');
            }
            clearTimeout(timeoutId);

            // Update rate limiter from headers (handle case where headers might be undefined)
            const rateLimitHeaders = {
                'Retry-After': response.headers?.get('retry-after') || undefined,
                'X-PCO-API-Request-Rate-Count': response.headers?.get('x-pco-api-request-rate-count') || undefined,
                'X-PCO-API-Request-Rate-Limit': response.headers?.get('x-pco-api-request-rate-limit') || undefined,
                'X-PCO-API-Request-Rate-Period': response.headers?.get('x-pco-api-request-rate-period') || undefined,
            };

            this.rateLimiter.updateFromHeaders(rateLimitHeaders);
            this.rateLimiter.recordRequest();

            // Handle 429 responses
            if (response.status === 429) {
                this.debugLog('http  rate limit 429', { endpoint: options.endpoint, retryCount });
                if (retryCount >= 5) {
                    throw new Error(`Rate limit exceeded after ${retryCount} retries`);
                }
                await this.rateLimiter.waitForAvailability();
                return this.makeRequest<T>(options, requestId, retryCount + 1);
            }

            // Handle other errors
            if (!response.ok) {
                // Handle 401 errors with token refresh if available
                if (response.status === 401 && this.config.auth.type === 'oauth') {
                    this.debugLog('http  auth 401 attempting token refresh', { endpoint: options.endpoint, retryCount });
                    if (retryCount >= 3) {
                        throw new Error(`Authentication failed after ${retryCount} retries`);
                    }
                    try {
                        await this.attemptTokenRefresh();
                        this.debugLog('http  auth 401 token refresh success', { endpoint: options.endpoint });
                        return this.makeRequest<T>(options, requestId, retryCount + 1);
                    } catch (refreshError) {
                        this.debugLog('http  auth 401 token refresh failed', { error: String(refreshError) });
                        await this.config.auth.onRefreshFailure(refreshError as Error);
                        throw refreshError;
                    }
                }

                let errorData: any;
                try {
                    errorData = await response.json();
                } catch {
                    errorData = {};
                }

                throw PcoApiError.fromFetchError(response, errorData);
            }

            // Parse response
            if (options.method === 'DELETE') {
                return {
                    data: undefined as any,
                    status: response.status,
                    headers: this.extractHeaders(response),
                    requestId,
                    duration: 0, // Will be set by caller
                    ...(retryCount > 0 && { retryCount }),
                };
            }

            // Handle empty responses (e.g., 204 No Content)
            const contentType = response.headers.get('content-type') || '';
            const contentLength = response.headers.get('content-length');
            let data: any;
            
            // Check for JSON content types (including JSON:API format)
            const isJsonContent = contentType.includes('application/json') || 
                                  contentType.includes('application/vnd.api+json') ||
                                  contentType.includes('application/vnd+json');
            
            if (response.status === 204 || contentLength === '0' || !isJsonContent) {
                if (response.status !== 204 && contentLength !== '0') {
                    this.debugLog('http  non-JSON response', { status: response.status, contentType, contentLength });
                }
                data = {};
            } else {
                // Read body once. Prefer response.text() when available (real Response); fall back to response.json() for mocks that only provide .json()
                if (typeof (response as any).text === 'function') {
                    const text = await (response as any).text();
                    try {
                        if (!text || (text as string).trim() === '') {
                            this.debugLog('http  empty response body', { method: options.method, endpoint: options.endpoint });
                            data = {};
                        } else {
                            data = JSON.parse(text as string);
                            if (!data || typeof data !== 'object') {
                                this.debugLog('http  unexpected response structure', { method: options.method, endpoint: options.endpoint, sample: JSON.stringify(data).substring(0, 200) });
                            } else if (!data.data && options.method !== 'DELETE') {
                                this.debugLog('http  response missing data property', { method: options.method, endpoint: options.endpoint, sample: JSON.stringify(data).substring(0, 200) });
                            }
                        }
                    } catch (parseError) {
                        this.debugLog('http  JSON parse error', { method: options.method, endpoint: options.endpoint, error: String(parseError), sample: (text as string)?.substring(0, 500) });
                        data = {};
                    }
                } else if (typeof (response as any).json === 'function') {
                    try {
                        data = await (response as any).json();
                        if (!data || typeof data !== 'object') {
                            this.debugLog('http  unexpected response structure', { method: options.method, endpoint: options.endpoint, sample: JSON.stringify(data).substring(0, 200) });
                            data = data ?? {};
                        } else if (!data.data && options.method !== 'DELETE') {
                            this.debugLog('http  response missing data property', { method: options.method, endpoint: options.endpoint, sample: JSON.stringify(data).substring(0, 200) });
                        }
                    } catch (parseError) {
                        this.debugLog('http  JSON parse error', { method: options.method, endpoint: options.endpoint, error: String(parseError) });
                        data = {};
                    }
                } else {
                    data = {};
                }
            }
            return {
                data,
                status: response.status,
                headers: this.extractHeaders(response),
                requestId,
                duration: 0, // Will be set by caller
                ...(retryCount > 0 && { retryCount }),
            };
        } catch (error) {
            clearTimeout(timeoutId);
            // Handle timeout/abort errors
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error(`Request timeout after ${timeout}ms`);
            }
            throw error;
        }
    }

    private addAuthentication(headers: Record<string, string>): void {
        if (this.config.auth.type === 'personal_access_token') {
            // Personal Access Tokens use client_id:secret format with HTTP Basic Auth

            // Get client ID from config (required)
            const clientId = this.config.auth.personalAccessToken;

            // Get client secret from config or environment (with config taking precedence)
            const clientSecret = this.config.auth.personalAccessTokenSecret ||
                                process.env.PCO_PERSONAL_ACCESS_SECRET;

            if (!clientId) {
                throw new Error('personalAccessToken is required for personal access token authentication');
            }

            if (!clientSecret) {
                throw new Error('personalAccessTokenSecret (in config) or PCO_PERSONAL_ACCESS_SECRET environment variable is required for personal access token authentication');
            }

            const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
            headers.Authorization = `Basic ${credentials}`;
        } else if (this.config.auth.type === 'oauth') {
            headers.Authorization = `Bearer ${this.config.auth.accessToken}`;
        } else if (this.config.auth.type === 'basic') {
            // Basic auth with app credentials
            const credentials = Buffer.from(`${this.config.auth.appId}:${this.config.auth.appSecret}`).toString('base64');
            headers.Authorization = `Basic ${credentials}`;
        }
    }

    private getResourceTypeFromEndpoint(endpoint: string): string {
        // Extract resource type from endpoint
        // /households -> Household
        // /people -> Person
        // /emails -> Email
        // etc.
        const pathParts = endpoint.split('/').filter(part => part.length > 0);
        const resourcePath = pathParts[pathParts.length - 1];

        // Convert kebab-case to PascalCase and make singular
        const pascalCase = resourcePath
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join('');

        // Make singular (remove trailing 's' if it exists and the word is longer than 3 characters)
        if (pascalCase.endsWith('s') && pascalCase.length > 3) {
            return pascalCase.slice(0, -1);
        }

        return pascalCase;
    }

    /** Build a short summary of JSON:API response for logging (e.g. "25 items", "person:abc123"). */
    private getResponseSummary(data: any): string | undefined {
        if (!data || typeof data !== 'object') return undefined;
        const payload = data.data;
        if (Array.isArray(payload)) return `${payload.length} items`;
        if (payload && typeof payload === 'object' && payload.id != null) {
            const type = payload.type ?? 'resource';
            return `${type}:${payload.id}`;
        }
        if (data.meta?.total_count != null) return `total ${data.meta.total_count}`;
        return undefined;
    }

    private getRateLimitRemaining(headers: Record<string, string>): number | undefined {
        const raw = headers['x-pco-api-request-rate-count'] ?? headers['X-PCO-API-Request-Rate-Count'];
        if (raw == null) return undefined;
        const n = parseInt(raw, 10);
        return Number.isNaN(n) ? undefined : n;
    }

    private getRateLimitLimit(headers: Record<string, string>): number | undefined {
        const raw = headers['x-pco-api-request-rate-limit'] ?? headers['X-PCO-API-Request-Rate-Limit'];
        if (raw == null) return undefined;
        const n = parseInt(raw, 10);
        return Number.isNaN(n) ? undefined : n;
    }

    private extractHeaders(response: Response): Record<string, string> {
        const headers: Record<string, string> = {};
        
        // Handle case where headers might be undefined
        if (!response.headers) {
            return headers;
        }
        
        // Handle different header structures (browser vs Node.js)
        if (typeof response.headers.forEach === 'function') {
            // Browser or polyfilled Headers with forEach
            response.headers.forEach((value, key) => {
                headers[key] = value;
            });
        } else {
            // Node.js Headers - iterate using entries() with type assertion
            // TypeScript may not recognize entries() on Headers, but it exists in Node.js
            const headersObj = response.headers as any;
            if (typeof headersObj.entries === 'function') {
                for (const [key, value] of headersObj.entries()) {
                    headers[key as string] = value as string;
                }
            } else if (typeof headersObj.keys === 'function') {
                // Fallback: iterate using keys if entries() is not available
                const headerKeys = Array.from(headersObj.keys()) as string[];
                for (const key of headerKeys) {
                    headers[key] = headersObj.get(key) as string;
                }
            } else {
                // Last resort: try to access as object (some polyfills)
                for (const key in headersObj) {
                    if (headersObj.hasOwnProperty(key)) {
                        headers[key] = headersObj[key];
                    }
                }
            }
        }
        
        return headers;
    }

    private async attemptTokenRefresh(): Promise<void> {
        if (this.config.auth.type !== 'oauth') {
            throw new Error('Token refresh is only available for OAuth authentication');
        }
        this.debugLog('http  auth  token refresh start', {});

        const baseURL = this.config.baseURL || 'https://api.planningcenteronline.com/people/v2';
        const tokenUrl = baseURL.replace('/people/v2', '/oauth/token');

        // Prepare the request body for token refresh
        const body = new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: this.config.auth.refreshToken,
        });

        // Add client credentials if available from the config or environment
        const clientId = this.config.auth.clientId || process.env.PCO_APP_ID;
        const clientSecret = this.config.auth.clientSecret || process.env.PCO_APP_SECRET;
        
        if (clientId && clientSecret) {
            body.append('client_id', clientId);
            body.append('client_secret', clientSecret);
        }

        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
            },
            body: body.toString(),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Token refresh failed: ${response.status} ${response.statusText}. ${JSON.stringify(errorData)}`);
        }

        const tokens = await response.json();

        // Update the config with new tokens
        this.config.auth.accessToken = tokens.access_token;
        this.config.auth.refreshToken = tokens.refresh_token;

        // Call the onRefresh callback
        await this.config.auth.onRefresh({
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
        });
    }

    private updateRateLimitTracking(endpoint: string, headers: Record<string, string>): void {
        const limit = headers['x-pco-api-request-rate-limit'];
        const remaining = headers['x-pco-api-request-rate-count'];
        const resetTime = headers['retry-after'];

        if (limit && remaining && resetTime) {
            this.rateLimitTracker.update(
                endpoint,
                parseInt(limit),
                parseInt(remaining),
                Date.now() + parseInt(resetTime) * 1000
            );
        }
    }

    getPerformanceMetrics() {
        return this.performanceMetrics.getMetrics();
    }

    getRateLimitInfo() {
        return this.rateLimitTracker.getAllLimits();
    }

    /**
     * Get authentication header for external services (like file uploads).
     * Uses the same auth as the main API so upload.planningcenteronline.com accepts it.
     */
    getAuthHeader(): string {
        if (this.config.auth.type === 'personal_access_token') {
            const clientId = this.config.auth.personalAccessToken;
            const clientSecret = this.config.auth.personalAccessTokenSecret ??
                (typeof process !== 'undefined' && process.env && process.env.PCO_PERSONAL_ACCESS_SECRET);
            if (!clientId || !clientSecret) {
                return '';
            }
            const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
            return `Basic ${credentials}`;
        }
        if (this.config.auth.type === 'oauth') {
            return `Bearer ${this.config.auth.accessToken}`;
        }
        if (this.config.auth.type === 'basic') {
            const credentials = Buffer.from(`${this.config.auth.appId}:${this.config.auth.appSecret}`).toString('base64');
            return `Basic ${credentials}`;
        }
        return '';
    }

    /**
     * Fallback HTTP request method using Node.js https for environments where fetch is broken
     */
    private async makeHttpsRequest(url: string, options: RequestInit): Promise<any> {
        const https = require('https');
        const urlObj = new URL(url);

        const requestOptions = {
            hostname: urlObj.hostname,
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'GET',
            headers: options.headers as Record<string, string> || {},
        };

        return new Promise((resolve, reject) => {
            const req = https.request(requestOptions, (res: any) => {
                let data = '';
                res.on('data', (chunk: Buffer) => data += chunk);
                res.on('end', () => {
                    // Create a response-like object
                    resolve({
                        status: res.statusCode,
                        headers: {
                            get: (name: string) => res.headers[name.toLowerCase()],
                        },
                        text: () => Promise.resolve(data),
                        json: () => Promise.resolve(JSON.parse(data)),
                        ok: res.statusCode >= 200 && res.statusCode < 300,
                    });
                });
            });

            req.on('error', reject);

            if (options.body) {
                req.write(options.body);
            }

            req.end();
        });
    }
}

