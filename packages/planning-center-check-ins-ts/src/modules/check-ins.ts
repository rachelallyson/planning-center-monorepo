/**
 * CheckIns Module for Check-Ins API
 */

import { BaseModule } from '@rachelallyson/planning-center-base-ts';
import type {
    PcoHttpClient,
    PaginationHelper,
    PcoEventEmitter,
    PcoClientConfig
} from '@rachelallyson/planning-center-base-ts';
import type * as Types from '../types';

export interface CheckInsListOptions {
    where?: Record<string, any>;
    include?: string[];
    perPage?: number;
    page?: number;
    filter?: string[]; // attendee, checked_out, first_time, guest, not_checked_out, not_one_time_guest, one_time_guest, regular, volunteer
}

export class CheckInsModule extends BaseModule {
    constructor(
        httpClient: PcoHttpClient,
        paginationHelper: PaginationHelper,
        eventEmitter: PcoEventEmitter,
        getConfig?: () => PcoClientConfig
    ) {
        super(httpClient, paginationHelper, eventEmitter, getConfig);
    }



    /**
     * Get all check-ins across all pages with optional filtering.
     * Use getPage() when you need a single page or custom perPage/page.
     */
    async getAll(options: CheckInsListOptions = {}) {
        const params = this.buildCheckInsListParams(options);
        return this.getAllPages<Types.CheckInResourceObject, Types.CheckInResourceObject, Types.CheckInRelResourceMap>('/check_ins', params);
    }

    /**
     * Get a single page of check-ins with optional filtering and pagination.
     */
    async getPage(options: CheckInsListOptions = {}) {
        const params = this.buildCheckInsListParams(options);
        return this.getList<Types.CheckInResourceObject, Types.CheckInRelResourceMap, Types.CheckInsResourceTypeToRelMap>('/check_ins', params);
    }

    private buildCheckInsListParams(options: CheckInsListOptions): Record<string, any> {
        const params: Record<string, any> = {};
        if (options.where) {
            Object.entries(options.where).forEach(([key, value]) => {
                params[`where[${key}]`] = value;
            });
        }
        if (options.include) params.include = options.include.join(',');
        if (options.perPage != null) params.per_page = options.perPage;
        if (options.page != null) params.page = options.page;
        if (options.filter?.length) {
            options.filter.forEach(filter => { params[filter] = 'true'; });
        }
        return params;
    }

    /**
     * Get a single check-in by ID
     */
    async getById(id: string, include?: string[]) {
        const params: Record<string, any> = {};
        if (include) {
            params.include = include.join(',');
        }

        return this.getSingle<Types.CheckInResourceObject, Types.CheckInRelResourceMap, Types.CheckInsResourceTypeToRelMap>(`/check_ins/${id}`, params);
    }

    // ===== Associations =====

    /**
     * Get check-in group for a check-in
     */
    async getCheckInGroup(checkInId: string) {
        try {
            return await this.getSingle<Types.CheckInGroupResourceObject, Types.CheckInGroupRelResourceMap, Types.CheckInsResourceTypeToRelMap>(`/check_ins/${checkInId}/check_in_group`);
        } catch (error: any) {
            if (error?.status === 404) {
                return null;
            }
            throw error;
        }
    }

    /**
     * Get check-in times for a check-in
     */
    async getCheckInTimes(checkInId: string) {
        return this.getList<Types.CheckInTimeResourceObject, Types.CheckInTimeRelResourceMap, Types.CheckInsResourceTypeToRelMap>(`/check_ins/${checkInId}/check_in_times`);
    }

    /**
     * Get station where check-in occurred (checked_in_at)
     */
    async getCheckedInAt(checkInId: string) {
        try {
            return await this.getSingle<Types.StationResourceObject, Types.StationRelResourceMap, Types.CheckInsResourceTypeToRelMap>(`/check_ins/${checkInId}/checked_in_at`);
        } catch (error: any) {
            if (error?.status === 404) {
                return null;
            }
            throw error;
        }
    }

    /**
     * Get person who checked in (checked_in_by)
     */
    async getCheckedInBy(checkInId: string) {
        try {
            return await this.getSingle<any>(`/check_ins/${checkInId}/checked_in_by`);
        } catch (error: any) {
            if (error?.status === 404) {
                return null;
            }
            throw error;
        }
    }

    /**
     * Get person who checked out (checked_out_by)
     */
    async getCheckedOutBy(checkInId: string) {
        try {
            return await this.getSingle<any>(`/check_ins/${checkInId}/checked_out_by`);
        } catch (error: any) {
            if (error?.status === 404) {
                return null;
            }
            throw error;
        }
    }

    /**
     * Get event for a check-in
     */
    async getEvent(checkInId: string) {
        return this.getSingle<Types.EventResourceObject, Types.EventRelResourceMap, Types.CheckInsResourceTypeToRelMap>(`/check_ins/${checkInId}/event`);
    }

    /**
     * Get event period for a check-in
     */
    async getEventPeriod(checkInId: string) {
        return this.getSingle<Types.EventPeriodResourceObject, Types.EventPeriodRelResourceMap, Types.CheckInsResourceTypeToRelMap>(`/check_ins/${checkInId}/event_period`);
    }

    /**
     * Get event times for a check-in
     */
    async getEventTimes(checkInId: string) {
        return this.getList<Types.EventTimeResourceObject, Types.EventTimeRelResourceMap, Types.CheckInsResourceTypeToRelMap>(`/check_ins/${checkInId}/event_times`);
    }

    /**
     * Get locations for a check-in
     */
    async getLocations(checkInId: string) {
        return this.getList<Types.LocationResourceObject, Types.LocationRelResourceMap, Types.CheckInsResourceTypeToRelMap>(`/check_ins/${checkInId}/locations`);
    }

    /**
     * Get location labels for a check-in at a specific location.
     * Per API docs, location_labels are only available under check_ins, not under locations.
     * @see https://developer.planning.center/docs/#/apps/check-ins/2025-05-28/vertices/location_label
     */
    async getLocationLabels(checkInId: string, locationId: string) {
        return this.getList<Types.LocationLabelResourceObject, Types.LocationLabelRelResourceMap, Types.CheckInsResourceTypeToRelMap>(`/check_ins/${checkInId}/locations/${locationId}/location_labels`);
    }

    /**
     * Get options for a check-in
     */
    async getOptions(checkInId: string) {
        return this.getList<Types.OptionResourceObject, Types.OptionRelResourceMap, Types.CheckInsResourceTypeToRelMap>(`/check_ins/${checkInId}/options`);
    }

    /**
     * Get person for a check-in
     */
    async getPerson(checkInId: string) {
        try {
            return await this.getSingle<any>(`/check_ins/${checkInId}/person`);
        } catch (error: any) {
            if (error?.status === 404) {
                return null;
            }
            throw error;
        }
    }
}

