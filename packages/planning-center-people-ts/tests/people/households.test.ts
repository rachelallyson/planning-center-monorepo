import { getHouseholds, getHousehold } from '../../src/people/households';
import type { PcoClientState } from '../../src/core';

jest.mock('../../src/core', () => ({
  getList: jest.fn(),
  getSingle: jest.fn(),
}));
const { getList, getSingle } = require('../../src/core');

describe('Households Functions', () => {
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

  describe('getHouseholds', () => {
    it('should fetch all households with default parameters', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'Household', attributes: { name: 'Household 1' } }],
        meta: { total_count: 1 },
        links: {},
      };

      (getList as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await getHouseholds(mockClient);

      expect(result).toEqual(mockResponse);
      expect(getList).toHaveBeenCalled();
    });

    it('should fetch households with parameters', async () => {
      (getList as jest.Mock).mockResolvedValueOnce({ data: [], meta: {}, links: {} });

      const params = {
        include: ['people'],
        per_page: 10,
        page: 1,
      };

      await getHouseholds(mockClient, params);

      expect(getList).toHaveBeenCalled();
    });
  });

  describe('getHousehold', () => {
    it('should fetch a household by ID without include', async () => {
      const mockResponse = {
        data: { id: '1', type: 'Household', attributes: { name: 'Household 1' } },
      };

      (getSingle as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await getHousehold(mockClient, '1');

      expect(result).toEqual(mockResponse);
      expect(getSingle).toHaveBeenCalled();
    });

    it('should fetch a household by ID with include', async () => {
      (getSingle as jest.Mock).mockResolvedValueOnce({ data: { id: '1', type: 'Household' } });

      await getHousehold(mockClient, '1', ['people']);

      expect(getSingle).toHaveBeenCalled();
    });
  });
});
