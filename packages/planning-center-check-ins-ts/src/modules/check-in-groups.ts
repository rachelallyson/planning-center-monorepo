/**
 * CheckInGroups Module for Check-Ins API
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
import type { CheckInGroupResource } from '../types';

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
        eventEmitter: PcoEventEmitter
    ) {
        super(httpClient, paginationHelper, eventEmitter);
    }

    /**
     * Get all check-in groups for a station across all pages.
     * Check-Ins API lists check-in groups under a station: GET /stations/:station_id/check_in_groups.
     */
    async getAll(options: CheckInGroupsListOptions): Promise<PaginationResult<CheckInGroupResource>> {
        const { stationId, ...rest } = options;
        const params = this.buildParams(rest);
        return this.getAllPages<CheckInGroupResource>(`/stations/${stationId}/check_in_groups`, params);
    }

    /**
     * Get a single page of check-in groups for a station.
     */
    async getPage(options: CheckInGroupsListOptions): Promise<{ data: CheckInGroupResource[]; meta?: Meta; links?: TopLevelLinks }> {
        const { stationId, ...rest } = options;
        const params = this.buildParams(rest);
        return this.getList<CheckInGroupResource>(`/stations/${stationId}/check_in_groups`, params);
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
    async getById(id: string, include?: string[]): Promise<CheckInGroupResource> {
        const params: Record<string, any> = {};
        if (include) {
            params.include = include.join(',');
        }

        return this.getSingle<CheckInGroupResource>(`/check_in_groups/${id}`, params);
    }
}

