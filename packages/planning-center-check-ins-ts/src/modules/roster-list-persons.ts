/**
 * RosterListPersons Module for Check-Ins API
 */

import { BaseModule } from '@rachelallyson/planning-center-base-ts';
import type { 
    PcoHttpClient, 
    PaginationHelper, 
    PcoEventEmitter,
} from '@rachelallyson/planning-center-base-ts';
import type {
    RosterListPersonResource,
} from '../types';

export interface RosterListPersonsListOptions {
    where?: Record<string, any>;
    include?: string[];
    perPage?: number;
    page?: number;
}

export class RosterListPersonsModule extends BaseModule {
    constructor(
        httpClient: PcoHttpClient,
        paginationHelper: PaginationHelper,
        eventEmitter: PcoEventEmitter
    ) {
        super(httpClient, paginationHelper, eventEmitter);
    }

    /**
     * Get all roster list persons with optional filtering
     */
    async getAll(options: RosterListPersonsListOptions = {}): Promise<{ data: RosterListPersonResource[]; meta?: any; links?: any }> {
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

        return this.getList<RosterListPersonResource>('/check-ins/v2/roster_list_persons', params);
    }

    /**
     * Get a single roster list person by ID
     */
    async getById(id: string, include?: string[]): Promise<RosterListPersonResource> {
        const params: Record<string, any> = {};
        if (include) {
            params.include = include.join(',');
        }

        return this.getSingle<RosterListPersonResource>(`/check-ins/v2/roster_list_persons/${id}`, params);
    }
}

