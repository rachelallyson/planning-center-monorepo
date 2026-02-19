/**
 * Shared mock for @badgateway/oauth2-client (used by PcoHttpClient for OAuth refresh).
 * Consumed by this package and by @rachelallyson/planning-center-people-ts tests.
 */

export class OAuth2Client {
  constructor(_config: unknown) {}
}

export class OAuth2Fetch {
  constructor(_options: unknown) {}
  fetch = jest.fn((_input: RequestInfo | URL, _init?: RequestInit) =>
    Promise.resolve(new Response('{}', { status: 200 }))
  );
}
