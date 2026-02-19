import { BaseModule } from '@rachelallyson/planning-center-base-ts';
import type * as Types from '../types';
import type { ServiceTimeGetPageOptions, ServiceTimeGetAllOptions, ServiceTimeGetByIdOptions } from '../types/api-options';

/**
 * ServiceTime module for managing service time-related operations
 * ServiceTimes are campus-scoped resources
 */
export class ServiceTimeModule extends BaseModule {
    /**
     * Get all service times for a specific campus across all pages
     */
    async getAll(campusId: string, params?: ServiceTimeGetAllOptions) {
        return this.getAllPages<Types.ServiceTimeResource>(`/campuses/${campusId}/service_times`, params);
    }

    /**
     * Get a single page of service times for a campus with optional filtering and pagination control
     */
    async getPage(campusId: string, params?: ServiceTimeGetPageOptions) {
        return this.getList<Types.ServiceTimeResource, ServiceTimeGetPageOptions>(`/campuses/${campusId}/service_times`, params);
    }

    /**
     * Get a specific service time by ID for a campus
     */
    async getById(campusId: string, id: string, options?: ServiceTimeGetByIdOptions) {
        return this.getSingle<Types.ServiceTimeResource>(`/campuses/${campusId}/service_times/${id}`, options);
    }

    /**
     * Create a new service time for a campus
     */
    async create(campusId: string, data: Types.ServiceTimeAttributes) {
        return this.createResource<Types.ServiceTimeResource>(`/campuses/${campusId}/service_times`, data);
    }

    /**
     * Update an existing service time for a campus
     */
    async update(campusId: string, id: string, data: Partial<Types.ServiceTimeAttributes>) {
        return this.updateResource<Types.ServiceTimeResource>(`/campuses/${campusId}/service_times/${id}`, data);
    }

    /**
     * Delete a service time for a campus
     */
    async delete(campusId: string, id: string) {
        return this.deleteResource(`/campuses/${campusId}/service_times/${id}`);
    }
}
