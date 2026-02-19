/**
 * EventTimes Module for Check-Ins API
 * @see https://developer.planning.center/docs/#/apps/check-ins/2025-05-28/vertices/event_time
 */

import { BaseModule } from '@rachelallyson/planning-center-base-ts';
import type {
    PcoHttpClient,
    PaginationHelper,
    PcoClientConfig,
    QueryOptions,
} from '@rachelallyson/planning-center-base-ts';
import type * as Types from '../types';
import type {
    EventTimeGetByIdOptions,
    EventTimesGetAllOptions,
    EventTimesGetPageOptions,
} from '../types/api-options';

/** Event times: getPage, getById, create, update, delete, and nested check-ins. */
export class EventTimesModule extends BaseModule {
    constructor(
        httpClient: PcoHttpClient,
        paginationHelper: PaginationHelper,
        getConfig?: () => PcoClientConfig
    ) {
        super(httpClient, paginationHelper, getConfig);
    }

    /**
     * Get all event times across all pages with optional filtering.
     * Use getPage() when you need a single page or custom per_page/page.
     */
    async getAll(options?: EventTimesGetAllOptions) {
        return this.getAllPages<Types.EventTimeResource, EventTimesGetAllOptions>('/event_times', options);
    }

    /**
     * Get a single page of event times with optional filtering and pagination.
     */
    async getPage(options?: EventTimesGetPageOptions) {
        return this.getList<Types.EventTimeResource, EventTimesGetPageOptions>('/event_times', options);
    }

    /**
     * Get a single event time by ID. Can Include: event, event_period, headcounts (per docs).
     */
    async getById(id: string, options?: EventTimeGetByIdOptions) {
        return this.getSingle<Types.EventTimeResource>(`/event_times/${id}`, options);
    }

    // ===== Associations =====

    /**
     * Get event for an event time
     */
    async getEvent(eventTimeId: string) {
        return this.getSingle<Types.EventResource>(`/event_times/${eventTimeId}/event`);
    }

    /**
     * Get event period for an event time
     */
    async getEventPeriod(eventTimeId: string) {
        return this.getSingle<Types.EventPeriodResource>(`/event_times/${eventTimeId}/event_period`);
    }

    /**
     * Get location event times for an event time
     */
    async getLocationEventTimes(eventTimeId: string) {
        return this.getList<Types.LocationEventTimeResource, QueryOptions>(`/event_times/${eventTimeId}/location_event_times`);
    }

    /**
     * Get check-ins for an event time
     */
    async getCheckIns(eventTimeId: string) {
        return this.getList<Types.CheckInResource, QueryOptions>(`/event_times/${eventTimeId}/check_ins`);
    }
}

