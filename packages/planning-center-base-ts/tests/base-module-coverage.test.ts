import { BaseModule } from '../src/base-module';
import type { PcoHttpClient, PaginationHelper, PcoEventEmitter } from '../src';

class DummyModule extends BaseModule {
  public async _getSingle(endpoint: string, params?: Record<string, any>) {
    return this.getSingle<any>(endpoint, params);
  }
  public async _getList(endpoint: string, params?: Record<string, any>) {
    return this.getList<any>(endpoint, params);
  }
  public async _create(endpoint: string, data: any, params?: Record<string, any>) {
    return this.createResource<any>(endpoint, data, params);
  }
  public async _update(endpoint: string, data: any, params?: Record<string, any>) {
    return this.updateResource<any>(endpoint, data, params);
  }
  public async _delete(endpoint: string, params?: Record<string, any>) {
    return this.deleteResource(endpoint, params);
  }
  public async _getAllPages(endpoint: string, params?: Record<string, any>, options?: any) {
    return this.getAllPages<any>(endpoint, params, options);
  }
  public async *_streamPages(endpoint: string, params?: Record<string, any>, options?: any) {
    for await (const page of this.streamPages<any>(endpoint, params, options)) {
      yield page;
    }
  }
}

describe('BaseModule protected methods coverage', () => {
  let httpClient: jest.Mocked<PcoHttpClient>;
  let pagination: jest.Mocked<PaginationHelper>;
  let emitter: jest.Mocked<PcoEventEmitter>;
  let mod: DummyModule;

  beforeEach(() => {
    httpClient = { request: jest.fn() } as any;
    pagination = { getAllPages: jest.fn(), streamPages: jest.fn() } as any;
    emitter = {} as any;
    mod = new DummyModule(httpClient, pagination, emitter);
  });

  it('getSingle', async () => {
    httpClient.request.mockResolvedValueOnce({ data: { data: { id: '1' } } } as any);
    const res = await mod._getSingle('/x');
    expect(res).toEqual({ id: '1' });
    expect(httpClient.request).toHaveBeenCalledWith(expect.objectContaining({ method: 'GET', endpoint: '/x' }));
  });

  it('getList', async () => {
    httpClient.request.mockResolvedValueOnce({ data: { data: [{ id: '1' }], meta: {}, links: {} } } as any);
    const res = await mod._getList('/x', { a: 'b' });
    expect(res.data[0].id).toBe('1');
    expect(httpClient.request).toHaveBeenCalledWith(expect.objectContaining({ method: 'GET', params: { a: 'b' } }));
  });

  it('createResource', async () => {
    httpClient.request.mockResolvedValueOnce({ data: { data: { id: '2' } } } as any);
    const res = await mod._create('/x', { n: 1 });
    expect(res.id).toBe('2');
    expect(httpClient.request).toHaveBeenCalledWith(expect.objectContaining({ method: 'POST' }));
  });

  it('updateResource', async () => {
    httpClient.request.mockResolvedValueOnce({ data: { data: { id: '3' } } } as any);
    const res = await mod._update('/x/3', { n: 2 });
    expect(res.id).toBe('3');
    expect(httpClient.request).toHaveBeenCalledWith(expect.objectContaining({ method: 'PATCH' }));
  });

  it('deleteResource', async () => {
    httpClient.request.mockResolvedValueOnce({} as any);
    await mod._delete('/x/4');
    expect(httpClient.request).toHaveBeenCalledWith(expect.objectContaining({ method: 'DELETE', endpoint: '/x/4' }));
  });

  it('getAllPages delegates to pagination helper', async () => {
    pagination.getAllPages.mockResolvedValueOnce({ data: [], totalCount: 0, pagesFetched: 0, duration: 0 } as any);
    const res = await mod._getAllPages('/x', { q: 1 }, { perPage: 2 });
    expect(res.pagesFetched).toBe(0);
    expect(pagination.getAllPages).toHaveBeenCalledWith('/x', { q: 1 }, { perPage: 2 });
  });

  it('streamPages delegates to pagination helper', async () => {
    async function* gen() { yield [{ id: 'a' }]; }
    (pagination.streamPages as any).mockReturnValue(gen());
    const pages: any[] = [];
    for await (const page of mod._streamPages('/x')) {
      pages.push(page);
    }
    expect(pages).toHaveLength(1);
    expect(pagination.streamPages).toHaveBeenCalled();
  });
});



