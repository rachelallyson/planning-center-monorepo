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
- **Event System** - Event emitter for monitoring and debugging
- **Batch Operations** - Batch executor for performing multiple operations

## Example

```typescript
import { 
  PcoHttpClient, 
  PcoEventEmitter, 
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

const eventEmitter = new PcoEventEmitter();
const httpClient = new PcoHttpClient(config, eventEmitter);
const paginationHelper = new PaginationHelper(httpClient);

// Use the HTTP client to make requests
const response = await httpClient.request({
  method: 'GET',
  endpoint: '/people'
});
```

## Building API Clients

To build a custom API client, extend `BaseModule`:

```typescript
import { BaseModule, type PcoHttpClient, type PaginationHelper, type PcoEventEmitter } from '@rachelallyson/planning-center-base-ts';

export class MyApiModule extends BaseModule {
  async getResource(id: string) {
    return this.getSingle(`/resources/${id}`);
  }
  
  async listResources() {
    return this.getList('/resources');
  }
}
```

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
