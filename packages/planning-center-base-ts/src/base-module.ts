/**
 * Base module for PCO API resources.
 *
 * Provides generic CRUD and list operations over JSON:API. All methods return flattened
 * resources (attributes and relationships at top level). Subclasses (e.g. PeopleModule)
 * pass TOut for their resource types (e.g. PersonResource) and expose typed get/create/update/delete.
 *
 * Response handling is generic: no per-endpoint or per-resource logic. Create responses
 * may be resolved via Location header, single included resource when data is empty, or
 * last item from a follow-up list GET when the API returns empty data.
 */

import type { PcoClientConfig, PcoDebugOptions } from './config';
import type { PcoHttpClient } from './http-client';
import type { PaginationHelper } from './pagination';
import type { PaginationResult, GetAllPagesOptions, PaginationOptions } from './pagination';
import type { Meta, TopLevelLinks, JsonValue } from './json-api';
import type { FlattenedResourceResult } from './flattened';
import { mapIncludedToRelationships } from './included-resolver';
import { buildQueryParams, type QueryOptions } from './query-params';
import { createDebugLogger } from './debug';
import { hasDataArray, isRecord, isTopLevelLinks, normalizeToResourceLikeOrNull } from './typed';

function isObjectWithTypeId(val: JsonValue): val is Record<string, JsonValue> {
  return Boolean(val && typeof val === 'object' && !Array.isArray(val));
}

function itemTypeId(item: JsonValue): string {
  if (!isObjectWithTypeId(item)) return '?:?';
  return `${String(item.type ?? '?')}:${String(item.id ?? '?')}`;
}

function shapeForArray(dataVal: JsonValue[]): { shape: string; items?: string[] } {
  const items = dataVal.slice(0, 10).map(itemTypeId);
  return { shape: `array[${dataVal.length}]`, items };
}

function shapeForObject(dataVal: Record<string, JsonValue>): { shape: string } {
  return { shape: `object{type:${String(dataVal.type)},id:${String(dataVal.id)}}` };
}

function dataShapeSummary(dataVal: JsonValue | undefined): { shape: string; items?: string[] } {
  if (dataVal === undefined) return { shape: 'missing' };
  if (Array.isArray(dataVal)) return shapeForArray(dataVal);
  if (isObjectWithTypeId(dataVal)) return shapeForObject(dataVal);
  return { shape: String(typeof dataVal) };
}

function truncateLocation(location: string, maxLen: number): string {
  return location.length > maxLen ? `${location.slice(0, maxLen)}...` : location;
}

function getIncludedCount(data: Record<string, JsonValue> | undefined): number {
  const inc = data?.included;
  return Array.isArray(inc) ? (inc.length ?? 0) : 0;
}

function getDebugFromConfig(config: PcoClientConfig): PcoDebugOptions | undefined {
  const debug = config.debug;
  return typeof debug === 'object' && debug !== null ? debug : undefined;
}

function getDebugOpts(getConfig: (() => PcoClientConfig) | undefined): PcoDebugOptions | undefined {
  const config = getConfig?.();
  if (!config || typeof config !== 'object' || !('debug' in config)) return undefined;
  return getDebugFromConfig(config);
}

function buildShapeSummaryOut(
  label: string,
  status: number,
  topKeys: string[],
  dataShape: string,
  includedCount: number,
  location: string | null,
  dataItems?: string[],
): Record<string, JsonValue> {
  const out: Record<string, JsonValue> = {
    label,
    status,
    topLevelKeys: topKeys,
    dataShape,
    includedCount,
    location,
  };
  if (dataItems?.length) out.dataItems = dataItems;
  return out;
}

function getTopKeys(data: Record<string, JsonValue> | undefined): string[] {
  return data ? Object.keys(data) : [];
}

function getRawLocationHeader(headers: Record<string, string> | undefined): string | null {
  if (!headers) return null;
  const loc = headers.location ?? headers.Location;
  return typeof loc === 'string' && loc.length > 0 ? loc : null;
}

function getLocationForSummary(headers: Record<string, string> | undefined): string | null {
  const raw = getRawLocationHeader(headers);
  return raw ? truncateLocation(raw, 60) : null;
}

/** Summarize JSON:API response shape for debugging (data array vs object, length, Location header). */
function summarizeResponseShape(
  res: { status: number; data?: Record<string, JsonValue>; headers?: Record<string, string> },
  label: string,
): object {
  const topKeys = getTopKeys(res.data);
  const { shape: dataShape, items: dataItems } = dataShapeSummary(res.data?.data);
  const location = getLocationForSummary(res.headers);
  const includedCount = getIncludedCount(res.data);
  return buildShapeSummaryOut(label, res.status, topKeys, dataShape, includedCount, location, dataItems);
}

// ---------------------------------------------------------------------------
// Typed result helpers (generic TOut vs runtime FlattenedResourceResult)
// ---------------------------------------------------------------------------

/** Passthrough for generic TOut (e.g. PersonResource); runtime is FlattenedResourceResult. */
function asTypedResult<TOut>(value: FlattenedResourceResult): TOut {
  // eslint-disable-next-line no-restricted-syntax -- generic passthrough; TOut is caller's resource type
  return value as TOut;
}

/** Passthrough for TOut[]; runtime is FlattenedResourceResult[]. */
function asTypedResultArray<TOut>(value: FlattenedResourceResult[]): TOut[] {
  // eslint-disable-next-line no-restricted-syntax -- generic passthrough; TOut is caller's resource type
  return value as TOut[];
}

// ---------------------------------------------------------------------------
// Public option types
// ---------------------------------------------------------------------------

/** Options for getSingle (include only). */
export type GetSingleOptions = Pick<QueryOptions, 'include'>;

/** Options for create/update (include only). */
export type CreateUpdateOptions = Pick<QueryOptions, 'include'>;

/** Options for delete. */
export type DeleteOptions = Pick<QueryOptions, 'include'>;

/**
 * Response shape for create: mirrors the JSON:API document. The API may return a single resource
 * in `data` or a collection (array with meta/links). We return what the API returned, typed.
 */
export type CreateResponse<TOut> = {
  data: TOut | TOut[];
  meta?: Meta;
  links?: TopLevelLinks;
};

/**
 * Get a single resource from a create response. When the API returned an array, returns the last
 * element (caller may use this as a heuristic when the API does not return a single resource).
 * Use the full CreateResponse when you need to respect the actual API shape.
 */
export function singleFromCreateResponse<TOut>(res: CreateResponse<TOut>): TOut | undefined {
  const d = res.data;
  if (Array.isArray(d)) return d.length > 0 ? d[d.length - 1] : undefined;
  return d;
}

/** List options + pagination for getAllPages. per_page/page are not accepted (always uses 100 per page). */
export type GetAllPagesOptionsFor<T extends QueryOptions> = Omit<T, 'per_page' | 'page'> & PaginationOptions;

// ---------------------------------------------------------------------------
// Small HTTP/response helpers (keep complexity low for eslint)
// ---------------------------------------------------------------------------

function is2xx(status: number): boolean {
  return status >= 200 && status < 300;
}

function isNonEmptyString(value: string | undefined): value is string {
  return typeof value === 'string' && value.length > 0;
}

function getLocationHeaderValue(headers: Record<string, string> | undefined): string | undefined {
  if (!headers) return undefined;
  const loc = headers.location ?? headers.Location;
  return isNonEmptyString(loc) ? loc : undefined;
}

/** Returns Location header if response is 2xx and header is present; else null. */
function getLocationHeaderFromResponse(res: {
  status: number;
  headers?: Record<string, string>;
}): string | null {
  if (!is2xx(res.status)) return null;
  const loc = getLocationHeaderValue(res.headers);
  return loc ?? null;
}

// ---------------------------------------------------------------------------
// JSON:API document parsing helpers
// ---------------------------------------------------------------------------

type ResourceLike = Record<string, JsonValue> & { id: string; type: string };

/** Normalize one included item to ResourceLike or null; used to keep getIncluded complexity low. */
function normalizeIncludedItem(x: JsonValue): ResourceLike | null {
  return normalizeToResourceLikeOrNull(x);
}

/** Extract and normalize the top-level `included` array from a JSON:API document. */
function getIncluded(doc: Record<string, JsonValue>): ResourceLike[] | undefined {
  if (!('included' in doc) || !Array.isArray(doc.included)) return undefined;
  const out = doc.included.map(normalizeIncludedItem).filter((n): n is ResourceLike => n != null);
  return out.length ? out : undefined;
}

const ACTION_SEGMENTS = new Set(['go_back', 'snooze', 'unsnooze', 'promote', 'remove', 'restore', 'skip_step', 'send_email']);

/** True if the last path segment is a known action (e.g. snooze, restore). */
function isActionEndpoint(segments: string[]): boolean {
  const last = segments[segments.length - 1];
  return Boolean(last && ACTION_SEGMENTS.has(last) && segments.length >= 2);
}

/** Build a minimal resource { type, id } from collection name and id segment. */
function buildMinimalResource(collection: string, id: string): ResourceLike {
  const base = collection.endsWith('s') ? collection.slice(0, -1) : collection;
  const typeName = base.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('') || 'Resource';
  return { type: typeName, id: String(id) };
}

/**
 * Infer type and id from an action subpath (e.g. /people/1/workflow_cards/2/snooze → WorkflowCard id 2).
 * Returns null if the endpoint is not an action or segments are insufficient.
 */
function inferMinimalResourceFromEndpoint(endpoint: string): ResourceLike | null {
  const segments = endpoint.replace(/^\//, '').split('/').filter(Boolean);
  if (!isActionEndpoint(segments)) return null;
  const id = segments[segments.length - 2];
  const collection = segments[segments.length - 3];
  if (!id || !collection) return null;
  return buildMinimalResource(collection, id);
}

/** Options for single-resource parsing when the API returns an array (e.g. create returns [resource]). */
export type SingleDataFromDocOptions = {
  /** When true, use the last element in the array (e.g. for create responses). Default: use first. */
  preferLastElementInArray?: boolean;
};

/** When doc has no `data`, throw or return minimal resource for action endpoints (2xx). */
function singleDataFromDocWhenMissing(
  endpoint: string,
  status: number,
): ResourceLike {
  if (status >= 200 && status < 300) {
    const minimal = inferMinimalResourceFromEndpoint(endpoint);
    if (minimal) return minimal;
  }
  throw new Error(`Expected single-resource response at ${endpoint}. Status: ${status}`);
}

/** For 2xx action endpoints that return empty data array, return minimal resource from URL; else null. */
function singleDataFromEmptyArrayForAction(endpoint: string, status: number): ResourceLike | null {
  if (status < 200 || status >= 300) return null;
  return inferMinimalResourceFromEndpoint(endpoint);
}

function getSingleElementFromArray(raw: JsonValue[], preferLast: boolean): JsonValue {
  const index = preferLast ? raw.length - 1 : 0;
  const el = raw[index];
  return el ?? null;
}

function normalizeElementOrThrow(element: JsonValue | null, endpoint: string, status: number): ResourceLike {
  const normalized = normalizeToResourceLikeOrNull(element);
  if (!normalized) {
    throw new Error(`Expected resource object at ${endpoint}. Status: ${status}. Invalid element in data array.`);
  }
  return normalized;
}

/** When doc.data is an array, return first or last element (normalized). */
function singleDataFromDocFromArray(
  raw: JsonValue[],
  endpoint: string,
  status: number,
  options?: SingleDataFromDocOptions,
): ResourceLike {
  if (raw.length === 0) {
    const minimal = singleDataFromEmptyArrayForAction(endpoint, status);
    if (minimal) return minimal;
    throw new Error(`Expected single-resource response at ${endpoint}. Status: ${status}. Got empty data array.`);
  }
  const element = getSingleElementFromArray(raw, options?.preferLastElementInArray ?? false);
  return normalizeElementOrThrow(element, endpoint, status);
}

/** If value is an object with a "data" property that looks like a resource, return it; else return null. */
function unwrapSingleData(raw: JsonValue): ResourceLike | null {
  if (!isRecord(raw)) return null;
  const inner = raw.data;
  return normalizeToResourceLikeOrNull(inner) ?? null;
}

function singleDataFromDocObject(
  raw: JsonValue,
  endpoint: string,
  status: number,
): ResourceLike {
  const normalized = normalizeToResourceLikeOrNull(raw) ?? unwrapSingleData(raw);
  if (normalized) return normalized;
  const keys = isRecord(raw) ? Object.keys(raw).join(',') : typeof raw;
  throw new Error(
    `Expected resource object at ${endpoint}. Status: ${status}. Data has no top-level id/type (keys: ${keys}).`,
  );
}

/**
 * Some PCO endpoints return { data: [resource] } instead of { data: resource }; use first element
 * by default, or last when preferLastElementInArray. Action endpoints may return 200 with no data.
 */
function singleDataFromDoc(
  doc: Record<string, JsonValue>,
  endpoint: string,
  status: number,
  options?: SingleDataFromDocOptions,
): ResourceLike {
  if (!('data' in doc)) return singleDataFromDocWhenMissing(endpoint, status);
  const raw = doc.data;
  if (Array.isArray(raw)) return singleDataFromDocFromArray(raw, endpoint, status, options);
  return singleDataFromDocObject(raw, endpoint, status);
}

/** Parse one resource from a JSON:API doc and flatten with included. */
function parseSingleFromDoc(
  doc: Record<string, JsonValue>,
  endpoint: string,
  status: number,
  options?: SingleDataFromDocOptions,
): FlattenedResourceResult {
  const single = singleDataFromDoc(doc, endpoint, status, options);
  const included = getIncluded(doc);
  const [mapped] = mapIncludedToRelationships([single], included);
  if (!mapped) throw new Error('Expected one resource');
  return mapped;
}

/** Normalize data array to ResourceLike[] (filters out invalid entries). */
function normalizedDataArray(doc: Record<string, JsonValue>): ResourceLike[] {
  if (!hasDataArray(doc)) return [];
  return doc.data.map((x) => normalizeToResourceLikeOrNull(x)).filter((n): n is ResourceLike => n != null);
}

/** Parse list from a JSON:API doc; returns flattened data, meta, and links. */
function parseListFromDoc(doc: Record<string, JsonValue>): { data: FlattenedResourceResult[]; meta?: Meta; links?: TopLevelLinks } {
  const dataArray = normalizedDataArray(doc);
  const included = getIncluded(doc);
  const mapped = mapIncludedToRelationships(dataArray, included);
  const meta = isRecord(doc.meta) ? doc.meta : undefined;
  const links = isTopLevelLinks(doc.links) ? doc.links : undefined;
  return { data: mapped, meta, links };
}

/**
 * Abstract base for PCO API resource modules. Subclasses implement per-resource endpoints
 * and use getSingle/getList/createResource/updateResource/deleteResource/getAllPages.
 */
export abstract class BaseModule {
  constructor(
    protected httpClient: PcoHttpClient,
    protected paginationHelper: PaginationHelper,
    protected getConfig?: () => PcoClientConfig,
  ) {}

  /** Log a message and optional data when debug logging is enabled via config. */
  protected debugLog(message: string, data?: object): void {
    const logger = createDebugLogger(this.getConfig?.());
    if (logger.enabled) logger.log(message, data ?? {});
  }

  /** Log a payload (e.g. response body) only when debug.includePayloads is true; use for debugging API response shape. */
  protected debugLogPayload(message: string, payload: Record<string, JsonValue> | undefined): void {
    if (!this.shouldLogPayloads()) return;
    const logger = createDebugLogger(this.getConfig?.());
    if (logger.enabled) logger.log(message, payload ?? {});
  }

  private shouldLogPayloads(): boolean {
    const debugOpts = getDebugOpts(this.getConfig);
    return typeof debugOpts === 'object' && debugOpts !== null && debugOpts.includePayloads === true;
  }

  /**
   * GET a single resource. Pass TOut for your flattened type (e.g. PersonResource); omit for FlattenedResourceResult.
   */
  protected async getSingle<TOut = FlattenedResourceResult>(
    endpoint: string,
    options?: GetSingleOptions,
  ): Promise<TOut> {
    const params = buildQueryParams(options);
    this.debugLog(`GET ${endpoint}`, { params });
    const res = await this.httpClient.request<Record<string, JsonValue>>({ method: 'GET', endpoint, params });
    if (!isRecord(res.data)) throw new Error('Expected JSON object');
    const result = parseSingleFromDoc(res.data, endpoint, res.status);
    return asTypedResult<TOut>(result);
  }

  /**
   * GET a list of resources (one page). Pass TOut for your flattened item type; omit for FlattenedResourceResult[].
   */
  protected async getList<TOut = FlattenedResourceResult, TOptions extends QueryOptions = QueryOptions>(
    endpoint: string,
    options?: TOptions,
  ): Promise<{ data: TOut[]; meta?: Meta; links?: TopLevelLinks }> {
    const params = buildQueryParams(options);
    this.debugLog(`GET ${endpoint}`, { params });
    const res = await this.httpClient.request<Record<string, JsonValue>>({ method: 'GET', endpoint, params });
    if (!isRecord(res.data)) return { data: [] };
    const { data, meta, links } = parseListFromDoc(res.data);
    return { data: asTypedResultArray<TOut>(data), meta, links };
  }

  /**
   * POST to create a resource. Returns the JSON:API response document as returned by the API:
   * `data` may be a single resource or a collection (array) with optional `meta` and `links`.
   * Resolves single resource via Location header or single included when data is empty; otherwise
   * parses response body as-is (single object, or array with meta/links).
   */
  protected async createResource<
    TOut = FlattenedResourceResult,
    TBody extends Record<string, JsonValue> | object = Record<string, JsonValue> | object,
  >(
    endpoint: string,
    data: TBody,
    options?: CreateUpdateOptions,
  ): Promise<CreateResponse<TOut>> {
    const params = buildQueryParams(options);
    this.debugLog(`POST ${endpoint}`, { params });
    const res = await this.httpClient.request<Record<string, JsonValue>>({ method: 'POST', endpoint, data, params });
    if (!isRecord(res.data)) throw new Error(`Create failed at ${endpoint}. Status: ${res.status}`);

    this.debugLog(`POST ${endpoint} response shape`, summarizeResponseShape(res, 'create'));
    this.debugLogPayload(`POST ${endpoint} response body`, res.data);

    const fromLocation = await this.tryCreateResultFromLocation<TOut>(res, endpoint);
    if (fromLocation != null) return { data: fromLocation };

    const fromEmptyData = await this.tryCreateResultFromEmptyData<TOut>(res, endpoint);
    if (fromEmptyData != null) return { data: fromEmptyData };

    return this.parseCreateResponseBody<TOut>(res.data, endpoint, res.status);
  }

  /** Parse response body for create: list (data array length > 1) or single resource. */
  private parseCreateResponseBody<TOut>(
    doc: Record<string, JsonValue>,
    endpoint: string,
    status: number,
  ): CreateResponse<TOut> {
    if (hasDataArray(doc) && doc.data.length > 1) {
      const { data: listData, meta, links } = parseListFromDoc(doc);
      this.debugLog(`POST ${endpoint} result (list)`, { count: listData.length });
      return { data: asTypedResultArray<TOut>(listData), meta, links };
    }
    const single = parseSingleFromDoc(doc, endpoint, status, { preferLastElementInArray: true });
    this.debugLog(`POST ${endpoint} result`, { id: single.id });
    return { data: asTypedResult<TOut>(single) };
  }

  /** If response has a Location header and GET succeeds, return the parsed resource; else null. */
  private async tryCreateResultFromLocation<TOut>(
    res: { status: number; headers?: Record<string, string> },
    endpoint: string,
  ): Promise<TOut | null> {
    const location = this.getLocationHeader(res);
    if (location == null) return null;
    const parsed = await this.getAndParseFromEndpoint(this.locationToEndpoint(location));
    if (parsed == null) return null;
    this.debugLog(`POST ${endpoint} result (from Location)`, { id: parsed.id });
    return asTypedResult<TOut>(parsed);
  }

  /** Returns Location header value if status is 2xx and header is present; otherwise null. */
  private getLocationHeader(res: { status: number; headers?: Record<string, string> }): string | null {
    return getLocationHeaderFromResponse(res);
  }

  private locationToEndpoint(location: string): string {
    return location.startsWith('http') ? location : new URL(location, 'https://api.planningcenteronline.com').pathname;
  }

  private async getAndParseFromEndpoint(getEndpoint: string): Promise<FlattenedResourceResult | null> {
    const getRes = await this.httpClient.request<Record<string, JsonValue>>({ method: 'GET', endpoint: getEndpoint });
    if (!isRecord(getRes.data)) return null;
    return parseSingleFromDoc(getRes.data, getEndpoint, getRes.status);
  }

  /**
   * When create returned 2xx with empty data array: use single included resource, or last item
   * from a follow-up list GET. Returns null if data is not empty; throws if empty and unrecoverable.
   */
  private async tryCreateResultFromEmptyData<TOut>(
    res: { status: number; data: Record<string, JsonValue> },
    endpoint: string,
  ): Promise<TOut | null> {
    if (!this.isEmptyDataCreateResponse(res)) return null;
    const fromIncluded = this.createResultFromSingleIncluded<TOut>(res.data, endpoint);
    if (fromIncluded != null) return fromIncluded;
    const fromList = await this.createResultFromListFallback<TOut>(endpoint);
    if (fromList != null) return fromList;
    throw new Error(
      `Create at ${endpoint} returned empty data array and could not determine created resource (no Location, no single included, empty list).`,
    );
  }

  private isEmptyDataCreateResponse(res: { status: number; data: Record<string, JsonValue> }): boolean {
    const dataArray = res.data?.data;
    const isEmpty = Array.isArray(dataArray) && dataArray.length === 0;
    return isEmpty && res.status >= 200 && res.status < 300;
  }

  private createResultFromSingleIncluded<TOut>(data: Record<string, JsonValue>, endpoint: string): TOut | null {
    const one = this.getSingleIncludedResource(data);
    if (one == null) return null;
    const [mapped] = mapIncludedToRelationships([one], getIncluded(data));
    if (!mapped) return null;
    this.debugLog(`POST ${endpoint} result (from included)`, { id: mapped.id });
    return asTypedResult<TOut>(mapped);
  }

  /** If doc has exactly one included resource, return it normalized; else null. */
  private getSingleIncludedResource(data: Record<string, JsonValue>): ResourceLike | null {
    const included = Array.isArray(data?.included) ? data.included : [];
    return included.length === 1 ? normalizeToResourceLikeOrNull(included[0]) : null;
  }

  private async createResultFromListFallback<TOut>(endpoint: string): Promise<TOut | null> {
    const list = await this.getList<FlattenedResourceResult>(endpoint, { per_page: 25 });
    const last = list.data.at(-1);
    if (last == null) return null;
    this.debugLog(`POST ${endpoint} result (from list after empty response)`, { id: last.id });
    return asTypedResult<TOut>(last);
  }

  /** PATCH to update a resource; returns the parsed response body as a flattened resource. */
  protected async updateResource<
    TOut = FlattenedResourceResult,
    TBody extends Record<string, JsonValue> | object = Record<string, JsonValue> | object,
  >(
    endpoint: string,
    data: TBody,
    options?: CreateUpdateOptions,
  ): Promise<TOut> {
    const params = buildQueryParams(options);
    this.debugLog(`PATCH ${endpoint}`, { params });
    const res = await this.httpClient.request<Record<string, JsonValue>>({ method: 'PATCH', endpoint, data, params });
    if (!isRecord(res.data)) throw new Error(`Update failed at ${endpoint}. Status: ${res.status}`);

    this.debugLog(`PATCH ${endpoint} response shape`, summarizeResponseShape(res, 'update'));
    this.debugLogPayload(`PATCH ${endpoint} response body`, res.data);

    const result = parseSingleFromDoc(res.data, endpoint, res.status);
    return asTypedResult<TOut>(result);
  }

  /** DELETE a resource. No response body is parsed. */
  protected async deleteResource(endpoint: string, options?: DeleteOptions): Promise<void> {
    const params = buildQueryParams(options);
    this.debugLog(`DELETE ${endpoint}`, { params });
    await this.httpClient.request({ method: 'DELETE', endpoint, params });
  }

  /**
   * GET all pages of a collection. Pass TOut for your flattened item type; omit for FlattenedResourceResult[].
   */
  protected async getAllPages<TOut = FlattenedResourceResult, TOptions extends QueryOptions = QueryOptions>(
    endpoint: string,
    options?: GetAllPagesOptionsFor<TOptions>,
  ): Promise<PaginationResult<TOut>> {
    this.debugLog(`GET ${endpoint} (all pages)`, {});
    const paginationOptions: GetAllPagesOptions = options ?? {};
    const result = await this.paginationHelper.getAllPages(endpoint, paginationOptions);
    return { ...result, data: asTypedResultArray<TOut>(result.data) };
  }
}
