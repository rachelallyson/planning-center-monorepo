/**
 * Type Validation Helpers for Integration Tests
 *
 * These functions validate that actual PCO API responses match our TypeScript type definitions
 */

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

type ResourceLike = Record<string, JsonValue> & { type: string; id: string };
export type AttributesLike = Record<string, JsonValue>;

export function isAttributesLike(obj: object | null): obj is AttributesLike {
  return obj !== null && typeof obj === 'object';
}

type RelDataItem = Record<string, JsonValue> & { type: string; id: string };
type RelationshipLike = { data: null | RelDataItem | RelDataItem[] };
export type PaginationLinksLike = { self: string; next?: string | null; prev?: string | null };
export type PaginationMetaLike = { count: number; total_count: number };

export function isPaginationLinks(obj: object | null | undefined): obj is PaginationLinksLike {
  return obj != null && typeof obj === 'object' && 'self' in obj;
}
export function isPaginationMeta(obj: object | null | undefined): obj is PaginationMetaLike {
  return obj != null && typeof obj === 'object' && 'count' in obj && 'total_count' in obj;
}

/**
 * Validates basic resource structure (type, id)
 */
export function validateResourceStructure(
  resource: ResourceLike,
  expectedType: string,
  context = 'resource'
) {
  expect(context).toBeDefined();
  expect(resource).toBeDefined();
  expect(resource).toHaveProperty('type');
  expect(resource.type).toBe(expectedType);
  expect(resource).toHaveProperty('id');
  expect(typeof resource.id).toBe('string');
  expect(resource.id.length).toBeGreaterThan(0);
}

/**
 * Validates type and id when the resource type is not ResourceLike (e.g. flattened report).
 */
export function validateResourceTypeAndId(
  resource: { type?: string; id?: string },
  expectedType: string
) {
  expect(resource).toBeDefined();
  expect(resource).toHaveProperty('type');
  expect(resource.type).toBe(expectedType);
  expect(resource).toHaveProperty('id');
  expect(typeof resource.id).toBe('string');
  if (resource.id) expect(resource.id.length).toBeGreaterThan(0);
}

/**
 * Validates that an attribute has one of the allowed types
 */
export function validateAttributeType(
  attributes: AttributesLike,
  field: string,
  allowedTypes: string[],
  context = 'attribute'
) {
  expect(context).toBeDefined();
  const actualType = attributes[field] === null ? 'null' : typeof attributes[field];
  expect(allowedTypes).toContain(actualType);
}

/**
 * Validates string attribute (can be string or undefined)
 */
export function validateStringAttribute(
  attributes: AttributesLike,
  field: string
) {
  validateAttributeType(attributes, field, ['string', 'undefined', 'null'], field);
}

/**
 * Validates nullable string attribute (can be string, null, or undefined)
 */
export function validateNullableStringAttribute(
  attributes: AttributesLike,
  field: string
) {
  validateAttributeType(attributes, field, ['string', 'null', 'undefined'], field);
}

/**
 * Validates boolean attribute (can be boolean or undefined)
 */
export function validateBooleanAttribute(
  attributes: AttributesLike,
  field: string
) {
  validateAttributeType(attributes, field, ['boolean', 'undefined'], field);
}

/**
 * Validates number attribute (can be number or undefined)
 */
export function validateNumberAttribute(
  attributes: AttributesLike,
  field: string
) {
  validateAttributeType(attributes, field, ['number', 'undefined'], field);
}

/**
 * Validates ISO8601 date string format
 * Only validates if the field exists (handles optional date fields)
 */
export function validateDateAttribute(
  attributes: AttributesLike,
  field: string
) {
  const value = attributes[field];
  // Skip validation if field is undefined or null (optional)
  if (value === null || value === undefined) return;

  expect(typeof value).toBe('string');
  // Basic ISO8601 format check (YYYY-MM-DDTHH:mm:ss)
  const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
  expect(iso8601Regex.test(value)).toBe(true);
}

/**
 * Validates relationship structure
 * Handles optional relationships and null data
 */
export function validateRelationship(
  relationship: RelationshipLike,
) {
  expect(relationship).toHaveProperty('data');

  // data can be null (valid JSON:API for optional relationships)
  if (relationship.data === null) return;

  // data is a resource identifier or array of resource identifiers
  if (Array.isArray(relationship.data)) {
    relationship.data.forEach((item: RelDataItem) => {
      expect(item).toHaveProperty('type');
      expect(item).toHaveProperty('id');
    });
  } else {
    expect(relationship.data).toHaveProperty('type');
    expect(relationship.data).toHaveProperty('id');
  }
}

/**
 * Validates that included resources match expected types
 */
export function validateIncludedResources(
  included: ResourceLike[],
  expectedTypes: string[]
) {
  included.forEach(resource => {
    expect(resource).toHaveProperty('type');
    expect(expectedTypes).toContain(resource.type);
    expect(resource).toHaveProperty('id');
    expect(typeof resource.id).toBe('string');
  });
}

/**
 * Validates pagination links structure
 */
export function validatePaginationLinks(links: PaginationLinksLike) {
  expect(links).toHaveProperty('self');
  expect(typeof links.self).toBe('string');
  expect(['string', 'object', 'undefined']).toContain(links.next == null ? 'object' : typeof links.next);
  expect(['string', 'object', 'undefined']).toContain(links.prev == null ? 'object' : typeof links.prev);
}

/**
 * Validates pagination metadata
 */
export function validatePaginationMeta(meta: PaginationMetaLike) {
  expect(typeof meta.count).toBe('number');
  expect(typeof meta.total_count).toBe('number');
}

