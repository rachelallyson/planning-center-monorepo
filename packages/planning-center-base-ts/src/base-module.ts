/**
 * v2.0.0 Base Module Class
 */

import type { PcoClientConfig } from './types/config';
import type { PcoHttpClient } from './http-client';
import type { PaginationHelper } from './pagination';
import type { PcoEventEmitter } from './monitoring';
import type { PaginationOptions, PaginationResult } from './pagination';
import type { ResourceObject, Meta, TopLevelLinks } from './types/json-api';
import { mapIncludedToRelationships } from './included-resolver';
import type { FlattenedResource } from './types/flattened-resource';
import { buildQueryParams, buildIncludeParams } from './query-params';
import { createDebugLogger } from './debug';

/**
 * Structured query options for API requests
 */
export interface QueryOptions {
    where?: Record<string, string | number | boolean | undefined>;
    include?: string[];
    per_page?: number;
    page?: number;
    order?: string;
}

export abstract class BaseModule {
    protected httpClient: PcoHttpClient;
    protected paginationHelper: PaginationHelper;
    protected eventEmitter: PcoEventEmitter;
    protected getConfig?: () => PcoClientConfig;

    constructor(
        httpClient: PcoHttpClient,
        paginationHelper: PaginationHelper,
        eventEmitter: PcoEventEmitter,
        getConfig?: () => PcoClientConfig
    ) {
        this.httpClient = httpClient;
        this.paginationHelper = paginationHelper;
        this.eventEmitter = eventEmitter;
        this.getConfig = getConfig;
    }

    /** Log only when config.debug is set; no-op otherwise. Subclasses use for module entry points. */
    protected debugLog(message: string, data?: unknown): void {
        const logger = createDebugLogger(this.getConfig?.());
        if (logger.enabled) logger.log(message, data);
    }

    /**
     * Get a single resource
     * 
     * Automatically maps included resources to their relationships when include parameter is used.
     * This means relationships will contain full resource objects instead of just identifiers.
     * 
     * @overload Accept structured query options
     */
    protected async getSingle<T extends ResourceObject<string, any, any>>(
        endpoint: string,
        options: QueryOptions
    ): Promise<FlattenedResource<
        T['type'],
        T extends ResourceObject<string, infer TAttrs, any> ? TAttrs : never,
        T extends ResourceObject<any, any, infer TRelMap> ? TRelMap : never
    >>;
    /**
     * @overload Accept flat params (for backward compatibility)
     */
    protected async getSingle<T extends ResourceObject<string, any, any>>(
        endpoint: string,
        params?: Record<string, any>
    ): Promise<FlattenedResource<
        T['type'],
        T extends ResourceObject<string, infer TAttrs, any> ? TAttrs : never,
        T extends ResourceObject<any, any, infer TRelMap> ? TRelMap : never
    >>;
    /**
     * @overload Accept include array (convenience method)
     */
    protected async getSingle<T extends ResourceObject<string, any, any>>(
        endpoint: string,
        include?: string[]
    ): Promise<FlattenedResource<
        T['type'],
        T extends ResourceObject<string, infer TAttrs, any> ? TAttrs : never,
        T extends ResourceObject<any, any, infer TRelMap> ? TRelMap : never
    >>;
    protected async getSingle<T extends ResourceObject<string, any, any>>(
        endpoint: string,
        paramsOrOptionsOrInclude?: Record<string, any> | QueryOptions | string[]
    ): Promise<FlattenedResource<
        T['type'],
        T extends ResourceObject<string, infer TAttrs, any> ? TAttrs : never,
        T extends ResourceObject<any, any, infer TRelMap> ? TRelMap : never
    >> {
        let params: Record<string, any> | undefined;
        
        // Handle different input types
        if (Array.isArray(paramsOrOptionsOrInclude)) {
            // Array of strings = include parameter
            params = buildIncludeParams(paramsOrOptionsOrInclude);
        } else if (paramsOrOptionsOrInclude && 'where' in paramsOrOptionsOrInclude) {
            // Structured QueryOptions
            params = buildQueryParams(paramsOrOptionsOrInclude as QueryOptions);
        } else {
            // Flat params (backward compatibility)
            params = paramsOrOptionsOrInclude as Record<string, any> | undefined;
        }

        this.debugLog('base.getSingle', { endpoint, params });
        
        const response = await this.httpClient.request<{ 
            data: T;
            included?: ResourceObject<string, any, any>[];
        }>({
            method: 'GET',
            endpoint,
            params,
        });
        
        // Automatically map included resources to relationships and flatten structure
        // Always flatten, even if no included resources (to maintain consistent return type)
        const mappedData = mapIncludedToRelationships([response.data.data], response.data.included)[0];
        this.debugLog('base.getSingle result', { endpoint, hasData: !!mappedData });
        return mappedData;
    }

    /**
     * Get a list of resources
     * 
     * Automatically maps included resources to their relationships when include parameter is used.
     * This means relationships will contain full resource objects instead of just identifiers.
     * The included array is used internally for mapping but is not returned in the response.
     * 
     * @overload Accept structured query options
     */
    protected async getList<
        T extends ResourceObject<string, any, any>,
        TRelResourceMap extends Record<string, ResourceObject<string, any, any> | ResourceObject<string, any, any>[]> = Record<string, never>
    >(
        endpoint: string,
        options: QueryOptions
    ): Promise<{ 
        data: FlattenedResource<
            T['type'],
            T extends ResourceObject<string, infer TAttrs, any> ? TAttrs : never,
            T extends ResourceObject<any, any, infer TRelMap> ? TRelMap : never,
            TRelResourceMap
       >[]; 
        meta?: Meta; 
        links?: TopLevelLinks 
    }>;
    /**
     * @overload Accept flat params (for backward compatibility)
     */
    protected async getList<
        T extends ResourceObject<string, any, any>,
        TRelResourceMap extends Record<string, ResourceObject<string, any, any> | ResourceObject<string, any, any>[]> = Record<string, never>
    >(
        endpoint: string,
        params?: Record<string, any>
    ): Promise<{ 
        data: FlattenedResource<
            T['type'],
            T extends ResourceObject<string, infer TAttrs, any> ? TAttrs : never,
            T extends ResourceObject<any, any, infer TRelMap> ? TRelMap : never,
            TRelResourceMap
       >[]; 
        meta?: Meta; 
        links?: TopLevelLinks 
    }>;
    protected async getList<
        T extends ResourceObject<string, any, any>,
        TRelResourceMap extends Record<string, ResourceObject<string, any, any> | ResourceObject<string, any, any>[]> = Record<string, never>
    >(
        endpoint: string,
        paramsOrOptions?: Record<string, any> | QueryOptions
    ): Promise<{ 
        data: FlattenedResource<
            T['type'],
            T extends ResourceObject<string, infer TAttrs, any> ? TAttrs : never,
            T extends ResourceObject<any, any, infer TRelMap> ? TRelMap : never,
            TRelResourceMap
       >[]; 
        meta?: Meta; 
        links?: TopLevelLinks 
    }> {
        let params: Record<string, any> | undefined;
        
        // Use buildQueryParams when options look like QueryOptions (include, where, per_page, etc.)
        // so that include is sent as comma-separated string and the API returns included resources.
        const isQueryOptions =
            paramsOrOptions &&
            typeof paramsOrOptions === 'object' &&
            ('include' in paramsOrOptions ||
                'where' in paramsOrOptions ||
                'per_page' in paramsOrOptions ||
                'page' in paramsOrOptions ||
                'order' in paramsOrOptions);
        if (isQueryOptions) {
            params = buildQueryParams(paramsOrOptions as QueryOptions);
        } else {
            // Flat params (backward compatibility)
            params = paramsOrOptions as Record<string, any> | undefined;
        }
        
        const response = await this.httpClient.request<{ 
            data: T[]; 
            meta?: Meta; 
            links?: TopLevelLinks;
            included?: ResourceObject<string, any, any>[];
        }>({
            method: 'GET',
            endpoint,
            params,
        });
        
        // Automatically map included resources to relationships and flatten structure
        // Always flatten, even if no included resources (to maintain consistent return type)
        // Handle case where response.data.data might be undefined (empty response)
        const dataArray = Array.isArray(response.data?.data) ? response.data.data : [];
        const mappedData = mapIncludedToRelationships(dataArray, response.data?.included);
        this.debugLog('base.getList result', { endpoint, count: mappedData.length });
        return {
            data: mappedData,
            meta: response.data?.meta,
            links: response.data?.links,
        };
    }

    /**
     * Create a resource
     */
    protected async createResource<T extends ResourceObject<string, any, any>>(
        endpoint: string,
        data: any,
        params?: Record<string, any>
    ): Promise<T> {
        this.debugLog('base.createResource', { endpoint, params });
        const response = await this.httpClient.request<{ data: T }>({
            method: 'POST',
            endpoint,
            data,
            params,
        });
        // Handle case where response.data.data might be undefined
        if (!response.data?.data) {
            // Log the actual response for debugging
            const responseStatus = response.status;
            const responseData = response.data;
            throw new Error(
                `Failed to create resource at ${endpoint}: response data is missing. ` +
                `Status: ${responseStatus}, Response: ${JSON.stringify(responseData)}`
            );
        }
        const created = response.data.data;
        this.debugLog('base.createResource result', { endpoint, id: (created as { id?: string })?.id });
        return created;
    }

    /**
     * Update a resource
     */
    protected async updateResource<T extends ResourceObject<string, any, any>>(
        endpoint: string,
        data: any,
        params?: Record<string, any>
    ): Promise<T> {
        this.debugLog('base.updateResource', { endpoint, params });
        const response = await this.httpClient.request<{ data: T }>({
            method: 'PATCH',
            endpoint,
            data,
            params,
        });
        // Handle case where response.data.data might be undefined
        if (!response.data?.data) {
            // Log the actual response for debugging
            const responseStatus = response.status;
            const responseData = response.data;
            throw new Error(
                `Failed to update resource at ${endpoint}: response data is missing. ` +
                `Status: ${responseStatus}, Response: ${JSON.stringify(responseData)}`
            );
        }
        const updated = response.data.data;
        this.debugLog('base.updateResource result', { endpoint, id: (updated as { id?: string })?.id });
        return updated;
    }

    /**
     * Delete a resource
     */
    protected async deleteResource(endpoint: string, params?: Record<string, any>): Promise<void> {
        this.debugLog('base.deleteResource', { endpoint, params });
        await this.httpClient.request({
            method: 'DELETE',
            endpoint,
            params,
        });
        this.debugLog('base.deleteResource result', { endpoint });
    }

    /**
     * Get all pages of a resource
     * 
     * @overload Accept structured query options
     */
    protected async getAllPages<
        T extends ResourceObject<string, any, any>, 
        TIncluded extends ResourceObject<string, any, any> = ResourceObject<string, any, any>,
        TRelResourceMap extends Record<string, ResourceObject<string, any, any> | ResourceObject<string, any, any>[]> = Record<string, never>
    >(
        endpoint: string,
        options: QueryOptions,
        paginationOptions?: PaginationOptions
    ): Promise<PaginationResult<T, TIncluded, TRelResourceMap>>;
    /**
     * @overload Accept flat params (for backward compatibility)
     */
    protected async getAllPages<
        T extends ResourceObject<string, any, any>, 
        TIncluded extends ResourceObject<string, any, any> = ResourceObject<string, any, any>,
        TRelResourceMap extends Record<string, ResourceObject<string, any, any> | ResourceObject<string, any, any>[]> = Record<string, never>
    >(
        endpoint: string,
        params?: Record<string, any>,
        options?: PaginationOptions
    ): Promise<PaginationResult<T, TIncluded, TRelResourceMap>>;
    protected async getAllPages<
        T extends ResourceObject<string, any, any>, 
        TIncluded extends ResourceObject<string, any, any> = ResourceObject<string, any, any>,
        TRelResourceMap extends Record<string, ResourceObject<string, any, any> | ResourceObject<string, any, any>[]> = Record<string, never>
    >(
        endpoint: string,
        paramsOrOptions?: Record<string, any> | QueryOptions,
        paginationOptions?: PaginationOptions
    ): Promise<PaginationResult<T, TIncluded, TRelResourceMap>> {
        let params: Record<string, any> | undefined;
        let paginationOpts: PaginationOptions | undefined;
        
        // Check if first param is structured QueryOptions
        if (paramsOrOptions && 'where' in paramsOrOptions) {
            params = buildQueryParams(paramsOrOptions as QueryOptions);
            paginationOpts = paginationOptions;
        } else {
            // Flat params (backward compatibility)
            params = paramsOrOptions as Record<string, any> | undefined;
            paginationOpts = paginationOptions;
        }

        this.debugLog('base.getAllPages', { endpoint, params, paginationOptions: paginationOpts });
        
        return this.paginationHelper.getAllPages<T, TIncluded, TRelResourceMap>(endpoint, params, paginationOpts);
    }

    /**
     * Stream pages of a resource
     */
    protected async* streamPages<T extends ResourceObject<string, any, any>>(
        endpoint: string,
        params?: Record<string, any>,
        options?: PaginationOptions
    ): AsyncGenerator<T[], void, unknown> {
        this.debugLog('base.streamPages', { endpoint, params, options });
        yield* this.paginationHelper.streamPages<T>(endpoint, params, options);
    }
}

