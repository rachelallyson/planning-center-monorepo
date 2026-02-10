/**
 * Themes Module for Check-Ins API
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
import type { ThemeResource, FlattenedThemeResource } from '../types';

export interface ThemesListOptions {
    where?: Record<string, any>;
    include?: string[];
    perPage?: number;
    page?: number;
}

export class ThemesModule extends BaseModule {
    constructor(
        httpClient: PcoHttpClient,
        paginationHelper: PaginationHelper,
        eventEmitter: PcoEventEmitter
    ) {
        super(httpClient, paginationHelper, eventEmitter);
    }

    /**
     * Get all themes across all pages with optional filtering.
     * Use getPage() when you need a single page or custom perPage/page.
     */
    async getAll(options: ThemesListOptions = {}): Promise<PaginationResult<ThemeResource>> {
        const params = this.buildParams(options);
        return this.getAllPages<ThemeResource>('/themes', params);
    }

    /**
     * Get a single page of themes with optional filtering and pagination.
     */
    async getPage(options: ThemesListOptions = {}): Promise<{ data: FlattenedThemeResource[]; meta?: Meta; links?: TopLevelLinks }> {
        const params = this.buildParams(options);
        return this.getList<ThemeResource>('/themes', params);
    }

    private buildParams(options: ThemesListOptions): Record<string, any> {
        const params: Record<string, any> = {};
        if (options.where) Object.entries(options.where).forEach(([k, v]) => { params[`where[${k}]`] = v; });
        if (options.include) params.include = options.include.join(',');
        if (options.perPage != null) params.per_page = options.perPage;
        if (options.page != null) params.page = options.page;
        return params;
    }

    /**
     * Get a single theme by ID
     */
    async getById(id: string, include?: string[]): Promise<FlattenedThemeResource> {
        const params: Record<string, any> = {};
        if (include) {
            params.include = include.join(',');
        }

        return this.getSingle<ThemeResource>(`/themes/${id}`, params);
    }
}

