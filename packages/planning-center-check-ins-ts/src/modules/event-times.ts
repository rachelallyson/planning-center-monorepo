/**
 * EventTimes Module for Check-Ins API
 */

import { BaseModule } from '@rachelallyson/planning-center-base-ts';
import type { 
    PcoHttpClient, 
    PaginationHelper, 
    PcoEventEmitter,
} from '@rachelallyson/planning-center-base-ts';
import type {
    EventTimeResource,
    EventResource,
    EventPeriodResource,
    LocationEventTimeResource,
    CheckInResource,
} from '../types';

export interface EventTimesListOptions {
    where?: Record<string, any>;
    include?: string[];
    perPage?: number;
    page?: number;
}

export class EventTimesModule extends BaseModule {
    constructor(
        httpClient: PcoHttpClient,
        paginationHelper: PaginationHelper,
        eventEmitter: PcoEventEmitter
    ) {
        super(httpClient, paginationHelper, eventEmitter);
    }

    /**
     * Get all event times with optional filtering
     */
    async getAll(options: EventTimesListOptions = {}): Promise<{ data: EventTimeResource[]; meta?: any; links?: any }> {
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

        return this.getList<EventTimeResource>('/check-ins/v2/event_times', params);
    }

    /**
     * Get a single event time by ID
     */
    async getById(id: string, include?: string[]): Promise<EventTimeResource> {
        const params: Record<string, any> = {};
        if (include) {
            params.include = include.join(',');
        }

        return this.getSingle<EventTimeResource>(`/check-ins/v2/event_times/${id}`, params);
    }

    // ===== Associations =====

    /**
     * Get event for an event time
     */
    async getEvent(eventTimeId: string): Promise<EventResource> {
        return this.getSingle<EventResource>(`/check-ins/v2/event_times/${eventTimeId}/event`);
    }

    /**
     * Get event period for an event time
     */
    async getEventPeriod(eventTimeId: string): Promise<EventPeriodResource> {
        return this.getSingle<EventPeriodResource>(`/check-ins/v2/event_times/${eventTimeId}/event_period`);
    }

    /**
     * Get location event times for an event time
     */
    async getLocationEventTimes(eventTimeId: string): Promise<{ data: LocationEventTimeResource[]; meta?: any; links?: any }> {
        return this.getList<LocationEventTimeResource>(`/check-ins/v2/event_times/${eventTimeId}/location_event_times`);
    }

    /**
     * Get check-ins for an event time
     */
    async getCheckIns(eventTimeId: string): Promise<{ data: CheckInResource[]; meta?: any; links?: any }> {
        return this.getList<CheckInResource>(`/check-ins/v2/event_times/${eventTimeId}/check_ins`);
    }
}

