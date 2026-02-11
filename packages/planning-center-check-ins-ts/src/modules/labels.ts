/**
 * Labels Module for Check-Ins API
 */

import { BaseModule } from '@rachelallyson/planning-center-base-ts';
import type {
    PcoHttpClient,
    PaginationHelper,
    PcoEventEmitter,
    PcoClientConfig
} from '@rachelallyson/planning-center-base-ts';
import type * as Types from '../types';

export interface LabelsListOptions {
    where?: Record<string, any>;
    include?: string[];
    perPage?: number;
    page?: number;
}

export class LabelsModule extends BaseModule {
    constructor(
        httpClient: PcoHttpClient,
        paginationHelper: PaginationHelper,
        eventEmitter: PcoEventEmitter,
        getConfig?: () => PcoClientConfig
    ) {
        super(httpClient, paginationHelper, eventEmitter, getConfig);
    }

    /**
     * Get all labels across all pages with optional filtering.
     * Use getPage() when you need a single page or custom perPage/page.
     */
    async getAll(options: LabelsListOptions = {}) {
        const params = this.buildLabelsParams(options);
        return this.getAllPages<Types.LabelResourceObject>('/labels', params);
    }

    /**
     * Get a single page of labels with optional filtering and pagination.
     */
    async getPage(options: LabelsListOptions = {}) {
        return this.getList<Types.LabelResourceObject, Types.LabelRelResourceMap, Types.CheckInsResourceTypeToRelMap>('/labels', {
            where: options.where,
            include: options.include,
            per_page: options.perPage,
            page: options.page,
        });
    }

    private buildLabelsParams(options: LabelsListOptions): Record<string, any> {
        const params: Record<string, any> = {};
        if (options.where) {
            Object.entries(options.where).forEach(([key, value]) => {
                params[`where[${key}]`] = value;
            });
        }
        if (options.include) params.include = options.include.join(',');
        if (options.perPage != null) params.per_page = options.perPage;
        if (options.page != null) params.page = options.page;
        return params;
    }

    /**
     * Get a single label by ID
     */
    async getById(id: string, include?: string[]) {
        const params: Record<string, any> = {};
        if (include) {
            params.include = include.join(',');
        }

        return this.getSingle<Types.LabelResourceObject, Types.LabelRelResourceMap, Types.CheckInsResourceTypeToRelMap>(`/labels/${id}`, params);
    }
}

