/**
 * Tests for StationsModule
 */

import { StationsModule } from '../../src/modules/stations';
import type { PcoHttpClient, PaginationHelper, PcoEventEmitter } from '@rachelallyson/planning-center-base-ts';

describe('StationsModule', () => {
  let module: StationsModule;
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

    module = new StationsModule(mockHttpClient, mockPaginationHelper, mockEventEmitter);
  });

  describe('constructor', () => {
    it('should initialize with dependencies', () => {
      expect(module).toBeInstanceOf(StationsModule);
    });
  });

  describe('getAll', () => {
    it('should fetch all stations across all pages with default parameters', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'Station', attributes: { name: 'Station 1' } }],
        totalCount: 1,
        pagesFetched: 1,
        duration: 100,
        meta: {},
        links: {},
      };

      mockPaginationHelper.getAllPages.mockResolvedValueOnce(mockResponse as any);

      const result = await module.getAll();

      expect(result).toEqual(mockResponse);
      expect(mockPaginationHelper.getAllPages).toHaveBeenCalledWith('/stations', {}, undefined);
    });

    it('should fetch stations with filtering options', async () => {
      const mockResponse = { data: [], totalCount: 0, pagesFetched: 1, duration: 50, meta: {}, links: {} };
      mockPaginationHelper.getAllPages.mockResolvedValueOnce(mockResponse as any);

      await module.getAll({ where: { name: 'Test' }, perPage: 50, page: 2 });

      expect(mockPaginationHelper.getAllPages).toHaveBeenCalledWith('/stations', {
        'where[name]': 'Test',
        per_page: 50,
        page: 2,
      }, undefined);
    });

    it('should handle include parameter', async () => {
      const mockResponse = { data: [], totalCount: 0, pagesFetched: 1, duration: 50, meta: {}, links: {} };
      mockPaginationHelper.getAllPages.mockResolvedValueOnce(mockResponse as any);

      await module.getAll({ include: ['location'] });

      expect(mockPaginationHelper.getAllPages).toHaveBeenCalledWith('/stations', {
        include: 'location',
      }, undefined);
    });
  });

  describe('getPage', () => {
    it('should fetch a single page of stations', async () => {
      mockHttpClient.request.mockResolvedValueOnce({
        data: { data: [{ id: '1', type: 'Station', attributes: { name: 'Station 1' } }] },
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      } as any);

      await module.getPage({ perPage: 25, page: 1 });

      expect(mockHttpClient.request).toHaveBeenCalledWith(expect.objectContaining({
        endpoint: '/stations',
        params: expect.objectContaining({ per_page: 25, page: 1 }),
      }));
    });
  });

  describe('getById', () => {
    it('should fetch a single station by ID', async () => {
      const mockResponse = {
        data: { id: '1', type: 'Station', attributes: { name: 'Station 1' } },
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
        endpoint: '/stations/1',
        params: {},
      });
    });

    it('should fetch station with include parameters', async () => {
      mockHttpClient.request.mockResolvedValueOnce({
        data: { data: { id: '1', type: 'Station' } },
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      await module.getById('1', ['location']);

      expect(mockHttpClient.request).toHaveBeenCalledWith({
        method: 'GET',
        endpoint: '/stations/1',
        params: {
          include: 'location',
        },
      });
    });
  });
});

