/**
 * Response-types integration tests: Locations module.
 * Asserts against the resolved return type of each function under test.
 * Run with: npm run test:integration
 */

import typia from 'typia';
import { PcoCheckInsClient } from '../../src';
import { createTestClient } from './test-config';
import { fetchIds, type IntegrationIds, type ResolvedReturnType } from './response-types-helpers';

describe('Response types: Locations', () => {
  let client: PcoCheckInsClient;
  let ids: IntegrationIds;

  beforeAll(async () => {
    client = createTestClient();
    ids = await fetchIds(client);
  }, 30000);

  describe('Locations', () => {
    it('getAll response matches declared return type', async () => {
      const res = await client.locations.getAll();
      typia.assert<ResolvedReturnType<typeof client.locations.getAll>>(res);
    }, 300000);

    it('getPage response matches declared return type', async () => {
      const res = await client.locations.getPage({ per_page: 1 });
      typia.assert<ResolvedReturnType<typeof client.locations.getPage>>(res);
    });

    it('getById response matches declared return type', async () => {
      expect(ids.locationId).toBeTruthy();
      const res = await client.locations.getById(ids.locationId);
      typia.assert<ResolvedReturnType<typeof client.locations.getById>>(res);
    });

    it('getLocationEventPeriods response matches declared return type', async () => {
      expect(ids.locationId).toBeTruthy();
      const res = await client.locations.getLocationEventPeriods(ids.locationId);
      typia.assert<ResolvedReturnType<typeof client.locations.getLocationEventPeriods>>(res);
    });

    it('getLocationEventTimes response matches declared return type', async () => {
      expect(ids.locationId).toBeTruthy();
      const res = await client.locations.getLocationEventTimes(ids.locationId);
      typia.assert<ResolvedReturnType<typeof client.locations.getLocationEventTimes>>(res);
    });

    it('getLocationLabels response matches declared return type', async () => {
      expect(ids.locationId).toBeTruthy();
      const res = await client.locations.getLocationLabels(ids.locationId);
      typia.assert<ResolvedReturnType<typeof client.locations.getLocationLabels>>(res);
    });
  });
});
