import { getPeople, getPerson, createPerson, updatePerson, deletePerson } from '../../src/people/core';
import type { PcoClientState } from '../../src/core';

jest.mock('../../src/core', () => ({
  getList: jest.fn(),
  getSingle: jest.fn(),
  post: jest.fn(),
  patch: jest.fn(),
  del: jest.fn(),
}));
const { getList, getSingle, post, patch, del } = require('../../src/core');

describe('People Core Functions', () => {
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
    (post as jest.Mock).mockReset();
    (patch as jest.Mock).mockReset();
    (del as jest.Mock).mockReset();
  });

  describe('getPeople', () => {
    it('should fetch all people with default parameters', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'Person', attributes: { first_name: 'John', last_name: 'Doe' } }],
        meta: { total_count: 1 },
        links: {},
      };

      (getList as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await getPeople(mockClient);

      expect(result).toEqual(mockResponse);
      expect(getList).toHaveBeenCalled();
    });

    it('should fetch people with filtering parameters', async () => {
      (getList as jest.Mock).mockResolvedValueOnce({ data: [], meta: {}, links: {} });

      const params = {
        where: { status: 'active' },
        include: ['emails', 'phone_numbers'],
        per_page: 10,
        page: 1,
      };

      await getPeople(mockClient, params);

      expect(getList).toHaveBeenCalled();
    });
  });

  describe('getPerson', () => {
    it('should fetch a person by ID without include', async () => {
      const mockResponse = {
        data: { id: '1', type: 'Person', attributes: { first_name: 'John', last_name: 'Doe' } },
      };

      (getSingle as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await getPerson(mockClient, '1');

      expect(result).toEqual(mockResponse);
      expect(getSingle).toHaveBeenCalled();
    });

    it('should fetch a person by ID with include', async () => {
      (getSingle as jest.Mock).mockResolvedValueOnce({ data: { id: '1', type: 'Person' } });

      await getPerson(mockClient, '1', ['emails', 'phone_numbers']);

      expect(getSingle).toHaveBeenCalled();
    });
  });

  describe('createPerson', () => {
    it('should create a new person', async () => {
      const mockResponse = {
        data: { id: '1', type: 'Person', attributes: { first_name: 'Jane', last_name: 'Doe' } },
      };

      (post as jest.Mock).mockResolvedValueOnce(mockResponse);

      const personData = { first_name: 'Jane', last_name: 'Doe' } as any;
      const result = await createPerson(mockClient, personData);

      expect(result).toEqual(mockResponse);
      expect(post).toHaveBeenCalled();
    });
  });

  describe('updatePerson', () => {
    it('should update an existing person', async () => {
      const mockResponse = {
        data: { id: '1', type: 'Person', attributes: { first_name: 'John', last_name: 'Smith' } },
      };

      (patch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const updateData = { last_name: 'Smith' } as any;
      const result = await updatePerson(mockClient, '1', updateData);

      expect(result).toEqual(mockResponse);
      expect(patch).toHaveBeenCalled();
    });
  });

  describe('deletePerson', () => {
    it('should delete a person', async () => {
      (del as jest.Mock).mockResolvedValueOnce(undefined);

      await deletePerson(mockClient, '1');

      expect(del).toHaveBeenCalled();
    });
  });
});
