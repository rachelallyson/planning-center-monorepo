/**
 * Organization Module for Check-Ins API
 */

import { BaseModule } from '@rachelallyson/planning-center-base-ts';
import type { PcoHttpClient, PaginationHelper, PcoClientConfig } from '@rachelallyson/planning-center-base-ts';
import type * as Types from '../types';

/** Organization: get (single organization). */
export class OrganizationModule extends BaseModule {
    constructor(
        httpClient: PcoHttpClient,
        paginationHelper: PaginationHelper,
        getConfig?: () => PcoClientConfig
    ) {
        super(httpClient, paginationHelper, getConfig);
    }


    /**
     * Get organization information
     */
    async get() {
        // Organization is the root of the Check-Ins API (baseURL is .../check-ins/v2)
        return this.getSingle<Types.OrganizationResource>('/');
    }
}

