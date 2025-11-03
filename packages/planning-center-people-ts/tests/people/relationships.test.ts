import { PeopleModule } from '../../src/modules/people';
import { PaginationHelper, PcoEventEmitter } from '@rachelallyson/planning-center-base-ts';
import type { PcoHttpClient } from '@rachelallyson/planning-center-base-ts';

function createHttpMock() {
  const calls: any[] = [];
  const httpClient: Partial<PcoHttpClient> = {
    request: jest.fn(async (req: any) => {
      calls.push(req);
      // Return minimal envelope
      return { status: 200, data: { data: {}, links: {}, meta: {} }, duration: 0, requestId: 'x' } as any;
    }),
  };
  return { httpClient: httpClient as PcoHttpClient, calls };
}

describe('PeopleModule relationship guards', () => {
  it('getPrimaryCampus returns null when relationship missing', async () => {
    const { httpClient } = createHttpMock();
    const mod = new PeopleModule(httpClient, new PaginationHelper(httpClient), new PcoEventEmitter());
    // Stub getById to return no primary_campus
    jest.spyOn(mod, 'getById').mockResolvedValue({ id: 'p1', type: 'Person', relationships: {} } as any);
    const res = await mod.getPrimaryCampus('p1');
    expect(res).toBeNull();
  });

  it('getHousehold returns null when relationship missing', async () => {
    const { httpClient } = createHttpMock();
    const mod = new PeopleModule(httpClient, new PaginationHelper(httpClient), new PcoEventEmitter());
    jest.spyOn(mod, 'getById').mockResolvedValue({ id: 'p1', type: 'Person', relationships: {} } as any);
    const res = await mod.getHousehold('p1');
    expect(res).toBeNull();
  });
});



