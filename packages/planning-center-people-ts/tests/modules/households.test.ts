import { HouseholdsModule } from '../../src/modules/households';
import type { PcoHttpClient, PaginationHelper, PcoEventEmitter } from '@rachelallyson/planning-center-base-ts';

describe('HouseholdsModule', () => {
  let module: HouseholdsModule;
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

    module = new HouseholdsModule(mockHttpClient, mockPaginationHelper, mockEventEmitter);
  });

  describe('constructor', () => {
    it('should initialize with dependencies', () => {
      expect(module).toBeInstanceOf(HouseholdsModule);
    });
  });

  describe('getAll', () => {
    it('should fetch all households with default parameters', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'Household', attributes: { name: 'Household 1' } }],
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

    it('should fetch households with filtering options', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'Household', attributes: { name: 'Household 1' } }],
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
        include: ['people'],
        perPage: 10,
        page: 1,
      };

      await module.getAll(options);

      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('getAllPagesPaginated', () => {
    it('should get all households with pagination', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'Household', attributes: { name: 'Household 1' } }],
        meta: { total_count: 1 },
        links: {},
      };

      mockPaginationHelper.getAllPages.mockResolvedValueOnce(mockResponse);

      const result = await module.getAllPagesPaginated();

      expect(result).toEqual(mockResponse);
      expect(mockPaginationHelper.getAllPages).toHaveBeenCalledWith('/households', {}, undefined);
    });

    it('should get all households with filtering and pagination options', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'Household', attributes: { name: 'Household 1' } }],
        meta: { total_count: 1 },
        links: {},
      };

      mockPaginationHelper.getAllPages.mockResolvedValueOnce(mockResponse);

      const options = {
        where: { status: 'active' },
        include: ['people'],
        perPage: 10,
        page: 1,
      };

      const paginationOptions = {
        maxPages: 5,
        onProgress: jest.fn(),
      };

      await module.getAllPagesPaginated(options, paginationOptions);

      expect(mockPaginationHelper.getAllPages).toHaveBeenCalledWith('/households', {
        'where[status]': 'active',
        include: 'people',
      }, paginationOptions);
    });
  });

  describe('getById', () => {
    it('should fetch household by ID without include', async () => {
      const mockResponse = {
        data: { id: '1', type: 'Household', attributes: { name: 'Household 1' } },
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

    it('should fetch household by ID with include', async () => {
      const mockResponse = {
        data: { id: '1', type: 'Household', attributes: { name: 'Household 1' } },
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      await module.getById('1', ['people']);

      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create a new household', async () => {
      const mockResponse = {
        data: { id: '1', type: 'Household', attributes: { name: 'New Household' } },
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 201,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const householdData = { name: 'New Household' };
      const result = await module.create(householdData);

      expect(result).toEqual(mockResponse.data);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update an existing household', async () => {
      const mockResponse = {
        data: { id: '1', type: 'Household', attributes: { name: 'Updated Household' } },
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const updateData = { name: 'Updated Household' };
      const result = await module.update('1', updateData);

      expect(result).toEqual(mockResponse.data);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete a household', async () => {
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
});
