import { EventTimesModule } from '../../src/modules/event-times';
import type { PcoHttpClient, PaginationHelper, PcoEventEmitter } from '@rachelallyson/planning-center-base-ts';

describe('EventTimesModule (coverage)', () => {
  let module: EventTimesModule;
  let mockHttpClient: jest.Mocked<PcoHttpClient>;
  let mockPaginationHelper: jest.Mocked<PaginationHelper>;
  let mockEventEmitter: jest.Mocked<PcoEventEmitter>;

  beforeEach(() => {
    mockHttpClient = { request: jest.fn() } as any;
    mockPaginationHelper = { getAllPages: jest.fn() } as any;
    mockEventEmitter = { emit: jest.fn() } as any;
    module = new EventTimesModule(mockHttpClient, mockPaginationHelper, mockEventEmitter);
  });

  it('getAll builds params', async () => {
    mockHttpClient.request.mockResolvedValueOnce({ data: { data: [] } } as any);
    await module.getAll({ where: { active: true }, include: ['event'], perPage: 10, page: 3 });
    expect(mockHttpClient.request).toHaveBeenCalledWith(expect.objectContaining({
      endpoint: '/check-ins/v2/event_times', params: { 'where[active]': true, include: 'event', per_page: 10, page: 3 }
    }));
  });

  it('getEventPeriod calls correct endpoint', async () => {
    mockHttpClient.request.mockResolvedValueOnce({ data: { data: {} } } as any);
    await module.getEventPeriod('et1');
    expect(mockHttpClient.request).toHaveBeenCalledWith(expect.objectContaining({
      endpoint: '/check-ins/v2/event_times/et1/event_period'
    }));
  });
});



