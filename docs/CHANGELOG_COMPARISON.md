# Changelog comparison: released (tag) vs current branch

This document compares **what’s on the published tags** (what’s live on npm) to **the current branch** (including uncommitted changes) so we don’t understate changes in CHANGELOGs.

Comparison: `git diff <package-tag> -- packages/<package>/` (tag = last release).

**Version numbers chosen for this release:** base **2.0.0**, people **4.0.0**, check-ins **3.2.0**. Base and people are major (breaking); check-ins is minor (no own API break, requires base ^2.0.0). All three CHANGELOGs and package.json files updated; people and check-ins depend on base `^2.0.0`.

---

## Summary

| Package        | Last tag              | Files changed | Insertions | Deletions | Net lines |
|----------------|------------------------|---------------|------------|-----------|-----------|
| base-ts        | planning-center-base-ts@1.1.3   | 29            | 1,734      | 6,094     | **-4,360** |
| people-ts      | planning-center-people-ts@3.1.1 | 124           | 3,468      | 24,443    | **-20,975** |
| check-ins-ts   | planning-center-check-ins-ts@3.1.2 | 56         | 2,070      | 5,496     | **-3,426** |

The current changelogs only mention a small fraction of these changes. Below is a concise summary of what actually changed so we can align the CHANGELOGs.

---

## Base (`planning-center-base-ts`)

**Current CHANGELOG:** Only [1.1.3] is listed (already released). There is **no [Unreleased]** section for the large refactor on the branch.

**What actually changed since 1.1.3:**

- **Removed:** Event system (`PcoEventEmitter`), batch operations (`batch.ts`), monitoring, old error-handling module; types: `config`, `events`, `batch`, `flattened-resource`, `json-api` (moved or inlined elsewhere).
- **HTTP client:** No longer takes an event emitter; constructor is `PcoHttpClient(config)` only. Debug logging is the main observability path.
- **BaseModule:** Constructor and exports refactored; `getConfig` optional third param; docs and README updated (no event/batch, debug-only).
- **Other:** `base-module`, `http-client`, `pagination`, `included-resolver`, `query-params`, `rate-limiter`, `debug`, `index` significantly refactored; many tests removed or rewritten (batch, error-handling, http-client, coverage); new test/source layout (e.g. `auth`, `config`, `errors`, `flattened`, `json-api`, `typed`).

**Changelog gap:** All of the above is “since 1.1.3” and should be described in an **[Unreleased]** (or next version) section for base.

---

## People (`planning-center-people-ts`)

**Current CHANGELOG:** [3.1.2] only mentions helpers cleanup and removal of included-data helpers. The diff is **124 files, −20,975 lines**.

**What actually changed since 3.1.1:**

- **Removed / replaced:** `auth.ts`, `client-manager.ts`, `core.ts`, `error-handling.ts`, `error-scenarios.ts`, `performance.ts`; entire `src/testing/` (builders, factories, mock-client, recorder, etc.); `types/json-api.ts`; many integration and unit tests (v2 batch, client-manager, core, error-handling, error-scenarios, performance, refresh-token, v2-matching, v2-token-refresh, and many integration tests under `integration/` and `integration/v2/`).
- **Aligned with base:** Error handling uses `PcoApiError` from base (no custom `PcoError`/`ErrorCategory`). Config and client docs updated to match base (e.g. `baseURL`, `timeout`, `debug`; no `caching`/`retry` in the old shape). Examples and CONTRIBUTING/MIGRATION_GUIDE updated.
- **Client / modules / types:** `client.ts`, `index.ts`, `helpers.ts`, `matcher.ts`, `scoring.ts` refactored; all modules (campus, contacts, fields, forms, households, lists, notes, people, reports, service-time, workflows) and types (`api-options`, `people`) updated; namespace imports and type naming aligned with check-ins.
- **Helpers:** File helpers consolidated; included-data helpers removed in favor of base; age/contact helpers accept `null` where API types allow it.
- **Testing:** Jest config (coverage thresholds, test:ci); integration tests reworked (e.g. response-types-* integration tests, test-config, env-updater); many legacy tests removed.

**Changelog gap:** [3.1.2] should also mention: alignment with base (PcoApiError, config), removal of deprecated/v1 and unused paths (auth, client-manager, core, error-handling, performance, testing/*), testing and example updates, and the broader type/module refactor—not only the two helper bullets.

---

## Check-ins (`planning-center-check-ins-ts`)

**Current CHANGELOG:** [3.1.2] is the latest; there is **no [Unreleased]** for the changes on the branch.

**What actually changed since 3.1.2:**

- **Jest / CI:** `moduleNameMapper` for `ky` and `@badgateway/oauth2-client` (base mocks) so unit tests run without ESM issues; `testPathIgnorePatterns` includes `/integration/` so `test:ci` doesn’t require env vars; coverage thresholds set to current levels.
- **Tests:** `request-building.test.ts` updated for current base behavior (`getAllPages` per_page 100, filter as boolean); `http-mock.ts` returns a single-item `data` array so `getSingle`/`getById` don’t throw; many `tests/modules/*.test.ts` removed; integration tests and test-config refactored; `type-validators.ts` and `setup.ts` updated.
- **Source:** `client.ts`, `index.ts`, all modules and `types/check-ins.ts`, `types/index.ts` refactored (imports, types, consistency with base).
- **Docs / meta:** README “Imports” section; CHANGELOG fix (`perPage` → `per_page` in 3.0.0 description); `package.json` (e.g. typia, vitest, scripts).

**Changelog gap:** Add an **[Unreleased]** section that covers: Jest/CI and test updates (ky mock, integration excluded from test:ci, coverage, request-building and http-mock), README and CHANGELOG doc fixes, and dependency/tooling updates.

---

## How to use this

1. **Base:** Add an **[Unreleased]** section (or next version) that describes the removal of the event system and batch, HTTP client and constructor changes, and debug-only observability.
2. **People:** Expand **[3.1.2]** (and keep **[Unreleased]** for anything that lands after) so it includes alignment with base, removal of deprecated/unused code, and testing/example/type refactors, not only the two helper bullets.
3. **Check-ins:** Add **[Unreleased]** for Jest/CI, test and mock updates, README/CHANGELOG fixes, and package.json/tooling.

After updating the CHANGELOGs, you can remove or trim this comparison doc, or keep it for the next time you compare tag vs branch.
