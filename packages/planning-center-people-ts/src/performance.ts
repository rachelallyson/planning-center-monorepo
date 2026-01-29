/**
 * Performance Optimization Utilities
 *
 * This module provides utilities for optimizing performance when working
 * with large datasets and high-volume API operations.
 */

import { createDebugLogger } from '@rachelallyson/planning-center-base-ts';
import type { PcoClient } from './client';
import type {
  EmailResource,
  PersonResource,
  PhoneNumberResource,
  PeopleList,
  EmailsList,
  PhoneNumbersList,
} from './types';
import type { PersonListOptions, PersonWhereClause } from './types/api-options';

// ===== Batch Processing =====

/**
 * Process items in batches to avoid overwhelming the API.
 * Pass `client` in options to log batch progress when debug is enabled.
 */
export async function processInBatches<T, R>(
  items: T[],
  batchSize: number,
  processor: (batch: T[]) => Promise<R[]>,
  options?: { client?: PcoClient }
): Promise<R[]> {
  const logger =
    options?.client && typeof (options.client as { getConfig?: () => unknown }).getConfig === 'function'
      ? createDebugLogger((options.client as PcoClient).getConfig())
      : null;
  if (logger?.enabled) {
    logger.log('performance.processInBatches', { itemCount: items.length, batchSize, batchCount: Math.ceil(items.length / batchSize) });
  }

  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchIndex = Math.floor(i / batchSize) + 1;
    if (logger?.enabled) logger.log('performance.processInBatches batch start', { batchIndex, batchSize: batch.length });
    const batchResults = await processor(batch);
    results.push(...batchResults);
    if (logger?.enabled) logger.log('performance.processInBatches batch complete', { batchIndex, resultCount: batchResults.length, totalSoFar: results.length });

    // Add a small delay between batches to respect rate limits
    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return results;
}

/**
 * Batch fetch person details with related data
 */
export async function batchFetchPersonDetails(
  client: PcoClient,
  personIds: string[],
  options: {
    includeEmails?: boolean;
    includePhones?: boolean;
    batchSize?: number;
  } = {}
): Promise<
  Map<
    string,
    {
      person: PersonResource;
      emails?: EmailResource[];
      phoneNumbers?: PhoneNumberResource[];
    }
  >
> {
  const logger = createDebugLogger(
    typeof (client as { getConfig?: () => unknown }).getConfig === 'function'
      ? (client as PcoClient).getConfig()
      : undefined
  );
  if (logger.enabled) logger.log('performance.batchFetchPersonDetails', { personCount: personIds.length, options });

  const {
    batchSize = 10,
    includeEmails = true,
    includePhones = true,
  } = options;
  type PersonDetails = { person: PersonResource; emails?: EmailResource[]; phoneNumbers?: PhoneNumberResource[] };
  const results = new Map<string, PersonDetails>();

  await processInBatches(personIds, batchSize, async batch => {
    const batchResults = await Promise.all(
      batch.map(async personId => {
        const personPromise = client.people.getById(personId);
        const emailPromise = includeEmails ? client.people.getEmails(personId) : null;
        const phonePromise = includePhones ? client.people.getPhoneNumbers(personId) : null;

        const promises: Promise<unknown>[] = [personPromise];
        if (emailPromise) promises.push(emailPromise);
        if (phonePromise) promises.push(phonePromise);

        const responses = await Promise.all(promises);
        const person = responses[0] as PersonResource;

        if (!person) return null;

        const result: PersonDetails = { person };

        if (includeEmails && emailPromise) {
          const emailsResponse = await emailPromise;
          result.emails = (emailsResponse as EmailsList).data || [];
        }

        if (includePhones && phonePromise) {
          const phonesResponse = await phonePromise;
          result.phoneNumbers = (phonesResponse as PhoneNumbersList).data || [];
        }

        return { personId, result };
      })
    );

    batchResults.forEach(item => {
      if (item) {
        results.set(item.personId, item.result);
      }
    });

    return batchResults; // Return for processInBatches
  }, { client });

  return results;
}

// ===== Caching =====

/**
 * Simple in-memory cache for API responses
 */
export class ApiCache {
  private cache = new Map<
    string,
    { data: any; timestamp: number; ttl: number }
  >();

  set(key: string, data: any, ttlMs = 300000): void {
    // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);

    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);

      return null;
    }

    return item.data;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * Cached version of getPeople with configurable TTL
 */
export async function getCachedPeople(
  client: PcoClient,
  cache: ApiCache,
  params: PersonListOptions = {},
  ttlMs = 300000
): Promise<PeopleList> {
  const logger = createDebugLogger(
    typeof (client as { getConfig?: () => unknown }).getConfig === 'function'
      ? (client as PcoClient).getConfig()
      : undefined
  );
  if (logger.enabled) logger.log('performance.getCachedPeople', { params, ttlMs });

  const cacheKey = `people:${JSON.stringify(params)}`;

  const cached = cache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const result = await client.people.getAll(params);

  cache.set(cacheKey, result, ttlMs);

  return result as PeopleList;
}

// ===== Pagination Optimization =====

/**
 * Efficiently fetch all pages of data with progress tracking
 */
export async function fetchAllPages<T>(
  client: PcoClient,
  fetchFunction: (
    page: number,
    perPage: number
  ) => Promise<{
    data: T[];
    links?: { next?: string };
    meta?: { total_count?: number };
  }>,
  options: {
    perPage?: number;
    maxPages?: number;
    onProgress?: (current: number, total: number) => void;
  } = {}
): Promise<T[]> {
  const logger = createDebugLogger(
    typeof (client as { getConfig?: () => unknown }).getConfig === 'function'
      ? (client as PcoClient).getConfig()
      : undefined
  );
  if (logger.enabled) logger.log('performance.fetchAllPages', { options });

  const { maxPages = 1000, onProgress, perPage = 100 } = options;
  const allData: T[] = [];
  let page = 1;
  let hasMore = true;
  let totalCount = 0;

  while (hasMore && page <= maxPages) {
    const response = await fetchFunction(page, perPage);

    allData.push(...response.data);

    if (response.meta?.total_count) {
      totalCount = response.meta.total_count;
    }

    hasMore = !!response.links?.next;
    page++;

    if (onProgress) {
      onProgress(allData.length, totalCount || allData.length);
    }

    // Add small delay to respect rate limits
    if (hasMore) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  return allData;
}

/**
 * Stream large datasets with backpressure control
 */
export async function* streamPeopleData(
  client: PcoClient,
  options: {
    perPage?: number;
    maxConcurrent?: number;
    where?: PersonWhereClause;
    include?: string[];
  } = {}
): AsyncGenerator<PersonResource[], void, unknown> {
  const logger = createDebugLogger(
    typeof (client as { getConfig?: () => unknown }).getConfig === 'function'
      ? (client as PcoClient).getConfig()
      : undefined
  );
  if (logger.enabled) logger.log('performance.streamPeopleData', { options });

  const { include = [], maxConcurrent = 3, perPage = 50, where = {} } = options;
  let page = 1;
  let hasMore = true;
  const semaphore = new Semaphore(maxConcurrent);

  while (hasMore) {
    await semaphore.acquire();

    try {
      const response = await client.people.getPage({
        include: include as any,
        page,
        perPage,
        where,
      });

      yield response.data;

      hasMore = !!response.links?.next;
      page++;
    } finally {
      semaphore.release();
    }
  }
}

// ===== Semaphore for Concurrency Control =====

class Semaphore {
  private permits: number;
  private waiting: (() => void)[] = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;

      return;
    }

    return new Promise(resolve => {
      this.waiting.push(resolve);
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

// ===== Memory Management =====

/**
 * Process large datasets without loading everything into memory
 */
export async function processLargeDataset<T, R>(
  client: PcoClient,
  fetchFunction: (
    page: number,
    perPage: number
  ) => Promise<{
    data: T[];
    links?: { next?: string };
  }>,
  processor: (item: T) => R | Promise<R>,
  options: {
    perPage?: number;
    maxMemoryItems?: number;
    onBatchProcessed?: (results: R[]) => void;
  } = {}
): Promise<R[]> {
  const logger = createDebugLogger(
    typeof (client as { getConfig?: () => unknown }).getConfig === 'function'
      ? (client as PcoClient).getConfig()
      : undefined
  );
  if (logger.enabled) logger.log('performance.processLargeDataset', { options });

  const { maxMemoryItems = 1000, onBatchProcessed, perPage = 100 } = options;
  const allResults: R[] = [];
  let page = 1;
  let hasMore = true;
  let currentBatch: R[] = [];

  while (hasMore) {
    const response = await fetchFunction(page, perPage);

    for (const item of response.data) {
      const result = await processor(item);

      currentBatch.push(result);

      // Process batch when it reaches memory limit
      if (currentBatch.length >= maxMemoryItems) {
        allResults.push(...currentBatch);
        if (onBatchProcessed) {
          onBatchProcessed(currentBatch);
        }
        currentBatch = [];
      }
    }

    hasMore = !!response.links?.next;
    page++;
  }

  // Process remaining items
  if (currentBatch.length > 0) {
    allResults.push(...currentBatch);
    if (onBatchProcessed) {
      onBatchProcessed(currentBatch);
    }
  }

  return allResults;
}

// ===== Performance Monitoring =====

/**
 * Performance metrics collector
 */
export class PerformanceMonitor {
  private metrics = new Map<
    string,
    {
      count: number;
      totalTime: number;
      minTime: number;
      maxTime: number;
    }
  >();

  startTimer(operation: string): () => void {
    const startTime = Date.now();

    return () => {
      const duration = Date.now() - startTime;

      this.recordMetric(operation, duration);
    };
  }

  private recordMetric(operation: string, duration: number): void {
    const existing = this.metrics.get(operation) || {
      count: 0,
      maxTime: 0,
      minTime: Infinity,
      totalTime: 0,
    };

    existing.count++;
    existing.totalTime += duration;
    existing.minTime = Math.min(existing.minTime, duration);
    existing.maxTime = Math.max(existing.maxTime, duration);

    this.metrics.set(operation, existing);
  }

  getMetrics(): Record<
    string,
    {
      count: number;
      averageTime: number;
      minTime: number;
      maxTime: number;
      totalTime: number;
    }
  > {
    const result: any = {};

    for (const [operation, metrics] of this.metrics) {
      result[operation] = {
        ...metrics,
        averageTime: metrics.totalTime / metrics.count,
      };
    }

    return result;
  }

  reset(): void {
    this.metrics.clear();
  }
}

/**
 * Decorator for monitoring function performance
 */
export function monitorPerformance<T extends (...args: any[]) => any>(
  monitor: PerformanceMonitor,
  operationName: string
) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const endTimer = monitor.startTimer(operationName);

      try {
        return await method.apply(this, args);
      } finally {
        endTimer();
      }
    };
  };
}

// ===== Rate Limit Optimization =====

/**
 * Adaptive rate limiter that adjusts based on API responses
 */
export class AdaptiveRateLimiter {
  private currentDelay = 100; // Start with 100ms delay
  private minDelay = 50;
  private maxDelay = 5000;
  private backoffFactor = 1.5;
  private successCount = 0;
  private errorCount = 0;

  async wait(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, this.currentDelay));
  }

  onSuccess(): void {
    this.successCount++;
    this.errorCount = 0;

    // Gradually reduce delay on success
    if (this.successCount > 5) {
      this.currentDelay = Math.max(
        this.minDelay,
        this.currentDelay / this.backoffFactor
      );
      this.successCount = 0;
    }
  }

  onError(): void {
    this.errorCount++;
    this.successCount = 0;

    // Increase delay on error
    this.currentDelay = Math.min(
      this.maxDelay,
      this.currentDelay * this.backoffFactor
    );
  }

  getCurrentDelay(): number {
    return this.currentDelay;
  }
}
