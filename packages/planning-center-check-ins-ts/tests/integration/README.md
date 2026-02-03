# Integration Tests

Integration tests make real HTTP requests to the Planning Center Check-Ins API.

**Testing policy:** Integration tests are the preferred way to verify behavior. They exercise the real client, real HTTP, and real API response shapes (including flattened attributes). Unit tests in `tests/modules/` use mocks and are kept for fast local feedback; when you have credentials, run `npm run test:integration` for full confidence.

## Setup

1. Create a `.env.test` file in the package root directory
2. Add one of the following authentication methods:

### Option 1: Personal Access Token (Recommended)

```env
PCO_PERSONAL_ACCESS_TOKEN=your_token_here
PCO_PERSONAL_ACCESS_SECRET=your_secret_here
```

Both are required: the base client uses token + secret for Basic auth. Get them from: <https://api.planningcenteronline.com/oauth/applications>  
**Important:** Create the token with **Check-Ins** scope. If your token is for People or another product only, Check-Ins endpoints will return 404 ("The resource you requested could not be found") and integration tests will fail.

### Option 2: OAuth Access Token

```env
PCO_ACCESS_TOKEN=your_oauth_token_here
```

### Option 3: Basic Auth

```env
PCO_APP_ID=your_app_id
PCO_APP_SECRET=your_app_secret
```

## Running Integration Tests

```bash
npm run test:integration
```

This will:

- Load credentials from `.env.test`
- Make real HTTP requests to Planning Center servers
- Test actual API responses and data structures
- Validate that the client works with real data

## Test Coverage

Integration tests verify:

- ✅ Events Module - Getting events, event periods, check-ins
- ✅ CheckIns Module - Getting check-ins with filters
- ✅ Locations Module - Getting locations
- ✅ Organization Module - Getting organization info
- ✅ Real JSON:API response structures and flattened responses (base module maps `included` to top-level relationship fields)
- ✅ Error handling with real API errors
- ✅ Client behavior: correct base URL, query params (include, where, per_page, page), getPage/getAll and getById paths

## Data requirements (empty lists)

Tests **fail** when a list is empty: they assert `expect(data.length).toBeGreaterThan(0)` before using the first item. Ensure these have at least one record in your Check-Ins org.

| Resource           | Where to add data in PCO |
|--------------------|---------------------------|
| **Stations**       | Check-Ins → Locations → Event or Location → Stations |
| **Options**        | Check-Ins → Options (e.g. question/field options); [API doc](https://developer.planning.center/docs/#/apps/check-ins/2025-05-28/vertices/option): list `GET /check-ins/v2/options` |
| **Check-in Groups**| Check-Ins → Check-in Groups |
| **Pre-checks**     | Check-Ins → Pre-checks (feature may 404 if not enabled; [API doc](https://developer.planning.center/docs/#/apps/check-ins/2025-05-28/vertices/pre_check) listing shows incomplete path) |
| **Passes**         | Check-Ins → Passes ([API doc](https://developer.planning.center/docs/#/apps/check-ins/2025-05-28/vertices/pass): list `GET /check-ins/v2/passes`; also under People) |
| **Headcounts**     | Check-Ins → Headcounts |
| **Labels**         | Check-Ins → Labels. **Location labels** are only available via `checkIns.getLocationLabels(checkInId, locationId)` (not `locations.getLocationLabels(locationId)`); see [LocationLabel API doc](https://developer.planning.center/docs/#/apps/check-ins/2025-05-28/vertices/location_label). |
| **Attendance Types**| Check-Ins → Events → Attendance types |
| **Integration Links** | Check-Ins → Integration links |
| **Themes**         | Check-Ins → Themes |
| **Roster list persons** | Check-Ins → Roster list persons |

Events, check-ins, locations, event times, and person events are required for core tests; the list above must also have at least one record each or those tests will fail.

## How to add missing data in Planning Center

Use these steps in the Planning Center Check-Ins product so integration tests that require data can pass.

### Options (attendee-selectable choices, e.g. “diaper bag” for extra labels)

1. In **Check-Ins**, open an **Event** (or go to **Locations** and pick a location).
2. Open the **Labels & Locations** tab and select a **folder** or **location**.
3. In the **Options** section for that folder/location, add an option (e.g. “Diaper bag” or “Backpack”).
4. Optionally set it to **print** an extra label so the option is used when someone checks in.

Details: [Add labels to events and locations](https://pcocheck-ins.zendesk.com/hc/en-us/articles/221368747-Add-labels-to-events-and-locations) — “Create an option to print extra labels…” in the Options section.

### Passes (barcode or mobile pass)

1. In **Check-Ins**, use a **manned station** (or open the person in People with Check-Ins access).
2. Search for a **person** and open their profile → **Edit**.
3. At the bottom, choose **Add a pass** or **Add a barcode**.
4. **Mobile pass:** Pick the email, click **Prepare Pass**, then **Save Household** (they get an email to add the pass to their phone).
5. **Barcode:** Scan with a barcode scanner or device camera, then **Save Household**.

Passes then appear under that person and in the top-level Passes list. Details: [Add a barcode or mobile pass](https://pcocheck-ins.zendesk.com/hc/en-us/articles/204262834-Add-a-barcode-or-mobile-pass).

### Pre-checks (Church Center PreCheck)

- Pre-checks are created when people use **PreCheck** in the **Church Center** app (Check-Ins tab) before an event.
- Your org must have **Church Center** and **Check-Ins** enabled; then families can pre-check and the Pre-checks API may return data.
- If `GET /pre_checks` returns **404**, the feature may not be available for your plan. Tests that require Pre-checks use `isPreChecksApiAvailable(client)` and **skip** when the API returns 404, so the suite can pass without Pre-checks enabled.

### Location labels (fix `getLocationLabels` test)

The test calls `checkIns.getLocationLabels(checkInId, locationId)` and expects at least one **LocationLabel**. That endpoint returns the label configuration for “this check-in at this location” (e.g. name label, security label, quantity). If no labels are assigned to that location for the event, the list is empty.

**Steps:**

1. In **Check-Ins**, open an **Event** that already has **check-ins** (the test uses your first check-in and its first location).
2. Go to the **Labels & Locations** tab for that event.
3. Assign at least one label to the locations people are checking into:
   - **Easiest:** At the **event** level (top), click **Add/Edit Labels** → choose **Name** or **Security** → set quantity (e.g. 1) and check **Regular** (and/or Guest/Volunteer) → **Save**. That applies to all locations in the event.
   - **Or** at a **folder** or **location** level, click **Add/Edit Labels** and add a label the same way for that folder/location.
4. Ensure the check-ins you have are for that same event and include at least one location. Then `checkIns.getLocations(checkInId)` will return that location, and `checkIns.getLocationLabels(checkInId, locationId)` will return the label config (e.g. one Name label for regular).

**Check:** In Labels & Locations you should see label icons (e.g. green for name, blue for security) next to the event or the location. If your check-ins are for that event’s locations, the test should pass.

Details: [Add labels to events and locations](https://pcocheck-ins.zendesk.com/hc/en-us/articles/221368747-Add-labels-to-events-and-locations), [Create, edit, and delete labels](https://pcocheck-ins.zendesk.com/hc/en-us/articles/234977607-Create-edit-and-delete-labels).

### Check-in groups

- **Check-in Groups** are under **Stations**: Check-Ins → **Locations** → pick an event/location → **Stations** → then manage **Check-in Groups** for that station.
- Create at least one group per station if tests that list check-in groups should pass.

### Summary

| To fix failing tests for… | Add in PCO |
|---------------------------|------------|
| Options                   | Event or location → Labels & Locations → Options section → add option (e.g. “Diaper bag”) |
| Passes                    | Manned station or person profile → Edit → Add a pass / Add a barcode → Save Household |
| Pre-checks                | Church Center app PreCheck; tests skip when API returns 404 |
| Location labels           | Same event as your check-ins → Labels & Locations → Add/Edit Labels at **event** level (e.g. Name label, quantity 1, Regular) → Save |

## Notes

- Integration tests are slower than unit tests (they make real HTTP requests).
- They require valid Planning Center credentials with **Check-Ins** scope and an account with **Check-Ins** enabled. Wrong scope or no Check-Ins product yields 404 and test failures.
- Tests fail explicitly for required data; optional/feature-gated resources are skipped when unavailable. Pre-checks tests skip when the API returns 404. The “All Modules” test skips Pre-checks when 404 and skips integrationLinks/themes/rosterListPersons when they 404 or return empty. All other endpoints and lists must have data or the test fails (see “Data requirements” above).
- They will use your API rate limits (tests are designed to be conservative).
- These tests are excluded from regular `npm test` runs.
- No functionality logging: request/response logging in test bodies is avoided; failures are explicit.
