import { PersonEventsModule } from '../../src/modules/person-events';
import type { PcoHttpClient, PaginationHelper, PcoEventEmitter } from '@rachelallyson/planning-center-base-ts';

describe('PersonEventsModule', () => {
  let module: PersonEventsModule;
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

    module = new PersonEventsModule(mockHttpClient, mockPaginationHelper, mockEventEmitter);
  });

  describe('constructor', () => {
    it('should initialize with dependencies', () => {
      expect(module).toBeInstanceOf(PersonEventsModule);
    });
  });

  describe('getAll', () => {
    it('should fetch all person events with default parameters', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'PersonEvent', attributes: { name: 'Event 1' } }],
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

    it('should fetch person events with filtering options', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'PersonEvent' }],
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
        include: ['person', 'event'],
        perPage: 10,
        page: 1,
      };

      await module.getAll(options);

      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('should fetch person event by ID without include', async () => {
      const mockResponse = {
        data: { id: '1', type: 'PersonEvent', attributes: { name: 'Event 1' } },
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

    it('should fetch person event by ID with include', async () => {
      const mockResponse = {
        data: { id: '1', type: 'PersonEvent', attributes: { name: 'Event 1' } },
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      await module.getById('1', ['person', 'event']);

      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });
});

