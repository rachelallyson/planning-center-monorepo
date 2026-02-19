/**
 * Themes Module for Check-Ins API
 * @see https://developer.planning.center/docs/#/apps/check-ins/2025-05-28/vertices/theme
 */

import { BaseModule } from '@rachelallyson/planning-center-base-ts';
import type {
    PcoHttpClient,
    PaginationHelper,
    PcoClientConfig,
} from '@rachelallyson/planning-center-base-ts';
import type * as Types from '../types';
import type {
    ThemeGetByIdOptions,
    ThemesGetAllOptions,
    ThemesGetPageOptions,
} from '../types/api-options';

/** Themes: getPage, getById. */
export class ThemesModule extends BaseModule {
    constructor(
        httpClient: PcoHttpClient,
        paginationHelper: PaginationHelper,
        getConfig?: () => PcoClientConfig
    ) {
        super(httpClient, paginationHelper, getConfig);
    }

    /**
     * Get all themes across all pages with optional filtering.
     * Use getPage() when you need a single page or custom per_page/page.
     */
    async getAll(options?: ThemesGetAllOptions) {
        return this.getAllPages<Types.ThemeResource, ThemesGetAllOptions>('/themes', options);
    }

    /**
     * Get a single page of themes with optional filtering and pagination.
     */
    async getPage(options?: ThemesGetPageOptions) {
        return this.getList<Types.ThemeResource, ThemesGetPageOptions>('/themes', options);
    }

    /**
     * Get a single theme by ID.
     */
    async getById(id: string, options?: ThemeGetByIdOptions) {
        return this.getSingle<Types.ThemeResource>(`/themes/${id}`, options);
    }
}

