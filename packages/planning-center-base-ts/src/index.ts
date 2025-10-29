// Main exports for @rachelallyson/planning-center-base-ts

// HTTP Client
export { PcoHttpClient } from './http-client';
export type { HttpRequestOptions, HttpResponse } from './http-client';

// Pagination
export { PaginationHelper } from './pagination';
export type { PaginationOptions, PaginationResult } from './pagination';

// Base Module
export { BaseModule } from './base-module';

// Monitoring
export { PcoEventEmitter, RequestIdGenerator, PerformanceMetrics, RateLimitTracker } from './monitoring';

// Rate Limiting
export { PcoRateLimiter } from './rate-limiter';
export type { RateLimitHeaders, RateLimitInfo } from './rate-limiter';

// Error Handling
export { PcoApiError } from './errors/api-error';
export { PcoError, ErrorCategory, ErrorSeverity, retryWithBackoff, withErrorBoundary, shouldNotRetry, handleNetworkError, handleTimeoutError, handleValidationError } from './errors/error-handling';
export type { ErrorContext } from './errors/error-handling';

// Batch Operations
export { BatchExecutor } from './batch';
export type { BatchClient } from './batch';

// Types
export type {
  PcoClientConfig,
  PcoAuthConfig,
  PersonalAccessTokenAuth,
  OAuthAuth,
  BasicAuth,
  ErrorEvent,
  AuthFailureEvent,
  RequestStartEvent,
  RequestCompleteEvent,
  RateLimitEvent,
  CacheEvent,
} from './types/config';

export type {
  PcoEvent,
  EventHandler,
  EventType,
  EventEmitter,
  RequestStartEvent as EventRequestStartEvent,
  RequestCompleteEvent as EventRequestCompleteEvent,
  RequestErrorEvent,
  AuthSuccessEvent,
  AuthFailureEvent as EventAuthFailureEvent,
  AuthRefreshEvent,
  RateLimitEvent as EventRateLimitEvent,
  RateAvailableEvent,
  CacheHitEvent,
  CacheMissEvent,
  CacheSetEvent,
  CacheInvalidateEvent,
  ErrorEvent as EventErrorEvent,
} from './types/events';

export type {
  BatchOperation,
  BatchResult,
  BatchOptions,
  BatchSummary,
  OperationReference,
  ResolvedBatchOperation,
} from './types/batch';

export type {
  JsonValue,
  Meta,
  LinkObject,
  Link,
  Links,
  PaginationLinks,
  TopLevelLinks,
  TopLevelJsonApi,
  ResourceIdentifier,
  Relationship,
  ToOne,
  ToMany,
  Attributes,
  ResourceObject,
  JsonApiBase,
  ErrorObject,
  ErrorDocument,
  DataDocumentSingle,
  DataDocumentMany,
  JsonApiDocument,
  Paginated,
  Response,
} from './types/json-api';

