/**
 * Integration test config: creates a real PcoClient from .env.test credentials.
 * Used by tests in tests/integration/ and tests/modules/.
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { PcoClient } from '../../src';
import type { PeopleClientConfig } from '../../src/types/client';

// Load .env.test from package root
config({ path: resolve(__dirname, '../../.env.test'), quiet: true });

function patAuth(): PeopleClientConfig['auth'] | null {
  const pat = process.env.PCO_PERSONAL_ACCESS_TOKEN;
  const patSecret = process.env.PCO_PERSONAL_ACCESS_SECRET;
  if (!pat || !patSecret) return null;
  return { type: 'personal_access_token', personalAccessToken: pat, personalAccessTokenSecret: patSecret };
}

function oauthAuth(): PeopleClientConfig['auth'] | null {
  const accessToken = process.env.PCO_ACCESS_TOKEN;
  if (!accessToken) return null;
  return {
    type: 'oauth',
    accessToken,
    refreshToken: process.env.PCO_REFRESH_TOKEN ?? '',
    onRefresh: () => {},
    onRefreshFailure: () => {},
    clientId: process.env.PCO_APP_ID,
    clientSecret: process.env.PCO_APP_SECRET,
  };
}

function basicAuth(): PeopleClientConfig['auth'] | null {
  const appId = process.env.PCO_APP_ID;
  const appSecret = process.env.PCO_APP_SECRET;
  if (!appId || !appSecret) return null;
  return { type: 'basic', appId, appSecret };
}

function getAuthConfig(): PeopleClientConfig['auth'] | null {
  return patAuth() ?? oauthAuth() ?? basicAuth();
}

/**
 * Create a real PcoClient for integration tests.
 * Throws if no credentials are set in .env.test.
 */
export function createTestClient(): PcoClient {
  const auth = getAuthConfig();
  if (!auth) {
    throw new Error(
      'Missing PCO credentials. Set in .env.test: PCO_PERSONAL_ACCESS_TOKEN + PCO_PERSONAL_ACCESS_SECRET, or PCO_ACCESS_TOKEN, or PCO_APP_ID + PCO_APP_SECRET'
    );
  }
  return new PcoClient({ auth });
}

/**
 * Log which auth method will be used (for debugging). Does not throw.
 */
export function logAuthStatus(): void {
  const auth = getAuthConfig();
  if (auth) {
    const kind = auth.type === 'personal_access_token' ? 'PAT' : auth.type === 'oauth' ? 'OAuth' : 'Basic';
    console.log(`[integration] Auth: ${kind}`);
  } else {
    console.log('[integration] No PCO credentials in .env.test');
  }
}

/**
 * Returns true if credentials are available (for conditional test runs).
 */
export function hasIntegrationCredentials(): boolean {
  return getAuthConfig() !== null;
}
