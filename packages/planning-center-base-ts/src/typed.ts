/** Type guards at JSON:API boundaries. */

import type { JsonValue, TopLevelLinks, ErrorObject } from './json-api';

/** Values that may be passed to type guards (JSON, API responses, or other objects). */
type AnyValue = JsonValue | undefined | object;

/** Same as AnyValue; used where we expect JsonValue or plain object. */
export type JsonOrUndefined = JsonValue | undefined | object;

/** Type guard: plain object (not null, array, or primitive). */
export function isRecord(x: AnyValue): x is Record<string, JsonValue> {
  return x !== null && x !== undefined && typeof x === 'object' && !Array.isArray(x);
}

/** Assert value is a plain object; throws otherwise. */
export function ensureRecord(x: AnyValue): Record<string, JsonValue> {
  if (!isRecord(x)) throw new Error('Expected JSON object');
  return x;
}

/** Type guard: array of objects (e.g. errors or resource-like items). */
export function isErrorArray(v: JsonValue): v is Array<Record<string, JsonValue>> {
  return Array.isArray(v) && v.every((e) => e !== null && typeof e === 'object' && !Array.isArray(e));
}

/** JSON:API error object (assignable to JsonValue via index signature). */
export function isErrorObject(e: JsonValue): e is ErrorObject {
  return isRecord(e);
}

/** Read optional string from object (for JSON:API meta, links, etc.). */
export function getOptionalString(obj: Record<string, JsonOrUndefined>, key: string): string | undefined {
  const val = obj[key];
  return typeof val === 'string' ? val : undefined;
}

function getUrlFromObject(obj: object): string {
  const url = Reflect.get(obj, 'url');
  return typeof url === 'string' ? url : '';
}

/** Accepts string, URL, Request, or any object (reads url property for objects). */
export function getRequestUrl(input: string | URL | Request | object): string {
  if (input instanceof URL) return input.toString();
  if (typeof input === 'string') return input;
  if (typeof input === 'object' && input !== null) return getUrlFromObject(input);
  return '';
}

/** Set a key on a record (mutates); no-op if record is null/undefined. */
export function setAt(
  record: Record<string, JsonOrUndefined> | null | undefined,
  key: string,
  value: JsonOrUndefined,
): void {
  if (record == null) return;
  record[key] = value;
}

/** Type guard: top-level document with data as array (list response). */
export function hasDataArray(x: Record<string, JsonValue>): x is Record<string, JsonValue> & { data: object[] } {
  return 'data' in x && Array.isArray(x.data);
}

function isPlainObject(x: AnyValue): x is object {
  return x !== null && x !== undefined && typeof x === 'object' && !Array.isArray(x);
}

function hasStringProp(obj: object, key: string): boolean {
  const val = Object.getOwnPropertyDescriptor(obj, key)?.value;
  return typeof val === 'string';
}

/** Type guard: object with string id and type (JSON:API resource or identifier). */
export function isResourceLike(x: JsonOrUndefined): x is Record<string, JsonValue> & { id: string; type: string } {
  return isPlainObject(x) && hasStringProp(x, 'id') && hasStringProp(x, 'type');
}

/** PCO/JSON:API may return id or type as number; normalize to string for parsing. */
function hasIdAndType(obj: object): obj is Record<string, JsonValue> & { id: string | number; type: string | number } {
  const o = obj as Record<string, unknown>;
  return (
    (typeof o.id === 'string' || typeof o.id === 'number') &&
    (typeof o.type === 'string' || typeof o.type === 'number')
  );
}

/**
 * Accept API resource with id/type as string or number; return object with string id and type.
 * Throws if value is not an object with id and type.
 */
export function normalizeToResourceLike(x: JsonOrUndefined): Record<string, JsonValue> & { id: string; type: string } {
  if (!isPlainObject(x) || !hasIdAndType(x)) throw new Error('Expected resource object');
  const id = x.id === undefined ? '' : String(x.id);
  const type = x.type === undefined ? '' : String(x.type);
  return { ...x, id, type } as Record<string, JsonValue> & { id: string; type: string };
}

/** Like normalizeToResourceLike but returns null for invalid values (for filtering lists/included). */
export function normalizeToResourceLikeOrNull(x: JsonOrUndefined): (Record<string, JsonValue> & { id: string; type: string }) | null {
  if (!isPlainObject(x) || !hasIdAndType(x)) return null;
  const id = x.id === undefined ? '' : String(x.id);
  const type = x.type === undefined ? '' : String(x.type);
  return { ...x, id, type } as Record<string, JsonValue> & { id: string; type: string };
}

/** Type guard: object suitable as top-level links (pagination + custom). */
export function isTopLevelLinks(x: JsonOrUndefined): x is TopLevelLinks {
  return isRecord(x);
}
