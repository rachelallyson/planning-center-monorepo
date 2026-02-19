/**
 * Type Validation Helpers for Integration Tests
 *
 * These functions validate that actual PCO API responses match our TypeScript type definitions
 */

/** Minimal resource shape (type, id) for validation */
interface ResourceLike {
  type?: string;
  id?: string;
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
  expect(resource.id!.length).toBeGreaterThan(0);
}

/** Attribute bag (field name -> value) for validation; accepts any object so resource types work */
type AttributeBag = Record<string, string | number | boolean | null | undefined>;

function isAttributeBag(obj: object): obj is AttributeBag {
  return typeof obj === 'object' && obj !== null;
}

function asAttributeBag(obj: object): AttributeBag {
  return isAttributeBag(obj) ? obj : {};
}

/**
 * Validates that an attribute has one of the allowed types
 */
export function validateAttributeType(
  attributes: object,
  field: string,
  allowedTypes: string[],
  context = 'attribute'
) {
  expect(context).toBeDefined();
  const bag = asAttributeBag(attributes);
  const actualType = bag[field] === null ? 'null' : typeof bag[field];
  expect(allowedTypes).toContain(actualType);
}

/**
 * Validates string attribute (can be string or undefined)
 */
export function validateStringAttribute(
  attributes: object,
  field: string
) {
  validateAttributeType(attributes, field, ['string', 'undefined', 'null'], field);
}

/**
 * Validates nullable string attribute (can be string, null, or undefined)
 */
export function validateNullableStringAttribute(
  attributes: object,
  field: string
) {
  validateAttributeType(attributes, field, ['string', 'null', 'undefined'], field);
}

/**
 * Validates boolean attribute (can be boolean or undefined)
 */
export function validateBooleanAttribute(
  attributes: object,
  field: string
) {
  validateAttributeType(attributes, field, ['boolean', 'undefined'], field);
}

/**
 * Validates number attribute (can be number or undefined)
 */
export function validateNumberAttribute(
  attributes: object,
  field: string
) {
  validateAttributeType(attributes, field, ['number', 'undefined'], field);
}

/**
 * Validates ISO8601 date string format
 * Only validates if the field exists (handles optional date fields)
 */
export function validateDateAttribute(
  attributes: object,
  field: string
) {
  const bag = asAttributeBag(attributes);
  const value = bag[field];
  // Skip validation if field is undefined or null (optional)
  if (value === null || value === undefined) return;
  if (typeof value !== 'string') return;
  // Basic ISO8601 format check (YYYY-MM-DDTHH:mm:ss)
  const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
  expect(iso8601Regex.test(value)).toBe(true);
}

/** Resource identifier shape */
interface ResourceIdentifier {
  type?: string;
  id?: string;
}

/** Relationship payload (data can be null or identifier(s)) */
interface RelationshipLike {
  data?: ResourceIdentifier | ResourceIdentifier[] | null;
}

/**
 * Validates relationship structure
 * Handles optional relationships and null data
 */
export function validateRelationship(
  relationship: RelationshipLike
) {
  expect(relationship).toHaveProperty('data');

  // data can be null (valid JSON:API for optional relationships)
  if (relationship.data === null) return;

  // data is a resource identifier or array of resource identifiers
  if (Array.isArray(relationship.data)) {
    relationship.data.forEach((item: ResourceIdentifier) => {
      expect(item).toHaveProperty('type');
      expect(item).toHaveProperty('id');
    });
  } else {
    expect(relationship.data).toHaveProperty('type');
    expect(relationship.data).toHaveProperty('id');
  }
}

/** Check type/id on an object without casting. */
function expectResourceIdentifierShape(r: object) {
  const typeDesc = Object.getOwnPropertyDescriptor(r, 'type');
  if (typeDesc?.value !== undefined) expect(typeof typeDesc.value).toBe('string');
  const idDesc = Object.getOwnPropertyDescriptor(r, 'id');
  if (idDesc?.value !== undefined) expect(typeof idDesc.value).toBe('string');
}

function isRelationshipRecord(o: object): o is Record<string, object | object[] | null | undefined> {
  return typeof o === 'object' && o !== null;
}

export function validateRelationshipKeys(item: object, relKeys: readonly string[]) {
  const record = isRelationshipRecord(item) ? item : {};
  relKeys.forEach((key) => {
    const val = record[key];
    if (val === undefined || val === null) return;
    if (Array.isArray(val)) {
      val.forEach((v) => {
        expect(v).toBeDefined();
        expect(typeof v === 'object').toBe(true);
        expectResourceIdentifierShape(v);
      });
    } else {
      expect(typeof val === 'object').toBe(true);
      expectResourceIdentifierShape(val);
    }
  });
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

/** Pagination links shape */
interface PaginationLinksLike {
  self?: string;
  next?: string | null;
  prev?: string | null;
}

/**
 * Validates pagination links structure
 */
export function validatePaginationLinks(links: PaginationLinksLike) {
  expect(links).toHaveProperty('self');
  expect(typeof links.self).toBe('string');

  // next and prev can be null or strings (typeof null === 'object')
  expect(['string', 'object', 'undefined']).toContain(links.next == null ? 'object' : typeof links.next);
  expect(['string', 'object', 'undefined']).toContain(links.prev == null ? 'object' : typeof links.prev);
}

/** Pagination meta shape */
interface PaginationMetaLike {
  count?: number;
  total_count?: number;
}

/**
 * Validates pagination metadata
 */
export function validatePaginationMeta(meta: PaginationMetaLike) {
  expect(typeof meta.count).toBe('number');
  expect(typeof meta.total_count).toBe('number');
}

