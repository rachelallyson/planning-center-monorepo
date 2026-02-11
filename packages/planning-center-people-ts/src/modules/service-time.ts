import { BaseModule } from '@rachelallyson/planning-center-base-ts';
import type {
    ServiceTimeResource,
    ServiceTimeAttributes,
} from '../types';
import type { ServiceTimeListOptions, ServiceTimePageOptions } from '../types/api-options';

/**
 * ServiceTime module for managing service time-related operations
 * ServiceTimes are campus-scoped resources
 */
export class ServiceTimeModule extends BaseModule {
    /**
     * Get all service times for a specific campus across all pages
     */
    async getAll(campusId: string, params?: ServiceTimeListOptions) {
        this.debugLog('serviceTime.getAll', { campusId, params });
        return this.getAllPages<ServiceTimeResource>(`/campuses/${campusId}/service_times`, {
            where: params?.where,
            include: params?.include,
            order: params?.order
        });
    }

    /**
     * Get a single page of service times for a campus with optional filtering and pagination control
     * Use this when you need a specific page or want to limit the number of results
     * @param campusId - The campus ID
     * @param params - List parameters including where, include, perPage, page, and order
     * @returns A single page of results with meta and links for pagination
     */
    async getPage(campusId: string, params?: ServiceTimePageOptions) {
        return this.getList<ServiceTimeResource>(`/campuses/${campusId}/service_times`, {
            where: params?.where,
            include: params?.include,
            per_page: params?.perPage,
            page: params?.page,
            order: params?.order
        });
    }

    /**
     * Get a specific service time by ID for a campus
     */
    async getById(campusId: string, id: string, include?: string[]) {
        this.debugLog('serviceTime.getById', { campusId, id, include });
        return this.getSingle<ServiceTimeResource>(`/campuses/${campusId}/service_times/${id}`, include);
    }

    /**
     * Create a new service time for a campus
     */
    async create(campusId: string, data: ServiceTimeAttributes) {
        this.debugLog('serviceTime.create', { campusId, data });
        return this.createResource<ServiceTimeResource>(`/campuses/${campusId}/service_times`, data);
    }

    /**
     * Update an existing service time for a campus
     */
    async update(campusId: string, id: string, data: Partial<ServiceTimeAttributes>) {
        this.debugLog('serviceTime.update', { campusId, id, data });
        return this.updateResource<ServiceTimeResource>(`/campuses/${campusId}/service_times/${id}`, data);
    }

    /**
     * Delete a service time for a campus
     */
    async delete(campusId: string, id: string) {
        this.debugLog('serviceTime.delete', { campusId, id });
        return this.deleteResource(`/campuses/${campusId}/service_times/${id}`);
    }
}
