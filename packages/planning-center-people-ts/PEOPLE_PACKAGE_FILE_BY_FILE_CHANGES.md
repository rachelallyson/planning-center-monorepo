# People package: line-by-line analysis of changes

This document lists **changes made** in `packages/planning-center-people-ts/src/` (source only, no tests), derived from `git diff`. Each entry gives line numbers (old → new where applicable) and the exact **Added** / **Removed** / **Changed** content.

**Legend**

- **Added** – New line(s) or file added.
- **Removed** – Line(s) or file deleted.
- **Changed** – Line(s) replaced (old content → new content).

---

## `src/auth.ts`

**Hunk 1 (lines 1–5 / 1–6)**

- **Added** (after line 1):  
  `import { createDebugLogger } from '@rachelallyson/planning-center-base-ts';`

**Hunk 2 (lines 51–52 / 52–53)**

- **Changed** (line 52):  
  `onRetry?: (error: any, attempt: number) => void;`  
  →  
  `onRetry?: (error: unknown, attempt: number) => void;`

**Hunk 3 (lines 131–152 / 132–155)**

- **Added** (after line 132):  
  `const logger = createDebugLogger(client.config as { debug?: boolean | import('@rachelallyson/planning-center-base-ts').PcoDebugOptions });`  
  `if (logger.enabled) logger.log('auth  attemptTokenRefresh start', {});`
- **Removed** (line 134):  
  `// Attempt to refresh the token`
- **Removed** (line 137):  
  `// Update the client with new tokens`
- **Added** (after updateClientTokens):  
  `if (logger.enabled) logger.log('auth  attemptTokenRefresh success', {});`
- **Removed** (lines 147–148):  
  `// Log callback error but don't fail the token refresh`  
  `console.warn('Token refresh callback failed:', callbackError);`
- **Added** (in catch):  
  `const logger = createDebugLogger(client.config as { ... });`  
  `if (logger.enabled) logger.log('auth  token refresh callback failed', { error: String(callbackError) });`

**Hunk 4 (lines 152–167 / 155–170)**

- **Added** (in outer catch, after `} catch (error) {`):  
  `if (logger.enabled) logger.log('auth  attemptTokenRefresh failed', { error: String(error) });`
- **Removed** (lines 167–168):  
  `// Log callback error but don't fail the refresh error`  
  `console.warn('Token refresh failure callback failed:', callbackError);`
- **Added** (in inner catch):  
  `const logger = createDebugLogger(client.config as { ... });`  
  `if (logger.enabled) logger.log('auth  token refresh failure callback failed', { error: String(callbackError) });`

---

## `src/client.ts`

**Hunk 1 (lines 2–22 / 2–44)**

- **Removed** (line 5):  
  `import type { PcoClientConfig } from './types/client';`
- **Added** (line 5):  
  `import type { PeopleClientConfig } from './types/client';`
- **Removed** (line 6):  
  `import type { EventEmitter, PcoEvent, EventHandler, EventType } from '@rachelallyson/planning-center-base-ts';`
- **Added** (lines 6–24):  
  Imports for `EventEmitter as BaseEventEmitter`, `PcoEvent`, `EventHandler`, `EventType`, `EventRequestStartEvent`, `EventRequestCompleteEvent`, `RequestErrorEvent`, `AuthSuccessEvent`, `EventAuthFailureEvent`, `AuthRefreshEvent`, `EventRateLimitEvent`, `RateAvailableEvent`, `CacheHitEvent`, `CacheMissEvent`, `CacheSetEvent`, `CacheInvalidateEvent`, `EventErrorEvent`.
- **Removed** (line 26):  
  `BatchExecutor`
- **Added** (lines 26–28):  
  `BatchExecutor,`  
  `attachDebugListener,`  
  `createDebugLogger,`
- **Added** (line 30):  
  `import type { PcoDebugListenable } from '@rachelallyson/planning-center-base-ts';`
- **Changed** (line 43):  
  `export class PcoClient implements EventEmitter`  
  →  
  `export class PcoClient implements BaseEventEmitter`

**Hunk 2 (lines 39–76 / 60–90)**

- **Changed** (line 42):  
  `private config: PcoClientConfig;`  
  →  
  `private config: PeopleClientConfig;`
- **Added** (line 43):  
  `private debugUnsubscribe: (() => void) | null = null;`
- **Changed** (line 45):  
  `constructor(config: PcoClientConfig)`  
  →  
  `constructor(config: PeopleClientConfig)`
- **Changed** (line 49):  
  `this.paginationHelper = new PaginationHelper(this.httpClient);`  
  →  
  `this.paginationHelper = new PaginationHelper(this.httpClient, () => this.getConfig());`
- **Removed** (lines 52–61):  
  All 10 module constructor calls with 3 args only.
- **Added** (lines 72–82):  
  All 10 module constructor calls with 4th arg `() => this.getConfig()`, then:  
  `// Debug: subscribe to all events when debug is enabled...`  
  `if (config.debug) { ... attachDebugListener(...); createDebugLogger(config).log('client  debug enabled', ...); }`
- **Removed** (line 74):  
  `// Set up event handlers from config`

**Hunk 3 (lines 78–82 / 92–130)**

- **Removed** (line 79):  
  `// EventEmitter implementation`
- **Added** (lines 92–108):  
  `// EventEmitter implementation - overloads for proper type narrowing`  
  Overloads for `on(eventType: 'request:start', ...)`, `'request:complete'`, etc., then generic `on<T>(...)` with comment and `(this.eventEmitter as BaseEventEmitter).on(...)`.
- **Added** (lines 110–126):  
  Same pattern for `off(...)` overloads and generic `off` with cast.

**Hunk 4 (lines 80–82 / 136–139)**

- **Changed** (line 81):  
  `getConfig(): PcoClientConfig`  
  →  
  `getConfig(): PeopleClientConfig`

**Hunk 5 (lines 84–89 / 144–170)**

- **Changed** (line 85):  
  `updateConfig(updates: Partial<PcoClientConfig>): void`  
  →  
  `updateConfig(updates: Partial<PeopleClientConfig>): void`
- **Added** (after merge):  
  `const hadDebug = Boolean(this.config.debug);`  
  `const hasDebug = Boolean(this.config.debug);`  
  `const logger = createDebugLogger(this.config);`  
  `if (logger.enabled) logger.log('client.updateConfig', { updates });`  
  Block to attach/detach debug listener when debug toggles.  
  `this.paginationHelper = new PaginationHelper(this.httpClient, () => this.getConfig());`
- **Removed** (line 89):  
  `this.paginationHelper = new PaginationHelper(this.httpClient);`

**Hunk 6 (lines 205–217 / 205–218)**

- **Removed** (lines 207–214):  
  `updateModules()` with 3-arg module constructors (people through lists only).
- **Added** (lines 207–217):  
  `updateModules()` with 4-arg constructors for all 11 modules (including campus, serviceTime, forms, reports).

---

## `src/core.ts`

**Hunk 1 (lines 6–17 / 6–19)**

- **Removed** (line 9):  
  `import { PcoRateLimiter, RateLimitHeaders } from '@rachelallyson/planning-center-base-ts';`
- **Added** (line 9):  
  `import { PcoRateLimiter, RateLimitHeaders, createDebugLogger } from '@rachelallyson/planning-center-base-ts';`
- **Added** (line 14):  
  `Attributes,` in types import.

**Hunk 2 (lines 50–55 / 51–56)**

- **Added** (after retry config):  
  `/** Enable debug logging ... */`  
  `debug?: boolean | import('@rachelallyson/planning-center-base-ts').PcoDebugOptions;`

**Hunk 3 (lines 253, 287, 388)**

- **Changed** (del params):  
  `params?: Record<string, any>`  
  →  
  `params?: Record<string, string | number | boolean | undefined>`
- **Changed** (getAllPages params): same.
- **Changed** (makeFetchRequest data):  
  `data?: Record<string, any>`  
  →  
  `data?: Partial<Attributes>`

**Hunk 4 (lines 513–516 / 516–519)**

- **Removed** (lines 515–516):  
  `// If token refresh fails, fall through to normal error handling`  
  `console.warn('Token refresh failed:', refreshError);`
- **Added** (lines 517–518):  
  `const logger = createDebugLogger(client.config);`  
  `if (logger.enabled) logger.log('core  token refresh failed', { error: String(refreshError) });`

---

## `src/error-handling.ts`

**Hunk 1 (line 35)**

- **Changed**:  
  `metadata?: Record<string, any>;`  
  →  
  `metadata?: Record<string, unknown>;`

**Hunk 2 (lines 145–166)**

- **Changed** (fromFetchError param):  
  `data?: any`  
  →  
  `data?: unknown`
- **Changed** (errors extraction):  
  `const errors = data?.errors || [];`  
  →  
  `const errors: JsonApiError[] = (data && typeof data === 'object' && ... 'errors' in data) ? (...) : [];`
- **Changed** (message map):  
  `.map((e: any) => e.detail || e.title || 'Unknown error')`  
  →  
  `.map((e: unknown) => { ... })` with type guards, then `.map((msg: unknown) => typeof msg === 'string' ? msg : 'Unknown error')`

**Hunk 3 (line 233)**

- **Changed**:  
  `getErrorSummary(): Record<string, any>`  
  →  
  `getErrorSummary(): Record<string, unknown>`

**Hunk 4 (line 250)**

- **Changed**:  
  `export function shouldNotRetry(error: any): boolean`  
  →  
  `export function shouldNotRetry(error: unknown): boolean`

---

## `src/error-scenarios.ts`

**Hunk 1 (lines 68–78)**

- **Changed**:  
  `function isRetryableError(error: any, ...)`  
  →  
  `function isRetryableError(error: unknown, ...)`
- **Changed**:  
  `if (error.name === 'TypeError' && error.message.includes('fetch'))`  
  →  
  `if (error && typeof error === 'object' && 'name' in error && 'message' in error) { const errorName = ...; const errorMessage = ...; if (errorName === 'TypeError' && ...) return true; }`

**Hunk 2 (lines 157–182)**

- **Changed**:  
  `BulkOperationResult<T>`  
  →  
  `BulkOperationResult<R>` with `failed: { ... data?: unknown }[]` (comment about T).
- **Changed**:  
  `failed: { index: number; error: Error; data?: any }[]`  
  →  
  `failed: { index: number; error: Error; data?: T }[]`

**Hunk 3 (lines 272–310)**

- **Changed**:  
  `export function classifyError(error: any):`  
  →  
  `export function classifyError(error: unknown):`
- **Added**:  
  `const isErrorLike = (e: unknown): e is { name?: string; message?: string; status?: number } => ...`
- **Changed**:  
  All `error.name` / `error.message` checks to use `isErrorLike(error) && ...`

**Hunk 4 (lines 398–402)**

- **Added**:  
  `const isErrorLike = (e: unknown): e is { message?: string } => ...`  
  inside classifyPcoError.
- **Changed**:  
  `error.message || '...'`  
  →  
  `(isErrorLike(error) && error.message) || '...'`

**Hunk 5 (lines 414–427)**

- **Changed**:  
  `export async function attemptRecovery<T>(..., error: any, ...)`  
  →  
  `error: unknown`

**Hunk 6 (lines 475–509)**

- **Changed**:  
  `errors?: any[]`  
  →  
  `errors?: Array<{ detail?: string; title?: string; [key: string]: unknown }>`

**Hunk 7 (lines 509–546)**

- **Changed**:  
  `export function createErrorReport(error: any, ...)`  
  →  
  `error: unknown`
- **Added**:  
  Type guard `isErrorLike` for error object and `const errorObj = isErrorLike(error) ? error : {};`
- **Changed**:  
  All `error.errors`, `error.message`, etc.  
  →  
  `errorObj.errors`, `errorObj.message`, etc.

---

## `src/helpers.ts`

**Hunk 1 (lines 1–27)**

- **Removed**:  
  `import type { PcoClientState } from './core';`  
  Imports of `getPeople`, `getPerson`, `createPerson`, `createPersonEmail`, `createPersonPhoneNumber`, `createPersonAddress`, `getPersonEmails`, `getPersonPhoneNumbers`, `getPersonAddresses`, `getPersonFieldData`, `getWorkflowCards`, `createWorkflowCard`, `getWorkflowCardNotes`, `createWorkflowCardNote`, `getLists`, ... (function-style API from core/people).
- **Added**:  
  `import { createDebugLogger } from '@rachelallyson/planning-center-base-ts';`  
  `import type { PcoDebugOptions } from '@rachelallyson/planning-center-base-ts';`  
  `import type { PcoClient } from './client';`  
  `import type { ErrorContext } from './error-handling';`  
  Plus `debugLogIfEnabled(client, message, data)` helper and imports for `mapIncludedToRelationships`, api-options, and types (Person, Email, etc.).

**Later hunks (helpers.ts)**

- **Added**:  
  New exported functions: `findIncluded`, `resolveIncluded`, `createIncludedLookup` (and their implementations).  
  Use of `debugLogIfEnabled` / `createDebugLogger` where a client is passed.  
- **Removed**:  
  Any use of the old function-style API (getPeople, createPerson, etc.) in favor of client/module usage.

*(Full line-by-line for the rest of helpers.ts: run `git diff packages/planning-center-people-ts/src/helpers.ts`.)*

---

## `src/index.ts`

**Changes (summary)**

- **Added**:  
  Exports for `PcoDebugOptions`, `attachDebugListener`, `createDebugLogger`, `formatDebugEvent`, `PcoDebugListenable`; event types; `findIncluded`, `resolveIncluded`, `createIncludedLookup`; API option types (PersonListOptions, PersonPageOptions, etc.).
- **Removed**:  
  No new removals in index itself; package no longer re-exports `getSingle`, `getList`, `post`, `patch`, `del`, `getAllPages` from core (those exports were removed from the core export list in index).

*(Run `git diff packages/planning-center-people-ts/src/index.ts` for exact line edits.)*

---

## `src/performance.ts`

**Changes (summary)**

- **Added**:  
  In `processInBatches`: optional `options.client`; when present and `getConfig` exists, `createDebugLogger(client.getConfig())` and logs for batch start/complete.  
  In `batchFetchPersonDetails`: same pattern for debug logging.

*(Run `git diff packages/planning-center-people-ts/src/performance.ts` for exact line numbers.)*

---

## `src/matching/matcher.ts`

**Changes (summary)**

- **Added**:  
  Import `createDebugLogger`, `PcoClientConfig`; optional `getConfig?: () => PcoClientConfig` in constructor; private `debugLog(message, data)` using `createDebugLogger(this.getConfig?.())`.  
  Use of `FlattenedPersonResource` for match result type.
- **Changed**:  
  `MatchResult.person` type to `FlattenedPersonResource`.

*(Run `git diff packages/planning-center-people-ts/src/matching/matcher.ts` for exact line numbers.)*

---

## `src/matching/scoring.ts` and `src/matching/strategies.ts`

**Changes (summary)**

- **Changed**:  
  Types aligned to flattened person (e.g. `FlattenedPersonResource`).  
  Strategies use getPage/getAll and flattened results.

*(Run `git diff` on these files for full line-by-line.)*

---

## `src/modules/contacts.ts`

**Hunk 1 (lines 3–18)**

- **Removed** (lines 6–8):  
  Separate type imports for `PcoHttpClient`, `PaginationHelper`, `PcoEventEmitter`.
- **Added** (line 6):  
  `import type { PcoHttpClient, PaginationHelper, PcoEventEmitter } from '@rachelallyson/planning-center-base-ts';`
- **Added** (types from `../types`):  
  `Meta`, `TopLevelLinks`

**Hunk 2 (getAllEmails, getEmailById, createEmail, …)**

- **Removed**:  
  Explicit return types `Promise<{ data: EmailResource[]; meta?: any; links?: any }>`, `Promise<EmailResource>`, `Promise<void>`.
- **Added**:  
  At start of every method: `this.debugLog('contacts.methodName', { ... });`
- **Changed** (createEmail):  
  `async createEmail(data: EmailAttributes): Promise<EmailResource>`  
  `return this.createResource<EmailResource>('/emails', data);`  
  →  
  `async createEmail(personId: string, data: EmailAttributes)`  
  `return this.createResource<EmailResource>(\`/people/${personId}/emails\`, data);`  
  Same pattern for **createPhoneNumber**, **createAddress**, **createSocialProfile**: first param `personId: string`, endpoint `/people/${personId}/...`.

---

## `src/modules/people.ts`, `campus.ts`, `fields.ts`, `forms.ts`, `households.ts`, `lists.ts`, `notes.ts`, `reports.ts`, `service-time.ts`, `workflows.ts`

**Common patterns**

- **Added**:  
  Fourth constructor arg `getConfig?: () => PcoClientConfig` passed to `super(..., getConfig)`.  
  `getPage(options)` on each list-capable module calling `this.getList(endpoint, { where, include, per_page, page, order })`.  
  `this.debugLog('moduleName.methodName', { ... })` at start of public methods.  
  Use of option types from `../types/api-options` (e.g. `PersonListOptions`, `PersonPageOptions`).
- **Removed**:  
  `getAllPagesPaginated()` from all list-capable modules.  
  Three-arg-only module constructors (replaced by 4-arg with getConfig).
- **Changed**:  
  `getAll(...)` to pass option object into `getAllPages` (where, include, order).  
  `getById(id, include?)` to pass `include` to base `getSingle`.  
  People module: create/update accept snake_case (transformed internally); searchPeople uses getPage/getAll.

*(Run `git diff packages/planning-center-people-ts/src/modules/<module>.ts` for each file for exact line numbers and hunks.)*

---

## `src/types/client.ts`

**Changes (summary)**

- **Removed**:  
  Local definition of config types (if any).
- **Added**:  
  Re-exports from base: `PcoClientConfig`, `PcoAuthConfig`, `PcoDebugOptions`, `PersonalAccessTokenAuth`, `OAuthAuth`, `BasicAuth`, and event types.  
  `PeopleClientConfig` as alias for base `PcoClientConfig`.

*(Run `git diff packages/planning-center-people-ts/src/types/client.ts` for exact lines.)*

---

## `src/types/api-options.ts`

- **Added** (new file):  
  Entire file added (~514 lines): strictly typed API options for Person, FieldDefinition, Workflow, Note, List, Household, Campus, Form, Report, ServiceTime (Include, OrderField, WhereClause, ListOptions, PageOptions).

---

## `src/types/index.ts` and `src/types/people.ts`

**Changes (summary)**

- **Added**:  
  In people.ts: import `FlattenedResource` from base; type `FlattenedPersonResource = FlattenedResource<...>`.  
  In index: re-exports for flattened types (e.g. `FlattenedPersonResource`).
- **Changed**:  
  Any return types or usages to use flattened types where applicable.

*(Run `git diff` on these files for full line-by-line.)*

---

## Deleted files (removed entirely)

- **Removed**:  
  `src/core/http.ts`  
  `src/core/pagination.ts`  
  `src/people/contacts.ts`  
  `src/people/core.ts`  
  `src/people/fields.ts`  
  `src/people/households.ts`  
  `src/people/lists.ts`  
  `src/people/notes.ts`  
  `src/people/organization.ts`  
  `src/people/workflows.ts`  
  `src/people/index.ts`  

*(Function-style API and old HTTP/pagination moved to or replaced by base package and module API.)*

---

## How to get full line-by-line diffs

From repo root:

```bash
git diff packages/planning-center-people-ts/src/<file>
```

For a new file (e.g. api-options.ts):

```bash
git diff --no-index /dev/null packages/planning-center-people-ts/src/types/api-options.ts
```

For deleted files:

```bash
git show HEAD:packages/planning-center-people-ts/src/core/http.ts
```
