/**
 * Stations Module for Check-Ins API
 */

import { BaseModule } from '@rachelallyson/planning-center-base-ts';
import type {
    PcoHttpClient,
    PaginationHelper,
    PcoEventEmitter,
    PcoClientConfig
} from '@rachelallyson/planning-center-base-ts';
import type * as Types from '../types';

export interface StationsListOptions {
    where?: Record<string, any>;
    include?: string[];
    perPage?: number;
    page?: number;
}

export class StationsModule extends BaseModule {
    constructor(
        httpClient: PcoHttpClient,
        paginationHelper: PaginationHelper,
        eventEmitter: PcoEventEmitter,
        getConfig?: () => PcoClientConfig
    ) {
        super(httpClient, paginationHelper, eventEmitter, getConfig);
    }


    /**
     * Get all stations across all pages with optional filtering.
     * Use getPage() when you need a single page or custom perPage/page.
     */
    async getAll(options: StationsListOptions = {}) {
        const params = this.buildParams(options);
        return this.getAllPages<Types.StationResourceObject>('/stations', params);
    }

    /**
     * Get a single page of stations with optional filtering and pagination.
     */
    async getPage(options: StationsListOptions = {}) {
        const params = this.buildParams(options);
        return this.getList<Types.StationResourceObject, Types.StationRelResourceMap, Types.CheckInsResourceTypeToRelMap>('/stations', params);
    }

    private buildParams(options: StationsListOptions): Record<string, any> {
        const params: Record<string, any> = {};
        if (options.where) Object.entries(options.where).forEach(([k, v]) => { params[`where[${k}]`] = v; });
        if (options.include) params.include = options.include.join(',');
        if (options.perPage != null) params.per_page = options.perPage;
        if (options.page != null) params.page = options.page;
        return params;
    }

    /**
     * Get a single station by ID
     */
    async getById(id: string, include?: string[]) {
        const params: Record<string, any> = {};
        if (include) {
            params.include = include.join(',');
        }

        return this.getSingle<Types.StationResourceObject, Types.StationRelResourceMap, Types.CheckInsResourceTypeToRelMap>(`/stations/${id}`, params);
    }
}

