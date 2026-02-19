# PCO Create Response Behavior vs JSON:API

## Summary

When creating resources (e.g. **POST /people**, **POST /people/:id/emails**), the Planning Center People API sometimes returns a **list-shaped response** (e.g. `data: array[25]`, `links.next`, `meta.total_count`) with status **200**, instead of the JSON:API-expected **201 Created** with a **single resource** in `data` and an optional **Location** header.

We’ve confirmed the client sends **POST with a body**; the mismatch is in the **response shape** from the API.

## References

### PCO API docs

- **Overview:** [developer.planning.center/docs](https://developer.planning.center/docs/) — states the API follows the **JSON:API spec**.
- **People API / Person:** [developer.planning.center/docs/#/apps/people/2025-11-10/vertices/person](https://developer.planning.center/docs/#/apps/people/2025-11-10/vertices/person) — describes the Person resource; the documented example request for `/people` is a GET (list). Create (POST) response shape is not explicitly documented there.

### JSON:API spec (creating resources)

- **Spec:** [jsonapi.org/format/#crud-creating](https://jsonapi.org/format/#crud-creating)
- **Relevant requirements:**
  - Create is **POST** to a URL that represents a **collection** of resources; request MUST include a **single** resource object as primary data.
  - **201 Created:** If the resource is created and the server changes it (e.g. assigns `id`), the server **MUST** return **201 Created** and a document whose **primary data is that resource** (i.e. `data` is the single created resource, not an array).
  - The response **SHOULD** include a **Location** header for the new resource.

## What we observe

For **POST /people** (create person) and **POST /people/:id/emails** (create email):

- **Request:** Confirmed **POST** with body (see outbound fetch debug logging in base http-client).
- **Response:** HTTP **200** (not 201), `data` is an **array** (e.g. 25 people or 1 email), with **links.next** and **meta** (e.g. **total_count**) when applicable — i.e. a **collection/list** response, not a single resource.

So the response shape matches a **GET list** response, not the JSON:API create response (201 + single resource in `data` + optional Location).

## Implications

- The **client** is behaving correctly (POST + body).
- The **API** is returning a list-style document and 200 for these create calls; that is inconsistent with the JSON:API create behavior described above and with PCO’s stated adherence to JSON:API.
- **What we do:** Create returns a **CreateResponse&lt;T&gt;** that mirrors the API: `{ data: T | T[]; meta?; links? }`. We do not throw on list-shaped responses. Use **singleFromCreateResponse(res)** when you need one resource. The base package handles this by treating create responses that have **array** `data` and no **Location** header as “list-style” and, when appropriate, **What we do (fail-safe):** we do not pick a single resource from a paginated list. When the response is clearly a paginated list (array data with links.next or meta.total_count), the base package **throws** with a clear error so callers are not given the wrong resource. We still use Location, empty-data + included, or single resource in data when present. This replaces the previous **workaround** for the current API behavior, not the ideal contract.

## Next steps (optional)

- Confirm with PCO (docs or support) whether create endpoints are intended to return 201 + single resource, or if list-style 200 is documented/supported.
- If the API is fixed to return 201 + single resource + Location, create responses will have single `data`; the same CreateResponse type still applies.
