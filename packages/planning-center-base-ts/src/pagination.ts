/**
 * v2.0.0 Pagination Utilities
 */

import type { PcoClientConfig } from './types/config';
import type { ResourceObject, Paginated, Meta, TopLevelLinks } from './types/json-api';
import type { PcoHttpClient } from './http-client';
import { mapIncludedToRelationships } from './included-resolver';
import type { FlattenedResource } from './types/flattened-resource';
import { createDebugLogger } from './debug';

export interface PaginationOptions {
    /** Maximum number of pages to fetch */
    maxPages?: number;
    /** Items per page */
    perPage?: number;
    /** Progress callback */
    onProgress?: (current: number, total: number) => void;
    /** Delay between requests in milliseconds */
    delay?: number;
}

export interface PaginationResult<
    T extends ResourceObject<string, any, any>, 
    TIncluded extends ResourceObject<string, any, any> = ResourceObject<string, any, any>,
    TRelResourceMap extends Record<string, ResourceObject<string, any, any> | ResourceObject<string, any, any>[]> = Record<string, never>,
    TResourceTypeToRelMap extends Record<string, object> = Record<string, never>
> {
    data: FlattenedResource<
        T['type'],
        T extends ResourceObject<string, infer TAttrs, any> ? TAttrs : never,
        T extends ResourceObject<any, any, infer TRelMap> ? TRelMap : never,
        TRelResourceMap,
        TResourceTypeToRelMap
   >[];
    totalCount: number;
    pagesFetched: number;
    duration: number;
    /** Meta information from the API response (from last page) */
    meta?: Meta;
    /** Links from the API response (from last page) */
    links?: TopLevelLinks;
}

export class PaginationHelper {
    constructor(
        private httpClient: PcoHttpClient,
        private getConfig?: () => PcoClientConfig
    ) { }

    private debugLog(message: string, data?: unknown): void {
        const logger = createDebugLogger(this.getConfig?.());
        if (logger.enabled) logger.log(message, data);
    }

    async getAllPages<
        T extends ResourceObject<string, any, any>, 
        TIncluded extends ResourceObject<string, any, any> = ResourceObject<string, any, any>,
        TRelResourceMap extends Record<string, ResourceObject<string, any, any> | ResourceObject<string, any, any>[]> = Record<string, never>,
        TResourceTypeToRelMap extends Record<string, object> = Record<string, never>
    >(
        endpoint: string,
        params: Record<string, any> = {},
        options: PaginationOptions = {}
    ) {
        // Ensure endpoint is a string
        if (typeof endpoint !== 'string') {
            throw new Error(`Expected endpoint to be a string, got ${typeof endpoint}`);
        }
        const {
            maxPages = 1000,
            perPage = 100,
            onProgress,
            delay = 50,
        } = options;

        const startTime = Date.now();
        this.debugLog('pagination  getAllPages start', { endpoint, maxPages, perPage });
        const allData: T[] = [];
        // Use Map to deduplicate included resources by type+id
        const includedMap = new Map<string, TIncluded>();
        let page = 1;
        let offset: number | null = null;
        let previousOffset: number | null = null;
        let hasMore = true;
        let totalCount = 0;
        let useOffsetPagination = false;
        // Preserve meta and links from the last page response
        let lastPageMeta: Meta | undefined;
        let lastPageLinks: TopLevelLinks | undefined;

        while (hasMore && page <= maxPages) {
            const requestParams: Record<string, any> = {
                ...params,
            };

            // Use offset if detected, otherwise use page
            if (useOffsetPagination && offset !== null) {
                requestParams.offset = offset;
            } else {
                requestParams.page = page;
            }
            requestParams.per_page = perPage;

            const response = await this.httpClient.request<Paginated<T, TIncluded>>({
                method: 'GET',
                endpoint,
                params: requestParams,
            });

            const pageData = Array.isArray(response.data?.data) ? response.data.data : [];
            this.debugLog('pagination  page', { endpoint, page, count: pageData.length });

            // Capture meta and links from each page (will be overwritten, keeping the last page's)
            lastPageMeta = response.data.meta;
            lastPageLinks = response.data.links;

            if (response.data.data && Array.isArray(response.data.data)) {
                allData.push(...response.data.data);
            }

            // Collect included resources, deduplicating by type+id
            if (response.data.included && Array.isArray(response.data.included)) {
                for (const included of response.data.included) {
                    const key = `${included.type}:${included.id}`;
                    if (!includedMap.has(key)) {
                        includedMap.set(key, included as TIncluded);
                    }
                }
            }

            if (response.data.meta?.total_count) {
                totalCount = Number(response.data.meta.total_count) || 0;
            }

            // Check if we have a next link and detect pagination type
            const nextLink = response.data.links?.next;
            hasMore = !!nextLink;
            
            // Detect if API uses offset-based pagination
            if (nextLink && nextLink.includes('offset=') && !useOffsetPagination) {
                useOffsetPagination = true;
            }

            // Extract offset from next link if using offset pagination
            if (hasMore && useOffsetPagination && nextLink) {
                const offsetMatch = nextLink.match(/offset=(\d+)/);
                if (offsetMatch) {
                    previousOffset = offset;
                    offset = parseInt(offsetMatch[1], 10);
                    
                    // Loop detection: if new offset equals previous offset, we're stuck
                    if (previousOffset !== null && offset === previousOffset) {
                        this.debugLog('pagination  loop detected (offset not advancing)', { offset });
                        hasMore = false;
                    }
                } else {
                    hasMore = false; // No offset found, assume we're done
                }
            }
            
            // Additional safeguard for page-based pagination
            if (hasMore && nextLink && !useOffsetPagination && nextLink.includes(`page=${page}`)) {
                this.debugLog('pagination  loop detected (next link same page)', { page });
                hasMore = false;
            }
            
            if (!useOffsetPagination) {
                page++;
            }

            if (onProgress) {
                onProgress(allData.length, totalCount || allData.length);
            }

            // Add delay between requests to respect rate limits
            if (hasMore && delay > 0) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        const pagesFetched = page - 1;
        const duration = Date.now() - startTime;
        this.debugLog('pagination  getAllPages complete', { endpoint, pagesFetched, totalCount: allData.length, duration });

        // Map included resources to relationships in all collected data
        // Always flatten, even if no included data (to maintain consistent return type)
        const includedArray = includedMap.size > 0 ? Array.from(includedMap.values()) : undefined;
        const mappedData = mapIncludedToRelationships(allData, includedArray);

        return {
            data: mappedData,
            totalCount,
            pagesFetched,
            duration,
            meta: lastPageMeta,
            links: lastPageLinks,
        };
    }

    async getPage<T extends ResourceObject<string, any, any>, TIncluded extends ResourceObject<string, any, any> = ResourceObject<string, any, any>>(
        endpoint: string,
        page: number = 1,
        perPage: number = 100,
        params: Record<string, any> = {}
    ) {
        const response = await this.httpClient.request<Paginated<T, TIncluded>>({
            method: 'GET',
            endpoint,
            params: {
                ...params,
                page,
                per_page: perPage,
            },
        });

        return response.data;
    }

    async* streamPages<T extends ResourceObject<string, any, any>>(
        endpoint: string,
        params: Record<string, any> = {},
        options: PaginationOptions = {}
    ): AsyncGenerator<T[], void, unknown> {
        const {
            maxPages = 1000,
            perPage = 100,
            delay = 50,
        } = options;

        let page = 1;
        let hasMore = true;

        while (hasMore && page <= maxPages) {
            const response = await this.httpClient.request<Paginated<T>>({
                method: 'GET',
                endpoint,
                params: {
                    ...params,
                    page,
                    per_page: perPage,
                },
            });

            if (response.data.data && Array.isArray(response.data.data)) {
                yield response.data.data;
            }

            // Check if we have a next link and if it's different from current page
            const nextLink = response.data.links?.next;
            hasMore = !!nextLink;
            
            // Additional safeguard: if we're getting the same page repeatedly, break the loop
            if (hasMore && nextLink && nextLink.includes(`page=${page}`)) {
                this.debugLog('pagination  loop detected (streamPages same page)', { page });
                hasMore = false;
            }
            
            page++;

            if (hasMore && delay > 0) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    /**
     * Get all pages with parallel processing for better performance
     */
    async getAllPagesParallel<T extends ResourceObject<string, any, any>, TIncluded extends ResourceObject<string, any, any> = ResourceObject<string, any, any>>(
        endpoint: string,
        params: Record<string, any> = {},
        options: PaginationOptions & { maxConcurrency?: number } = {}
    ) {
        const {
            maxPages = 1000,
            perPage = 100,
            maxConcurrency = 3,
            onProgress,
        } = options;

        const startTime = Date.now();

        // First, get the first page to determine total count
        const firstPage = await this.getPage<T, TIncluded>(endpoint, 1, perPage, params);
        const totalCount = Number(firstPage.meta?.total_count) || 0;
        const totalPages = Math.min(Math.ceil(totalCount / perPage), maxPages);

        const allData: T[] = [...(firstPage.data || [])];
        // Use Map to deduplicate included resources by type+id
        const includedMap = new Map<string, TIncluded>();
        
        // Collect included from first page
        if (firstPage.included && Array.isArray(firstPage.included)) {
            for (const included of firstPage.included) {
                const key = `${included.type}:${included.id}`;
                if (!includedMap.has(key)) {
                    includedMap.set(key, included as TIncluded);
                }
            }
        }

        // Track last page's meta and links (will be updated as we process pages)
        let lastPageMeta: Meta | undefined = firstPage.meta;
        let lastPageLinks: TopLevelLinks | undefined = firstPage.links;

        if (totalPages <= 1) {
            // Map included resources to relationships
            // Always flatten, even if no included data (to maintain consistent return type)
            const includedArray = includedMap.size > 0 ? Array.from(includedMap.values()) : undefined;
            const mappedData = mapIncludedToRelationships(allData, includedArray);
            
            return {
                data: mappedData,
                totalCount,
                pagesFetched: 1,
                duration: Date.now() - startTime,
                meta: lastPageMeta,
                links: lastPageLinks,
            };
        }

        // Process remaining pages in parallel batches
        const remainingPages = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
        const semaphore = new Semaphore(maxConcurrency);

        const pagePromises = remainingPages.map(async (pageNum) => {
            await semaphore.acquire();
            try {
                const page = await this.getPage<T, TIncluded>(endpoint, pageNum, perPage, params);
                return {
                    pageNum,
                    data: page.data || [],
                    included: page.included || [],
                    meta: page.meta,
                    links: page.links
                };
            } finally {
                semaphore.release();
            }
        });

        const pageResults = await Promise.all(pagePromises);

        // Sort by page number to ensure we process in order and get the actual last page
        pageResults.sort((a, b) => a.pageNum - b.pageNum);

        for (const pageResult of pageResults) {
            allData.push(...pageResult.data);
            
            // Collect included resources, deduplicating by type+id
            for (const included of pageResult.included) {
                const key = `${included.type}:${included.id}`;
                if (!includedMap.has(key)) {
                    includedMap.set(key, included as TIncluded);
                }
            }

            // Update last page meta and links (will keep the last one processed, which is the highest page number)
            if (pageResult.meta) {
                lastPageMeta = pageResult.meta;
            }
            if (pageResult.links) {
                lastPageLinks = pageResult.links;
            }

            if (onProgress) {
                onProgress(allData.length, totalCount);
            }
        }

        // Map included resources to relationships
        // Always flatten, even if no included data (to maintain consistent return type)
        const includedArray = includedMap.size > 0 ? Array.from(includedMap.values()) : undefined;
        const mappedData = mapIncludedToRelationships(allData, includedArray);
        
        return {
            data: mappedData,
            totalCount,
            pagesFetched: totalPages,
            duration: Date.now() - startTime,
            meta: lastPageMeta,
            links: lastPageLinks,
        };
    }
}

/**
 * Semaphore for controlling concurrency
 */
class Semaphore {
    private permits: number;
    private waiting: (() => void)[] = [];

    constructor(permits: number) {
        this.permits = permits;
    }

    async acquire() {
        if (this.permits > 0) {
            this.permits--;
            return;
        }

        return new Promise<void>(resolve => {
            this.waiting.push(() => resolve());
        });
    }

    release(): void {
        this.permits++;
        if (this.waiting.length > 0) {
            const resolve = this.waiting.shift()!;
            this.permits--;
            resolve();
        }
    }
}

