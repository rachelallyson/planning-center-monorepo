import { IntegrationLinksModule } from '../../src/modules/integration-links';
import type { PcoHttpClient, PaginationHelper, PcoEventEmitter } from '@rachelallyson/planning-center-base-ts';

describe('IntegrationLinksModule', () => {
  let module: IntegrationLinksModule;
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

    module = new IntegrationLinksModule(mockHttpClient, mockPaginationHelper, mockEventEmitter);
  });

  describe('constructor', () => {
    it('should initialize with dependencies', () => {
      expect(module).toBeInstanceOf(IntegrationLinksModule);
    });
  });

  describe('getAll', () => {
    it('should fetch all integration links with default parameters', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'IntegrationLink', attributes: { name: 'Link 1' } }],
        totalCount: 1,
        pagesFetched: 1,
        duration: 100,
      };

      mockPaginationHelper.getAllPages.mockResolvedValueOnce(mockResponse as any);

      const result = await module.getAll();

      expect(result.data).toHaveLength(1);
      expect(mockPaginationHelper.getAllPages).toHaveBeenCalledWith('/integration_links', {}, undefined);
    });

    it('should fetch integration links with filtering options', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'IntegrationLink' }],
        totalCount: 1,
        pagesFetched: 1,
        duration: 50,
      };

      mockPaginationHelper.getAllPages.mockResolvedValueOnce(mockResponse as any);

      const options = {
        where: { status: 'active' },
        include: ['event'],
        perPage: 10,
        page: 1,
      };

      const result = await module.getAll(options);

      expect(result.data).toHaveLength(1);
      expect(mockPaginationHelper.getAllPages).toHaveBeenCalledWith('/integration_links', expect.objectContaining({
        'where[status]': 'active',
        include: 'event',
        per_page: 10,
        page: 1,
      }), undefined);
    });
  });

  describe('getById', () => {
    it('should fetch integration link by ID without include', async () => {
      const mockResponse = {
        data: { id: '1', type: 'IntegrationLink', attributes: { name: 'Link 1' } },
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

    it('should fetch integration link by ID with include', async () => {
      const mockResponse = {
        data: { id: '1', type: 'IntegrationLink', attributes: { name: 'Link 1' } },
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

