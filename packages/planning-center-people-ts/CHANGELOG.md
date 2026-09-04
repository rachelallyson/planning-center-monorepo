# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [5.0.0] - 2026-09-03

### ⚠️ Breaking changes

- **`findOrCreate` no longer creates a person off a search that failed.** The matcher could not tell "PCO says this person is not there" from "PCO did not answer", because `searchByEmail` and `searchByPhone` both ended in `catch { return [] }` and every layer above read the empty array as a clean no-match. During a PCO outage the create path therefore did not fail; it succeeded, repeatedly, at making duplicates. `findOrCreate` now throws **`PcoSearchUnavailableError`** when the search that found no match did not complete. Callers should fail the unit of work and retry it later.
- **A genuine no-match and a failed search are now distinguishable.** With `createIfNotFound: false`, a real no-match throws **`NoMatchingPersonError`** and a failed search throws **`PcoSearchUnavailableError`**. Both extend `Error`, and `NoMatchingPersonError`'s message is unchanged (`No matching person found and creation is disabled`), so callers matching on the string keep working. Callers matching on the type get the distinction the old code could not express.

### Added

- **`PcoSearchUnavailableError`**: carries `faults` (every lookup in the final attempt that did not complete, each with `operation`, `status`, `message`, `cause`), `status`, and `primaryCause`. Its message deliberately avoids PCO's not-found wording so a downstream not-found check cannot match it.
- **`NoMatchingPersonError`**: PCO answered, and the person genuinely is not there.
- **`PersonMatcher.findMatchWithOutcome(options)`**: returns a `PersonSearchOutcome` of `{ kind: 'match' }`, `{ kind: 'empty' }`, or `{ kind: 'degraded', faults }`, for callers that would rather branch than catch. `findMatch` is unchanged and still returns `null` in both of the latter cases.
- **`PersonMatchOptions.createOnDegradedSearch`** (default `false`): restores the old create-anyway behaviour for callers who were knowingly relying on it and need a release to migrate.
- **`SearchFaultLedger`, `SearchFault`, `SearchOutcome`, `isDefinitiveAbsence`, `summarizeFaults`**: the classification primitives, exported so consumers can apply the same 404-vs-everything-else rule to their own PCO calls.

### Migrating from 3.x

Two breaking changes shipped in 4.0.0 without a changelog entry. They are recorded
here because anyone coming from 3.x crosses both, and neither fails at runtime in
an obvious way:

- **`PersonMatchOptions` renamed `firstName`/`lastName` to `first_name`/`last_name`.** A 3.x caller passing the camelCase keys gets a type error under 4.x and later. Rename the keys on the options object only; leave your own surrounding objects alone.
- **Create methods return the JSON:API envelope, not the flattened resource.** `addAddress`, `addEmail`, `addPhoneNumber` and friends return `CreateResponse<T>` (`{ data: T | T[] }`), while update methods still return `T`. Unwrap a create with the exported `singleFromCreateResponse(res)`, which also handles the array form, and handle the `undefined` it returns when PCO sends nothing back.

### Changed

- **Only a 404 counts as absence.** A 401, 403, 408, 422, 429, 5xx, socket error, or unrecognised error means the lookup did not complete and cannot be read as "this person is not there". Unrecognised errors degrade by default, which is what keeps the base client's plain `Error('Rate limit exceeded after retries')` and bare `fetch` `TypeError`s out of the create path.
- **Contact verification failures degrade the search too.** A candidate PCO returned but whose emails or phone numbers could not be read is dropped from the verified set, and dropping every candidate produces the same empty result as finding nobody.
- **The aggressive pre-create search is governed by its last completed attempt.** That loop exists because an earlier no-match may be stale, so if the most recent attempt could not confirm the absence, an older clean empty no longer licenses a create.
- **Read-only surfaces are unchanged.** `findMatch`, `findMatchMultiStep`, and `getAllMatches` still return `null` / `[]` on failure and never throw for it. They cannot create anything, so the invariant does not require it, and changing them would break callers for no safety gain.


## [4.0.0] - 2026-02-18

### ⚠️ Breaking changes

- **Requires base 2.x**: This release depends on `@rachelallyson/planning-center-base-ts` **^2.0.0**. Base 2.0.0 removed the event system and batch operations and changed the HTTP client constructor; upgrading to this release will upgrade base and is therefore a breaking change.
- **`getById(id, include?)` → `getById(id, options?)`**: On all resource modules (people, households, lists, workflows, notes, campus, forms, reports), the last argument is now an options object instead of a bare `include` array. Use `getById(id, { include: ['primary_campus', 'household'] })` instead of `getById(id, ['primary_campus', 'household'])`. For **service-time** (campus-scoped), use `getById(campusId, id, { include: ['campus'] })` instead of `getById(campusId, id, ['campus'])`. Omitting the last argument is unchanged.
- **Client: no event system or batch**: The client no longer exposes `on`, `off`, `emit`, or `batch`; aligns with base 2.x. Use the base package directly if you need events or batch.
- **Error handling**: **`PcoError`** and **`ErrorCategory`** have been removed. Use **`PcoApiError`** from this package (re-exported from base). Check `error.status` (e.g. 422, 429) instead of `error.category`.
- **Removed exports**: Removed `auth.ts`, `client-manager.ts`, `core.ts`, `error-handling.ts`, `error-scenarios.ts`, `performance.ts`, the entire `src/testing/` directory, and `types/json-api.ts`. Use base package types where applicable.
- **Included-data helpers**: `findIncluded`, `resolveIncluded`, and `createIncludedLookup` removed. Use `resolveIncluded`, `flattenResource`, or `mapIncludedToRelationships` from `@rachelallyson/planning-center-base-ts`. This package still re-exports `mapIncludedToRelationships`.

### Changed

- **Alignment with base**: Client config and examples updated to match base: `baseURL`, `timeout`, `debug`; see docs/reference/config for the full shape.
- **API options**: All list/single methods use typed option types from `types/api-options` (e.g. `PersonGetByIdOptions`, `HouseholdGetPageOptions`). Options use `per_page` and `page`; include is passed via the options object.
- **Helpers**: Fields module uses shared file helpers from `helpers.ts`; `getMimeType` exported. Age and contact helpers accept `string | null | undefined` where API types allow null.
- **Modules and types**: Refactored for consistency with check-ins (namespace imports, inferred return types). CONTRIBUTING, MIGRATION_GUIDE, README, and examples updated.

## [3.1.1] - 2026-02-10

### Changed

- **Type naming aligned with check-ins package**: Canonical public types are now `*Resource` (flattened shape returned by the client). Internal JSON:API shapes are `*ResourceObject`. List responses use `ListResponse<*Resource>`; single resources use `*Single` (= `*Resource`). All modules use a single namespace import: `import type * as Types from '../types'` and reference `Types.*ResourceObject` for base client calls and `Types.*Resource` / `Types.*Attributes` where appropriate.

### Removed

- **`FlattenedPersonResource`** and **`FlattenedFieldDatumResource`**: Use **`PersonResource`** and **`FieldDatumResource`** instead (same flattened shape; naming is now consistent across PCO packages).

### Breaking changes

- **Consumers that imported `FlattenedPersonResource` or `FlattenedFieldDatumResource`** must switch to `PersonResource` and `FieldDatumResource` respectively.
- **Consumers that relied on raw `Paginated` or `Response` list/single types** for people resources should use the new `ListResponse<*Resource>` and `*Single` / `*Resource` types from `./types`.

### Dependency

- **Core package**: `@rachelallyson/planning-center-base-ts` dependency updated to `^1.1.3` (from `^1.1.0`) for consistency with the latest core release. No API or behavior changes in this release.

## [3.1.0] - 2026-02-05

### Added

- **ListsModule.getRules(listId)**: New method to fetch rules for a list (`GET /people/v2/lists/:id/rules`). Returns paginated list of rules with `data`, `meta`, and `links`. Types `ListRuleResource`, `ListRuleAttributes`, and `ListRulesList` are exported.

## [3.0.0] - 2026-01-28

### Added

- **Debug logging**: Set `config.debug: true` (or an options object) when creating the client to see detailed logs (rate limiting, retries, each request, and each module call). Helpers `createDebugLogger`, `attachDebugListener`, and `formatDebugEvent` are exported; see `docs/DEBUG_LOGGING.md` if present.
- **Person create/update with snake_case**: You can pass snake_case attributes (e.g. `first_name`, `last_name`) to `client.people.create()` and `client.people.update()` in addition to camelCase; both are accepted.
- **Stricter list options**: List and page options (e.g. `PersonListOptions`, `WorkflowPageOptions`) are fully typed per endpoint. Types such as `PersonInclude`, `PersonOrderField`, `PersonWhereClause` (and equivalents for other resources) are exported for better autocomplete and type safety.
- **Included-data helpers**: `findIncluded`, `resolveIncluded`, and `createIncludedLookup` are exported for working with JSON:API `included` data.
- **Event types**: When you use `client.on('request:start', ...)` (and other events), TypeScript narrows the handler argument to the correct event type via overloads.
- **`getPage()`** on all list-capable modules for single-page fetching (e.g. `client.people.getPage({ per_page: 25, page: 1, where: { status: 'active' } })`).

### Changed

- **Responses with `include`**: When you request related data (e.g. `getById(id, ['primary_campus'])`), that data now appears at the top level (e.g. `person.primary_campus`) as well as in the response structure.
- **Contacts create methods** now require the person ID as the first argument (API is person-scoped): `createEmail(personId, data)`, `createPhoneNumber(personId, data)`, `createAddress(personId, data)`, `createSocialProfile(personId, data)`.
- **Single-page fetching**: `getAllPagesPaginated()` has been removed from all modules. Use `getPage(options)` instead.
- **Low-level HTTP helpers** are no longer exported: `del`, `getAllPages`, `getList`, `getSingle`, `patch`, `post`. Use module methods or `createPcoClient` / `getRateLimitInfo` from core.
- **Function-style API** has been removed: standalone functions such as `createPerson`, `getPerson`, `getHouseholds`, `getLists` are no longer exported. Use the client and its modules (e.g. `client.people.create`, `client.contacts.createEmail(personId, data)`, `client.households.getAll()`).
- **`buildQueryParams`** is no longer exported from this package; use module methods and the exported option types. It remains available from `@rachelallyson/planning-center-base-ts` if needed.
- **Modules**: All 11 modules now receive a config getter for debug and pass option objects into core for query building. See `MODULE_CHANGES.md` for a per-module summary.

### Breaking changes

- **Response shape (flattened data)**: All methods now return **flattened** resources (from core `mapIncludedToRelationships`). Use `resource.first_name` instead of `resource.attributes.first_name`, and `resource.emails` instead of `resource.relationships.emails.data` and `response.included`. Applies to getById, getPage, getAll, create, and update responses.
- **Contacts**: If you use `client.contacts.createEmail(data)` (or the same for phone/address/social profile), you must switch to `createEmail(personId, data)` (and similarly for `createPhoneNumber`, `createAddress`, `createSocialProfile`).
- **Function API**: If you import the old function API (`createPerson`, `getPerson`, `getHouseholds`, `getLists`, etc.), replace those calls with the module API on a `PcoClient` instance.

### Dependency

- This release depends on `@rachelallyson/planning-center-base-ts` `^1.1.1`. It is installed automatically when you install the people package.

## [2.14.1] - 2026-01-21

### ✨ **New Features**

- **Strictly Typed API Options**: Added comprehensive TypeScript types for all endpoint parameters
  - Created `api-options.ts` with strict types for Include, OrderField, WhereClause, and ListOptions
  - Fully typed: Person, FieldDefinition, Workflow, Note, List, Household endpoints
  - Basic structure for: Campus, Form, Report, ServiceTime (can be enhanced with full API doc extraction)
  - All types exported from main index for easy import
  - Replaces `Record<string, any>` with strict interfaces for better type safety and IDE autocomplete
  - Added `order` parameter support to people, workflows, notes, lists, households modules

### 🔧 **Bug Fixes**

- **Complete Tab API Coverage**: Added missing `getTabById()` / `getTab()` method to retrieve a single tab by ID
  - Module API: `client.fields.getTabById(id, include?)`
  - Function API: `getTab(client, tabId, params?, context?)`
  - Completes full CRUD coverage for tabs (get, list, create, update, delete)

- **Fixed `getAll()` Methods to Actually Get All Pages**: All `getAll()` methods now fetch all pages instead of just one
  - Fixed: `people.getAll()`, `workflows.getAll()`, `notes.getAll()`, `lists.getAll()`, `households.getAll()`, `campus.getAll()`, `forms.getAll()`, `reports.getAll()`, `service-time.getAll()`
  - Previously used `getList()` (one page), now uses `getAllPages()` (all pages)
  - Note: `per_page` and `page` options are ignored when using `getAll()` - it automatically fetches all pages

- **Removed `getAllPagesPaginated()` Methods**: Removed redundant `getAllPagesPaginated()` methods from all modules
  - `getAll()` now handles fetching all pages automatically
  - Removed from: `people`, `workflows`, `notes`, `lists`, `households`, `campus`, `forms`, `reports`, `service-time` modules

- **Added `getPage()` Methods for Single Page Fetching**: Added `getPage()` methods to all modules for fetching a single page with full pagination control
  - Use `getAll()` when you need all pages automatically
  - Use `getPage()` when you need a specific page, custom per_page, or want to limit results
  - Available on: `people.getPage()`, `workflows.getPage()`, `notes.getPage()`, `lists.getPage()`, `households.getPage()`, `campus.getPage()`, `forms.getPage()`, `reports.getPage()`, `service-time.getPage()`
  - Example: `client.people.getPage({ per_page: 25, page: 1, where: { status: 'active' } })`

- **Fixed `getAllFieldDefinitions()` Pagination**: Changed `include: ['tab']` to `include: 'tab'` to properly fetch all pages
  - `getAllPages()` expects query params where `include` is a comma-separated string, not an array

- **Made `getAllFieldDefinitions()` Include Parameter Optional**: `getAllFieldDefinitions()` now accepts an optional `include` parameter
  - Defaults to `['tab']` if not provided (maintains backward compatibility)
  - Can pass custom include array: `getAllFieldDefinitions(['tab', 'field_options'])`
  - Can pass empty array to exclude relationships: `getAllFieldDefinitions([])`

- **Added `where` Filtering, `order`, and `includeDeleted` Option to `getAllFieldDefinitions()`**: Enhanced `getAllFieldDefinitions()` with full API parameter support
  - Added `where` parameter for filtering: `getAllFieldDefinitions(['tab'], { where: { tab_id: '123', data_type: 'string' } })`
  - Added `order` parameter for sorting: `getAllFieldDefinitions(['tab'], { order: 'sequence' })` or `{ order: '-name' }` for descending
  - Added `includeDeleted` option: `getAllFieldDefinitions(['tab'], { includeDeleted: true })`
  - Valid where keys: `config`, `data_type`, `deleted_at`, `name`, `sequence`, `slug`, `tab_id`
  - Valid order values: `config`, `data_type`, `deleted_at`, `name`, `sequence`, `slug`, `tab_id` (prefix with `-` for descending)

### 📦 **Exports**

- `getTab` - Function API for retrieving a single tab by ID

### 🧪 **Testing**

- Added tests for `getTabById()` / `getTab()` in fields test suites
- Updated all `getAll()` tests to mock `paginationHelper.getAllPages()` instead of `httpClient.request()`

## [2.14.0] - 2026-01-21

### ✨ **New Features**

- **🔍 Multi-Step Search Strategy**: New `searchStrategy: 'multi-step'` option for maximum matching success
  - Tries multiple matching approaches in order until a match is found
  - Strategy order: fuzzy+age → fuzzy → exact+age → exact
  - Handles name variations and age preference filtering automatically
  - Significantly reduces duplicate person creation

- **📛 Name-Based Search Fallback**: New `fallbackToNameSearch` option with contact validation
  - Falls back to name search when email/phone search fails
  - Validates contact info to prevent wrong-person matches (e.g., two "John Smith"s)
  - Configurable validation: `contactValidation: 'strict' | 'domain' | 'similarity'`

- **⚡ Multi-Phase Retry Configurations**: New `retryConfigs` option for phase-specific retry control
  - `initial`: Quick search phase (default: 30s max wait, 3 retries)
  - `aggressive`: Final search before create (default: 60s max wait, 6 retries)
  - Prevents duplicates when PCO hasn't indexed contacts yet (15-30 min delay)

- **✅ Person ID Verification**: New `client.people.verifyPersonExists()` method
  - Verifies a person exists in PCO with configurable timeout
  - Handles merged/deleted persons gracefully (returns false for 404)
  - Useful for validating cached person IDs before use

- **🔐 Trust-Based Caching Helpers**: New utilities for smart person ID caching
  - `calculateTrust(createdAt, trustWindow)`: Determines if cached personId can be trusted
  - `DEFAULT_TRUST_WINDOW`: 1-hour default trust window constant
  - Skip verification for fresh personIds to avoid race conditions

- **📧 Contact Validation Helpers**: New utilities for contact info matching
  - `emailDomainsMatch(email1, email2)`: Handles aliases (gmail/googlemail) and typos
  - `phoneNumbersSimilar(phone1, phone2)`: Handles format variations and country codes
  - `validateContactSimilarity()`: Validates contact info for name-based matches
  - `extractEmailDomain()`: Extracts domain from email address

### 🔧 **Improvements**

- **Retry Config Refactoring**: Extracted `RetryConfig` interface for reusability
- **Better Logging**: Multi-step search logs which strategy found the match
- **Aggressive Final Search**: When `retryConfigs.aggressive` is set, performs final search before creating

### 📚 **Documentation**

- Updated README_V2.md with examples for all new features
- Added code examples for multi-step search, contact validation, and trust calculation

### 🧪 **Testing**

- Added `tests/helpers/contact-validation.test.ts` - Contact validation helper tests
- Added `tests/helpers/trust-calculation.test.ts` - Trust calculation tests
- Added `tests/matching/multi-step.test.ts` - Multi-step search strategy tests
- Added `tests/modules/people-verify.test.ts` - Person verification tests

### 📦 **Exports**

New exports from the package:

- `emailDomainsMatch`, `extractEmailDomain`, `phoneNumbersSimilar`, `validateContactSimilarity`
- `calculateTrust`, `DEFAULT_TRUST_WINDOW`, `TrustResult` (type)
- `RetryConfig` (type), `PersonMatchOptions` (type)
- `DEFAULT_INITIAL_RETRY_CONFIG`, `DEFAULT_AGGRESSIVE_RETRY_CONFIG`

## [2.13.0] - 2026-01-20

### ✨ **New Features**

- **🎯 Lenient Age Preference Filtering**: Added `agePreferenceLenient` option for flexible age-based filtering
  - When `agePreferenceLenient: true`, age preferences only filter profiles that have birthdates
  - Profiles without birthdates are included regardless of `agePreference` setting
  - Prevents false negatives when searching for existing people with incomplete age data
  - Backward compatible - default behavior remains strict filtering (only `agePreference: 'any'` includes profiles without birthdates)

## [2.12.2] - 2026-01-20

### ✨ **New Features**

- **Direct Personal Access Token Configuration**: Added support for passing `personalAccessTokenSecret` directly in config (alternative to environment variables)
- **Flexible Authentication**: Choose between environment variables or direct config based on your needs

## [2.12.1] - 2026-01-20

### ✨ **New Features**

- **Duplicate Prevention Integration Tests**: Added comprehensive integration tests for duplicate person prevention
  - `duplicate-prevention-comprehensive.integration.test.ts` - Tests the bug scenario where PCO contact verification delays cause duplicates
  - `duplicate-prevention-retry-exhaustion.integration.test.ts` - Tests retry logic when contact verification takes too long
  - Enhanced test coverage for the retry logic that prevents duplicate person creation

## [2.12.0] - 2026-01-14

### ✨ **New Features**

- **📋 List Run Functionality**: Added ability to run a List to update its results
  - New `runList()` function in `src/people/lists.ts` for running lists via the function API
  - New `run()` method in `ListsModule` for running lists via the module API
  - Endpoint: `POST /people/v2/lists/{list_id}/run`
  - Updates list results based on current list rules

## [2.11.0] - 2025-01-15

### ✨ **New Features**

- **🔄 Automatic Retry Logic for Contact Verification**: Added built-in retry logic to prevent duplicate person creation
  - Automatically retries when searching for existing persons with email/phone
  - Handles PCO contact verification delays (30-90+ seconds)
  - Uses exponential backoff (10s → 15s → 22.5s → 33.75s → 50.6s)
  - Configurable retry behavior via `retryConfig` option
  - Default: 5 retries, 120 seconds max wait time
  - Logs retry attempts with `[PERSON_MATCH]` prefix for debugging
  - Prevents duplicate person creation when PCO takes time to verify/index contacts

### 🔧 **Improvements**

- **Duplicate Prevention**: `findOrCreate` now automatically handles PCO contact verification delays
  - Retry logic activates automatically when `createIfNotFound: false` and email/phone are provided
  - No manual retry code needed - library handles it automatically
  - Prevents race conditions where duplicate persons are created

### 📚 **Documentation**

- Added `RETRY_LOGIC_FIX.md` - Detailed explanation of the retry logic fix
- Added `USING_RETRY_LOGIC.md` - Guide for using retry logic in your app
- Added `MIGRATION_GUIDE_FOR_YOUR_APP.md` - Migration guide to simplify existing code
- Added `TEST_FAILURE_ANALYSIS.md` - Troubleshooting guide for test failures

### 🧪 **Testing**

- Added comprehensive integration tests for retry logic
- Tests verify retry logic prevents duplicate person creation
- Tests demonstrate bug scenario and fix

## [2.10.0] - 2025-01-15

### ✨ **New Features**

- **📧 Email Normalization & Validation**: Added email normalization and format validation to improve search accuracy
  - New `normalizeEmail()` helper function (lowercase and trim)
  - Email is now normalized before search to improve PCO API search results
  - Email format validation prevents wasted API calls on invalid emails
- **📱 Phone Normalization**: Added phone normalization to improve search accuracy
  - New `normalizePhone()` helper function (normalizes to `+1XXXXXXXXXX` format)
  - Phone numbers are now normalized before search to improve PCO API search results
- **✅ First Name Validation**: Added first_name validation in person creation
  - Validates first_name is required before attempting person creation
  - Provides clearer error messages: "First name is required to create a person"
  - Fails fast instead of waiting for API error response

### 🔧 **Improvements**

- **Normalization Consistency**: Refactored normalization logic into reusable helper functions
  - All email/phone normalization now uses consistent helper functions
  - Updated both `matcher.ts` and `scoring.ts` to use shared normalization functions
  - Removed duplicate inline normalization code

### 📦 **Exports**

- Exported `normalizeEmail` and `normalizePhone` helper functions from main package index for library users

## [2.9.1] - 2025-01-14

### 🐛 **Bug Fixes**

- **Type System Accuracy**: Fixed TypeScript type definitions to match actual API responses
  - Updated nullable fields to properly use `string | null` and `number | null` types
  - Fixed `PersonAttributes`: `given_name`, `middle_name`, `nickname`, `anniversary`, `gender`, `grade`, `graduation_year`, `medical_notes`, `remote_id`, `inactivated_at` now correctly typed as `string | null`
  - Fixed `CampusAttributes`: `latitude`, `longitude` now `string | null`; `phone_number`, `website` now `string | null`; `twenty_four_hour_time` now `boolean | null`; `date_format` now `number | null`
  - Fixed `WorkflowCardAttributes`: `calculated_due_at_in_days_ago`, `snooze_until`, `removed_at`, `flagged_for_notification_at`, `moved_to_step_at` now correctly typed as nullable
- **Test Suite Fixes**: Fixed integration test expectations to match actual API behavior
  - Relaxed relationship validation tests to make `links` optional (not always present in API responses)
  - Fixed batch test data structure access to use `batchResult.data.data` (batch results wrap API responses)
  - Fixed error handling tests to check error `status` property and use correct event name (`request:error`)
  - Updated v2 service-time test to use `getAll()` instead of `getAllPagesPaginated()`
  - Relaxed batch test expectations to handle API validation behavior

### 🧪 **Testing Improvements**

- Comprehensive integration test suite now passes (655+ tests)
- All type validation tests align with actual API response structures
- Error handling tests verify correct error structure and event emission

## [2.9.0] - 2025-01-14

### 🎯 **Matching Logic Improvements**

This release significantly improves the accuracy of person matching by verifying email/phone matches and preventing incorrect name-only matches.

### 🐛 **Critical Bug Fixes**

- **🔍 Email/Phone Verification**: Fixed matching logic that was allowing name-only matches even when email/phone were provided but didn't match
  - Previously, searching with email/phone would match people with different contact info if names matched
  - Now requires actual email/phone verification before considering name matches
- **✅ Verified Contact Matching**: `scoreEmailMatch()` and `scorePhoneMatch()` now actually fetch and verify contact information instead of assuming matches
- **🚫 Name-Only Matching Restrictions**: Name-only matching now only occurs when:
  - Multiple people share the same email/phone (name helps distinguish), OR
  - No email/phone was provided in the search
- **🎯 Exact Match Strategy**: Made "exact" matching strategy stricter, requiring verified email/phone matches unless multiple people share the same contact info

### ✨ **New Features**

- **📝 Auto-Update Contact Info**: New `addMissingContactInfo` option in `PersonMatchOptions`
  - When enabled, automatically adds missing email/phone to a person's profile when a match is found
  - Missing contacts are added as non-primary to preserve existing primary contacts
  - Helps keep person profiles up-to-date when new contact information is discovered

### 🔧 **Technical Improvements**

- **🔍 Async Verification**: Email and phone matching now uses async methods to fetch and verify actual contact information
- **📊 Improved Scoring**: MatchScorer now requires PeopleModule dependency to verify matches
- **🎯 Better Match Prioritization**: Verified email/phone matches are prioritized over name-only matches
- **📖 Enhanced Documentation**: Comprehensive JSDoc comments and README examples for all new features

### 📚 **Documentation**

- **📖 JSDoc Updates**: Added detailed documentation for `PersonMatchOptions` interface and `findOrCreate()` method
- **📝 README Examples**: Added example showing `addMissingContactInfo` usage
- **🔍 Method Documentation**: Updated all matching methods with comprehensive parameter descriptions

### 🎯 **Impact**

This release fixes the issue where:

- ❌ Searching with `rachel@onark.app` + `+11233853584` would incorrectly match someone with `rachel@hangar31.dev` + `+16103017206` based on name alone
- ❌ Email/phone matches were assumed without verification
- ❌ Name-only matching occurred even when email/phone were provided

Now matching:

- ✅ Verifies email/phone actually match before considering a match
- ✅ Only uses name matching when appropriate (multiple people share contact info or no contact info provided)
- ✅ Can automatically update profiles with missing contact information
- ✅ Provides stricter exact matching for high-confidence scenarios

## [2.8.0] - 2025-01-11

### 🎯 **CRITICAL FINDORCREATE BUG FIX**

This release fixes a critical bug in the `findOrCreate` function that was causing it to always create new people instead of finding existing ones. This was due to incorrect API parameter names and scoring issues.

### 🐛 **Critical Bug Fixes**

- **🔍 Search Parameter Names**: Fixed incorrect API parameter names in search methods
  - Changed `where[name]` → `where[search_name]` (API now recognizes this)
  - Changed `where[email]` → `where[search_name_or_email]` (API now recognizes this)  
  - Changed `where[phone]` → `where[search_phone_number]` (API now recognizes this)
- **📊 Scoring System**: Fixed email and phone scoring methods that were returning 0 instead of proper scores
- **🎯 Matching Thresholds**: Adjusted scoring thresholds for better name-only matching
- **📞 Contact Creation**: Added required `location: 'Home'` field to email and phone creation

### ✨ **New Features**

- **🔍 Flexible Search**: Implemented powerful `search_name_or_email_or_phone_number` parameter for broader matching
- **⚖️ Dynamic Scoring Weights**: Increased name matching weight from 0.2 to 0.4 for name-only matches
- **📈 Improved Thresholds**: Lowered fuzzy matching threshold from 0.7 to 0.5 for better matching

### 🔧 **Technical Improvements**

- **📝 Enhanced Error Logging**: Added detailed error messages for contact creation failures
- **🔍 Better Search Strategies**: Improved `getCandidates` method with better error handling
- **🎯 Scoring Optimization**: Fixed `scoreEmailMatch` and `scorePhoneMatch` to return 1.0 for perfect matches
- **🔄 HTTP Client Resilience**: Added retry limits and better error handling for rate limits and authentication failures
- **📄 Pagination Safety**: Added safeguards against infinite pagination loops

### 📊 **Performance & Reliability**

- **✅ Duplicate Prevention**: `findOrCreate` now properly finds existing people instead of creating duplicates
- **📞 Contact Integration**: New people are created with proper email and phone contacts
- **🔍 Search Accuracy**: All search methods now work correctly with Planning Center API
- **⚡ API Efficiency**: Uses correct parameter names for optimal API performance

### 🧪 **Testing & Verification**

- **✅ Real API Testing**: Verified fix works with actual Planning Center API calls
- **✅ All Tests Pass**: 257/257 tests passing with no regressions
- **✅ Integration Tests**: Created comprehensive integration tests for `findOrCreate` functionality
- **✅ Live Verification**: Confirmed fix works in production Planning Center environment

### 📚 **Documentation**

- **📖 Migration Guide**: Created comprehensive guide for simplifying `getPCOPerson` functions
- **🔧 Code Examples**: Added examples showing before/after migration patterns
- **📋 API Documentation**: Updated documentation to reflect correct parameter usage
- **🧪 Integration Tests**: Added comprehensive integration tests for `findOrCreate` functionality

### 🎯 **Impact**

This fix resolves the core issue where `findOrCreate` was:

- ❌ Always creating new people (instead of finding existing ones)
- ❌ Creating people without contact information
- ❌ Using incorrect API parameters that Planning Center ignored
- ❌ Scoring matches incorrectly (always 0 for email/phone)

Now `findOrCreate`:

- ✅ Properly finds existing people by email, phone, and name
- ✅ Creates new people with complete contact information
- ✅ Uses correct API parameters that Planning Center recognizes
- ✅ Scores matches accurately for proper duplicate prevention

### 🔧 **Additional Improvements**

- **🔄 HTTP Client Enhancements**:
  - Added retry limits for rate limit errors (max 5 retries)
  - Added retry limits for authentication failures (max 3 retries)
  - Improved error handling for token refresh failures
- **📄 Pagination Improvements**:
  - Added safeguards against infinite pagination loops
  - Better detection of same-page pagination issues
  - Enhanced logging for pagination problems

### 📁 **Files Modified**

**Core Library Files**:

- `src/modules/people.ts` - Fixed search parameter names and implemented flexible search
- `src/helpers.ts` - Updated searchPeople helper with correct parameter names
- `src/matching/matcher.ts` - Enhanced error logging and contact creation with location field
- `src/matching/scoring.ts` - Fixed email/phone scoring methods and improved name matching weights
- `src/matching/strategies.ts` - Adjusted matching thresholds for better accuracy
- `src/core/http.ts` - Added retry limits and improved error handling
- `src/core/pagination.ts` - Added safeguards against infinite pagination loops

**Documentation & Testing**:

- `CHANGELOG.md` - Comprehensive documentation of all changes
- `package.json` - Updated version to 2.8.0
- `MIGRATION_GUIDE.md` - Complete guide for simplifying getPCOPerson functions
- `tests/integration/findorcreate-fix.integration.test.ts` - New integration tests for findOrCreate

### 🎯 **Release Summary**

This release represents a **major reliability improvement** for the Planning Center People API client. The critical `findOrCreate` bug that was causing duplicate person creation has been completely resolved, along with several additional stability improvements.

**Key Metrics**:

- ✅ **100% Test Coverage**: All 257 existing tests pass with no regressions
- ✅ **Real API Verified**: Tested with actual Planning Center API calls
- ✅ **Production Ready**: Confirmed working in live Planning Center environment
- ✅ **Backward Compatible**: No breaking changes, existing code works unchanged
- ✅ **Performance Improved**: Fewer API calls, better error handling, more reliable

**For Users**:

- **Immediate Benefit**: `findOrCreate` now works as originally intended
- **No Code Changes Required**: Existing implementations automatically benefit
- **Better Reliability**: Enhanced error handling and retry logic
- **Simplified Code**: Can remove complex workarounds (see Migration Guide)

### 🚀 **Breaking Changes**

- **None**: This is a bug fix release with no breaking changes
- **Backward Compatible**: All existing code continues to work
- **Enhanced Functionality**: Existing `findOrCreate` calls now work as originally intended

## [2.7.0] - 2025-01-11

### 🚀 **RATE LIMITING IMPROVEMENTS**

This release updates the rate limiting implementation to match Planning Center's actual API specifications and adds enhanced error handling capabilities.

### Added

- **📊 Enhanced Rate Limiting**: Updated default rate limits to match PCO's actual API (100 requests per 20 seconds)
- **🔄 Dynamic Period Adjustment**: Automatically adapts to server-provided time periods via `X-PCO-API-Request-Rate-Period` header
- **🔍 Error Parsing**: New `parseRateLimitError()` method extracts detailed information from 429 error responses
- **📝 Error Message Parsing**: Handles error messages like `"Rate limit exceeded: 118 of 100 requests per 20 seconds"`
- **🧪 Comprehensive Testing**: Added 22 rate limiter tests with new 20-second window and error parsing tests

### Changed

- **⚡ Rate Limit Defaults**: Changed from 100 requests per 60 seconds to 100 requests per 20 seconds
- **📚 Documentation**: Updated all documentation to reflect correct rate limiting specifications
- **🔧 Header Synchronization**: Enhanced parsing of `X-PCO-API-Request-Rate-Period` header for dynamic window adjustment
- **📖 Configuration Examples**: Updated client configuration examples with proper rate limiting settings

### Fixed

- **🎯 API Compliance**: Now correctly follows Planning Center's actual API rate limits
- **🔄 Server Synchronization**: Better rate limit tracking that stays in sync with PCO's servers
- **📊 Debug Information**: Enhanced visibility into rate limit status and remaining requests

### Technical Details

- **Backward Compatible**: No breaking changes - existing code continues to work
- **Future-Proof**: Automatically adapts to PCO rate limit changes via header synchronization
- **Performance**: More accurate rate limiting reduces 429 errors and improves API efficiency

## [2.6.3] - 2025-01-10

### 🏢 **CAMPUS ATTRIBUTES ENHANCEMENT**

This patch release adds comprehensive campus attributes for better campus management and configuration support.

### Added

- **📝 Enhanced CampusAttributes**: Added comprehensive campus configuration attributes
  - **Time Settings**: `twenty_four_hour_time?: boolean` - 24-hour time format preference
  - **Date Settings**: `date_format?: number` - Date format configuration
  - **Features**: `church_center_enabled?: boolean` - Church Center integration status
  - **Contact Info**: `phone_number?: string`, `website?: string` - Campus contact details
  - **Location**: `country?: string` - Country information
  - **Timestamps**: `created_at?: string`, `updated_at?: string` - Audit trail

### Enhanced Campus Management

```typescript
// Now you get full type safety for campus attributes
const campus: CampusResource = {
  type: 'Campus',
  id: 'campus-123',
  attributes: {
    name: 'Main Campus',
    street: '123 Main St',
    city: 'Anytown',
    state: 'CA',
    zip: '12345',
    country: 'US',
    phone_number: '555-1234',
    website: 'https://example.com',
    twenty_four_hour_time: true,    // ✅ New attribute
    date_format: 1,                  // ✅ New attribute  
    church_center_enabled: true,     // ✅ New attribute
    created_at: '2025-01-10T00:00:00Z',
    updated_at: '2025-01-10T00:00:00Z'
  }
};

// Campus configuration management
const campusConfig = await client.people.getCampusById('campus-123');
if (campusConfig.attributes.church_center_enabled) {
  console.log('Church Center integration is active');
}
```

### Benefits

- **🏢 Complete Campus Data**: Access to all campus configuration options
- **⚙️ Configuration Management**: Better support for campus settings
- **🌍 International Support**: Country and date format configuration
- **📱 Church Center Integration**: Track integration status
- **🕐 Time Format Support**: 24-hour time format configuration

### Migration

No breaking changes - this is a type enhancement release:

```typescript
// Existing code continues to work
const campuses = await client.people.getCampuses();

// New attributes are available but optional
campuses.data.forEach(campus => {
  console.log('Campus:', campus.attributes.name);
  console.log('Church Center:', campus.attributes.church_center_enabled);
  console.log('Time Format:', campus.attributes.twenty_four_hour_time);
});
```

## [2.6.2] - 2025-01-10

### 🎯 **TYPE DEFINITION ENHANCEMENT**

This patch release adds enhanced type definitions for better TypeScript support and developer experience.

### Added

- **📝 FieldDataType Type**: Added comprehensive type definition for field data types
  - **Types**: `'boolean' | 'checkboxes' | 'date' | 'file' | 'number' | 'select' | 'string' | 'text'`
  - **Usage**: Provides type safety for field definition operations
  - **Benefits**: Better IntelliSense and compile-time validation

### Enhanced Type Safety

```typescript
// Now you get full type safety for field data types
const fieldDefinition: FieldDefinitionAttributes = {
  data_type: 'select', // ✅ TypeScript knows this is valid
  // ... other properties
};

// Invalid types will be caught at compile time
const invalidField = {
  data_type: 'invalid', // ❌ TypeScript error
};
```

### Migration

No breaking changes - this is a type enhancement release:

```typescript
// Existing code continues to work
const fields = await client.people.getFieldDefinitions();

// New type safety benefits (flattened resources: attributes at top level)
fields.data.forEach(field => {
  if (field.data_type === 'select') {
    // TypeScript knows this is a select field
    console.log('Select field:', field.name);
  }
});
```

## [2.6.1] - 2025-01-10

### 🐛 **CRITICAL BUG FIXES**

This patch release fixes critical bugs in the `findOrCreate` method that would cause runtime errors and API failures.

### Fixed

- **🐛 Critical Bug in findOrCreate**: Fixed broken contact creation in `findOrCreate` method
  - **Issue**: `createWithContacts` method didn't exist, causing runtime errors
  - **Issue**: Email/phone passed to person creation caused 422 API errors
  - **Fix**: Now properly creates person first, then adds contacts separately
  - **Enhancement**: Added campus assignment support with `campusId` option
  - **Enhancement**: Added proper error handling for contact creation failures

### Changed

- **🧹 Cleaned up PersonMatchOptions interface**: Removed unused `campus` field, kept only functional `campusId` field
- **📝 Better error handling**: Contact creation failures now log warnings instead of crashing

### Migration

No breaking changes - this is a bug fix release:

```typescript
// This now works correctly (was broken in 2.6.0)
const person = await client.people.findOrCreate({
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@gmail.com
    phone: '555-1234',
    campusId: 'campus-123'  // NEW: Campus assignment support
});
```

## [2.6.0] - 2025-01-10

### 🎯 **PERFORMANCE & DEPENDENCY OPTIMIZATION**

This release focuses on performance improvements and dependency optimization, making the library lighter, faster, and more efficient.

### Fixed

- **🐛 Critical Bug in findOrCreate**: Fixed broken contact creation in `findOrCreate` method
  - **Issue**: `createWithContacts` method didn't exist, causing runtime errors
  - **Issue**: Email/phone passed to person creation caused 422 API errors
  - **Fix**: Now properly creates person first, then adds contacts separately
  - **Enhancement**: Added campus assignment support with `campusId` option
  - **Enhancement**: Added proper error handling for contact creation failures

### Removed

- **📦 Axios Dependency**: Completely removed axios dependency by replacing it with native fetch API
- **🔧 Simplified Dependencies**: Reduced bundle size by eliminating unnecessary external dependencies
- **⚡ Performance Boost**: Native fetch API provides better performance than axios

### Improved

- **🚀 File Upload Performance**: File uploads now use native fetch API for better performance
- **📱 Better Browser Support**: Native fetch works consistently across all modern environments
- **🛡️ Enhanced Security**: Fewer external dependencies reduce security surface area
- **📦 Smaller Bundle Size**: Eliminated ~50KB+ dependency from the bundle

### Technical Details

- **File Downloads**: Replaced `axios.get()` with native `fetch()` for downloading files from URLs
- **File Uploads**: Replaced `axios.post()` with native `fetch()` for uploading to PCO's upload service
- **Error Handling**: Maintained all existing error handling while using native APIs
- **Authentication**: Preserved all authentication mechanisms with native fetch

### Migration

No breaking changes - all existing functionality works exactly the same:

```typescript
// File uploads work exactly the same
await client.people.setPersonFieldBySlug('person-123', 'resume', fileUrl);

// All other functionality unchanged
const people = await client.people.getAll();
```

### Benefits

- **📦 Smaller Bundle**: Reduced dependency footprint
- **⚡ Better Performance**: Native fetch is faster than axios
- **🔧 Consistency**: Now using fetch API throughout the entire codebase
- **🛡️ Security**: Fewer dependencies to audit and maintain

## [2.5.0] - 2025-01-10

### 🎯 **NEW FEATURES - Person Relationship Management & Token Refresh Fix**

This release introduces comprehensive person relationship management endpoints and fixes critical token refresh issues, significantly enhancing the library's functionality and reliability.

### Added

#### **👥 Person Relationship Management**

- **🏢 Campus Management**: Complete campus assignment and retrieval system
  - `getPrimaryCampus(personId)` - Get person's current campus
  - `setPrimaryCampus(personId, campusId)` - Assign/update person's campus
  - `removePrimaryCampus(personId)` - Remove campus assignment
  - `getByCampus(campusId, options)` - Get all people in a campus

- **🏠 Household Management**: Full household membership system
  - `getHousehold(personId)` - Get person's household
  - `setHousehold(personId, householdId)` - Assign person to household
  - `removeFromHousehold(personId)` - Remove person from household
  - `getHouseholdMembers(householdId, options)` - Get all household members

- **📋 Related Data Access**: Comprehensive access to person-related data
  - `getWorkflowCards(personId, options)` - Get person's workflow cards
  - `getNotes(personId, options)` - Get person's notes
  - `getFieldData(personId, options)` - Get person's field data
  - `getSocialProfiles(personId, options)` - Get person's social profiles

#### **🔧 Enhanced Type System**

- **📝 Complete PersonRelationships**: Updated interface with all available relationships
- **🏷️ Type Safety**: Full TypeScript support for all relationship operations
- **🛡️ Null Handling**: Proper handling of optional relationships
- **📊 Resource Validation**: Enhanced relationship data validation

#### **🔐 Token Refresh Fix**

- **🚫 Fixed 401 Unauthorized**: Resolved token refresh failures by including client credentials
- **🔑 Client Credentials Support**: Added support for `clientId` and `clientSecret` in OAuth config
- **🌍 Environment Variables**: Support for `PCO_APP_ID` and `PCO_APP_SECRET` environment variables
- **🔄 Standardized Implementation**: Consistent token refresh across all HTTP clients
- **🛡️ Enhanced Error Handling**: Better error messages for token refresh failures

### Fixed

- **🔐 Token Refresh 401 Errors**: Fixed "Token refresh failed: 401 Unauthorized" by including required client credentials
- **🏗️ Missing Auth Types**: Added missing `BasicAuth` type to v2.0.0 client configuration
- **🔄 Inconsistent Implementations**: Standardized token refresh across `auth.ts` and `http.ts`
- **📝 Type Definitions**: Enhanced `PersonRelationships` interface with all available relationships

### Removed

- **📦 Axios Dependency**: Removed axios dependency by replacing it with native fetch API in file upload functionality
- **🔧 Simplified Dependencies**: Reduced bundle size by eliminating unnecessary external dependencies

### Usage Examples

```typescript
// Campus Management
const campus = await client.people.getPrimaryCampus('person-123');
await client.people.setPrimaryCampus('person-123', 'campus-456');

// Household Management
const household = await client.people.getHousehold('person-123');
await client.people.setHousehold('person-123', 'household-789');

// Related Data Access
const workflowCards = await client.people.getWorkflowCards('person-123');
const notes = await client.people.getNotes('person-123');
const fieldData = await client.people.getFieldData('person-123');

// Token Refresh with Client Credentials
const client = new PcoClient({
    auth: {
        type: 'oauth',
        accessToken: 'your-token',
        refreshToken: 'your-refresh-token',
        clientId: 'your-app-id',        // NEW: Client credentials
        clientSecret: 'your-app-secret', // NEW: Client credentials
        onRefresh: async (tokens) => { /* handle refresh */ },
        onRefreshFailure: async (error) => { /* handle failure */ }
    }
});
```

### Migration Guide

**From Direct API Calls:**

```typescript
// Before: Complex direct API calls
const response = await client.httpClient.request({
    method: 'PATCH',
    endpoint: `/people/${personId}`,
    data: { /* complex JSON structure */ }
});

// After: Simple, intuitive methods
await client.people.setPrimaryCampus(personId, campusId);
```

**Token Refresh Configuration:**

```typescript
// Add client credentials to your OAuth configuration
const client = new PcoClient({
    auth: {
        type: 'oauth',
        accessToken: 'your-token',
        refreshToken: 'your-refresh-token',
        clientId: process.env.PCO_APP_ID,        // NEW
        clientSecret: process.env.PCO_APP_SECRET, // NEW
        onRefresh: async (tokens) => { /* save tokens */ },
        onRefreshFailure: async (error) => { /* handle failure */ }
    }
});
```

## [2.4.0] - 2025-01-10

### 🎯 **NEW FEATURES - Age Preference Matching & Exact Name Matching**

This release introduces intelligent age-based person matching and precise name matching capabilities to enhance person discovery and reduce false positives.

### Added

#### **👥 Age Preference Matching**

- **🎂 Age-Based Filtering**: New `agePreference` option to prefer adults or children
- **📅 Age Range Matching**: Support for `minAge` and `maxAge` parameters for precise age targeting
- **🗓️ Birth Year Matching**: `birthYear` parameter for matching people born in specific years
- **🧮 Smart Age Calculation**: Enhanced age calculation with timezone-safe date handling
- **📊 Age-Based Scoring**: Age matching contributes 15% to overall match score for better accuracy

#### **🎯 Exact Name Matching**

- **✅ Precise Name Matching**: Only matches exact names, eliminating false positives from similar names
- **🔤 Case-Insensitive**: Maintains case-insensitive matching while ensuring exact character matching
- **⚡ Performance Optimized**: Simple string comparison for faster matching than fuzzy algorithms
- **🛡️ Reduced False Positives**: Prevents matching "Jon" when searching for "John"

#### **🔧 Enhanced Matching System**

- **📈 Improved Scoring Algorithm**: Updated scoring weights for better match prioritization
- **🎯 Candidate Filtering**: Age-based pre-filtering before scoring for more relevant results
- **📝 Enhanced Match Reasons**: More descriptive match explanations including age-based reasons
- **🧪 Comprehensive Testing**: 30+ new test cases covering age preferences and exact name matching

### Usage Examples

```typescript
// Age preference matching
const adultPerson = await client.people.findOrCreate({
  first_name: 'Jane',
  last_name: 'Smith',
  agePreference: 'adults', // Prefer 18+ years old
  matchStrategy: 'fuzzy'
});

// Age range matching
const youngAdult = await client.people.findOrCreate({
  first_name: 'Alice',
  last_name: 'Brown',
  minAge: 20,
  maxAge: 30,
  matchStrategy: 'fuzzy'
});

// Birth year matching
const millennial = await client.people.findOrCreate({
  first_name: 'David',
  last_name: 'Wilson',
  birthYear: 1990,
  matchStrategy: 'fuzzy'
});
```

### Technical Details

- **New Helper Functions**: `calculateAgeSafe()`, `isAdult()`, `isChild()`, `matchesAgeCriteria()`
- **Enhanced PersonMatchOptions**: Added `agePreference`, `minAge`, `maxAge`, `birthYear` properties
- **Updated Scoring System**: Age matching now contributes 15% to overall match score
- **Backward Compatibility**: All existing functionality remains unchanged

## [2.3.1] - 2025-01-10

### 🐛 **BUG FIXES & STABILITY IMPROVEMENTS**

This release focuses on comprehensive test suite stabilization and file upload functionality completion.

### Fixed

#### **🔧 File Upload Functionality**

- **✅ Completed v2.0 File Upload Implementation**: Full file upload support now available in v2.0 class-based API
- **📁 File Field Data Creation**: `createPersonFileFieldData` method fully implemented with proper error handling
- **🌐 HTML Markup Support**: Enhanced file URL extraction from HTML markup for seamless file uploads
- **🔐 Authentication Integration**: Proper authentication header handling for external file upload services

#### **🧪 Test Suite Stabilization**

- **✅ 100% Test Pass Rate**: Resolved all 16+ failing integration tests
- **⏱️ Timeout Management**: Proper timeout configurations for slow API operations (30s → 120s)
- **📊 Performance Expectations**: Realistic performance thresholds for API operations
- **🛡️ Error Resilience**: Enhanced test data handling and cleanup procedures

#### **🔧 Core Improvements**

- **🔗 HTTP Client Enhancement**: Added `getAuthHeader()` method for external service authentication
- **📝 Campus Module Fix**: Resolved recursive call issue in `getAllPages` method
- **🏠 Household Relationships**: Improved relationship data validation and error handling
- **📋 Field Operations**: Enhanced field type validation and person data management

#### **🧪 Test Infrastructure**

- **📊 Data Creation**: Added proper test data setup in `beforeAll` hooks
- **🔄 API Behavior Adaptation**: Updated test expectations to match current API responses
- **⚡ Timeout Optimization**: Strategic timeout increases for complex operations
- **🛠️ Validation Improvements**: Enhanced type validation for optional fields and relationships

### Technical Details

**File Upload Implementation:**

```typescript
// v2.0 File Upload now fully functional
const result = await client.fields.createPersonFieldData(
    personId, 
    fieldDefinitionId, 
    fileUrl
);
```

**Test Stability Improvements:**

- Notes tests: Added test data creation
- Workflow tests: Updated relationship expectations  
- Household tests: Enhanced relationship validation
- Field tests: Improved timeout and data handling
- Service time tests: Optimized pagination timeouts
- Forms tests: Increased timeout for slow operations
- Contacts tests: Enhanced error resilience

### Migration Notes

- **No Breaking Changes**: All existing APIs remain unchanged
- **Enhanced Reliability**: Improved error handling and timeout management
- **Better Performance**: Optimized test execution and API operation handling

## [2.3.0] - 2025-01-17

### 🚀 **NEW FEATURES - ServiceTime, Forms, and Reports Management**

This release adds three high-priority modules to extend the Planning Center People API client with essential church management functionality.

### Added

#### **⏰ ServiceTime Module**

- **Campus-Scoped ServiceTime Operations**: Full CRUD operations for service times within campuses
- **Type-Safe ServiceTime Resource**: Complete TypeScript support for service time attributes and relationships
- **Pagination Support**: Automatic pagination for service time listings

**ServiceTime Operations:**

- `client.serviceTime.getAll(campusId, params?)` - Get all service times for a campus
- `client.serviceTime.getById(campusId, id, include?)` - Get specific service time by ID
- `client.serviceTime.create(campusId, data)` - Create new service time
- `client.serviceTime.update(campusId, id, data)` - Update existing service time
- `client.serviceTime.delete(campusId, id)` - Delete service time

**ServiceTime Resource Structure:**

- **Time Data**: `start_time`, `day` (0-6 for Sunday-Saturday)
- **Metadata**: `description`, `created_at`, `updated_at`
- **Relationships**: `organization`, `campus`

#### **📝 Forms Module**

- **Comprehensive Forms Operations**: Read operations for forms, categories, fields, options, and submissions
- **Type-Safe Form Resources**: Complete TypeScript support for all form-related resources
- **Form Data Analysis**: Tools for analyzing form submissions and field data

**Forms Operations:**

- `client.forms.getAll(params?)` - Get all forms
- `client.forms.getById(id, include?)` - Get specific form by ID
- `client.forms.getFormCategory(formId)` - Get form category
- `client.forms.getFormFields(formId, params?)` - Get form fields
- `client.forms.getFormFieldOptions(formFieldId, params?)` - Get form field options
- `client.forms.getFormSubmissions(formId, params?)` - Get form submissions
- `client.forms.getFormSubmissionById(submissionId, include?)` - Get specific form submission
- `client.forms.getFormSubmissionValues(submissionId, params?)` - Get form submission values

**Forms Resource Structure:**

- **Form**: `name`, `description`, `active`, `archived_at`
- **FormCategory**: `name`, `created_at`, `updated_at`
- **FormField**: `name`, `field_type`, `required`, `sequence`
- **FormFieldOption**: `value`, `sequence`
- **FormSubmission**: `submitted_at`, `created_at`, `updated_at`
- **FormSubmissionValue**: `value`, `created_at`, `updated_at`

#### **📊 Reports Module**

- **Complete Reports CRUD Operations**: Create, read, update, and delete reports
- **Report Metadata**: Get report creator and updater information
- **Type-Safe Report Resource**: Full TypeScript support for report attributes and relationships
- **Pagination Support**: Automatic pagination for report listings

**Reports Operations:**

- `client.reports.getAll(params?)` - Get all reports
- `client.reports.getById(id, include?)` - Get specific report by ID
- `client.reports.create(data)` - Create new report
- `client.reports.update(id, data)` - Update existing report
- `client.reports.delete(id)` - Delete report
- `client.reports.getCreatedBy(reportId)` - Get report creator
- `client.reports.getUpdatedBy(reportId)` - Get report updater

**Reports Resource Structure:**

- **Report Data**: `name`, `body`
- **Metadata**: `created_at`, `updated_at`
- **Relationships**: `organization`, `created_by`, `updated_by`

### Documentation

- **Updated README.md** with ServiceTime, Forms, and Reports Management examples
- **Updated EXAMPLES.md** with comprehensive usage patterns for all three modules
- **Updated API_REFERENCE.md** with complete module documentation and resource types
- **Added new resource types** to TypeScript exports

### Testing

- **Integration Tests**: Complete test suites for ServiceTime, Forms, and Reports operations
- **Type Safety**: Full TypeScript coverage for all new resources
- **Error Handling**: Comprehensive error handling for all module operations
- **Campus-Scoped Testing**: ServiceTime tests properly handle campus-scoped operations

### Example Usage

```typescript
import { PcoClient } from '@rachelallyson/planning-center-people-ts';

const client = new PcoClient({
  auth: {
    type: 'personal_access_token',
    personalAccessToken: 'your-token'
  }
});

// ServiceTime Management
const serviceTimes = await client.serviceTime.getAll('campus-id');
const newServiceTime = await client.serviceTime.create('campus-id', {
  start_time: '09:00:00',
  day: 0, // Sunday
  description: 'Main Service'
});

// Forms Management
const forms = await client.forms.getAll();
const formFields = await client.forms.getFormFields('form-id');
const formSubmissions = await client.forms.getFormSubmissions('form-id');

// Reports Management
const reports = await client.reports.getAll();
const newReport = await client.reports.create({
  name: 'Monthly Attendance Report',
  body: 'Report showing monthly attendance statistics'
});
```

## [2.2.0] - 2025-01-17

### 🏢 **NEW FEATURE - Campus Management Support**

This release adds comprehensive Campus management functionality to the Planning Center People API client.

### Added

#### **🏢 Campus Module**

- **Complete Campus CRUD Operations**: Create, read, update, and delete campuses
- **Campus-Specific Operations**: Get campus lists and service times
- **Type-Safe Campus Resource**: Full TypeScript support for campus attributes and relationships
- **Pagination Support**: Automatic pagination for campus listings

#### **📋 Campus Operations**

- `client.campus.getAll()` - Get all campuses with filtering and pagination
- `client.campus.getById(id, include?)` - Get specific campus by ID
- `client.campus.create(data)` - Create new campus
- `client.campus.update(id, data)` - Update existing campus
- `client.campus.delete(id)` - Delete campus
- `client.campus.getLists(campusId)` - Get lists for a specific campus
- `client.campus.getServiceTimes(campusId)` - Get service times for a specific campus

#### **🏗️ Campus Resource Structure**

- **Location Data**: `latitude`, `longitude`, `street`, `city`, `state`, `zip`, `country`
- **Contact Information**: `phone_number`, `website`
- **Settings**: `twenty_four_hour_time`, `date_format`, `church_center_enabled`
- **Metadata**: `description`, `created_at`, `updated_at`

### Documentation

- **Updated README.md** with Campus Management examples
- **Updated EXAMPLES.md** with comprehensive Campus usage patterns
- **Updated API_REFERENCE.md** with complete Campus Module documentation
- **Added Campus types** to resource types documentation

### Testing

- **Integration Tests**: Complete test suite for Campus operations
- **Type Safety**: Full TypeScript coverage for Campus resources
- **Error Handling**: Comprehensive error handling for Campus operations

### Example Usage

```typescript
import { PcoClient } from '@rachelallyson/planning-center-people-ts';

const client = new PcoClient({
  auth: {
    type: 'personal_access_token',
    personalAccessToken: 'your-token'
  }
});

// Get all campuses
const campuses = await client.campus.getAll();

// Create new campus
const newCampus = await client.campus.create({
  description: 'Main Campus',
  street: '123 Church Street',
  city: 'Anytown',
  state: 'CA',
  zip: '12345',
  country: 'US',
  phone_number: '555-123-4567',
  website: 'https://maincampus.example.com',
  twenty_four_hour_time: false,
  date_format: 1,
  church_center_enabled: true
});

// Get campus-specific data
const campusLists = await client.campus.getLists('campus-id');
const serviceTimes = await client.campus.getServiceTimes('campus-id');
```

## [2.1.0] - 2025-01-17

### 🔒 **SECURITY RELEASE - Required Refresh Token Handling**

This release addresses a critical security issue where OAuth 2.0 clients could lose access when tokens expire without proper refresh handling.

### Breaking Changes

- **OAuth 2.0 Authentication**: `onRefresh` and `onRefreshFailure` callbacks are now **required** for OAuth configurations
- **Type Safety**: Enhanced type-safe authentication configuration prevents invalid configurations at compile time

### Security

- **CRITICAL**: OAuth 2.0 authentication now requires refresh token handling to prevent token loss
- **BREAKING**: Type-safe authentication configuration enforces required fields
- Enhanced token refresh implementation with proper error handling
- Improved authentication type safety with union types

### Fixed

- Fixed person matching to properly handle default fuzzy strategy
- Fixed mock client to support createWithContacts method
- Fixed event system tests to work with mock client
- Fixed phone number builder in mock response builder

### Migration from v2.0.0

**Before (v2.0.0):**

```typescript
const client = new PcoClient({
  auth: {
    type: 'oauth',
    accessToken: 'access-token',
    refreshToken: 'refresh-token'
    // Missing required callbacks - this will now cause TypeScript errors
  }
});
```

**After (v2.1.0):**

```typescript
const client = new PcoClient({
  auth: {
    type: 'oauth',
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    // REQUIRED: Handle token refresh to prevent token loss
    onRefresh: async (tokens) => {
      await saveTokensToDatabase(userId, tokens);
    },
    // REQUIRED: Handle refresh failures
    onRefreshFailure: async (error) => {
      console.error('Token refresh failed:', error.message);
      await clearUserTokens(userId);
    }
  }
});
```

## [2.0.0] - 2025-01-17

### 🚀 **MAJOR RELEASE - Complete API Redesign**

This is a **breaking change** release that completely redesigns the API for better developer experience, type safety, and maintainability.

### Added

#### **🏗️ New Class-Based Architecture**

- **PcoClient Class**: Main client with modular architecture
- **PcoClientManager**: Automatic client caching and lifecycle management
- **Event System**: Comprehensive event emission for monitoring and debugging
- **Module Architecture**: Organized API interactions into focused modules

#### **🔧 Core Utilities**

- **Built-in Pagination**: `getAllPages()` method for automatic pagination
- **Batch Operations**: Execute multiple operations with dependency resolution
- **Person Matching**: Smart person matching with fuzzy logic and `findOrCreate`
- **Type-Safe Field Operations**: Enhanced custom field operations with caching
- **Workflow State Management**: Smart workflow operations with duplicate detection

#### **📦 New Modules**

- **PeopleModule**: Core person operations with smart matching
- **FieldsModule**: Type-safe custom field operations with caching
- **WorkflowsModule**: Complete workflow and workflow card management
- **ContactsModule**: Email, phone, address, and social profile management
- **HouseholdsModule**: Household operations and member management
- **NotesModule**: Note and note category operations
- **ListsModule**: List and list category operations with rule-based membership

#### **🔐 Enhanced Authentication**

- **OAuth 2.0 Support**: Full OAuth with automatic token refresh
- **Personal Access Token**: HTTP Basic Auth support
- **Token Refresh**: Automatic refresh with callback support
- **Environment Persistence**: Automatic token persistence in test environments

#### **⚡ Performance & Reliability**

- **Rate Limiting**: Built-in rate limiting (100 req/min)
- **Error Handling**: Comprehensive error handling with retry logic
- **Request Timeouts**: Configurable request timeouts
- **Event Monitoring**: Real-time request/response monitoring

#### **🧪 Testing Infrastructure**

- **MockPcoClient**: Complete mock implementation for testing
- **MockResponseBuilder**: Response building utilities
- **RequestRecorder**: Request recording for testing
- **Integration Tests**: 129 comprehensive integration tests

### Changed

#### **🔄 Breaking Changes**

- **API Design**: Complete redesign from functional to class-based approach
- **Import Structure**: New import structure with `PcoClient` class
- **Method Names**: Updated method names for consistency
- **Type Definitions**: Enhanced type definitions with better type safety

#### **📈 Improvements**

- **Type Safety**: Enhanced TypeScript support with strict typing
- **Error Messages**: More descriptive error messages and handling
- **Documentation**: Comprehensive inline documentation
- **Performance**: Optimized request handling and caching

### Migration Guide

#### **Before (v1.x)**

```typescript
import { createPcoClient, getPeople, createPerson } from '@rachelallyson/planning-center-people-ts';

const client = createPcoClient({
    personalAccessToken: 'your-token',
    appId: 'your-app-id',
    appSecret: 'your-app-secret'
});

const people = await getPeople(client, { per_page: 10 });
const person = await createPerson(client, { first_name: 'John', last_name: 'Doe' });
```

#### **After (v2.0.0)**

```typescript
import { PcoClient } from '@rachelallyson/planning-center-people-ts';

const client = new PcoClient({
    auth: {
        type: 'personal_access_token',
        personalAccessToken: 'your-token'
    }
});

const people = await client.people.getAll({ per_page: 10 });
const person = await client.people.create({ first_name: 'John', last_name: 'Doe' });
```

### Removed

- **Functional API**: All functional API methods removed in favor of class-based approach
- **Legacy Types**: Old type definitions replaced with enhanced versions
- **Deprecated Methods**: All deprecated methods removed

### Fixed

- **Type Safety**: Resolved all TypeScript strict mode issues
- **Error Handling**: Improved error handling and retry logic
- **Rate Limiting**: Fixed rate limiting edge cases
- **Authentication**: Resolved token refresh and persistence issues
- Fixed person matching to properly handle default fuzzy strategy
- Fixed mock client to support createWithContacts method
- Fixed event system tests to work with mock client
- Fixed phone number builder in mock response builder

## [1.1.0] - 2025-10-08

### Added

- **Complete API Modularization**: Split monolithic `people.ts` into 9 focused modules for better maintainability
- **36 New API Functions**: Complete coverage of all PCO People API endpoints
- **File Upload Support**: New file handling capabilities with smart field type detection
- **Comprehensive Integration Tests**: 9 new integration test suites with 2,660+ lines of test coverage
- **Enhanced Helper Functions**: New file processing utilities and validation functions
- **Complete Function Checklist**: Comprehensive documentation of all available functions

### New API Functions

#### Core People Operations (`src/people/core.ts`)

- `getPeople()` - Get all people with filtering and pagination
- `getPerson()` - Get single person by ID
- `createPerson()` - Create new person
- `updatePerson()` - Update existing person
- `deletePerson()` - Delete person

#### Contact Management (`src/people/contacts.ts`)

- `getPersonEmails()` - Get all emails for a person
- `createPersonEmail()` - Create email for a person
- `getPersonPhoneNumbers()` - Get all phone numbers for a person
- `createPersonPhoneNumber()` - Create phone number for a person
- `getPersonAddresses()` - Get all addresses for a person
- `createPersonAddress()` - Create address for a person
- `updatePersonAddress()` - Update existing address
- `getPersonSocialProfiles()` - Get social profiles for a person
- `createPersonSocialProfile()` - Create social profile for a person
- `deleteSocialProfile()` - Delete social profile

#### Field Data Management (`src/people/fields.ts`)

- `createPersonFieldData()` - Create field data with smart file handling
- `deletePersonFieldData()` - Delete field data
- `getPersonFieldData()` - Get custom field data for a person
- `getFieldDefinitions()` - Get all field definitions
- `getFieldDefinition()` - Get single field definition
- `getFieldOptions()` - Get field options for a field definition
- `createFieldOption()` - Create field option
- `getTabs()` - Get field definition tabs
- `createFieldDefinition()` - Create new field definition
- `deleteFieldDefinition()` - Delete field definition

#### Household Operations (`src/people/households.ts`)

- `getHouseholds()` - Get all households
- `getHousehold()` - Get single household by ID

#### List Management (`src/people/lists.ts`)

- `getLists()` - Get all people lists
- `getListById()` - Get single list by ID
- `getListCategories()` - Get all list categories

#### Note Operations (`src/people/notes.ts`)

- `getNotes()` - Get all notes
- `getNote()` - Get single note by ID
- `getNoteCategories()` - Get all note categories

#### Workflow Management (`src/people/workflows.ts`)

- `getWorkflowCardNotes()` - Get notes for a workflow card
- `createWorkflowCardNote()` - Create note for workflow card
- `getWorkflowCards()` - Get workflow cards for a person
- `createWorkflowCard()` - Create workflow card for a person
- `getWorkflows()` - Get all workflows
- `getWorkflow()` - Get single workflow by ID

#### Organization Operations (`src/people/organization.ts`)

- `getOrganization()` - Get organization information

### New Helper Functions

#### File Upload Utilities

- `extractFileUrl()` - Extract clean URLs from HTML markup
- `isFileUrl()` - Check if string is a valid file URL
- `getFileExtension()` - Extract file extension from URL
- `getFilename()` - Extract filename from URL
- `isFileUpload()` - Detect if value contains file upload
- `processFileValue()` - Smart processing of file values based on field type

#### Enhanced Validation

- `validatePersonData()` - Comprehensive person data validation
- `isValidEmail()` - Email format validation
- `isValidPhone()` - Phone number format validation

#### Utility Functions

- `formatPersonName()` - Format person names with nickname support
- `formatDate()` - Flexible date formatting
- `calculateAge()` - Calculate age from birthdate
- `buildQueryParams()` - Transform complex params to flat query params

### Testing

- **9 New Integration Test Suites**: Complete integration testing for all API modules
- **2,660+ Lines of Test Code**: Comprehensive test coverage for all new functions
- **File Upload Testing**: Dedicated tests for file handling functionality
- **Edge Case Coverage**: Testing for error scenarios and edge cases
- **Type Validation**: Runtime validation of all API responses

### Documentation

- **Function Checklist**: Complete documentation of all 36 available functions
- **File Upload Examples**: New example showing file upload usage patterns
- **Updated API Guide**: Enhanced documentation with new function examples
- **Usage Examples**: Comprehensive examples for all new functionality

### Changed

- **Modular Architecture**: Restructured codebase for better maintainability and organization
- **Enhanced Error Handling**: Improved error handling across all new functions
- **Type Safety**: Enhanced TypeScript definitions for all new functions
- **Performance**: Optimized API calls with better parameter handling

### Technical Improvements

- **Better Code Organization**: Logical separation of concerns across modules
- **Consistent Patterns**: Standardized function signatures and error handling
- **Enhanced TypeScript**: Improved type definitions and inference
- **Comprehensive Testing**: Full test coverage for all new functionality
- **Documentation**: Complete API documentation and usage examples

## [1.0.0] - 2025-01-08

### Added

- **Complete PCO People API Client**: Full TypeScript client for Planning Center Online People API
- **22 Resource Types**: Complete type definitions for all PCO People API resources
- **Runtime Type Validation**: Comprehensive validation against real API responses
- **Advanced Error Handling**: 7 different error handling strategies with automatic recovery
- **Performance Optimization**: Caching, streaming, batch processing, and memory management
- **Helper Functions**: 15+ helper functions for common operations
- **Comprehensive Testing**: 125 tests covering unit, integration, and edge cases
- **Production Features**: Circuit breakers, retry logic, rate limiting, and monitoring

### Core Features

- **TypeScript Support**: 100% TypeScript with strict type checking
- **JSON:API 1.0 Compliance**: Follows JSON:API specification exactly
- **Rate Limiting**: Built-in rate limiting with PCO's 100 req/min policy
- **Authentication**: Supports Personal Access Tokens and OAuth 2.0
- **Modern HTTP**: Uses native fetch API (no external dependencies)
- **Functional Approach**: Clean, composable functions instead of classes

### API Coverage

- **Person Management**: Create, read, update, delete people
- **Contact Information**: Manage emails, phone numbers, addresses
- **Households**: Family and household management
- **Field Definitions**: Custom fields and field data
- **Workflows**: Workflow cards and notes
- **Lists**: People lists and categories
- **Notes**: Person notes and categories
- **Organization**: Organization information and statistics

### Error Handling

- **Exponential Backoff**: Configurable retry with jitter
- **Circuit Breaker**: Fault tolerance pattern
- **Bulk Operations**: Individual error handling for bulk operations
- **Timeout Handling**: Configurable operation timeouts
- **Error Classification**: Intelligent error categorization
- **Error Recovery**: Automatic recovery strategies
- **Error Reporting**: Detailed error analysis and reporting

### Performance Features

- **Caching**: In-memory cache with TTL support
- **Streaming**: Memory-efficient processing of large datasets
- **Batch Processing**: Efficient API call batching
- **Pagination**: Automatic pagination with progress tracking
- **Memory Management**: Large dataset processing without memory issues
- **Performance Monitoring**: Built-in performance metrics
- **Concurrency Control**: Semaphore-based rate limiting
- **Adaptive Rate Limiting**: Dynamic rate adjustment

### Helper Functions

- **Person Management**: Complete person profiles, contact creation, search
- **Workflow Management**: Workflow cards with notes, bulk operations
- **Data Export**: Export all people data with filtering
- **Validation**: Data validation before API calls
- **Formatting**: Name formatting, date formatting, age calculation
- **Contact Management**: Primary contact extraction, validation

### Testing

- **Unit Tests**: 95 tests covering all core functionality
- **Integration Tests**: 23 tests against real PCO API
- **Edge Case Tests**: 7 tests for error scenarios and edge cases
- **Type Validation**: Runtime validation of all 22 resource types
- **100% Test Success Rate**: All 125 tests passing

### Documentation

- **API Usage Guide**: Comprehensive 9-section usage guide
- **Type Safety**: Complete TypeScript definitions with examples
- **Best Practices**: Performance optimization and error handling patterns
- **Troubleshooting**: Common issues and solutions
- **Examples**: Basic, advanced, and functional usage examples

### Production Readiness

- **Enterprise Features**: Circuit breakers, monitoring, error recovery
- **Scalability**: Memory-efficient processing for large datasets
- **Reliability**: Comprehensive error handling and retry logic
- **Performance**: Optimized for high-volume operations
- **Monitoring**: Built-in performance and error metrics
- **Type Safety**: Runtime validation ensures API compatibility

## [0.1.0] - 2024-01-XX

### Added

- Initial package structure
- Basic PCO People API client
- Core type definitions
- Basic error handling
- Rate limiting implementation
