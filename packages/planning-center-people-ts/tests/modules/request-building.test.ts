import { PeopleModule } from '../../src/modules/people';
import { PaginationHelper, PcoEventEmitter } from '@rachelallyson/planning-center-base-ts';
import type { PcoHttpClient } from '@rachelallyson/planning-center-base-ts';

function createHttpMock() {
  const calls: any[] = [];
  const httpClient: Partial<PcoHttpClient> = {
    request: jest.fn(async (req: any) => {
      calls.push(req);
      // Return response with no next link so getAllPages stops after first page
      return { 
        status: 200, 
        data: { 
          data: [], 
          links: {}, // No next link = no more pages
          meta: { total_count: 0 } 
        }, 
        duration: 0, 
        requestId: 'x' 
      } as any;
    }),
  };
  return { httpClient: httpClient as PcoHttpClient, calls };
}

describe('PeopleModule request building', () => {
  it('getAll builds where/include params and fetches all pages', async () => {
    const { httpClient, calls } = createHttpMock();
    const mod = new PeopleModule(httpClient, new PaginationHelper(httpClient), new PcoEventEmitter());
    await mod.getAll({ where: { status: 'active' }, include: ['emails'], perPage: 50, page: 2 });
    // getAll() now uses getAllPages() which fetches all pages
    // perPage and page options are ignored - it uses default pagination (100 per page)
    // Check that the first call has the correct where/include params
    expect(calls.length).toBeGreaterThan(0);
    expect(calls[0]).toMatchObject({
      method: 'GET',
      endpoint: '/people',
      params: {
        'where[status]': 'active',
        include: 'emails',
        // getAllPages uses its own per_page and page params
        per_page: 100, // default from getAllPages
        page: 1, // starts at page 1
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



