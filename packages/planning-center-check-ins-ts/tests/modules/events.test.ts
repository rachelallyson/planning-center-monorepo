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
    it('should get all events with default parameters', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'Event', attributes: { name: 'Test Event' } }],
        meta: { total_count: 1 },
        links: {},
      };

      (eventsModule as any).getList = jest.fn().mockResolvedValue(mockResponse);

      const result = await eventsModule.getAll();

      expect(result).toEqual(mockResponse);
      expect((eventsModule as any).getList).toHaveBeenCalledWith('/check-ins/v2/events', {});
    });

    it('should get all events with filtering options', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'Event', attributes: { name: 'Test Event' } }],
        meta: { total_count: 1 },
        links: {},
      };

      (eventsModule as any).getList = jest.fn().mockResolvedValue(mockResponse);

      const options = {
        where: { status: 'active' },
        include: ['event_periods', 'event_times'],
        perPage: 10,
        page: 1,
      };

      const result = await eventsModule.getAll(options);

      expect(result).toEqual(mockResponse);
      expect((eventsModule as any).getList).toHaveBeenCalledWith('/check-ins/v2/events', {
        'where[status]': 'active',
        include: 'event_periods,event_times',
        per_page: 10,
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
      expect((eventsModule as any).getSingle).toHaveBeenCalledWith('/check-ins/v2/events/1', {});
    });

    it('should get an event by ID with include', async () => {
      const mockResponse = { id: '1', type: 'Event', attributes: { name: 'Test Event' } };

      (eventsModule as any).getSingle = jest.fn().mockResolvedValue(mockResponse);

      const result = await eventsModule.getById('1', ['event_periods', 'event_times']);

      expect(result).toEqual(mockResponse);
      expect((eventsModule as any).getSingle).toHaveBeenCalledWith('/check-ins/v2/events/1', {
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
      expect((eventsModule as any).getList).toHaveBeenCalledWith('/check-ins/v2/events/event-1/attendance_types');
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
      expect((eventsModule as any).getList).toHaveBeenCalledWith('/check-ins/v2/events/event-1/check_ins', {});
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
      expect((eventsModule as any).getList).toHaveBeenCalledWith('/check-ins/v2/events/event-1/check_ins', {
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
      expect((eventsModule as any).getList).toHaveBeenCalledWith('/check-ins/v2/events/event-1/current_event_times');
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
      expect((eventsModule as any).getList).toHaveBeenCalledWith('/check-ins/v2/events/event-1/event_labels');
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
      expect((eventsModule as any).getList).toHaveBeenCalledWith('/check-ins/v2/events/event-1/event_periods');
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
      expect((eventsModule as any).getList).toHaveBeenCalledWith('/check-ins/v2/events/event-1/integration_links');
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
      expect((eventsModule as any).getList).toHaveBeenCalledWith('/check-ins/v2/events/event-1/locations');
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
      expect((eventsModule as any).getList).toHaveBeenCalledWith('/check-ins/v2/events/event-1/person_events');
    });
  });
});