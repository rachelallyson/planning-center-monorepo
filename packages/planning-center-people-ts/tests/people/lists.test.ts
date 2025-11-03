import { getLists, getListById, getListCategories } from '../../src/people/lists';
import type { PcoClientState } from '../../src/core';

jest.mock('../../src/core', () => ({
  getList: jest.fn(),
  getSingle: jest.fn(),
}));
const { getList, getSingle } = require('../../src/core');

describe('Lists Functions', () => {
  let mockClient: jest.Mocked<PcoClientState>;

  beforeEach(() => {
    mockClient = {
      config: {
        retry: {
          maxRetries: 3,
          baseDelay: 1000,
          maxDelay: 30000,
        },
      } as any,
      httpClient: {
        request: jest.fn(),
      } as any,
      paginationHelper: {
        getAllPages: jest.fn(),
        getPage: jest.fn(),
      } as any,
      eventEmitter: {
        emit: jest.fn(),
      } as any,
      rateLimiter: {
        waitForSlot: jest.fn().mockResolvedValue(undefined),
        waitForAvailability: jest.fn().mockResolvedValue(undefined),
      } as any,
    } as any;

    (getList as jest.Mock).mockReset();
    (getSingle as jest.Mock).mockReset();
  });

  describe('getLists', () => {
    it('should fetch all lists with default parameters', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'List', attributes: { name: 'List 1' } }],
        meta: { total_count: 1 },
        links: {},
      };

      (getList as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await getLists(mockClient);

      expect(result).toEqual(mockResponse);
      expect(getList).toHaveBeenCalled();
    });

    it('should fetch lists with parameters', async () => {
      (getList as jest.Mock).mockResolvedValueOnce({ data: [], meta: {}, links: {} });

      const params = {
        where: { status: 'active' },
        include: ['list_category'],
        per_page: 10,
        page: 1,
      };

      await getLists(mockClient, params);

      expect(getList).toHaveBeenCalled();
    });
  });

  describe('getListById', () => {
    it('should fetch a list by ID with default parameters', async () => {
      const mockResponse = {
        data: { id: '1', type: 'List', attributes: { name: 'List 1' } },
      };

      (getSingle as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await getListById(mockClient, '1');

      expect(result).toEqual(mockResponse);
      expect(getSingle).toHaveBeenCalled();
    });

    it('should fetch a list by ID with parameters', async () => {
      (getSingle as jest.Mock).mockResolvedValueOnce({ data: { id: '1', type: 'List' } });

      const params = {
        where: { status: 'active' },
        include: ['list_category'],
        per_page: 10,
        page: 1,
      };

      await getListById(mockClient, '1', params);

      expect(getSingle).toHaveBeenCalled();
    });
  });

  describe('getListCategories', () => {
    it('should fetch all list categories', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'ListCategory', attributes: { name: 'Category 1' } }],
        meta: { total_count: 1 },
        links: {},
      };

      (getList as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await getListCategories(mockClient);

      expect(result).toEqual(mockResponse);
      expect(getList).toHaveBeenCalled();
    });
  });
});
