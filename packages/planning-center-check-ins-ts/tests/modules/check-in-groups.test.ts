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
    it('should get all check-in groups with default parameters', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'CheckInGroup', attributes: { name: 'Test Group' } }],
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

      const result = await checkInGroupsModule.getAll();

      expect(result).toEqual(mockResponse);
      expect(mockHttpClient.request).toHaveBeenCalledWith(expect.objectContaining({
        method: 'GET',
        endpoint: '/check-ins/v2/check_in_groups',
        params: {},
      }));
    });

    it('should get all check-in groups with filtering options', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'CheckInGroup', attributes: { name: 'Test Group' } }],
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
        include: ['check_ins'],
        perPage: 10,
        page: 1,
      };

      const result = await checkInGroupsModule.getAll(options);

      expect(result).toEqual(mockResponse);
      expect(mockHttpClient.request).toHaveBeenCalledWith(expect.objectContaining({
        method: 'GET',
        endpoint: '/check-ins/v2/check_in_groups',
        params: {
          'where[status]': 'active',
          include: 'check_ins',
          per_page: 10,
          page: 1,
        },
      }));
    });
  });

  describe('getById', () => {
    it('should get a check-in group by ID without include', async () => {
      const mockResponse = { id: '1', type: 'CheckInGroup', attributes: { name: 'Test Group' } };

      mockHttpClient.request.mockResolvedValueOnce({
        data: { data: mockResponse },
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const result = await checkInGroupsModule.getById('1');

      expect(result).toEqual(mockResponse);
      expect(mockHttpClient.request).toHaveBeenCalledWith(expect.objectContaining({
        method: 'GET',
        endpoint: '/check-ins/v2/check_in_groups/1',
        params: {},
      }));
    });

    it('should get a check-in group by ID with include', async () => {
      const mockResponse = { id: '1', type: 'CheckInGroup', attributes: { name: 'Test Group' } };

      mockHttpClient.request.mockResolvedValueOnce({
        data: { data: mockResponse },
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const result = await checkInGroupsModule.getById('1', ['check_ins']);

      expect(result).toEqual(mockResponse);
      expect(mockHttpClient.request).toHaveBeenCalledWith(expect.objectContaining({
        method: 'GET',
        endpoint: '/check-ins/v2/check_in_groups/1',
        params: { include: 'check_ins' },
      }));
    });
  });
});
