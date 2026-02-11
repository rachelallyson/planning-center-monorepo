/**
 * PreChecks Module for Check-Ins API
 */

import { BaseModule } from '@rachelallyson/planning-center-base-ts';
import type {
    PcoHttpClient,
    PaginationHelper,
    PcoEventEmitter,
    PcoClientConfig
} from '@rachelallyson/planning-center-base-ts';
import type * as Types from '../types';

export interface PreChecksListOptions {
    where?: Record<string, any>;
    include?: string[];
    perPage?: number;
    page?: number;
}

export class PreChecksModule extends BaseModule {
    constructor(
        httpClient: PcoHttpClient,
        paginationHelper: PaginationHelper,
        eventEmitter: PcoEventEmitter,
        getConfig?: () => PcoClientConfig
    ) {
        super(httpClient, paginationHelper, eventEmitter, getConfig);
    }

    /**
     * Get all pre-checks across all pages with optional filtering.
     * Use getPage() when you need a single page or custom perPage/page.
     */
    async getAll(options: PreChecksListOptions = {}) {
        const params = this.buildParams(options);
        return this.getAllPages<Types.PreCheckResourceObject>('/pre_checks', params);
    }

    /**
     * Get a single page of pre-checks with optional filtering and pagination.
     */
    async getPage(options: PreChecksListOptions = {}) {
        const params = this.buildParams(options);
        return this.getList<Types.PreCheckResourceObject, Types.PreCheckRelResourceMap, Types.CheckInsResourceTypeToRelMap>('/pre_checks', params);
    }

    private buildParams(options: PreChecksListOptions): Record<string, any> {
        const params: Record<string, any> = {};
        if (options.where) Object.entries(options.where).forEach(([k, v]) => { params[`where[${k}]`] = v; });
        if (options.include) params.include = options.include.join(',');
        if (options.perPage != null) params.per_page = options.perPage;
        if (options.page != null) params.page = options.page;
        return params;
    }

    /**
     * Get a single pre-check by ID
     */
    async getById(id: string, include?: string[]) {
        const params: Record<string, any> = {};
        if (include) {
            params.include = include.join(',');
        }

        return this.getSingle<Types.PreCheckResourceObject, Types.PreCheckRelResourceMap, Types.CheckInsResourceTypeToRelMap>(`/pre_checks/${id}`, params);
    }
}

