/**
 * IntegrationLinks Module for Check-Ins API
 */

import { BaseModule } from '@rachelallyson/planning-center-base-ts';
import type {
    PcoHttpClient,
    PaginationHelper,
    PcoEventEmitter,
    PcoClientConfig
} from '@rachelallyson/planning-center-base-ts';
import type * as Types from '../types';

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
        eventEmitter: PcoEventEmitter,
        getConfig?: () => PcoClientConfig
    ) {
        super(httpClient, paginationHelper, eventEmitter, getConfig);
    }


    /**
     * Get all integration links across all pages with optional filtering.
     * Use getPage() when you need a single page or custom perPage/page.
     */
    async getAll(options: IntegrationLinksListOptions = {}) {
        const params = this.buildParams(options);
        return this.getAllPages<Types.IntegrationLinkResourceObject>('/integration_links', params);
    }

    /**
     * Get a single page of integration links with optional filtering and pagination.
     */
    async getPage(options: IntegrationLinksListOptions = {}) {
        const params = this.buildParams(options);
        return this.getList<Types.IntegrationLinkResourceObject, Types.IntegrationLinkRelResourceMap, Types.CheckInsResourceTypeToRelMap>('/integration_links', params);
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
    async getById(id: string, include?: string[]) {
        const params: Record<string, any> = {};
        if (include) {
            params.include = include.join(',');
        }

        return this.getSingle<Types.IntegrationLinkResourceObject, Types.IntegrationLinkRelResourceMap, Types.CheckInsResourceTypeToRelMap>(`/integration_links/${id}`, params);
    }
}

