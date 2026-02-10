/**
 * IntegrationLinks Module for Check-Ins API
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
import type { IntegrationLinkResource, FlattenedIntegrationLinkResource } from '../types';

export interface IntegrationLinksListOptions {
    where?: Record<string, any>;
    include?: string[];
    perPage?: number;
    page?: number;
}

export class IntegrationLinksModule extends BaseModule {
    constructor(
        httpClient: PcoHttpClient,
        paginationHelper: PaginationHelper,
        eventEmitter: PcoEventEmitter
    ) {
        super(httpClient, paginationHelper, eventEmitter);
    }

    /**
     * Get all integration links across all pages with optional filtering.
     * Use getPage() when you need a single page or custom perPage/page.
     */
    async getAll(options: IntegrationLinksListOptions = {}): Promise<PaginationResult<IntegrationLinkResource>> {
        const params = this.buildParams(options);
        return this.getAllPages<IntegrationLinkResource>('/integration_links', params);
    }

    /**
     * Get a single page of integration links with optional filtering and pagination.
     */
    async getPage(options: IntegrationLinksListOptions = {}): Promise<{ data: FlattenedIntegrationLinkResource[]; meta?: Meta; links?: TopLevelLinks }> {
        const params = this.buildParams(options);
        return this.getList<IntegrationLinkResource>('/integration_links', params);
    }

    private buildParams(options: IntegrationLinksListOptions): Record<string, any> {
        const params: Record<string, any> = {};
        if (options.where) Object.entries(options.where).forEach(([k, v]) => { params[`where[${k}]`] = v; });
        if (options.include) params.include = options.include.join(',');
        if (options.perPage != null) params.per_page = options.perPage;
        if (options.page != null) params.page = options.page;
        return params;
    }

    /**
     * Get a single integration link by ID
     */
    async getById(id: string, include?: string[]): Promise<FlattenedIntegrationLinkResource> {
        const params: Record<string, any> = {};
        if (include) {
            params.include = include.join(',');
        }

        return this.getSingle<IntegrationLinkResource>(`/integration_links/${id}`, params);
    }
}

