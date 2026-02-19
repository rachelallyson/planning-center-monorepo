/**
 * Response-types integration tests: Event times module.
 * Asserts against the resolved return type of each function under test.
 * Run with: npm run test:integration
 */

import typia from 'typia';
import { PcoCheckInsClient } from '../../src';
import { createTestClient } from './test-config';
import { fetchIds, type IntegrationIds, type ResolvedReturnType } from './response-types-helpers';

describe('Response types: Event times', () => {
  let client: PcoCheckInsClient;
  let ids: IntegrationIds;

  beforeAll(async () => {
    client = createTestClient();
    ids = await fetchIds(client);
  }, 30000);

  describe('EventTimes', () => {
    it('getAll response matches declared return type', async () => {
      const res = await client.eventTimes.getAll();
      typia.assert<ResolvedReturnType<typeof client.eventTimes.getAll>>(res);
    }, 300000);

    it('getPage response matches declared return type', async () => {
      const res = await client.eventTimes.getPage({ per_page: 1 });
      typia.assert<ResolvedReturnType<typeof client.eventTimes.getPage>>(res);
    });

    it('getById response matches declared return type', async () => {
      expect(ids.eventTimeId).toBeTruthy();
      const res = await client.eventTimes.getById(ids.eventTimeId);
      typia.assert<ResolvedReturnType<typeof client.eventTimes.getById>>(res);
    });

    it('getEvent response matches declared return type', async () => {
      expect(ids.eventTimeId).toBeTruthy();
      const res = await client.eventTimes.getEvent(ids.eventTimeId);
      typia.assert<ResolvedReturnType<typeof client.eventTimes.getEvent>>(res);
    });

    it('getEventPeriod response matches declared return type', async () => {
      expect(ids.eventTimeId).toBeTruthy();
      const res = await client.eventTimes.getEventPeriod(ids.eventTimeId);
      typia.assert<ResolvedReturnType<typeof client.eventTimes.getEventPeriod>>(res);
    });

    it('getLocationEventTimes response matches declared return type', async () => {
      expect(ids.eventTimeId).toBeTruthy();
      const res = await client.eventTimes.getLocationEventTimes(ids.eventTimeId);
      typia.assert<ResolvedReturnType<typeof client.eventTimes.getLocationEventTimes>>(res);
    });

    it('getCheckIns response matches declared return type', async () => {
      expect(ids.eventTimeId).toBeTruthy();
      const res = await client.eventTimes.getCheckIns(ids.eventTimeId);
      typia.assert<ResolvedReturnType<typeof client.eventTimes.getCheckIns>>(res);
    });
  });
});
