/**
 * Debug script: run one create (person + email) with debug logging to see the exact
 * API response shape (whether data is array or object, length, Location header).
 *
 * Usage (from packages/planning-center-people-ts):
 *   npx dotenv -e .env.test -- npx tsx scripts/debug-create-response.ts
 *
 * Auth (same order as integration tests; use PAT to avoid OAuth refresh issues):
 *   1. PCO_PERSONAL_ACCESS_TOKEN (and optionally PCO_PERSONAL_ACCESS_SECRET) — recommended for this script
 *   2. PCO_ACCESS_TOKEN (OAuth; needs valid PCO_REFRESH_TOKEN if token is expired)
 *   3. PCO_APP_ID + PCO_APP_SECRET (Basic)
 */
import 'dotenv/config';
import { PcoClient, type PeopleClientConfig } from '../src';

function buildConfig(): PeopleClientConfig {
  const debug = { prefix: '[PCO]', includePayloads: true };
  if (process.env.PCO_PERSONAL_ACCESS_TOKEN) {
    return { auth: patAuth(), debug };
  }
  if (process.env.PCO_ACCESS_TOKEN) {
    return { auth: oauthAuth(), debug };
  }
  if (process.env.PCO_APP_ID && process.env.PCO_APP_SECRET) {
    return { auth: basicAuth(), debug };
  }
  throw new Error(
    'Set one of: PCO_PERSONAL_ACCESS_TOKEN, PCO_ACCESS_TOKEN, or PCO_APP_ID+PCO_APP_SECRET in .env.test'
  );
}

function patAuth(): PeopleClientConfig['auth'] {
  return {
    type: 'personal_access_token',
    personalAccessToken: process.env.PCO_PERSONAL_ACCESS_TOKEN!,
    personalAccessTokenSecret: process.env.PCO_PERSONAL_ACCESS_SECRET,
  };
}

function oauthAuth(): PeopleClientConfig['auth'] {
  return {
    type: 'oauth',
    accessToken: process.env.PCO_ACCESS_TOKEN!,
    refreshToken: process.env.PCO_REFRESH_TOKEN ?? 'debug-refresh',
    onRefresh: () => {},
    onRefreshFailure: () => {},
  };
}

function basicAuth(): PeopleClientConfig['auth'] {
  return {
    type: 'basic',
    appId: process.env.PCO_APP_ID!,
    appSecret: process.env.PCO_APP_SECRET!,
  };
}

async function main() {
  const client = new PcoClient(buildConfig());

  const unique = Date.now();
  console.log('\n--- Create person (watch for "response shape" and "response body" above) ---\n');
  const person = await client.people.create({
    first_name: `Debug_${unique}`,
    last_name: `Response_${unique}`,
  });
  console.log('Returned person id:', person.id, 'name:', 'first_name' in person ? person.first_name : undefined);

  console.log('\n--- Create email for that person ---\n');
  const email = await client.people.addEmail(person.id, {
    address: `debug-${unique}@example.com`,
    location: 'Work',
    primary: true,
  });
  console.log('Returned email id:', email.id, 'address:', 'address' in email ? email.address : undefined);

  console.log('\nDone. Check logs above for dataShape (object vs array[N]) and full response body.\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
