/**
 * IntegrationLinks Module for Check-Ins API
 */

import { BaseModule } from '@rachelallyson/planning-center-base-ts';
import type { 
    PcoHttpClient, 
    PaginationHelper, 
    PcoEventEmitter,
} from '@rachelallyson/planning-center-base-ts';
import type {
    IntegrationLinkResource,
} from '../types';

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
     * Get all integration links with optional filtering
     */
    async getAll(options: IntegrationLinksListOptions = {}): Promise<{ data: IntegrationLinkResource[]; meta?: any; links?: any }> {
        const params: Record<string, any> = {};

        if (options.where) {
            Object.entries(options.where).forEach(([key, value]) => {
                params[`where[${key}]`] = value;
            });
        }

        if (options.include) {
            params.include = options.include.join(',');
        }

        if (options.perPage) {
            params.per_page = options.perPage;
        }

        if (options.page) {
            params.page = options.page;
        }

        return this.getList<IntegrationLinkResource>('/check-ins/v2/integration_links', params);
    }

    /**
     * Get a single integration link by ID
     */
    async getById(id: string, include?: string[]): Promise<IntegrationLinkResource> {
        const params: Record<string, any> = {};
        if (include) {
            params.include = include.join(',');
        }

        return this.getSingle<IntegrationLinkResource>(`/check-ins/v2/integration_links/${id}`, params);
    }
}

