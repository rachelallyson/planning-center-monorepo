/**
 * Tests for OptionsModule
 */

import { OptionsModule } from '../../src/modules/options';
import type { PcoHttpClient, PaginationHelper, PcoEventEmitter } from '@rachelallyson/planning-center-base-ts';

describe('OptionsModule', () => {
  let module: OptionsModule;
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

    module = new OptionsModule(mockHttpClient, mockPaginationHelper, mockEventEmitter);
  });

  describe('constructor', () => {
    it('should initialize with dependencies', () => {
      expect(module).toBeInstanceOf(OptionsModule);
    });
  });

  describe('getAll', () => {
    it('should fetch all options with default parameters', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'Option', attributes: { name: 'Option 1' } }],
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

    it('should fetch options with filtering options', async () => {
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

      await module.getAll({ include: ['event'] });

      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('should fetch a single option by ID', async () => {
      const mockResponse = {
        data: { id: '1', type: 'Option', attributes: { name: 'Option 1' } },
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
        endpoint: '/check-ins/v2/options/1',
        params: {},
      });
    });

    it('should fetch option with include parameters', async () => {
      mockHttpClient.request.mockResolvedValueOnce({
        data: { data: { id: '1', type: 'Option' } },
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      await module.getById('1', ['event']);

      expect(mockHttpClient.request).toHaveBeenCalledWith({
        method: 'GET',
        endpoint: '/check-ins/v2/options/1',
        params: {
          include: 'event',
        },
      });
    });
  });
});

