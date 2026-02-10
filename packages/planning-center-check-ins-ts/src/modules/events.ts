/**
 * Events Module for Check-Ins API
 */

import { BaseModule } from '@rachelallyson/planning-center-base-ts';
import type {
    PcoHttpClient,
    PaginationHelper,
    PcoEventEmitter,
    ResourceObject,
    Meta,
    TopLevelLinks,
    PaginationResult,
} from '@rachelallyson/planning-center-base-ts';
import type {
    EventResource,
    EventPeriodResource,
    EventTimeResource,
    AttendanceTypeResource,
    CheckInResource,
    EventLabelResource,
    LocationResource,
    PersonEventResource,
    IntegrationLinkResource,
    HeadcountResource,
    FlattenedEventResource,
    FlattenedEventPeriodResource,
    FlattenedEventTimeResource,
    FlattenedAttendanceTypeResource,
    FlattenedCheckInResource,
    FlattenedEventLabelResource,
    FlattenedLocationResource,
    FlattenedPersonEventResource,
    FlattenedIntegrationLinkResource,
} from '../types';

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
        eventEmitter: PcoEventEmitter
    ) {
        super(httpClient, paginationHelper, eventEmitter);
    }

    /**
     * Get all events across all pages with optional filtering.
     * Use getPage() when you need a single page or custom perPage/page.
     */
    async getAll(options: EventsListOptions = {}): Promise<PaginationResult<EventResource>> {
        const params = this.buildEventsListParams(options);
        return this.getAllPages<EventResource>('/events', params);
    }

    /**
     * Get a single page of events with optional filtering and pagination.
     */
    async getPage(options: EventsListOptions = {}): Promise<{ data: FlattenedEventResource[]; meta?: Meta; links?: TopLevelLinks }> {
        const params = this.buildEventsListParams(options);
        return this.getList<EventResource>('/events', params);
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
    async getById(id: string, include?: string[]): Promise<FlattenedEventResource> {
        const params: Record<string, any> = {};
        if (include) {
            params.include = include.join(',');
        }

        return this.getSingle<EventResource>(`/events/${id}`, params);
    }

    // ===== Associations =====

    /**
     * Get attendance types for an event
     */
    async getAttendanceTypes(eventId: string): Promise<{ data: FlattenedAttendanceTypeResource[]; meta?: Meta; links?: TopLevelLinks }> {
        return this.getList<AttendanceTypeResource>(`/events/${eventId}/attendance_types`);
    }

    /**
     * Get check-ins for an event
     */
    async getCheckIns(eventId: string, options: { filter?: string[] } = {}): Promise<{ data: FlattenedCheckInResource[]; meta?: Meta; links?: TopLevelLinks }> {
        const params: Record<string, any> = {};
        
        // Apply filters: attendee, checked_out, first_time, guest, not_checked_out, 
        // not_one_time_guest, one_time_guest, regular, volunteer
        if (options.filter && options.filter.length > 0) {
            options.filter.forEach(filter => {
                params[filter] = 'true';
            });
        }

        return this.getList<CheckInResource>(`/events/${eventId}/check_ins`, params);
    }

    /**
     * Get current event times for an event
     */
    async getCurrentEventTimes(eventId: string): Promise<{ data: FlattenedEventTimeResource[]; meta?: Meta; links?: TopLevelLinks }> {
        return this.getList<EventTimeResource>(`/events/${eventId}/current_event_times`);
    }

    /**
     * Get event labels for an event
     */
    async getEventLabels(eventId: string): Promise<{ data: FlattenedEventLabelResource[]; meta?: Meta; links?: TopLevelLinks }> {
        return this.getList<EventLabelResource>(`/events/${eventId}/event_labels`);
    }

    /**
     * Get event periods for an event (single page)
     */
    async getEventPeriods(eventId: string): Promise<{ data: FlattenedEventPeriodResource[]; meta?: Meta; links?: TopLevelLinks }> {
        return this.getList<EventPeriodResource>(`/events/${eventId}/event_periods`);
    }

    /**
     * Get all event periods for an event (all pages)
     */
    async getAllEventPeriods(eventId: string, options?: { perPage?: number }): Promise<FlattenedEventPeriodResource[]> {
        const result = await this.getAllPages<EventPeriodResource>(
            `/events/${eventId}/event_periods`,
            {},
            { perPage: options?.perPage || 100 }
        );
        return result.data;
    }

    /**
     * Get all events with pagination (all pages)
     */
    async getAllEvents(options?: { filter?: string | string[]; perPage?: number }): Promise<FlattenedEventResource[]> {
        const params: Record<string, any> = {};
        
        if (options?.filter) {
            if (Array.isArray(options.filter)) {
                params.filter = options.filter[0]; // Use first filter if array
            } else {
                params.filter = options.filter;
            }
        }

        const result = await this.getAllPages<EventResource>(
            '/events',
            params,
            { perPage: options?.perPage || 100 }
        );
        return result.data;
    }

    /**
     * Get event times for a specific event period
     * 
     * Possible included resources: HeadcountResource, AttendanceTypeResource
     */
    async getEventTimesForPeriod(
        eventId: string,
        periodId: string,
        options?: { include?: string[] | string; perPage?: number }
    ): Promise<{
        data: EventTimeResource[];
        included?: (HeadcountResource | AttendanceTypeResource)[];
        meta?: Meta;
        links?: TopLevelLinks;
    }> {
        const params: Record<string, any> = {};
        
        if (options?.include) {
            params.include = Array.isArray(options.include) 
                ? options.include.join(',') 
                : options.include;
        }
        
        if (options?.perPage) {
            params.per_page = options.perPage;
        }

        const response = await this.httpClient.request<{
            data: EventTimeResource[];
            included?: (HeadcountResource | AttendanceTypeResource)[];
            meta?: Meta;
            links?: TopLevelLinks;
        }>({
            method: 'GET',
            endpoint: `/events/${eventId}/event_periods/${periodId}/event_times`,
            params,
        });

        return {
            data: response.data.data,
            included: response.data.included,
            meta: response.data.meta,
            links: response.data.links,
        };
    }

    /**
     * Get integration links for an event
     */
    async getIntegrationLinks(eventId: string): Promise<{ data: FlattenedIntegrationLinkResource[]; meta?: Meta; links?: TopLevelLinks }> {
        return this.getList<IntegrationLinkResource>(`/events/${eventId}/integration_links`);
    }

    /**
     * Get locations for an event
     */
    async getLocations(eventId: string): Promise<{ data: FlattenedLocationResource[]; meta?: Meta; links?: TopLevelLinks }> {
        return this.getList<LocationResource>(`/events/${eventId}/locations`);
    }

    /**
     * Get person events for an event
     */
    async getPersonEvents(eventId: string): Promise<{ data: FlattenedPersonEventResource[]; meta?: Meta; links?: TopLevelLinks }> {
        return this.getList<PersonEventResource>(`/events/${eventId}/person_events`);
    }
}

