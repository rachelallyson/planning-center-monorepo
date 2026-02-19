/**
 * Planning Center Check-Ins API Types
 * Based on JSON:API 1.0 specification.
 * Each *Resource is a plain interface (type, id, attributes and resolved relationships at top level).
 */

import type { Links, Meta, Relationship } from '@rachelallyson/planning-center-base-ts';
import type { ListResponse } from '@rachelallyson/planning-center-base-ts';

export type { ListResponse };

/**
 * Minimal Person shape for Check-Ins association endpoints (getPerson, getCheckedInBy, getCheckedOutBy).
 * Full Person type lives in @rachelallyson/planning-center-people-ts.
 */
export interface PersonStub {
  type: 'Person';
  id: string;
  links?: Links;
  meta?: Meta;
  [key: string]: string | number | boolean | null | object | object[] | undefined;
}

// ===== Event Resource =====

/** @see docs/public/vertices/check-ins/vertices/event.html */
export interface EventAttributes {
  app_source?: string;
  archived_at?: string | null;
  created_at?: string;
  enable_services_integration?: boolean;
  frequency?: string;
  integration_key?: string | null;
  location_times_enabled?: boolean;
  name?: string;
  pre_select_enabled?: boolean;
  updated_at?: string;
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

/** Event relationship keys with resolved *Resource types (output of getSingle/getList) */
export interface EventRelOutputs {
  attendance_types?: AttendanceTypeResource[];
  check_ins?: CheckInResource[];
  current_event_times?: EventTimeResource[];
  event_labels?: EventLabelResource[];
  event_periods?: EventPeriodResource[];
  integration_links?: IntegrationLinkResource[];
  locations?: LocationResource[];
  person_events?: PersonEventResource[];
}

/** Event resource as returned by the client (attributes and relationships at top level) */
export interface EventResource extends EventAttributes, EventRelOutputs {
  type: 'Event';
  id: string;
  links?: Links;
  meta?: Meta;
}

export type EventsList = ListResponse<EventResource>;
export type EventSingle = EventResource;

// ===== CheckIn Resource =====

/** @see docs/public/vertices/check-ins/vertices/check_in.html */
export interface CheckInAttributes {
  checked_out_at?: string | null;
  confirmed_at?: string | null;
  created_at?: string;
  emergency_contact_name?: string | null;
  emergency_contact_phone_number?: string | null;
  first_name?: string;
  kind?: string;
  last_name?: string;
  medical_notes?: string | null;
  number?: number;
  one_time_guest?: boolean;
  security_code?: string;
  updated_at?: string;
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

/** Check-in relationship keys with resolved *Resource types. Person/checked_in_by/checked_out_by are from People API. */
export interface CheckInRelOutputs {
  check_in_group?: CheckInGroupResource | null;
  check_in_times?: CheckInTimeResource[];
  checked_in_at?: StationResource | null;
  checked_in_by?: PersonStub | null;
  checked_out_by?: PersonStub | null;
  event?: EventResource | null;
  event_period?: EventPeriodResource | null;
  event_times?: EventTimeResource[];
  locations?: LocationResource[];
  options?: OptionResource[];
  person?: PersonStub | null;
}

/** Check-in resource as returned by the client (attributes and relationships at top level) */
export interface CheckInResource extends CheckInAttributes, CheckInRelOutputs {
  type: 'CheckIn';
  id: string;
  links?: Links;
  meta?: Meta;
}

export type CheckInsList = ListResponse<CheckInResource>;
export type CheckInSingle = CheckInResource;

// ===== Location Resource =====

/** @see docs/public/vertices/check-ins/vertices/location.html */
export interface LocationAttributes {
  created_at?: string;
  name?: string;
  updated_at?: string;
}

export interface LocationRelationships {
  event?: Relationship;
  location_event_periods?: Relationship;
  location_event_times?: Relationship;
  location_labels?: Relationship;
}

/** Location relationship keys with resolved *Resource types */
export interface LocationRelOutputs {
  event?: EventResource | null;
  location_event_periods?: LocationEventPeriodResource[];
  location_event_times?: LocationEventTimeResource[];
  location_labels?: LocationLabelResource[];
}

/** Location resource as returned by the client (attributes and relationships at top level) */
export interface LocationResource extends LocationAttributes, LocationRelOutputs {
  type: 'Location';
  id: string;
  links?: Links;
  meta?: Meta;
}

export type LocationsList = ListResponse<LocationResource>;
export type LocationSingle = LocationResource;

// ===== EventPeriod Resource =====

/** @see docs/public/vertices/check-ins/vertices/event_period.html */
export interface EventPeriodAttributes {
  created_at?: string;
  ends_at?: string;
  guest_count?: number;
  note?: string | null;
  regular_count?: number;
  starts_at?: string;
  updated_at?: string;
  volunteer_count?: number;
}

export interface EventPeriodRelationships {
  event?: Relationship;
  event_times?: Relationship;
  check_ins?: Relationship;
  location_event_periods?: Relationship;
}

/** EventPeriod relationship keys with resolved *Resource types */
export interface EventPeriodRelOutputs {
  event?: EventResource | null;
  event_times?: EventTimeResource[];
  check_ins?: CheckInResource[];
  location_event_periods?: LocationEventPeriodResource[];
}

/** Event period resource as returned by the client (attributes and relationships at top level) */
export interface EventPeriodResource extends EventPeriodAttributes, EventPeriodRelOutputs {
  type: 'EventPeriod';
  id: string;
  links?: Links;
  meta?: Meta;
}

export type EventPeriodsList = ListResponse<EventPeriodResource>;
export type EventPeriodSingle = EventPeriodResource;

// ===== EventTime Resource =====

/** @see docs/public/vertices/check-ins/vertices/event_time.html */
export interface EventTimeAttributes {
  created_at?: string;
  ends_at?: string;
  starts_at?: string;
  updated_at?: string;
}

export interface EventTimeRelationships {
  event?: Relationship;
  event_period?: Relationship;
  location_event_times?: Relationship;
  check_ins?: Relationship;
  headcounts?: Relationship;
}

/** EventTime relationship keys with resolved *Resource types */
export interface EventTimeRelOutputs {
  event?: EventResource | null;
  event_period?: EventPeriodResource | null;
  location_event_times?: LocationEventTimeResource[];
  check_ins?: CheckInResource[];
  headcounts?: HeadcountResource[];
}

/** Event time resource as returned by the client (attributes and relationships at top level) */
export interface EventTimeResource extends EventTimeAttributes, EventTimeRelOutputs {
  type: 'EventTime';
  id: string;
  links?: Links;
  meta?: Meta;
}

export type EventTimesList = ListResponse<EventTimeResource>;
export type EventTimeSingle = EventTimeResource;

// ===== Station Resource =====

/** @see docs/public/vertices/check-ins/vertices/station.html */
export interface StationAttributes {
  created_at?: string;
  name?: string;
  updated_at?: string;
}

export interface StationRelationships {
  check_ins?: Relationship;
}

/** Station relationship keys with resolved *Resource types */
export interface StationRelOutputs {
  check_ins?: CheckInResource[];
  event?: EventResource | null;
  location?: LocationResource | null;
}

/** Station resource as returned by the client (attributes and relationships at top level) */
export interface StationResource extends StationAttributes, StationRelOutputs {
  type: 'Station';
  id: string;
  links?: Links;
  meta?: Meta;
}

export type StationsList = ListResponse<StationResource>;
export type StationSingle = StationResource;

// ===== Label Resource =====

/** @see docs/public/vertices/check-ins/vertices/label.html */
export interface LabelAttributes {
  created_at?: string;
  name?: string;
  updated_at?: string;
}

export interface LabelRelationships {
  event_labels?: Relationship;
  location_labels?: Relationship;
}

/** Label relationship keys with resolved *Resource types */
export interface LabelRelOutputs {
  event_labels?: EventLabelResource[];
  location_labels?: LocationLabelResource[];
}

/** Label resource as returned by the client (attributes and relationships at top level) */
export interface LabelResource extends LabelAttributes, LabelRelOutputs {
  type: 'Label';
  id: string;
  links?: Links;
  meta?: Meta;
}

export type LabelsList = ListResponse<LabelResource>;
export type LabelSingle = LabelResource;

// ===== EventLabel Resource =====

/** @see docs/public/vertices/check-ins/vertices/event_label.html */
export interface EventLabelAttributes {
  created_at?: string;
  for_guest?: boolean;
  for_regular?: boolean;
  for_volunteer?: boolean;
  quantity?: number;
  updated_at?: string;
}

export interface EventLabelRelationships {
  event?: Relationship;
  label?: Relationship;
}

/** EventLabel relationship keys with resolved *Resource types */
export interface EventLabelRelOutputs {
  event?: EventResource | null;
  label?: LabelResource | null;
}

/** Event label resource as returned by the client (attributes and relationships at top level) */
export interface EventLabelResource extends EventLabelAttributes, EventLabelRelOutputs {
  type: 'EventLabel';
  id: string;
  links?: Links;
  meta?: Meta;
}

export type EventLabelsList = ListResponse<EventLabelResource>;
export type EventLabelSingle = EventLabelResource;

// ===== LocationLabel Resource =====

/** @see docs/public/vertices/check-ins/vertices/location_label.html */
export interface LocationLabelAttributes {
  created_at?: string;
  for_guest?: boolean;
  for_regular?: boolean;
  for_volunteer?: boolean;
  quantity?: number;
  updated_at?: string;
}

export interface LocationLabelRelationships {
  location?: Relationship;
  label?: Relationship;
}

/** LocationLabel relationship keys with resolved *Resource types */
export interface LocationLabelRelOutputs {
  location?: LocationResource | null;
  label?: LabelResource | null;
}

/** Location label resource as returned by the client (attributes and relationships at top level) */
export interface LocationLabelResource extends LocationLabelAttributes, LocationLabelRelOutputs {
  type: 'LocationLabel';
  id: string;
  links?: Links;
  meta?: Meta;
}

export type LocationLabelsList = ListResponse<LocationLabelResource>;
export type LocationLabelSingle = LocationLabelResource;

// ===== Option Resource =====

/** @see docs/public/vertices/check-ins/vertices/option.html */
export interface OptionAttributes {
  created_at?: string;
  name?: string;
  updated_at?: string;
}

export interface OptionRelationships {
  check_ins?: Relationship;
}

/** Option relationship keys with resolved *Resource types */
export interface OptionRelOutputs {
  check_ins?: CheckInResource[];
}

/** Option resource as returned by the client (attributes and relationships at top level) */
export interface OptionResource extends OptionAttributes, OptionRelOutputs {
  type: 'Option';
  id: string;
  links?: Links;
  meta?: Meta;
}

export type OptionsList = ListResponse<OptionResource>;
export type OptionSingle = OptionResource;

// ===== CheckInGroup Resource =====

/** @see docs/public/vertices/check-ins/vertices/check_in_group.html */
export interface CheckInGroupAttributes {
  created_at?: string;
  name?: string;
  updated_at?: string;
}

export interface CheckInGroupRelationships {
  check_ins?: Relationship;
}

/** CheckInGroup relationship keys with resolved *Resource types */
export interface CheckInGroupRelOutputs {
  check_ins?: CheckInResource[];
}

/** Check-in group resource as returned by the client (attributes and relationships at top level) */
export interface CheckInGroupResource extends CheckInGroupAttributes, CheckInGroupRelOutputs {
  type: 'CheckInGroup';
  id: string;
  links?: Links;
  meta?: Meta;
}

export type CheckInGroupsList = ListResponse<CheckInGroupResource>;
export type CheckInGroupSingle = CheckInGroupResource;

// ===== CheckInTime Resource =====

/** @see docs/public/vertices/check-ins/vertices/check_in_time.html */
export interface CheckInTimeAttributes {
  created_at?: string;
  updated_at?: string;
}

export interface CheckInTimeRelationships {
  check_in?: Relationship;
  event_time?: Relationship;
}

/** CheckInTime relationship keys with resolved *Resource types */
export interface CheckInTimeRelOutputs {
  check_in?: CheckInResource | null;
  event_time?: EventTimeResource | null;
}

/** Check-in time resource as returned by the client (attributes and relationships at top level) */
export interface CheckInTimeResource extends CheckInTimeAttributes, CheckInTimeRelOutputs {
  type: 'CheckInTime';
  id: string;
  links?: Links;
  meta?: Meta;
}

export type CheckInTimesList = ListResponse<CheckInTimeResource>;
export type CheckInTimeSingle = CheckInTimeResource;

// ===== PersonEvent Resource =====

/** @see docs/public/vertices/check-ins/vertices/person_event.html */
export interface PersonEventAttributes {
  created_at?: string;
  updated_at?: string;
}

export interface PersonEventRelationships {
  event?: Relationship;
  person?: Relationship;
}

/** PersonEvent relationship keys with resolved *Resource types (person is from People API) */
export interface PersonEventRelOutputs {
  event?: EventResource | null;
  person?: PersonStub | null;
}

/** Person event resource as returned by the client (attributes and relationships at top level) */
export interface PersonEventResource extends PersonEventAttributes, PersonEventRelOutputs {
  type: 'PersonEvent';
  id: string;
  links?: Links;
  meta?: Meta;
}

export type PersonEventsList = ListResponse<PersonEventResource>;
export type PersonEventSingle = PersonEventResource;

// ===== PreCheck Resource =====

/** @see docs/public/vertices/check-ins/vertices/pre_check.html */
export interface PreCheckAttributes {
  created_at?: string;
  updated_at?: string;
}

export interface PreCheckRelationships {
  event?: Relationship;
  person?: Relationship;
}

/** PreCheck relationship keys with resolved *Resource types (person is from People API) */
export interface PreCheckRelOutputs {
  event?: EventResource | null;
  person?: PersonStub | null;
}

/** Pre-check resource as returned by the client (attributes and relationships at top level) */
export interface PreCheckResource extends PreCheckAttributes, PreCheckRelOutputs {
  type: 'PreCheck';
  id: string;
  links?: Links;
  meta?: Meta;
}

export type PreChecksList = ListResponse<PreCheckResource>;
export type PreCheckSingle = PreCheckResource;

// ===== Pass Resource =====

/** @see docs/public/vertices/check-ins/vertices/pass.html */
export interface PassAttributes {
  code?: string;
  created_at?: string;
  kind?: string;
  updated_at?: string;
}

/** Pass resource as returned by the client (attributes at top level) */
export interface PassResource extends PassAttributes {
  type: 'Pass';
  id: string;
  links?: Links;
  meta?: Meta;
}

export type PassesList = ListResponse<PassResource>;
export type PassSingle = PassResource;

// ===== Headcount Resource =====

/** @see docs/public/vertices/check-ins/vertices/headcount.html */
export interface HeadcountAttributes {
  count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface HeadcountRelationships {
  attendance_type?: Relationship;
  event_time?: Relationship;
}

/** Headcount relationship keys with resolved *Resource types */
export interface HeadcountRelOutputs {
  attendance_type?: AttendanceTypeResource | null;
  event_time?: EventTimeResource | null;
}

/** Headcount resource as returned by the client (attributes and relationships at top level) */
export interface HeadcountResource extends HeadcountAttributes, HeadcountRelOutputs {
  type: 'Headcount';
  id: string;
  links?: Links;
  meta?: Meta;
}

export type HeadcountsList = ListResponse<HeadcountResource>;
export type HeadcountSingle = HeadcountResource;

// ===== AttendanceType Resource =====

/** @see docs/public/vertices/check-ins/vertices/attendance_type.html */
export interface AttendanceTypeAttributes {
  created_at?: string;
  name?: string;
  updated_at?: string;
}

export interface AttendanceTypeRelationships {
  event?: Relationship;
}

/** AttendanceType relationship keys with resolved *Resource types */
export interface AttendanceTypeRelOutputs {
  event?: EventResource | null;
}

/** Attendance type resource as returned by the client (attributes and relationships at top level) */
export interface AttendanceTypeResource extends AttendanceTypeAttributes, AttendanceTypeRelOutputs {
  type: 'AttendanceType';
  id: string;
  links?: Links;
  meta?: Meta;
}

export type AttendanceTypesList = ListResponse<AttendanceTypeResource>;
export type AttendanceTypeSingle = AttendanceTypeResource;

// ===== RosterListPerson Resource =====

/** @see docs/public/vertices/check-ins/vertices/roster_list_person.html */
export interface RosterListPersonAttributes {
  created_at?: string;
  updated_at?: string;
}

export interface RosterListPersonRelationships {
  person?: Relationship;
}

/** RosterListPerson relationship keys (person is from People API) */
export interface RosterListPersonRelOutputs {
  person?: PersonStub | null;
}

/** Roster list person resource as returned by the client (attributes at top level) */
export interface RosterListPersonResource extends RosterListPersonAttributes, RosterListPersonRelOutputs {
  type: 'RosterListPerson';
  id: string;
  links?: Links;
  meta?: Meta;
}

export type RosterListPersonsList = ListResponse<RosterListPersonResource>;
export type RosterListPersonSingle = RosterListPersonResource;

// ===== Organization Resource =====

/** @see docs/public/vertices/check-ins/vertices/organization.html */
export interface OrganizationAttributes {
  avatar_url?: string | null;
  created_at?: string;
  daily_check_ins?: number;
  date_format_pattern?: string;
  name?: string;
  time_zone?: string;
  updated_at?: string;
}

/** Organization resource as returned by the client (attributes at top level) */
export interface OrganizationResource extends OrganizationAttributes {
  type: 'Organization';
  id: string;
  links?: Links;
  meta?: Meta;
}

export type OrganizationsList = ListResponse<OrganizationResource>;
export type OrganizationSingle = OrganizationResource;

// ===== IntegrationLink Resource =====

/** @see docs/public/vertices/check-ins/vertices/integration_link.html */
export interface IntegrationLinkAttributes {
  created_at?: string;
  external_id?: string;
  integration_type?: string;
  updated_at?: string;
}

export interface IntegrationLinkRelationships {
  event?: Relationship;
}

/** IntegrationLink relationship keys with resolved *Resource types */
export interface IntegrationLinkRelOutputs {
  event?: EventResource | null;
}

/** Integration link resource as returned by the client (attributes and relationships at top level) */
export interface IntegrationLinkResource extends IntegrationLinkAttributes, IntegrationLinkRelOutputs {
  type: 'IntegrationLink';
  id: string;
  links?: Links;
  meta?: Meta;
}

export type IntegrationLinksList = ListResponse<IntegrationLinkResource>;
export type IntegrationLinkSingle = IntegrationLinkResource;

// ===== Theme Resource =====

/** @see docs/public/vertices/check-ins/vertices/theme.html */
export interface ThemeAttributes {
  background_color?: string;
  color?: string;
  created_at?: string;
  /** API may return string URL or an image object (e.g. { url }). */
  image?: string | null | Record<string, string | number | boolean | null | object>;
  /** API may return null when no thumbnail. */
  image_thumbnail?: string | null;
  mode?: string;
  name?: string;
  text_color?: string;
  updated_at?: string;
}

/** Theme resource as returned by the client (attributes at top level) */
export interface ThemeResource extends ThemeAttributes {
  type: 'Theme';
  id: string;
  links?: Links;
  meta?: Meta;
}

export type ThemesList = ListResponse<ThemeResource>;
export type ThemeSingle = ThemeResource;

// ===== LocationEventPeriod Resource =====

/** @see docs/public/vertices/check-ins/vertices/location_event_period.html */
export interface LocationEventPeriodAttributes {
  created_at?: string;
  updated_at?: string;
}

export interface LocationEventPeriodRelationships {
  location?: Relationship;
  event_period?: Relationship;
  check_ins?: Relationship;
}

/** LocationEventPeriod relationship keys with resolved *Resource types */
export interface LocationEventPeriodRelOutputs {
  location?: LocationResource | null;
  event_period?: EventPeriodResource | null;
  check_ins?: CheckInResource[];
}

/** Location event period resource as returned by the client (attributes and relationships at top level) */
export interface LocationEventPeriodResource extends LocationEventPeriodAttributes, LocationEventPeriodRelOutputs {
  type: 'LocationEventPeriod';
  id: string;
  links?: Links;
  meta?: Meta;
}

export type LocationEventPeriodsList = ListResponse<LocationEventPeriodResource>;
export type LocationEventPeriodSingle = LocationEventPeriodResource;

// ===== LocationEventTime Resource =====

/** @see docs/public/vertices/check-ins/vertices/location_event_time.html */
export interface LocationEventTimeAttributes {
  created_at?: string;
  updated_at?: string;
}

export interface LocationEventTimeRelationships {
  location?: Relationship;
  event_time?: Relationship;
}

/** LocationEventTime relationship keys with resolved *Resource types */
export interface LocationEventTimeRelOutputs {
  location?: LocationResource | null;
  event_time?: EventTimeResource | null;
}

/** Location event time resource as returned by the client (attributes and relationships at top level) */
export interface LocationEventTimeResource extends LocationEventTimeAttributes, LocationEventTimeRelOutputs {
  type: 'LocationEventTime';
  id: string;
  links?: Links;
  meta?: Meta;
}

export type LocationEventTimesList = ListResponse<LocationEventTimeResource>;
export type LocationEventTimeSingle = LocationEventTimeResource;


