/**
 * Planning Center Check-Ins API Types
 * Based on JSON:API 1.0 specification
 */

import {
  Attributes,
  Paginated,
  Relationship,
  ResourceObject,
  Response,
} from '@rachelallyson/planning-center-base-ts';

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

export interface EventResource
  extends ResourceObject<'Event', EventAttributes, EventRelationships> { }

export type EventsList = Paginated<EventResource>;
export type EventSingle = Response<EventResource>;

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

export interface CheckInResource
  extends ResourceObject<'CheckIn', CheckInAttributes, CheckInRelationships> { }

export type CheckInsList = Paginated<CheckInResource>;
export type CheckInSingle = Response<CheckInResource>;

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

export interface LocationResource
  extends ResourceObject<'Location', LocationAttributes, LocationRelationships> { }

export type LocationsList = Paginated<LocationResource>;
export type LocationSingle = Response<LocationResource>;

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

export interface EventPeriodResource
  extends ResourceObject<'EventPeriod', EventPeriodAttributes, EventPeriodRelationships> { }

export type EventPeriodsList = Paginated<EventPeriodResource>;
export type EventPeriodSingle = Response<EventPeriodResource>;

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
}

export interface EventTimeResource
  extends ResourceObject<'EventTime', EventTimeAttributes, EventTimeRelationships> { }

export type EventTimesList = Paginated<EventTimeResource>;
export type EventTimeSingle = Response<EventTimeResource>;

// ===== Station Resource =====

export interface StationAttributes extends Attributes {
  name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface StationRelationships {
  check_ins?: Relationship;
}

export interface StationResource
  extends ResourceObject<'Station', StationAttributes, StationRelationships> { }

export type StationsList = Paginated<StationResource>;
export type StationSingle = Response<StationResource>;

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

export interface LabelResource
  extends ResourceObject<'Label', LabelAttributes, LabelRelationships> { }

export type LabelsList = Paginated<LabelResource>;
export type LabelSingle = Response<LabelResource>;

// ===== EventLabel Resource =====

export interface EventLabelAttributes extends Attributes {
  created_at?: string;
  updated_at?: string;
}

export interface EventLabelRelationships {
  event?: Relationship;
  label?: Relationship;
}

export interface EventLabelResource
  extends ResourceObject<'EventLabel', EventLabelAttributes, EventLabelRelationships> { }

export type EventLabelsList = Paginated<EventLabelResource>;
export type EventLabelSingle = Response<EventLabelResource>;

// ===== LocationLabel Resource =====

export interface LocationLabelAttributes extends Attributes {
  created_at?: string;
  updated_at?: string;
}

export interface LocationLabelRelationships {
  location?: Relationship;
  label?: Relationship;
}

export interface LocationLabelResource
  extends ResourceObject<'LocationLabel', LocationLabelAttributes, LocationLabelRelationships> { }

export type LocationLabelsList = Paginated<LocationLabelResource>;
export type LocationLabelSingle = Response<LocationLabelResource>;

// ===== Option Resource =====

export interface OptionAttributes extends Attributes {
  name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface OptionRelationships {
  check_ins?: Relationship;
}

export interface OptionResource
  extends ResourceObject<'Option', OptionAttributes, OptionRelationships> { }

export type OptionsList = Paginated<OptionResource>;
export type OptionSingle = Response<OptionResource>;

// ===== CheckInGroup Resource =====

export interface CheckInGroupAttributes extends Attributes {
  name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CheckInGroupRelationships {
  check_ins?: Relationship;
}

export interface CheckInGroupResource
  extends ResourceObject<'CheckInGroup', CheckInGroupAttributes, CheckInGroupRelationships> { }

export type CheckInGroupsList = Paginated<CheckInGroupResource>;
export type CheckInGroupSingle = Response<CheckInGroupResource>;

// ===== CheckInTime Resource =====

export interface CheckInTimeAttributes extends Attributes {
  created_at?: string;
  updated_at?: string;
}

export interface CheckInTimeRelationships {
  check_in?: Relationship;
  event_time?: Relationship;
}

export interface CheckInTimeResource
  extends ResourceObject<'CheckInTime', CheckInTimeAttributes, CheckInTimeRelationships> { }

export type CheckInTimesList = Paginated<CheckInTimeResource>;
export type CheckInTimeSingle = Response<CheckInTimeResource>;

// ===== PersonEvent Resource =====

export interface PersonEventAttributes extends Attributes {
  created_at?: string;
  updated_at?: string;
}

export interface PersonEventRelationships {
  event?: Relationship;
  person?: Relationship;
}

export interface PersonEventResource
  extends ResourceObject<'PersonEvent', PersonEventAttributes, PersonEventRelationships> { }

export type PersonEventsList = Paginated<PersonEventResource>;
export type PersonEventSingle = Response<PersonEventResource>;

// ===== PreCheck Resource =====

export interface PreCheckAttributes extends Attributes {
  created_at?: string;
  updated_at?: string;
}

export interface PreCheckRelationships {
  event?: Relationship;
  person?: Relationship;
}

export interface PreCheckResource
  extends ResourceObject<'PreCheck', PreCheckAttributes, PreCheckRelationships> { }

export type PreChecksList = Paginated<PreCheckResource>;
export type PreCheckSingle = Response<PreCheckResource>;

// ===== Pass Resource =====

export interface PassAttributes extends Attributes {
  name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PassRelationships {
  // Relationships TBD
}

export interface PassResource
  extends ResourceObject<'Pass', PassAttributes, PassRelationships> { }

export type PassesList = Paginated<PassResource>;
export type PassSingle = Response<PassResource>;

// ===== Headcount Resource =====

export interface HeadcountAttributes extends Attributes {
  count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface HeadcountRelationships {
  // Relationships TBD
}

export interface HeadcountResource
  extends ResourceObject<'Headcount', HeadcountAttributes, HeadcountRelationships> { }

export type HeadcountsList = Paginated<HeadcountResource>;
export type HeadcountSingle = Response<HeadcountResource>;

// ===== AttendanceType Resource =====

export interface AttendanceTypeAttributes extends Attributes {
  name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AttendanceTypeRelationships {
  event?: Relationship;
}

export interface AttendanceTypeResource
  extends ResourceObject<'AttendanceType', AttendanceTypeAttributes, AttendanceTypeRelationships> { }

export type AttendanceTypesList = Paginated<AttendanceTypeResource>;
export type AttendanceTypeSingle = Response<AttendanceTypeResource>;

// ===== RosterListPerson Resource =====

export interface RosterListPersonAttributes extends Attributes {
  created_at?: string;
  updated_at?: string;
}

export interface RosterListPersonRelationships {
  person?: Relationship;
  // Additional relationships TBD
}

export interface RosterListPersonResource
  extends ResourceObject<'RosterListPerson', RosterListPersonAttributes, RosterListPersonRelationships> { }

export type RosterListPersonsList = Paginated<RosterListPersonResource>;
export type RosterListPersonSingle = Response<RosterListPersonResource>;

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

export interface OrganizationResource
  extends ResourceObject<'Organization', OrganizationAttributes, OrganizationRelationships> { }

export type OrganizationsList = Paginated<OrganizationResource>;
export type OrganizationSingle = Response<OrganizationResource>;

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

export interface IntegrationLinkResource
  extends ResourceObject<'IntegrationLink', IntegrationLinkAttributes, IntegrationLinkRelationships> { }

export type IntegrationLinksList = Paginated<IntegrationLinkResource>;
export type IntegrationLinkSingle = Response<IntegrationLinkResource>;

// ===== Theme Resource =====

export interface ThemeAttributes extends Attributes {
  name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ThemeRelationships {
  // Relationships TBD
}

export interface ThemeResource
  extends ResourceObject<'Theme', ThemeAttributes, ThemeRelationships> { }

export type ThemesList = Paginated<ThemeResource>;
export type ThemeSingle = Response<ThemeResource>;

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

export interface LocationEventPeriodResource
  extends ResourceObject<'LocationEventPeriod', LocationEventPeriodAttributes, LocationEventPeriodRelationships> { }

export type LocationEventPeriodsList = Paginated<LocationEventPeriodResource>;
export type LocationEventPeriodSingle = Response<LocationEventPeriodResource>;

// ===== LocationEventTime Resource =====

export interface LocationEventTimeAttributes extends Attributes {
  created_at?: string;
  updated_at?: string;
}

export interface LocationEventTimeRelationships {
  location?: Relationship;
  event_time?: Relationship;
}

export interface LocationEventTimeResource
  extends ResourceObject<'LocationEventTime', LocationEventTimeAttributes, LocationEventTimeRelationships> { }

export type LocationEventTimesList = Paginated<LocationEventTimeResource>;
export type LocationEventTimeSingle = Response<LocationEventTimeResource>;

