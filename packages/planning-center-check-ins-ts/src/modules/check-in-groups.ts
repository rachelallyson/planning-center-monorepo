/**
 * CheckInGroups Module for Check-Ins API
 */

import { BaseModule } from '@rachelallyson/planning-center-base-ts';
import type {
    PcoHttpClient,
    PaginationHelper,
    PcoEventEmitter,
    PcoClientConfig
} from '@rachelallyson/planning-center-base-ts';
import type * as Types from '../types';

export interface CheckInGroupsListOptions {
    /** Required: check-in groups are listed per station. */
    stationId: string;
    where?: Record<string, any>;
    include?: string[];
    perPage?: number;
    page?: number;
}

export class CheckInGroupsModule extends BaseModule {
    constructor(
        httpClient: PcoHttpClient,
        paginationHelper: PaginationHelper,
        eventEmitter: PcoEventEmitter,
        getConfig?: () => PcoClientConfig
    ) {
        super(httpClient, paginationHelper, eventEmitter, getConfig);
    }


    /**
     * Get all check-in groups for a station across all pages.
     * Check-Ins API lists check-in groups under a station: GET /stations/:station_id/check_in_groups.
     */
    async getAll(options: CheckInGroupsListOptions) {
        const { stationId, ...rest } = options;
        const params = this.buildParams(rest);
        return this.getAllPages<Types.CheckInGroupResourceObject>(`/stations/${stationId}/check_in_groups`, params);
    }

    /**
     * Get a single page of check-in groups for a station.
     */
    async getPage(options: CheckInGroupsListOptions) {
        const { stationId, ...rest } = options;
        const params = this.buildParams(rest);
        return this.getList<Types.CheckInGroupResourceObject, Types.CheckInGroupRelResourceMap, Types.CheckInsResourceTypeToRelMap>(`/stations/${stationId}/check_in_groups`, params);
    }

    private buildParams(options: Omit<CheckInGroupsListOptions, 'stationId'>): Record<string, any> {
        const params: Record<string, any> = {};
        if (options.where) Object.entries(options.where).forEach(([k, v]) => { params[`where[${k}]`] = v; });
        if (options.include) params.include = options.include.join(',');
        if (options.perPage != null) params.per_page = options.perPage;
        if (options.page != null) params.page = options.page;
        return params;
    }

    /**
     * Get a single check-in group by ID
     */
    async getById(id: string, include?: string[]) {
        const params: Record<string, any> = {};
        if (include) {
            params.include = include.join(',');
        }

        return this.getSingle<Types.CheckInGroupResourceObject, Types.CheckInGroupRelResourceMap, Types.CheckInsResourceTypeToRelMap>(`/check_in_groups/${id}`, params);
    }
}

