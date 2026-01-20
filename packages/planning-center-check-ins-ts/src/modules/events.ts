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
     * Get all events with optional filtering
     */
    async getAll(options: EventsListOptions = {}): Promise<{ data: EventResource[]; meta?: Meta; links?: TopLevelLinks }> {
        const params: Record<string, any> = {};

        if (options.where) {
            Object.entries(options.where).forEach(([key, value]) => {
                params[`where[${key}]`] = value;
            });
        }

        if (options.filter) {
            // Support both string and array formats
            if (Array.isArray(options.filter)) {
                options.filter.forEach(filter => {
                    params.filter = filter; // Use the last filter value, or combine them
                });
            } else {
                params.filter = options.filter;
            }
        }

        if (options.include) {
            params.include = options.include.join(',');
        }

        if (options.perPage) {
            params.per_page = options.perPage;
        }

        if (options.page) {
            params.page = options.page;
        }

        return this.getList<EventResource>('/check-ins/v2/events', params);
    }

    /**
     * Get a single event by ID
     */
    async getById(id: string, include?: string[]): Promise<EventResource> {
        const params: Record<string, any> = {};
        if (include) {
            params.include = include.join(',');
        }

        return this.getSingle<EventResource>(`/check-ins/v2/events/${id}`, params);
    }

    // ===== Associations =====

    /**
     * Get attendance types for an event
     */
    async getAttendanceTypes(eventId: string): Promise<{ data: AttendanceTypeResource[]; meta?: Meta; links?: TopLevelLinks }> {
        return this.getList<AttendanceTypeResource>(`/check-ins/v2/events/${eventId}/attendance_types`);
    }

    /**
     * Get check-ins for an event
     */
    async getCheckIns(eventId: string, options: { filter?: string[] } = {}): Promise<{ data: CheckInResource[]; meta?: Meta; links?: TopLevelLinks }> {
        const params: Record<string, any> = {};
        
        // Apply filters: attendee, checked_out, first_time, guest, not_checked_out, 
        // not_one_time_guest, one_time_guest, regular, volunteer
        if (options.filter && options.filter.length > 0) {
            options.filter.forEach(filter => {
                params[filter] = 'true';
            });
        }

        return this.getList<CheckInResource>(`/check-ins/v2/events/${eventId}/check_ins`, params);
    }

    /**
     * Get current event times for an event
     */
    async getCurrentEventTimes(eventId: string): Promise<{ data: EventTimeResource[]; meta?: Meta; links?: TopLevelLinks }> {
        return this.getList<EventTimeResource>(`/check-ins/v2/events/${eventId}/current_event_times`);
    }

    /**
     * Get event labels for an event
     */
    async getEventLabels(eventId: string): Promise<{ data: EventLabelResource[]; meta?: Meta; links?: TopLevelLinks }> {
        return this.getList<EventLabelResource>(`/check-ins/v2/events/${eventId}/event_labels`);
    }

    /**
     * Get event periods for an event (single page)
     */
    async getEventPeriods(eventId: string): Promise<{ data: EventPeriodResource[]; meta?: Meta; links?: TopLevelLinks }> {
        return this.getList<EventPeriodResource>(`/check-ins/v2/events/${eventId}/event_periods`);
    }

    /**
     * Get all event periods for an event (all pages)
     */
    async getAllEventPeriods(eventId: string, options?: { perPage?: number }): Promise<EventPeriodResource[]> {
        const result = await this.getAllPages<EventPeriodResource>(
            `/check-ins/v2/events/${eventId}/event_periods`,
            {},
            { perPage: options?.perPage || 100 }
        );
        return result.data;
    }

    /**
     * Get all events with pagination (all pages)
     */
    async getAllEvents(options?: { filter?: string | string[]; perPage?: number }): Promise<EventResource[]> {
        const params: Record<string, any> = {};
        
        if (options?.filter) {
            if (Array.isArray(options.filter)) {
                params.filter = options.filter[0]; // Use first filter if array
            } else {
                params.filter = options.filter;
            }
        }

        const result = await this.getAllPages<EventResource>(
            '/check-ins/v2/events',
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
            endpoint: `/check-ins/v2/events/${eventId}/event_periods/${periodId}/event_times`,
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
    async getIntegrationLinks(eventId: string): Promise<{ data: IntegrationLinkResource[]; meta?: Meta; links?: TopLevelLinks }> {
        return this.getList<IntegrationLinkResource>(`/check-ins/v2/events/${eventId}/integration_links`);
    }

    /**
     * Get locations for an event
     */
    async getLocations(eventId: string): Promise<{ data: LocationResource[]; meta?: Meta; links?: TopLevelLinks }> {
        return this.getList<LocationResource>(`/check-ins/v2/events/${eventId}/locations`);
    }

    /**
     * Get person events for an event
     */
    async getPersonEvents(eventId: string): Promise<{ data: PersonEventResource[]; meta?: Meta; links?: TopLevelLinks }> {
        return this.getList<PersonEventResource>(`/check-ins/v2/events/${eventId}/person_events`);
    }
}

