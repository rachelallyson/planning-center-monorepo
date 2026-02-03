import { LocationsModule } from '../../src/modules/locations';
import type { PcoHttpClient, PaginationHelper, PcoEventEmitter } from '@rachelallyson/planning-center-base-ts';

describe('LocationsModule', () => {
  let locationsModule: LocationsModule;
  let mockHttpClient: jest.Mocked<PcoHttpClient>;
  let mockPaginationHelper: jest.Mocked<PaginationHelper>;
  let mockEventEmitter: jest.Mocked<PcoEventEmitter>;

  beforeEach(() => {
    mockHttpClient = { request: jest.fn() } as any;
    mockPaginationHelper = { getAllPages: jest.fn() } as any;
    mockEventEmitter = { emit: jest.fn() } as any;

    locationsModule = new LocationsModule(mockHttpClient, mockPaginationHelper, mockEventEmitter);
  });

  describe('constructor', () => {
    it('should create an instance', () => {
      expect(locationsModule).toBeInstanceOf(LocationsModule);
    });
  });

  describe('getAll', () => {
    it('should get all locations across all pages with default parameters', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'Location', attributes: { name: 'Test Location' } }],
        totalCount: 1,
        pagesFetched: 1,
        duration: 10,
        meta: { total_count: 1 },
        links: {},
      };

      mockPaginationHelper.getAllPages.mockResolvedValueOnce(mockResponse as any);

      const result = await locationsModule.getAll();

      expect(result).toEqual(mockResponse);
      expect(mockPaginationHelper.getAllPages).toHaveBeenCalledWith('/locations', {}, undefined);
    });

    it('should get all locations with filtering options', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'Location', attributes: { name: 'Test Location' } }],
        totalCount: 1,
        pagesFetched: 1,
        duration: 10,
        meta: {},
        links: {},
      };

      mockPaginationHelper.getAllPages.mockResolvedValueOnce(mockResponse as any);

      const options = {
        where: { status: 'active' },
        include: ['location_event_periods', 'location_labels'],
        perPage: 10,
        page: 1,
      };

      const result = await locationsModule.getAll(options);

      expect(result).toEqual(mockResponse);
      expect(mockPaginationHelper.getAllPages).toHaveBeenCalledWith('/locations', {
        'where[status]': 'active',
        include: 'location_event_periods,location_labels',
        per_page: 10,
        page: 1,
      }, undefined);
    });
  });

  describe('getPage', () => {
    it('should get a single page of locations', async () => {
      mockHttpClient.request.mockResolvedValueOnce({
        data: { data: [{ id: '1', type: 'Location', attributes: { name: 'Test Location' } }] },
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      } as any);

      await locationsModule.getPage({ perPage: 25, page: 1 });

      expect(mockHttpClient.request).toHaveBeenCalledWith(expect.objectContaining({
        endpoint: '/locations',
        params: expect.objectContaining({ per_page: 25, page: 1 }),
      }));
    });
  });

  describe('getById', () => {
    it('should get a location by ID without include', async () => {
      const mockResponse = { id: '1', type: 'Location', attributes: { name: 'Test Location' } };

      (locationsModule as any).getSingle = jest.fn().mockResolvedValue(mockResponse);

      const result = await locationsModule.getById('1');

      expect(result).toEqual(mockResponse);
      expect((locationsModule as any).getSingle).toHaveBeenCalledWith('/locations/1', {});
    });

    it('should get a location by ID with include', async () => {
      const mockResponse = { id: '1', type: 'Location', attributes: { name: 'Test Location' } };

      (locationsModule as any).getSingle = jest.fn().mockResolvedValue(mockResponse);

      const result = await locationsModule.getById('1', ['location_event_periods', 'location_labels']);

      expect(result).toEqual(mockResponse);
      expect((locationsModule as any).getSingle).toHaveBeenCalledWith('/locations/1', {
        include: 'location_event_periods,location_labels',
      });
    });
  });

  describe('getLocationEventPeriods', () => {
    it('should get location event periods for a location', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'LocationEventPeriod', attributes: { name: 'Test Period' } }],
        meta: { total_count: 1 },
        links: {},
      };

      (locationsModule as any).getList = jest.fn().mockResolvedValue(mockResponse);

      const result = await locationsModule.getLocationEventPeriods('location-1');

      expect(result).toEqual(mockResponse);
      expect((locationsModule as any).getList).toHaveBeenCalledWith('/locations/location-1/location_event_periods');
    });
  });

  describe('getLocationEventTimes', () => {
    it('should get location event times for a location', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'LocationEventTime', attributes: { time: '2023-01-01T10:00:00Z' } }],
        meta: { total_count: 1 },
        links: {},
      };

      (locationsModule as any).getList = jest.fn().mockResolvedValue(mockResponse);

      const result = await locationsModule.getLocationEventTimes('location-1');

      expect(result).toEqual(mockResponse);
      expect((locationsModule as any).getList).toHaveBeenCalledWith('/locations/location-1/location_event_times');
    });
  });

  describe('getLocationLabels', () => {
    it('should get location labels for a location', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'LocationLabel', attributes: { name: 'Test Label' } }],
        meta: { total_count: 1 },
        links: {},
      };

      (locationsModule as any).getList = jest.fn().mockResolvedValue(mockResponse);

      const result = await locationsModule.getLocationLabels('location-1');

      expect(result).toEqual(mockResponse);
      expect((locationsModule as any).getList).toHaveBeenCalledWith('/locations/location-1/location_labels');
    });
  });
});