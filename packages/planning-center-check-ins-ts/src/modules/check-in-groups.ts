/**
 * CheckInGroups Module for Check-Ins API
 * @see https://developer.planning.center/docs/#/apps/check-ins/2025-05-28/vertices/check_in_group
 */

import { BaseModule } from '@rachelallyson/planning-center-base-ts';
import type {
    PcoHttpClient,
    PaginationHelper,
    PcoClientConfig,
} from '@rachelallyson/planning-center-base-ts';
import type * as Types from '../types';
import type {
    CheckInGroupGetByIdOptions,
    CheckInGroupsGetAllOptions,
    CheckInGroupsGetPageOptions,
} from '../types/api-options';

/** Check-in groups: getPage, getById. */
export class CheckInGroupsModule extends BaseModule {
    constructor(
        httpClient: PcoHttpClient,
        paginationHelper: PaginationHelper,
        getConfig?: () => PcoClientConfig
    ) {
        super(httpClient, paginationHelper, getConfig);
    }

    /**
     * Get all check-in groups for a station across all pages.
     * Check-Ins API lists check-in groups under a station: GET /stations/:station_id/check_in_groups.
     */
    async getAll(stationId: string, options?: CheckInGroupsGetAllOptions) {
        return this.getAllPages<Types.CheckInGroupResource, CheckInGroupsGetAllOptions>(`/stations/${stationId}/check_in_groups`, options);
    }

    /**
     * Get a single page of check-in groups for a station.
     */
    async getPage(stationId: string, options?: CheckInGroupsGetPageOptions) {
        return this.getList<Types.CheckInGroupResource, CheckInGroupsGetPageOptions>(`/stations/${stationId}/check_in_groups`, options);
    }

    /**
     * Get a single check-in group by ID. Can Include: check_ins, event_period, print_station.
     */
    async getById(id: string, options?: CheckInGroupGetByIdOptions) {
        return this.getSingle<Types.CheckInGroupResource>(`/check_in_groups/${id}`, options);
    }
}

