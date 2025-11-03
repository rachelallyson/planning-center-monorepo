import { ReportsModule } from '../../src/modules/reports';
import type { PcoHttpClient, PaginationHelper, PcoEventEmitter } from '@rachelallyson/planning-center-base-ts';

describe('ReportsModule', () => {
  let module: ReportsModule;
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

    module = new ReportsModule(mockHttpClient, mockPaginationHelper, mockEventEmitter);
  });

  describe('constructor', () => {
    it('should initialize with dependencies', () => {
      expect(module).toBeInstanceOf(ReportsModule);
    });
  });

  describe('getAll', () => {
    it('should fetch all reports with default parameters', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'Report', attributes: { name: 'Report 1' } }],
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

    it('should fetch reports with filtering options', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'Report', attributes: { name: 'Report 1' } }],
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
        include: ['created_by'],
        per_page: 10,
        page: 1,
      };

      await module.getAll(params);

      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('should fetch report by ID without include', async () => {
      const mockResponse = {
        data: { id: '1', type: 'Report', attributes: { name: 'Report 1' } },
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

    it('should fetch report by ID with include', async () => {
      const mockResponse = {
        data: { id: '1', type: 'Report', attributes: { name: 'Report 1' } },
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      await module.getById('1', ['created_by']);

      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create a new report', async () => {
      const mockResponse = {
        data: { id: '1', type: 'Report', attributes: { name: 'New Report' } },
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 201,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const reportData = { name: 'New Report' };
      const result = await module.create(reportData);

      expect(result).toEqual(mockResponse.data);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update an existing report', async () => {
      const mockResponse = {
        data: { id: '1', type: 'Report', attributes: { name: 'Updated Report' } },
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const updateData = { name: 'Updated Report' };
      const result = await module.update('1', updateData);

      expect(result).toEqual(mockResponse.data);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete a report', async () => {
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

  describe('getCreatedBy', () => {
    it('should get creator of a report', async () => {
      const mockResponse = {
        data: { id: '1', type: 'Person', attributes: { first_name: 'John', last_name: 'Doe' } },
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const result = await module.getCreatedBy('report-1');

      expect(result).toEqual(mockResponse.data);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('getUpdatedBy', () => {
    it('should get updater of a report', async () => {
      const mockResponse = {
        data: { id: '1', type: 'Person', attributes: { first_name: 'Jane', last_name: 'Doe' } },
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const result = await module.getUpdatedBy('report-1');

      expect(result).toEqual(mockResponse.data);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('getAllPagesPaginated', () => {
    it('should get all reports with pagination', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'Report', attributes: { name: 'Report 1' } }],
        meta: { total_count: 1 },
        links: {},
      };

      mockPaginationHelper.getAllPages.mockResolvedValueOnce(mockResponse);

      const result = await module.getAllPagesPaginated();

      expect(result).toEqual(mockResponse);
      expect(mockPaginationHelper.getAllPages).toHaveBeenCalledWith('/reports', {}, undefined);
    });

    it('should get all reports with filtering and pagination options', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'Report', attributes: { name: 'Report 1' } }],
        meta: { total_count: 1 },
        links: {},
      };

      mockPaginationHelper.getAllPages.mockResolvedValueOnce(mockResponse);

      const params = {
        where: { status: 'active' },
        include: ['created_by'],
        per_page: 10,
        page: 1,
      };

      const paginationOptions = {
        maxPages: 5,
        onProgress: jest.fn(),
      };

      await module.getAllPagesPaginated(params, paginationOptions);

      expect(mockPaginationHelper.getAllPages).toHaveBeenCalledWith('/reports', {
        'where[status]': 'active',
        include: 'created_by',
        per_page: 10,
      }, paginationOptions);
    });
  });
});
