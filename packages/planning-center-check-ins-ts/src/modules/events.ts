/**
 * Events Module for Check-Ins API
 */

import { BaseModule } from '@rachelallyson/planning-center-base-ts';
import type {
    PcoHttpClient,
    PaginationHelper,
    PcoClientConfig,
} from '@rachelallyson/planning-center-base-ts';
import type * as Types from '../types';
import type {
    EventGetAllEventPeriodsOptions,
    EventGetAttendanceTypesGetPageOptions,
    EventCheckInsGetPageOptions,
    EventGetCurrentEventTimesGetPageOptions,
    EventGetEventLabelsGetPageOptions,
    EventGetEventPeriodsGetPageOptions,
    EventGetEventTimesForPeriodGetPageOptions,
    EventGetIntegrationLinksGetPageOptions,
    EventGetLocationsGetPageOptions,
    EventGetPersonEventsGetPageOptions,
    EventsGetAllOptions,
    EventsGetPageOptions,
    EventGetByIdOptions,
} from '../types/api-options';
export type { CheckInFilter, EventFilter, EventInclude, EventOrderField, EventWhereClause } from '../types/api-options';

/** Events API: getAll, getPage, getById, create, update, delete, and nested resource access (event_times, locations, etc.). */
export class EventsModule extends BaseModule {
    constructor(
        httpClient: PcoHttpClient,
        paginationHelper: PaginationHelper,
        getConfig?: () => PcoClientConfig
    ) {
        super(httpClient, paginationHelper, getConfig);
    }

    /**
     * Get all events across all pages with optional filtering.
     * Use getPage() when you need a single page or custom per_page/page.
     */
    async getAll(options?: EventsGetAllOptions) {
        return this.getAllPages<Types.EventResource, EventsGetAllOptions>('/events', options);
    }

    /**
     * Get a single page of events with optional filtering and pagination.
     */
    async getPage(options?: EventsGetPageOptions) {
        return this.getList<Types.EventResource, EventsGetPageOptions>('/events', options);
    }

    /**
     * Get a single event by ID
     */
    async getById(id: string, options?: EventGetByIdOptions) {
        return this.getSingle<Types.EventResource>(`/events/${id}`, options);
    }

    // ===== Associations =====

    /**
     * Get attendance types for an event
     */
    async getAttendanceTypes(eventId: string, options?: EventGetAttendanceTypesGetPageOptions) {
        return this.getList<Types.AttendanceTypeResource, EventGetAttendanceTypesGetPageOptions>(`/events/${eventId}/attendance_types`, options);
    }

    /**
     * Get check-ins for an event.
     * Options support Filter By (e.g. filter: ['attendee'], filter: 'checked_out') plus include, order, where, per_page, page.
     */
    async getCheckIns(eventId: string, options?: EventCheckInsGetPageOptions) {
        return this.getList<Types.CheckInResource, EventCheckInsGetPageOptions>(`/events/${eventId}/check_ins`, options);
    }

    /**
     * Get current event times for an event
     */
    async getCurrentEventTimes(eventId: string, options?: EventGetCurrentEventTimesGetPageOptions) {
        return this.getList<Types.EventTimeResource, EventGetCurrentEventTimesGetPageOptions>(`/events/${eventId}/current_event_times`, options);
    }

    /**
     * Get event labels for an event
     */
    async getEventLabels(eventId: string, options?: EventGetEventLabelsGetPageOptions) {
        return this.getList<Types.EventLabelResource, EventGetEventLabelsGetPageOptions>(`/events/${eventId}/event_labels`, options);
    }

    /**
     * Get event periods for an event (single page)
     */
    async getEventPeriods(eventId: string, options?: EventGetEventPeriodsGetPageOptions) {
        return this.getList<Types.EventPeriodResource, EventGetEventPeriodsGetPageOptions>(`/events/${eventId}/event_periods`, options);
    }

    /**
     * Get all event periods for an event (all pages)
     */
    async getAllEventPeriods(eventId: string, options?: EventGetAllEventPeriodsOptions) {
        return this.getAllPages<Types.EventPeriodResource, EventGetAllEventPeriodsOptions>(`/events/${eventId}/event_periods`, options);
    }

    /**
     * Get all events with pagination (all pages)
     */
    async getAllEvents(options?: EventsGetAllOptions) {
        return this.getAllPages<Types.EventResource, EventsGetAllOptions>(`/events`, options);
    }

    /**
     * Get event times for a specific event period.
     * Possible includes: headcounts, headcounts.attendance_type.
     */
    async getEventTimesForPeriod(
        eventId: string,
        periodId: string,
        options?: EventGetEventTimesForPeriodGetPageOptions,
    ) {
        return this.getList<Types.EventTimeResource, EventGetEventTimesForPeriodGetPageOptions>(
            `/events/${eventId}/event_periods/${periodId}/event_times`,
            options
        );
    }

    /**
     * Get integration links for an event
     */
    async getIntegrationLinks(eventId: string, options?: EventGetIntegrationLinksGetPageOptions) {
        return this.getList<Types.IntegrationLinkResource, EventGetIntegrationLinksGetPageOptions>(`/events/${eventId}/integration_links`, options);
    }

    /**
     * Get locations for an event
     */
    async getLocations(eventId: string, options?: EventGetLocationsGetPageOptions) {
        return this.getList<Types.LocationResource, EventGetLocationsGetPageOptions>(`/events/${eventId}/locations`, options);
    }

    /**
     * Get person events for an event
     */
    async getPersonEvents(eventId: string, options?: EventGetPersonEventsGetPageOptions) {
        return this.getList<Types.PersonEventResource, EventGetPersonEventsGetPageOptions>(`/events/${eventId}/person_events`, options);
    }
}
