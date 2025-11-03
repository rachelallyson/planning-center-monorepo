import { LabelsModule } from '../../src/modules/labels';
import type { PcoHttpClient, PaginationHelper, PcoEventEmitter } from '@rachelallyson/planning-center-base-ts';

describe('LabelsModule', () => {
  let module: LabelsModule;
  let mockHttpClient: jest.Mocked<PcoHttpClient>;
  let mockPaginationHelper: jest.Mocked<PaginationHelper>;
  let mockEventEmitter: jest.Mocked<PcoEventEmitter>;

  beforeEach(() => {
    mockHttpClient = { request: jest.fn() } as any;
    mockPaginationHelper = { getAllPages: jest.fn() } as any;
    mockEventEmitter = { emit: jest.fn() } as any;
    module = new LabelsModule(mockHttpClient, mockPaginationHelper, mockEventEmitter);
  });

  it('getAll builds params', async () => {
    mockHttpClient.request.mockResolvedValueOnce({ data: { data: [] } } as any);
    await module.getAll({ where: { type: 'foo' }, include: ['bar'], perPage: 2, page: 1 });
    expect(mockHttpClient.request).toHaveBeenCalledWith(expect.objectContaining({
      endpoint: '/check-ins/v2/labels', params: { 'where[type]': 'foo', include: 'bar', per_page: 2, page: 1 }
    }));
  });

  it('getEventLabels builds params', async () => {
    mockHttpClient.request.mockResolvedValueOnce({ data: { data: [] } } as any);
    await module.getEventLabels({ where: { status: 'active' } });
    expect(mockHttpClient.request).toHaveBeenCalledWith(expect.objectContaining({
      endpoint: '/check-ins/v2/event_labels', params: { 'where[status]': 'active' }
    }));
  });

  it('getById supports include', async () => {
    mockHttpClient.request.mockResolvedValueOnce({ data: { data: {} } } as any);
    await module.getById('l1', ['something']);
    expect(mockHttpClient.request).toHaveBeenCalledWith(expect.objectContaining({
      endpoint: '/check-ins/v2/labels/l1', params: { include: 'something' }
    }));
  });

  it('getEventLabelById supports include', async () => {
    mockHttpClient.request.mockResolvedValueOnce({ data: { data: {} } } as any);
    await module.getEventLabelById('el1', ['event']);
    expect(mockHttpClient.request).toHaveBeenCalledWith(expect.objectContaining({
      endpoint: '/check-ins/v2/event_labels/el1', params: { include: 'event' }
    }));
  });

  it('getLocationLabels builds params', async () => {
    mockHttpClient.request.mockResolvedValueOnce({ data: { data: [] } } as any);
    await module.getLocationLabels({ where: { active: true } });
    expect(mockHttpClient.request).toHaveBeenCalledWith(expect.objectContaining({
      endpoint: '/check-ins/v2/location_labels', params: { 'where[active]': true }
    }));
  });

  it('getLocationLabelById supports include', async () => {
    mockHttpClient.request.mockResolvedValueOnce({ data: { data: {} } } as any);
    await module.getLocationLabelById('ll1', ['location']);
    expect(mockHttpClient.request).toHaveBeenCalledWith(expect.objectContaining({
      endpoint: '/check-ins/v2/location_labels/ll1', params: { include: 'location' }
    }));
  });
});


