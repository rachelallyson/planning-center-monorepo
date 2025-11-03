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
    it('should fetch all stations with default parameters', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'Station', attributes: { name: 'Station 1' } }],
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

    it('should fetch stations with filtering options', async () => {
      mockHttpClient.request.mockResolvedValueOnce({
        data: { data: [] },
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      await module.getAll({ where: { name: 'Test' }, perPage: 50, page: 2 });

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

      await module.getAll({ include: ['location'] });

      expect(mockHttpClient.request).toHaveBeenCalled();
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
        endpoint: '/check-ins/v2/stations/1',
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
        endpoint: '/check-ins/v2/stations/1',
        params: {
          include: 'location',
        },
      });
    });
  });
});

