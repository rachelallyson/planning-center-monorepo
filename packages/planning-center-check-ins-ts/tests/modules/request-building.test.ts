import { EventsModule } from '../../src/modules/events';
import { CheckInsModule } from '../../src/modules/check-ins';
import { PaginationHelper, PcoEventEmitter } from '@rachelallyson/planning-center-base-ts';
import { createHttpClientMock } from '../helpers/http-mock';

describe('Modules request building (spot checks)', () => {
  it('EventsModule.getAll builds correct params', async () => {
    const { httpClient, calls } = createHttpClientMock();
    const pagination = new PaginationHelper(httpClient);
    const emitter = new PcoEventEmitter();
    const mod = new EventsModule(httpClient, pagination, emitter);

    await mod.getAll({ where: { status: 'active' }, include: ['event_periods', 'event_times'], perPage: 5, page: 2 });

    expect(calls[0]).toMatchObject({
      method: 'GET',
      endpoint: '/check-ins/v2/events',
      params: {
        'where[status]': 'active',
        include: 'event_periods,event_times',
        per_page: 5,
        page: 2,
      },
    });
  });

  it('EventsModule.getById builds path and include', async () => {
    const { httpClient, calls } = createHttpClientMock();
    const pagination = new PaginationHelper(httpClient);
    const emitter = new PcoEventEmitter();
    const mod = new EventsModule(httpClient, pagination, emitter);

    await mod.getById('abc', ['event_times']);

    expect(calls[0]).toMatchObject({
      method: 'GET',
      endpoint: '/check-ins/v2/events/abc',
      params: { include: 'event_times' },
    });
  });

  it('CheckInsModule.getAll applies filters and pagination', async () => {
    const { httpClient, calls } = createHttpClientMock();
    const pagination = new PaginationHelper(httpClient);
    const emitter = new PcoEventEmitter();
    const mod = new CheckInsModule(httpClient, pagination, emitter);

    await mod.getAll({
      where: { status: 'closed' },
      include: ['event'],
      perPage: 25,
      page: 3,
      filter: ['attendee', 'volunteer'],
    });

    expect(calls[0]).toMatchObject({
      method: 'GET',
      endpoint: '/check-ins/v2/check_ins',
      params: {
        'where[status]': 'closed',
        include: 'event',
        per_page: 25,
        page: 3,
        attendee: 'true',
        volunteer: 'true',
      },
    });
  });
});


