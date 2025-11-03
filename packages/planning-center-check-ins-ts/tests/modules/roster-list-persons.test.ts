import { RosterListPersonsModule } from '../../src/modules/roster-list-persons';
import type { PcoHttpClient, PaginationHelper, PcoEventEmitter } from '@rachelallyson/planning-center-base-ts';

describe('RosterListPersonsModule', () => {
  let module: RosterListPersonsModule;
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

    module = new RosterListPersonsModule(mockHttpClient, mockPaginationHelper, mockEventEmitter);
  });

  describe('constructor', () => {
    it('should initialize with dependencies', () => {
      expect(module).toBeInstanceOf(RosterListPersonsModule);
    });
  });

  describe('getAll', () => {
    it('should fetch all roster list persons with default parameters', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'RosterListPerson', attributes: { name: 'Person 1' } }],
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

    it('should fetch roster list persons with filtering options', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'RosterListPerson' }],
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
        include: ['person', 'roster_list'],
        perPage: 10,
        page: 1,
      };

      await module.getAll(options);

      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('should fetch roster list person by ID without include', async () => {
      const mockResponse = {
        data: { id: '1', type: 'RosterListPerson', attributes: { name: 'Person 1' } },
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

    it('should fetch roster list person by ID with include', async () => {
      const mockResponse = {
        data: { id: '1', type: 'RosterListPerson', attributes: { name: 'Person 1' } },
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      await module.getById('1', ['person', 'roster_list']);

      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });
});

