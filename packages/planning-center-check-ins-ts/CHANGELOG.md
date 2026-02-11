# Changelog

All notable changes to this package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.1.2] - 2026-02-10

### Changed

- **Type naming and public API**: The canonical types you use in app code are now **`*Resource`** (flattened shape the client returns) and **`*ResourceObject`** (internal JSON:API shape). List responses use **`ListResponse<T>`** (`{ data: T[]; meta?; links? }`). So `EventsList = ListResponse<EventResource>`, `EventSingle = EventResource`, etc. The package no longer re-exports `Paginated` or `Response` from base; use `ListResponse` and the `*Resource` / `*Single` types from this package.
- **Module imports**: All modules now use a single namespace import from `../types` (`import type * as Types from '../types'`) instead of long named import lists. Types are referenced as `Types.EventResource`, `Types.CheckInsResourceTypeToRelMap`, etc.
- **Return types**: Removed explicit return type annotations from module methods; return types are now inferred from the implementation (base `getSingle` / `getList` / `getAllPages`), so the public API stays accurate without maintaining duplicate type annotations.

### Fixed

- **Attendance-types module**: Removed invalid third type argument `CheckInsResourceTypeToRelMap` from `getList` and `getSingle` calls (attendance types use only their own resource/relationship types).
- **Events module**: Removed explicit return types from `getAllEventPeriods` and `getAllEvents` so TypeScript infers the correct flattened type and avoid type mismatches with the base pagination result.

## [3.1.1] - 2026-02-09

### Fixed

- **`getEventTimesForPeriod`**: Now uses the base client’s `getList()` so it returns the same flattened shape as other list methods. Previously it called `httpClient.request` directly and returned raw JSON:API (with `included`). Return type is now `{ data: EventTimeResource[]; meta?; links? }`. The `included` property is no longer returned (included resources are merged into the flattened `data`).

### Added

- **Integration test**: `getEventTimesForPeriod` return value is validated against `EventTimeResource` in attribute-type-validation integration tests (real API; ensures return shape matches type).

## [3.1.0] - 2026-02-09

### Fixed

- **Types now match actual response shape**: The **`*Resource`** types (e.g. `EventResource`, `EventPeriodResource`, `CheckInResource`) now accurately describe the flattened shape the client returns (attributes and relationships at top level). Previously, those types were JSON:API-style (optional `attributes` / `relationships`), while the base client has always returned flattened data. This was a type-only mismatch; runtime behavior is unchanged.

### Added

- **Canonical resource types**: For every resource, **`*Resource`** is the type for the shape returned by the client (e.g. `EventResource`, `EventPeriodResource`, `CheckInResource`). Use these when typing variables that hold API return values. Internal JSON:API shapes are **`*ResourceObject`** (for advanced use).
- **Integration test**: `getAllEventPeriods` return value is validated against `EventPeriodResource` in attribute-type-validation integration tests.

### Changed

- **Type naming**: List and single response types use **`*Resource`** for the flattened shape (e.g. `EventsList = ListResponse<EventResource>`, `EventSingle = EventResource`). Method return types infer from the base client and match these types.

## [3.0.0] - 2026-02-02

### ⚠️ **Breaking Changes**

- **`getAll()` now fetches all pages**: `getAll()` previously called `getList()` and returned a single page. It now calls `getAllPages()` and returns **all** pages. The return type is now `PaginationResult<T>` (from base), which includes `data`, `totalCount`, `pagesFetched`, `duration`, `meta?`, and `links?`. If you need a single page, use **`getPage(options)`** instead.
- **`getPage()` for single-page fetching**: New method on all list-capable modules. Use `getPage({ perPage, page, where, include, ... })` when you want one page with full control. Use `getAll()` when you want every page automatically.
- **Response shape (from base)**: All methods that return resources use the base package’s flattened shape: **attributes and relationships are at the top level** (e.g. `resource.name` instead of `resource.attributes.name`, and related data at `resource.relation_name` instead of `resource.relationships.relation_name.data`). The **`*Resource`** types (e.g. `EventResource`, `CheckInResource`) describe this shape. This matches the People and Base packages.
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
