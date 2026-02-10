/**
 * Locations Module for Check-Ins API
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
    LocationResource,
    LocationEventPeriodResource,
    LocationEventTimeResource,
    LocationLabelResource,
    FlattenedLocationResource,
    FlattenedLocationEventPeriodResource,
    FlattenedLocationEventTimeResource,
    FlattenedLocationLabelResource,
} from '../types';

export interface LocationsListOptions {
    where?: Record<string, any>;
    include?: string[];
    perPage?: number;
    page?: number;
}

export class LocationsModule extends BaseModule {
    constructor(
        httpClient: PcoHttpClient,
        paginationHelper: PaginationHelper,
        eventEmitter: PcoEventEmitter
    ) {
        super(httpClient, paginationHelper, eventEmitter);
    }

    /**
     * Get all locations across all pages with optional filtering.
     * Use getPage() when you need a single page or custom perPage/page.
     */
    async getAll(options: LocationsListOptions = {}): Promise<PaginationResult<LocationResource>> {
        const params = this.buildParams(options);
        return this.getAllPages<LocationResource>('/locations', params);
    }

    /**
     * Get a single page of locations with optional filtering and pagination.
     */
    async getPage(options: LocationsListOptions = {}): Promise<{ data: FlattenedLocationResource[]; meta?: Meta; links?: TopLevelLinks }> {
        const params = this.buildParams(options);
        return this.getList<LocationResource>('/locations', params);
    }

    private buildParams(options: LocationsListOptions): Record<string, any> {
        const params: Record<string, any> = {};
        if (options.where) Object.entries(options.where).forEach(([k, v]) => { params[`where[${k}]`] = v; });
        if (options.include) params.include = options.include.join(',');
        if (options.perPage != null) params.per_page = options.perPage;
        if (options.page != null) params.page = options.page;
        return params;
    }

    /**
     * Get a single location by ID
     */
    async getById(id: string, include?: string[]): Promise<FlattenedLocationResource> {
        const params: Record<string, any> = {};
        if (include) {
            params.include = include.join(',');
        }

        return this.getSingle<LocationResource>(`/locations/${id}`, params);
    }

    // ===== Associations =====

    /**
     * Get location event periods for a location
     */
    async getLocationEventPeriods(locationId: string): Promise<{ data: FlattenedLocationEventPeriodResource[]; meta?: any; links?: any }> {
        return this.getList<LocationEventPeriodResource>(`/locations/${locationId}/location_event_periods`);
    }

    /**
     * Get location event times for a location
     */
    async getLocationEventTimes(locationId: string): Promise<{ data: FlattenedLocationEventTimeResource[]; meta?: any; links?: any }> {
        return this.getList<LocationEventTimeResource>(`/locations/${locationId}/location_event_times`);
    }

    /**
     * Get location labels for a location.
     * Note: The API docs list location_labels only under check_ins (check_in_id + location_id).
     * If this returns empty or 404, use checkIns.getLocationLabels(checkInId, locationId) instead.
     * @see https://developer.planning.center/docs/#/apps/check-ins/2025-05-28/vertices/location_label
     */
    async getLocationLabels(locationId: string): Promise<{ data: FlattenedLocationLabelResource[]; meta?: any; links?: any }> {
        return this.getList<LocationLabelResource>(`/locations/${locationId}/location_labels`);
    }
}

