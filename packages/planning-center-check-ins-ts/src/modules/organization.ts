/**
 * Organization Module for Check-Ins API
 */

import { BaseModule } from '@rachelallyson/planning-center-base-ts';
import type { 
    PcoHttpClient, 
    PaginationHelper, 
    PcoEventEmitter,
} from '@rachelallyson/planning-center-base-ts';
import type {
    OrganizationResource,
    FlattenedOrganizationResource,
} from '../types';

export class OrganizationModule extends BaseModule {
    constructor(
        httpClient: PcoHttpClient,
        paginationHelper: PaginationHelper,
        eventEmitter: PcoEventEmitter
    ) {
        super(httpClient, paginationHelper, eventEmitter);
    }

    /**
     * Get organization information
     */
    async get(): Promise<FlattenedOrganizationResource> {
        // Organization is the root of the Check-Ins API (baseURL is .../check-ins/v2)
        return this.getSingle<OrganizationResource>('/');
    }
}

