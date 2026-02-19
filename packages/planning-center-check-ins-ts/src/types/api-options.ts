/**
 * Strict API option types per Check-Ins API vertex (where, include, filter, order)
 * and composed list/single options (GetPageOptions, GetAllOptions, GetByIdOptions).
 * Aligns with https://developer.planning.center/docs/#/apps/check-ins/2025-05-28/vertices/
 */

import type { QueryOptions, PaginationOptions } from '@rachelallyson/planning-center-base-ts';

// =============================================================================
// Building blocks (Where, Include, Order, Filter) per vertex
// =============================================================================

// ===== Event vertex (GET /events, GET /events/:id) =====
/** Query By for Event list (where[field]). Docs: id (primary_key), name (string). */
export type EventWhereClause = {
    id?: string | string[];
    name?: string;
};

/** Filter By for Event list (sent as param=true). */
export type EventFilter =
    | 'archived'
    | 'for_campus'
    | 'for_headcounts'
    | 'for_registrations'
    | 'not_archived';

/** Can Include for Event (single + list). */
export type EventInclude = 'attendance_types';

/** Order By for Event list; prefix with - for descending. */
export type EventOrderField = 'created_at' | 'name';

// ===== CheckIn vertex =====
/** Filter By for CheckIn list (GET /check_ins, GET /events/{id}/check_ins). Sent as param=true. */
export type CheckInFilter =
    | 'attendee'
    | 'checked_out'
    | 'first_time'
    | 'guest'
    | 'not_checked_out'
    | 'not_one_time_guest'
    | 'one_time_guest'
    | 'regular'
    | 'volunteer';

/** Can Include for CheckIn (single + list). */
export type CheckInInclude =
    | 'check_in_times'
    | 'checked_in_at'
    | 'event'
    | 'event_period'
    | 'event_times'
    | 'locations';

/** Order By for CheckIn list; prefix with - for descending. */
export type CheckInOrderField =
    | 'checked_out_at'
    | 'created_at'
    | 'first_name'
    | 'last_name'
    | 'number'
    | 'updated_at';

/** Query By for CheckIn list (where[field]). Docs: account_center_person_id (integer), created_at, security_code, updated_at (date_time). */
export type CheckInWhereClause = {
    account_center_person_id?: number;
    created_at?: string;
    security_code?: string;
    updated_at?: string;
};

/** Query By for EventTime list (where[field]). Docs: created_at, updated_at (date_time). */
export interface EventTimeWhereClause {
    created_at?: string;
    updated_at?: string;
}

/** Can Include for EventTime (single + list). Nested: headcounts.attendance_type. */
export type EventTimeInclude = 'event' | 'event_period' | 'headcounts' | 'headcounts.attendance_type';

/** Order By for EventTime list (prefix with - for descending). */
export type EventTimeOrderField = 'shows_at' | 'starts_at';

/** Query By for Location list (where[field]). Not in Location vertex URL Parameters; kept for API compatibility. @see https://developer.planning.center/docs/#/apps/check-ins/2025-05-28/vertices/location */
/** Query By for Location list. Docs: no Query By on Location vertex. */
export type LocationWhereClause = Record<string, never>;

/** Can Include for Location (single + list). */
export type LocationInclude = 'event' | 'locations';

/** Order By for Location list; prefix with - for descending. */
export type LocationOrderField = 'kind' | 'name' | 'position';

/** Query By for Station list (where[field]). Docs: no Query By on Station vertex. */
export type StationWhereClause = Record<string, never>;

/** Can Include for Station (single + list). */
export type StationInclude = 'event' | 'location';

/** Order By for Station list; prefix with - for descending. Docs: no Order By on Station vertex. */
export type StationOrderField = never;

/** Query By for AttendanceType list (where[field]). Docs: id (primary_key), name (string). @see https://developer.planning.center/docs/#/apps/check-ins/2025-05-28/vertices/attendance_type */
export interface AttendanceTypeWhereClause {
    id?: string;
    name?: string;
}

/** Can Include for AttendanceType (single + list). Docs: event (Assignable: create and update). */
export type AttendanceTypeInclude = 'event';

/** Order By for AttendanceType list. Docs: no Order By on AttendanceType vertex. */
export type AttendanceTypeOrderField = never;

/** Query By for Headcount list (where[field]). Docs: created_at, updated_at (date_time). @see https://developer.planning.center/docs/#/apps/check-ins/2025-05-28/vertices/headcount */
export interface HeadcountWhereClause {
    created_at?: string;
    updated_at?: string;
}

/** Can Include for Headcount (single + list). Docs: attendance_type, event_time (Assignable: create and update). */
export type HeadcountInclude = 'attendance_type' | 'event_time';

/** Order By for Headcount list; prefix with - for descending. Docs: created_at, total, updated_at. */
export type HeadcountOrderField = 'created_at' | 'total' | 'updated_at';

/** Query By for IntegrationLink list (where[field]). Docs: remote_gid (string). No Can Include or Order By in URL Parameters. @see https://developer.planning.center/docs/#/apps/check-ins/2025-05-28/vertices/integration_link */
export interface IntegrationLinkWhereClause {
    remote_gid?: string;
}

/** Can Include for IntegrationLink. Docs: no Can Include on IntegrationLink vertex. */
export type IntegrationLinkInclude = never;

/** Query By for Label list (where[field]). Not in Label URL Parameters (only Pagination). @see https://developer.planning.center/docs/#/apps/check-ins/2025-05-28/vertices/label */
export type LabelWhereClause = Record<string, never>;

/** Can Include for Label. Docs: no Can Include on Label vertex. */
export type LabelInclude = never;

/** Order By for Label list. Docs: no Order By on Label vertex. */
export type LabelOrderField = never;

/** Query By for Option list (where[field]). Not in Option URL Parameters (only Can Include, Pagination). @see https://developer.planning.center/docs/#/apps/check-ins/2025-05-28/vertices/option */
export type OptionWhereClause = Record<string, never>;

/** Can Include for Option. Docs: label (include associated label). */
export type OptionInclude = 'label';

/** Order By for Option list. Docs: no Order By on Option vertex. */
export type OptionOrderField = never;

/** Query By for PreCheck list (where[field]). Not in PreCheck URL Parameters (only Pagination). @see https://developer.planning.center/docs/#/apps/check-ins/2025-05-28/vertices/pre_check */
export type PreCheckWhereClause = Record<string, never>;

/** Can Include for PreCheck. Docs: no Can Include on PreCheck vertex. */
export type PreCheckInclude = never;

/** Filter By for CheckInGroup list (GET /stations/{id}/check_in_groups). Sent as param=true. */
export type CheckInGroupFilter = 'canceled' | 'printed' | 'ready' | 'skipped';

/** Query By for CheckInGroup list (where[field]). Not in CheckInGroup URL Parameters (Can Include, Pagination, Filter By). @see https://developer.planning.center/docs/#/apps/check-ins/2025-05-28/vertices/check_in_group */
export type CheckInGroupWhereClause = Record<string, never>;

/** Can Include for CheckInGroup. */
export type CheckInGroupInclude = 'check_ins' | 'event_period';

/** Order By for CheckInGroup list. Docs: no Order By on CheckInGroup vertex. */
export type CheckInGroupOrderField = never;

/** Query By for RosterListPerson list (where[field]). Not on RosterListPerson page; URL Parameters: Pagination only. @see https://developer.planning.center/docs/#/apps/check-ins/2025-05-28/vertices/roster_list_person */
export type RosterListPersonWhereClause = Record<string, never>;

/** Can Include for RosterListPerson. Not documented for RosterListPerson (URL Parameters: Pagination only). */
export type RosterListPersonInclude = never;

/** Query By for Theme list (where[field]). Not on Theme page; URL Parameters: Pagination only. @see https://developer.planning.center/docs/#/apps/check-ins/2025-05-28/vertices/theme */
export type ThemeWhereClause = Record<string, never>;

/** Order By for Theme list. Docs: no Order By on Theme vertex. */
export type ThemeOrderField = never;

/** Query By for Pass list (where[field]). Docs: code (where[code], string). @see https://developer.planning.center/docs/#/apps/check-ins/2025-05-28/vertices/pass */
export interface PassWhereClause {
    code?: string;
}

/** Can Include for Pass. Docs: person (include associated person). */
export type PassInclude = 'person';

/** Order By for Pass list. Docs: no Order By on Pass vertex. */
export type PassOrderField = never;

/** Order By for RosterListPerson list. Docs: no Order By on RosterListPerson vertex. */
export type RosterListPersonOrderField = never;

/** Order By for EventLabel list. Docs: no Order By on EventLabel vertex. */
export type EventLabelOrderField = never;

/** Order By for PersonEvent list. Docs: no Order By on PersonEvent vertex. */
export type PersonEventOrderField = never;

// ===== Event sub-resources (under /events/{id}/...) =====

/** Query By for EventLabel list (GET /events/{id}/event_labels). Not on EventLabel page; URL Parameters: Can Include, Pagination only. @see https://developer.planning.center/docs/#/apps/check-ins/2025-05-28/vertices/event_label */
export type EventLabelWhereClause = Record<string, never>;

/** Can Include for EventLabel. */
export type EventLabelInclude = 'event' | 'label';

/** Query By for EventPeriod list (GET /events/{id}/event_periods). Docs: ends_at (where[ends_at], date_time), starts_at (where[starts_at], date_time). @see https://developer.planning.center/docs/#/apps/check-ins/2025-05-28/vertices/event_period */
export interface EventPeriodWhereClause {
    ends_at?: string;
    starts_at?: string;
}

/** Can Include for EventPeriod. Docs: event, event_times (include associated event/event_times). */
export type EventPeriodInclude = 'event' | 'event_times';

/** Order By for EventPeriod list; prefix with - for descending. Docs: starts_at. */
export type EventPeriodOrderField = 'starts_at';

/** Query By for PersonEvent list (GET /events/{id}/person_events). Not on PersonEvent page; URL Parameters: Can Include, Pagination only. @see https://developer.planning.center/docs/#/apps/check-ins/2025-05-28/vertices/person_event */
export type PersonEventWhereClause = Record<string, never>;

/** Can Include for PersonEvent. */
export type PersonEventInclude = 'event' | 'first_check_in';

// =============================================================================
// Composed options (GetPage, GetAll, GetById and nested list options)
// =============================================================================

// ----- Events -----
/** Params for events getPage(). */
export interface EventsGetPageOptions extends QueryOptions {
    where?: EventWhereClause;
    filter?: EventFilter[];
    include?: EventInclude[];
    order?: EventOrderField | `-${EventOrderField}`;
    per_page?: number;
    page?: number;
}

/** Params for events getAll(). */
export type EventsGetAllOptions = EventsGetPageOptions & PaginationOptions;

/** Params for event getById(). */
export type EventGetByIdOptions = { include?: EventInclude[] };

/** Params for getCheckIns(eventId) – single page. */
export interface EventCheckInsGetPageOptions extends QueryOptions {
    filter?: CheckInFilter[];
    where?: CheckInWhereClause;
    include?: CheckInInclude[];
    order?: CheckInOrderField | `-${CheckInOrderField}`;
    per_page?: number;
    page?: number;
}

/** Params for getAllCheckIns(eventId) if added – all pages. */
export type EventCheckInsGetAllOptions = EventCheckInsGetPageOptions & PaginationOptions;

/** Params for getAttendanceTypes(eventId). */
export interface EventGetAttendanceTypesGetPageOptions extends QueryOptions {
    where?: AttendanceTypeWhereClause;
    include?: AttendanceTypeInclude[];
    per_page?: number;
    page?: number;
}

/** Params for getCurrentEventTimes(eventId). */
export interface EventGetCurrentEventTimesGetPageOptions extends QueryOptions {
    where?: EventTimeWhereClause;
    include?: EventTimeInclude[];
    order?: EventTimeOrderField | `-${EventTimeOrderField}`;
    per_page?: number;
    page?: number;
}

/** Params for getEventLabels(eventId). */
export interface EventGetEventLabelsGetPageOptions extends QueryOptions {
    where?: EventLabelWhereClause;
    include?: EventLabelInclude[];
    order?: EventLabelOrderField | `-${EventLabelOrderField}`;
    per_page?: number;
    page?: number;
}

/** Params for getPersonEvents(eventId). */
export interface EventGetPersonEventsGetPageOptions extends QueryOptions {
    where?: PersonEventWhereClause;
    include?: PersonEventInclude[];
    order?: PersonEventOrderField | `-${PersonEventOrderField}`;
    per_page?: number;
    page?: number;
}

/** Params for getEventPeriods(eventId). */
export interface EventGetEventPeriodsGetPageOptions extends QueryOptions {
    where?: EventPeriodWhereClause;
    include?: EventPeriodInclude[];
    order?: EventPeriodOrderField | `-${EventPeriodOrderField}`;
    per_page?: number;
    page?: number;
}

/** Params for getAllEventPeriods(eventId). */
export type EventGetAllEventPeriodsOptions = EventGetEventPeriodsGetPageOptions & PaginationOptions;

/** Params for getEventTimesForPeriod(eventId, periodId). */
export interface EventGetEventTimesForPeriodGetPageOptions extends QueryOptions {
    where?: EventTimeWhereClause;
    include?: EventTimeInclude[];
    order?: EventTimeOrderField | `-${EventTimeOrderField}`;
    per_page?: number;
    page?: number;
}

/** Params for getIntegrationLinks(eventId). */
export interface EventGetIntegrationLinksGetPageOptions extends QueryOptions {
    where?: IntegrationLinkWhereClause;
    include?: IntegrationLinkInclude[];
    per_page?: number;
    page?: number;
}

/** Params for getLocations(eventId). */
export interface EventGetLocationsGetPageOptions extends QueryOptions {
    where?: LocationWhereClause;
    include?: LocationInclude[];
    per_page?: number;
    page?: number;
}

// ----- Check-ins -----
/** Params for check-ins getPage(). */
export interface CheckInsGetPageOptions extends QueryOptions {
    where?: CheckInWhereClause;
    include?: CheckInInclude[];
    order?: CheckInOrderField | `-${CheckInOrderField}` | string;
    filter?: CheckInFilter[];
    per_page?: number;
    page?: number;
}

/** Params for check-ins getAll(). */
export type CheckInsGetAllOptions = CheckInsGetPageOptions & PaginationOptions;

/** Params for getById (single check-in). Can Include only. */
export type CheckInGetByIdOptions = { include?: CheckInInclude[] };

/** Params for getEventTimes(checkInId). */
export interface CheckInGetEventTimesGetPageOptions extends QueryOptions {
    where?: EventTimeWhereClause;
    include?: EventTimeInclude[];
    order?: EventTimeOrderField | `-${EventTimeOrderField}`;
    per_page?: number;
    page?: number;
}

// ----- Check-in groups -----
/** Params for check-in-groups getPage(stationId) – list under a station. Filter By: canceled, printed, ready, skipped. */
export interface CheckInGroupsGetPageOptions extends QueryOptions {
    where?: CheckInGroupWhereClause;
    include?: CheckInGroupInclude[];
    order?: CheckInGroupOrderField | `-${CheckInGroupOrderField}`;
    filter?: CheckInGroupFilter[];
    per_page?: number;
    page?: number;
}

/** Params for check-in-groups getAll(stationId). */
export type CheckInGroupsGetAllOptions = CheckInGroupsGetPageOptions & PaginationOptions;

/** Params for getById (single check-in group). */
export type CheckInGroupGetByIdOptions = { include?: CheckInGroupInclude[] };

// ----- Event times -----
/** Params for event-times getPage(). */
export interface EventTimesGetPageOptions extends QueryOptions {
    where?: EventTimeWhereClause;
    include?: EventTimeInclude[];
    order?: EventTimeOrderField | `-${EventTimeOrderField}`;
    per_page?: number;
    page?: number;
}

/** Params for event-times getAll(). */
export type EventTimesGetAllOptions = EventTimesGetPageOptions & PaginationOptions;

/** Params for getById (single event time). Can Include: event, event_period, headcounts (per docs). */
export type EventTimeGetByIdOptions = { include?: EventTimeInclude[] };

// ----- Locations -----
/** Params for locations getPage(). */
export interface LocationsGetPageOptions extends QueryOptions {
    where?: LocationWhereClause;
    include?: LocationInclude[];
    order?: LocationOrderField | `-${LocationOrderField}`;
    per_page?: number;
    page?: number;
}

/** Params for locations getAll(). */
export type LocationsGetAllOptions = LocationsGetPageOptions & PaginationOptions;

/** Options for getById (single location). */
export type LocationGetByIdOptions = { include?: LocationInclude[] };

// ----- Stations -----
/** Params for stations getPage(). */
export interface StationsGetPageOptions extends QueryOptions {
    where?: StationWhereClause;
    include?: StationInclude[];
    order?: StationOrderField | `-${StationOrderField}`;
    per_page?: number;
    page?: number;
}

/** Params for stations getAll(). */
export type StationsGetAllOptions = StationsGetPageOptions & PaginationOptions;

/** Params for getById (single station). */
export type StationGetByIdOptions = { include?: StationInclude[] };

// ----- Attendance types -----
/** Params for attendance-types getPage(). */
export interface AttendanceTypesGetPageOptions extends QueryOptions {
    where?: AttendanceTypeWhereClause;
    include?: AttendanceTypeInclude[];
    order?: AttendanceTypeOrderField | `-${AttendanceTypeOrderField}`;
    per_page?: number;
    page?: number;
}

/** Params for attendance-types getAll(). */
export type AttendanceTypesGetAllOptions = AttendanceTypesGetPageOptions & PaginationOptions;

/** Params for getById (single attendance type). */
export type AttendanceTypeGetByIdOptions = { include?: AttendanceTypeInclude[] };

// ----- Headcounts -----
/** Params for headcounts getPage(). */
export interface HeadcountsGetPageOptions extends QueryOptions {
    where?: HeadcountWhereClause;
    include?: HeadcountInclude[];
    order?: HeadcountOrderField | `-${HeadcountOrderField}`;
    per_page?: number;
    page?: number;
}

/** Params for headcounts getAll(). */
export type HeadcountsGetAllOptions = HeadcountsGetPageOptions & PaginationOptions;

/** Params for getById (single headcount). */
export type HeadcountGetByIdOptions = { include?: HeadcountInclude[] };

// ----- Integration links -----
/** Params for integration-links getPage(). */
export interface IntegrationLinksGetPageOptions extends QueryOptions {
    where?: IntegrationLinkWhereClause;
    include?: IntegrationLinkInclude[];
    per_page?: number;
    page?: number;
}

/** Params for integration-links getAll(). */
export type IntegrationLinksGetAllOptions = IntegrationLinksGetPageOptions & PaginationOptions;

/** Params for getById (single integration link). */
export type IntegrationLinkGetByIdOptions = { include?: IntegrationLinkInclude[] };

// ----- Labels -----
/** Params for labels getPage(). */
export interface LabelsGetPageOptions extends QueryOptions {
    where?: LabelWhereClause;
    include?: LabelInclude[];
    order?: LabelOrderField | `-${LabelOrderField}`;
    per_page?: number;
    page?: number;
}

/** Params for labels getAll(). */
export type LabelsGetAllOptions = LabelsGetPageOptions & PaginationOptions;

/** Params for getById (single label). */
export type LabelGetByIdOptions = { include?: LabelInclude[] };

// ----- Options -----
/** Params for options getPage(). */
export interface OptionsGetPageOptions extends QueryOptions {
    where?: OptionWhereClause;
    include?: OptionInclude[];
    order?: OptionOrderField | `-${OptionOrderField}`;
    per_page?: number;
    page?: number;
}

/** Params for options getAll(). */
export type OptionsGetAllOptions = OptionsGetPageOptions & PaginationOptions;

/** Params for getById (single option). */
export type OptionGetByIdOptions = { include?: OptionInclude[] };

// ----- Pre-checks -----
/** Params for pre-checks getPage(). */
export interface PreChecksGetPageOptions extends QueryOptions {
    where?: PreCheckWhereClause;
    include?: PreCheckInclude[];
    per_page?: number;
    page?: number;
}

/** Params for pre-checks getAll(). */
export type PreChecksGetAllOptions = PreChecksGetPageOptions & PaginationOptions;

/** Params for getById (single pre-check). */
export type PreCheckGetByIdOptions = { include?: PreCheckInclude[] };

// ----- Roster list persons -----
/** Params for roster-list-persons getPage(). */
export interface RosterListPersonsGetPageOptions extends QueryOptions {
    where?: RosterListPersonWhereClause;
    include?: RosterListPersonInclude[];
    order?: RosterListPersonOrderField | `-${RosterListPersonOrderField}`;
    per_page?: number;
    page?: number;
}

/** Params for roster-list-persons getAll(). */
export type RosterListPersonsGetAllOptions = RosterListPersonsGetPageOptions & PaginationOptions;

/** Params for getById (single roster list person). */
export type RosterListPersonGetByIdOptions = { include?: RosterListPersonInclude[] };

// ----- Themes -----
/** Params for themes getPage(). */
export interface ThemesGetPageOptions extends QueryOptions {
    where?: ThemeWhereClause;
    order?: ThemeOrderField | `-${ThemeOrderField}`;
    per_page?: number;
    page?: number;
}

/** Params for themes getAll(). */
export type ThemesGetAllOptions = ThemesGetPageOptions & PaginationOptions;

/** Params for getById (single theme). */
export type ThemeGetByIdOptions = { include?: string[] };

// ----- Passes -----
/** Params for passes getPage(). */
export interface PassesGetPageOptions extends QueryOptions {
    where?: PassWhereClause;
    include?: PassInclude[];
    order?: PassOrderField | `-${PassOrderField}`;
    per_page?: number;
    page?: number;
}

/** Params for passes getAll(). */
export type PassesGetAllOptions = PassesGetPageOptions & PaginationOptions;

/** Params for getById (single pass). Can Include: person. */
export type PassGetByIdOptions = { include?: PassInclude[] };
