/**
 * Resolve + flatten JSON:API responses.
 *
 * API returns data + included with relationships as { data: { type, id } }.
 * - resolveIncluded: replace those refs with full resources from included (keep JSON:API shape).
 * - flattenResource: optional helper to put one resource's attributes + relationship data at top level.
 */
import type { ResourceObject, JsonValue } from './json-api';
import type { FlattenedResourceResult } from './flattened';
import { setAt, isResourceLike, isRecord } from './typed';

type ResourceLike = Record<string, JsonValue> & { id: string; type: string };
type ResourceOrLike = ResourceObject<string, object, object> | ResourceLike;
type FlattenedValue = object | string | number | null | boolean | object[];
type ResourceIdentifier = { type: string; id: string };

function createLookup(included: ResourceOrLike[] | undefined): Map<string, ResourceOrLike> {
  const m = new Map<string, ResourceOrLike>();
  if (!included?.length) return m;
  for (const r of included) {
    if (!isResourceLike(r)) continue;
    m.set(`${r.type}:${r.id}`, r);
  }
  return m;
}

function resolveOneRef(ref: ResourceOrLike | ResourceIdentifier, lookup: Map<string, ResourceOrLike>): ResourceOrLike {
  if (!isResourceLike(ref)) {
    const found = lookup.get(`${ref.type}:${ref.id}`);
    /* eslint-disable-next-line no-restricted-syntax -- ResourceIdentifier returned as ResourceOrLike when not in included */
    return found ? resolveRelationships(found, lookup) : (ref as ResourceOrLike);
  }
  const found = lookup.get(`${ref.type}:${ref.id}`);
  return found ? resolveRelationships(found, lookup) : ref;
}

type RelData = ResourceIdentifier | ResourceIdentifier[] | ResourceOrLike | ResourceOrLike[] | null | undefined;

function resolveRelData(
  data: RelData,
  relCopy: Record<string, JsonValue | object | undefined>,
  key: string,
  origRel: Record<string, JsonValue>,
  lookup: Map<string, ResourceOrLike>,
): void {
  if (Array.isArray(data)) {
    const resolved = data.map((ref) => resolveOneRef(ref, lookup));
    setAt(relCopy, key, { ...origRel, data: resolved });
  } else if (isResourceLike(data)) {
    setAt(relCopy, key, { ...origRel, data: resolveOneRef(data, lookup) });
  }
}

function shouldSkipRel(rel: JsonValue | object): boolean {
  return rel == null || typeof rel !== 'object' || !('data' in rel);
}

function hasDataKey(r: JsonValue): r is Record<string, JsonValue> & { data: JsonValue } {
  return isRecord(r) && 'data' in r;
}

function parseRelData(d: JsonValue): ResourceOrLike[] | ResourceOrLike | null | undefined {
  if (d === undefined) return undefined;
  if (d === null) return null;
  if (Array.isArray(d)) return d.filter((x): x is ResourceLike => isResourceLike(x));
  return isResourceLike(d) ? d : undefined;
}

function getRelDataFromEntry(rel: JsonValue): ResourceOrLike[] | ResourceOrLike | null | undefined {
  if (!hasDataKey(rel)) return undefined;
  return parseRelData(rel.data);
}

function processOneRelationship(
  key: string,
  rel: JsonValue,
  relCopy: Record<string, JsonValue | object | undefined>,
  lookup: Map<string, ResourceOrLike>,
): void {
  if (shouldSkipRel(rel)) return;
  const relObj = isRecord(rel) ? rel : {};
  const relData = getRelDataFromEntry(rel) ?? null;
  resolveRelData(relData, relCopy, key, relObj, lookup);
}

function resolveRelationships(resource: ResourceOrLike, lookup: Map<string, ResourceOrLike>): ResourceOrLike {
  if (!isResourceLike(resource)) return resource;
  const r = resource;
  if (!isRecord(r.relationships)) return r;
  const relCopy: Record<string, JsonValue | object | undefined> = { ...r.relationships };
  for (const [key, rel] of Object.entries(r.relationships)) {
    processOneRelationship(key, rel, relCopy, lookup);
  }
  return { ...r, relationships: relCopy };
}

function flattenRelValue(item: ResourceOrLike | ResourceIdentifier): FlattenedValue {
  if (!isResourceLike(item)) return item;
  return 'attributes' in item ? flattenOne(item) : item;
}

function flattenRelData(d: ResourceOrLike[] | ResourceOrLike | null | undefined): FlattenedValue {
  if (Array.isArray(d)) return d.map((item) => flattenRelValue(item));
  if (isResourceLike(d)) return flattenRelValue(d);
  return null;
}

function getRelData(rel: JsonValue): ResourceOrLike[] | ResourceOrLike | null | undefined {
  return getRelDataFromEntry(rel);
}

/** Accepts relationship maps from JSON:API (data may be ResourceIdentifier or full resource). */
function setFlattenedRels(
  out: Record<string, FlattenedValue> & { type: string; id: string },
  relationships: Record<string, JsonValue> | Record<string, { data?: JsonValue }> | null | undefined,
): void {
  if (relationships == null) return;
  for (const [key, rel] of Object.entries(relationships)) {
    const data = getRelData(rel);
    if (data !== undefined) out[key] = flattenRelData(data);
  }
}

function applyRelationshipsToOut(
  out: Record<string, FlattenedValue> & { type: string; id: string },
  relationships: JsonValue | object | null | undefined,
): void {
  if (relationships == null || typeof relationships !== 'object' || Array.isArray(relationships)) return;
  /* eslint-disable-next-line no-restricted-syntax -- relationships object narrowed to relationship map for setFlattenedRels */
  setFlattenedRels(out, relationships as Record<string, JsonValue>);
}

function flattenOne(resource: ResourceOrLike): FlattenedResourceResult {
  const out: Record<string, FlattenedValue> & { type: string; id: string } = { type: resource.type, id: resource.id };
  if (resource.attributes) Object.assign(out, resource.attributes);
  applyRelationshipsToOut(out, resource.relationships);
  if (resource.links) out.links = resource.links;
  if (resource.meta) out.meta = resource.meta;
  /* eslint-disable-next-line no-restricted-syntax -- out is flat shape; FlattenedResourceResult excludes attributes/relationships/included */
  return out as FlattenedResourceResult;
}

/** Resolve relationship refs from included; returns resources in JSON:API shape with relationship data inlined. */
export function resolveIncluded(
  data: ResourceOrLike[],
  included: ResourceOrLike[] | undefined,
): ResourceOrLike[] {
  const lookup = included?.length ? createLookup(included) : new Map();
  return data.map((r) => resolveRelationships(r, lookup));
}

/** Optional: flatten one resolved resource to top-level attributes + relationship data. Reusable when flat shape is needed. */
export function flattenResource(resource: ResourceOrLike): FlattenedResourceResult {
  return flattenOne(resource);
}

/** Resolve then flatten (for callers that want the flat shape). Prefer resolveIncluded + typed ResourceObject when possible. */
export function mapIncludedToRelationships(
  data: ResourceOrLike[],
  included: ResourceOrLike[] | undefined,
): FlattenedResourceResult[] {
  return resolveIncluded(data, included).map(flattenOne);
}
