/**
 * Passes Module for Check-Ins API
 * @see https://developer.planning.center/docs/#/apps/check-ins/2025-05-28/vertices/pass
 */

import { BaseModule } from '@rachelallyson/planning-center-base-ts';
import type {
    PcoHttpClient,
    PaginationHelper,
    PcoClientConfig,
} from '@rachelallyson/planning-center-base-ts';
import type * as Types from '../types';
import type {
    PassGetByIdOptions,
    PassesGetAllOptions,
    PassesGetPageOptions,
} from '../types/api-options';

/** Passes: getPage, getById. */
export class PassesModule extends BaseModule {
    constructor(
        httpClient: PcoHttpClient,
        paginationHelper: PaginationHelper,
        getConfig?: () => PcoClientConfig
    ) {
        super(httpClient, paginationHelper, getConfig);
    }

    /**
     * Get all passes across all pages with optional filtering.
     * Use getPage() when you need a single page or custom per_page/page.
     */
    async getAll(options?: PassesGetAllOptions) {
        return this.getAllPages<Types.PassResource, PassesGetAllOptions>('/passes', options);
    }

    /**
     * Get a single page of passes with optional filtering and pagination.
     */
    async getPage(options?: PassesGetPageOptions) {
        return this.getList<Types.PassResource, PassesGetPageOptions>('/passes', options);
    }

    /**
     * Get a single pass by ID. Can Include: person.
     */
    async getById(id: string, options?: PassGetByIdOptions) {
        return this.getSingle<Types.PassResource>(`/passes/${id}`, options);
    }
}

