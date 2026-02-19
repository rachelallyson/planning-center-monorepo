/**
 * Stations Module for Check-Ins API
 * @see https://developer.planning.center/docs/#/apps/check-ins/2025-05-28/vertices/station
 */

import { BaseModule } from '@rachelallyson/planning-center-base-ts';
import type {
    PcoHttpClient,
    PaginationHelper,
    PcoClientConfig,
} from '@rachelallyson/planning-center-base-ts';
import type * as Types from '../types';
import type {
    StationGetByIdOptions,
    StationsGetAllOptions,
    StationsGetPageOptions,
} from '../types/api-options';

/** Stations: getPage, getById, create, update, delete. */
export class StationsModule extends BaseModule {
    constructor(
        httpClient: PcoHttpClient,
        paginationHelper: PaginationHelper,
        getConfig?: () => PcoClientConfig
    ) {
        super(httpClient, paginationHelper, getConfig);
    }

    /**
     * Get all stations across all pages with optional filtering.
     * Use getPage() when you need a single page or custom per_page/page.
     */
    async getAll(options?: StationsGetAllOptions) {
        return this.getAllPages<Types.StationResource, StationsGetAllOptions>('/stations', options);
    }

    /**
     * Get a single page of stations with optional filtering and pagination.
     */
    async getPage(options?: StationsGetPageOptions) {
        return this.getList<Types.StationResource, StationsGetPageOptions>('/stations', options);
    }

    /**
     * Get a single station by ID. Can Include: check_ins.
     */
    async getById(id: string, options?: StationGetByIdOptions) {
        return this.getSingle<Types.StationResource>(`/stations/${id}`, options);
    }
}

