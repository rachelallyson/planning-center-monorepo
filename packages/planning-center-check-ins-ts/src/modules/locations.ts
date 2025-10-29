/**
 * Locations Module for Check-Ins API
 */

import { BaseModule } from '@rachelallyson/planning-center-base-ts';
import type { 
    PcoHttpClient, 
    PaginationHelper, 
    PcoEventEmitter,
} from '@rachelallyson/planning-center-base-ts';
import type {
    LocationResource,
    LocationEventPeriodResource,
    LocationEventTimeResource,
    LocationLabelResource,
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
     * Get all locations with optional filtering
     */
    async getAll(options: LocationsListOptions = {}): Promise<{ data: LocationResource[]; meta?: any; links?: any }> {
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

        return this.getList<LocationResource>('/check-ins/v2/locations', params);
    }

    /**
     * Get a single location by ID
     */
    async getById(id: string, include?: string[]): Promise<LocationResource> {
        const params: Record<string, any> = {};
        if (include) {
            params.include = include.join(',');
        }

        return this.getSingle<LocationResource>(`/check-ins/v2/locations/${id}`, params);
    }

    // ===== Associations =====

    /**
     * Get location event periods for a location
     */
    async getLocationEventPeriods(locationId: string): Promise<{ data: LocationEventPeriodResource[]; meta?: any; links?: any }> {
        return this.getList<LocationEventPeriodResource>(`/check-ins/v2/locations/${locationId}/location_event_periods`);
    }

    /**
     * Get location event times for a location
     */
    async getLocationEventTimes(locationId: string): Promise<{ data: LocationEventTimeResource[]; meta?: any; links?: any }> {
        return this.getList<LocationEventTimeResource>(`/check-ins/v2/locations/${locationId}/location_event_times`);
    }

    /**
     * Get location labels for a location
     */
    async getLocationLabels(locationId: string): Promise<{ data: LocationLabelResource[]; meta?: any; links?: any }> {
        return this.getList<LocationLabelResource>(`/check-ins/v2/locations/${locationId}/location_labels`);
    }
}

