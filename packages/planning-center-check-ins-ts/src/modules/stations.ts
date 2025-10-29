/**
 * Stations Module for Check-Ins API
 */

import { BaseModule } from '@rachelallyson/planning-center-base-ts';
import type { 
    PcoHttpClient, 
    PaginationHelper, 
    PcoEventEmitter,
} from '@rachelallyson/planning-center-base-ts';
import type {
    StationResource,
} from '../types';

export interface StationsListOptions {
    where?: Record<string, any>;
    include?: string[];
    perPage?: number;
    page?: number;
}

export class StationsModule extends BaseModule {
    constructor(
        httpClient: PcoHttpClient,
        paginationHelper: PaginationHelper,
        eventEmitter: PcoEventEmitter
    ) {
        super(httpClient, paginationHelper, eventEmitter);
    }

    /**
     * Get all stations with optional filtering
     */
    async getAll(options: StationsListOptions = {}): Promise<{ data: StationResource[]; meta?: any; links?: any }> {
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

        return this.getList<StationResource>('/check-ins/v2/stations', params);
    }

    /**
     * Get a single station by ID
     */
    async getById(id: string, include?: string[]): Promise<StationResource> {
        const params: Record<string, any> = {};
        if (include) {
            params.include = include.join(',');
        }

        return this.getSingle<StationResource>(`/check-ins/v2/stations/${id}`, params);
    }
}

