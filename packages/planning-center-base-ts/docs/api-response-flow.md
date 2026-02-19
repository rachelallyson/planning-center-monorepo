# API response → resolve (flatten optional)

## What the API returns (JSON:API)

- **Top-level**: `{ data, included?, meta?, links? }`
  - `data`: one `ResourceObject` (get one) or an array (list).
  - `included`: optional array of full `ResourceObject`s referenced by `data` and each other.
- **ResourceObject**: `{ type, id, attributes?, relationships?, links?, meta? }`
- **relationships**: `{ [key: string]: { data: ResourceIdentifier | ResourceIdentifier[] | null } }`
  - Relationship `data` is only `{ type, id }` (and optional `meta`), not full resources.

So the API gives you a graph: `data` plus `included`, with relationships as pointers (`type`/`id`).

## What the core does by default: resolve only

1. **Resolve** (`resolveIncluded`):
   - Build a lookup from `included` by `type:id`.
   - For each resource in `data`, walk its `relationships` and replace each `{ data: { type, id } }` with the full resource from `included` when present (otherwise leave as ref).
   - Result: resources in **JSON:API shape** with relationship data inlined. No extra transform.

2. **Return type**: `ResolvedResourceResult` (= `ResourceObject<string, object, object>`). Use `resource.attributes`, `resource.relationships.emails.data`, etc. Packages type their API with `ResourceObject<Type, Attrs, ResolvedRels>`.

So we use the resource “the right way”: standard JSON:API structure, with relationship refs resolved from `included`. No flatten step unless you want it.

## Optional: flatten when needed

If a flat shape is useful (e.g. for a view or a different consumer), core exposes:

- **`flattenResource(resource)`** – one resolved resource → `{ type, id, ...attributes, relKey: value }` (top-level attrs + rels). Returns `FlattenedResourceResult`.
- **`mapIncludedToRelationships(data, included)`** – resolve then flatten all (same as `resolveIncluded(...).map(flattenResource)`).

So flatten is reusable and built into core, but not part of the default path.

## Summary

| Stage   | Input                          | Output                          |
|--------|---------------------------------|----------------------------------|
| API    | JSON:API doc (data + included)  | —                                |
| Resolve| ResourceObject[] + included     | ResolvedResourceResult[] (JSON:API shape) |
| Flatten| (optional) one or more resolved  | FlattenedResourceResult / FlattenedResourceResult[] |

Default: getSingle / getList / getAllPages return **resolved** resources. Use `flattenResource` or `mapIncludedToRelationships` only when you need the flat shape.
