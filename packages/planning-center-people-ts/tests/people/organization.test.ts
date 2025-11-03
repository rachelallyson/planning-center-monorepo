import { getOrganization } from '../../src/people/organization';
import type { PcoClientState } from '../../src/core';

jest.mock('../../src/core', () => {
  return {
    getSingle: jest.fn(),
  };
});

const { getSingle } = require('../../src/core');

describe('Organization Functions', () => {
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

    (getSingle as jest.Mock).mockReset();
  });

  describe('getOrganization', () => {
    it('should fetch organization information with default parameters', async () => {
      const mockResponse = {
        data: { id: '1', type: 'Organization', attributes: { name: 'Test Organization' } },
      };

      (getSingle as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await getOrganization(mockClient);

      expect(result).toEqual(mockResponse);
      expect(getSingle).toHaveBeenCalled();
    });

    it('should fetch organization information with parameters', async () => {
      const mockResponse = {
        data: { id: '1', type: 'Organization', attributes: { name: 'Test Organization' } },
      };

      (getSingle as jest.Mock).mockResolvedValueOnce(mockResponse);

      const params = {
        where: { status: 'active' },
        include: ['campuses'],
        per_page: 10,
        page: 1,
      } as any;

      await getOrganization(mockClient, params);

      expect(getSingle).toHaveBeenCalled();
    });
  });
});
