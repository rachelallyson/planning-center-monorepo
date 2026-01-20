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
    async get(): Promise<OrganizationResource> {
        // The organization endpoint is at /check-ins/v2 (not /check-ins/v2/organization)
        return this.getSingle<OrganizationResource>('/check-ins/v2');
    }
}

