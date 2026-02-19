/**
 * Headcounts Module for Check-Ins API
 * @see https://developer.planning.center/docs/#/apps/check-ins/2025-05-28/vertices/headcount
 */

import { BaseModule } from '@rachelallyson/planning-center-base-ts';
import type {
    PcoHttpClient,
    PaginationHelper,
    PcoClientConfig,
} from '@rachelallyson/planning-center-base-ts';
import type * as Types from '../types';
import type {
    HeadcountGetByIdOptions,
    HeadcountsGetAllOptions,
    HeadcountsGetPageOptions,
} from '../types/api-options';

/** Headcounts: getPage, getById. */
export class HeadcountsModule extends BaseModule {
    constructor(
        httpClient: PcoHttpClient,
        paginationHelper: PaginationHelper,
        getConfig?: () => PcoClientConfig
    ) {
        super(httpClient, paginationHelper, getConfig);
    }

    /**
     * Get all headcounts across all pages with optional filtering.
     * Use getPage() when you need a single page or custom per_page/page.
     */
    async getAll(options?: HeadcountsGetAllOptions) {
        return this.getAllPages<Types.HeadcountResource, HeadcountsGetAllOptions>('/headcounts', options);
    }

    /**
     * Get a single page of headcounts with optional filtering and pagination.
     */
    async getPage(options?: HeadcountsGetPageOptions) {
        return this.getList<Types.HeadcountResource, HeadcountsGetPageOptions>('/headcounts', options);
    }

    /**
     * Get a single headcount by ID. Can Include: attendance_type, event_time.
     */
    async getById(id: string, options?: HeadcountGetByIdOptions) {
        return this.getSingle<Types.HeadcountResource>(`/headcounts/${id}`, options);
    }
}

