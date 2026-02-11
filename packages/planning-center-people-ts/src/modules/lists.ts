/**
 * v2.0.0 Lists Module
 */

import { BaseModule } from '@rachelallyson/planning-center-base-ts';
import type * as Types from '../types';

import type { ListListOptions, ListPageOptions } from '../types/api-options';

// Re-export for backward compatibility
export type ListsListOptions = ListListOptions;

export class ListsModule extends BaseModule {
    /**
     * Get all lists across all pages
     */
    async getAll(options: ListsListOptions = {}) {
        this.debugLog('lists.getAll', { options });
        return await this.getAllPages<Types.ListResourceObject>('/lists', {
            where: options.where,
            include: options.include,
            order: options.order
        });
    }

    /**
     * Get a single page of lists with optional filtering and pagination control
     * Use this when you need a specific page or want to limit the number of results
     * @param options - List options including where, include, perPage, page, and order
     * @returns A single page of results with meta and links for pagination
     */
    async getPage(options: ListPageOptions = {}) {
        this.debugLog('lists.getPage', { options });
        return this.getList<Types.ListResourceObject>('/lists', {
            where: options.where,
            include: options.include,
            per_page: options.perPage,
            page: options.page,
            order: options.order
        });
    }

    /**
     * Get a single list by ID
     */
    async getById(id: string, include?: string[]) {
        this.debugLog('lists.getById', { id, include });
        return this.getSingle<Types.ListResourceObject>(`/lists/${id}`, include);
    }


    /**
     * Get all list categories
     * @param options - Optional pagination options
     */
    async getListCategories(options?: { perPage?: number; page?: number }) {
        this.debugLog('lists.getListCategories', { options });
        return this.getList<Types.ListCategoryResourceObject>('/list_categories', options ? {
            per_page: options.perPage,
            page: options.page,
        } : undefined);
    }

    /**
     * Get a single list category by ID
     */
    async getListCategoryById(id: string) {
        return this.getSingle<Types.ListCategoryResourceObject>(`/list_categories/${id}`);
    }

    /**
     * Create a new list category
     */
    async createListCategory(data: Partial<Types.ListCategoryAttributes>) {
        return this.createResource<Types.ListCategoryResourceObject>('/list_categories', data);
    }

    /**
     * Update an existing list category
     */
    async updateListCategory(id: string, data: Partial<Types.ListCategoryAttributes>) {
        return this.updateResource<Types.ListCategoryResourceObject>(`/list_categories/${id}`, data);
    }

    /**
     * Delete a list category
     */
    async deleteListCategory(id: string) {
        return this.deleteResource(`/list_categories/${id}`);
    }

    /**
     * Get people in a list (via the people relationship)
     */
    async getPeople(listId: string) {
        return this.getList<Types.PersonResourceObject, Types.PersonRelationshipMap, Types.PeopleResourceTypeToRelMap>(`/lists/${listId}/people`);
    }

    /**
     * Get rules for a list (GET /people/v2/lists/:id/rules)
     */
    async getRules(listId: string) {
        this.debugLog('lists.getRules', { listId });
        return this.getList<Types.ListRuleResourceObject>(`/lists/${listId}/rules`);
    }

    /**
     * Run a List to update its results
     */
    async refresh(listId: string) {
        this.debugLog('lists.refresh', { listId });
        try {
            const response = await this.httpClient.request<{ data: Types.ListResource }>({
                method: 'POST',
                endpoint: `/lists/${listId}/run`,
            });
            // If response has data, return it; otherwise return the list by ID
            if (response.data?.data) {
                return response.data.data;
            }
            // If no data in response (204 No Content or empty response), return the list itself
            return this.getById(listId);
        } catch (error: unknown) {
            // The run endpoint may return an empty response (204 No Content)
            // If we get a JSON parse error, try to get the list by ID instead
            if (error && typeof error === 'object' && 'message' in error) {
                const errorMessage = (error as { message?: unknown })?.message;
                if (typeof errorMessage === 'string' && (errorMessage.includes('JSON') || errorMessage.includes('Unexpected end'))) {
                    // Return the list itself as the result
                    return this.getById(listId);
                }
            }
            throw error;
        }
    }
}
