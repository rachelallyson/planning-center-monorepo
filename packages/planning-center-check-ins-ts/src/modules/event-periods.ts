/**
 * EventPeriods Module for Check-Ins API
 */

import { BaseModule } from '@rachelallyson/planning-center-base-ts';
import type { 
    PcoHttpClient, 
    PaginationHelper, 
    PcoEventEmitter,
} from '@rachelallyson/planning-center-base-ts';
import type {
    EventPeriodResource,
    EventResource,
    EventTimeResource,
    CheckInResource,
    LocationEventPeriodResource,
} from '../types';

export interface EventPeriodsListOptions {
    where?: Record<string, any>;
    include?: string[];
    perPage?: number;
    page?: number;
}

export class EventPeriodsModule extends BaseModule {
    constructor(
        httpClient: PcoHttpClient,
        paginationHelper: PaginationHelper,
        eventEmitter: PcoEventEmitter
    ) {
        super(httpClient, paginationHelper, eventEmitter);
    }

    /**
     * Get all event periods with optional filtering
     */
    async getAll(options: EventPeriodsListOptions = {}): Promise<{ data: EventPeriodResource[]; meta?: any; links?: any }> {
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

        return this.getList<EventPeriodResource>('/check-ins/v2/event_periods', params);
    }

    /**
     * Get a single event period by ID
     */
    async getById(id: string, include?: string[]): Promise<EventPeriodResource> {
        const params: Record<string, any> = {};
        if (include) {
            params.include = include.join(',');
        }

        return this.getSingle<EventPeriodResource>(`/check-ins/v2/event_periods/${id}`, params);
    }

    // ===== Associations =====

    /**
     * Get event for an event period
     */
    async getEvent(eventPeriodId: string): Promise<EventResource> {
        return this.getSingle<EventResource>(`/check-ins/v2/event_periods/${eventPeriodId}/event`);
    }

    /**
     * Get event times for an event period
     */
    async getEventTimes(eventPeriodId: string): Promise<{ data: EventTimeResource[]; meta?: any; links?: any }> {
        return this.getList<EventTimeResource>(`/check-ins/v2/event_periods/${eventPeriodId}/event_times`);
    }

    /**
     * Get check-ins for an event period
     */
    async getCheckIns(eventPeriodId: string, options: { filter?: string[] } = {}): Promise<{ data: CheckInResource[]; meta?: any; links?: any }> {
        const params: Record<string, any> = {};
        
        if (options.filter && options.filter.length > 0) {
            options.filter.forEach(filter => {
                params[filter] = 'true';
            });
        }

        return this.getList<CheckInResource>(`/check-ins/v2/event_periods/${eventPeriodId}/check_ins`, params);
    }

    /**
     * Get location event periods for an event period
     */
    async getLocationEventPeriods(eventPeriodId: string): Promise<{ data: LocationEventPeriodResource[]; meta?: any; links?: any }> {
        return this.getList<LocationEventPeriodResource>(`/check-ins/v2/event_periods/${eventPeriodId}/location_event_periods`);
    }
}

