import { CheckInTimesModule } from '../../src/modules/check-in-times';
import type { PcoHttpClient, PaginationHelper, PcoEventEmitter } from '@rachelallyson/planning-center-base-ts';

describe('CheckInTimesModule', () => {
  let checkInTimesModule: CheckInTimesModule;
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

    checkInTimesModule = new CheckInTimesModule(mockHttpClient, mockPaginationHelper, mockEventEmitter);
  });

  describe('constructor', () => {
    it('should create an instance', () => {
      expect(checkInTimesModule).toBeInstanceOf(CheckInTimesModule);
    });
  });

  describe('getAll', () => {
    it('should get all check-in times with default parameters', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'CheckInTime', attributes: { time: '2023-01-01T10:00:00Z' } }],
        meta: { total_count: 1 },
        links: {},
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const result = await checkInTimesModule.getAll();

      expect(result).toEqual(mockResponse);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });

    it('should get all check-in times with filtering options', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'CheckInTime', attributes: { time: '2023-01-01T10:00:00Z' } }],
        meta: { total_count: 1 },
        links: {},
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const options = {
        where: { status: 'active' },
        include: ['check_in'],
        perPage: 10,
        page: 1,
      };

      const result = await checkInTimesModule.getAll(options);

      expect(result).toEqual(mockResponse);
      expect(mockHttpClient.request).toHaveBeenCalledWith(expect.objectContaining({
        method: 'GET',
        endpoint: '/check-ins/v2/check_in_times',
        params: {
          'where[status]': 'active',
          include: 'check_in',
          per_page: 10,
          page: 1,
        },
      }));
    });
  });

  describe('getById', () => {
    it('should get a check-in time by ID without include', async () => {
      const mockResponse = { id: '1', type: 'CheckInTime', attributes: { time: '2023-01-01T10:00:00Z' } };

      mockHttpClient.request.mockResolvedValueOnce({
        data: { data: mockResponse },
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const result = await checkInTimesModule.getById('1');

      expect(result).toEqual(mockResponse);
      expect(mockHttpClient.request).toHaveBeenCalledWith(expect.objectContaining({
        method: 'GET',
        endpoint: '/check-ins/v2/check_in_times/1',
        params: {},
      }));
    });

    it('should get a check-in time by ID with include', async () => {
      const mockResponse = { id: '1', type: 'CheckInTime', attributes: { time: '2023-01-01T10:00:00Z' } };

      mockHttpClient.request.mockResolvedValueOnce({
        data: { data: mockResponse },
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const result = await checkInTimesModule.getById('1', ['check_in']);

      expect(result).toEqual(mockResponse);
      expect(mockHttpClient.request).toHaveBeenCalledWith(expect.objectContaining({
        method: 'GET',
        endpoint: '/check-ins/v2/check_in_times/1',
        params: { include: 'check_in' },
      }));
    });
  });
});
