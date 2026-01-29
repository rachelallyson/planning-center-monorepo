import { BaseModule } from '@rachelallyson/planning-center-base-ts';
import type {
    CampusResource,
    CampusAttributes,
    CampusesList,
    CampusSingle,
    ListResource,
    ServiceTimeResource,
    Meta,
    TopLevelLinks
} from '../types';
import type { ListWhereClause, CampusWhereClause } from '../types/api-options';
import type { CampusListOptions, CampusPageOptions } from '../types/api-options';

/**
 * Campus module for managing campus-related operations
 */
export class CampusModule extends BaseModule {
    /**
     * Get all campuses across all pages
     */
    async getAll(params?: CampusListOptions) {
        this.debugLog('campus.getAll', { params });
        return this.getAllPages<CampusResource>('/campuses', {
            where: params?.where,
            include: params?.include,
            order: params?.order
        });
    }

    /**
     * Get a single page of campuses with optional filtering and pagination control
     * Use this when you need a specific page or want to limit the number of results
     * @param params - List parameters including where, include, perPage, page, and order
     * @returns A single page of results with meta and links for pagination
     */
    async getPage(params?: CampusPageOptions) {
        this.debugLog('campus.getPage', { params });
        return this.getList<CampusResource>('/campuses', {
            where: params?.where,
            include: params?.include,
            per_page: params?.perPage,
            page: params?.page,
            order: params?.order
        }) 
    }

    /**
     * Get a specific campus by ID
     */
    async getById(id: string, include?: string[]) {
        return this.getSingle<CampusResource>(`/campuses/${id}`, include);
    }

    /**
     * Create a new campus
     */
    async create(data: CampusAttributes) {
        return this.createResource<CampusResource>('/campuses', data);
    }

    /**
     * Update an existing campus
     */
    async update(id: string, data: Partial<CampusAttributes>) {
        return this.updateResource<CampusResource>(`/campuses/${id}`, data);
    }

    /**
     * Delete a campus
     */
    async delete(id: string) {
        return this.deleteResource(`/campuses/${id}`);
    }

    /**
     * Get lists for a specific campus
     */
    async getLists(campusId: string, params?: {
        where?: ListWhereClause;
        include?: string[];
        per_page?: number;
        page?: number;
    }) {
        this.debugLog('campus.getLists', { campusId, params });
        return this.getList<ListResource>(`/campuses/${campusId}/lists`, {
            where: params?.where,
            include: params?.include,
            per_page: params?.per_page,
            page: params?.page
        });
    }

    /**
     * Get service times for a specific campus
     */
    async getServiceTimes(campusId: string, params?: {
        where?: never; // ServiceTime endpoint doesn't support where[] filtering
        include?: string[];
        per_page?: number;
        page?: number;
    }) {
        return this.getList<ServiceTimeResource>(`/campuses/${campusId}/service_times`, {
            include: params?.include,
            per_page: params?.per_page,
            page: params?.page
        });
    }
}
