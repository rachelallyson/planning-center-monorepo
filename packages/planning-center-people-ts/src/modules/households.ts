/**
 * v2.0.0 Households Module
 */

import { BaseModule } from '@rachelallyson/planning-center-base-ts';
import type { PaginationOptions, PaginationResult } from '@rachelallyson/planning-center-base-ts';
import type {
    HouseholdResource,
    HouseholdAttributes
} from '../types';

export interface HouseholdListOptions {
    where?: Record<string, any>;
    include?: string[];
    perPage?: number;
    page?: number;
}

export class HouseholdsModule extends BaseModule {
    /**
     * Get all households across all pages
     */
    async getAll(options: HouseholdListOptions = {}): Promise<{ data: HouseholdResource[]; meta?: any; links?: any }> {
        const params: Record<string, any> = {};

        if (options.where) {
            Object.entries(options.where).forEach(([key, value]) => {
                params[`where[${key}]`] = value;
            });
        }

        if (options.include) {
            params.include = options.include.join(',');
        }

        // Note: perPage and page options are ignored when getting all pages
        // Use getAllPagesPaginated() if you need pagination control

        const result = await this.getAllPages<HouseholdResource>('/households', params);
        
        // Return in the same format as before for backward compatibility
        return {
            data: result.data,
            meta: { total_count: result.totalCount },
            links: {}
        };
    }

    /**
     * Get all households across all pages
     */
    async getAllPagesPaginated(options: HouseholdListOptions = {}, paginationOptions?: PaginationOptions): Promise<PaginationResult<HouseholdResource>> {
        const params: Record<string, any> = {};

        if (options.where) {
            Object.entries(options.where).forEach(([key, value]) => {
                params[`where[${key}]`] = value;
            });
        }

        if (options.include) {
            params.include = options.include.join(',');
        }

        return this.getAllPages<HouseholdResource>('/households', params, paginationOptions);
    }

    /**
     * Get a single household by ID
     */
    async getById(id: string, include?: string[]): Promise<HouseholdResource> {
        const params: Record<string, any> = {};
        if (include) {
            params.include = include.join(',');
        }

        return this.getSingle<HouseholdResource>(`/households/${id}`, params);
    }

    /**
     * Create a household
     */
    async create(data: HouseholdAttributes): Promise<HouseholdResource> {
        return this.createResource<HouseholdResource>('/households', data);
    }

    /**
     * Update a household
     */
    async update(id: string, data: Partial<HouseholdAttributes>): Promise<HouseholdResource> {
        return this.updateResource<HouseholdResource>(`/households/${id}`, data);
    }

    /**
     * Delete a household
     */
    async delete(id: string): Promise<void> {
        return this.deleteResource(`/households/${id}`);
    }
}
