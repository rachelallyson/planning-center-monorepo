/**
 * Locations Module for Check-Ins API
 */

import { BaseModule } from '@rachelallyson/planning-center-base-ts';
import type {
    PcoHttpClient,
    PaginationHelper,
    PcoEventEmitter,
    PcoClientConfig
} from '@rachelallyson/planning-center-base-ts';
import type * as Types from '../types';

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
        eventEmitter: PcoEventEmitter,
        getConfig?: () => PcoClientConfig
    ) {
        super(httpClient, paginationHelper, eventEmitter, getConfig);
    }


    /**
     * Get all locations across all pages with optional filtering.
     * Use getPage() when you need a single page or custom perPage/page.
     */
    async getAll(options: LocationsListOptions = {}) {
        const params = this.buildParams(options);
        return this.getAllPages<Types.LocationResourceObject>('/locations', params);
    }

    /**
     * Get a single page of locations with optional filtering and pagination.
     */
    async getPage(options: LocationsListOptions = {}) {
        const params = this.buildParams(options);
        return this.getList<Types.LocationResourceObject, Types.LocationRelResourceMap, Types.CheckInsResourceTypeToRelMap>('/locations', params);
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
    async getById(id: string, include?: string[]) {
        const params: Record<string, any> = {};
        if (include) {
            params.include = include.join(',');
        }

        return this.getSingle<Types.LocationResourceObject, Types.LocationRelResourceMap, Types.CheckInsResourceTypeToRelMap>(`/locations/${id}`, params);
    }

    // ===== Associations =====

    /**
     * Get location event periods for a location
     */
    async getLocationEventPeriods(locationId: string) {
        return this.getList<Types.LocationEventPeriodResourceObject, Types.LocationEventPeriodRelResourceMap, Types.CheckInsResourceTypeToRelMap>(`/locations/${locationId}/location_event_periods`);
    }

    /**
     * Get location event times for a location
     */
    async getLocationEventTimes(locationId: string) {
        return this.getList<Types.LocationEventTimeResourceObject, Types.LocationEventTimeRelResourceMap, Types.CheckInsResourceTypeToRelMap>(`/locations/${locationId}/location_event_times`);
    }

    /**
     * Get location labels for a location.
     * Note: The API docs list location_labels only under check_ins (check_in_id + location_id).
     * If this returns empty or 404, use checkIns.getLocationLabels(checkInId, locationId) instead.
     * @see https://developer.planning.center/docs/#/apps/check-ins/2025-05-28/vertices/location_label
     */
    async getLocationLabels(locationId: string) {
        return this.getList<Types.LocationLabelResourceObject, Types.LocationLabelRelResourceMap, Types.CheckInsResourceTypeToRelMap>(`/locations/${locationId}/location_labels`);
    }
}

