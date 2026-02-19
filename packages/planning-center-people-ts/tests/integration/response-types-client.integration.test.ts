/**
 * Response-types integration tests: PcoClient (getConfig, updateConfig, getRateLimitInfo).
 * Asserts that client-level methods work against a real API and return the declared types.
 */

import type { RateLimitInfo } from '@rachelallyson/planning-center-base-ts';
import typia from 'typia';
import { PcoClient, type PeopleClientConfig } from '../../src';
import { createTestClient } from './test-config';

describe('Response types: PcoClient', () => {
  let client: PcoClient;

  beforeAll(() => {
    client = createTestClient();
  }, 30000);

  describe('getConfig', () => {
    it('returns config matching PeopleClientConfig', () => {
      const config = client.getConfig();
      typia.assert<PeopleClientConfig>(config);
      expect(config).toHaveProperty('auth');
      expect(config.auth).toBeDefined();
      expect(['personal_access_token', 'oauth', 'basic']).toContain(config.auth.type);
    });
  });

  describe('updateConfig', () => {
    it('updates config and getConfig reflects changes', () => {
      const before = client.getConfig();
      expect(before.debug).toBeFalsy();

      client.updateConfig({ debug: true });
      const after = client.getConfig();
      typia.assert<PeopleClientConfig>(after);
      expect(after.debug).toBe(true);

      client.updateConfig({ debug: false });
      const restored = client.getConfig();
      expect(restored.debug).toBeFalsy();
    });
  });

  describe('getRateLimitInfo', () => {
    it('returns rate limit info matching RateLimitInfo after a request', async () => {
      await client.people.getPage({ per_page: 1 });
      const info = client.getRateLimitInfo();
      typia.assert<RateLimitInfo>(info);
      expect(info).toHaveProperty('limit');
      expect(info).toHaveProperty('remaining');
      expect(info).toHaveProperty('resetTime');
      expect(typeof info.limit).toBe('number');
      expect(typeof info.remaining).toBe('number');
      expect(typeof info.resetTime).toBe('number');
    });
  });
});
