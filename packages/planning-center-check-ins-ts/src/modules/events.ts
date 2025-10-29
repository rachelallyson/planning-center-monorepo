/**
 * Events Module for Check-Ins API
 */

import { BaseModule } from '@rachelallyson/planning-center-base-ts';
import type { 
    PcoHttpClient, 
    PaginationHelper, 
    PcoEventEmitter,
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
} from '../types';

export interface EventsListOptions {
    where?: Record<string, any>;
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
    async getAll(options: EventsListOptions = {}): Promise<{ data: EventResource[]; meta?: any; links?: any }> {
        const params: Record<string, any> = {};

        if (options.where) {
            Object.entries(options.where).forEach(([key, value]) => {
                params[`where[${key}]`] = value;
            });
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
    async getAttendanceTypes(eventId: string): Promise<{ data: AttendanceTypeResource[]; meta?: any; links?: any }> {
        return this.getList<AttendanceTypeResource>(`/check-ins/v2/events/${eventId}/attendance_types`);
    }

    /**
     * Get check-ins for an event
     */
    async getCheckIns(eventId: string, options: { filter?: string[] } = {}): Promise<{ data: CheckInResource[]; meta?: any; links?: any }> {
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
    async getCurrentEventTimes(eventId: string): Promise<{ data: EventTimeResource[]; meta?: any; links?: any }> {
        return this.getList<EventTimeResource>(`/check-ins/v2/events/${eventId}/current_event_times`);
    }

    /**
     * Get event labels for an event
     */
    async getEventLabels(eventId: string): Promise<{ data: EventLabelResource[]; meta?: any; links?: any }> {
        return this.getList<EventLabelResource>(`/check-ins/v2/events/${eventId}/event_labels`);
    }

    /**
     * Get event periods for an event
     */
    async getEventPeriods(eventId: string): Promise<{ data: EventPeriodResource[]; meta?: any; links?: any }> {
        return this.getList<EventPeriodResource>(`/check-ins/v2/events/${eventId}/event_periods`);
    }

    /**
     * Get integration links for an event
     */
    async getIntegrationLinks(eventId: string): Promise<{ data: IntegrationLinkResource[]; meta?: any; links?: any }> {
        return this.getList<IntegrationLinkResource>(`/check-ins/v2/events/${eventId}/integration_links`);
    }

    /**
     * Get locations for an event
     */
    async getLocations(eventId: string): Promise<{ data: LocationResource[]; meta?: any; links?: any }> {
        return this.getList<LocationResource>(`/check-ins/v2/events/${eventId}/locations`);
    }

    /**
     * Get person events for an event
     */
    async getPersonEvents(eventId: string): Promise<{ data: PersonEventResource[]; meta?: any; links?: any }> {
        return this.getList<PersonEventResource>(`/check-ins/v2/events/${eventId}/person_events`);
    }
}

