/**
 * EventTimes Module for Check-Ins API
 */

import { BaseModule } from '@rachelallyson/planning-center-base-ts';
import type {
    PcoHttpClient,
    PaginationHelper,
    PcoEventEmitter,
    PcoClientConfig
} from '@rachelallyson/planning-center-base-ts';
import type * as Types from '../types';

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
        eventEmitter: PcoEventEmitter,
        getConfig?: () => PcoClientConfig
    ) {
        super(httpClient, paginationHelper, eventEmitter, getConfig);
    }

    /**
     * Get all event times across all pages with optional filtering.
     * Use getPage() when you need a single page or custom perPage/page.
     */
    async getAll(options: EventTimesListOptions = {}) {
        const params = this.buildParams(options);
        return this.getAllPages<Types.EventTimeResourceObject>('/event_times', params);
    }

    /**
     * Get a single page of event times with optional filtering and pagination.
     */
    async getPage(options: EventTimesListOptions = {}) {
        const params = this.buildParams(options);
        return this.getList<Types.EventTimeResourceObject, Types.EventTimeRelResourceMap, Types.CheckInsResourceTypeToRelMap>('/event_times', params);
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
    async getById(id: string, include?: string[]) {
        const params: Record<string, any> = {};
        if (include) {
            params.include = include.join(',');
        }

        return this.getSingle<Types.EventTimeResourceObject, Types.EventTimeRelResourceMap, Types.CheckInsResourceTypeToRelMap>(`/event_times/${id}`, params) as Promise<Types.EventTimeResource>;
    }

    // ===== Associations =====

    /**
     * Get event for an event time
     */
    async getEvent(eventTimeId: string) {
        return this.getSingle<Types.EventResourceObject, Types.EventRelResourceMap, Types.CheckInsResourceTypeToRelMap>(`/event_times/${eventTimeId}/event`);
    }

    /**
     * Get event period for an event time
     */
    async getEventPeriod(eventTimeId: string) {
        return this.getSingle<Types.EventPeriodResourceObject, Types.EventPeriodRelResourceMap, Types.CheckInsResourceTypeToRelMap>(`/event_times/${eventTimeId}/event_period`);
    }

    /**
     * Get location event times for an event time
     */
    async getLocationEventTimes(eventTimeId: string) {
        return this.getList<Types.LocationEventTimeResourceObject, Types.LocationEventTimeRelResourceMap, Types.CheckInsResourceTypeToRelMap>(`/event_times/${eventTimeId}/location_event_times`);
    }

    /**
     * Get check-ins for an event time
     */
    async getCheckIns(eventTimeId: string) {
        return this.getList<Types.CheckInResourceObject, Types.CheckInRelResourceMap, Types.CheckInsResourceTypeToRelMap>(`/event_times/${eventTimeId}/check_ins`);
    }
}

