/**
 * PreChecks Module for Check-Ins API
 */

import { BaseModule } from '@rachelallyson/planning-center-base-ts';
import type { 
    PcoHttpClient, 
    PaginationHelper, 
    PcoEventEmitter,
} from '@rachelallyson/planning-center-base-ts';
import type {
    PreCheckResource,
} from '../types';

export interface PreChecksListOptions {
    where?: Record<string, any>;
    include?: string[];
    perPage?: number;
    page?: number;
}

export class PreChecksModule extends BaseModule {
    constructor(
        httpClient: PcoHttpClient,
        paginationHelper: PaginationHelper,
        eventEmitter: PcoEventEmitter
    ) {
        super(httpClient, paginationHelper, eventEmitter);
    }

    /**
     * Get all pre-checks with optional filtering
     */
    async getAll(options: PreChecksListOptions = {}): Promise<{ data: PreCheckResource[]; meta?: any; links?: any }> {
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

        return this.getList<PreCheckResource>('/check-ins/v2/pre_checks', params);
    }

    /**
     * Get a single pre-check by ID
     */
    async getById(id: string, include?: string[]): Promise<PreCheckResource> {
        const params: Record<string, any> = {};
        if (include) {
            params.include = include.join(',');
        }

        return this.getSingle<PreCheckResource>(`/check-ins/v2/pre_checks/${id}`, params);
    }
}

