# Changelog

All notable changes to this package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.3] - 2026-02-10

### Changed

- **Published files**: `CHANGELOG.md` is now included in the npm package so release notes are available to consumers.
- **Type parameters for API packages**: `getSingle` now accepts an optional second generic `TRelResourceMap` so packages built on base can expose accurately typed flattened resources (relationship keys map to specific resource types). `getAllPages` and `PaginationResult` already supported `TRelResourceMap` and `TResourceTypeToRelMap`; `FlattenedResource` supports a fifth type parameter `TResourceTypeToRelMap` for nested relationship typing. This release keeps backward compatibility (all new parameters are optional with defaults).

## [1.1.2] - 2026-02-02

### ✨ **New Features**

- **Richer request events**: Request events now include optional context for better observability and logging:
  - **`request:start`** / **`request:complete`** / **`request:error`**: Optional **`params`** (query params sent, e.g. `per_page`, `order`).
  - **`request:complete`**: Optional **`responseSummary`** (e.g. `"25 items"` for lists, `"Person:abc123"` for single resources), **`retryCount`** (when the request succeeded after retries), **`rateLimitRemaining`** and **`rateLimitLimit`** from response headers when the API sends them.
  - **`request:error`**: Optional **`params`**.
- **Debug formatter**: When `config.debug` is enabled, request log lines now include params, retries, rate limit, and response summary when present.
- **HttpResponse**: Optional **`retryCount`** on the response object when the request succeeded after one or more retries (e.g. 429/401).

## [1.1.1] - 2026-01-28

### 🔧 **Fixed**

- **createResource / updateResource**: Responses from create and update now return the flattened shape (same as getSingle/getList). The 1.1.0 release documented this behavior; this release includes the implementation. Use `resource.field` instead of `resource.attributes.field` for create/update return values.

## [1.1.0] - 2026-01-28

### ⚠️ **Breaking: Response shape (getSingle / getList / create / update)**

- **Reads (getSingle, getList)**: Responses are now **flattened** instead of raw JSON:API. Attributes and relationships are at the top level of each resource.
  - **Before**: `resource.attributes.first_name`, `resource.relationships.emails.data`, lookup in `response.included`
  - **After**: `resource.first_name`, `resource.emails` (with included resources resolved when `include` is used)
- **Writes (createResource, updateResource)**: As of this release, create/update responses are also flattened so all returned data uses the same shape. Use `resource.field` instead of `resource.attributes.field`.
- **Migration**: Replace `resource.attributes.*` with `resource.*` and `resource.relationships.X.data` with `resource.X`. The `included` array is no longer returned; related resources appear directly on `resource.<relationship_key>` when requested via `include`.

### ✨ **New Features**

- **Debug Logging**: Optional debug logging when `config.debug` is set. Use `createDebugLogger(config)` or enable `debug: true` / `debug: { ... }` in client config to see rate limiter, retries, request/response, and pagination activity without changing application code.
- **Shared Utilities**: New modules for use by base and API-specific packages:
  - `included-resolver` – `mapIncludedToRelationships()` to resolve JSON:API `included` into relationships
  - `query-params` – `buildQueryParams()`, `buildIncludeParams()` for building query strings
  - `types/flattened-resource` – `FlattenedResource` and related types for flattened JSON:API resources
- **Exports**: Debug helpers (`createDebugLogger`, `attachDebugListener`, `formatDebugEvent`), `PcoDebugOptions`, and the new utilities are exported from the package.

### 🔧 **Fixed**

- **HTTP Client Response Body**: Response body is now read once instead of using `response.clone()`. Uses `response.text()` when available (real `Response`) and falls back to `response.json()` for environments (e.g. Jest mocks) that only provide `.json()`, fixing "response.clone is not a function" in tests.
- **HTTP Client Robustness**: Optional chaining on `response.headers` when reading rate-limit headers to avoid errors when `headers` is missing (e.g. in some mocks).

### 🧪 **Tests**

- **HTTP Client Test Isolation**: `mockFetch.mockReset()` in `beforeEach` so each test’s `mockResolvedValueOnce` / `mockRejectedValueOnce` is used and tests no longer fail due to leftover mocks from other tests.
- **Basic Auth Test**: "Should use Basic auth for personal access token" now supplies `personalAccessTokenSecret` in the test config so the client does not throw "personalAccessTokenSecret required".

## [1.0.2] - 2026-01-20

### ✨ **New Features**

- **Direct Personal Access Token Configuration**: Added support for passing `personalAccessTokenSecret` directly in config (alternative to environment variables)
- **Flexible Authentication**: Choose between environment variables or direct config based on your needs

## [1.0.1] - 2026-01-20

### ✨ **New Features**

- **Personal Access Token Support**: Added support for PCO personal access tokens using `client_id:secret` format with HTTP Basic Auth
- **HTTPS Fallback**: Automatic fallback to Node.js HTTPS when fetch is unavailable (fixes Jest compatibility)
- **Enhanced Error Handling**: Better handling of authentication and network errors

## [1.0.0] - 2026-01-XX

### ✨ **New Features**

- Initial release of Planning Center Base TypeScript library
- HTTP client with authentication, rate limiting, and error handling
- JSON:API 1.0 type definitions and utilities
- Event system for monitoring requests and errors
- Batch operations support
- Pagination helpers
- Comprehensive error handling with typed errors
