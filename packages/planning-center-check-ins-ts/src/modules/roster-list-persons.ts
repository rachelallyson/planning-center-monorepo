/**
 * RosterListPersons Module for Check-Ins API
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
import type { RosterListPersonResource, FlattenedRosterListPersonResource } from '../types';

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
     * Get all roster list persons across all pages with optional filtering.
     * Use getPage() when you need a single page or custom perPage/page.
     */
    async getAll(options: RosterListPersonsListOptions = {}): Promise<PaginationResult<RosterListPersonResource>> {
        const params = this.buildParams(options);
        return this.getAllPages<RosterListPersonResource>('/roster_list_persons', params);
    }

    /**
     * Get a single page of roster list persons with optional filtering and pagination.
     */
    async getPage(options: RosterListPersonsListOptions = {}): Promise<{ data: FlattenedRosterListPersonResource[]; meta?: Meta; links?: TopLevelLinks }> {
        const params = this.buildParams(options);
        return this.getList<RosterListPersonResource>('/roster_list_persons', params);
    }

    private buildParams(options: RosterListPersonsListOptions): Record<string, any> {
        const params: Record<string, any> = {};
        if (options.where) Object.entries(options.where).forEach(([k, v]) => { params[`where[${k}]`] = v; });
        if (options.include) params.include = options.include.join(',');
        if (options.perPage != null) params.per_page = options.perPage;
        if (options.page != null) params.page = options.page;
        return params;
    }

    /**
     * Get a single roster list person by ID
     */
    async getById(id: string, include?: string[]): Promise<FlattenedRosterListPersonResource> {
        const params: Record<string, any> = {};
        if (include) {
            params.include = include.join(',');
        }

        return this.getSingle<RosterListPersonResource>(`/roster_list_persons/${id}`, params);
    }
}

