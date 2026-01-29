// ===== v2.0.0 Main Exports =====

// Main client class
export { PcoClient } from './client';

// Client manager for caching and lifecycle management
export { PcoClientManager } from './client-manager';

// Configuration types
export type {
  PcoClientConfig,
  PcoAuthConfig,
  PersonalAccessTokenAuth,
  OAuthAuth,
  PeopleClientConfig,
  PcoDebugOptions,
} from './types/client';

// Debug (turn logs on/off, see everything that happens — from base, shared across PCO packages)
export {
  attachDebugListener,
  createDebugLogger,
  formatDebugEvent,
} from '@rachelallyson/planning-center-base-ts';
export type { PcoDebugListenable } from '@rachelallyson/planning-center-base-ts';

// Event system (re-exported from base)
export type { PcoEvent, EventHandler, EventType } from '@rachelallyson/planning-center-base-ts';

// Batch operations (re-exported from base)
export type { BatchOperation, BatchResult, BatchOptions, BatchSummary } from '@rachelallyson/planning-center-base-ts';

// Core types (re-exported from base)
export type {
  Paginated,
  Relationship,
  ResourceIdentifier,
  ResourceObject,
} from '@rachelallyson/planning-center-base-ts';

// People types
export type {
  PersonResource,
  PersonAttributes,
  PersonSingle,
  PeopleList,
  EmailResource,
  EmailAttributes,
  PhoneNumberResource,
  PhoneNumberAttributes,
  AddressResource,
  AddressAttributes,
  SocialProfileResource,
  SocialProfileAttributes,
} from './types';

// Field types
export type {
  FieldDefinitionResource,
  FieldDefinitionAttributes,
  FieldDatumResource,
  FieldDatumAttributes,
  FieldOptionResource,
  FieldOptionAttributes,
  TabResource,
  TabAttributes,
} from './types';

// Workflow types
export type {
  WorkflowResource,
  WorkflowAttributes,
  WorkflowCardResource,
  WorkflowCardAttributes,
  WorkflowCardNoteResource,
  WorkflowCardNoteAttributes,
} from './types';

// Other resource types
export type {
  HouseholdResource,
  HouseholdAttributes,
  NoteResource,
  NoteAttributes,
  ListResource,
  ListAttributes,
  OrganizationResource,
  OrganizationAttributes,
  CampusResource,
  CampusAttributes,
  CampusesList,
  ServiceTimeResource,
  ServiceTimeAttributes,
  ServiceTimesList,
  FormResource,
  FormAttributes,
  FormsList,
  FormCategoryResource,
  FormCategoryAttributes,
  FormFieldResource,
  FormFieldAttributes,
  FormFieldOptionResource,
  FormFieldOptionAttributes,
  FormSubmissionResource,
  FormSubmissionAttributes,
  FormSubmissionValueResource,
  FormSubmissionValueAttributes,
  ReportResource,
  ReportAttributes,
  ReportsList,
} from './types';

// ===== Core Functions (for testing and advanced usage) =====
export { createPcoClient, getRateLimitInfo } from './core';
export type { PcoClientState, PcoClientConfig as CorePcoClientConfig } from './core';

// ===== Auth Functions =====
export { attemptTokenRefresh, refreshAccessToken, updateClientTokens, hasRefreshTokenCapability } from './auth';
export type { TokenResponse, PcoClientConfigWithRefresh } from './auth';

// ===== v1.x Compatibility Exports (Deprecated) =====

// Export all types for backward compatibility
export * from './types';

// Export API error (re-exported from base)
export { PcoApiError } from '@rachelallyson/planning-center-base-ts';

// Export rate limiter (re-exported from base)
export type { RateLimitHeaders, RateLimitInfo } from '@rachelallyson/planning-center-base-ts';
export { PcoRateLimiter } from '@rachelallyson/planning-center-base-ts';

// Export enhanced error handling (re-exported from base)
export type { ErrorContext } from '@rachelallyson/planning-center-base-ts';
export {
  ErrorCategory,
  ErrorSeverity,
  handleNetworkError,
  handleTimeoutError,
  handleValidationError,
  PcoError,
  retryWithBackoff,
  shouldNotRetry,
  withErrorBoundary,
} from '@rachelallyson/planning-center-base-ts';

// ===== Enhanced Error Handling =====
export {
  attemptRecovery,
  CircuitBreaker,
  classifyError,
  createErrorReport,
  DEFAULT_RETRY_CONFIG,
  executeBulkOperation,
  retryWithExponentialBackoff,
  TIMEOUT_CONFIG,
  withTimeout,
} from './error-scenarios';


// ===== Helper Functions =====
export {
  calculateAge,
  calculateTrust,
  createPersonWithContact,
  createWorkflowCardWithNote,
  DEFAULT_TRUST_WINDOW,
  emailDomainsMatch,
  exportAllPeopleData,
  extractEmailDomain,
  extractFileUrl,
  formatDate,
  formatPersonName,
  getCompletePersonProfile,
  getFileExtension,
  getFilename,
  getListsWithCategories,
  getOrganizationInfo,
  getPeopleByHousehold,
  getPersonWorkflowCardsWithNotes,
  getPrimaryContact,
  isFileUpload,
  isFileUrl,
  isValidEmail,
  isValidPhone,
  normalizeEmail,
  normalizePhone,
  phoneNumbersSimilar,
  processFileValue,
  searchPeople,
  validateContactSimilarity,
  validatePersonData,
  findIncluded,
  resolveIncluded,
  createIncludedLookup,
} from './helpers';
export type { TrustResult } from './helpers';

// ===== Matching Configuration =====
export {
  DEFAULT_INITIAL_RETRY_CONFIG,
  DEFAULT_AGGRESSIVE_RETRY_CONFIG,
} from './modules/people';
export type { RetryConfig, PersonMatchOptions } from './modules/people';

// API Options Types (strictly typed endpoint parameters)
export type {
  PersonListOptions,
  PersonPageOptions,
  PersonInclude,
  PersonOrderField,
  PersonWhereClause,
  FieldDefinitionListOptions,
  FieldDefinitionInclude,
  FieldDefinitionOrderField,
  FieldDefinitionWhereClause,
  WorkflowListOptions,
  WorkflowPageOptions,
  WorkflowInclude,
  WorkflowOrderField,
  WorkflowWhereClause,
  NoteListOptions,
  NotePageOptions,
  NoteInclude,
  NoteOrderField,
  NoteWhereClause,
  ListListOptions,
  ListPageOptions,
  ListInclude,
  ListOrderField,
  ListWhereClause,
  HouseholdListOptions,
  HouseholdPageOptions,
  HouseholdInclude,
  HouseholdOrderField,
  HouseholdWhereClause,
  CampusListOptions,
  CampusPageOptions,
  CampusInclude,
  CampusOrderField,
  CampusWhereClause,
  FormListOptions,
  FormPageOptions,
  ReportListOptions,
  ReportPageOptions,
  ServiceTimeListOptions,
  ServiceTimePageOptions,
} from './types/api-options';

// ===== Performance Optimization =====
export {
  AdaptiveRateLimiter,
  ApiCache,
  batchFetchPersonDetails,
  fetchAllPages,
  getCachedPeople,
  monitorPerformance,
  PerformanceMonitor,
  processInBatches,
  processLargeDataset,
  streamPeopleData,
} from './performance';

// ===== Testing Utilities =====
export {
  MockPcoClient,
  MockResponseBuilder,
  RequestRecorder,
  createMockClient,
  createRecordingClient,
  createTestClient,
  createErrorMockClient,
  createSlowMockClient,
} from './testing';
export type { MockClientConfig, RecordingConfig } from './testing';
