import { PeopleModule } from '../../src/modules/people';
import { PaginationHelper, PcoEventEmitter } from '@rachelallyson/planning-center-base-ts';
import type { PcoHttpClient } from '@rachelallyson/planning-center-base-ts';

function createHttpMock() {
  const calls: any[] = [];
  const httpClient: Partial<PcoHttpClient> = {
    request: jest.fn(async (req: any) => {
      calls.push(req);
      return { status: 200, data: { data: [], links: {}, meta: {} }, duration: 0, requestId: 'x' } as any;
    }),
  };
  return { httpClient: httpClient as PcoHttpClient, calls };
}

describe('PeopleModule request building', () => {
  it('getAll builds where/include/pagination params', async () => {
    const { httpClient, calls } = createHttpMock();
    const mod = new PeopleModule(httpClient, new PaginationHelper(httpClient), new PcoEventEmitter());
    await mod.getAll({ where: { status: 'active' }, include: ['emails'], perPage: 50, page: 2 });
    expect(calls[0]).toMatchObject({
      method: 'GET',
      endpoint: '/people',
      params: {
        'where[status]': 'active',
        include: 'emails',
        per_page: 50,
        page: 2,
      },
    });
  });

  it('getById builds include param', async () => {
    const { httpClient, calls } = createHttpMock();
    const mod = new PeopleModule(httpClient, new PaginationHelper(httpClient), new PcoEventEmitter());
    await mod.getById('p1', ['primary_campus']);
    expect(calls[0]).toMatchObject({ method: 'GET', endpoint: '/people/p1', params: { include: 'primary_campus' } });
  });
});



