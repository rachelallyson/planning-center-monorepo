import { EventsModule } from '../../src/modules/events';
import type { PcoHttpClient, PaginationHelper, PcoEventEmitter } from '@rachelallyson/planning-center-base-ts';

describe('EventsModule', () => {
  let eventsModule: EventsModule;
  let mockHttpClient: jest.Mocked<PcoHttpClient>;
  let mockPaginationHelper: jest.Mocked<PaginationHelper>;
  let mockEventEmitter: jest.Mocked<PcoEventEmitter>;

  beforeEach(() => {
    mockHttpClient = { request: jest.fn() } as any;
    mockPaginationHelper = { getAllPages: jest.fn() } as any;
    mockEventEmitter = { emit: jest.fn() } as any;

    eventsModule = new EventsModule(mockHttpClient, mockPaginationHelper, mockEventEmitter);
  });

  describe('constructor', () => {
    it('should create an instance', () => {
      expect(eventsModule).toBeInstanceOf(EventsModule);
    });
  });

  describe('getAll', () => {
    it('should get all events across all pages with default parameters', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'Event', attributes: { name: 'Test Event' } }],
        totalCount: 1,
        pagesFetched: 1,
        duration: 10,
        meta: { total_count: 1 },
        links: {},
      };

      mockPaginationHelper.getAllPages.mockResolvedValue(mockResponse);

      const result = await eventsModule.getAll();

      expect(result).toEqual(mockResponse);
      expect(mockPaginationHelper.getAllPages).toHaveBeenCalledWith('/events', {}, undefined);
    });

    it('should get all events with filtering options', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'Event', attributes: { name: 'Test Event' } }],
        totalCount: 1,
        pagesFetched: 1,
        duration: 10,
        meta: { total_count: 1 },
        links: {},
      };

      mockPaginationHelper.getAllPages.mockResolvedValue(mockResponse);

      const options = {
        where: { status: 'active' },
        include: ['event_periods', 'event_times'],
        perPage: 10,
        page: 1,
      };

      const result = await eventsModule.getAll(options);

      expect(result).toEqual(mockResponse);
      expect(mockPaginationHelper.getAllPages).toHaveBeenCalledWith('/events', {
        'where[status]': 'active',
        include: 'event_periods,event_times',
        per_page: 10,
        page: 1,
      }, undefined);
    });

    it('should get all events with filter parameter (string)', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'Event', attributes: { name: 'Test Event' } }],
        totalCount: 1,
        pagesFetched: 1,
        duration: 10,
        meta: {},
        links: {},
      };

      mockPaginationHelper.getAllPages.mockResolvedValue(mockResponse);

      const options = { filter: 'not_archived', perPage: 100 };

      const result = await eventsModule.getAll(options);

      expect(result).toEqual(mockResponse);
      expect(mockPaginationHelper.getAllPages).toHaveBeenCalledWith('/events', {
        filter: 'not_archived',
        per_page: 100,
      }, undefined);
    });

    it('should get all events with filter parameter (array)', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'Event', attributes: { name: 'Test Event' } }],
        totalCount: 1,
        pagesFetched: 1,
        duration: 10,
        meta: {},
        links: {},
      };

      mockPaginationHelper.getAllPages.mockResolvedValue(mockResponse);

      const options = { filter: ['not_archived'], perPage: 100 };

      const result = await eventsModule.getAll(options);

      expect(result).toEqual(mockResponse);
      expect(mockPaginationHelper.getAllPages).toHaveBeenCalledWith('/events', {
        filter: 'not_archived',
        per_page: 100,
      }, undefined);
    });
  });

  describe('getPage', () => {
    it('should get a single page of events', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'Event', attributes: { name: 'Test Event' } }],
        meta: { total_count: 1 },
        links: {},
      };

      (eventsModule as any).getList = jest.fn().mockResolvedValue(mockResponse);

      const result = await eventsModule.getPage({ perPage: 25, page: 1 });

      expect(result).toEqual(mockResponse);
      expect((eventsModule as any).getList).toHaveBeenCalledWith('/events', {
        per_page: 25,
        page: 1,
      });
    });
  });

  describe('getById', () => {
    it('should get an event by ID without include', async () => {
      const mockResponse = { id: '1', type: 'Event', attributes: { name: 'Test Event' } };

      (eventsModule as any).getSingle = jest.fn().mockResolvedValue(mockResponse);

      const result = await eventsModule.getById('1');

      expect(result).toEqual(mockResponse);
      expect((eventsModule as any).getSingle).toHaveBeenCalledWith('/events/1', {});
    });

    it('should get an event by ID with include', async () => {
      const mockResponse = { id: '1', type: 'Event', attributes: { name: 'Test Event' } };

      (eventsModule as any).getSingle = jest.fn().mockResolvedValue(mockResponse);

      const result = await eventsModule.getById('1', ['event_periods', 'event_times']);

      expect(result).toEqual(mockResponse);
      expect((eventsModule as any).getSingle).toHaveBeenCalledWith('/events/1', {
        include: 'event_periods,event_times',
      });
    });
  });

  // create/update/delete not part of EventsModule API; covered by BaseModule helpers in other modules. Remove here.

  describe('getAttendanceTypes', () => {
    it('should get attendance types for an event', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'AttendanceType', attributes: { name: 'Adult' } }],
        meta: { total_count: 1 },
        links: {},
      };

      (eventsModule as any).getList = jest.fn().mockResolvedValue(mockResponse);

      const result = await eventsModule.getAttendanceTypes('event-1');

      expect(result).toEqual(mockResponse);
      expect((eventsModule as any).getList).toHaveBeenCalledWith('/events/event-1/attendance_types');
    });
  });

  describe('getCheckIns', () => {
    it('should get check-ins for an event without filters', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'CheckIn', attributes: { name: 'Test CheckIn' } }],
        meta: { total_count: 1 },
        links: {},
      };

      (eventsModule as any).getList = jest.fn().mockResolvedValue(mockResponse);

      const result = await eventsModule.getCheckIns('event-1');

      expect(result).toEqual(mockResponse);
      expect((eventsModule as any).getList).toHaveBeenCalledWith('/events/event-1/check_ins', {});
    });

    it('should get check-ins for an event with filters', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'CheckIn', attributes: { name: 'Test CheckIn' } }],
        meta: { total_count: 1 },
        links: {},
      };

      (eventsModule as any).getList = jest.fn().mockResolvedValue(mockResponse);

      const result = await eventsModule.getCheckIns('event-1', { filter: ['attendee', 'volunteer'] });

      expect(result).toEqual(mockResponse);
      expect((eventsModule as any).getList).toHaveBeenCalledWith('/events/event-1/check_ins', {
        attendee: 'true',
        volunteer: 'true',
      });
    });
  });

  describe('getCurrentEventTimes', () => {
    it('should get current event times for an event', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'EventTime', attributes: { time: '2023-01-01T10:00:00Z' } }],
        meta: { total_count: 1 },
        links: {},
      };

      (eventsModule as any).getList = jest.fn().mockResolvedValue(mockResponse);

      const result = await eventsModule.getCurrentEventTimes('event-1');

      expect(result).toEqual(mockResponse);
      expect((eventsModule as any).getList).toHaveBeenCalledWith('/events/event-1/current_event_times');
    });
  });

  describe('getEventLabels', () => {
    it('should get event labels for an event', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'EventLabel', attributes: { name: 'Test Label' } }],
        meta: { total_count: 1 },
        links: {},
      };

      (eventsModule as any).getList = jest.fn().mockResolvedValue(mockResponse);

      const result = await eventsModule.getEventLabels('event-1');

      expect(result).toEqual(mockResponse);
      expect((eventsModule as any).getList).toHaveBeenCalledWith('/events/event-1/event_labels');
    });
  });

  describe('getEventPeriods', () => {
    it('should get event periods for an event', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'EventPeriod', attributes: { name: 'Test Period' } }],
        meta: { total_count: 1 },
        links: {},
      };

      (eventsModule as any).getList = jest.fn().mockResolvedValue(mockResponse);

      const result = await eventsModule.getEventPeriods('event-1');

      expect(result).toEqual(mockResponse);
      expect((eventsModule as any).getList).toHaveBeenCalledWith('/events/event-1/event_periods');
    });
  });

  describe('getAllEventPeriods', () => {
    it('should get all event periods for an event (all pages)', async () => {
      const mockResponse = {
        data: [
          { id: '1', type: 'EventPeriod', attributes: { name: 'Period 1' } },
          { id: '2', type: 'EventPeriod', attributes: { name: 'Period 2' } },
        ],
        pagesFetched: 1,
        totalCount: 2,
        duration: 100,
      };

      (eventsModule as any).getAllPages = jest.fn().mockResolvedValue(mockResponse);

      const result = await eventsModule.getAllEventPeriods('event-1', { perPage: 100 });

      expect(result).toEqual(mockResponse.data);
      expect((eventsModule as any).getAllPages).toHaveBeenCalledWith(
        '/events/event-1/event_periods',
        {},
        { perPage: 100 }
      );
    });

    it('should get all event periods with default perPage', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'EventPeriod', attributes: { name: 'Period 1' } }],
        pagesFetched: 1,
        totalCount: 1,
        duration: 50,
      };

      (eventsModule as any).getAllPages = jest.fn().mockResolvedValue(mockResponse);

      const result = await eventsModule.getAllEventPeriods('event-1');

      expect(result).toEqual(mockResponse.data);
      expect((eventsModule as any).getAllPages).toHaveBeenCalledWith(
        '/events/event-1/event_periods',
        {},
        { perPage: 100 }
      );
    });
  });

  describe('getAllEvents', () => {
    it('should get all events with pagination (all pages)', async () => {
      const mockResponse = {
        data: [
          { id: '1', type: 'Event', attributes: { name: 'Event 1' } },
          { id: '2', type: 'Event', attributes: { name: 'Event 2' } },
        ],
        pagesFetched: 1,
        totalCount: 2,
        duration: 100,
      };

      (eventsModule as any).getAllPages = jest.fn().mockResolvedValue(mockResponse);

      const result = await eventsModule.getAllEvents({ perPage: 100 });

      expect(result).toEqual(mockResponse.data);
      expect((eventsModule as any).getAllPages).toHaveBeenCalledWith(
        '/events',
        {},
        { perPage: 100 }
      );
    });

    it('should get all events with filter parameter', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'Event', attributes: { name: 'Event 1' } }],
        pagesFetched: 1,
        totalCount: 1,
        duration: 50,
      };

      (eventsModule as any).getAllPages = jest.fn().mockResolvedValue(mockResponse);

      const result = await eventsModule.getAllEvents({ filter: 'not_archived', perPage: 100 });

      expect(result).toEqual(mockResponse.data);
      expect((eventsModule as any).getAllPages).toHaveBeenCalledWith(
        '/events',
        { filter: 'not_archived' },
        { perPage: 100 }
      );
    });

    it('should get all events with filter array', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'Event', attributes: { name: 'Event 1' } }],
        pagesFetched: 1,
        totalCount: 1,
        duration: 50,
      };

      (eventsModule as any).getAllPages = jest.fn().mockResolvedValue(mockResponse);

      const result = await eventsModule.getAllEvents({ filter: ['not_archived'], perPage: 100 });

      expect(result).toEqual(mockResponse.data);
      expect((eventsModule as any).getAllPages).toHaveBeenCalledWith(
        '/events',
        { filter: 'not_archived' },
        { perPage: 100 }
      );
    });

    it('should get all events with default perPage', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'Event', attributes: { name: 'Event 1' } }],
        pagesFetched: 1,
        totalCount: 1,
        duration: 50,
      };

      (eventsModule as any).getAllPages = jest.fn().mockResolvedValue(mockResponse);

      const result = await eventsModule.getAllEvents();

      expect(result).toEqual(mockResponse.data);
      expect((eventsModule as any).getAllPages).toHaveBeenCalledWith(
        '/events',
        {},
        { perPage: 100 }
      );
    });
  });

  describe('getEventTimesForPeriod', () => {
    it('should get event times for a specific event period', async () => {
      const mockListResponse = {
        data: [
          { id: '1', type: 'EventTime', starts_at: '2023-01-01T10:00:00Z' },
        ],
        meta: { total_count: 1 },
        links: {},
      };

      (eventsModule as any).getList = jest.fn().mockResolvedValue(mockListResponse);

      const result = await eventsModule.getEventTimesForPeriod('event-1', 'period-1', {
        include: ['headcounts', 'headcounts.attendance_type'],
        perPage: 100,
      });

      expect(result.data).toEqual(mockListResponse.data);
      expect(result.meta).toEqual(mockListResponse.meta);
      expect(result.links).toEqual(mockListResponse.links);
      expect((eventsModule as any).getList).toHaveBeenCalledWith(
        '/events/event-1/event_periods/period-1/event_times',
        {
          include: 'headcounts,headcounts.attendance_type',
          per_page: 100,
        }
      );
    });

    it('should get event times for a period with include as string', async () => {
      const mockListResponse = {
        data: [{ id: '1', type: 'EventTime', starts_at: '2023-01-01T10:00:00Z' }],
        meta: { total_count: 1 },
        links: {},
      };

      (eventsModule as any).getList = jest.fn().mockResolvedValue(mockListResponse);

      const result = await eventsModule.getEventTimesForPeriod('event-1', 'period-1', {
        include: 'headcounts',
      });

      expect(result.data).toEqual(mockListResponse.data);
      expect((eventsModule as any).getList).toHaveBeenCalledWith(
        '/events/event-1/event_periods/period-1/event_times',
        { include: 'headcounts' }
      );
    });

    it('should get event times for a period without options', async () => {
      const mockListResponse = {
        data: [{ id: '1', type: 'EventTime', starts_at: '2023-01-01T10:00:00Z' }],
        meta: undefined,
        links: undefined,
      };

      (eventsModule as any).getList = jest.fn().mockResolvedValue(mockListResponse);

      const result = await eventsModule.getEventTimesForPeriod('event-1', 'period-1');

      expect(result.data).toEqual(mockListResponse.data);
      expect((eventsModule as any).getList).toHaveBeenCalledWith(
        '/events/event-1/event_periods/period-1/event_times',
        {}
      );
    });
  });

  describe('getIntegrationLinks', () => {
    it('should get integration links for an event', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'IntegrationLink', attributes: { name: 'Test Link' } }],
        meta: { total_count: 1 },
        links: {},
      };

      (eventsModule as any).getList = jest.fn().mockResolvedValue(mockResponse);

      const result = await eventsModule.getIntegrationLinks('event-1');

      expect(result).toEqual(mockResponse);
      expect((eventsModule as any).getList).toHaveBeenCalledWith('/events/event-1/integration_links');
    });
  });

  describe('getLocations', () => {
    it('should get locations for an event', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'Location', attributes: { name: 'Test Location' } }],
        meta: { total_count: 1 },
        links: {},
      };

      (eventsModule as any).getList = jest.fn().mockResolvedValue(mockResponse);

      const result = await eventsModule.getLocations('event-1');

      expect(result).toEqual(mockResponse);
      expect((eventsModule as any).getList).toHaveBeenCalledWith('/events/event-1/locations');
    });
  });

  describe('getPersonEvents', () => {
    it('should get person events for an event', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'PersonEvent', attributes: { name: 'Test PersonEvent' } }],
        meta: { total_count: 1 },
        links: {},
      };

      (eventsModule as any).getList = jest.fn().mockResolvedValue(mockResponse);

      const result = await eventsModule.getPersonEvents('event-1');

      expect(result).toEqual(mockResponse);
      expect((eventsModule as any).getList).toHaveBeenCalledWith('/events/event-1/person_events');
    });
  });
});