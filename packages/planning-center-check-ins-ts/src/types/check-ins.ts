/**
 * Planning Center Check-Ins API Types
 * Based on JSON:API 1.0 specification
 */

import {
  Attributes,
  FlattenedResource,
  Meta,
  Relationship,
  ResourceObject,
  TopLevelLinks,
} from '@rachelallyson/planning-center-base-ts';

/** List response shape returned by the client (data is always flattened) */
export interface ListResponse<T> {
  data: T[];
  meta?: Meta;
  links?: TopLevelLinks;
}

// ===== Event Resource =====

export interface EventAttributes extends Attributes {
  name?: string;
  frequency?: string;
  enable_services_integration?: boolean;
  location_times_enabled?: boolean;
  pre_select_enabled?: boolean;
  integration_key?: string;
  app_source?: string;
  created_at?: string;
  updated_at?: string;
  archived_at?: string;
}

export interface EventRelationships {
  attendance_types?: Relationship;
  check_ins?: Relationship;
  current_event_times?: Relationship;
  event_labels?: Relationship;
  event_periods?: Relationship;
  integration_links?: Relationship;
  locations?: Relationship;
  person_events?: Relationship;
}

/** Maps Event relationship keys to specific resource types (internal JSON:API shape) */
export interface EventRelResourceMap extends Record<string, ResourceObject<string, any, any> | ResourceObject<string, any, any>[]> {
  attendance_types: AttendanceTypeResourceObject[];
  check_ins: CheckInResourceObject[];
  current_event_times: EventTimeResourceObject[];
  event_labels: EventLabelResourceObject[];
  event_periods: EventPeriodResourceObject[];
  integration_links: IntegrationLinkResourceObject[];
  locations: LocationResourceObject[];
  person_events: PersonEventResourceObject[];
}

/** Internal JSON:API resource shape; use EventResource for the type returned by the client */
export interface EventResourceObject
  extends ResourceObject<'Event', EventAttributes, EventRelationships> { }

/** Event resource as returned by the client (attributes and relationships at top level) */
export type EventResource = FlattenedResource<
  'Event',
  EventAttributes,
  EventRelationships,
  EventRelResourceMap,
  CheckInsResourceTypeToRelMap>;

export type EventsList = ListResponse<EventResource>;
export type EventSingle = EventResource;

// ===== CheckIn Resource =====

export interface CheckInAttributes extends Attributes {
  first_name?: string;
  last_name?: string;
  medical_notes?: string;
  number?: number;
  security_code?: string;
  created_at?: string;
  updated_at?: string;
  checked_out_at?: string;
  confirmed_at?: string;
  emergency_contact_name?: string;
  emergency_contact_phone_number?: string;
  one_time_guest?: boolean;
  kind?: string;
}

export interface CheckInRelationships {
  check_in_group?: Relationship;
  check_in_times?: Relationship;
  checked_in_at?: Relationship; // Station
  checked_in_by?: Relationship; // Person
  checked_out_by?: Relationship; // Person
  event?: Relationship;
  event_period?: Relationship;
  event_times?: Relationship;
  locations?: Relationship;
  options?: Relationship;
  person?: Relationship;
}

/** Maps CheckIn relationship keys to specific resource types (Person/checked_in_by/checked_out_by are external) */
export interface CheckInRelResourceMap extends Record<string, ResourceObject<string, any, any> | ResourceObject<string, any, any>[]> {
  check_in_group: CheckInGroupResourceObject;
  check_in_times: CheckInTimeResourceObject[];
  checked_in_at: StationResourceObject;
  event: EventResourceObject;
  event_period: EventPeriodResourceObject;
  event_times: EventTimeResourceObject[];
  locations: LocationResourceObject[];
  options: OptionResourceObject[];
}

/** Internal JSON:API resource shape; use CheckInResource for the type returned by the client */
export interface CheckInResourceObject
  extends ResourceObject<'CheckIn', CheckInAttributes, CheckInRelationships> { }

/** Check-in resource as returned by the client (attributes and relationships at top level) */
export type CheckInResource = FlattenedResource<
  'CheckIn',
  CheckInAttributes,
  CheckInRelationships,
  CheckInRelResourceMap,
  CheckInsResourceTypeToRelMap>;

export type CheckInsList = ListResponse<CheckInResource>;
export type CheckInSingle = CheckInResource;

// ===== Location Resource =====

export interface LocationAttributes extends Attributes {
  name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LocationRelationships {
  event?: Relationship;
  location_event_periods?: Relationship;
  location_event_times?: Relationship;
  location_labels?: Relationship;
}

/** Maps Location relationship keys to specific resource types */
export interface LocationRelResourceMap extends Record<string, ResourceObject<string, any, any> | ResourceObject<string, any, any>[]> {
  event: EventResourceObject;
  location_event_periods: LocationEventPeriodResourceObject[];
  location_event_times: LocationEventTimeResourceObject[];
  location_labels: LocationLabelResourceObject[];
}

/** Internal JSON:API resource shape; use LocationResource for the type returned by the client */
export interface LocationResourceObject
  extends ResourceObject<'Location', LocationAttributes, LocationRelationships> { }

/** Location resource as returned by the client (attributes and relationships at top level) */
export type LocationResource = FlattenedResource<
  'Location',
  LocationAttributes,
  LocationRelationships,
  LocationRelResourceMap,
  CheckInsResourceTypeToRelMap>;

export type LocationsList = ListResponse<LocationResource>;
export type LocationSingle = LocationResource;

// ===== EventPeriod Resource =====

export interface EventPeriodAttributes extends Attributes {
  starts_at?: string;
  ends_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface EventPeriodRelationships {
  event?: Relationship;
  event_times?: Relationship;
  check_ins?: Relationship;
  location_event_periods?: Relationship;
}

/** Maps EventPeriod relationship keys to specific resource types */
export interface EventPeriodRelResourceMap extends Record<string, ResourceObject<string, any, any> | ResourceObject<string, any, any>[]> {
  event: EventResourceObject;
  event_times: EventTimeResourceObject[];
  check_ins: CheckInResourceObject[];
  location_event_periods: LocationEventPeriodResourceObject[];
}

/** Internal JSON:API resource shape; use EventPeriodResource for the type returned by the client */
export interface EventPeriodResourceObject
  extends ResourceObject<'EventPeriod', EventPeriodAttributes, EventPeriodRelationships> { }

/** Event period resource as returned by the client (attributes and relationships at top level) */
export type EventPeriodResource = FlattenedResource<
  'EventPeriod',
  EventPeriodAttributes,
  EventPeriodRelationships,
  EventPeriodRelResourceMap,
  CheckInsResourceTypeToRelMap>;

export type EventPeriodsList = ListResponse<EventPeriodResource>;
export type EventPeriodSingle = EventPeriodResource;

// ===== EventTime Resource =====

export interface EventTimeAttributes extends Attributes {
  starts_at?: string;
  ends_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface EventTimeRelationships {
  event?: Relationship;
  event_period?: Relationship;
  location_event_times?: Relationship;
  check_ins?: Relationship;
  headcounts?: Relationship;
}

/** Maps EventTime relationship keys to specific resource types */
export interface EventTimeRelResourceMap extends Record<string, ResourceObject<string, any, any> | ResourceObject<string, any, any>[]> {
  event: EventResourceObject;
  event_period: EventPeriodResourceObject;
  location_event_times: LocationEventTimeResourceObject[];
  check_ins: CheckInResourceObject[];
  headcounts: HeadcountResourceObject[];
}

/** Internal JSON:API resource shape; use EventTimeResource for the type returned by the client */
export interface EventTimeResourceObject
  extends ResourceObject<'EventTime', EventTimeAttributes, EventTimeRelationships> { }

/** Event time resource as returned by the client (attributes and relationships at top level) */
export type EventTimeResource = FlattenedResource<
  'EventTime',
  EventTimeAttributes,
  EventTimeRelationships,
  EventTimeRelResourceMap,
  CheckInsResourceTypeToRelMap>;

export type EventTimesList = ListResponse<EventTimeResource>;
export type EventTimeSingle = EventTimeResource;

// ===== Station Resource =====

export interface StationAttributes extends Attributes {
  name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface StationRelationships {
  check_ins?: Relationship;
}

/** Maps Station relationship keys to specific resource types */
export interface StationRelResourceMap extends Record<string, ResourceObject<string, any, any> | ResourceObject<string, any, any>[]> {
  check_ins: CheckInResourceObject[];
}

/** Internal JSON:API resource shape; use StationResource for the type returned by the client */
export interface StationResourceObject
  extends ResourceObject<'Station', StationAttributes, StationRelationships> { }

/** Station resource as returned by the client (attributes and relationships at top level) */
export type StationResource = FlattenedResource<
  'Station',
  StationAttributes,
  StationRelationships,
  StationRelResourceMap,
  CheckInsResourceTypeToRelMap>;

export type StationsList = ListResponse<StationResource>;
export type StationSingle = StationResource;

// ===== Label Resource =====

export interface LabelAttributes extends Attributes {
  name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LabelRelationships {
  event_labels?: Relationship;
  location_labels?: Relationship;
}

/** Maps Label relationship keys to specific resource types */
export interface LabelRelResourceMap extends Record<string, ResourceObject<string, any, any> | ResourceObject<string, any, any>[]> {
  event_labels: EventLabelResourceObject[];
  location_labels: LocationLabelResourceObject[];
}

/** Internal JSON:API resource shape; use LabelResource for the type returned by the client */
export interface LabelResourceObject
  extends ResourceObject<'Label', LabelAttributes, LabelRelationships> { }

/** Label resource as returned by the client (attributes and relationships at top level) */
export type LabelResource = FlattenedResource<
  'Label',
  LabelAttributes,
  LabelRelationships,
  LabelRelResourceMap,
  CheckInsResourceTypeToRelMap>;

export type LabelsList = ListResponse<LabelResource>;
export type LabelSingle = LabelResource;

// ===== EventLabel Resource =====

export interface EventLabelAttributes extends Attributes {
  created_at?: string;
  updated_at?: string;
}

export interface EventLabelRelationships {
  event?: Relationship;
  label?: Relationship;
}

/** Maps EventLabel relationship keys to specific resource types */
export interface EventLabelRelResourceMap extends Record<string, ResourceObject<string, any, any> | ResourceObject<string, any, any>[]> {
  event: EventResourceObject;
  label: LabelResourceObject;
}

/** Internal JSON:API resource shape; use EventLabelResource for the type returned by the client */
export interface EventLabelResourceObject
  extends ResourceObject<'EventLabel', EventLabelAttributes, EventLabelRelationships> { }

/** Event label resource as returned by the client (attributes and relationships at top level) */
export type EventLabelResource = FlattenedResource<
  'EventLabel',
  EventLabelAttributes,
  EventLabelRelationships,
  EventLabelRelResourceMap,
  CheckInsResourceTypeToRelMap>;

export type EventLabelsList = ListResponse<EventLabelResource>;
export type EventLabelSingle = EventLabelResource;

// ===== LocationLabel Resource =====

export interface LocationLabelAttributes extends Attributes {
  created_at?: string;
  updated_at?: string;
}

export interface LocationLabelRelationships {
  location?: Relationship;
  label?: Relationship;
}

/** Maps LocationLabel relationship keys to specific resource types */
export interface LocationLabelRelResourceMap extends Record<string, ResourceObject<string, any, any> | ResourceObject<string, any, any>[]> {
  location: LocationResourceObject;
  label: LabelResourceObject;
}

/** Internal JSON:API resource shape; use LocationLabelResource for the type returned by the client */
export interface LocationLabelResourceObject
  extends ResourceObject<'LocationLabel', LocationLabelAttributes, LocationLabelRelationships> { }

/** Location label resource as returned by the client (attributes and relationships at top level) */
export type LocationLabelResource = FlattenedResource<
  'LocationLabel',
  LocationLabelAttributes,
  LocationLabelRelationships,
  LocationLabelRelResourceMap,
  CheckInsResourceTypeToRelMap>;

export type LocationLabelsList = ListResponse<LocationLabelResource>;
export type LocationLabelSingle = LocationLabelResource;

// ===== Option Resource =====

export interface OptionAttributes extends Attributes {
  name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface OptionRelationships {
  check_ins?: Relationship;
}

/** Maps Option relationship keys to specific resource types */
export interface OptionRelResourceMap extends Record<string, ResourceObject<string, any, any> | ResourceObject<string, any, any>[]> {
  check_ins: CheckInResourceObject[];
}

/** Internal JSON:API resource shape; use OptionResource for the type returned by the client */
export interface OptionResourceObject
  extends ResourceObject<'Option', OptionAttributes, OptionRelationships> { }

/** Option resource as returned by the client (attributes and relationships at top level) */
export type OptionResource = FlattenedResource<
  'Option',
  OptionAttributes,
  OptionRelationships,
  OptionRelResourceMap,
  CheckInsResourceTypeToRelMap>;

export type OptionsList = ListResponse<OptionResource>;
export type OptionSingle = OptionResource;

// ===== CheckInGroup Resource =====

export interface CheckInGroupAttributes extends Attributes {
  name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CheckInGroupRelationships {
  check_ins?: Relationship;
}

/** Maps CheckInGroup relationship keys to specific resource types */
export interface CheckInGroupRelResourceMap extends Record<string, ResourceObject<string, any, any> | ResourceObject<string, any, any>[]> {
  check_ins: CheckInResourceObject[];
}

/** Internal JSON:API resource shape; use CheckInGroupResource for the type returned by the client */
export interface CheckInGroupResourceObject
  extends ResourceObject<'CheckInGroup', CheckInGroupAttributes, CheckInGroupRelationships> { }

/** Check-in group resource as returned by the client (attributes and relationships at top level) */
export type CheckInGroupResource = FlattenedResource<
  'CheckInGroup',
  CheckInGroupAttributes,
  CheckInGroupRelationships,
  CheckInGroupRelResourceMap,
  CheckInsResourceTypeToRelMap>;

export type CheckInGroupsList = ListResponse<CheckInGroupResource>;
export type CheckInGroupSingle = CheckInGroupResource;

// ===== CheckInTime Resource =====

export interface CheckInTimeAttributes extends Attributes {
  created_at?: string;
  updated_at?: string;
}

export interface CheckInTimeRelationships {
  check_in?: Relationship;
  event_time?: Relationship;
}

/** Maps CheckInTime relationship keys to specific resource types */
export interface CheckInTimeRelResourceMap extends Record<string, ResourceObject<string, any, any> | ResourceObject<string, any, any>[]> {
  check_in: CheckInResourceObject;
  event_time: EventTimeResourceObject;
}

/** Internal JSON:API resource shape; use CheckInTimeResource for the type returned by the client */
export interface CheckInTimeResourceObject
  extends ResourceObject<'CheckInTime', CheckInTimeAttributes, CheckInTimeRelationships> { }

/** Check-in time resource as returned by the client (attributes and relationships at top level) */
export type CheckInTimeResource = FlattenedResource<
  'CheckInTime',
  CheckInTimeAttributes,
  CheckInTimeRelationships,
  CheckInTimeRelResourceMap,
  CheckInsResourceTypeToRelMap>;

export type CheckInTimesList = ListResponse<CheckInTimeResource>;
export type CheckInTimeSingle = CheckInTimeResource;

// ===== PersonEvent Resource =====

export interface PersonEventAttributes extends Attributes {
  created_at?: string;
  updated_at?: string;
}

export interface PersonEventRelationships {
  event?: Relationship;
  person?: Relationship;
}

/** Maps PersonEvent relationship keys to specific resource types (person is external/People API) */
export interface PersonEventRelResourceMap extends Record<string, ResourceObject<string, any, any> | ResourceObject<string, any, any>[]> {
  event: EventResourceObject;
}

/** Internal JSON:API resource shape; use PersonEventResource for the type returned by the client */
export interface PersonEventResourceObject
  extends ResourceObject<'PersonEvent', PersonEventAttributes, PersonEventRelationships> { }

/** Person event resource as returned by the client (attributes and relationships at top level) */
export type PersonEventResource = FlattenedResource<
  'PersonEvent',
  PersonEventAttributes,
  PersonEventRelationships,
  PersonEventRelResourceMap,
  CheckInsResourceTypeToRelMap>;

export type PersonEventsList = ListResponse<PersonEventResource>;
export type PersonEventSingle = PersonEventResource;

// ===== PreCheck Resource =====

export interface PreCheckAttributes extends Attributes {
  created_at?: string;
  updated_at?: string;
}

export interface PreCheckRelationships {
  event?: Relationship;
  person?: Relationship;
}

/** Maps PreCheck relationship keys to specific resource types (person is external/People API) */
export interface PreCheckRelResourceMap extends Record<string, ResourceObject<string, any, any> | ResourceObject<string, any, any>[]> {
  event: EventResourceObject;
}

/** Internal JSON:API resource shape; use PreCheckResource for the type returned by the client */
export interface PreCheckResourceObject
  extends ResourceObject<'PreCheck', PreCheckAttributes, PreCheckRelationships> { }

/** Pre-check resource as returned by the client (attributes and relationships at top level) */
export type PreCheckResource = FlattenedResource<
  'PreCheck',
  PreCheckAttributes,
  PreCheckRelationships,
  PreCheckRelResourceMap,
  CheckInsResourceTypeToRelMap>;

export type PreChecksList = ListResponse<PreCheckResource>;
export type PreCheckSingle = PreCheckResource;

// ===== Pass Resource =====

export interface PassAttributes extends Attributes {
  name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PassRelationships {
  // Relationships TBD
}

/** Internal JSON:API resource shape; use PassResource for the type returned by the client */
export interface PassResourceObject
  extends ResourceObject<'Pass', PassAttributes, PassRelationships> { }

/** Pass resource as returned by the client (attributes at top level) */
export type PassResource = FlattenedResource<'Pass', PassAttributes, PassRelationships>;

export type PassesList = ListResponse<PassResource>;
export type PassSingle = PassResource;

// ===== Headcount Resource =====

export interface HeadcountAttributes extends Attributes {
  count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface HeadcountRelationships {
  attendance_type?: Relationship;
  event_time?: Relationship;
}

/** Maps Headcount relationship keys to specific resource types */
export interface HeadcountRelResourceMap extends Record<string, ResourceObject<string, any, any> | ResourceObject<string, any, any>[]> {
  attendance_type: AttendanceTypeResourceObject;
  event_time: EventTimeResourceObject;
}

/** Internal JSON:API resource shape; use HeadcountResource for the type returned by the client */
export interface HeadcountResourceObject
  extends ResourceObject<'Headcount', HeadcountAttributes, HeadcountRelationships> { }

/** Headcount resource as returned by the client (attributes and relationships at top level) */
export type HeadcountResource = FlattenedResource<
  'Headcount',
  HeadcountAttributes,
  HeadcountRelationships,
  HeadcountRelResourceMap,
  CheckInsResourceTypeToRelMap>;

export type HeadcountsList = ListResponse<HeadcountResource>;
export type HeadcountSingle = HeadcountResource;

// ===== AttendanceType Resource =====

export interface AttendanceTypeAttributes extends Attributes {
  name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AttendanceTypeRelationships {
  event?: Relationship;
}

/** Maps AttendanceType relationship keys to specific resource types */
export interface AttendanceTypeRelResourceMap extends Record<string, ResourceObject<string, any, any> | ResourceObject<string, any, any>[]> {
  event: EventResourceObject;
}

/** Internal JSON:API resource shape; use AttendanceTypeResource for the type returned by the client */
export interface AttendanceTypeResourceObject
  extends ResourceObject<'AttendanceType', AttendanceTypeAttributes, AttendanceTypeRelationships> { }

/** Attendance type resource as returned by the client (attributes and relationships at top level) */
export type AttendanceTypeResource = FlattenedResource<
  'AttendanceType',
  AttendanceTypeAttributes,
  AttendanceTypeRelationships,
  AttendanceTypeRelResourceMap,
  CheckInsResourceTypeToRelMap>;

export type AttendanceTypesList = ListResponse<AttendanceTypeResource>;
export type AttendanceTypeSingle = AttendanceTypeResource;

// ===== RosterListPerson Resource =====

export interface RosterListPersonAttributes extends Attributes {
  created_at?: string;
  updated_at?: string;
}

export interface RosterListPersonRelationships {
  person?: Relationship;
  // Additional relationships TBD
}

/** Internal JSON:API resource shape; use RosterListPersonResource for the type returned by the client */
export interface RosterListPersonResourceObject
  extends ResourceObject<'RosterListPerson', RosterListPersonAttributes, RosterListPersonRelationships> { }

/** Roster list person resource as returned by the client (attributes at top level) */
export type RosterListPersonResource = FlattenedResource<'RosterListPerson', RosterListPersonAttributes, RosterListPersonRelationships>;

export type RosterListPersonsList = ListResponse<RosterListPersonResource>;
export type RosterListPersonSingle = RosterListPersonResource;

// ===== Organization Resource =====

export interface OrganizationAttributes extends Attributes {
  name?: string;
  time_zone?: string;
  created_at?: string;
  updated_at?: string;
}

export interface OrganizationRelationships {
  // Relationships TBD
}

/** Internal JSON:API resource shape; use OrganizationResource for the type returned by the client */
export interface OrganizationResourceObject
  extends ResourceObject<'Organization', OrganizationAttributes, OrganizationRelationships> { }

/** Organization resource as returned by the client (attributes at top level) */
export type OrganizationResource = FlattenedResource<'Organization', OrganizationAttributes, OrganizationRelationships>;

export type OrganizationsList = ListResponse<OrganizationResource>;
export type OrganizationSingle = OrganizationResource;

// ===== IntegrationLink Resource =====

export interface IntegrationLinkAttributes extends Attributes {
  integration_type?: string;
  external_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface IntegrationLinkRelationships {
  event?: Relationship;
}

/** Maps IntegrationLink relationship keys to specific resource types */
export interface IntegrationLinkRelResourceMap extends Record<string, ResourceObject<string, any, any> | ResourceObject<string, any, any>[]> {
  event: EventResourceObject;
}

/** Internal JSON:API resource shape; use IntegrationLinkResource for the type returned by the client */
export interface IntegrationLinkResourceObject
  extends ResourceObject<'IntegrationLink', IntegrationLinkAttributes, IntegrationLinkRelationships> { }

/** Integration link resource as returned by the client (attributes and relationships at top level) */
export type IntegrationLinkResource = FlattenedResource<
  'IntegrationLink',
  IntegrationLinkAttributes,
  IntegrationLinkRelationships,
  IntegrationLinkRelResourceMap,
  CheckInsResourceTypeToRelMap>;

export type IntegrationLinksList = ListResponse<IntegrationLinkResource>;
export type IntegrationLinkSingle = IntegrationLinkResource;

// ===== Theme Resource =====

export interface ThemeAttributes extends Attributes {
  name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ThemeRelationships {
  // Relationships TBD
}

/** Internal JSON:API resource shape; use ThemeResource for the type returned by the client */
export interface ThemeResourceObject
  extends ResourceObject<'Theme', ThemeAttributes, ThemeRelationships> { }

/** Theme resource as returned by the client (attributes at top level) */
export type ThemeResource = FlattenedResource<'Theme', ThemeAttributes, ThemeRelationships>;

export type ThemesList = ListResponse<ThemeResource>;
export type ThemeSingle = ThemeResource;

// ===== LocationEventPeriod Resource =====

export interface LocationEventPeriodAttributes extends Attributes {
  created_at?: string;
  updated_at?: string;
}

export interface LocationEventPeriodRelationships {
  location?: Relationship;
  event_period?: Relationship;
  check_ins?: Relationship;
}

/** Maps LocationEventPeriod relationship keys to specific resource types */
export interface LocationEventPeriodRelResourceMap extends Record<string, ResourceObject<string, any, any> | ResourceObject<string, any, any>[]> {
  location: LocationResourceObject;
  event_period: EventPeriodResourceObject;
  check_ins: CheckInResourceObject[];
}

/** Internal JSON:API resource shape; use LocationEventPeriodResource for the type returned by the client */
export interface LocationEventPeriodResourceObject
  extends ResourceObject<'LocationEventPeriod', LocationEventPeriodAttributes, LocationEventPeriodRelationships> { }

/** Location event period resource as returned by the client (attributes and relationships at top level) */
export type LocationEventPeriodResource = FlattenedResource<
  'LocationEventPeriod',
  LocationEventPeriodAttributes,
  LocationEventPeriodRelationships,
  LocationEventPeriodRelResourceMap,
  CheckInsResourceTypeToRelMap>;

export type LocationEventPeriodsList = ListResponse<LocationEventPeriodResource>;
export type LocationEventPeriodSingle = LocationEventPeriodResource;

// ===== LocationEventTime Resource =====

export interface LocationEventTimeAttributes extends Attributes {
  created_at?: string;
  updated_at?: string;
}

export interface LocationEventTimeRelationships {
  location?: Relationship;
  event_time?: Relationship;
}

/** Maps LocationEventTime relationship keys to specific resource types */
export interface LocationEventTimeRelResourceMap extends Record<string, ResourceObject<string, any, any> | ResourceObject<string, any, any>[]> {
  location: LocationResourceObject;
  event_time: EventTimeResourceObject;
}

/** Internal JSON:API resource shape; use LocationEventTimeResource for the type returned by the client */
export interface LocationEventTimeResourceObject
  extends ResourceObject<'LocationEventTime', LocationEventTimeAttributes, LocationEventTimeRelationships> { }

/** Location event time resource as returned by the client (attributes and relationships at top level) */
export type LocationEventTimeResource = FlattenedResource<
  'LocationEventTime',
  LocationEventTimeAttributes,
  LocationEventTimeRelationships,
  LocationEventTimeRelResourceMap,
  CheckInsResourceTypeToRelMap>;

export type LocationEventTimesList = ListResponse<LocationEventTimeResource>;
export type LocationEventTimeSingle = LocationEventTimeResource;

/** Map from resource type name to its relationship map; used as 5th generic of FlattenedResource for nested typing */
export interface CheckInsResourceTypeToRelMap extends Record<string, object> {
  Event: EventRelResourceMap;
  CheckIn: CheckInRelResourceMap;
  Location: LocationRelResourceMap;
  EventPeriod: EventPeriodRelResourceMap;
  EventTime: EventTimeRelResourceMap;
  Station: StationRelResourceMap;
  Label: LabelRelResourceMap;
  EventLabel: EventLabelRelResourceMap;
  LocationLabel: LocationLabelRelResourceMap;
  Option: OptionRelResourceMap;
  CheckInGroup: CheckInGroupRelResourceMap;
  CheckInTime: CheckInTimeRelResourceMap;
  PersonEvent: PersonEventRelResourceMap;
  PreCheck: PreCheckRelResourceMap;
  Headcount: HeadcountRelResourceMap;
  AttendanceType: AttendanceTypeRelResourceMap;
  IntegrationLink: IntegrationLinkRelResourceMap;
  LocationEventPeriod: LocationEventPeriodRelResourceMap;
  LocationEventTime: LocationEventTimeRelResourceMap;
}

