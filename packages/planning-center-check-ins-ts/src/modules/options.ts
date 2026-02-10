/**
 * Options Module for Check-Ins API
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
import type { OptionResource, CheckInResource, FlattenedOptionResource } from '../types';

export interface OptionsListOptions {
    where?: Record<string, any>;
    include?: string[];
    perPage?: number;
    page?: number;
}

export class OptionsModule extends BaseModule {
    constructor(
        httpClient: PcoHttpClient,
        paginationHelper: PaginationHelper,
        eventEmitter: PcoEventEmitter
    ) {
        super(httpClient, paginationHelper, eventEmitter);
    }

    /**
     * Get all options across all pages with optional filtering.
     * Use getPage() when you need a single page or custom perPage/page.
     */
    async getAll(options: OptionsListOptions = {}): Promise<PaginationResult<OptionResource>> {
        const params = this.buildParams(options);
        return this.getAllPages<OptionResource>('/options', params);
    }

    /**
     * Get a single page of options with optional filtering and pagination.
     */
    async getPage(options: OptionsListOptions = {}): Promise<{ data: FlattenedOptionResource[]; meta?: Meta; links?: TopLevelLinks }> {
        const params = this.buildParams(options);
        return this.getList<OptionResource>('/options', params);
    }

    private buildParams(options: OptionsListOptions): Record<string, any> {
        const params: Record<string, any> = {};
        if (options.where) Object.entries(options.where).forEach(([k, v]) => { params[`where[${k}]`] = v; });
        if (options.include) params.include = options.include.join(',');
        if (options.perPage != null) params.per_page = options.perPage;
        if (options.page != null) params.page = options.page;
        return params;
    }

    /**
     * Get a single option by ID
     */
    async getById(id: string, include?: string[]): Promise<FlattenedOptionResource> {
        const params: Record<string, any> = {};
        if (include) {
            params.include = include.join(',');
        }

        return this.getSingle<OptionResource>(`/options/${id}`, params);
    }
}

