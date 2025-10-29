/**
 * CheckInTimes Module for Check-Ins API
 */

import { BaseModule } from '@rachelallyson/planning-center-base-ts';
import type { 
    PcoHttpClient, 
    PaginationHelper, 
    PcoEventEmitter,
} from '@rachelallyson/planning-center-base-ts';
import type {
    CheckInTimeResource,
} from '../types';

export interface CheckInTimesListOptions {
    where?: Record<string, any>;
    include?: string[];
    perPage?: number;
    page?: number;
}

export class CheckInTimesModule extends BaseModule {
    constructor(
        httpClient: PcoHttpClient,
        paginationHelper: PaginationHelper,
        eventEmitter: PcoEventEmitter
    ) {
        super(httpClient, paginationHelper, eventEmitter);
    }

    /**
     * Get all check-in times with optional filtering
     */
    async getAll(options: CheckInTimesListOptions = {}): Promise<{ data: CheckInTimeResource[]; meta?: any; links?: any }> {
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

        return this.getList<CheckInTimeResource>('/check-ins/v2/check_in_times', params);
    }

    /**
     * Get a single check-in time by ID
     */
    async getById(id: string, include?: string[]): Promise<CheckInTimeResource> {
        const params: Record<string, any> = {};
        if (include) {
            params.include = include.join(',');
        }

        return this.getSingle<CheckInTimeResource>(`/check-ins/v2/check_in_times/${id}`, params);
    }
}

