/**
 * Minimal JSON:API types for PCO responses.
 */

/** Object values may be undefined (optional props); enables ErrorObject/ResourceObject assignability to JsonValue. */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [k: string]: JsonValue | undefined }
  | JsonValue[];

/** Top-level or resource-level meta object (arbitrary key/value). */
export type Meta = Record<string, JsonValue>;

/** JSON:API link as object: href and optional meta. */
export interface LinkObject {
  href: string;
  meta?: Meta;
}

/** JSON:API link: string URL, or object with href (and optional meta). API may return null or object variants. */
export type Link = string | LinkObject | null | Record<string, unknown>;
/** Map of link names to URLs or link objects (e.g. self, related). */
export type Links = Record<string, Link | undefined>;

/** Standard pagination link names (first, last, prev, next). */
export interface PaginationLinks {
  first?: Link | null;
  last?: Link | null;
  prev?: Link | null;
  next?: Link | null;
}

/** Top-level document links: pagination plus any custom links. */
export type TopLevelLinks = Links & PaginationLinks;

/** JSON:API object (version, meta) at top level. */
export interface TopLevelJsonApi {
  version?: string;
  meta?: Meta;
}

/**
 * List response shape returned by getList/getAllPages (data array + optional meta/links).
 * Shared by People and Check-Ins (and any other PCO API client).
 */
export interface ListResponse<T> {
  data: T[];
  meta?: Meta;
  links?: TopLevelLinks;
}

/** JSON:API resource identifier (type + id); used in relationships and references. */
export interface ResourceIdentifier<TType extends string = string> {
  type: TType;
  id: string;
  meta?: Meta;
}

/** JSON:API relationship: optional data (identifier or array), links, meta. */
export interface Relationship {
  data?: ResourceIdentifier | ResourceIdentifier[] | null;
  links?: Links;
  meta?: Meta;
}

/** Relationship to a single related resource (data is one identifier or null). */
export type ToOne<TType extends string> = Omit<Relationship, 'data'> & {
  data?: ResourceIdentifier<TType> | null;
};

/** Relationship to many related resources (data is array of identifiers). */
export type ToMany<TType extends string> = Omit<Relationship, 'data'> & {
  data?: ResourceIdentifier<TType>[];
};

/** Resource attributes: string, number, boolean, object, or null. */
export type Attributes = Record<
  string,
  string | number | boolean | object | undefined | null
>;

/** JSON:API resource object: type, id, optional attributes and relationships. */
export interface ResourceObject<
  TType extends string = string,
  TAttrs extends object = Attributes,
  TRelMap = Record<string, Relationship>,
> {
  type: TType;
  id: string;
  attributes?: TAttrs;
  relationships?: TRelMap;
  links?: Links;
  meta?: Meta;
}

/** Resolved resource: same as ResourceObject but relationship data has been inlined from included. */
export type ResolvedResourceResult = ResourceObject<string, object, object>;

// ===== Documents =====

/** Base for JSON:API documents: optional links, jsonapi, meta. */
export interface JsonApiBase {
  links?: TopLevelLinks;
  jsonapi?: TopLevelJsonApi;
  meta?: Meta;
}

/** JSON:API error object. Index signature ensures assignability to JsonValue for type guards. */
export interface ErrorObject {
  [key: string]: JsonValue | undefined;
  id?: string;
  status?: string;
  code?: string;
  title?: string;
  detail?: string;
  source?: { [k: string]: JsonValue | undefined; pointer?: string; parameter?: string };
  meta?: Meta;
}

/** JSON:API error document (errors array; no data or included). */
export interface ErrorDocument extends JsonApiBase {
  errors: ErrorObject[];
  data?: never;
  included?: never;
}

type DefaultResource = ResourceObject<string, object, Record<string, Relationship>>;

/** Single-resource success document (data is one resource or null; optional included). */
export interface DataDocumentSingle<
  TRes extends ResourceObject<string, object, object>,
  TIncluded extends ResourceObject<string, object, object> = DefaultResource,
> extends JsonApiBase {
  data: TRes | null;
  included?: TIncluded[];
  errors?: never;
}

/** Collection success document (data array; optional included). */
export interface DataDocumentMany<
  TRes extends ResourceObject<string, object, object>,
  TIncluded extends ResourceObject<string, object, object> = DefaultResource,
> extends JsonApiBase {
  data: TRes[];
  included?: TIncluded[];
  errors?: never;
}

/** Collection document with pagination links (next, prev). */
export type Paginated<
  TRes extends ResourceObject<string, object, object>,
  TIncluded extends ResourceObject<string, object, object> = DefaultResource,
> = DataDocumentMany<TRes, TIncluded> & {
  links: TopLevelLinks & { next?: string | null; prev?: string | null };
};

/** Single-resource success document or error document (union). */
export type Response<
  TRes extends ResourceObject<string, object, object>,
  TIncluded extends ResourceObject<string, object, object> = DefaultResource,
> = DataDocumentSingle<TRes, TIncluded> | ErrorDocument;
