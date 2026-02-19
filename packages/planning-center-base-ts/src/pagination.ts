import type { PcoClientConfig } from './config';
import type { PcoHttpClient } from './http-client';
import type { ResourceObject, Meta, TopLevelLinks, JsonValue } from './json-api';
import type { FlattenedResourceResult } from './flattened';
import { mapIncludedToRelationships } from './included-resolver';
import { buildQueryParams, type QueryOptions, type FlatQueryParams } from './query-params';
import { createDebugLogger } from './debug';
import { isRecord, isResourceLike, isTopLevelLinks } from './typed';

/** Options for getAllPages: cap on pages, progress callback, delay between pages. */
export interface PaginationOptions {
  maxPages?: number;
  onProgress?: (current: number, total: number) => void;
  delay?: number;
}

/** Options for getAllPages. Fetches all pages using max per_page (100); per_page and page are not accepted. */
export type GetAllPagesOptions = Omit<QueryOptions, 'per_page' | 'page'> & PaginationOptions;

/** Result of getAllPages: flattened data array, totalCount from meta, pagesFetched, duration, last page meta/links. */
export interface PaginationResult<T = FlattenedResourceResult> {
  data: T[];
  totalCount: number;
  pagesFetched: number;
  duration: number;
  meta?: Meta;
  links?: TopLevelLinks;
}

function extractPageData(doc: Record<string, JsonValue>): ResourceObject<string, object, object>[] {
  const data = doc.data;
  if (!Array.isArray(data)) return [];
  const filtered = data.filter((item) => isResourceLike(item));
  /* eslint-disable-next-line no-restricted-syntax, @typescript-eslint/no-restricted-types -- JSON:API data array; filter yields resource-like; double cast required */
  return filtered as unknown as ResourceObject<string, object, object>[];
}

function mergeIncluded(doc: Record<string, JsonValue>, includedMap: Map<string, ResourceObject<string, object, object>>): void {
  const included = doc.included;
  if (!Array.isArray(included)) return;
  for (const inc of included) {
    if (!isResourceLike(inc)) continue;
    const key = `${inc.type}:${inc.id}`;
    if (!includedMap.has(key)) includedMap.set(key, inc);
  }
}

function getTotalCount(doc: Record<string, JsonValue>): number {
  const meta = doc.meta;
  if (!isRecord(meta) || typeof meta.total_count === 'undefined') return 0;
  return Number(meta.total_count) || 0;
}

function getNextLink(doc: Record<string, JsonValue>): string | undefined {
  const links = doc.links;
  if (!isRecord(links) || typeof links.next !== 'string') return undefined;
  return links.next;
}

function parseOffsetFromNext(nextLink: string): number | null {
  const m = nextLink.match(/offset=(\d+)/);
  if (!m?.[1]) return null;
  return parseInt(m[1], 10);
}

function buildPageParams(
  rest: Omit<GetAllPagesOptions, 'maxPages' | 'onProgress' | 'delay'>,
  perPage: number,
  page: number,
  useOffset: boolean,
  offset: number | null,
): FlatQueryParams {
  const params = buildQueryParams({ ...rest, per_page: perPage, page });
  if (useOffset && offset !== null) params.offset = offset;
  else params.page = page;
  return params;
}

interface PageFetchResult {
  pageData: ResourceObject<string, object, object>[];
  nextLink: string | undefined;
  totalCount: number;
  meta: Meta | undefined;
  links: TopLevelLinks | undefined;
}

function getMetaFromDoc(doc: Record<string, JsonValue>): Meta | undefined {
  return isRecord(doc.meta) ? doc.meta : undefined;
}

function getLinksFromDoc(doc: Record<string, JsonValue>): TopLevelLinks | undefined {
  return isTopLevelLinks(doc.links) ? doc.links : undefined;
}

function pageFetchResultFromDoc(doc: Record<string, JsonValue> | null): PageFetchResult {
  if (!doc) {
    return { pageData: [], nextLink: undefined, totalCount: 0, meta: undefined, links: undefined };
  }
  return {
    pageData: extractPageData(doc),
    nextLink: getNextLink(doc),
    totalCount: getTotalCount(doc),
    meta: getMetaFromDoc(doc),
    links: getLinksFromDoc(doc),
  };
}

async function fetchOnePage(
  httpClient: PcoHttpClient,
  endpoint: string,
  params: FlatQueryParams,
  includedMap: Map<string, ResourceObject<string, object, object>>,
): Promise<PageFetchResult> {
  const res = await httpClient.request({ method: 'GET', endpoint, params });
  const doc: Record<string, JsonValue> | null = isRecord(res.data) ? res.data : null;
  const result = pageFetchResultFromDoc(doc);
  if (doc) mergeIncluded(doc, includedMap);
  return result;
}

interface NextPageState {
  offset: number | null;
  page: number;
  useOffset: boolean;
  hasMore: boolean;
}

function useOffsetPagination(nextLink: string | undefined, current: boolean): boolean {
  return current || (typeof nextLink === 'string' && nextLink.includes('offset='));
}

function parseNextOffset(nextLink: string | undefined, useOffset: boolean, currentOffset: number | null): { nextOffset: number | null; hasMore: boolean } {
  if (!nextLink || !useOffset) return { nextOffset: currentOffset, hasMore: false };
  const parsed = parseOffsetFromNext(nextLink);
  return { nextOffset: parsed ?? currentOffset, hasMore: parsed !== null };
}

function computeNextPageState(
  nextLink: string | undefined,
  useOffset: boolean,
  offset: number | null,
  page: number,
): NextPageState {
  const nextUseOffset = useOffsetPagination(nextLink, useOffset);
  const { nextOffset, hasMore: stillHasMore } = parseNextOffset(nextLink, nextUseOffset, offset);
  const nextPage = nextUseOffset ? page : page + 1;
  const hasMore = !!nextLink && (!nextUseOffset || stillHasMore);
  return { offset: nextOffset, page: nextPage, useOffset: nextUseOffset, hasMore };
}

interface PageLoopState {
  page: number;
  offset: number | null;
  useOffset: boolean;
  hasMore: boolean;
  allData: ResourceObject<string, object, object>[];
  totalCount: number;
  lastMeta: Meta | undefined;
  lastLinks: TopLevelLinks | undefined;
}

function initialPageLoopState(): PageLoopState {
  return {
    page: 1,
    offset: null,
    useOffset: false,
    hasMore: true,
    allData: [],
    totalCount: 0,
    lastMeta: undefined,
    lastLinks: undefined,
  };
}

function buildFlattenedData(
  allData: ResourceObject<string, object, object>[],
  includedMap: Map<string, ResourceObject<string, object, object>>,
): FlattenedResourceResult[] {
  const included = includedMap.size ? Array.from(includedMap.values()) : undefined;
  return mapIncludedToRelationships(allData, included);
}

function buildPaginationResult(
  data: FlattenedResourceResult[],
  state: PageLoopState,
  startTime: number,
): PaginationResult<FlattenedResourceResult> {
  return {
    data,
    totalCount: state.totalCount,
    pagesFetched: state.page - 1,
    duration: Date.now() - startTime,
    meta: state.lastMeta,
    links: state.lastLinks,
  };
}

function logGetAllPagesStart(
  logger: { enabled: boolean; log: (msg: string, data: object) => void },
  endpoint: string,
  maxPages: number,
  perPage: number,
): void {
  if (logger.enabled) logger.log('getAllPages start', { endpoint, maxPages, per_page: perPage });
}

function logGetAllPagesDone(
  logger: { enabled: boolean; log: (msg: string, data: object) => void },
  endpoint: string,
  count: number,
  startTime: number,
): void {
  if (logger.enabled) logger.log('getAllPages done', { endpoint, count, duration: Date.now() - startTime });
}

async function runPageLoop(
  httpClient: PcoHttpClient,
  endpoint: string,
  rest: Omit<GetAllPagesOptions, 'maxPages' | 'onProgress' | 'delay'>,
  perPage: number,
  maxPages: number,
  delay: number,
  onProgress: ((current: number, total: number) => void) | undefined,
): Promise<{ state: PageLoopState; includedMap: Map<string, ResourceObject<string, object, object>> }> {
  const includedMap = new Map<string, ResourceObject<string, object, object>>();
  let state = initialPageLoopState();
  while (state.hasMore && state.page <= maxPages) {
    state = await processOnePage(httpClient, endpoint, rest, perPage, includedMap, state, delay, onProgress);
  }
  return { state, includedMap };
}

function appendPageData(
  allData: ResourceObject<string, object, object>[],
  pageData: ResourceObject<string, object, object>[],
): void {
  for (const item of pageData) allData.push(item);
}

async function maybeDelay(hasMore: boolean, delayMs: number): Promise<void> {
  if (hasMore && delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
}

async function processOnePage(
  httpClient: PcoHttpClient,
  endpoint: string,
  rest: Omit<GetAllPagesOptions, 'maxPages' | 'onProgress' | 'delay'>,
  perPage: number,
  includedMap: Map<string, ResourceObject<string, object, object>>,
  state: PageLoopState,
  delay: number,
  onProgress: ((current: number, total: number) => void) | undefined,
): Promise<PageLoopState> {
  const params = buildPageParams(rest, perPage, state.page, state.useOffset, state.offset);
  const result = await fetchOnePage(httpClient, endpoint, params, includedMap);
  appendPageData(state.allData, result.pageData);
  const next = computeNextPageState(result.nextLink, state.useOffset, state.offset, state.page);
  const newState: PageLoopState = {
    page: next.page,
    offset: next.offset,
    useOffset: next.useOffset,
    hasMore: next.hasMore,
    allData: state.allData,
    totalCount: result.totalCount,
    lastMeta: result.meta,
    lastLinks: result.links,
  };
  if (onProgress) onProgress(newState.allData.length, newState.totalCount || newState.allData.length);
  await maybeDelay(newState.hasMore, delay);
  return newState;
}

/**
 * Fetches all pages of a JSON:API list endpoint with a fixed per_page (100), merging data and
 * included. Used by BaseModule.getAllPages; typically you use module.getAll() or module.getPage()
 * rather than calling this directly.
 */
export class PaginationHelper {
  constructor(
    private httpClient: PcoHttpClient,
    private getConfig?: () => PcoClientConfig,
  ) {}

  /** Fetch every page of the collection and return flattened data, totalCount, and meta/links from the last page. */
  async getAllPages(
    endpoint: string,
    options: GetAllPagesOptions = {},
  ): Promise<PaginationResult<FlattenedResourceResult>> {
    const { maxPages = 1000, delay = 50, onProgress, ...rest } = options;
    const per_page = 100;
    const start = Date.now();
    const logger = createDebugLogger(this.getConfig?.());
    logGetAllPagesStart(logger, endpoint, maxPages, per_page);

    const { state, includedMap } = await runPageLoop(
      this.httpClient,
      endpoint,
      rest,
      per_page,
      maxPages,
      delay,
      onProgress,
    );

    const data = buildFlattenedData(state.allData, includedMap);
    logGetAllPagesDone(logger, endpoint, data.length, start);
    return buildPaginationResult(data, state, start);
  }
}
