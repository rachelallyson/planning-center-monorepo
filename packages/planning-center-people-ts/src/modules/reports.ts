import { BaseModule } from '@rachelallyson/planning-center-base-ts';
import type { PcoHttpClient } from '@rachelallyson/planning-center-base-ts';
import type { PaginationHelper } from '@rachelallyson/planning-center-base-ts';
import type { PcoEventEmitter } from '@rachelallyson/planning-center-base-ts';
import type { PaginationOptions, PaginationResult } from '@rachelallyson/planning-center-base-ts';
import type {
    ReportResource,
    ReportAttributes,
    ReportsList,
    PersonResource,
} from '../types';

/**
 * Reports module for managing report-related operations
 */
export class ReportsModule extends BaseModule {
    constructor(
        httpClient: PcoHttpClient,
        paginationHelper: PaginationHelper,
        eventEmitter: PcoEventEmitter
    ) {
        super(httpClient, paginationHelper, eventEmitter);
    }

    /**
     * Get all reports across all pages
     */
    async getAll(params?: {
        where?: Record<string, any>;
        include?: string[];
        per_page?: number;
        page?: number;
    }): Promise<ReportsList> {
        const queryParams: Record<string, any> = {};

        if (params?.where) {
            Object.entries(params.where).forEach(([key, value]) => {
                queryParams[`where[${key}]`] = value;
            });
        }

        if (params?.include) {
            queryParams.include = params.include.join(',');
        }

        // Note: per_page and page options are ignored when getting all pages
        // Use getAllPagesPaginated() if you need pagination control

        const result = await this.getAllPages<ReportResource>('/reports', queryParams);
        
        // Return in the same format as before for backward compatibility
        return {
            data: result.data,
            meta: { total_count: result.totalCount },
            links: {}
        } as ReportsList;
    }

    /**
     * Get a specific report by ID
     */
    async getById(id: string, include?: string[]): Promise<ReportResource> {
        const params: Record<string, any> = {};
        if (include) {
            params.include = include.join(',');
        }
        return this.getSingle<ReportResource>(`/reports/${id}`, params);
    }

    /**
     * Create a new report
     */
    async create(data: ReportAttributes): Promise<ReportResource> {
        return this.createResource<ReportResource>('/reports', data);
    }

    /**
     * Update an existing report
     */
    async update(id: string, data: Partial<ReportAttributes>): Promise<ReportResource> {
        return this.updateResource<ReportResource>(`/reports/${id}`, data);
    }

    /**
     * Delete a report
     */
    async delete(id: string): Promise<void> {
        return this.deleteResource(`/reports/${id}`);
    }

    /**
     * Get the person who created a report
     */
    async getCreatedBy(reportId: string): Promise<PersonResource> {
        return this.getSingle<PersonResource>(`/reports/${reportId}/created_by`);
    }

    /**
     * Get the person who last updated a report
     */
    async getUpdatedBy(reportId: string): Promise<PersonResource> {
        return this.getSingle<PersonResource>(`/reports/${reportId}/updated_by`);
    }

    /**
     * Get all reports with pagination support
     */
    async getAllPagesPaginated(params?: {
        where?: Record<string, any>;
        include?: string[];
        per_page?: number;
    }, paginationOptions?: PaginationOptions): Promise<PaginationResult<ReportResource>> {
        const queryParams: Record<string, any> = {};

        if (params?.where) {
            Object.entries(params.where).forEach(([key, value]) => {
                queryParams[`where[${key}]`] = value;
            });
        }

        if (params?.include) {
            queryParams.include = params.include.join(',');
        }

        if (params?.per_page) {
            queryParams.per_page = params.per_page;
        }

        return this.getAllPages<ReportResource>('/reports', queryParams, paginationOptions);
    }
}
