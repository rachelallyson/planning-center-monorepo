/**
 * Options Module for Check-Ins API
 * @see https://developer.planning.center/docs/#/apps/check-ins/2025-05-28/vertices/option
 */

import { BaseModule } from '@rachelallyson/planning-center-base-ts';
import type {
    PcoHttpClient,
    PaginationHelper,
    PcoClientConfig,
} from '@rachelallyson/planning-center-base-ts';
import type * as Types from '../types';
import type {
    OptionGetByIdOptions,
    OptionsGetAllOptions,
    OptionsGetPageOptions,
} from '../types/api-options';

/** Options: getPage, getById. */
export class OptionsModule extends BaseModule {
    constructor(
        httpClient: PcoHttpClient,
        paginationHelper: PaginationHelper,
        getConfig?: () => PcoClientConfig
    ) {
        super(httpClient, paginationHelper, getConfig);
    }

    /**
     * Get all options across all pages with optional filtering.
     * Use getPage() when you need a single page or custom per_page/page.
     */
    async getAll(options?: OptionsGetAllOptions) {
        return this.getAllPages<Types.OptionResource, OptionsGetAllOptions>('/options', options);
    }

    /**
     * Get a single page of options with optional filtering and pagination.
     */
    async getPage(options?: OptionsGetPageOptions) {
        return this.getList<Types.OptionResource, OptionsGetPageOptions>('/options', options);
    }

    /**
     * Get a single option by ID. Can Include: label (include associated label).
     */
    async getById(id: string, options?: OptionGetByIdOptions) {
        return this.getSingle<Types.OptionResource>(`/options/${id}`, options);
    }
}

