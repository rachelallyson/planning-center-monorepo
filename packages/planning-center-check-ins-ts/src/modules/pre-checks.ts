/**
 * PreChecks Module for Check-Ins API
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
import type { PreCheckResource } from '../types';

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
        eventEmitter: PcoEventEmitter
    ) {
        super(httpClient, paginationHelper, eventEmitter);
    }

    /**
     * Get all pre-checks across all pages with optional filtering.
     * Use getPage() when you need a single page or custom perPage/page.
     */
    async getAll(options: PreChecksListOptions = {}): Promise<PaginationResult<PreCheckResource>> {
        const params = this.buildParams(options);
        return this.getAllPages<PreCheckResource>('/pre_checks', params);
    }

    /**
     * Get a single page of pre-checks with optional filtering and pagination.
     */
    async getPage(options: PreChecksListOptions = {}): Promise<{ data: PreCheckResource[]; meta?: Meta; links?: TopLevelLinks }> {
        const params = this.buildParams(options);
        return this.getList<PreCheckResource>('/pre_checks', params);
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
    async getById(id: string, include?: string[]): Promise<PreCheckResource> {
        const params: Record<string, any> = {};
        if (include) {
            params.include = include.join(',');
        }

        return this.getSingle<PreCheckResource>(`/pre_checks/${id}`, params);
    }
}

