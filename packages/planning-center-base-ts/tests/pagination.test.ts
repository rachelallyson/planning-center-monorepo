import { PaginationHelper } from '../src/pagination';
import type { PcoHttpClient } from '../src/http-client';
import type { HttpResponse } from '../src/http-client-types';

type TestResponseData = Record<string, object | string | number | boolean | null>;

function isPcoHttpClientLike(m: object): m is PcoHttpClient {
  return typeof Object.getOwnPropertyDescriptor(m, 'request')?.value === 'function';
}

function makeMockHttpClient(responses: HttpResponse<TestResponseData | null>[]): PcoHttpClient {
  let callIndex = 0;
  const mock = {
    request: jest.fn().mockImplementation(async () => {
      const res = responses[callIndex];
      callIndex += 1;
      if (!res) throw new Error('Unexpected request');
      return res;
    }),
  };
  if (!isPcoHttpClientLike(mock)) throw new Error('Mock must have request method');
  return mock;
}

describe('PaginationHelper', () => {
  it('returns single page of data when no next link', async () => {
    const response = {
      data: {
        data: [
          { id: '1', type: 'people', attributes: { name: 'A' } },
          { id: '2', type: 'people', attributes: { name: 'B' } },
        ],
        meta: { total_count: 2 },
      },
      status: 200,
      headers: {},
      requestId: 'x',
      duration: 1,
    };
    const client = makeMockHttpClient([response]);
    const helper = new PaginationHelper(client);
    const result = await helper.getAllPages('/people');
    expect(result.data).toHaveLength(2);
    expect(result.totalCount).toBe(2);
    expect(result.pagesFetched).toBe(1);
    expect(result.duration).toBeGreaterThanOrEqual(0);
  });

  it('fetches multiple pages when next link present', async () => {
    const page1 = {
      data: {
        data: [{ id: '1', type: 'people', attributes: {} }],
        meta: { total_count: 3 },
        links: { next: 'https://api.example.com/people?offset=2' },
      },
      status: 200,
      headers: {},
      requestId: 'a',
      duration: 1,
    };
    const page2 = {
      data: {
        data: [
          { id: '2', type: 'people', attributes: {} },
          { id: '3', type: 'people', attributes: {} },
        ],
        meta: { total_count: 3 },
      },
      status: 200,
      headers: {},
      requestId: 'b',
      duration: 1,
    };
    const client = makeMockHttpClient([page1, page2]);
    const helper = new PaginationHelper(client);
    const result = await helper.getAllPages('/people');
    expect(result.data).toHaveLength(3);
    expect(result.totalCount).toBe(3);
    expect(result.pagesFetched).toBe(0);
  });

  it('respects maxPages and stops when using page-based pagination', async () => {
    const page1 = {
      data: {
        data: [{ id: '1', type: 'people', attributes: {} }],
        meta: { total_count: 10 },
        links: { next: 'https://api.example.com/people?page=2' },
      },
      status: 200,
      headers: {},
      requestId: 'a',
      duration: 1,
    };
    const page2 = {
      data: {
        data: [{ id: '2', type: 'people', attributes: {} }],
        meta: { total_count: 10 },
      },
      status: 200,
      headers: {},
      requestId: 'b',
      duration: 1,
    };
    const client = makeMockHttpClient([page1, page2]);
    const helper = new PaginationHelper(client);
    const result = await helper.getAllPages('/people', { maxPages: 2 });
    expect(result.pagesFetched).toBe(2);
    expect(result.data).toHaveLength(2);
  });

  it('calls onProgress with current count and total', async () => {
    const response = {
      data: {
        data: [{ id: '1', type: 'people', attributes: {} }],
        meta: { total_count: 1 },
      },
      status: 200,
      headers: {},
      requestId: 'x',
      duration: 1,
    };
    const client = makeMockHttpClient([response]);
    const helper = new PaginationHelper(client);
    const progressCalls: [number, number][] = [];
    await helper.getAllPages('/people', {
      onProgress: (current, total) => progressCalls.push([current, total]),
    });
    expect(progressCalls.length).toBeGreaterThan(0);
    expect(progressCalls[progressCalls.length - 1]).toEqual([1, 1]);
  });

  it('returns empty data when response data is not an object', async () => {
    const client = makeMockHttpClient([
      { data: null, status: 200, headers: {}, requestId: 'x', duration: 1 },
    ]);
    const helper = new PaginationHelper(client);
    const result = await helper.getAllPages('/people');
    expect(result.data).toEqual([]);
    expect(result.pagesFetched).toBe(1);
  });
});
