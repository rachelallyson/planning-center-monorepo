import { ServiceTimeModule } from '../../src/modules/service-time';
import type { PcoHttpClient, PaginationHelper, PcoEventEmitter } from '@rachelallyson/planning-center-base-ts';

describe('ServiceTimeModule', () => {
  let module: ServiceTimeModule;
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

    module = new ServiceTimeModule(mockHttpClient, mockPaginationHelper, mockEventEmitter);
  });

  describe('constructor', () => {
    it('should initialize with dependencies', () => {
      expect(module).toBeInstanceOf(ServiceTimeModule);
    });
  });

  describe('getAll', () => {
    it('should fetch all service times for a campus with default parameters', async () => {
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

      const result = await module.getAll('campus-1');

      expect(result).toEqual(mockResponse);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });

    it('should fetch service times for a campus with filtering options', async () => {
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

      const params = {
        where: { status: 'active' },
        include: ['campus'],
        per_page: 10,
        page: 1,
      };

      await module.getAll('campus-1', params);

      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('should fetch service time by ID without include', async () => {
      const mockResponse = {
        data: { id: '1', type: 'ServiceTime', attributes: { name: 'Service 1' } },
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const result = await module.getById('campus-1', '1');

      expect(result).toEqual(mockResponse.data);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });

    it('should fetch service time by ID with include', async () => {
      const mockResponse = {
        data: { id: '1', type: 'ServiceTime', attributes: { name: 'Service 1' } },
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      await module.getById('campus-1', '1', ['campus']);

      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create a new service time for a campus', async () => {
      const mockResponse = {
        data: { id: '1', type: 'ServiceTime', attributes: { name: 'New Service' } },
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 201,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const serviceTimeData = { name: 'New Service' };
      const result = await module.create('campus-1', serviceTimeData);

      expect(result).toEqual(mockResponse.data);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update an existing service time for a campus', async () => {
      const mockResponse = {
        data: { id: '1', type: 'ServiceTime', attributes: { name: 'Updated Service' } },
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const updateData = { name: 'Updated Service' };
      const result = await module.update('campus-1', '1', updateData);

      expect(result).toEqual(mockResponse.data);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete a service time for a campus', async () => {
      mockHttpClient.request.mockResolvedValueOnce({
        data: null,
        status: 204,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      await module.delete('campus-1', '1');

      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('getAllPagesPaginated', () => {
    it('should get all service times for a campus with pagination', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'ServiceTime', attributes: { name: 'Service 1' } }],
        meta: { total_count: 1 },
        links: {},
      };

      mockPaginationHelper.getAllPages.mockResolvedValueOnce(mockResponse);

      const result = await module.getAllPagesPaginated('campus-1');

      expect(result).toEqual(mockResponse);
      expect(mockPaginationHelper.getAllPages).toHaveBeenCalledWith('/campuses/campus-1/service_times', {}, undefined);
    });

    it('should get all service times for a campus with filtering and pagination options', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'ServiceTime', attributes: { name: 'Service 1' } }],
        meta: { total_count: 1 },
        links: {},
      };

      mockPaginationHelper.getAllPages.mockResolvedValueOnce(mockResponse);

      const params = {
        where: { status: 'active' },
        include: ['campus'],
        per_page: 10,
        page: 1,
      };

      const paginationOptions = {
        maxPages: 5,
        onProgress: jest.fn(),
      };

      await module.getAllPagesPaginated('campus-1', params, paginationOptions);

      expect(mockPaginationHelper.getAllPages).toHaveBeenCalledWith('/campuses/campus-1/service_times', {
        'where[status]': 'active',
        include: 'campus',
        per_page: 10,
      }, paginationOptions);
    });
  });
});
