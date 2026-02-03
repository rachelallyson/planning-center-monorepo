/**
 * Tests for HeadcountsModule
 */

import { HeadcountsModule } from '../../src/modules/headcounts';
import type { PcoHttpClient, PaginationHelper, PcoEventEmitter } from '@rachelallyson/planning-center-base-ts';

describe('HeadcountsModule', () => {
  let module: HeadcountsModule;
  let mockHttpClient: jest.Mocked<PcoHttpClient>;
  let mockPaginationHelper: jest.Mocked<PaginationHelper>;
  let mockEventEmitter: jest.Mocked<PcoEventEmitter>;

  beforeEach(() => {
    mockHttpClient = {
      request: jest.fn(),
    } as any;

    mockPaginationHelper = {
      getAllPages: jest.fn(),
      getPage: jest.fn(),
    } as any;

    mockEventEmitter = {
      emit: jest.fn(),
    } as any;

    module = new HeadcountsModule(mockHttpClient, mockPaginationHelper, mockEventEmitter);
  });

  describe('constructor', () => {
    it('should initialize with dependencies', () => {
      expect(module).toBeInstanceOf(HeadcountsModule);
    });
  });

  describe('getAll', () => {
    it('should fetch all headcounts across all pages with default parameters', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'Headcount', attributes: { total: 100 } }],
        totalCount: 1,
        pagesFetched: 1,
        duration: 100,
        meta: {},
        links: {},
      };

      mockPaginationHelper.getAllPages.mockResolvedValueOnce(mockResponse as any);

      const result = await module.getAll();

      expect(result).toEqual(mockResponse);
      expect(mockPaginationHelper.getAllPages).toHaveBeenCalledWith('/headcounts', {}, undefined);
    });

    it('should fetch headcounts with filtering options', async () => {
      const mockResponse = { data: [], totalCount: 0, pagesFetched: 1, duration: 50, meta: {}, links: {} };
      mockPaginationHelper.getAllPages.mockResolvedValueOnce(mockResponse as any);

      await module.getAll({ where: { total: 100 }, perPage: 50, page: 2 });

      expect(mockPaginationHelper.getAllPages).toHaveBeenCalledWith('/headcounts', {
        'where[total]': 100,
        per_page: 50,
        page: 2,
      }, undefined);
    });

    it('should handle include parameter', async () => {
      const mockResponse = { data: [], totalCount: 0, pagesFetched: 1, duration: 50, meta: {}, links: {} };
      mockPaginationHelper.getAllPages.mockResolvedValueOnce(mockResponse as any);

      await module.getAll({ include: ['event'] });

      expect(mockPaginationHelper.getAllPages).toHaveBeenCalledWith('/headcounts', {
        include: 'event',
      }, undefined);
    });
  });

  describe('getPage', () => {
    it('should fetch a single page of headcounts', async () => {
      mockHttpClient.request.mockResolvedValueOnce({
        data: { data: [{ id: '1', type: 'Headcount', attributes: { total: 100 } }] },
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      } as any);

      await module.getPage({ perPage: 25, page: 1 });

      expect(mockHttpClient.request).toHaveBeenCalledWith(expect.objectContaining({
        endpoint: '/headcounts',
        params: expect.objectContaining({ per_page: 25, page: 1 }),
      }));
    });
  });

  describe('getById', () => {
    it('should fetch a single headcount by ID', async () => {
      const mockResponse = {
        data: { id: '1', type: 'Headcount', attributes: { total: 100 } },
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      await module.getById('1');

      expect(mockHttpClient.request).toHaveBeenCalledWith({
        method: 'GET',
        endpoint: '/headcounts/1',
        params: {},
      });
    });

    it('should fetch headcount with include parameters', async () => {
      mockHttpClient.request.mockResolvedValueOnce({
        data: { data: { id: '1', type: 'Headcount' } },
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      await module.getById('1', ['event']);

      expect(mockHttpClient.request).toHaveBeenCalledWith({
        method: 'GET',
        endpoint: '/headcounts/1',
        params: {
          include: 'event',
        },
      });
    });
  });
});

