/**
 * RosterListPersons Module for Check-Ins API
 * @see https://developer.planning.center/docs/#/apps/check-ins/2025-05-28/vertices/roster_list_person
 */

import { BaseModule } from '@rachelallyson/planning-center-base-ts';
import type {
    PcoHttpClient,
    PaginationHelper,
    PcoClientConfig,
} from '@rachelallyson/planning-center-base-ts';
import type * as Types from '../types';
import type {
    RosterListPersonGetByIdOptions,
    RosterListPersonsGetAllOptions,
    RosterListPersonsGetPageOptions,
} from '../types/api-options';

/** Roster list persons: getPage, getById. */
export class RosterListPersonsModule extends BaseModule {
    constructor(
        httpClient: PcoHttpClient,
        paginationHelper: PaginationHelper,
        getConfig?: () => PcoClientConfig
    ) {
        super(httpClient, paginationHelper, getConfig);
    }

    /**
     * Get all roster list persons across all pages with optional filtering.
     * Use getPage() when you need a single page or custom per_page/page.
     */
    async getAll(options?: RosterListPersonsGetAllOptions) {
        return this.getAllPages<Types.RosterListPersonResource, RosterListPersonsGetAllOptions>('/roster_list_persons', options);
    }

    /**
     * Get a single page of roster list persons with optional filtering and pagination.
     */
    async getPage(options?: RosterListPersonsGetPageOptions) {
        return this.getList<Types.RosterListPersonResource, RosterListPersonsGetPageOptions>('/roster_list_persons', options);
    }

    /**
     * Get a single roster list person by ID. URL Parameters: Pagination only; Can Include not documented.
     */
    async getById(id: string, options?: RosterListPersonGetByIdOptions) {
        return this.getSingle<Types.RosterListPersonResource>(`/roster_list_persons/${id}`, options);
    }
}

