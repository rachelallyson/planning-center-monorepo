/**
 * Tests for AttendanceTypesModule
 */

import { AttendanceTypesModule } from '../../src/modules/attendance-types';
import type { PcoHttpClient, PaginationHelper, PcoEventEmitter } from '@rachelallyson/planning-center-base-ts';

describe('AttendanceTypesModule', () => {
  let module: AttendanceTypesModule;
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

    module = new AttendanceTypesModule(mockHttpClient, mockPaginationHelper, mockEventEmitter);
  });

  describe('constructor', () => {
    it('should initialize with dependencies', () => {
      expect(module).toBeInstanceOf(AttendanceTypesModule);
    });
  });

  describe('getAll', () => {
    it('should fetch all attendance types with default parameters', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'AttendanceType', attributes: { name: 'Type 1' } }],
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

    it('should fetch attendance types with filtering options', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'AttendanceType' }],
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
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

      await module.getAll({ include: ['event', 'location'] });

      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('should fetch a single attendance type by ID', async () => {
      const mockResponse = {
        data: { id: '1', type: 'AttendanceType', attributes: { name: 'Type 1' } },
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
        endpoint: '/check-ins/v2/attendance_types/1',
        params: {},
      });
    });

    it('should fetch attendance type with include parameters', async () => {
      mockHttpClient.request.mockResolvedValueOnce({
        data: { data: { id: '1', type: 'AttendanceType' } },
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      await module.getById('1', ['event']);

      expect(mockHttpClient.request).toHaveBeenCalledWith({
        method: 'GET',
        endpoint: '/check-ins/v2/attendance_types/1',
        params: {
          include: 'event',
        },
      });
    });
  });
});

