import { ListsModule } from '../../src/modules/lists';
import type { PcoHttpClient, PaginationHelper, PcoEventEmitter } from '@rachelallyson/planning-center-base-ts';

describe('ListsModule', () => {
  let module: ListsModule;
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

    module = new ListsModule(mockHttpClient, mockPaginationHelper, mockEventEmitter);
  });

  describe('constructor', () => {
    it('should initialize with dependencies', () => {
      expect(module).toBeInstanceOf(ListsModule);
    });
  });

  describe('getAll', () => {
    it('should fetch all lists with default parameters', async () => {
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

      const result = await module.getAll();

      expect(result).toEqual(mockResponse);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });

    it('should fetch lists with filtering options', async () => {
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

      const options = {
        where: { status: 'active' },
        include: ['list_category'],
        perPage: 10,
        page: 1,
      };

      await module.getAll(options);

      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('getAllPagesPaginated', () => {
    it('should get all lists with pagination', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'List', attributes: { name: 'List 1' } }],
        meta: { total_count: 1 },
        links: {},
      };

      mockPaginationHelper.getAllPages.mockResolvedValueOnce(mockResponse);

      const result = await module.getAllPagesPaginated();

      expect(result).toEqual(mockResponse);
      expect(mockPaginationHelper.getAllPages).toHaveBeenCalledWith('/lists', {}, undefined);
    });

    it('should get all lists with filtering and pagination options', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'List', attributes: { name: 'List 1' } }],
        meta: { total_count: 1 },
        links: {},
      };

      mockPaginationHelper.getAllPages.mockResolvedValueOnce(mockResponse);

      const options = {
        where: { status: 'active' },
        include: ['list_category'],
        perPage: 10,
        page: 1,
      };

      const paginationOptions = {
        maxPages: 5,
        onProgress: jest.fn(),
      };

      await module.getAllPagesPaginated(options, paginationOptions);

      expect(mockPaginationHelper.getAllPages).toHaveBeenCalledWith('/lists', {
        'where[status]': 'active',
        include: 'list_category',
      }, paginationOptions);
    });
  });

  describe('getById', () => {
    it('should fetch list by ID without include', async () => {
      const mockResponse = {
        data: { id: '1', type: 'List', attributes: { name: 'List 1' } },
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

    it('should fetch list by ID with include', async () => {
      const mockResponse = {
        data: { id: '1', type: 'List', attributes: { name: 'List 1' } },
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      await module.getById('1', ['list_category']);

      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('getListCategories', () => {
    it('should get all list categories', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'ListCategory', attributes: { name: 'Category 1' } }],
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

      const result = await module.getListCategories();

      expect(result).toEqual(mockResponse);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('getListCategoryById', () => {
    it('should get list category by ID', async () => {
      const mockResponse = {
        data: { id: '1', type: 'ListCategory', attributes: { name: 'Category 1' } },
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const result = await module.getListCategoryById('1');

      expect(result).toEqual(mockResponse.data);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('createListCategory', () => {
    it('should create a new list category', async () => {
      const mockResponse = {
        data: { id: '1', type: 'ListCategory', attributes: { name: 'New Category' } },
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 201,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const categoryData = { name: 'New Category' };
      const result = await module.createListCategory(categoryData);

      expect(result).toEqual(mockResponse.data);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('updateListCategory', () => {
    it('should update an existing list category', async () => {
      const mockResponse = {
        data: { id: '1', type: 'ListCategory', attributes: { name: 'Updated Category' } },
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const updateData = { name: 'Updated Category' };
      const result = await module.updateListCategory('1', updateData);

      expect(result).toEqual(mockResponse.data);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('deleteListCategory', () => {
    it('should delete a list category', async () => {
      mockHttpClient.request.mockResolvedValueOnce({
        data: null,
        status: 204,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      await module.deleteListCategory('1');

      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('getPeople', () => {
    it('should get people for a list', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'Person', attributes: { name: 'Person 1' } }],
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

      const result = await module.getPeople('list-1');

      expect(result).toEqual(mockResponse);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });
});
