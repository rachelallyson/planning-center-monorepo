import { CheckInsModule } from '../../src/modules/check-ins';
import type { PcoHttpClient, PaginationHelper, PcoEventEmitter } from '@rachelallyson/planning-center-base-ts';

describe('CheckInsModule', () => {
  let checkInsModule: CheckInsModule;
  let mockHttpClient: jest.Mocked<PcoHttpClient>;
  let mockPaginationHelper: jest.Mocked<PaginationHelper>;
  let mockEventEmitter: jest.Mocked<PcoEventEmitter>;

  beforeEach(() => {
    mockHttpClient = { request: jest.fn() } as any;
    mockPaginationHelper = { getAllPages: jest.fn() } as any;
    mockEventEmitter = { emit: jest.fn() } as any;

    checkInsModule = new CheckInsModule(mockHttpClient, mockPaginationHelper, mockEventEmitter);
  });

  describe('constructor', () => {
    it('should create an instance', () => {
      expect(checkInsModule).toBeInstanceOf(CheckInsModule);
    });
  });

  describe('getAll', () => {
    it('should get all check-ins with default parameters', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'CheckIn', attributes: { name: 'Test CheckIn' } }],
        meta: { total_count: 1 },
        links: {},
      };

      (checkInsModule as any).getList = jest.fn().mockResolvedValue(mockResponse);

      const result = await checkInsModule.getAll();

      expect(result).toEqual(mockResponse);
      expect((checkInsModule as any).getList).toHaveBeenCalledWith('/check-ins/v2/check_ins', {});
    });

    it('should get all check-ins with filtering options', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'CheckIn', attributes: { name: 'Test CheckIn' } }],
        meta: { total_count: 1 },
        links: {},
      };

      (checkInsModule as any).getList = jest.fn().mockResolvedValue(mockResponse);

      const options = {
        where: { status: 'active' },
        include: ['check_in_group', 'person'],
        perPage: 10,
        page: 1,
        filter: ['attendee', 'volunteer'],
      };

      const result = await checkInsModule.getAll(options);

      expect(result).toEqual(mockResponse);
      expect((checkInsModule as any).getList).toHaveBeenCalledWith('/check-ins/v2/check_ins', {
        'where[status]': 'active',
        include: 'check_in_group,person',
        per_page: 10,
        page: 1,
        attendee: 'true',
        volunteer: 'true',
      });
    });
  });

  describe('getById', () => {
    it('should get a check-in by ID without include', async () => {
      const mockResponse = { id: '1', type: 'CheckIn', attributes: { name: 'Test CheckIn' } };

      (checkInsModule as any).getSingle = jest.fn().mockResolvedValue(mockResponse);

      const result = await checkInsModule.getById('1');

      expect(result).toEqual(mockResponse);
      expect((checkInsModule as any).getSingle).toHaveBeenCalledWith('/check-ins/v2/check_ins/1', {});
    });

    it('should get a check-in by ID with include', async () => {
      const mockResponse = { id: '1', type: 'CheckIn', attributes: { name: 'Test CheckIn' } };

      (checkInsModule as any).getSingle = jest.fn().mockResolvedValue(mockResponse);

      const result = await checkInsModule.getById('1', ['check_in_group', 'person']);

      expect(result).toEqual(mockResponse);
      expect((checkInsModule as any).getSingle).toHaveBeenCalledWith('/check-ins/v2/check_ins/1', {
        include: 'check_in_group,person',
      });
    });
  });

  describe('getCheckInGroup', () => {
    it('should get check-in group successfully', async () => {
      const mockResponse = { id: '1', type: 'CheckInGroup', attributes: { name: 'Test Group' } };

      (checkInsModule as any).getSingle = jest.fn().mockResolvedValue(mockResponse);

      const result = await checkInsModule.getCheckInGroup('checkin-1');

      expect(result).toEqual(mockResponse);
      expect((checkInsModule as any).getSingle).toHaveBeenCalledWith('/check-ins/v2/check_ins/checkin-1/check_in_group');
    });

    it('should return null when check-in group not found', async () => {
      const error = new Error('Not found');
      (error as any).status = 404;

      (checkInsModule as any).getSingle = jest.fn().mockRejectedValue(error);

      const result = await checkInsModule.getCheckInGroup('checkin-1');

      expect(result).toBeNull();
    });

    it('should throw error for non-404 errors', async () => {
      const error = new Error('Server error');
      (error as any).status = 500;

      (checkInsModule as any).getSingle = jest.fn().mockRejectedValue(error);

      await expect(checkInsModule.getCheckInGroup('checkin-1')).rejects.toThrow('Server error');
    });
  });

  describe('getCheckInTimes', () => {
    it('should get check-in times', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'CheckInTime', attributes: { time: '2023-01-01T10:00:00Z' } }],
        meta: { total_count: 1 },
        links: {},
      };

      (checkInsModule as any).getList = jest.fn().mockResolvedValue(mockResponse);

      const result = await checkInsModule.getCheckInTimes('checkin-1');

      expect(result).toEqual(mockResponse);
      expect((checkInsModule as any).getList).toHaveBeenCalledWith('/check-ins/v2/check_ins/checkin-1/check_in_times');
    });
  });

  describe('getCheckedInAt', () => {
    it('should get checked-in station successfully', async () => {
      const mockResponse = { id: '1', type: 'Station', attributes: { name: 'Test Station' } };

      (checkInsModule as any).getSingle = jest.fn().mockResolvedValue(mockResponse);

      const result = await checkInsModule.getCheckedInAt('checkin-1');

      expect(result).toEqual(mockResponse);
      expect((checkInsModule as any).getSingle).toHaveBeenCalledWith('/check-ins/v2/check_ins/checkin-1/checked_in_at');
    });

    it('should return null when station not found', async () => {
      const error = new Error('Not found');
      (error as any).status = 404;

      (checkInsModule as any).getSingle = jest.fn().mockRejectedValue(error);

      const result = await checkInsModule.getCheckedInAt('checkin-1');

      expect(result).toBeNull();
    });
  });

  describe('getCheckedInBy', () => {
    it('should get checked-in-by person successfully', async () => {
      const mockResponse = { id: '1', type: 'Person', attributes: { name: 'Test Person' } };

      (checkInsModule as any).getSingle = jest.fn().mockResolvedValue(mockResponse);

      const result = await checkInsModule.getCheckedInBy('checkin-1');

      expect(result).toEqual(mockResponse);
      expect((checkInsModule as any).getSingle).toHaveBeenCalledWith('/check-ins/v2/check_ins/checkin-1/checked_in_by');
    });

    it('should return null when person not found', async () => {
      const error = new Error('Not found');
      (error as any).status = 404;

      (checkInsModule as any).getSingle = jest.fn().mockRejectedValue(error);

      const result = await checkInsModule.getCheckedInBy('checkin-1');

      expect(result).toBeNull();
    });
  });

  describe('getCheckedOutBy', () => {
    it('should get checked-out-by person successfully', async () => {
      const mockResponse = { id: '1', type: 'Person', attributes: { name: 'Test Person' } };

      (checkInsModule as any).getSingle = jest.fn().mockResolvedValue(mockResponse);

      const result = await checkInsModule.getCheckedOutBy('checkin-1');

      expect(result).toEqual(mockResponse);
      expect((checkInsModule as any).getSingle).toHaveBeenCalledWith('/check-ins/v2/check_ins/checkin-1/checked_out_by');
    });

    it('should return null when person not found', async () => {
      const error = new Error('Not found');
      (error as any).status = 404;

      (checkInsModule as any).getSingle = jest.fn().mockRejectedValue(error);

      const result = await checkInsModule.getCheckedOutBy('checkin-1');

      expect(result).toBeNull();
    });
  });

  describe('getEvent', () => {
    it('should get event for check-in', async () => {
      const mockResponse = { id: '1', type: 'Event', attributes: { name: 'Test Event' } };

      (checkInsModule as any).getSingle = jest.fn().mockResolvedValue(mockResponse);

      const result = await checkInsModule.getEvent('checkin-1');

      expect(result).toEqual(mockResponse);
      expect((checkInsModule as any).getSingle).toHaveBeenCalledWith('/check-ins/v2/check_ins/checkin-1/event');
    });
  });

  describe('getEventPeriod', () => {
    it('should get event period for check-in', async () => {
      const mockResponse = { id: '1', type: 'EventPeriod', attributes: { name: 'Test Period' } };

      (checkInsModule as any).getSingle = jest.fn().mockResolvedValue(mockResponse);

      const result = await checkInsModule.getEventPeriod('checkin-1');

      expect(result).toEqual(mockResponse);
      expect((checkInsModule as any).getSingle).toHaveBeenCalledWith('/check-ins/v2/check_ins/checkin-1/event_period');
    });
  });

  describe('getEventTimes', () => {
    it('should get event times for check-in', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'EventTime', attributes: { time: '2023-01-01T10:00:00Z' } }],
        meta: { total_count: 1 },
        links: {},
      };

      (checkInsModule as any).getList = jest.fn().mockResolvedValue(mockResponse);

      const result = await checkInsModule.getEventTimes('checkin-1');

      expect(result).toEqual(mockResponse);
      expect((checkInsModule as any).getList).toHaveBeenCalledWith('/check-ins/v2/check_ins/checkin-1/event_times');
    });
  });

  describe('getLocations', () => {
    it('should get locations for check-in', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'Location', attributes: { name: 'Test Location' } }],
        meta: { total_count: 1 },
        links: {},
      };

      (checkInsModule as any).getList = jest.fn().mockResolvedValue(mockResponse);

      const result = await checkInsModule.getLocations('checkin-1');

      expect(result).toEqual(mockResponse);
      expect((checkInsModule as any).getList).toHaveBeenCalledWith('/check-ins/v2/check_ins/checkin-1/locations');
    });
  });

  describe('getOptions', () => {
    it('should get options for check-in', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'Option', attributes: { name: 'Test Option' } }],
        meta: { total_count: 1 },
        links: {},
      };

      (checkInsModule as any).getList = jest.fn().mockResolvedValue(mockResponse);

      const result = await checkInsModule.getOptions('checkin-1');

      expect(result).toEqual(mockResponse);
      expect((checkInsModule as any).getList).toHaveBeenCalledWith('/check-ins/v2/check_ins/checkin-1/options');
    });
  });

  describe('getPerson', () => {
    it('should get person for check-in successfully', async () => {
      const mockResponse = { id: '1', type: 'Person', attributes: { name: 'Test Person' } };

      (checkInsModule as any).getSingle = jest.fn().mockResolvedValue(mockResponse);

      const result = await checkInsModule.getPerson('checkin-1');

      expect(result).toEqual(mockResponse);
      expect((checkInsModule as any).getSingle).toHaveBeenCalledWith('/check-ins/v2/check_ins/checkin-1/person');
    });

    it('should return null when person not found', async () => {
      const error = new Error('Not found');
      (error as any).status = 404;

      (checkInsModule as any).getSingle = jest.fn().mockRejectedValue(error);

      const result = await checkInsModule.getPerson('checkin-1');

      expect(result).toBeNull();
    });
  });
});