import { ThemesModule } from '../../src/modules/themes';
import type { PcoHttpClient, PaginationHelper, PcoEventEmitter } from '@rachelallyson/planning-center-base-ts';

describe('ThemesModule', () => {
  let themesModule: ThemesModule;
  let mockHttpClient: jest.Mocked<PcoHttpClient>;
  let mockPaginationHelper: jest.Mocked<PaginationHelper>;
  let mockEventEmitter: jest.Mocked<PcoEventEmitter>;

  beforeEach(() => {
    mockHttpClient = { request: jest.fn() } as any;
    mockPaginationHelper = { getAllPages: jest.fn() } as any;
    mockEventEmitter = { emit: jest.fn() } as any;

    themesModule = new ThemesModule(mockHttpClient, mockPaginationHelper, mockEventEmitter);
  });

  describe('constructor', () => {
    it('should create an instance', () => {
      expect(themesModule).toBeInstanceOf(ThemesModule);
    });
  });

  describe('getAll', () => {
    it('should get all themes across all pages with default parameters', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'Theme', attributes: { name: 'Test Theme' } }],
        totalCount: 1,
        pagesFetched: 1,
        duration: 10,
        meta: { total_count: 1 },
        links: {},
      };

      mockPaginationHelper.getAllPages.mockResolvedValueOnce(mockResponse as any);

      const result = await themesModule.getAll();

      expect(result).toEqual(mockResponse);
      expect(mockPaginationHelper.getAllPages).toHaveBeenCalledWith('/themes', {}, undefined);
    });

    it('should get all themes with filtering options', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'Theme', attributes: { name: 'Test Theme' } }],
        totalCount: 1,
        pagesFetched: 1,
        duration: 10,
        meta: {},
        links: {},
      };

      mockPaginationHelper.getAllPages.mockResolvedValueOnce(mockResponse as any);

      const options = {
        where: { status: 'active' },
        include: ['theme_colors'],
        perPage: 10,
        page: 1,
      };

      const result = await themesModule.getAll(options);

      expect(result).toEqual(mockResponse);
      expect(mockPaginationHelper.getAllPages).toHaveBeenCalledWith('/themes', {
        'where[status]': 'active',
        include: 'theme_colors',
        per_page: 10,
        page: 1,
      }, undefined);
    });
  });

  describe('getPage', () => {
    it('should get a single page of themes', async () => {
      mockHttpClient.request.mockResolvedValueOnce({
        data: { data: [{ id: '1', type: 'Theme', attributes: { name: 'Test Theme' } }] },
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      } as any);

      await themesModule.getPage({ perPage: 25, page: 1 });

      expect(mockHttpClient.request).toHaveBeenCalledWith(expect.objectContaining({
        endpoint: '/themes',
        params: expect.objectContaining({ per_page: 25, page: 1 }),
      }));
    });
  });

  describe('getById', () => {
    it('should get a theme by ID without include', async () => {
      const mockResponse = { id: '1', type: 'Theme', attributes: { name: 'Test Theme' } };

      (themesModule as any).getSingle = jest.fn().mockResolvedValue(mockResponse);

      const result = await themesModule.getById('1');

      expect(result).toEqual(mockResponse);
      expect((themesModule as any).getSingle).toHaveBeenCalledWith('/themes/1', {});
    });

    it('should get a theme by ID with include', async () => {
      const mockResponse = { id: '1', type: 'Theme', attributes: { name: 'Test Theme' } };

      (themesModule as any).getSingle = jest.fn().mockResolvedValue(mockResponse);

      const result = await themesModule.getById('1', ['theme_colors']);

      expect(result).toEqual(mockResponse);
      expect((themesModule as any).getSingle).toHaveBeenCalledWith('/themes/1', {
        include: 'theme_colors',
      });
    });
  });
});

