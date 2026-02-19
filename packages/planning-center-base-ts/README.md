# @rachelallyson/planning-center-base-ts

Base TypeScript client library for Planning Center Online APIs. This package provides shared infrastructure (HTTP client, authentication, rate limiting, error handling, JSON:API types) that can be used by specific PCO API clients like the People API or Check-ins API.

## Installation

```bash
npm install @rachelallyson/planning-center-base-ts
```

## Usage

This package is primarily intended as a dependency for other PCO API packages. It provides:

- **HTTP Client** (`PcoHttpClient`) - Handles HTTP requests with authentication, rate limiting, and error handling
- **Pagination Helper** (`PaginationHelper`) - Utilities for paginated API responses
- **Base Module** (`BaseModule`) - Abstract base class for API modules
- **Rate Limiter** (`PcoRateLimiter`) - Enforces PCO API rate limits
- **Error Handling** - Comprehensive error types and handling utilities
- **JSON:API Types** - TypeScript types for JSON:API 1.0 specification
- **Debug logging** - Optional request/response logging when `config.debug` is set

## Example

```typescript
import { 
  PcoHttpClient, 
  PaginationHelper,
  BaseModule,
  type PcoClientConfig 
} from '@rachelallyson/planning-center-base-ts';

const config: PcoClientConfig = {
  auth: {
    type: 'personal_access_token',
    personalAccessToken: 'your-token'
  },
  baseURL: 'https://api.planningcenteronline.com/people/v2'
};

const httpClient = new PcoHttpClient(config);
const paginationHelper = new PaginationHelper(httpClient);

const response = await httpClient.request({
  method: 'GET',
  endpoint: '/people'
});
```

## Building API Clients

To build a custom API client, extend `BaseModule`:

```typescript
import { BaseModule, type PcoHttpClient, type PaginationHelper, type PcoClientConfig } from '@rachelallyson/planning-center-base-ts';

export class MyApiModule extends BaseModule {
  constructor(
    httpClient: PcoHttpClient,
    paginationHelper: PaginationHelper,
    getConfig?: () => PcoClientConfig
  ) {
    super(httpClient, paginationHelper, getConfig);
  }

  async getResource(id: string) {
    return this.getSingle(`/resources/${id}`);
  }

  async listResources() {
    return this.getAllPages('/resources');
  }
}
```

## Debug logging

When `config.debug` is set, the HTTP client logs each request (start, complete, error). No setup is required beyond adding `debug: true` or `debug: { prefix?, includePayloads?, onLog? }` to `PcoClientConfig`. Use `createDebugLogger(config)` in your modules for one-off debug messages.

## Query parameters and API alignment

`QueryOptions` (include, order, where, per_page, page) match the Planning Center API URL parameters documented per vertex (e.g. [Person vertex](https://developer.planning.center/docs/#/apps/people/2025-11-10/vertices/person): Can Include, Order By, Query By, per_page, offset). Integration tests that verify this against the live API live in the People package: `planning-center-people-ts/tests/integration/base-query-params-api-alignment.integration.test.ts`. Run them with `npm run test:integration` from the People package (requires `.env.test` with PCO credentials).

## Testing

We prefer **integration tests** and avoid mocks except where necessary.

- **`npm test`** – Unit tests. Uses **real** `ky` and `@badgateway/oauth2-client` (Jest transforms ESM). Only **fetch** is mocked so we can simulate responses without the network. Fast.
- **`npm run test:integration`** – Integration test: **no mocks**. Real HTTP server, real fetch, real ky, real OAuth2 client. Exercises the full request path; prefer adding coverage here when possible.

## Monorepo

This package is part of the Planning Center monorepo. For development, see the root [README.md](../../README.md).

## Publishing

To publish this package:

```bash
cd packages/planning-center-base-ts
npm run build
npm publish
```

## License

MIT
