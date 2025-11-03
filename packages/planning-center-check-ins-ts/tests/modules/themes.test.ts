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
    it('should get all themes with default parameters', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'Theme', attributes: { name: 'Test Theme' } }],
        meta: { total_count: 1 },
        links: {},
      };

      (themesModule as any).getList = jest.fn().mockResolvedValue(mockResponse);

      const result = await themesModule.getAll();

      expect(result).toEqual(mockResponse);
      expect((themesModule as any).getList).toHaveBeenCalledWith('/check-ins/v2/themes', {});
    });

    it('should get all themes with filtering options', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'Theme', attributes: { name: 'Test Theme' } }],
        meta: { total_count: 1 },
        links: {},
      };

      (themesModule as any).getList = jest.fn().mockResolvedValue(mockResponse);

      const options = {
        where: { status: 'active' },
        include: ['theme_colors'],
        perPage: 10,
        page: 1,
      };

      const result = await themesModule.getAll(options);

      expect(result).toEqual(mockResponse);
      expect((themesModule as any).getList).toHaveBeenCalledWith('/check-ins/v2/themes', {
        'where[status]': 'active',
        include: 'theme_colors',
        per_page: 10,
        page: 1,
      });
    });
  });

  describe('getById', () => {
    it('should get a theme by ID without include', async () => {
      const mockResponse = { id: '1', type: 'Theme', attributes: { name: 'Test Theme' } };

      (themesModule as any).getSingle = jest.fn().mockResolvedValue(mockResponse);

      const result = await themesModule.getById('1');

      expect(result).toEqual(mockResponse);
      expect((themesModule as any).getSingle).toHaveBeenCalledWith('/check-ins/v2/themes/1', {});
    });

    it('should get a theme by ID with include', async () => {
      const mockResponse = { id: '1', type: 'Theme', attributes: { name: 'Test Theme' } };

      (themesModule as any).getSingle = jest.fn().mockResolvedValue(mockResponse);

      const result = await themesModule.getById('1', ['theme_colors']);

      expect(result).toEqual(mockResponse);
      expect((themesModule as any).getSingle).toHaveBeenCalledWith('/check-ins/v2/themes/1', {
        include: 'theme_colors',
      });
    });
  });
});

