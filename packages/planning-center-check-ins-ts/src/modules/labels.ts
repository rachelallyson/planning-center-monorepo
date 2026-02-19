/**
 * Labels Module for Check-Ins API
 * @see https://developer.planning.center/docs/#/apps/check-ins/2025-05-28/vertices/label
 */

import { BaseModule } from '@rachelallyson/planning-center-base-ts';
import type {
    PcoHttpClient,
    PaginationHelper,
    PcoClientConfig,
} from '@rachelallyson/planning-center-base-ts';
import type * as Types from '../types';
import type {
    LabelGetByIdOptions,
    LabelsGetAllOptions,
    LabelsGetPageOptions,
} from '../types/api-options';

/** Labels: getPage, getById, create, update, delete. */
export class LabelsModule extends BaseModule {
    constructor(
        httpClient: PcoHttpClient,
        paginationHelper: PaginationHelper,
        getConfig?: () => PcoClientConfig
    ) {
        super(httpClient, paginationHelper, getConfig);
    }

    /**
     * Get all labels across all pages with optional filtering.
     * Use getPage() when you need a single page or custom per_page/page.
     */
    async getAll(options?: LabelsGetAllOptions) {
        return this.getAllPages<Types.LabelResource, LabelsGetAllOptions>('/labels', options);
    }

    /**
     * Get a single page of labels with optional filtering and pagination.
     */
    async getPage(options?: LabelsGetPageOptions) {
        return this.getList<Types.LabelResource, LabelsGetPageOptions>('/labels', options);
    }

    /**
     * Get a single label by ID. Can Include: event_labels, location_labels.
     */
    async getById(id: string, options?: LabelGetByIdOptions) {
        return this.getSingle<Types.LabelResource>(`/labels/${id}`, options);
    }
}

