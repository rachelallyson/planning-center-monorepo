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
    it('should fetch all headcounts with default parameters', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'Headcount', attributes: { total: 100 } }],
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      await module.getAll();

      expect(mockHttpClient.request).toHaveBeenCalled();
    });

    it('should fetch headcounts with filtering options', async () => {
      mockHttpClient.request.mockResolvedValueOnce({
        data: { data: [] },
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      await module.getAll({ where: { total: 100 }, perPage: 50, page: 2 });

      expect(mockHttpClient.request).toHaveBeenCalled();
    });

    it('should handle include parameter', async () => {
      mockHttpClient.request.mockResolvedValueOnce({
        data: { data: [] },
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      await module.getAll({ include: ['event'] });

      expect(mockHttpClient.request).toHaveBeenCalled();
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
        endpoint: '/check-ins/v2/headcounts/1',
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
        endpoint: '/check-ins/v2/headcounts/1',
        params: {
          include: 'event',
        },
      });
    });
  });
});

