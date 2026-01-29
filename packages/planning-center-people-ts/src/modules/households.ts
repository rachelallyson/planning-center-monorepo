/**
 * v2.0.0 Households Module
 */

import { BaseModule } from '@rachelallyson/planning-center-base-ts';
import type {
    HouseholdResource,
    HouseholdAttributes,
    Meta,
    TopLevelLinks
} from '../types';
import type { ResourceObject } from '../types/json-api';

import type { HouseholdListOptions, HouseholdPageOptions } from '../types/api-options';

// Re-export for backward compatibility
export type { HouseholdListOptions };

export class HouseholdsModule extends BaseModule {
    /**
     * Get all households across all pages
     */
    async getAll(options: HouseholdListOptions = {}) {
        this.debugLog('households.getAll', { options });
        return await this.getAllPages<HouseholdResource>('/households', {
            where: options.where,
            include: options.include,
            order: options.order
        });
    }

    /**
     * Get a single page of households with optional filtering and pagination control
     * Use this when you need a specific page or want to limit the number of results
     * @param options - List options including where, include, perPage, page, and order
     * @returns A single page of results with meta and links for pagination
     */
    async getPage(options: HouseholdPageOptions = {}) {
        this.debugLog('households.getPage', { options });
        return this.getList<HouseholdResource>('/households', {
            where: options.where,
            include: options.include,
            per_page: options.perPage,
            page: options.page,
            order: options.order
        });
    }

    /**
     * Get a single household by ID
     */
    async getById(id: string, include?: string[]) {
        this.debugLog('households.getById', { id, include });
        return this.getSingle<HouseholdResource>(`/households/${id}`, include);
    }

    /**
     * Create a household
     */
    async create(data: HouseholdAttributes) {
        this.debugLog('households.create', { data });
        return this.createResource<HouseholdResource>('/households', data);
    }

    /**
     * Update a household
     */
    async update(id: string, data: Partial<HouseholdAttributes>) {
        this.debugLog('households.update', { id, data });
        return this.updateResource<HouseholdResource>(`/households/${id}`, data);
    }

    /**
     * Delete a household
     */
    async delete(id: string) {
        this.debugLog('households.delete', { id });
        return this.deleteResource(`/households/${id}`);
    }
}
