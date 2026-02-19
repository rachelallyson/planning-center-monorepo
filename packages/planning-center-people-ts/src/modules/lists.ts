/**
 * v2.0.0 Lists Module
 */

import { BaseModule } from '@rachelallyson/planning-center-base-ts';
import type * as Types from '../types';
import { getMessage } from '../internal/type-guards';
import type { ListGetPageOptions, ListGetAllOptions, ListGetByIdOptions, ListCategoryGetPageOptions, PersonGetPageOptions } from '../types/api-options';

interface ListRunResponseBody {
    data?: Types.ListResource;
}

function isJsonParseError(err: object): boolean {
    const msg = getMessage(err);
    return typeof msg === 'string' && (msg.includes('JSON') || msg.includes('Unexpected end'));
}

/** Lists API: getPage, getAll, getById, create, update, delete, and list people. */
export class ListsModule extends BaseModule {
    /**
     * Get all lists across all pages
     */
    async getAll(options?: ListGetAllOptions) {
        return this.getAllPages<Types.ListResource>('/lists', options);
    }

    /**
     * Get a single page of lists with optional filtering and pagination control
     */
    async getPage(options?: ListGetPageOptions) {
        return this.getList<Types.ListResource, ListGetPageOptions>('/lists', options);
    }

    /**
     * Get a single list by ID
     */
    async getById(id: string, options?: ListGetByIdOptions) {
        return this.getSingle<Types.ListResource>(`/lists/${id}`, options);
    }

    /**
     * Get all list categories
     * @param options - Optional pagination options
     */
    async getListCategories(options?: ListCategoryGetPageOptions) {
        return this.getList<Types.ListCategoryResource, ListCategoryGetPageOptions>('/list_categories', options);
    }

    /**
     * Get a single list category by ID
     */
    async getListCategoryById(id: string) {
        return this.getSingle<Types.ListCategoryResource>(`/list_categories/${id}`);
    }

    /**
     * Create a new list category
     */
    async createListCategory(data: Partial<Types.ListCategoryAttributes>) {
        return this.createResource<Types.ListCategoryResource>('/list_categories', data);
    }

    /**
     * Update an existing list category
     */
    async updateListCategory(id: string, data: Partial<Types.ListCategoryAttributes>) {
        return this.updateResource<Types.ListCategoryResource>(`/list_categories/${id}`, data);
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
        return this.getList<Types.PersonResource, PersonGetPageOptions>(`/lists/${listId}/people`);
    }

    /**
     * Get rules for a list (GET /people/v2/lists/:id/rules)
     */
    async getRules(listId: string) {
        return this.getList<Types.ListRuleResource>(`/lists/${listId}/rules`);
    }

    private async runListAndGetBody(listId: string): Promise<ListRunResponseBody | undefined> {
        try {
            const response = await this.httpClient.request<ListRunResponseBody>({
                method: 'POST',
                endpoint: `/lists/${listId}/run`,
            });
            return response.data;
        } catch (error) {
            if (error && typeof error === 'object' && isJsonParseError(error)) return undefined;
            throw error;
        }
    }

    /**
     * Run a List to update its results
     */
    async refresh(listId: string) {
        const body = await this.runListAndGetBody(listId);
        if (body?.data) return body.data;
        return this.getById(listId);
    }
}
