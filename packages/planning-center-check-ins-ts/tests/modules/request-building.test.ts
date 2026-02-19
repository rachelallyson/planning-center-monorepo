import { EventsModule } from '../../src/modules/events';
import { CheckInsModule } from '../../src/modules/check-ins';
import { PaginationHelper } from '@rachelallyson/planning-center-base-ts';
import { createHttpClientMock } from '../helpers/http-mock';

describe('Modules request building (spot checks)', () => {
  it('EventsModule.getAll builds correct params', async () => {
    const { httpClient, calls } = createHttpClientMock();
    const pagination = new PaginationHelper(httpClient);
    const mod = new EventsModule(httpClient, pagination);

    await mod.getAll({ where: { name: 'Test' }, include: ['attendance_types'], per_page: 5, page: 2 });

    // getAll uses getAllPages; base pagination uses per_page: 100 and page 1 for first request
    expect(calls[0].method).toBe('GET');
    expect(calls[0].endpoint).toBe('/events');
    const params = calls[0].params || {};
    expect(params.page).toBe(1);
    expect(params.per_page).toBe(100);
    const include = Array.isArray(params.include) ? params.include.join(',') : params.include;
    expect(include).toBe('attendance_types');
    // Serialized where from buildQueryParams is where[name]
    expect(params['where[name]']).toBe('Test');
  });

  it('EventsModule.getById builds path and include', async () => {
    const { httpClient, calls } = createHttpClientMock();
    const pagination = new PaginationHelper(httpClient);
    const mod = new EventsModule(httpClient, pagination);

    await mod.getById('abc', { include: ['attendance_types'] });

    expect(calls[0]).toMatchObject({
      method: 'GET',
      endpoint: '/events/abc',
      params: { include: 'attendance_types' },
    });
  });

  it('CheckInsModule.getAll applies filters and pagination', async () => {
    const { httpClient, calls } = createHttpClientMock();
    const pagination = new PaginationHelper(httpClient);
    const mod = new CheckInsModule(httpClient, pagination);

    await mod.getAll({
      where: { created_at: '2020-01-01T00:00:00Z' },
      include: ['event'],
      per_page: 25,
      page: 3,
      filter: ['attendee', 'volunteer'],
    });

    // getAll uses getAllPages; first request has page 1, per_page 100; filter becomes boolean true
    expect(calls[0]).toMatchObject({
      method: 'GET',
      endpoint: '/check_ins',
      params: expect.objectContaining({
        'where[created_at]': '2020-01-01T00:00:00Z',
        include: 'event',
        attendee: true,
        volunteer: true,
        page: 1,
        per_page: 100,
      }),
    });
  });
});


