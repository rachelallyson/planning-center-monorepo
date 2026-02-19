# API query options standard (People & Check-Ins)

This doc defines how we define and place **query option types** (where, include, order, filter, pagination, and composed GetPage/GetAll/GetById options) in the People and Check-Ins packages so both packages stay consistent.

## Standard

- **One central file per app package:** `src/types/api-options.ts`
  - **People:** `packages/planning-center-people-ts/src/types/api-options.ts`
  - **Check-Ins:** `packages/planning-center-check-ins-ts/src/types/api-options.ts`

- **Central file contains:**
  1. **Building blocks** (per vertex/resource):
     - `*WhereClause` (e.g. `PersonWhereClause`, `EventWhereClause`)
     - `*Include` (e.g. `PersonInclude`, `EventInclude`)
     - `*OrderField` (e.g. `PersonOrderField`, `EventOrderField`)
     - `*Filter` where the API supports filter-by (e.g. `EventFilter`, `CheckInFilter`)
  2. **Composed options** (per list/single endpoint):
     - `*GetPageOptions` – extends `QueryOptions`, uses that vertex’s Where/Include/Order/Filter, plus `per_page`/`page`
     - `*GetAllOptions` – `*GetPageOptions & PaginationOptions`
     - `*GetByIdOptions` – `{ include?: *Include[] }` (or whatever the single-resource endpoint accepts)
     - For nested list endpoints (e.g. event’s check-ins, event’s locations): e.g. `EventCheckInsGetPageOptions`, `EventGetLocationsGetPageOptions`, etc. Also live in the central file.

- **Modules:**
  - Do **not** define `GetPageOptions` / `GetAllOptions` / `GetByIdOptions` (or nested list options).
  - Import those types from `../types/api-options` and use them in method signatures.
  - Module-specific option types that are **not** query params (e.g. `PersonCreateOptions`, `PersonMatchOptions`) stay in the module.

- **Naming:**
  - Use `api-options.ts` for the central file in both packages (aligns with “options” as the thing callers pass in).
  - Building-block types can keep current names (`*WhereClause`, `*Include`, etc.); no need to rename to “params.”

## Benefits

- **Single place** to maintain and verify options against API docs (e.g. `API_PARAMS_VERIFICATION.md` / `API_OPTIONS_VERIFICATION.md`).
- **Consistent** package exports: both packages can export option types from `types/api-options` (or re-export from index).
- **Discoverability**: all list/single query options for an app live in one file.

**Done:** Both packages now use `api-options.ts`; Check-Ins was migrated (api-params.ts removed, composed options moved into api-options.ts).
