import { CampusModule } from '../../src/modules/campus';
import type { PcoHttpClient, PaginationHelper, PcoEventEmitter } from '@rachelallyson/planning-center-base-ts';

describe('CampusModule', () => {
  let module: CampusModule;
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

    module = new CampusModule(mockHttpClient, mockPaginationHelper, mockEventEmitter);
  });

  describe('constructor', () => {
    it('should initialize with dependencies', () => {
      expect(module).toBeInstanceOf(CampusModule);
    });
  });

  describe('getAll', () => {
    it('should fetch all campuses with default parameters', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'Campus', attributes: { name: 'Campus 1' } }],
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

      const result = await module.getAll();

      expect(result).toEqual(mockResponse);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });

    it('should fetch campuses with filtering options', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'Campus', attributes: { name: 'Campus 1' } }],
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

      const params = {
        where: { status: 'active' },
        include: ['lists'],
        per_page: 10,
        page: 1,
      };

      await module.getAll(params);

      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('should fetch campus by ID without include', async () => {
      const mockResponse = {
        data: { id: '1', type: 'Campus', attributes: { name: 'Campus 1' } },
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const result = await module.getById('1');

      expect(result).toEqual(mockResponse.data);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });

    it('should fetch campus by ID with include', async () => {
      const mockResponse = {
        data: { id: '1', type: 'Campus', attributes: { name: 'Campus 1' } },
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      await module.getById('1', ['lists']);

      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create a new campus', async () => {
      const mockResponse = {
        data: { id: '1', type: 'Campus', attributes: { name: 'New Campus' } },
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 201,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const campusData = { name: 'New Campus' };
      const result = await module.create(campusData);

      expect(result).toEqual(mockResponse.data);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update an existing campus', async () => {
      const mockResponse = {
        data: { id: '1', type: 'Campus', attributes: { name: 'Updated Campus' } },
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const updateData = { name: 'Updated Campus' };
      const result = await module.update('1', updateData);

      expect(result).toEqual(mockResponse.data);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete a campus', async () => {
      mockHttpClient.request.mockResolvedValueOnce({
        data: null,
        status: 204,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      await module.delete('1');

      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('getLists', () => {
    it('should get lists for a campus', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'List', attributes: { name: 'List 1' } }],
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

      const result = await module.getLists('campus-1');

      expect(result).toEqual(mockResponse);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('getServiceTimes', () => {
    it('should get service times for a campus', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'ServiceTime', attributes: { name: 'Service 1' } }],
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

      const result = await module.getServiceTimes('campus-1');

      expect(result).toEqual(mockResponse);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('getAllCampuses', () => {
    it('should get all campuses with pagination', async () => {
      const mockResponse = {
        data: [
          { id: '1', type: 'Campus', attributes: { name: 'Campus 1' } },
          { id: '2', type: 'Campus', attributes: { name: 'Campus 2' } },
        ],
      };

      mockPaginationHelper.getAllPages.mockResolvedValueOnce(mockResponse);

      const result = await module.getAllCampuses();

      expect(result).toEqual(mockResponse.data);
      expect(mockPaginationHelper.getAllPages).toHaveBeenCalledWith('/campuses', {}, undefined);
    });

    it('should get all campuses with filtering', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'Campus', attributes: { name: 'Campus 1' } }],
      };

      mockPaginationHelper.getAllPages.mockResolvedValueOnce(mockResponse);

      const params = {
        where: { status: 'active' },
        include: ['lists'],
        per_page: 10,
      };

      await module.getAllCampuses(params);

      expect(mockPaginationHelper.getAllPages).toHaveBeenCalledWith('/campuses', {
        'where[status]': 'active',
        include: 'lists',
        per_page: 10,
      }, undefined);
    });
  });

  describe('getAllPagesPaginated', () => {
    it('should get all campuses with pagination options', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'Campus', attributes: { name: 'Campus 1' } }],
        meta: { total_count: 1 },
        links: {},
      };

      mockPaginationHelper.getAllPages.mockResolvedValueOnce(mockResponse);

      const params = {
        where: { status: 'active' },
        include: ['lists'],
        per_page: 10,
      };

      const paginationOptions = {
        maxPages: 5,
        onProgress: jest.fn(),
      };

      const result = await module.getAllPagesPaginated(params, paginationOptions);

      expect(result).toEqual(mockResponse);
      expect(mockPaginationHelper.getAllPages).toHaveBeenCalledWith('/campuses', {
        'where[status]': 'active',
        include: 'lists',
        per_page: 10,
      }, paginationOptions);
    });
  });
});
