# Testing

**Goal: find bugs.** Integration tests run against the real API. When they fail, fix the **application code** (or types), not the tests or mocks.

## Default: unit tests only (`npm test`)

`npm test` runs **unit tests only**, with `ky` and OAuth2 mocked so no real API calls are made. The following are excluded (they need the real API to be meaningful):

- **`tests/integration/`** – All integration tests
- **`tests/modules/`** – Module-level tests that use `createTestClient()`
- **`tests/matching/scoring.test.ts`** and **`tests/matching/multi-step.test.ts`** – Integration-style matching tests

The shared ky mock is **minimal**: it returns basic JSON:API shapes (list with one item, single resource, 404 for id `999999999`) so unit tests that touch the client don’t crash. It does **not** simulate full API behavior.

## Integration tests: real API, no mocks (`npm run test:integration`)

Integration tests run with **Vitest** and use the **real** `ky` and Planning Center People API (no mocks):

```bash
npm run test:integration
```

Requires credentials in `.env.test`. Supported options (see `tests/integration/test-config.ts`):
- **Personal Access Token:** `PCO_PERSONAL_ACCESS_TOKEN` and optionally `PCO_PERSONAL_ACCESS_SECRET`
- **OAuth:** `PCO_ACCESS_TOKEN` (and optionally `PCO_REFRESH_TOKEN`, `PCO_APP_ID`, `PCO_APP_SECRET`)
- **Basic:** `PCO_APP_ID` and `PCO_APP_SECRET`

**When an integration test fails:** treat it as a potential bug in application code (parsing, types, error handling, retry logic, etc.). Fix the code or types.

## Where tests live

- **`tests/helpers/`**, **`tests/matching/matcher*.test.ts`**, **`tests/v2-client.test.ts`**, etc. – Unit tests (run with `npm test`, mocked).
- **`tests/modules/`**, **`tests/integration/`**, **`tests/matching/scoring.test.ts`**, **`multi-step.test.ts`** – Integration-style; run with `npm run test:integration` (real API).
- **`tests/integration/response-types.integration.test.ts`** – Jest-style Vitest + Typia tests that assert every list/single response matches its declared type (PeopleList, PersonSingle, etc.).
