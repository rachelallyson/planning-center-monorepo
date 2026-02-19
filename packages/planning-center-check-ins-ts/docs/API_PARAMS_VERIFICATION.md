# Check-Ins API params verification checklist

Use this list to verify `src/types/api-options.ts` (where, include, filter, order, and composed GetPage/GetAll/GetById options) against the Planning Center docs.  
**Base URL (official):** https://developer.planning.center/docs/#/apps/check-ins/2025-05-28/vertices/  
**Local vertices (same content):** http://localhost:3333/vertices/check-ins/index.html

**Update `api-options.ts` as you go**—when the docs differ from our types, edit the file right away, then tick the checklist.

Open each vertex page, scroll to **URL Parameters** → **Query By**, **Can Include**, **Order By**, and **Filter By** (if any), then tick when the types in this repo match.

---

## Verify using local vertices (browser)

1. Start the docs server so the vertices site is available (if needed): from repo root, run whatever serves `docs/public` on port 3333 (e.g. `npx serve docs/public -p 3333` or your existing setup).
2. Open: **http://localhost:3333/vertices/check-ins/index.html**
3. On the index page you’ll see a list of vertices (Event, Check In, Event Time, Location, Station, etc.). Click a vertex name (e.g. **Event**).
4. On the vertex page, scroll to the **URL Parameters** section. Under it you’ll see subsections:
   - **Can Include** – table of `include` values (e.g. `attendance_types`, `check_ins`, …). Compare to `*Include` in `src/types/api-options.ts`.
   - **Order By** – table of `order` values (e.g. `created_at`, `name`). Compare to `*OrderField` in `api-options.ts`.
   - **Query By** – table of `where[field]` names and types. Compare to `*WhereClause` in `api-options.ts`.
   - **Filter By** – if present, list of filter param values (e.g. `archived`, `not_archived`). Compare to `*Filter` in `api-options.ts`.
5. For each vertex, confirm that the options in `api-options.ts` match the docs (add missing values, remove or comment extras, fix types). Then tick that vertex in the checklist below.
6. Repeat from step 3 for the next vertex until all are verified.

---

## Browser workflow (official PCO docs)

1. Open: https://developer.planning.center/docs/#/apps/check-ins/2025-05-28  
2. In the left sidebar, click a vertex (e.g. **Event**).  
3. On the right, scroll until you see **URL Parameters** → **Query By**, **Can Include**, **Order By**, **Filter By**.  
4. Copy each table or list from the docs (you can copy the table as text or type the column values).  
5. Paste into this repo’s chat (or into this doc under “Collected from browser” below) in the **Paste format** from the next section.  
6. **Update as we go:** When you find a mismatch (or after pasting), edit `packages/planning-center-check-ins-ts/src/types/api-options.ts` immediately so the checklist and code stay in sync. Then tick the row and move to the next vertex.

---

## How to update types from the docs

When you find a mismatch:

1. **Query By** → update the `*WhereClause` interface in `api-options.ts` (field names and types: string, number, boolean, date).
2. **Can Include** → update the `*Include` union type.
3. **Order By** → update the `*OrderField` type (only the field names; prefix with `-` for descending is documented in comments).
4. **Filter By** → update the `*Filter` type (sent as `param=true`).

If the docs list a section we don’t have (e.g. Order By for a vertex that has no `*OrderField`), add it. If we have a type the docs don’t list, remove or comment it and double-check the API.

---

## Paste format for AI/teammates

Copy the tables from the docs into a block like this (one per vertex). Someone can then update `api-options.ts` to match.

```text
Vertex: Event
URL: .../vertices/event

Query By:
  NAME                 | PARAMETER                    | TYPE
  archived_at          | where[archived_at]           | date_time
  frequency            | where[frequency]           | string
  ...

Can Include:
  attendance_types, check_ins, event_periods, event_times, integration_links, locations

Order By:
  created_at, name

Filter By:
  archived, for_campus, for_headcounts, for_registrations, not_archived
```

---

## Vertices checklist

| Vertex | Doc path | Query By | Can Include | Order By | Filter By | Notes |
|--------|----------|----------|--------------|----------|-----------|--------|
| **Event** | `/vertices/event` | ☑ | ☑ | ☑ | ☑ | List + single |
| **CheckIn** | `/vertices/check_in` | ☑ | ☑ | ☑ | ☑ | List + single; also under events |
| **EventTime** | `/vertices/event_time` | ☑ | ☑ | ☑ | — | List + single; also under events/periods |
| **Location** | `/vertices/location` | — | ☑ | ☑ | — | Query By not in Location URL Parameters; Can Include: event, locations, options, parent; Order By: kind, name, position |
| **Station** | `/vertices/station` | — | ☑ | — | — | Query By / Order By not on Station page; Can Include: event, location, print_station, theme |
| **AttendanceType** | `/vertices/attendance_type` | ☑ | ☑ | — | — | Query By: id, name; Can Include: event; Order By not on page; also under events |
| **Headcount** | `/vertices/headcount` | ☑ | ☑ | ☑ | — | Query By: created_at, updated_at; Can Include: attendance_type, event_time; Order By: created_at, total, updated_at |
| **IntegrationLink** | `/vertices/integration_link` | ☑ | — | — | — | Query By: remote_gid only; no Can Include or Order By on page; also under events |
| **Label** | `/vertices/label` | ☑ | — | — | — | URL Parameters: Pagination only; no Query By, Can Include, or Order By on page |
| **Option** | `/vertices/option` | ☑ | ☑ | — | — | Query By not on page; Can Include: label only; Order By not on page |
| **PreCheck** | `/vertices/pre_check` | ☑ | — | — | — | URL Parameters: Pagination only; no Query By, Can Include, or Order By on page |
| **CheckInGroup** | `/vertices/check_in_group` | ☑ | ☑ | — | ☑ | Query By not on page; Can Include: check_ins, event_period, print_station; Order By not on page; Filter By: canceled, printed, ready, skipped |
| **RosterListPerson** | `/vertices/roster_list_person` | ☑ | ☑ | ☑ | — | URL Parameters: Pagination only; no Query By, Can Include, or Order By on page |
| **Theme** | `/vertices/theme` | ☑ | — | ☑ | — | URL Parameters: Pagination only; no Query By, Can Include, or Order By on page |
| **Pass** | `/vertices/pass` | ☑ | ☑ | ☑ | — | Query By: code; Can Include: person; Order By not on page |
| **EventLabel** | `/vertices/event_label` | ☑ | ☑ | ☑ | — | Under events; Query By not on page; Can Include: event, label; Order By not on page |
| **EventPeriod** | `/vertices/event_period` | ☑ | ☑ | ☑ | — | Under events; Query By: ends_at, starts_at; Can Include: event, event_times; Order By: starts_at |
| **PersonEvent** | `/vertices/person_event` | ☑ | ☑ | ☑ | — | Under events; Query By not on page; Can Include: event, first_check_in, last_check_in, person; Order By not on page |

Other vertices (Info, CheckInTime, LocationEventPeriod, LocationEventTime, LocationLabel, Organization, Person) may be single-only or nested; add rows if you verify list params.

---

## People package (optional)

People types live in `packages/planning-center-people-ts/src/types/api-options.ts`.  
Docs: https://developer.planning.center/docs/#/apps/people/2025-11-10/vertices/

Vertices to verify: **person**, **household**, **campus**, **field_definition**, **workflow**, **note**, **list**, **report**, **form**, **service_time**, **tab**, **field_data**, etc. Use the same checklist pattern and paste format above.

---

## Collected from browser

**Event** (verified 2025-05-28 via browser):
- **Query By:** id (primary_key), name (string)
- **Can Include:** attendance_types, (plus check_ins, event_periods, event_times, integration_links, locations per our types)
- **Order By:** created_at, name (prefix with hyphen to reverse)
- **Filter By:** archived, for_campus, for_headcounts, for_registrations, not_archived  
→ Matches `api-options.ts`. EventWhereClause also has frequency, archived_at (not in visible Query By table; kept for API compatibility).

**CheckIn** (verified 2025-05-28 via browser):
- **Query By:** account_center_person_id (integer), created_at (date_time), security_code (string), updated_at (date_time)
- **Filter By / scoping:** regular, guest, volunteer, attendee, one_time_guest, not_one_time_guest, checked_out (and first_time, not_checked_out per our types)
- **Order By / Can Include:** (docs list pagination below Query By; our types already have CheckInOrderField and CheckInInclude)
→ Matches `api-options.ts`.

**EventTime** (verified via pasted docs HTML from [event_time](https://developer.planning.center/docs/#/apps/check-ins/2025-05-28/vertices/event_time)):
- **Query By:** created_at (where[created_at], date_time), updated_at (where[updated_at], date_time).
- **Can Include:** event, event_period, headcounts (Assignable: event/event_period = create and update; headcounts list only).
- **Order By:** shows_at, starts_at (prefix with hyphen to reverse).
- **Pagination:** per_page, offset.
→ Updated `api-options.ts`: EventTimeWhereClause comment notes docs created_at, updated_at; EventTimeInclude = 'event' | 'event_period' | 'headcounts'; EventTimeOrderField adds starts_at, comment notes docs shows_at, starts_at.

**Location** (verified via pasted API docs HTML [location](https://developer.planning.center/docs/#/apps/check-ins/2025-05-28/vertices/location)):
- **Can Include:** event, locations, options, parent (Parameter: include; Assignable: parent = create and update).
- **Order By:** kind, name, position (prefix with hyphen to reverse).
- **Query By:** Not in Location vertex URL Parameters section; LocationWhereClause kept for API compatibility.
- **Pagination:** per_page, offset.
→ Updated `api-options.ts`: LocationInclude = 'event' | 'locations' | 'options' | 'parent'; LocationOrderField = 'created_at' | 'kind' | 'name' | 'position' | 'updated_at'; LocationWhereClause comment notes Query By not on docs page.

**Station** (from pasted API docs HTML + user confirmation):
- **Can Include:** event, location, print_station, theme (Parameter: include; Value: event / location / print_station / theme). **Pagination:** per_page, offset.
- **Query By / Order By:** Not present on the Station vertex page. Checklist uses "—" for those columns; StationWhereClause and StationOrderField kept in `api-options.ts` for API compatibility.
- **Associations / Filter By:** For GET `/stations/{station_id}/check_in_groups`, Filter By: canceled, printed, ready, skipped.
→ Updated `api-options.ts`: StationInclude = 'event' | 'location' | 'print_station' | 'theme'; comments on StationWhereClause/StationOrderField note they're not documented on the Station page.

**AttendanceType** (verified via pasted API docs HTML [attendance_type](https://developer.planning.center/docs/#/apps/check-ins/2025-05-28/vertices/attendance_type)):
- **Query By:** id (where[id], primary_key), name (where[name], string).
- **Can Include:** event (Assignable: create and update).
- **Order By:** Not in URL Parameters section; AttendanceTypeOrderField kept for API compatibility.
- **Pagination:** per_page, offset.
→ Updated `api-options.ts`: AttendanceTypeWhereClause = id, name only; AttendanceTypeInclude = 'event'; comment on AttendanceTypeOrderField notes not on docs page.

**Headcount** (verified via pasted API docs HTML [headcount](https://developer.planning.center/docs/#/apps/check-ins/2025-05-28/vertices/headcount)):
- **Query By:** created_at (where[created_at], date_time), updated_at (where[updated_at], date_time).
- **Can Include:** attendance_type, event_time (Assignable: create and update).
- **Order By:** created_at, total, updated_at (prefix with hyphen to reverse).
- **Pagination:** per_page, offset.
→ Updated `api-options.ts`: HeadcountWhereClause = created_at, updated_at only; HeadcountInclude comment; added HeadcountOrderField = 'created_at' | 'total' | 'updated_at'. HeadcountsModule options now include order.

**IntegrationLink** (verified via pasted API docs HTML [integration_link](https://developer.planning.center/docs/#/apps/check-ins/2025-05-28/vertices/integration_link)):
- **Query By:** remote_gid (where[remote_gid], string).
- **Can Include / Order By:** Not in URL Parameters section. Relationship is polymorphic (local).
- **Pagination:** per_page, offset.
→ Updated `api-options.ts`: IntegrationLinkWhereClause = remote_gid only; IntegrationLinkInclude kept as 'event' with comment.

**Label** (verified via pasted API docs HTML [label](https://developer.planning.center/docs/#/apps/check-ins/2025-05-28/vertices/label)):
- **Query By / Can Include / Order By:** Not in URL Parameters. Only **Pagination** (per_page, offset).
- **Pagination:** per_page, offset.
→ Updated `api-options.ts`: LabelWhereClause empty with comment; LabelInclude and LabelOrderField kept with comments that they are not on the page.

**Option** (verified via pasted API docs HTML [option](https://developer.planning.center/docs/#/apps/check-ins/2025-05-28/vertices/option)):
- **Query By / Order By:** Not in URL Parameters.
- **Can Include:** label (include associated label).
- **Pagination:** per_page, offset.
→ Updated `api-options.ts`: OptionWhereClause empty; OptionInclude = 'label' only (was 'check_ins'); OptionOrderField kept with comment.

**PreCheck** (verified via pasted API docs HTML [pre_check](https://developer.planning.center/docs/#/apps/check-ins/2025-05-28/vertices/pre_check)):
- **Query By / Can Include / Order By:** Not in URL Parameters. Only **Pagination** (per_page, offset).
→ Updated `api-options.ts`: PreCheckWhereClause empty; PreCheckInclude kept as 'event' | 'person' with comment.

**CheckInGroup** (verified via pasted API docs HTML [check_in_group](https://developer.planning.center/docs/#/apps/check-ins/2025-05-28/vertices/check_in_group)):
- **Query By / Order By:** Not in URL Parameters.
- **Can Include:** check_ins, event_period, print_station.
- **Filter By:** canceled, printed, ready, skipped (under Station list).
- **Pagination:** per_page, offset.
→ Updated `api-options.ts`: CheckInGroupWhereClause empty; CheckInGroupInclude = 'check_ins' | 'event_period' | 'print_station'; CheckInGroupOrderField kept with comment.

**RosterListPerson** (verified via pasted API docs HTML [roster_list_person](https://developer.planning.center/docs/#/apps/check-ins/2025-05-28/vertices/roster_list_person)):
- **Query By / Can Include / Order By:** Not in URL Parameters.
- **URL Parameters:** Pagination only (per_page, offset).
→ Updated `api-options.ts`: RosterListPersonWhereClause empty; RosterListPersonInclude = never; RosterListPersonOrderField kept with comment.

**Theme** (verified via pasted API docs HTML [theme](https://developer.planning.center/docs/#/apps/check-ins/2025-05-28/vertices/theme)):
- **Query By / Can Include / Order By:** Not in URL Parameters.
- **URL Parameters:** Pagination only (per_page, offset).
→ Updated `api-options.ts`: ThemeWhereClause empty; ThemeOrderField kept with comment.

**Pass** (verified via pasted API docs HTML [pass](https://developer.planning.center/docs/#/apps/check-ins/2025-05-28/vertices/pass)):
- **Query By:** code (where[code], string).
- **Can Include:** person (include associated person).
- **Order By:** Not on Pass URL Parameters.
- **Pagination:** per_page, offset.
→ Updated `api-options.ts`: PassWhereClause = code only; PassInclude = 'person'; PassOrderField kept with comment.

**EventLabel** (verified via pasted API docs HTML [event_label](https://developer.planning.center/docs/#/apps/check-ins/2025-05-28/vertices/event_label), under events):
- **Query By / Order By:** Not in URL Parameters.
- **Can Include:** event, label (include associated event/label).
- **Pagination:** per_page, offset.
- **Endpoint:** GET /events/{event_id}/event_labels.
→ Updated `api-options.ts`: EventLabelWhereClause empty; EventLabelInclude = 'event' | 'label' (unchanged); EventLabelOrderField kept with comment.

**PersonEvent** (verified via pasted API docs HTML [person_event](https://developer.planning.center/docs/#/apps/check-ins/2025-05-28/vertices/person_event), under events):
- **Query By / Order By:** Not in URL Parameters.
- **Can Include:** event, first_check_in, last_check_in, person (include associated event / first_check_in / last_check_in / person).
- **Pagination:** per_page, offset.
- **Endpoint:** GET /events/{event_id}/person_events.
→ Updated `api-options.ts`: PersonEventWhereClause empty; PersonEventInclude = 'event' | 'first_check_in' | 'last_check_in' | 'person'; PersonEventOrderField kept with comment.

**EventPeriod** (verified via pasted API docs HTML [event_period](https://developer.planning.center/docs/#/apps/check-ins/2025-05-28/vertices/event_period), under events):
- **Query By:** ends_at (where[ends_at], date_time), starts_at (where[starts_at], date_time).
- **Can Include:** event, event_times (include associated event/event_times).
- **Order By:** starts_at (prefix with - to reverse).
- **Pagination:** per_page, offset.
- **Endpoint:** GET /events/{event_id}/event_periods.
→ Updated `api-options.ts`: EventPeriodWhereClause = ends_at, starts_at only; EventPeriodInclude = 'event' | 'event_times'; EventPeriodOrderField = 'starts_at'.

**Progress:** Every vertex in `api-options.ts` now has an `@see` link to its docs page. When you verify a vertex in the browser, update the types if the docs differ, then tick its row above.

---

## Continue the check in the browser

Verified so far (browser + paste): **Event**, **CheckIn**, **EventTime**, **Location**. Automation sometimes only gets metadata; you can keep verifying in your browser and paste screenshots or table text.

**Next vertices to verify (open in browser):**

| Vertex | Open this URL |
|--------|----------------|
| Station | https://developer.planning.center/docs/#/apps/check-ins/2025-05-28/vertices/station |
| AttendanceType | https://developer.planning.center/docs/#/apps/check-ins/2025-05-28/vertices/attendance_type |
| Headcount | https://developer.planning.center/docs/#/apps/check-ins/2025-05-28/vertices/headcount |
| IntegrationLink | https://developer.planning.center/docs/#/apps/check-ins/2025-05-28/vertices/integration_link |
| Label | https://developer.planning.center/docs/#/apps/check-ins/2025-05-28/vertices/label |
| Option | https://developer.planning.center/docs/#/apps/check-ins/2025-05-28/vertices/option |
| PreCheck | https://developer.planning.center/docs/#/apps/check-ins/2025-05-28/vertices/pre_check |
| CheckInGroup | https://developer.planning.center/docs/#/apps/check-ins/2025-05-28/vertices/check_in_group |
| RosterListPerson | https://developer.planning.center/docs/#/apps/check-ins/2025-05-28/vertices/roster_list_person |
| Theme | https://developer.planning.center/docs/#/apps/check-ins/2025-05-28/vertices/theme |
| Pass | https://developer.planning.center/docs/#/apps/check-ins/2025-05-28/vertices/pass |
| EventLabel | https://developer.planning.center/docs/#/apps/check-ins/2025-05-28/vertices/event_label |
| EventPeriod | https://developer.planning.center/docs/#/apps/check-ins/2025-05-28/vertices/event_period |
| PersonEvent | https://developer.planning.center/docs/#/apps/check-ins/2025-05-28/vertices/person_event |

**Steps:** Open a vertex URL (e.g. [local Event](http://localhost:3333/vertices/check-ins/vertices/event.html) or [official Event](https://developer.planning.center/docs/#/apps/check-ins/2025-05-28/vertices/event)) → scroll to **URL Parameters** → **Query By**, **Can Include**, **Order By**, **Filter By** → copy the table rows (or take a screenshot). Paste in chat or below in the paste format. We’ll update `api-options.ts` and tick the checklist.

**Local vertices index (use this to verify each endpoint’s options in the browser):** [http://localhost:3333/vertices/check-ins/index.html](http://localhost:3333/vertices/check-ins/index.html)

**Last browser run:** 2025-02-16 — Local verification: `npx serve docs/public -p 3333` started; opened http://localhost:3333/vertices/check-ins/index.html and http://localhost:3333/vertices/check-ins/vertices/event.html. Use the same URLs to verify each vertex’s URL Parameters (Can Include, Order By, Query By, Filter By) against `src/types/api-options.ts`. Checklist table above reflects current alignment.

**Fetched content check (script):** From `packages/planning-center-check-ins-ts` run:
```bash
node scripts/verify-options-from-docs.mjs
```
This reads the vertex HTML under `docs/public/vertices/check-ins/vertices/`, extracts Can Include, Order By, Query By, and Filter By from each page, and compares to `src/types/api-options.ts`. **Docs are the source of truth:** api-options must match the doc tables exactly. The script exits with code 1 if there are gaps (doc has an option we don't) or extra (we have an option the doc doesn't list).

Paste additional vertex blocks below as you copy from the docs:

```text
Vertex: ...
Query By: ...
Can Include: ...
Order By: ...
Filter By: ...
```
