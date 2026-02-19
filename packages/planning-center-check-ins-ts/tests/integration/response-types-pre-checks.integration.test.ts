/**
 * Response-types integration tests: Pre-checks module.
 * Pre-checks API may return 404 when Church Center PreCheck is not enabled for the org.
 * Run with: npm run test:integration
 */

import typia from 'typia';
import { PcoCheckInsClient } from '../../src';
import { createTestClient, isPreChecksApiAvailable } from './test-config';
import type { ResolvedReturnType } from './response-types-helpers';

describe('Response types: Pre-checks', () => {
  let client: PcoCheckInsClient;
  let preChecksAvailable: boolean;

  beforeAll(async () => {
    client = createTestClient();
    preChecksAvailable = await isPreChecksApiAvailable(client);
  }, 30000);

  describe('PreChecks', () => {
    it('getPage response matches declared return type', async () => {
      expect(preChecksAvailable).toBe(true);
      const res = await client.preChecks.getPage({ per_page: 1, page: 1 });
      typia.assert<ResolvedReturnType<typeof client.preChecks.getPage>>(res);
    });

    it('getById response matches declared return type', async () => {
      expect(preChecksAvailable).toBe(true);
      const page = await client.preChecks.getPage({ per_page: 1, page: 1 });
      expect(page.data.length).toBeGreaterThan(0);
      const id = page.data[0].id;
      expect(id).toBeTruthy();
      const res = await client.preChecks.getById(id);
      typia.assert<ResolvedReturnType<typeof client.preChecks.getById>>(res);
    });
  });
});
