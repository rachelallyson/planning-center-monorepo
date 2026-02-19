/**
 * @rachelallyson/planning-center-base-ts
 * Minimal, strictly-typed base for PCO API clients (People, Check-ins).
 * getSingle/getList/getAllPages/createResource/updateResource return flattened resources by default.
 * Pass TOut (e.g. PersonResource) for strict return types; omit for FlattenedResourceResult.
 */

export { PcoHttpClient } from './http-client';
export type { HttpRequestOptions, HttpResponse } from './http-client-types';

export { PaginationHelper } from './pagination';
export type { PaginationOptions, PaginationResult, GetAllPagesOptions } from './pagination';

export { BaseModule } from './base-module';
export { singleFromCreateResponse } from './base-module';
export type {
  GetSingleOptions,
  CreateUpdateOptions,
  CreateResponse,
  DeleteOptions,
  GetAllPagesOptionsFor,
} from './base-module';
export type { QueryOptions } from './query-params';

export { buildQueryParams } from './query-params';
export type { FlatQueryParams, WhereValue } from './query-params';

export { resolveIncluded, flattenResource, mapIncludedToRelationships } from './included-resolver';

export { PcoRateLimiter } from './rate-limiter';
export type { RateLimitInfo, RateLimitHeaders } from './rate-limiter';

export { PcoApiError, rateLimitHeadersFromResponse } from './errors';

export type {
  PcoClientConfig,
  PcoAuthConfig,
  PcoDebugOptions,
  PersonalAccessTokenAuth,
  OAuthAuth,
  BasicAuth,
} from './config';

export { createDebugLogger, logRequestStart, logRequestComplete, logRequestError } from './debug';

export type {
  JsonValue,
  Meta,
  LinkObject,
  Link,
  Links,
  PaginationLinks,
  TopLevelLinks,
  TopLevelJsonApi,
  ListResponse,
  ResourceIdentifier,
  Relationship,
  ToOne,
  ToMany,
  Attributes,
  ResourceObject,
  ResolvedResourceResult,
  ErrorObject,
  JsonApiBase,
  ErrorDocument,
  DataDocumentSingle,
  DataDocumentMany,
  Paginated,
  Response,
} from './json-api';

export type {
  FlattenedResource,
  FlattenedResourceResult,
  AttrsOf,
  RelMapOf,
  DefaultFlattenedFor,
} from './flattened';
export { asFlattened, asFlattenedArray } from './flattened';

export {
  isRecord,
  ensureRecord,
  isErrorArray,
  isErrorObject,
  getOptionalString,
  setAt,
  getRequestUrl,
  hasDataArray,
  isResourceLike,
  isTopLevelLinks,
} from './typed';
