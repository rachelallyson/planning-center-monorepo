import { PaginationHelper } from '../../src/core/pagination';
import type { PcoHttpClient } from '../../src/core/http';
import type { ResourceObject, Paginated } from '../../src/types';

// Mock the HTTP client
const mockHttpClient = {
  request: jest.fn(),
} as jest.Mocked<PcoHttpClient>;

describe('PaginationHelper', () => {
  let paginationHelper: PaginationHelper;

  beforeEach(() => {
    jest.clearAllMocks();
    paginationHelper = new PaginationHelper(mockHttpClient);
  });

  describe('getAllPages', () => {
    it('should fetch all pages sequentially', async () => {
      const mockData1 = [
        { id: '1', type: 'person', attributes: { name: 'John Doe' } },
        { id: '2', type: 'person', attributes: { name: 'Jane Smith' } },
      ];
      const mockData2 = [
        { id: '3', type: 'person', attributes: { name: 'Bob Johnson' } },
      ];

      mockHttpClient.request
        .mockResolvedValueOnce({
          data: {
            data: mockData1,
            meta: { total_count: 3 },
            links: { next: 'https://api.example.com/people?page=2' },
          },
          status: 200,
          headers: {},
          requestId: 'req-1',
          duration: 100,
        })
        .mockResolvedValueOnce({
          data: {
            data: mockData2,
            meta: { total_count: 3 },
            links: {},
          },
          status: 200,
          headers: {},
          requestId: 'req-2',
          duration: 100,
        });

      const result = await paginationHelper.getAllPages('/people', {}, { perPage: 2 });

      expect(result).toEqual({
        data: [...mockData1, ...mockData2],
        totalCount: 3,
        pagesFetched: 2,
        duration: expect.any(Number),
      });

      expect(mockHttpClient.request).toHaveBeenCalledTimes(2);
      expect(mockHttpClient.request).toHaveBeenNthCalledWith(1, {
        method: 'GET',
        endpoint: '/people',
        params: { per_page: 2, page: 1 },
      });
      expect(mockHttpClient.request).toHaveBeenNthCalledWith(2, {
        method: 'GET',
        endpoint: '/people',
        params: { per_page: 2, page: 2 },
      });
    });

    it('should respect maxPages limit', async () => {
      const mockData = [{ id: '1', type: 'person', attributes: { name: 'John Doe' } }];

      // Mock 3 pages but limit to 2
      mockHttpClient.request
        .mockResolvedValueOnce({
          data: {
            data: mockData,
            meta: { total_count: 100 },
            links: { next: 'https://api.example.com/people?page=2' },
          },
          status: 200,
          headers: {},
          requestId: 'req-1',
          duration: 100,
        })
        .mockResolvedValueOnce({
          data: {
            data: mockData,
            meta: { total_count: 100 },
            links: { next: 'https://api.example.com/people?page=3' },
          },
          status: 200,
          headers: {},
          requestId: 'req-2',
          duration: 100,
        });

      const result = await paginationHelper.getAllPages('/people', {}, { maxPages: 2 });

      expect(result.pagesFetched).toBe(2);
      expect(mockHttpClient.request).toHaveBeenCalledTimes(2);
    });

    it('should call onProgress callback', async () => {
      const mockData = [{ id: '1', type: 'person', attributes: { name: 'John Doe' } }];
      const onProgress = jest.fn();

      mockHttpClient.request.mockResolvedValueOnce({
        data: {
          data: mockData,
          meta: { total_count: 1 },
          links: {},
        },
        status: 200,
        headers: {},
        requestId: 'req-1',
        duration: 100,
      });

      await paginationHelper.getAllPages('/people', {}, { onProgress });

      expect(onProgress).toHaveBeenCalledWith(1, 1);
    });

    it('should handle empty data arrays', async () => {
      mockHttpClient.request.mockResolvedValueOnce({
        data: {
          data: [],
          meta: { total_count: 0 },
          links: {},
        },
        status: 200,
        headers: {},
        requestId: 'req-1',
        duration: 100,
      });

      const result = await paginationHelper.getAllPages('/people');

      expect(result).toEqual({
        data: [],
        totalCount: 0,
        pagesFetched: 1,
        duration: expect.any(Number),
      });
    });

    it('should handle missing meta.total_count', async () => {
      const mockData = [{ id: '1', type: 'person', attributes: { name: 'John Doe' } }];

      mockHttpClient.request.mockResolvedValueOnce({
        data: {
          data: mockData,
          links: {},
        },
        status: 200,
        headers: {},
        requestId: 'req-1',
        duration: 100,
      });

      const result = await paginationHelper.getAllPages('/people');

      expect(result.totalCount).toBe(0);
    });

    it('should break loop on pagination loop detection', async () => {
      const mockData = [{ id: '1', type: 'person', attributes: { name: 'John Doe' } }];
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      mockHttpClient.request.mockResolvedValueOnce({
        data: {
          data: mockData,
          meta: { total_count: 1 },
          links: { next: 'https://api.example.com/people?page=1' }, // Same page!
        },
        status: 200,
        headers: {},
        requestId: 'req-1',
        duration: 100,
      });

      const result = await paginationHelper.getAllPages('/people');

      expect(result.pagesFetched).toBe(1);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Pagination loop detected: next link points to same page 1. Breaking loop.'
      );

      consoleWarnSpy.mockRestore();
    });

    it('should throw error for non-string endpoint', async () => {
      await expect(
        paginationHelper.getAllPages(123 as any)
      ).rejects.toThrow('Expected endpoint to be a string, got number');
    });
  });

  describe('getPage', () => {
    it('should fetch a single page', async () => {
      const mockData = [{ id: '1', type: 'person', attributes: { name: 'John Doe' } }];
      const mockResponse = {
        data: mockData,
        meta: { total_count: 1 },
        links: {},
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'req-1',
        duration: 100,
      });

      const result = await paginationHelper.getPage('/people', 2, 50, { filter: 'active' });

      expect(result).toEqual(mockResponse);
      expect(mockHttpClient.request).toHaveBeenCalledWith({
        method: 'GET',
        endpoint: '/people',
        params: {
          filter: 'active',
          page: 2,
          per_page: 50,
        },
      });
    });

    it('should use default parameters', async () => {
      const mockResponse = { data: [], meta: { total_count: 0 }, links: {} };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'req-1',
        duration: 100,
      });

      await paginationHelper.getPage('/people');

      expect(mockHttpClient.request).toHaveBeenCalledWith({
        method: 'GET',
        endpoint: '/people',
        params: {
          page: 1,
          per_page: 100,
        },
      });
    });
  });

  describe('streamPages', () => {
    it('should yield pages as async generator', async () => {
      const mockData1 = [{ id: '1', type: 'person', attributes: { name: 'John Doe' } }];
      const mockData2 = [{ id: '2', type: 'person', attributes: { name: 'Jane Smith' } }];

      mockHttpClient.request
        .mockResolvedValueOnce({
          data: {
            data: mockData1,
            meta: { total_count: 2 },
            links: { next: 'https://api.example.com/people?page=2' },
          },
          status: 200,
          headers: {},
          requestId: 'req-1',
          duration: 100,
        })
        .mockResolvedValueOnce({
          data: {
            data: mockData2,
            meta: { total_count: 2 },
            links: {},
          },
          status: 200,
          headers: {},
          requestId: 'req-2',
          duration: 100,
        });

      const pages: any[] = [];
      for await (const page of paginationHelper.streamPages('/people', { per_page: 1 })) {
        pages.push(page);
      }

      expect(pages).toEqual([mockData1, mockData2]);
      expect(mockHttpClient.request).toHaveBeenCalledTimes(2);
    });

    it('should handle empty pages', async () => {
      mockHttpClient.request.mockResolvedValueOnce({
        data: {
          data: [],
          meta: { total_count: 0 },
          links: {},
        },
        status: 200,
        headers: {},
        requestId: 'req-1',
        duration: 100,
      });

      const pages: any[] = [];
      for await (const page of paginationHelper.streamPages('/people')) {
        pages.push(page);
      }

      expect(pages).toEqual([[]]);
    });
  });

  describe('getAllPagesParallel', () => {
    it('should fetch pages in parallel with concurrency control', async () => {
      const mockData1 = [{ id: '1', type: 'person', attributes: { name: 'John Doe' } }];
      const mockData2 = [{ id: '2', type: 'person', attributes: { name: 'Jane Smith' } }];
      const mockData3 = [{ id: '3', type: 'person', attributes: { name: 'Bob Johnson' } }];

      // First page (sequential)
      mockHttpClient.request.mockResolvedValueOnce({
        data: {
          data: mockData1,
          meta: { total_count: 3 },
          links: {},
        },
        status: 200,
        headers: {},
        requestId: 'req-1',
        duration: 100,
      });

      // Remaining pages (parallel)
      mockHttpClient.request
        .mockResolvedValueOnce({
          data: {
            data: mockData2,
            meta: { total_count: 3 },
            links: {},
          },
          status: 200,
          headers: {},
          requestId: 'req-2',
          duration: 100,
        })
        .mockResolvedValueOnce({
          data: {
            data: mockData3,
            meta: { total_count: 3 },
            links: {},
          },
          status: 200,
          headers: {},
          requestId: 'req-3',
          duration: 100,
        });

      const result = await paginationHelper.getAllPagesParallel('/people', {}, {
        perPage: 1,
        maxConcurrency: 2,
      });

      expect(result).toEqual({
        data: [...mockData1, ...mockData2, ...mockData3],
        totalCount: 3,
        pagesFetched: 3,
        duration: expect.any(Number),
      });

      expect(mockHttpClient.request).toHaveBeenCalledTimes(3);
    });

    it('should handle single page results', async () => {
      const mockData = [{ id: '1', type: 'person', attributes: { name: 'John Doe' } }];

      mockHttpClient.request.mockResolvedValueOnce({
        data: {
          data: mockData,
          meta: { total_count: 1 },
          links: {},
        },
        status: 200,
        headers: {},
        requestId: 'req-1',
        duration: 100,
      });

      const result = await paginationHelper.getAllPagesParallel('/people', {}, { perPage: 1 });

      expect(result).toEqual({
        data: mockData,
        totalCount: 1,
        pagesFetched: 1,
        duration: expect.any(Number),
      });

      expect(mockHttpClient.request).toHaveBeenCalledTimes(1);
    });

    it('should call onProgress callback for parallel fetching', async () => {
      const mockData = [{ id: '1', type: 'person', attributes: { name: 'John Doe' } }];
      const onProgress = jest.fn();

      mockHttpClient.request
        .mockResolvedValueOnce({
          data: {
            data: mockData,
            meta: { total_count: 2 },
            links: {},
          },
          status: 200,
          headers: {},
          requestId: 'req-1',
          duration: 100,
        })
        .mockResolvedValueOnce({
          data: {
            data: mockData,
            meta: { total_count: 2 },
            links: {},
          },
          status: 200,
          headers: {},
          requestId: 'req-2',
          duration: 100,
        });

      await paginationHelper.getAllPagesParallel('/people', {}, {
        perPage: 1,
        onProgress,
      });

      expect(onProgress).toHaveBeenCalledWith(2, 2);
    });
  });

  describe('Semaphore', () => {
    it('should control concurrency correctly', async () => {
      // This tests the Semaphore class indirectly through getAllPagesParallel
      const mockData = [{ id: '1', type: 'person', attributes: { name: 'John Doe' } }];

      // Mock 5 pages with maxConcurrency of 2
      for (let i = 0; i < 5; i++) {
        mockHttpClient.request.mockResolvedValueOnce({
          data: {
            data: mockData,
            meta: { total_count: 5 },
            links: {},
          },
          status: 200,
          headers: {},
          requestId: `req-${i + 1}`,
          duration: 100,
        });
      }

      const result = await paginationHelper.getAllPagesParallel('/people', {}, {
        perPage: 1,
        maxConcurrency: 2,
      });

      expect(result.pagesFetched).toBe(5);
      expect(mockHttpClient.request).toHaveBeenCalledTimes(5);
    });
  });
});
