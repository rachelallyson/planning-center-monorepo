/**
 * v2.0.0 Households Module
 */

import { BaseModule } from '@rachelallyson/planning-center-base-ts';
import type * as Types from '../types';

import type { HouseholdGetPageOptions, HouseholdGetAllOptions, HouseholdGetByIdOptions } from '../types/api-options';

/** Households API: getPage, getAll, getById, create, update, delete. */
export class HouseholdsModule extends BaseModule {
    /**
     * Get all households across all pages
     */
    async getAll(options?: HouseholdGetAllOptions) {
        return this.getAllPages<Types.HouseholdResource>('/households', options);
    }

    /**
     * Get a single page of households with optional filtering and pagination control
     */
    async getPage(options?: HouseholdGetPageOptions) {
        return this.getList<Types.HouseholdResource, HouseholdGetPageOptions>('/households', options);
    }

    /**
     * Get a single household by ID
     */
    async getById(id: string, options?: HouseholdGetByIdOptions) {
        return this.getSingle<Types.HouseholdResource>(`/households/${id}`, options);
    }

    /**
     * Create a household
     */
    async create(data: Types.HouseholdCreatePayload) {
        return this.createResource<Types.HouseholdResource>('/households', data);
    }

    /**
     * Update a household
     */
    async update(id: string, data: Partial<Types.HouseholdAttributes>) {
        return this.updateResource<Types.HouseholdResource>(`/households/${id}`, data);
    }

    /**
     * Delete a household
     */
    async delete(id: string) {
        return this.deleteResource(`/households/${id}`);
    }
}
