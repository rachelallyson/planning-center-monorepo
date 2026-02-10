/**
 * EventTimes Module for Check-Ins API
 */

import { BaseModule } from '@rachelallyson/planning-center-base-ts';
import type {
    PcoHttpClient,
    PaginationHelper,
    PcoEventEmitter,
    PaginationResult,
    Meta,
    TopLevelLinks,
} from '@rachelallyson/planning-center-base-ts';
import type {
    EventTimeResource,
    EventResource,
    EventPeriodResource,
    LocationEventTimeResource,
    CheckInResource,
    FlattenedEventTimeResource,
    FlattenedEventResource,
    FlattenedEventPeriodResource,
    FlattenedLocationEventTimeResource,
    FlattenedCheckInResource,
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
     * Get all event times across all pages with optional filtering.
     * Use getPage() when you need a single page or custom perPage/page.
     */
    async getAll(options: EventTimesListOptions = {}): Promise<PaginationResult<EventTimeResource>> {
        const params = this.buildParams(options);
        return this.getAllPages<EventTimeResource>('/event_times', params);
    }

    /**
     * Get a single page of event times with optional filtering and pagination.
     */
    async getPage(options: EventTimesListOptions = {}): Promise<{ data: FlattenedEventTimeResource[]; meta?: Meta; links?: TopLevelLinks }> {
        const params = this.buildParams(options);
        return this.getList<EventTimeResource>('/event_times', params);
    }

    private buildParams(options: EventTimesListOptions): Record<string, any> {
        const params: Record<string, any> = {};
        if (options.where) Object.entries(options.where).forEach(([k, v]) => { params[`where[${k}]`] = v; });
        if (options.include) params.include = options.include.join(',');
        if (options.perPage != null) params.per_page = options.perPage;
        if (options.page != null) params.page = options.page;
        return params;
    }

    /**
     * Get a single event time by ID
     */
    async getById(id: string, include?: string[]): Promise<FlattenedEventTimeResource> {
        const params: Record<string, any> = {};
        if (include) {
            params.include = include.join(',');
        }

        return this.getSingle<EventTimeResource>(`/event_times/${id}`, params);
    }

    // ===== Associations =====

    /**
     * Get event for an event time
     */
    async getEvent(eventTimeId: string): Promise<FlattenedEventResource> {
        return this.getSingle<EventResource>(`/event_times/${eventTimeId}/event`);
    }

    /**
     * Get event period for an event time
     */
    async getEventPeriod(eventTimeId: string): Promise<FlattenedEventPeriodResource> {
        return this.getSingle<EventPeriodResource>(`/event_times/${eventTimeId}/event_period`);
    }

    /**
     * Get location event times for an event time
     */
    async getLocationEventTimes(eventTimeId: string): Promise<{ data: FlattenedLocationEventTimeResource[]; meta?: any; links?: any }> {
        return this.getList<LocationEventTimeResource>(`/event_times/${eventTimeId}/location_event_times`);
    }

    /**
     * Get check-ins for an event time
     */
    async getCheckIns(eventTimeId: string): Promise<{ data: FlattenedCheckInResource[]; meta?: any; links?: any }> {
        return this.getList<CheckInResource>(`/event_times/${eventTimeId}/check_ins`);
    }
}

