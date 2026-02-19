/**
 * Response-types integration tests: Organization module.
 * Asserts against the resolved return type of each function under test.
 * Run with: npm run test:integration
 */

import typia from 'typia';
import { PcoCheckInsClient } from '../../src';
import { createTestClient } from './test-config';
import type { ResolvedReturnType } from './response-types-helpers';

describe('Response types: Organization', () => {
  let client: PcoCheckInsClient;

  beforeAll(async () => {
    client = createTestClient();
  }, 30000);

  describe('Organization', () => {
    it('get response matches declared return type', async () => {
      const res = await client.organization.get();
      typia.assert<ResolvedReturnType<typeof client.organization.get>>(res);
    });
  });
});
