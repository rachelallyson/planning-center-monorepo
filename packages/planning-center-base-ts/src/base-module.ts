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

function isQueryOptions(p: unknown): p is QueryOptions {
    return p !== null && typeof p === 'object' && (
        'where' in p || 'include' in p || 'per_page' in p || 'page' in p || 'order' in p
    );
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
     * Pass TRelResourceMap to get relationship keys typed as specific resource types.
     * 
     * @overload Accept structured query options
     */
    protected async getSingle<
        T extends ResourceObject<string, any, any>,
        TRelResourceMap extends Record<string, ResourceObject<string, any, any> | ResourceObject<string, any, any>[]> = Record<string, never>,
        TResourceTypeToRelMap extends Record<string, object> = Record<string, never>
    >(
        endpoint: string,
        options: QueryOptions
    ): Promise<FlattenedResource<
        T['type'],
        T extends ResourceObject<string, infer TAttrs, any> ? TAttrs : never,
        T extends ResourceObject<any, any, infer TRelMap> ? TRelMap : never,
        TRelResourceMap,
        TResourceTypeToRelMap
    >>;
    /**
     * @overload Accept flat params (for backward compatibility)
     */
    protected async getSingle<
        T extends ResourceObject<string, any, any>,
        TRelResourceMap extends Record<string, ResourceObject<string, any, any> | ResourceObject<string, any, any>[]> = Record<string, never>,
        TResourceTypeToRelMap extends Record<string, object> = Record<string, never>
    >(
        endpoint: string,
        params?: Record<string, any>
    ): Promise<FlattenedResource<
        T['type'],
        T extends ResourceObject<string, infer TAttrs, any> ? TAttrs : never,
        T extends ResourceObject<any, any, infer TRelMap> ? TRelMap : never,
        TRelResourceMap,
        TResourceTypeToRelMap
    >>;
    /**
     * @overload Accept include array (convenience method)
     */
    protected async getSingle<
        T extends ResourceObject<string, any, any>,
        TRelResourceMap extends Record<string, ResourceObject<string, any, any> | ResourceObject<string, any, any>[]> = Record<string, never>,
        TResourceTypeToRelMap extends Record<string, object> = Record<string, never>
    >(
        endpoint: string,
        include?: string[]
    ): Promise<FlattenedResource<
        T['type'],
        T extends ResourceObject<string, infer TAttrs, any> ? TAttrs : never,
        T extends ResourceObject<any, any, infer TRelMap> ? TRelMap : never,
        TRelResourceMap,
        TResourceTypeToRelMap
    >>;
    protected async getSingle<
        T extends ResourceObject<string, any, any>,
        TRelResourceMap extends Record<string, ResourceObject<string, any, any> | ResourceObject<string, any, any>[]> = Record<string, never>,
        TResourceTypeToRelMap extends Record<string, object> = Record<string, never>
    >(
        endpoint: string,
        paramsOrOptionsOrInclude?: Record<string, any> | QueryOptions | string[]
    ) {
        let params: Record<string, any> | undefined;
        
        // Handle different input types
        if (Array.isArray(paramsOrOptionsOrInclude)) {
            // Array of strings = include parameter
            params = buildIncludeParams(paramsOrOptionsOrInclude);
        } else if (isQueryOptions(paramsOrOptionsOrInclude)) {
            params = buildQueryParams(paramsOrOptionsOrInclude);
        } else {
            params = paramsOrOptionsOrInclude;
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
        TRelResourceMap extends object = Record<string, never>,
        TResourceTypeToRelMap extends Record<string, object> = Record<string, never>
    >(
        endpoint: string,
        options: QueryOptions
    ): Promise<{ 
        data: FlattenedResource<
            T['type'],
            T extends ResourceObject<string, infer TAttrs, any> ? TAttrs : never,
            T extends ResourceObject<any, any, infer TRelMap> ? TRelMap : never,
            TRelResourceMap,
            TResourceTypeToRelMap
       >[]; 
        meta?: Meta; 
        links?: TopLevelLinks 
    }>;
    /**
     * @overload Accept flat params (for backward compatibility)
     */
    protected async getList<
        T extends ResourceObject<string, any, any>,
        TRelResourceMap extends object = Record<string, never>,
        TResourceTypeToRelMap extends Record<string, object> = Record<string, never>
    >(
        endpoint: string,
        params?: Record<string, any>
    ): Promise<{ 
        data: FlattenedResource<
            T['type'],
            T extends ResourceObject<string, infer TAttrs, any> ? TAttrs : never,
            T extends ResourceObject<any, any, infer TRelMap> ? TRelMap : never,
            TRelResourceMap,
            TResourceTypeToRelMap
       >[]; 
        meta?: Meta; 
        links?: TopLevelLinks 
    }>;
    protected async getList<
        T extends ResourceObject<string, any, any>,
        TRelResourceMap extends object = Record<string, never>,
        TResourceTypeToRelMap extends Record<string, object> = Record<string, never>
    >(
        endpoint: string,
        paramsOrOptions?: Record<string, any> | QueryOptions
    ) {
        let params: Record<string, any> | undefined;
        
        // Use buildQueryParams when options look like QueryOptions (include, where, per_page, etc.)
        // so that include is sent as comma-separated string and the API returns included resources.
        if (isQueryOptions(paramsOrOptions)) {
            params = buildQueryParams(paramsOrOptions);
        } else {
            params = paramsOrOptions;
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
        
        // Debug: log raw API response for event_times + include to verify included/mapping
        if (params?.include && typeof endpoint === 'string' && endpoint.includes('event_times')) {
            const raw = response.data;
            const included = raw?.included ?? [];
            const dataArray = Array.isArray(raw?.data) ? raw.data : [];
            const first = dataArray[0] as { relationships?: Record<string, { data?: unknown }> } | undefined;
            this.debugLog('base.getList raw response (event_times + include)', {
                endpoint,
                paramsInclude: params.include,
                includedCount: included.length,
                includedTypes: [...new Set((included as { type?: string }[]).map((r) => r.type))],
                firstDataItemRelationships: first?.relationships,
            });
        }
        
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
     *
     * Returns flattened shape (same as getSingle/getList): attributes and relationships at top level.
     */
    protected async createResource<T extends ResourceObject<string, any, any>>(
        endpoint: string,
        data: any,
        params?: Record<string, any>
    ) {
        this.debugLog('base.createResource', { endpoint, params });
        const response = await this.httpClient.request<{ data: T; included?: ResourceObject<string, any, any>[] }>({
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
        const created = mapIncludedToRelationships([response.data.data], response.data?.included)[0];
        this.debugLog('base.createResource result', { endpoint, id: (created as { id?: string })?.id });
        return created as unknown as FlattenedResource<
            T['type'],
            T extends ResourceObject<string, infer TAttrs, any> ? TAttrs : never,
            T extends ResourceObject<any, any, infer TRelMap> ? TRelMap : never
        >;
    }

    /**
     * Update a resource
     *
     * Returns flattened shape (same as getSingle/getList): attributes and relationships at top level.
     */
    protected async updateResource<T extends ResourceObject<string, any, any>>(
        endpoint: string,
        data: any,
        params?: Record<string, any>
    ) {
        this.debugLog('base.updateResource', { endpoint, params });
        const response = await this.httpClient.request<{ data: T; included?: ResourceObject<string, any, any>[] }>({
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
        const updated = mapIncludedToRelationships([response.data.data], response.data?.included)[0];
        this.debugLog('base.updateResource result', { endpoint, id: (updated as { id?: string })?.id });
        return updated as unknown as FlattenedResource<
            T['type'],
            T extends ResourceObject<string, infer TAttrs, any> ? TAttrs : never,
            T extends ResourceObject<any, any, infer TRelMap> ? TRelMap : never
        >;
    }

    /**
     * Delete a resource
     */
    protected async deleteResource(endpoint: string, params?: Record<string, any>) {
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
        TRelResourceMap extends Record<string, ResourceObject<string, any, any> | ResourceObject<string, any, any>[]> = Record<string, never>,
        TResourceTypeToRelMap extends Record<string, object> = Record<string, never>
    >(
        endpoint: string,
        options: QueryOptions,
        paginationOptions?: PaginationOptions
    ): Promise<PaginationResult<T, TIncluded, TRelResourceMap, TResourceTypeToRelMap>>;
    /**
     * @overload Accept flat params (for backward compatibility)
     */
    protected async getAllPages<
        T extends ResourceObject<string, any, any>, 
        TIncluded extends ResourceObject<string, any, any> = ResourceObject<string, any, any>,
        TRelResourceMap extends Record<string, ResourceObject<string, any, any> | ResourceObject<string, any, any>[]> = Record<string, never>,
        TResourceTypeToRelMap extends Record<string, object> = Record<string, never>
    >(
        endpoint: string,
        params?: Record<string, any>,
        options?: PaginationOptions
    ): Promise<PaginationResult<T, TIncluded, TRelResourceMap, TResourceTypeToRelMap>>;
    protected async getAllPages<
        T extends ResourceObject<string, any, any>, 
        TIncluded extends ResourceObject<string, any, any> = ResourceObject<string, any, any>,
        TRelResourceMap extends Record<string, ResourceObject<string, any, any> | ResourceObject<string, any, any>[]> = Record<string, never>,
        TResourceTypeToRelMap extends Record<string, object> = Record<string, never>
    >(
        endpoint: string,
        paramsOrOptions?: Record<string, any> | QueryOptions,
        paginationOptions?: PaginationOptions
    ) {
        let params: Record<string, any> | undefined;
        let paginationOpts: PaginationOptions | undefined;
        
        if (isQueryOptions(paramsOrOptions)) {
            params = buildQueryParams(paramsOrOptions);
            paginationOpts = paginationOptions;
        } else {
            params = paramsOrOptions;
            paginationOpts = paginationOptions;
        }

        this.debugLog('base.getAllPages', { endpoint, params, paginationOptions: paginationOpts });
        
        return this.paginationHelper.getAllPages<T, TIncluded, TRelResourceMap, TResourceTypeToRelMap>(endpoint, params, paginationOpts);
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

