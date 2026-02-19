/**
 * IntegrationLinks Module for Check-Ins API
 * @see https://developer.planning.center/docs/#/apps/check-ins/2025-05-28/vertices/integration_link
 */

import { BaseModule } from '@rachelallyson/planning-center-base-ts';
import type {
    PcoHttpClient,
    PaginationHelper,
    PcoClientConfig,
} from '@rachelallyson/planning-center-base-ts';
import type * as Types from '../types';
import type {
    IntegrationLinkGetByIdOptions,
    IntegrationLinksGetAllOptions,
    IntegrationLinksGetPageOptions,
} from '../types/api-options';

/** Integration links: getPage, getById. */
export class IntegrationLinksModule extends BaseModule {
    constructor(
        httpClient: PcoHttpClient,
        paginationHelper: PaginationHelper,
        getConfig?: () => PcoClientConfig
    ) {
        super(httpClient, paginationHelper, getConfig);
    }

    /**
     * Get all integration links across all pages with optional filtering.
     * Use getPage() when you need a single page or custom per_page/page.
     */
    async getAll(options?: IntegrationLinksGetAllOptions) {
        return this.getAllPages<Types.IntegrationLinkResource, IntegrationLinksGetAllOptions>('/integration_links', options);
    }

    /**
     * Get a single page of integration links with optional filtering and pagination.
     */
    async getPage(options?: IntegrationLinksGetPageOptions) {
        return this.getList<Types.IntegrationLinkResource, IntegrationLinksGetPageOptions>('/integration_links', options);
    }

    /**
     * Get a single integration link by ID. Can Include: event.
     */
    async getById(id: string, options?: IntegrationLinkGetByIdOptions) {
        return this.getSingle<Types.IntegrationLinkResource>(`/integration_links/${id}`, options);
    }
}

