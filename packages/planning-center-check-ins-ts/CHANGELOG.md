# Changelog

All notable changes to this package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.1.1] - 2026-02-09

### Fixed

- **`getEventTimesForPeriod`**: Now uses the base client’s `getList()` so it returns the same flattened shape as other list methods. Previously it called `httpClient.request` directly and returned raw JSON:API (with `included`). Return type is now `{ data: FlattenedEventTimeResource[]; meta?; links? }`. The `included` property is no longer returned (included resources are merged into the flattened `data`).

### Added

- **Integration test**: `getEventTimesForPeriod` return value is validated against `FlattenedEventTimeResource` in attribute-type-validation integration tests (real API; ensures return shape matches type).

## [3.1.0] - 2026-02-09

### Fixed

- **Types now match actual response shape**: All method return types now use **flattened** resource types (`FlattenedEventResource`, `FlattenedEventPeriodResource`, etc.) so TypeScript accurately describes what the client returns. Previously, return types used JSON:API-style `Resource` types (with optional `attributes` and `relationships`), while the base client has always flattened responses (attributes and relationships at top level). This was a type-only mismatch; runtime behavior is unchanged.

### Added

- **Flattened type aliases**: New exported types for every resource—e.g. `FlattenedEventPeriodResource`, `FlattenedEventResource`, `FlattenedCheckInResource`—representing the flattened shape (e.g. `starts_at`, `event` at top level). Use these when typing variables that hold API return values.
- **Integration test**: `getAllEventPeriods` return value is validated against `FlattenedEventPeriodResource` in attribute-type-validation integration tests.

### Changed

- **Module return types**: Every method that returns resources (e.g. `events.getEventPeriods()`, `events.getAllEventPeriods()`, `checkIns.getById()`, `locations.getPage()`) now declares a return type using the corresponding `Flattened*` type. The original `*Resource` types (e.g. `EventPeriodResource`) remain for JSON:API / input use and are still exported.

## [3.0.0] - 2026-02-02

### ⚠️ **Breaking Changes**

- **`getAll()` now fetches all pages**: `getAll()` previously called `getList()` and returned a single page. It now calls `getAllPages()` and returns **all** pages. The return type is now `PaginationResult<T>` (from base), which includes `data`, `totalCount`, `pagesFetched`, `duration`, `meta?`, and `links?`. If you need a single page, use **`getPage(options)`** instead.
- **`getPage()` for single-page fetching**: New method on all list-capable modules. Use `getPage({ perPage, page, where, include, ... })` when you want one page with full control. Use `getAll()` when you want every page automatically.
- **Flattened responses (from base)**: All methods that return resources use the base package’s flattened shape: **attributes and relationships are at the top level** (e.g. `resource.name` instead of `resource.attributes.name`, and related data at `resource.relation_name` instead of `resource.relationships.relation_name.data`). This matches the People and Base packages.
- **Same item shape for `getAll()` and `getPage()`**: Both return flattened items. `getAll().data` and `getPage().data` contain the same shape per item; only the wrapper differs—`getAll()` returns `PaginationResult<T>` (adds `totalCount`, `pagesFetched`, `duration`), while `getPage()` returns `{ data, meta?, links? }`.
- **Check-in groups require `stationId`**: `checkInGroups.getAll()` and `checkInGroups.getPage()` now require `stationId` in options. The API lists check-in groups per station: `GET /stations/:station_id/check_in_groups`. Pass `stationId` from a station you’ve fetched (e.g. `client.stations.getPage()`).

### ✨ **New Features**

- **`getPage()`** on all list-capable modules: `checkIns`, `events`, `labels`, `themes`, `stations`, `rosterListPersons`, `preChecks`, `passes`, `options`, `locations`, `integrationLinks`, `headcounts`, `eventTimes`, `checkInGroups`, `attendanceTypes`. Single-page fetch with full option support.
- **Consistent with People package**: Same `getAll()` (all pages) vs `getPage()` (one page) pattern, same flattened item shape from both methods.
- **`checkIns.getLocationLabels(checkInId, locationId)`**: New method to fetch location labels for a check-in at a specific location. The API exposes location labels under the check-in scope; use this when `locations.getLocationLabels(locationId)` is unsupported or returns empty.

### 🔄 **Dependency**

- **Base package**: `@rachelallyson/planning-center-base-ts` `^1.1.2`. Richer request events and flattened responses.

### 🧪 **Testing**

- **Integration tests**: Pre-checks tests skip when the Pre-checks API returns 404 (e.g. Church Center PreCheck not enabled). The “All Modules” test also skips optional modules (integrationLinks, themes, rosterListPersons) when they 404 or return empty.
- **Unit tests**: Default `npm test` excludes integration tests (`testPathIgnorePatterns`). Run integration tests with `npm run test:integration` (requires `.env.test` and Check-Ins scope).

## [2.0.0] - 2026-01-20

### ⚠️ **Breaking Changes**

- **Module Consolidation**: Removed standalone `checkInTimes`, `eventPeriods`, and `personEvents` modules
  - Check-in times now accessible via `client.checkIns.getCheckInTimes(checkInId)`
  - Event periods now accessible via `client.events.getEventPeriods(eventId)`
  - Person events now accessible via `client.events.getPersonEvents(eventId)`
- **Reduced Module Count**: Client now has 16 modules instead of 19

### ✨ **New Features**

- **Enhanced Events Module**: Added `getAllEventPeriods()`, `getAllEvents()`, and `getEventTimesForPeriod()` methods
- **Improved Pagination**: Added `getAllPages()` support for comprehensive data retrieval
- **Better Type Safety**: Replaced `any` types with proper `Meta` and `TopLevelLinks` interfaces
- **Comprehensive Integration Tests**: Added type validation and endpoint coverage tests

### 🔧 **Technical Improvements**

- Consolidated related functionality into parent modules for better API design
- Enhanced error handling and type validation throughout
- Updated Jest configuration for local package resolution

## [1.0.0] - 2024-XX-XX

### Added

- Initial release of Check-Ins API client
- Full TypeScript type definitions for all 24 Check-Ins API resource types
- Module-based architecture with specialized modules for each resource domain
- Support for all Check-Ins API endpoints
- Batch operations support
- Event system for monitoring requests, errors, and rate limits
- Comprehensive error handling
- Rate limiting and retry logic
