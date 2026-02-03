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

  it('getAll calls getAllPages with params', async () => {
    mockPaginationHelper.getAllPages.mockResolvedValueOnce({ data: [], totalCount: 0, pagesFetched: 1, duration: 0 } as any);
    await module.getAll({ where: { type: 'foo' }, include: ['bar'], perPage: 2, page: 1 });
    expect(mockPaginationHelper.getAllPages).toHaveBeenCalledWith('/labels', {
      'where[type]': 'foo',
      include: 'bar',
      per_page: 2,
      page: 1,
    }, undefined);
  });

  it('getPage calls getList (httpClient) with params', async () => {
    mockHttpClient.request.mockResolvedValueOnce({ data: { data: [] } } as any);
    await module.getPage({ where: { type: 'foo' }, include: ['bar'], perPage: 2, page: 1 });
    expect(mockHttpClient.request).toHaveBeenCalledWith(expect.objectContaining({
      endpoint: '/labels',
      params: expect.objectContaining({
        'where[type]': 'foo',
        include: 'bar',
        per_page: 2,
        page: 1,
      }),
    }));
  });

  it('getById supports include', async () => {
    mockHttpClient.request.mockResolvedValueOnce({ data: { data: {} } } as any);
    await module.getById('l1', ['something']);
    expect(mockHttpClient.request).toHaveBeenCalledWith(expect.objectContaining({
      endpoint: '/labels/l1', params: { include: 'something' }
    }));
  });
});


