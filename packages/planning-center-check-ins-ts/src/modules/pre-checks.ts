/**
 * PreChecks Module for Check-Ins API
 * @see https://developer.planning.center/docs/#/apps/check-ins/2025-05-28/vertices/pre_check
 */

import { BaseModule } from '@rachelallyson/planning-center-base-ts';
import type {
    PcoHttpClient,
    PaginationHelper,
    PcoClientConfig,
} from '@rachelallyson/planning-center-base-ts';
import type * as Types from '../types';
import type {
    PreCheckGetByIdOptions,
    PreChecksGetAllOptions,
    PreChecksGetPageOptions,
} from '../types/api-options';

/** Pre-checks: getPage, getById. */
export class PreChecksModule extends BaseModule {
    constructor(
        httpClient: PcoHttpClient,
        paginationHelper: PaginationHelper,
        getConfig?: () => PcoClientConfig
    ) {
        super(httpClient, paginationHelper, getConfig);
    }

    /**
     * Get all pre-checks across all pages with optional filtering.
     * Use getPage() when you need a single page or custom per_page/page.
     */
    async getAll(options?: PreChecksGetAllOptions) {
        return this.getAllPages<Types.PreCheckResource, PreChecksGetAllOptions>('/pre_checks', options);
    }

    /**
     * Get a single page of pre-checks with optional filtering and pagination.
     */
    async getPage(options?: PreChecksGetPageOptions) {
        return this.getList<Types.PreCheckResource, PreChecksGetPageOptions>('/pre_checks', options);
    }

    /**
     * Get a single pre-check by ID. Can Include: event, person.
     */
    async getById(id: string, options?: PreCheckGetByIdOptions) {
        return this.getSingle<Types.PreCheckResource>(`/pre_checks/${id}`, options);
    }
}

