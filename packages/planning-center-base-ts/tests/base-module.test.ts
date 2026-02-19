import { BaseModule } from '../src/base-module';
import type { PcoHttpClient } from '../src/http-client';
import type { PaginationHelper } from '../src/pagination';
import type { HttpResponse } from '../src/http-client-types';

/** Test response data shape (avoids forbidden unknown) */
type TestResponseData = Record<string, object | string | number | boolean | null>;

class TestModule extends BaseModule {
  async getOne(id: string) {
    return this.getSingle(`/things/${id}`);
  }

  async getMany(options?: { per_page?: number }) {
    return this.getList('/things', options);
  }

  async createOne(body: object) {
    return this.createResource('/things', body);
  }

  async updateOne(id: string, body: object) {
    return this.updateResource(`/things/${id}`, body);
  }

  async removeOne(id: string) {
    return this.deleteResource(`/things/${id}`);
  }

  async fetchAllPages(options?: { per_page?: number }) {
    return this.getAllPages('/things', options);
  }
}

function isPcoHttpClientLike(m: object): m is PcoHttpClient {
  return typeof Object.getOwnPropertyDescriptor(m, 'request')?.value === 'function';
}

function makeMockHttpClient(responses: HttpResponse<TestResponseData>[]): PcoHttpClient {
  let i = 0;
  const mock = {
    request: jest.fn().mockImplementation(async () => {
      const res = responses[i];
      i += 1;
      if (!res) throw new Error('Unexpected request');
      return res;
    }),
  };
  if (!isPcoHttpClientLike(mock)) throw new Error('Mock must have request method');
  return mock;
}

function isPaginationHelperLike(m: object): m is PaginationHelper {
  return typeof Object.getOwnPropertyDescriptor(m, 'getAllPages')?.value === 'function';
}

function makeMockPaginationHelper(result: { data: object[]; totalCount: number; pagesFetched: number; duration: number }): PaginationHelper {
  const mock = { getAllPages: jest.fn().mockResolvedValue(result) };
  if (!isPaginationHelperLike(mock)) throw new Error('Mock must have getAllPages method');
  return mock;
}

describe('BaseModule', () => {
  it('getSingle returns flattened resource from doc', async () => {
    const response: HttpResponse<TestResponseData> = {
      data: {
        data: {
          id: '1',
          type: 'things',
          attributes: { name: 'First' },
        },
      },
      status: 200,
      headers: {},
      requestId: 'x',
      duration: 1,
    };
    const http = makeMockHttpClient([response]);
    const pagination = makeMockPaginationHelper({ data: [], totalCount: 0, pagesFetched: 0, duration: 0 });
    const module = new TestModule(http, pagination);
    const out = await module.getOne('1');
    expect(out).toMatchObject({ id: '1', type: 'things', name: 'First' });
    expect(http.request).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'GET', endpoint: '/things/1' }),
    );
  });

  it('getSingle throws when response has no data', async () => {
    const response: HttpResponse<TestResponseData> = {
      data: {},
      status: 200,
      headers: {},
      requestId: 'x',
      duration: 1,
    };
    const http = makeMockHttpClient([response]);
    const pagination = makeMockPaginationHelper({ data: [], totalCount: 0, pagesFetched: 0, duration: 0 });
    const module = new TestModule(http, pagination);
    await expect(module.getOne('1')).rejects.toThrow(/Expected single-resource/);
  });

  it('getList returns data array and passes options as params', async () => {
    const response: HttpResponse<TestResponseData> = {
      data: {
        data: [
          { id: '1', type: 'things', attributes: { name: 'A' } },
          { id: '2', type: 'things', attributes: { name: 'B' } },
        ],
      },
      status: 200,
      headers: {},
      requestId: 'x',
      duration: 1,
    };
    const http = makeMockHttpClient([response]);
    const pagination = makeMockPaginationHelper({ data: [], totalCount: 0, pagesFetched: 0, duration: 0 });
    const module = new TestModule(http, pagination);
    const out = await module.getMany({ per_page: 10 });
    expect(out.data).toHaveLength(2);
    expect(out.data[0]).toMatchObject({ id: '1', name: 'A' });
    expect(http.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        endpoint: '/things',
        params: expect.objectContaining({ per_page: 10 }),
      }),
    );
  });

  it('createResource sends POST and returns created resource', async () => {
    const response: HttpResponse<TestResponseData> = {
      data: {
        data: {
          id: '3',
          type: 'things',
          attributes: { name: 'New' },
        },
      },
      status: 201,
      headers: {},
      requestId: 'x',
      duration: 1,
    };
    const http = makeMockHttpClient([response]);
    const pagination = makeMockPaginationHelper({ data: [], totalCount: 0, pagesFetched: 0, duration: 0 });
    const module = new TestModule(http, pagination);
    const out = await module.createOne({ name: 'New' });
    expect(out.data).toMatchObject({ id: '3', type: 'things', name: 'New' });
    expect(http.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        endpoint: '/things',
        data: { name: 'New' },
      }),
    );
  });

  it('updateResource sends PATCH and returns updated resource', async () => {
    const response: HttpResponse<TestResponseData> = {
      data: {
        data: {
          id: '1',
          type: 'things',
          attributes: { name: 'Updated' },
        },
      },
      status: 200,
      headers: {},
      requestId: 'x',
      duration: 1,
    };
    const http = makeMockHttpClient([response]);
    const pagination = makeMockPaginationHelper({ data: [], totalCount: 0, pagesFetched: 0, duration: 0 });
    const module = new TestModule(http, pagination);
    const out = await module.updateOne('1', { name: 'Updated' });
    expect(out).toMatchObject({ id: '1', name: 'Updated' });
    expect(http.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'PATCH',
        endpoint: '/things/1',
        data: { name: 'Updated' },
      }),
    );
  });

  it('deleteResource sends DELETE', async () => {
    const response: HttpResponse<TestResponseData> = {
      data: {},
      status: 204,
      headers: {},
      requestId: 'x',
      duration: 1,
    };
    const http = makeMockHttpClient([response]);
    const pagination = makeMockPaginationHelper({ data: [], totalCount: 0, pagesFetched: 0, duration: 0 });
    const module = new TestModule(http, pagination);
    await module.removeOne('1');
    expect(http.request).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'DELETE', endpoint: '/things/1' }),
    );
  });

  it('getAllPages delegates to paginationHelper and returns typed data', async () => {
    const flattened = [
      { id: '1', type: 'things', name: 'A' },
      { id: '2', type: 'things', name: 'B' },
    ];
    const pagination = makeMockPaginationHelper({
      data: flattened,
      totalCount: 2,
      pagesFetched: 1,
      duration: 50,
    });
    const http = makeMockHttpClient([]);
    const module = new TestModule(http, pagination);
    const result = await module.fetchAllPages();
    expect(result.data).toHaveLength(2);
    expect(result.totalCount).toBe(2);
    expect(result.pagesFetched).toBe(1);
    expect(pagination.getAllPages).toHaveBeenCalledWith('/things', {});
  });
});
