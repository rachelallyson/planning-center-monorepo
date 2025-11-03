/**
 * Tests for PaginationHelper (base package)
 */

import { PaginationHelper } from '../src/pagination';
import { PcoHttpClient } from '../src/http-client';
import { PcoEventEmitter } from '../src/monitoring';
import type { PcoClientConfig } from '../src/types/config';
import type { ResourceObject } from '../src/types/json-api';

// Mock fetch
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('PaginationHelper', () => {
  let paginationHelper: PaginationHelper;
  let httpClient: PcoHttpClient;
  let eventEmitter: PcoEventEmitter;

  beforeEach(() => {
    eventEmitter = new PcoEventEmitter();
    const config: PcoClientConfig = {
      auth: {
        type: 'oauth',
        accessToken: 'test-token',
      },
    };
    httpClient = new PcoHttpClient(config, eventEmitter);
    paginationHelper = new PaginationHelper(httpClient);
    jest.clearAllMocks();
  });

  describe('getAllPages', () => {
    it('should fetch all pages from paginated response', async () => {
      const page1Response = {
        data: [{ id: '1', type: 'Resource', attributes: { name: 'Resource 1' } }],
        links: {
          next: 'https://api.planningcenteronline.com/test/v2/resources?page=2',
        },
      };

      const page2Response = {
        data: [{ id: '2', type: 'Resource', attributes: { name: 'Resource 2' } }],
        links: {},
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Map([['content-type', 'application/json']]),
          json: () => Promise.resolve(page1Response),
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Map([['content-type', 'application/json']]),
          json: () => Promise.resolve(page2Response),
        } as unknown as Response);

      const result = await paginationHelper.getAllPages<ResourceObject<string, any, any>>(
        '/resources'
      );

      expect(result.data).toHaveLength(2);
      expect(result.data[0].id).toBe('1');
      expect(result.data[1].id).toBe('2');
      expect(result.pagesFetched).toBe(2);
      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should handle single page response', async () => {
      const singlePageResponse = {
        data: [{ id: '1', type: 'Resource' }],
        links: {},
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve(singlePageResponse),
      } as unknown as Response);

      const result = await paginationHelper.getAllPages<ResourceObject<string, any, any>>(
        '/resources'
      );

      expect(result.data).toHaveLength(1);
      expect(result.pagesFetched).toBe(1);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should respect maxPages limit', async () => {
      // Create responses that would normally continue paginating
      const pageResponse = {
        data: [{ id: '1', type: 'Resource' }],
        links: {
          next: 'https://api.planningcenteronline.com/test/v2/resources?page=2',
        },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve(pageResponse),
      } as unknown as Response);

      const result = await paginationHelper.getAllPages<ResourceObject<string, any, any>>(
        '/resources',
        {},
        { maxPages: 2 }
      );

      expect(result.pagesFetched).toBeLessThanOrEqual(2);
    });

    it('should call onProgress callback', async () => {
      const onProgress = jest.fn();
      const pageResponse = {
        data: [{ id: '1', type: 'Resource' }],
        links: {},
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve(pageResponse),
      } as unknown as Response);

      await paginationHelper.getAllPages<ResourceObject<string, any, any>>(
        '/resources',
        {},
        { onProgress }
      );

      expect(onProgress).toHaveBeenCalled();
    });
  });

  describe('getPage', () => {
    it('should fetch a specific page', async () => {
      const pageResponse = {
        data: [{ id: '1', type: 'Resource' }],
        links: { self: '/resources?page=2' },
        meta: { total_count: 10 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve(pageResponse),
      } as unknown as Response);

      const result = await paginationHelper.getPage<ResourceObject<string, any, any>>(
        '/resources',
        2,
        10
      );

      expect(result.data).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('page=2'),
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('per_page=10'),
        expect.any(Object)
      );
    });
  });

  describe('streamPages', () => {
    it('should stream pages as async generator', async () => {
      const page1Response = {
        data: [{ id: '1', type: 'Resource' }],
        links: {
          next: 'https://api.planningcenteronline.com/test/v2/resources?page=2',
        },
      };

      const page2Response = {
        data: [{ id: '2', type: 'Resource' }],
        links: {},
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Map([['content-type', 'application/json']]),
          json: () => Promise.resolve(page1Response),
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Map([['content-type', 'application/json']]),
          json: () => Promise.resolve(page2Response),
        } as unknown as Response);

      const pages: ResourceObject<string, any, any>[][] = [];
      for await (const page of paginationHelper.streamPages<ResourceObject<string, any, any>>(
        '/resources'
      )) {
        pages.push(page);
      }

      expect(pages).toHaveLength(2);
      expect(pages[0]).toHaveLength(1);
      expect(pages[1]).toHaveLength(1);
    });

    it('should handle empty response', async () => {
      const emptyResponse = {
        data: [],
        links: {},
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve(emptyResponse),
      } as unknown as Response);

      const pages: ResourceObject<string, any, any>[][] = [];
      for await (const page of paginationHelper.streamPages<ResourceObject<string, any, any>>(
        '/resources'
      )) {
        pages.push(page);
      }

      expect(pages).toHaveLength(1);
      expect(pages[0]).toHaveLength(0);
    });

    it('should handle stream with maxPages limit', async () => {
      const pageResponse = {
        data: [{ id: '1', type: 'Resource' }],
        links: {
          next: 'https://api.planningcenteronline.com/test/v2/resources?page=2',
        },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve(pageResponse),
      } as unknown as Response);

      const pages: ResourceObject<string, any, any>[][] = [];
      for await (const page of paginationHelper.streamPages<ResourceObject<string, any, any>>(
        '/resources',
        {},
        { maxPages: 2 }
      )) {
        pages.push(page);
      }

      expect(pages.length).toBeLessThanOrEqual(2);
    });
  });

  describe('edge cases', () => {
    it('should handle response with meta but no links', async () => {
      const response = {
        data: [{ id: '1', type: 'Resource' }],
        meta: { total_count: 1 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve(response),
      } as unknown as Response);

      const result = await paginationHelper.getAllPages<ResourceObject<string, any, any>>('/resources');

      expect(result.data).toHaveLength(1);
      expect(result.pagesFetched).toBe(1);
    });

    it('should handle getPage with custom page number and per_page', async () => {
      const response = {
        data: [{ id: '1', type: 'Resource' }],
        links: {},
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve(response),
      } as unknown as Response);

      const result = await paginationHelper.getPage<ResourceObject<string, any, any>>(
        '/resources',
        3,
        25,
        { filter: 'active' }
      );

      expect(result.data).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('page=3'),
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('per_page=25'),
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('filter=active'),
        expect.any(Object)
      );
    });

    it('should handle pagination loop detection', async () => {
      const response = {
        data: [{ id: '1', type: 'Resource' }],
        links: {
          next: 'https://api.planningcenteronline.com/test/v2/resources?page=1', // Same page!
        },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve(response),
      } as unknown as Response);

      const result = await paginationHelper.getAllPages<ResourceObject<string, any, any>>('/resources');

      expect(result.pagesFetched).toBe(1);
    });
  });

  describe('getAllPagesParallel', () => {
    it('should fetch pages in parallel', async () => {
      const page1Response = {
        data: [{ id: '1', type: 'Resource' }],
        meta: { total_count: 3 },
        links: {},
      };

      const page2Response = {
        data: [{ id: '2', type: 'Resource' }],
        meta: { total_count: 3 },
        links: {},
      };

      const page3Response = {
        data: [{ id: '3', type: 'Resource' }],
        meta: { total_count: 3 },
        links: {},
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Map([['content-type', 'application/json']]),
          json: () => Promise.resolve(page1Response),
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Map([['content-type', 'application/json']]),
          json: () => Promise.resolve(page2Response),
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Map([['content-type', 'application/json']]),
          json: () => Promise.resolve(page3Response),
        } as unknown as Response);

      const result = await paginationHelper.getAllPagesParallel<ResourceObject<string, any, any>>(
        '/resources',
        {},
        { perPage: 1 }
      );

      expect(result.data).toHaveLength(3);
      expect(result.pagesFetched).toBe(3);
    });

    it('should respect maxConcurrency in parallel fetching', async () => {
      const pageResponse = {
        data: [{ id: '1', type: 'Resource' }],
        meta: { total_count: 3 },
        links: {},
      };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve(pageResponse),
      } as unknown as Response);

      const result = await paginationHelper.getAllPagesParallel<ResourceObject<string, any, any>>(
        '/resources',
        {},
        { perPage: 1, maxConcurrency: 2 }
      );

      expect(result.data).toHaveLength(3);
    });

    it('should handle single page in parallel mode', async () => {
      const pageResponse = {
        data: [{ id: '1', type: 'Resource' }],
        meta: { total_count: 1 },
        links: {},
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve(pageResponse),
      } as unknown as Response);

      const result = await paginationHelper.getAllPagesParallel<ResourceObject<string, any, any>>(
        '/resources',
        {},
        { perPage: 1 }
      );

      expect(result.data).toHaveLength(1);
      expect(result.pagesFetched).toBe(1);
    });

    it('should call onProgress in parallel mode', async () => {
      const onProgress = jest.fn();
      const pageResponse = {
        data: [{ id: '1', type: 'Resource' }],
        meta: { total_count: 2 },
        links: {},
      };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve(pageResponse),
      } as unknown as Response);

      await paginationHelper.getAllPagesParallel<ResourceObject<string, any, any>>(
        '/resources',
        {},
        { perPage: 1, onProgress }
      );

      expect(onProgress).toHaveBeenCalled();
    });
  });
});

