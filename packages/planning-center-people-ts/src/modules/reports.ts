import { BaseModule } from '@rachelallyson/planning-center-base-ts';
import type { ReportGetPageOptions, ReportGetAllOptions, ReportGetByIdOptions } from '../types/api-options';
import type * as Types from '../types';

/**
 * Reports module for managing report-related operations
 */
export class ReportsModule extends BaseModule {
    /**
     * Get all reports across all pages
     */
    async getAll(params?: ReportGetAllOptions) {
        return this.getAllPages<Types.ReportResource>('/reports', params);
    }

    /**
     * Get a single page of reports with optional filtering and pagination control
     */
    async getPage(params?: ReportGetPageOptions) {
        return this.getList<Types.ReportResource, ReportGetPageOptions>('/reports', params);
    }

    /**
     * Get a specific report by ID
     */
    async getById(id: string, options?: ReportGetByIdOptions) {
        return this.getSingle<Types.ReportResource>(`/reports/${id}`, options);
    }

    /**
     * Create a new report
     */
    async create(data: Types.ReportAttributes) {
        return this.createResource<Types.ReportResource>('/reports', data);
    }

    /**
     * Update an existing report
     */
    async update(id: string, data: Partial<Types.ReportAttributes>) {
        return this.updateResource<Types.ReportResource>(`/reports/${id}`, data);
    }

    /**
     * Delete a report
     */
    async delete(id: string) {
        return this.deleteResource(`/reports/${id}`);
    }
}
