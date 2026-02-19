# @rachelallyson/planning-center-people-ts

A modern, type-safe TypeScript library for interacting with the Planning Center Online People API. Built with a class-based architecture, comprehensive error handling, and advanced features like person matching.

> **📖 For the latest documentation and examples, see the [Monorepo Documentation Site](../../docs/content/index.mdx)**

## Features

- ✅ **Strict TypeScript**: Full type safety with no `any` types
- ✅ **JSON:API 1.0 Compliant**: Follows the JSON:API specification exactly
- ✅ **Class-based API**: `PcoClient` with modules (`people`, `contacts`, `workflows`, etc.)
- ✅ **Rate Limiting**: Built-in rate limiting with PCO's 100 req/20s policy
- ✅ **Modern HTTP**: Uses native fetch API (no external dependencies)
- ✅ **Authentication**: Supports both Personal Access Tokens and OAuth 2.0
- ✅ **Error Handling**: `PcoApiError` with status and JSON:API error details; check `error.status` (401, 422, 429, etc.)
- ✅ **Request Timeouts**: Optional `timeout` in config
- ✅ **Pagination**: Automatic pagination support
- ✅ **File Upload Handling**: Intelligent file upload detection and processing for custom fields
- ✅ **No Index Signatures**: Clean type definitions without index signatures

## Installation

```bash
npm install @planning-center-people-ts
```

**No external dependencies required!** This package uses the native fetch API available in all modern environments.

## Quick Start

```typescript
import { PcoClient } from '@rachelallyson/planning-center-people-ts';

const client = new PcoClient({
    auth: {
        type: 'basic',
        appId: 'your-app-id',
        appSecret: 'your-app-secret',
    },
    // Or OAuth: auth: { type: 'oauth', accessToken, refreshToken, onRefresh, onRefreshFailure }
});

const people = await client.people.getPage({ per_page: 10, include: ['emails', 'phone_numbers'] });
const person = await client.people.getById('person-id', { include: ['emails'] });
const newPerson = await client.people.create({ first_name: 'John', last_name: 'Doe', status: 'active' });
const updatedPerson = await client.people.update('person-id', { first_name: 'Jane' });
await client.people.delete('person-id');

// Smart file upload for custom fields
await client.fields.createPersonFieldData('person-id', 'field-definition-id', '<a href="https://example.com/document.pdf" download>View File</a>');
```

## Imports

This package exports the client, resource types, `PcoApiError`, and the JSON:API types used in responses (`Relationship`, `ResourceIdentifier`, `ResourceObject`), plus the package’s own error-handling and helper APIs. For lower-level utilities (e.g. `createDebugLogger`, `PcoRateLimiter`, rate-limit headers), use `@rachelallyson/planning-center-base-ts` directly.

## Configuration

### Debug logging

Turn logs on or off to see everything that happens inside the package (requests, auth, rate limit, cache, errors). Debug is provided by the base package and shared across all PCO clients. Enable at creation or at runtime:

```typescript
import { PcoClient } from '@rachelallyson/planning-center-people-ts';

// Enable at creation
const client = new PcoClient({
  auth: { type: 'personal_access_token', personalAccessToken: '...' },
  debug: true,
});

// Or with options
const client = new PcoClient({
  auth: { ... },
  debug: {
    prefix: '[MyApp]',
    includePayloads: false,  // set true to log request/response bodies (avoid in production)
    onLog: (message, data) => myLogger.info(message, data),
  },
});

// Toggle at runtime
client.updateConfig({ debug: true });
client.updateConfig({ debug: false });
```

With `debug: true`, every event is logged with a clear prefix (default `[PCO People]`), including:

- `→` request start (method, endpoint, requestId)
- `←` request complete (status, duration)
- `✗` request error
- auth success/failure/refresh
- rate limit and rate available
- cache hit/miss/set/invalidate
- generic errors

### Authentication

Use `PcoClient` with one of three auth types:

**Personal Access Token:**

```typescript
const client = new PcoClient({
  auth: {
    type: 'personal_access_token',
    personalAccessToken: 'your-token-here',
    personalAccessTokenSecret: 'optional-secret', // or use env
  },
});
```

**OAuth 2.0** (requires `onRefresh` and `onRefreshFailure`):

```typescript
const client = new PcoClient({
  auth: {
    type: 'oauth',
    accessToken: '...',
    refreshToken: '...',
    onRefresh: async (tokens) => { /* save tokens */ },
    onRefreshFailure: async (err) => { /* handle */ },
  },
});
```

**Basic** (app id/secret): `auth: { type: 'basic', appId, appSecret }`.

Optional config: `baseURL`, `timeout`, `headers`, `debug`. See the [config reference](../../docs/content/reference/config.mdx) in the monorepo docs.

## API overview

Use `PcoClient` and its modules. Each list-capable module (e.g. `people`, `households`, `workflows`) provides:

- **`getAll(options?)`** – Fetch all pages; returns `PaginationResult<T>` with `data`, `totalCount`, `pagesFetched`.
- **`getPage(options?)`** – Fetch a single page; returns `{ data, meta?, links? }`.
- **`getById(id, options?)`** – Fetch one resource; use `options.include` for related data (e.g. `{ include: ['emails'] }`).
- **`create(data)`**, **`update(id, data)`**, **`delete(id)`** – Mutations.

Example: `client.people.getAll({ where: { status: 'active' } })`, `client.people.getPage({ per_page: 25, page: 1 })`, `client.people.getById('id', { include: ['emails'] })`. Contacts are person-scoped: `client.contacts.createEmail(personId, data)`.

## Error Handling

Use `PcoApiError` from the package (re-exported from `@rachelallyson/planning-center-base-ts`) for catch blocks. The client uses the core package for HTTP, retries, and rate limiting.

```typescript
import { PcoClient, PcoApiError } from '@rachelallyson/planning-center-people-ts';

try {
    const people = await client.people.getPage({ per_page: 10 });
} catch (error) {
    if (error instanceof PcoApiError) {
        console.error('PCO Error:', { message: error.message, status: error.status, errors: error.errors });
        if (error.status === 401) { /* auth */ }
        if (error.status === 429) { /* rate limit */ }
        if (error.status === 422) { /* validation */ }
    }
    throw error;
}
```

## Type Safety

All methods are fully typed; resources are flattened (attributes at top level):

```typescript
const person = await client.people.getById('person-id');
console.log(person.first_name); // ✅ TypeScript knows this exists
const newPerson = await client.people.create({ first_name: 'John', last_name: 'Doe', status: 'active' });
```

## Rate Limiting

Rate limiting is handled automatically by the core client. Check status with:

```typescript
const rateLimitInfo = client.getRateLimitInfo();
console.log('Requests used:', rateLimitInfo.requestsUsed);
console.log('Requests remaining:', rateLimitInfo.requestsRemaining);
```

## Pagination

```typescript
const page = await client.people.getPage({ per_page: 10, page: 1 });
const allPeople = await client.people.getAll({ per_page: 100 });
```

## Environment Support

This package uses the native fetch API, which is available in:

- **Node.js 18+** (built-in)
- **All modern browsers** (built-in)
- **Deno** (built-in)

For older Node.js versions, you can use a fetch polyfill:

```bash
npm install node-fetch
```

```typescript
import fetch from 'node-fetch';
global.fetch = fetch;
```

## API Style

Use the class-based client and modules (v2.0+):

```typescript
const client = new PcoClient({ auth: { type: 'basic', appId, appSecret } });
const people = await client.people.getPage({ per_page: 10 });
const all = await client.people.getAll({ where: { status: 'active' } });
```

## Testing

### Unit Tests

Run the comprehensive unit test suite:

```bash
npm test              # Run all unit tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
npm run test:ci       # Run tests for CI/CD
```

The unit tests cover:

- Rate limiting functionality
- Error handling and retry logic
- Core client operations
- All People API functions
- Type safety and edge cases

### Integration Tests

Test against the real PCO API to validate functionality:

```bash
npm run test:integration
```

**Prerequisites:**

1. Copy `.env.test.example` to `.env.test`
2. Fill in your PCO credentials:

   ```env
   PCO_APP_ID=your_app_id_here
   PCO_APP_SECRET=your_app_secret_here
   # OR use OAuth:
   # PCO_ACCESS_TOKEN=your_token_here
   ```

3. Ensure your PCO app has People API permissions

**What Integration Tests Cover:**

- Authentication and configuration
- Read operations (people, households, field definitions)
- Write operations with automatic cleanup
- Rate limiting and performance
- Error handling with real API responses
- Concurrent request handling
- **Runtime type validation** - All 11 core resource types validated against real API responses

**Type Validation:**

The integration tests include comprehensive runtime validation to ensure TypeScript types match actual PCO API responses:

- ✅ **11 Resource Types Validated**: Person, Email, PhoneNumber, Address, Household, SocialProfile, FieldDefinition, FieldOption, FieldDatum, WorkflowCard, WorkflowCardNote
- ✅ **Attribute Type Checking**: Validates all attributes match expected types (string, number, boolean, date, null)
- ✅ **Relationship Validation**: Ensures relationship structures conform to JSON:API specification
- ✅ **Pagination Validation**: Validates links and metadata structures
- ✅ **API Change Detection**: Catches breaking changes in PCO API immediately

See [TYPE_VALIDATION_SUMMARY.md](./TYPE_VALIDATION_SUMMARY.md) for detailed documentation on type validation coverage and approaches for the remaining 11 resource types.

**Safety Features:**

- All test data is automatically cleaned up
- Uses descriptive test names (e.g., "TEST_INTEGRATION_2025")
- Respects PCO rate limits (100 requests per 20 seconds)
- 30-second timeout per test
- Comprehensive error handling

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests (both unit and integration)
5. Submit a pull request

## 📚 Comprehensive Documentation

Complete documentation is available in the monorepo documentation site:

- **[📖 Documentation Index](../../docs/content/index.mdx)** - Complete documentation entry point
- **[🚀 Quick Start Guide](../../docs/content/guides/quickstart.mdx)** - Get started in 5 minutes
- **[📋 API Reference](../../docs/content/api/)** - Complete TypeScript API documentation
- **[⚙️ Configuration Reference](../../docs/content/reference/config.mdx)** - All configuration options
- **[💡 Examples & Recipes](../../docs/content/recipes/examples.mdx)** - Copy-paste code snippets
- **[🛠️ Error Handling Guide](../../docs/content/guides/error-handling.mdx)** - Comprehensive error handling
- **[📄 Pagination Guide](../../docs/content/guides/pagination.mdx)** - Handling paginated responses
- **[🔧 Troubleshooting](../../docs/content/troubleshooting.mdx)** - Common issues and solutions
- **[🏗️ Core Concepts](../../docs/content/concepts.mdx)** - Architecture and mental models

## License

MIT
