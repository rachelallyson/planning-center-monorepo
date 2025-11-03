import { EventPeriodsModule } from '../../src/modules/event-periods';
import type { PcoHttpClient, PaginationHelper, PcoEventEmitter } from '@rachelallyson/planning-center-base-ts';

describe('EventPeriodsModule', () => {
  let module: EventPeriodsModule;
  let mockHttpClient: jest.Mocked<PcoHttpClient>;
  let mockPaginationHelper: jest.Mocked<PaginationHelper>;
  let mockEventEmitter: jest.Mocked<PcoEventEmitter>;

  beforeEach(() => {
    mockHttpClient = { request: jest.fn() } as any;
    mockPaginationHelper = { getAllPages: jest.fn() } as any;
    mockEventEmitter = { emit: jest.fn() } as any;
    module = new EventPeriodsModule(mockHttpClient, mockPaginationHelper, mockEventEmitter);
  });

  it('getAll builds params', async () => {
    mockHttpClient.request.mockResolvedValueOnce({ data: { data: [] } } as any);
    await module.getAll({ where: { status: 'open' }, include: ['event'], perPage: 5, page: 2 });
    expect(mockHttpClient.request).toHaveBeenCalledWith(expect.objectContaining({
      method: 'GET', endpoint: '/check-ins/v2/event_periods', params: {
        'where[status]': 'open', include: 'event', per_page: 5, page: 2,
      }
    }));
  });

  it('getById builds include', async () => {
    mockHttpClient.request.mockResolvedValueOnce({ data: { data: {} } } as any);
    await module.getById('e1', ['event_times']);
    expect(mockHttpClient.request).toHaveBeenCalledWith(expect.objectContaining({
      endpoint: '/check-ins/v2/event_periods/e1', params: { include: 'event_times' }
    }));
  });

  it('getEvent returns event', async () => {
    mockHttpClient.request.mockResolvedValueOnce({ data: { data: { id: 'x' } } } as any);
    await module.getEvent('ep1');
    expect(mockHttpClient.request).toHaveBeenCalledWith(expect.objectContaining({
      endpoint: '/check-ins/v2/event_periods/ep1/event'
    }));
  });
});



