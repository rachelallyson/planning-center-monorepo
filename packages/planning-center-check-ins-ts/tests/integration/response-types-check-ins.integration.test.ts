/**
 * Response-types integration tests: Check-ins module.
 * Asserts against the resolved return type of each function under test.
 * Run with: npm run test:integration
 */

import typia from 'typia';
import { PcoCheckInsClient } from '../../src';
import { createTestClient } from './test-config';
import { fetchIds, type IntegrationIds, type ResolvedReturnType } from './response-types-helpers';

describe('Response types: Check-ins', () => {
  let client: PcoCheckInsClient;
  let ids: IntegrationIds;

  beforeAll(async () => {
    client = createTestClient();
    ids = await fetchIds(client);
  }, 30000);

  describe('CheckIns', () => {
    it('getAll response matches declared return type', async () => {
      const res = await client.checkIns.getAll();
      typia.assert<ResolvedReturnType<typeof client.checkIns.getAll>>(res);
    }, 300000);

    it('getPage response matches declared return type', async () => {
      const res = await client.checkIns.getPage({ per_page: 1 });
      typia.assert<ResolvedReturnType<typeof client.checkIns.getPage>>(res);
    });

    it('getById response matches declared return type', async () => {
      expect(ids.checkInId).toBeTruthy();
      const res = await client.checkIns.getById(ids.checkInId);
      typia.assert<ResolvedReturnType<typeof client.checkIns.getById>>(res);
    });

    it('getCheckInGroup response matches declared return type', async () => {
      expect(ids.checkInId).toBeTruthy();
      const res = await client.checkIns.getCheckInGroup(ids.checkInId);
      typia.assert<ResolvedReturnType<typeof client.checkIns.getCheckInGroup>>(res);
    });

    it('getCheckInTimes response matches declared return type', async () => {
      expect(ids.checkInId).toBeTruthy();
      const res = await client.checkIns.getCheckInTimes(ids.checkInId);
      typia.assert<ResolvedReturnType<typeof client.checkIns.getCheckInTimes>>(res);
    });

    it('getCheckedInAt response matches declared return type', async () => {
      expect(ids.checkInId).toBeTruthy();
      const res = await client.checkIns.getCheckedInAt(ids.checkInId);
      typia.assert<ResolvedReturnType<typeof client.checkIns.getCheckedInAt>>(res);
    });

    it('getCheckedInBy response matches declared return type', async () => {
      expect(ids.checkInId).toBeTruthy();
      const res = await client.checkIns.getCheckedInBy(ids.checkInId);
      typia.assert<ResolvedReturnType<typeof client.checkIns.getCheckedInBy>>(res);
    });

    it('getCheckedOutBy response matches declared return type', async () => {
      expect(ids.checkInId).toBeTruthy();
      const res = await client.checkIns.getCheckedOutBy(ids.checkInId);
      typia.assert<ResolvedReturnType<typeof client.checkIns.getCheckedOutBy>>(res);
    });

    it('getEvent response matches declared return type', async () => {
      expect(ids.checkInId).toBeTruthy();
      const res = await client.checkIns.getEvent(ids.checkInId);
      typia.assert<ResolvedReturnType<typeof client.checkIns.getEvent>>(res);
    });

    it('getEventPeriod response matches declared return type', async () => {
      expect(ids.checkInId).toBeTruthy();
      const res = await client.checkIns.getEventPeriod(ids.checkInId);
      typia.assert<ResolvedReturnType<typeof client.checkIns.getEventPeriod>>(res);
    });

    it('getEventTimes response matches declared return type', async () => {
      expect(ids.checkInId).toBeTruthy();
      const res = await client.checkIns.getEventTimes(ids.checkInId, { per_page: 1 });
      typia.assert<ResolvedReturnType<typeof client.checkIns.getEventTimes>>(res);
    });

    it('getLocations response matches declared return type', async () => {
      expect(ids.checkInId).toBeTruthy();
      const res = await client.checkIns.getLocations(ids.checkInId);
      typia.assert<ResolvedReturnType<typeof client.checkIns.getLocations>>(res);
    });

    it('getOptions response matches declared return type', async () => {
      expect(ids.checkInId).toBeTruthy();
      const res = await client.checkIns.getOptions(ids.checkInId);
      typia.assert<ResolvedReturnType<typeof client.checkIns.getOptions>>(res);
    });

    it('getPerson response matches declared return type', async () => {
      expect(ids.checkInId).toBeTruthy();
      const res = await client.checkIns.getPerson(ids.checkInId);
      typia.assert<ResolvedReturnType<typeof client.checkIns.getPerson>>(res);
    });
  });
});
