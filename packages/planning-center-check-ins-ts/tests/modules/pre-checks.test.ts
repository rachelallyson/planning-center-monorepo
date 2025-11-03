import { PreChecksModule } from '../../src/modules/pre-checks';
import type { PcoHttpClient, PaginationHelper, PcoEventEmitter } from '@rachelallyson/planning-center-base-ts';

describe('PreChecksModule', () => {
  let module: PreChecksModule;
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

    module = new PreChecksModule(mockHttpClient, mockPaginationHelper, mockEventEmitter);
  });

  describe('constructor', () => {
    it('should initialize with dependencies', () => {
      expect(module).toBeInstanceOf(PreChecksModule);
    });
  });

  describe('getAll', () => {
    it('should fetch all pre-checks with default parameters', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'PreCheck', attributes: { name: 'Check 1' } }],
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      await module.getAll();

      expect(mockHttpClient.request).toHaveBeenCalled();
    });

    it('should fetch pre-checks with filtering options', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'PreCheck' }],
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
        include: ['event'],
        perPage: 10,
        page: 1,
      };

      await module.getAll(options);

      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('should fetch pre-check by ID without include', async () => {
      const mockResponse = {
        data: { id: '1', type: 'PreCheck', attributes: { name: 'Check 1' } },
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      await module.getById('1');

      expect(mockHttpClient.request).toHaveBeenCalled();
    });

    it('should fetch pre-check by ID with include', async () => {
      const mockResponse = {
        data: { id: '1', type: 'PreCheck', attributes: { name: 'Check 1' } },
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      await module.getById('1', ['event']);

      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });
});

