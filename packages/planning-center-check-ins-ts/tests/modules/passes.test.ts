import { PassesModule } from '../../src/modules/passes';
import type { PcoHttpClient, PaginationHelper, PcoEventEmitter } from '@rachelallyson/planning-center-base-ts';

describe('PassesModule', () => {
  let passesModule: PassesModule;
  let mockHttpClient: jest.Mocked<PcoHttpClient>;
  let mockPaginationHelper: jest.Mocked<PaginationHelper>;
  let mockEventEmitter: jest.Mocked<PcoEventEmitter>;

  beforeEach(() => {
    mockHttpClient = { request: jest.fn() } as any;
    mockPaginationHelper = { getAllPages: jest.fn() } as any;
    mockEventEmitter = { emit: jest.fn() } as any;

    passesModule = new PassesModule(mockHttpClient, mockPaginationHelper, mockEventEmitter);
  });

  describe('constructor', () => {
    it('should create an instance', () => {
      expect(passesModule).toBeInstanceOf(PassesModule);
    });
  });

  describe('getAll', () => {
    it('should get all passes with default parameters', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'Pass', attributes: { name: 'Test Pass' } }],
        totalCount: 1,
        pagesFetched: 1,
        duration: 100,
        meta: { total_count: 1 },
        links: {},
      };

      mockPaginationHelper.getAllPages.mockResolvedValueOnce(mockResponse as any);

      const result = await passesModule.getAll();

      expect(result).toEqual(mockResponse);
      expect(mockPaginationHelper.getAllPages).toHaveBeenCalledWith('/passes', {}, undefined);
    });

    it('should get all passes with filtering options', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'Pass', attributes: { name: 'Test Pass' } }],
        totalCount: 1,
        pagesFetched: 1,
        duration: 50,
        meta: { total_count: 1 },
        links: {},
      };

      mockPaginationHelper.getAllPages.mockResolvedValueOnce(mockResponse as any);

      const options = {
        where: { status: 'active' },
        include: ['pass_events'],
        perPage: 10,
        page: 1,
      };

      const result = await passesModule.getAll(options);

      expect(result).toEqual(mockResponse);
      expect(mockPaginationHelper.getAllPages).toHaveBeenCalledWith('/passes', {
        'where[status]': 'active',
        include: 'pass_events',
        per_page: 10,
        page: 1,
      }, undefined);
    });
  });

  describe('getById', () => {
    it('should get a pass by ID without include', async () => {
      const mockResponse = { id: '1', type: 'Pass', attributes: { name: 'Test Pass' } };

      (passesModule as any).getSingle = jest.fn().mockResolvedValue(mockResponse);

      const result = await passesModule.getById('1');

      expect(result).toEqual(mockResponse);
      expect((passesModule as any).getSingle).toHaveBeenCalledWith('/passes/1', {});
    });

    it('should get a pass by ID with include', async () => {
      const mockResponse = { id: '1', type: 'Pass', attributes: { name: 'Test Pass' } };

      (passesModule as any).getSingle = jest.fn().mockResolvedValue(mockResponse);

      const result = await passesModule.getById('1', ['pass_events']);

      expect(result).toEqual(mockResponse);
      expect((passesModule as any).getSingle).toHaveBeenCalledWith('/passes/1', {
        include: 'pass_events',
      });
    });
  });
});

