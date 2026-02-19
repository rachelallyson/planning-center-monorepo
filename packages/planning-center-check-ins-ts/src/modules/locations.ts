/**
 * Locations Module for Check-Ins API
 * @see https://developer.planning.center/docs/#/apps/check-ins/2025-05-28/vertices/location
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
    LocationGetByIdOptions,
    LocationsGetAllOptions,
    LocationsGetPageOptions,
} from '../types/api-options';

/** Locations: getPage, getById, create, update, delete. */
export class LocationsModule extends BaseModule {
    constructor(
        httpClient: PcoHttpClient,
        paginationHelper: PaginationHelper,
        getConfig?: () => PcoClientConfig
    ) {
        super(httpClient, paginationHelper, getConfig);
    }

    /**
     * Get all locations across all pages with optional filtering.
     * Use getPage() when you need a single page or custom per_page/page.
     */
    async getAll(options?: LocationsGetAllOptions) {
        return this.getAllPages<Types.LocationResource, LocationsGetAllOptions>('/locations', options);
    }

    /**
     * Get a single page of locations with optional filtering and pagination.
     */
    async getPage(options?: LocationsGetPageOptions) {
        return this.getList<Types.LocationResource, LocationsGetPageOptions>('/locations', options);
    }

    /**
     * Get a single location by ID. Can Include: event, location_event_periods, location_event_times, location_labels.
     */
    async getById(id: string, options?: LocationGetByIdOptions) {
        return this.getSingle<Types.LocationResource>(`/locations/${id}`, options);
    }

    // ===== Associations =====

    /**
     * Get location event periods for a location
     */
    async getLocationEventPeriods(locationId: string) {
        return this.getList<Types.LocationEventPeriodResource, QueryOptions>(`/locations/${locationId}/location_event_periods`);
    }

    /**
     * Get location event times for a location
     */
    async getLocationEventTimes(locationId: string) {
        return this.getList<Types.LocationEventTimeResource, QueryOptions>(`/locations/${locationId}/location_event_times`);
    }

    /**
     * Get location labels for a location.
     * Note: The API docs list location_labels only under check_ins (check_in_id + location_id).
     * If this returns empty or 404, use checkIns.getLocationLabels(checkInId, locationId) instead.
     * @see https://developer.planning.center/docs/#/apps/check-ins/2025-05-28/vertices/location_label
     */
    async getLocationLabels(locationId: string) {
        return this.getList<Types.LocationLabelResource, QueryOptions>(`/locations/${locationId}/location_labels`);
    }
}

