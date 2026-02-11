import { BaseModule } from '@rachelallyson/planning-center-base-ts';
import type {
    ReportResource,
    ReportAttributes,
} from '../types';
import type { ReportListOptions, ReportPageOptions } from '../types/api-options';

/**
 * Reports module for managing report-related operations
 */
export class ReportsModule extends BaseModule {
    /**
     * Get all reports across all pages
     */
    async getAll(params?: ReportListOptions) {
        this.debugLog('reports.getAll', { params });
        return await this.getAllPages<ReportResource>('/reports', {
            where: params?.where,
            include: params?.include,
            order: params?.order
        });
    }

    /**
     * Get a single page of reports with optional filtering and pagination control
     * Use this when you need a specific page or want to limit the number of results
     * @param params - List parameters including where, include, perPage, page, and order
     * @returns A single page of results with meta and links for pagination
     */
    async getPage(params?: ReportPageOptions) {
        this.debugLog('reports.getPage', { params });
        return this.getList<ReportResource>('/reports', {
            where: params?.where,
            include: params?.include,
            per_page: params?.perPage,
            page: params?.page,
            order: params?.order
        });
    }

    /**
     * Get a specific report by ID
     */
    async getById(id: string, include?: string[]) {
        this.debugLog('reports.getById', { id, include });
        return this.getSingle<ReportResource>(`/reports/${id}`, include);
    }

    /**
     * Create a new report
     */
    async create(data: ReportAttributes) {
        this.debugLog('reports.create', { data });
        return this.createResource<ReportResource>('/reports', data);
    }

    /**
     * Update an existing report
     */
    async update(id: string, data: Partial<ReportAttributes>) {
        this.debugLog('reports.update', { id, data });
        return this.updateResource<ReportResource>(`/reports/${id}`, data);
    }

    /**
     * Delete a report
     */
    async delete(id: string) {
        this.debugLog('reports.delete', { id });
        return this.deleteResource(`/reports/${id}`);
    }
}
