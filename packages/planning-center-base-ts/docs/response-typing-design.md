# Response typing: design and options

## Where we are

- **Queries/options**: Per-vertex option types (where, include, order, filter) are in good shape; they’re derived or verified from the vertex docs and used as the single source of truth for request params.
- **Responses**: We have a clear *runtime* pipeline (API → resolve → flatten → `FlattenedResourceResult`), but the *type* that callers see is a generic `TOut` (e.g. `PersonResource`). The core can’t prove that the value it returns satisfies `TOut`; it only knows it produced `FlattenedResourceResult`. So we use a single boundary cast (`asFlattened` / `asFlattenedArray`) and constrain `TOut extends FlattenedResourceResult`. That feels like “force typing” and makes responses feel more complicated and less well-typed than options.

## Is “no force typing” the right goal?

Two ways to look at it:

1. **Strict view**: Any `as T` is a lie unless the type system can prove the value is `T`. So we shouldn’t promise `TOut` from the core; we should return the honest type (`FlattenedResourceResult`) and let the caller narrow if they want.
2. **Pragmatic view**: We’re not inventing a type out of thin air. We have a *contract*: “this endpoint returns a Person.” The package declares that with `PersonResource = FlattenedResource<'Person', PersonAttributes, PersonRelOutputs>`. The runtime value is the flattened Person shape; we’re *declaring* that the caller’s type parameter is the correct refinement of that shape. The cast is “treat this FlattenedResourceResult as the refinement the caller asked for,” and we constrain so the refinement must extend `FlattenedResourceResult`. So it’s a single, documented, constrained assertion at the boundary—not arbitrary force-typing.

Both are defensible. The strict view favors “core never casts”; the pragmatic view favors “call site stays clean and type-safe as long as packages define their types correctly.”

## Options

### A. Honest return type (no generic `TOut` in core)

- **Core**: `getSingle()` returns `Promise<FlattenedResourceResult>`. `getList()` returns `Promise<{ data: FlattenedResourceResult[]; meta?; links? }>`. No `TOut`, no `asFlattened`.
- **Packages**: Each vertex method does the refinement at the package boundary. For example, People’s `getById(id)` calls `this.getSingle(...)`, then returns `asFlattened<PersonResource>(result)` or uses a small helper. So the cast lives in the package, once per method, and the core is “honest.”
- **Call sites**: Either they get `FlattenedResourceResult` and narrow where needed, or they go through the package’s typed API (`people.getById(id)` → `PersonResource`) and never see the cast.
- **Pros**: No cast in core; clear separation (core = runtime shape, package = refined type). **Cons**: Every package method that returns a specific resource type does one cast (or uses a shared helper). Slightly more boilerplate per vertex.

### B. Keep generic `TOut` with one boundary cast (current)

- **Core**: `getSingle<TOut extends FlattenedResourceResult>(...): Promise<TOut>`, and we use `asFlattened<TOut>(...)` inside. Same for list/getAllPages.
- **Packages**: Call `this.getSingle<PersonResource>(...)`; no cast in the package.
- **Pros**: Call sites and package code stay clean; one cast per “kind” of return (single/list) in the core. **Cons**: The cast is still there; it’s just centralized and constrained.

### C. Endpoint-aware typing (no cast in core, typed at package)

- **Core**: Returns only `FlattenedResourceResult` (like A). No generics on getSingle/getList for the *resource* type.
- **Packages**: Define methods whose *return type* is literal, e.g. `getById(id: string): Promise<PersonResource>`. Implementation: `return asFlattened<PersonResource>(await this.getSingle(\`/people/${id}\`));`. So the “view as PersonResource” lives in the package, and the core stays honest.
- This is really A with an emphasis on “package owns the refinement.” The cast is the same as in A; we’re just being explicit that the package is the place that knows “this endpoint → this type.”

**Recommendation:** If minimizing force-typing in the core is the priority, **Option A (or C)** is the right direction: core returns `FlattenedResourceResult` only; packages own the refinement and do one cast (or helper) per method that returns a specific resource type. If keeping the current ergonomics (generic `TOut` in core, no cast in packages) is more important, **Option B** is fine and the cast can be documented as a “declared refinement at the boundary,” not arbitrary force-typing.

---

**Implemented: Option B (not C).** The core exposes `getSingle<TOut>`, `getList<TOut, TOptions>`, `getAllPages<TOut, TOptions>`, `createResource<TOut, TBody>`, and `updateResource<TOut, TBody>` with a single cast inside the core (`result as TOut`). Packages pass their resource type (e.g. `PersonResource`) and get that type back without calling `asFlattened` in the package.

**Why B instead of C:** Option C would require every package method to do `return asFlattened<PersonResource>(await this.getSingle(...))`—i.e. a transform at the package boundary for every typed method. The preference was for “stricter default types without having to transform them”: callers should get `PersonResource` from `getById` without the package maintaining `asFlattened` (or similar) at each call site. Option B keeps one cast in the core and lets packages stay “just pass the type, get the type back” with no boundary helpers. So we implemented B for that ergonomics tradeoff; the doc’s “Implemented: Option C” was outdated and is corrected here.

## Other ways to improve response typing

These don’t remove the refinement step but make responses better-typed and less confusing:

1. **Unify list response shape**  
   Core already returns `{ data, meta?, links? }` for list and pagination. People has `ListResponse<T>` and also uses the core’s `PaginationResult<T>`. We could standardize on one shape (e.g. `ListResponse<T> = { data: T[]; meta?; links? }`) and use it in core and in both packages so “list of X” is always the same type.

2. **Per-vertex response types from docs**  
   Vertex docs include Attributes (and possibly relationships). We could:
   - Add or use a script that reads vertex HTML (or an exported schema) and generates or updates `*Attributes` and maybe `*Resource` types per vertex, so response types stay aligned with the docs (similar to how we verify query params).
   - That doesn’t remove the “flattened result → refined type” step, but it makes the refined types themselves the single source of truth and reduces drift.

3. **Explicit “raw” vs “flattened” in types**  
   We already have `*ResourceObject` (JSON:API shape) vs `*Resource` (flattened). Making that distinction obvious in the core (e.g. `DocumentShape` vs `FlattenedResourceResult`) and in the doc (api-response-flow.md) helps. We could also expose a minimal “raw document” type for code that ever needs to work with the unflattened response.

4. **Stronger typing for `include` → relationship keys**  
   Today, `include: ['household']` doesn’t narrow the return type to “PersonResource with household present.” We could explore overloads or generics so that `getSingle(id, { include: ['household'] })` returns a type that has `household` as a defined key (still flattened). That’s a larger change but would make responses feel more “typed” relative to the request.

## Summary

| Goal | Approach |
|------|----------|
| No cast in core | A/C: Core returns `FlattenedResourceResult`; packages do refinement once per method. |
| Keep current ergonomics | B: Keep `TOut` and single boundary cast; document as declared refinement. |
| Clearer response types | Unify list shape; consider per-vertex types from docs; keep raw vs flattened explicit. |

The philosophy question (“is the cast wrong?”) comes down to whether you prefer the core to be fully honest (A/C) or to keep a single, constrained, documented refinement at the core boundary (B). Both are consistent; it’s a product/ergonomics choice.
