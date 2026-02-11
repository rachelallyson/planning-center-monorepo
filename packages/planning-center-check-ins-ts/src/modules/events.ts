/**
 * Events Module for Check-Ins API
 */

import { BaseModule } from '@rachelallyson/planning-center-base-ts';
import type {
    PcoHttpClient,
    PaginationHelper,
    PcoEventEmitter,
    Meta,
    TopLevelLinks,
    PcoClientConfig,
} from '@rachelallyson/planning-center-base-ts';
import type * as Types from '../types';

export interface EventsListOptions {
    where?: Record<string, any>;
    filter?: string | string[]; // e.g., 'not_archived' or ['not_archived']
    include?: string[];
    perPage?: number;
    page?: number;
}

export class EventsModule extends BaseModule {
    constructor(
        httpClient: PcoHttpClient,
        paginationHelper: PaginationHelper,
        eventEmitter: PcoEventEmitter,
        getConfig?: () => PcoClientConfig
    ) {
        super(httpClient, paginationHelper, eventEmitter, getConfig);
    }

    /**
     * Get all events across all pages with optional filtering.
     * Use getPage() when you need a single page or custom perPage/page.
     */
    async getAll(options: EventsListOptions = {}) {
        const params = this.buildEventsListParams(options);
        return this.getAllPages<Types.EventResourceObject, Types.EventResourceObject, Types.EventRelResourceMap>('/events', params);
    }

    /**
     * Get a single page of events with optional filtering and pagination.
     */
    async getPage(options: EventsListOptions = {}) {
        const params = this.buildEventsListParams(options);
        return this.getList<Types.EventResourceObject, Types.EventRelResourceMap, Types.CheckInsResourceTypeToRelMap>('/events', params);
    }

    private buildEventsListParams(options: EventsListOptions): Record<string, any> {
        const params: Record<string, any> = {};
        if (options.where) {
            Object.entries(options.where).forEach(([key, value]) => {
                params[`where[${key}]`] = value;
            });
        }
        if (options.filter) {
            if (Array.isArray(options.filter)) {
                options.filter.forEach(filter => { params.filter = filter; });
            } else {
                params.filter = options.filter;
            }
        }
        if (options.include) params.include = options.include.join(',');
        if (options.perPage != null) params.per_page = options.perPage;
        if (options.page != null) params.page = options.page;
        return params;
    }

    /**
     * Get a single event by ID
     */
    async getById(id: string, include?: string[]) {
        const params: Record<string, any> = {};
        if (include) {
            params.include = include.join(',');
        }

        return this.getSingle<Types.EventResourceObject, Types.EventRelResourceMap>(`/events/${id}`, params);
    }

    // ===== Associations =====

    /**
     * Get attendance types for an event
     */
    async getAttendanceTypes(eventId: string) {
        return this.getList<Types.AttendanceTypeResourceObject, Types.AttendanceTypeRelResourceMap>(`/events/${eventId}/attendance_types`);
    }

    /**
     * Get check-ins for an event
     */
    async getCheckIns(eventId: string, options: { filter?: string[] } = {}) {
        const params: Record<string, any> = {};
        
        // Apply filters: attendee, checked_out, first_time, guest, not_checked_out, 
        // not_one_time_guest, one_time_guest, regular, volunteer
        if (options.filter && options.filter.length > 0) {
            options.filter.forEach(filter => {
                params[filter] = 'true';
            });
        }

        return this.getList<Types.CheckInResourceObject, Types.CheckInRelResourceMap, Types.CheckInsResourceTypeToRelMap>(`/events/${eventId}/check_ins`, params);
    }

    /**
     * Get current event times for an event
     */
    async getCurrentEventTimes(eventId: string) {
        return this.getList<Types.EventTimeResourceObject, Types.EventTimeRelResourceMap, Types.CheckInsResourceTypeToRelMap>(`/events/${eventId}/current_event_times`);
    }

    /**
     * Get event labels for an event
     */
    async getEventLabels(eventId: string) {
        return this.getList<Types.EventLabelResourceObject, Types.EventLabelRelResourceMap, Types.CheckInsResourceTypeToRelMap>(`/events/${eventId}/event_labels`);
    }

    /**
     * Get event periods for an event (single page)
     */
    async getEventPeriods(eventId: string) {
        return this.getList<Types.EventPeriodResourceObject, Types.EventPeriodRelResourceMap, Types.CheckInsResourceTypeToRelMap>(`/events/${eventId}/event_periods`);
    }

    /**
     * Get all event periods for an event (all pages)
     */
    async getAllEventPeriods(eventId: string, options?: { perPage?: number }) {
        const result = await this.getAllPages<Types.EventPeriodResourceObject, Types.EventPeriodResourceObject, Types.EventPeriodRelResourceMap, Types.CheckInsResourceTypeToRelMap>(
            `/events/${eventId}/event_periods`,
            {},
            { perPage: options?.perPage || 100 }
        );
        return result.data;
    }

    /**
     * Get all events with pagination (all pages)
     */
    async getAllEvents(options?: { filter?: string | string[]; perPage?: number }) {
        const params: Record<string, any> = {};
        
        if (options?.filter) {
            if (Array.isArray(options.filter)) {
                params.filter = options.filter[0]; // Use first filter if array
            } else {
                params.filter = options.filter;
            }
        }

        const result = await this.getAllPages<Types.EventResourceObject>(
            '/events',
            params,
            { perPage: options?.perPage || 100 }
        );
        return result.data;
    }

    /**
     * Get event times for a specific event period.
     * Uses the same flattened response shape as other list methods.
     * Possible includes: headcounts, headcounts.attendance_type.
     * Note: Each event time's `headcounts` will be full objects only when the API
     * returns those resources in the response's `included` array. Otherwise you get
     * identifier objects ({ type, id }). If the API doesn't support these includes
     * for this endpoint, headcounts may be identifiers or absent.
     */
    async getEventTimesForPeriod(
        eventId: string,
        periodId: string,
        options?: { include?: string[] | string; perPage?: number }
    ) {
        const params: Record<string, any> = {};
        if (options?.include) {
            params.include = Array.isArray(options.include) ? options.include.join(',') : options.include;
        }
        if (options?.perPage) {
            params.per_page = options.perPage;
        }
        return this.getList<Types.EventTimeResourceObject, Types.EventTimeRelResourceMap, Types.CheckInsResourceTypeToRelMap>(
            `/events/${eventId}/event_periods/${periodId}/event_times`,
            params
        );
    }

    /**
     * Get integration links for an event
     */
    async getIntegrationLinks(eventId: string) {
        return this.getList<Types.IntegrationLinkResourceObject, Types.IntegrationLinkRelResourceMap, Types.CheckInsResourceTypeToRelMap>(`/events/${eventId}/integration_links`);
    }

    /**
     * Get locations for an event
     */
    async getLocations(eventId: string) {
        return this.getList<Types.LocationResourceObject, Types.LocationRelResourceMap, Types.CheckInsResourceTypeToRelMap>(`/events/${eventId}/locations`);
    }

    /**
     * Get person events for an event
     */
    async getPersonEvents(eventId: string) {
        return this.getList<Types.PersonEventResourceObject, Types.PersonEventRelResourceMap, Types.CheckInsResourceTypeToRelMap>(`/events/${eventId}/person_events`);
    }
}
