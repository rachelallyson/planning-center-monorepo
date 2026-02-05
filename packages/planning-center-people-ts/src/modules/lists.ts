/**
 * v2.0.0 Lists Module
 */

import { BaseModule } from '@rachelallyson/planning-center-base-ts';
import type {
    ListResource,
    ListAttributes,
    ListCategoryResource,
    ListCategoryAttributes,
    ListRuleResource,
    PersonResource,
    Meta,
    TopLevelLinks
} from '../types';
import type { ResourceObject } from '../types/json-api';

import type { ListListOptions, ListPageOptions } from '../types/api-options';

// Re-export for backward compatibility
export type ListsListOptions = ListListOptions;

export class ListsModule extends BaseModule {
    /**
     * Get all lists across all pages
     */
    async getAll(options: ListsListOptions = {}) {
        this.debugLog('lists.getAll', { options });
        return await this.getAllPages<ListResource>('/lists', {
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
        return this.getList<ListResource>('/lists', {
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
        return this.getSingle<ListResource>(`/lists/${id}`, include);
    }


    /**
     * Get all list categories
     * @param options - Optional pagination options
     */
    async getListCategories(options?: { perPage?: number; page?: number }) {
        this.debugLog('lists.getListCategories', { options });
        return this.getList<ListCategoryResource>('/list_categories', options ? {
            per_page: options.perPage,
            page: options.page,
        } : undefined);
    }

    /**
     * Get a single list category by ID
     */
    async getListCategoryById(id: string) {
        return this.getSingle<ListCategoryResource>(`/list_categories/${id}`);
    }

    /**
     * Create a new list category
     */
    async createListCategory(data: Partial<ListCategoryAttributes>) {
        return this.createResource<ListCategoryResource>('/list_categories', data);
    }

    /**
     * Update an existing list category
     */
    async updateListCategory(id: string, data: Partial<ListCategoryAttributes>) {
        return this.updateResource<ListCategoryResource>(`/list_categories/${id}`, data);
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
        return this.getList<PersonResource>(`/lists/${listId}/people`);
    }

    /**
     * Get rules for a list (GET /people/v2/lists/:id/rules)
     */
    async getRules(listId: string) {
        this.debugLog('lists.getRules', { listId });
        return this.getList<ListRuleResource>(`/lists/${listId}/rules`);
    }

    /**
     * Run a List to update its results
     */
    async refresh(listId: string) {
        this.debugLog('lists.refresh', { listId });
        try {
            const response = await this.httpClient.request<{ data: ListResource }>({
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
