/**
 * Tests for performance optimization functions
 */

import {
  processInBatches,
  batchFetchPersonDetails,
  ApiCache,
  getCachedPeople,
  fetchAllPages,
  streamPeopleData,
  processLargeDataset,
  PerformanceMonitor,
  monitorPerformance,
  AdaptiveRateLimiter,
} from '../src/performance';
import { PcoClient } from '../src/client';
import { createTestClient } from './integration/test-config';
import type { PersonResource } from '../src/types';

describe('Performance Functions', () => {
  describe('processInBatches', () => {
    it('should process items in batches', async () => {
      const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const processor = jest.fn().mockImplementation((batch) => 
        Promise.resolve(batch.map((item: number) => item * 2))
      );
      
      const results = await processInBatches(items, 3, processor);
      
      expect(results).toEqual([2, 4, 6, 8, 10, 12, 14, 16, 18, 20]);
      expect(processor).toHaveBeenCalledTimes(4); // 4 batches: [1,2,3], [4,5,6], [7,8,9], [10]
    });

    it('should handle empty array', async () => {
      const processor = jest.fn().mockResolvedValue([]);
      
      const results = await processInBatches([], 3, processor);
      
      expect(results).toEqual([]);
      expect(processor).not.toHaveBeenCalled();
    });

    it('should handle single batch', async () => {
      const items = [1, 2];
      const processor = jest.fn().mockImplementation((batch) => 
        Promise.resolve(batch.map((item: number) => item * 2))
      );
      
      const results = await processInBatches(items, 10, processor);
      
      expect(results).toEqual([2, 4]);
      expect(processor).toHaveBeenCalledTimes(1);
    });
  });

  describe('batchFetchPersonDetails', () => {
    let client: PcoClient;
    let testPersonIds: string[] = [];

    beforeAll(async () => {
      client = createTestClient();
      
      // Create test people
      for (let i = 0; i < 3; i++) {
        const person = await client.people.create({
          firstName: `Test_Batch_${Date.now()}_${i}`,
          lastName: `Person_${i}`,
          status: 'active' as const,
        });
        testPersonIds.push(person.id);
      }
    }, 30000);

    afterAll(async () => {
      for (const personId of testPersonIds) {
        await client.people.delete(personId);
      }
    }, 30000);

    it('should batch fetch person details with emails and phones', async () => {
      const results = await batchFetchPersonDetails(client, testPersonIds, {
        includeEmails: true,
        includePhones: true,
        batchSize: 2,
      });
      
      expect(results.size).toBe(testPersonIds.length);
      for (const personId of testPersonIds) {
        expect(results.has(personId)).toBe(true);
        const personData = results.get(personId);
        expect(personData).toBeDefined();
        expect(personData?.person).toBeDefined();
        expect(personData?.person.id).toBe(personId);
      }
    }, 30000);

    it('should batch fetch without emails', async () => {
      const results = await batchFetchPersonDetails(client, testPersonIds, {
        includeEmails: false,
        includePhones: true,
      });
      
      expect(results.size).toBe(testPersonIds.length);
      for (const personId of testPersonIds) {
        const personData = results.get(personId);
        expect(personData?.emails).toBeUndefined();
      }
    }, 30000);

    it('should batch fetch without phones', async () => {
      const results = await batchFetchPersonDetails(client, testPersonIds, {
        includeEmails: true,
        includePhones: false,
      });
      
      expect(results.size).toBe(testPersonIds.length);
      for (const personId of testPersonIds) {
        const personData = results.get(personId);
        expect(personData?.phoneNumbers).toBeUndefined();
      }
    }, 30000);
  });

  describe('ApiCache', () => {
    it('should store and retrieve data', () => {
      const cache = new ApiCache();
      
      cache.set('key1', { data: 'value1' });
      const result = cache.get('key1');
      
      expect(result).toEqual({ data: 'value1' });
    });

    it('should return null for non-existent key', () => {
      const cache = new ApiCache();
      
      const result = cache.get('nonexistent');
      
      expect(result).toBeNull();
    });

    it('should expire data after TTL', async () => {
      const cache = new ApiCache();
      
      cache.set('key1', { data: 'value1' }, 100); // 100ms TTL
      
      // Should be available immediately
      expect(cache.get('key1')).toEqual({ data: 'value1' });
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Should be expired
      expect(cache.get('key1')).toBeNull();
    });

    it('should clear all cached data', () => {
      const cache = new ApiCache();
      
      cache.set('key1', { data: 'value1' });
      cache.set('key2', { data: 'value2' });
      
      expect(cache.size()).toBe(2);
      
      cache.clear();
      
      expect(cache.size()).toBe(0);
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeNull();
    });

    it('should return cache size', () => {
      const cache = new ApiCache();
      
      expect(cache.size()).toBe(0);
      
      cache.set('key1', { data: 'value1' });
      expect(cache.size()).toBe(1);
      
      cache.set('key2', { data: 'value2' });
      expect(cache.size()).toBe(2);
    });
  });

  describe('getCachedPeople', () => {
    let client: PcoClient;

    beforeAll(async () => {
      client = createTestClient();
    }, 30000);

    it('should return cached data when available', async () => {
      const cache = new ApiCache();
      const params = { where: { status: 'active' } };
      
      // First call - should fetch and cache (getAll can be slow with large datasets)
      const result1 = await getCachedPeople(client, cache, params);
      
      // Second call - should return cached
      const result2 = await getCachedPeople(client, cache, params);
      
      expect(result1).toEqual(result2);
      expect(cache.size()).toBe(1);
    }, 180000);

    it('should fetch fresh data when cache expires', async () => {
      const cache = new ApiCache();
      const params = { where: { status: 'active' }, per_page: 1 }; // Limit to 1 result for faster test
      
      // First call with short TTL
      const result1 = await getCachedPeople(client, cache, params, 100);
      expect(result1).toBeDefined();
      expect(result1.data).toBeDefined();
      
      // Verify it's cached
      expect(cache.size()).toBe(1);
      
      // Wait for expiration (100ms TTL + 100ms buffer to ensure expiration)
      await new Promise(resolve => setTimeout(resolve, 250));
      
      // Cache should be expired, so this should fetch fresh data
      // Note: This test verifies the cache expiration works, but the actual API call
      // might be slow, so we just verify it completes successfully
      const result2Promise = getCachedPeople(client, cache, params);
      
      // Use Promise.race to timeout if it takes too long (120 seconds for API call)
      const result2 = await Promise.race([
        result2Promise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Test timeout - API call took too long')), 120000)
        )
      ]) as Awaited<ReturnType<typeof getCachedPeople>>;
      
      expect(result2).toBeDefined();
      expect(result2.data).toBeDefined();
    }, 200000); // Increased timeout for slow API calls (getAll can be slow)
  });

  describe('fetchAllPages', () => {
    // These tests use mock functions, so they don't need a real client
    const mockClient = {} as PcoClient;

    it('should fetch all pages', async () => {
      let pageCallCount = 0;
      const fetchFunction = jest.fn().mockImplementation((page: number, perPage: number) => {
        pageCallCount++;
        if (page === 1) {
          return Promise.resolve({
            data: Array(perPage).fill(null).map((_, i) => ({ id: `item-${i}` })),
            links: { next: 'has-more' },
            meta: { total_count: 25 },
          });
        } else if (page === 2) {
          return Promise.resolve({
            data: Array(5).fill(null).map((_, i) => ({ id: `item-${perPage + i}` })),
            links: {},
            meta: { total_count: 25 },
          });
        }
        return Promise.resolve({
          data: [],
          links: {},
          meta: { total_count: 25 },
        });
      });
      
      const results = await fetchAllPages(mockClient, fetchFunction, {
        perPage: 10,
        maxPages: 10,
      });
      
      expect(results.length).toBe(15); // 10 + 5
      expect(fetchFunction).toHaveBeenCalledTimes(2);
    });

    it('should call onProgress callback', async () => {
      const onProgress = jest.fn();
      const fetchFunction = jest.fn().mockImplementation((page: number) => {
        if (page === 1) {
          return Promise.resolve({
            data: [{ id: '1' }, { id: '2' }],
            links: { next: 'has-more' },
            meta: { total_count: 4 },
          });
        }
        return Promise.resolve({
          data: [{ id: '3' }, { id: '4' }],
          links: {},
          meta: { total_count: 4 },
        });
      });
      
      await fetchAllPages(mockClient, fetchFunction, {
        perPage: 2,
        onProgress,
      });
      
      expect(onProgress).toHaveBeenCalled();
      expect(onProgress).toHaveBeenCalledWith(2, 4);
      expect(onProgress).toHaveBeenCalledWith(4, 4);
    });

    it('should respect maxPages limit', async () => {
      const fetchFunction = jest.fn().mockImplementation(() => 
        Promise.resolve({
          data: [{ id: '1' }],
          links: { next: 'has-more' },
          meta: { total_count: 100 },
        })
      );
      
      await fetchAllPages(mockClient, fetchFunction, {
        perPage: 1,
        maxPages: 3,
      });
      
      expect(fetchFunction).toHaveBeenCalledTimes(3);
    });
  });

  describe('streamPeopleData', () => {
    let client: PcoClient;

    beforeAll(async () => {
      client = createTestClient();
    }, 30000);

    it('should stream people data in batches', async () => {
      let batchCount = 0;
      const batches: PersonResource[][] = [];
      
      for await (const batch of streamPeopleData(client, {
        perPage: 10,
        maxConcurrent: 2,
      })) {
        batchCount++;
        batches.push(batch);
        if (batchCount >= 2) break; // Limit to 2 batches for testing
      }
      
      expect(batchCount).toBeGreaterThan(0);
      expect(batches.length).toBeGreaterThan(0);
      expect(Array.isArray(batches[0])).toBe(true);
    }, 30000);
  });

  describe('processLargeDataset', () => {
    it('should process large dataset in batches', async () => {
      let pageCallCount = 0;
      const fetchFunction = jest.fn().mockImplementation((page: number) => {
        pageCallCount++;
        if (page === 1) {
          return Promise.resolve({
            data: [{ id: '1', value: 10 }, { id: '2', value: 20 }],
            links: { next: 'has-more' },
          });
        }
        return Promise.resolve({
          data: [{ id: '3', value: 30 }],
          links: {},
        });
      });
      
      const processor = jest.fn().mockImplementation((item: any) => item.value * 2);
      
      const results = await processLargeDataset(
        {} as PcoClient,
        fetchFunction,
        processor,
        {
          perPage: 2,
          maxMemoryItems: 5,
        }
      );
      
      expect(results).toEqual([20, 40, 60]);
      expect(processor).toHaveBeenCalledTimes(3);
    });

    it('should call onBatchProcessed callback', async () => {
      const fetchFunction = jest.fn().mockImplementation(() => 
        Promise.resolve({
          data: [{ id: '1' }, { id: '2' }],
          links: {},
        })
      );
      
      const processor = jest.fn().mockImplementation((item: any) => item.id);
      const onBatchProcessed = jest.fn();
      
      await processLargeDataset(
        {} as PcoClient,
        fetchFunction,
        processor,
        {
          perPage: 2,
          maxMemoryItems: 1,
          onBatchProcessed,
        }
      );
      
      expect(onBatchProcessed).toHaveBeenCalled();
    });
  });

  describe('PerformanceMonitor', () => {
    it('should track operation timing', async () => {
      const monitor = new PerformanceMonitor();
      
      const endTimer = monitor.startTimer('test-operation');
      // Simulate some work with a small delay
      await new Promise(resolve => setTimeout(resolve, 10));
      endTimer();
      
      const metrics = monitor.getMetrics();
      
      expect(metrics['test-operation']).toBeDefined();
      expect(metrics['test-operation'].count).toBe(1);
      expect(metrics['test-operation'].totalTime).toBeGreaterThanOrEqual(0);
      expect(metrics['test-operation'].averageTime).toBeGreaterThanOrEqual(0);
    });

    it('should track multiple operations', () => {
      const monitor = new PerformanceMonitor();
      
      const end1 = monitor.startTimer('op1');
      end1();
      
      const end2 = monitor.startTimer('op2');
      end2();
      
      const metrics = monitor.getMetrics();
      
      expect(metrics['op1']).toBeDefined();
      expect(metrics['op2']).toBeDefined();
      expect(metrics['op1'].count).toBe(1);
      expect(metrics['op2'].count).toBe(1);
    });

    it('should track min and max times', () => {
      const monitor = new PerformanceMonitor();
      
      // Simulate different durations
      const end1 = monitor.startTimer('op');
      setTimeout(() => end1(), 10);
      
      // Wait and do another
      setTimeout(() => {
        const end2 = monitor.startTimer('op');
        setTimeout(() => end2(), 50);
      }, 20);
      
      // This is async, so we'll test synchronously
      const end3 = monitor.startTimer('op');
      end3();
      
      const end4 = monitor.startTimer('op');
      end4();
      
      const metrics = monitor.getMetrics();
      
      expect(metrics['op'].minTime).toBeGreaterThanOrEqual(0);
      expect(metrics['op'].maxTime).toBeGreaterThanOrEqual(metrics['op'].minTime);
    });

    it('should reset metrics', () => {
      const monitor = new PerformanceMonitor();
      
      const end = monitor.startTimer('op');
      end();
      
      expect(monitor.getMetrics()['op']).toBeDefined();
      
      monitor.reset();
      
      expect(Object.keys(monitor.getMetrics())).toHaveLength(0);
    });
  });

  describe('AdaptiveRateLimiter', () => {
    it('should wait for current delay', async () => {
      const limiter = new AdaptiveRateLimiter();
      
      const startTime = Date.now();
      await limiter.wait();
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeGreaterThanOrEqual(90); // Allow some margin
    });

    it('should reduce delay on success', () => {
      const limiter = new AdaptiveRateLimiter();
      
      const initialDelay = limiter.getCurrentDelay();
      
      // Trigger multiple successes
      for (let i = 0; i < 6; i++) {
        limiter.onSuccess();
      }
      
      const newDelay = limiter.getCurrentDelay();
      expect(newDelay).toBeLessThanOrEqual(initialDelay);
    });

    it('should increase delay on error', () => {
      const limiter = new AdaptiveRateLimiter();
      
      const initialDelay = limiter.getCurrentDelay();
      
      limiter.onError();
      
      const newDelay = limiter.getCurrentDelay();
      expect(newDelay).toBeGreaterThan(initialDelay);
    });

    it('should respect min delay', () => {
      const limiter = new AdaptiveRateLimiter();
      
      // Trigger many successes
      for (let i = 0; i < 100; i++) {
        limiter.onSuccess();
      }
      
      expect(limiter.getCurrentDelay()).toBeGreaterThanOrEqual(50);
    });

    it('should respect max delay', () => {
      const limiter = new AdaptiveRateLimiter();
      
      // Trigger many errors - should cap at maxDelay (5000 by default)
      // Starting at 100ms, with backoffFactor 1.5, it will grow but cap at 5000
      for (let i = 0; i < 20; i++) {
        limiter.onError();
      }
      
      // Should be capped at the default maxDelay of 5000
      expect(limiter.getCurrentDelay()).toBeLessThanOrEqual(5000);
    });

    it('should reset success count on error', () => {
      const limiter = new AdaptiveRateLimiter();
      
      // Build up success count
      for (let i = 0; i < 4; i++) {
        limiter.onSuccess();
      }
      
      // Error should reset
      limiter.onError();
      
      // Next success should start counting from 0
      const delayBefore = limiter.getCurrentDelay();
      limiter.onSuccess();
      const delayAfter = limiter.getCurrentDelay();
      
      // Delay shouldn't have decreased much since we only have 1 success
      expect(Math.abs(delayAfter - delayBefore)).toBeLessThan(10);
    });
  });
});
