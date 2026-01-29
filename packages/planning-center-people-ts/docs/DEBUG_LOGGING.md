# Debug Logging

Turn on `debug: true` (or `debug: { prefix, includePayloads, onLog }`) in client config to see everything the client does. Logs are emitted only when debug is enabled; no-op otherwise.

## Enable

```ts
const client = new PcoClient({
  applicationId: '…',
  secret: '…',
  debug: true,
});
// or with options:
const client = new PcoClient({
  applicationId: '…',
  secret: '…',
  debug: { prefix: '[MyApp]', includePayloads: false, onLog: (msg, data) => myLogger.info(msg, data) },
});
```

Toggle at runtime:

```ts
client.updateConfig({ debug: true });
client.updateConfig({ debug: false });
```

## What Gets Logged

- **Client**: construction with debug on (`client  debug enabled`), `updateConfig` when debug is on.
- **Base (from `@rachelallyson/planning-center-base-ts`)**: every HTTP request (`base.getSingle`, `base.getList`, `base.createResource`, `base.updateResource`, `base.deleteResource`, `base.getAllPages`, `base.streamPages`), **result-size logs** after each (`base.getSingle result`, `base.getList result` with `count`, `base.createResource result` / `base.updateResource result` with `id`, `base.deleteResource result`), HTTP lifecycle (`http  rate limiter`, `http  fetch`, `http  response`, `http  request complete`), retries (429/401), pagination (getAllPages start/page/complete), batch (execute, per-operation start/success/fail, rollback), and all events (request:start, request:complete, request:error, auth, rate, cache, error) via the debug listener.
- **People module**: every public method entry (getAll, getPage, getById, create, update, delete, verifyPersonExists, findOrCreate, search, getPrimaryCampus, setPrimaryCampus, getHousehold, setHousehold, getEmails, addEmail, getWorkflowCards, createWithContacts, etc.).
- **Other modules**: Fields, Workflows, Contacts, Households, Notes, Lists, Campus, ServiceTime, Forms, Reports — every public method entry.
- **Matching**: findOrCreate flow, strategies, scoring, contact validation (see matcher/scorer).
- **Auth / core**: token refresh attempts and results.
- **Helpers**: getPrimaryContact, createPersonWithContact, searchPeople, getPeopleByHousehold, getCompletePersonProfile, getOrganizationInfo, getListsWithCategories, getPersonWorkflowCardsWithNotes, createWorkflowCardWithNote, exportAllPeopleData.
- **Performance**: batchFetchPersonDetails, getCachedPeople, fetchAllPages, streamPeopleData, processLargeDataset. For **processInBatches**, pass `{ client }` as the fourth argument to log batch start/complete and result counts when debug is on.
- **Recorder**: save/load recording session (when debug is on).

For full details on the base debug API (`createDebugLogger`, `attachDebugListener`, `PcoDebugOptions`), see the base package README.
