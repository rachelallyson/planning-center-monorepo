// ===== v1.0.0 Main Exports =====

// Main client class
export { PcoCheckInsClient } from './client';

// Configuration types
export type {
  PcoCheckInsClientConfig,
} from './types/client';

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
  Response,
} from '@rachelallyson/planning-center-base-ts';

// Check-Ins types
export type {
  EventResource,
  EventAttributes,
  EventRelationships,
  EventsList,
  EventSingle,
  CheckInResource,
  CheckInAttributes,
  CheckInRelationships,
  CheckInsList,
  CheckInSingle,
  LocationResource,
  LocationAttributes,
  LocationRelationships,
  LocationsList,
  LocationSingle,
  EventPeriodResource,
  EventPeriodAttributes,
  EventPeriodRelationships,
  EventPeriodsList,
  EventPeriodSingle,
  EventTimeResource,
  EventTimeAttributes,
  EventTimeRelationships,
  EventTimesList,
  EventTimeSingle,
  StationResource,
  StationAttributes,
  StationRelationships,
  StationsList,
  StationSingle,
  LabelResource,
  LabelAttributes,
  LabelRelationships,
  LabelsList,
  LabelSingle,
  EventLabelResource,
  EventLabelAttributes,
  EventLabelRelationships,
  EventLabelsList,
  EventLabelSingle,
  LocationLabelResource,
  LocationLabelAttributes,
  LocationLabelRelationships,
  LocationLabelsList,
  LocationLabelSingle,
  OptionResource,
  OptionAttributes,
  OptionRelationships,
  OptionsList,
  OptionSingle,
  CheckInGroupResource,
  CheckInGroupAttributes,
  CheckInGroupRelationships,
  CheckInGroupsList,
  CheckInGroupSingle,
  CheckInTimeResource,
  CheckInTimeAttributes,
  CheckInTimeRelationships,
  CheckInTimesList,
  CheckInTimeSingle,
  PersonEventResource,
  PersonEventAttributes,
  PersonEventRelationships,
  PersonEventsList,
  PersonEventSingle,
  PreCheckResource,
  PreCheckAttributes,
  PreCheckRelationships,
  PreChecksList,
  PreCheckSingle,
  PassResource,
  PassAttributes,
  PassRelationships,
  PassesList,
  PassSingle,
  HeadcountResource,
  HeadcountAttributes,
  HeadcountRelationships,
  HeadcountsList,
  HeadcountSingle,
  AttendanceTypeResource,
  AttendanceTypeAttributes,
  AttendanceTypeRelationships,
  AttendanceTypesList,
  AttendanceTypeSingle,
  RosterListPersonResource,
  RosterListPersonAttributes,
  RosterListPersonRelationships,
  RosterListPersonsList,
  RosterListPersonSingle,
  OrganizationResource,
  OrganizationAttributes,
  OrganizationRelationships,
  OrganizationsList,
  OrganizationSingle,
  IntegrationLinkResource,
  IntegrationLinkAttributes,
  IntegrationLinkRelationships,
  IntegrationLinksList,
  IntegrationLinkSingle,
  ThemeResource,
  ThemeAttributes,
  ThemeRelationships,
  ThemesList,
  ThemeSingle,
  LocationEventPeriodResource,
  LocationEventPeriodAttributes,
  LocationEventPeriodRelationships,
  LocationEventPeriodsList,
  LocationEventPeriodSingle,
  LocationEventTimeResource,
  LocationEventTimeAttributes,
  LocationEventTimeRelationships,
  LocationEventTimesList,
  LocationEventTimeSingle,
} from './types';

// Export all types for convenience
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

