import { CheckInGroupsModule } from '../../src/modules/check-in-groups';
import type { PcoHttpClient, PaginationHelper, PcoEventEmitter } from '@rachelallyson/planning-center-base-ts';

describe('CheckInGroupsModule', () => {
  let checkInGroupsModule: CheckInGroupsModule;
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

    checkInGroupsModule = new CheckInGroupsModule(mockHttpClient, mockPaginationHelper, mockEventEmitter);
  });

  describe('constructor', () => {
    it('should create an instance', () => {
      expect(checkInGroupsModule).toBeInstanceOf(CheckInGroupsModule);
    });
  });

  describe('getAll', () => {
    it('should get all check-in groups for a station', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'CheckInGroup', attributes: { name: 'Test Group' } }],
        totalCount: 1,
        pagesFetched: 1,
        duration: 100,
        meta: { total_count: 1 },
        links: {},
      };

      mockPaginationHelper.getAllPages.mockResolvedValueOnce(mockResponse as any);

      const result = await checkInGroupsModule.getAll({ stationId: 'station-123' });

      expect(result).toEqual(mockResponse);
      expect(mockPaginationHelper.getAllPages).toHaveBeenCalledWith('/stations/station-123/check_in_groups', {}, undefined);
    });

    it('should get all check-in groups for a station with filtering options', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'CheckInGroup', attributes: { name: 'Test Group' } }],
        totalCount: 1,
        pagesFetched: 1,
        duration: 50,
        meta: { total_count: 1 },
        links: {},
      };

      mockPaginationHelper.getAllPages.mockResolvedValueOnce(mockResponse as any);

      const options = {
        stationId: 'station-456',
        where: { status: 'active' },
        include: ['check_ins'],
        perPage: 10,
        page: 1,
      };

      const result = await checkInGroupsModule.getAll(options);

      expect(result).toEqual(mockResponse);
      expect(mockPaginationHelper.getAllPages).toHaveBeenCalledWith('/stations/station-456/check_in_groups', {
        'where[status]': 'active',
        include: 'check_ins',
        per_page: 10,
        page: 1,
      }, undefined);
    });
  });

  describe('getById', () => {
    it('should get a check-in group by ID without include', async () => {
      const rawResource = { id: '1', type: 'CheckInGroup', attributes: { name: 'Test Group' } };

      mockHttpClient.request.mockResolvedValueOnce({
        data: { data: rawResource },
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const result = await checkInGroupsModule.getById('1');

      // Base flattens: attributes at top level
      expect(result).toEqual({ id: '1', type: 'CheckInGroup', name: 'Test Group' });
      expect(mockHttpClient.request).toHaveBeenCalledWith(expect.objectContaining({
        method: 'GET',
        endpoint: '/check_in_groups/1',
        params: {},
      }));
    });

    it('should get a check-in group by ID with include', async () => {
      const rawResource = { id: '1', type: 'CheckInGroup', attributes: { name: 'Test Group' } };

      mockHttpClient.request.mockResolvedValueOnce({
        data: { data: rawResource },
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const result = await checkInGroupsModule.getById('1', ['check_ins']);

      // Base flattens: attributes at top level
      expect(result).toEqual({ id: '1', type: 'CheckInGroup', name: 'Test Group' });
      expect(mockHttpClient.request).toHaveBeenCalledWith(expect.objectContaining({
        method: 'GET',
        endpoint: '/check_in_groups/1',
        params: { include: 'check_ins' },
      }));
    });
  });
});
