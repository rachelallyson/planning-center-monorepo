/**
 * Headcounts Module for Check-Ins API
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
import type { HeadcountResource } from '../types';

export interface HeadcountsListOptions {
    where?: Record<string, any>;
    include?: string[];
    perPage?: number;
    page?: number;
}

export class HeadcountsModule extends BaseModule {
    constructor(
        httpClient: PcoHttpClient,
        paginationHelper: PaginationHelper,
        eventEmitter: PcoEventEmitter
    ) {
        super(httpClient, paginationHelper, eventEmitter);
    }

    /**
     * Get all headcounts across all pages with optional filtering.
     * Use getPage() when you need a single page or custom perPage/page.
     */
    async getAll(options: HeadcountsListOptions = {}): Promise<PaginationResult<HeadcountResource>> {
        const params = this.buildParams(options);
        return this.getAllPages<HeadcountResource>('/headcounts', params);
    }

    /**
     * Get a single page of headcounts with optional filtering and pagination.
     */
    async getPage(options: HeadcountsListOptions = {}): Promise<{ data: HeadcountResource[]; meta?: Meta; links?: TopLevelLinks }> {
        const params = this.buildParams(options);
        return this.getList<HeadcountResource>('/headcounts', params);
    }

    private buildParams(options: HeadcountsListOptions): Record<string, any> {
        const params: Record<string, any> = {};
        if (options.where) Object.entries(options.where).forEach(([k, v]) => { params[`where[${k}]`] = v; });
        if (options.include) params.include = options.include.join(',');
        if (options.perPage != null) params.per_page = options.perPage;
        if (options.page != null) params.page = options.page;
        return params;
    }

    /**
     * Get a single headcount by ID
     */
    async getById(id: string, include?: string[]): Promise<HeadcountResource> {
        const params: Record<string, any> = {};
        if (include) {
            params.include = include.join(',');
        }

        return this.getSingle<HeadcountResource>(`/headcounts/${id}`, params);
    }
}

