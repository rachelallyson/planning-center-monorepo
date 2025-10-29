/**
 * CheckInGroups Module for Check-Ins API
 */

import { BaseModule } from '@rachelallyson/planning-center-base-ts';
import type { 
    PcoHttpClient, 
    PaginationHelper, 
    PcoEventEmitter,
} from '@rachelallyson/planning-center-base-ts';
import type {
    CheckInGroupResource,
} from '../types';

export interface CheckInGroupsListOptions {
    where?: Record<string, any>;
    include?: string[];
    perPage?: number;
    page?: number;
}

export class CheckInGroupsModule extends BaseModule {
    constructor(
        httpClient: PcoHttpClient,
        paginationHelper: PaginationHelper,
        eventEmitter: PcoEventEmitter
    ) {
        super(httpClient, paginationHelper, eventEmitter);
    }

    /**
     * Get all check-in groups with optional filtering
     */
    async getAll(options: CheckInGroupsListOptions = {}): Promise<{ data: CheckInGroupResource[]; meta?: any; links?: any }> {
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

        return this.getList<CheckInGroupResource>('/check-ins/v2/check_in_groups', params);
    }

    /**
     * Get a single check-in group by ID
     */
    async getById(id: string, include?: string[]): Promise<CheckInGroupResource> {
        const params: Record<string, any> = {};
        if (include) {
            params.include = include.join(',');
        }

        return this.getSingle<CheckInGroupResource>(`/check-ins/v2/check_in_groups/${id}`, params);
    }
}

