/**
 * Query options and building. Packages extend ListOptions with strict where/include/order per vertex.
 */

import type { JsonValue } from './json-api';
import { setAt, isRecord } from './typed';

/** Value allowed in where clause (scalar, array, or null). */
export type WhereValue = string | number | boolean | string[] | number[] | undefined | null;

/** Options for list requests: where, include, per_page, page, order, filter. Packages extend with strict include/where/order. */
export interface QueryOptions {
  where?: Record<string, WhereValue> | object;
  include?: string[];
  per_page?: number;
  page?: number;
  order?: string;
  filter?: string[];
}

/** Serialized query params (where[key], include as string, etc.) for HTTP. */
export interface FlatQueryParams {
  include?: string;
  per_page?: number;
  offset?: number;
  page?: number;
  order?: string;
  [key: `where[${string}]`]: string | number | boolean | undefined;
  [key: string]: string | number | boolean | undefined;
}

const KNOWN_KEYS = new Set(['where', 'include', 'per_page', 'page', 'order', 'filter']);

/** Value that may appear in query options (where, filter, or passthrough). */
type ParamValue = JsonValue | undefined | string[] | number[];

function isScalarJsonValue(value: JsonValue): value is string | number | boolean {
  const t = value === null || value === undefined ? null : typeof value;
  return t === 'string' || t === 'number' || t === 'boolean';
}

function asQueryValue(value: WhereValue): string | number | boolean | undefined {
  if (value === undefined || value === null) return undefined;
  if (Array.isArray(value)) return undefined;
  return isScalarJsonValue(value) ? value : undefined;
}

function addWhere(params: QueryOptions | undefined, out: Record<string, string | number | boolean | undefined>): void {
  if (!params?.where || typeof params.where !== 'object') return;
  for (const [k, v] of Object.entries(params.where)) {
    out[`where[${k}]`] = asQueryValue(v);
  }
}

function addInclude(params: QueryOptions | undefined, out: Record<string, string | number | boolean | undefined>): void {
  if (!params?.include?.length) return;
  out.include = params.include.join(',');
}

function setPerPage(params: QueryOptions | undefined, out: Record<string, string | number | boolean | undefined>): void {
  if (params?.per_page == null) return;
  out.per_page = typeof params.per_page === 'number' ? params.per_page : Number(params.per_page);
}

function getPerPage(params: QueryOptions | undefined): number {
  if (params?.per_page == null) return 25;
  return typeof params.per_page === 'number' ? params.per_page : Number(params.per_page) || 25;
}

function setPage(params: QueryOptions | undefined, out: Record<string, string | number | boolean | undefined>): void {
  if (params?.page == null) return;
  const perPage = getPerPage(params);
  const pageNum = Number(params.page);
  out.offset = (pageNum - 1) * perPage;
  out.page = pageNum;
}

function addPagination(params: QueryOptions | undefined, out: Record<string, string | number | boolean | undefined>): void {
  setPerPage(params, out);
  setPage(params, out);
}

function addOrder(params: QueryOptions | undefined, out: Record<string, string | number | boolean | undefined>): void {
  if (params?.order === undefined) return;
  out.order = String(params.order);
}

function hasFilterArray(params: Record<string, ParamValue> | undefined): params is Record<string, ParamValue> & { filter: string[] } {
  return isRecord(params) && 'filter' in params && Array.isArray(params.filter);
}

function addFilter(params: Record<string, ParamValue> | undefined, out: Record<string, string | number | boolean | undefined>): void {
  if (!hasFilterArray(params)) return;
  for (const name of params.filter) {
    if (typeof name === 'string') setAt(out, name, true);
  }
}

function isPrimitive(value: ParamValue): value is string | number | boolean {
  const t = typeof value;
  return t === 'string' || t === 'number' || t === 'boolean';
}

function shouldPassthroughKey(key: string, value: ParamValue): value is string | number | boolean {
  return !KNOWN_KEYS.has(key) && value !== undefined && isPrimitive(value);
}

function addPassthrough(params: Record<string, ParamValue> | undefined, out: Record<string, string | number | boolean | undefined>): void {
  if (!params || typeof params !== 'object') return;
  for (const [key, value] of Object.entries(params)) {
    if (shouldPassthroughKey(key, value)) setAt(out, key, value);
  }
}

/** Build HTTP query params from QueryOptions (where → where[key], include → comma-separated, etc.). */
export function buildQueryParams<T extends QueryOptions = QueryOptions>(params?: T): FlatQueryParams {
  const out: Record<string, string | number | boolean | undefined> = {};
  /* eslint-disable-next-line no-restricted-syntax -- T extends QueryOptions; treat as ParamValue bag for filter/passthrough */
  const p = params as unknown as Record<string, ParamValue> | undefined;
  addWhere(params, out);
  addInclude(params, out);
  addPagination(params, out);
  addOrder(params, out);
  addFilter(p, out);
  addPassthrough(p, out);
  /* eslint-disable-next-line no-restricted-syntax -- out satisfies FlatQueryParams at runtime */
  return out as FlatQueryParams;
}
