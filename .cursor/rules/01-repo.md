# Repository Rules for Cursor AI

## Always Read First

Before generating any code, **always read** these files in order:

1. `docs/content/llm-context.mdx` - Quick AI reference
2. `docs/content/index.mdx` - Documentation entry point
3. `docs/content/concepts.mdx` - Architecture and invariants
4. `docs/content/reference/config.mdx` - Configuration options
5. `packages/*/src/index.ts` - Public API surface (truth for exports)

## Public API Surface

**Source of truth**: `packages/*/src/index.ts` files define what's publicly exported.

- **Base package**: `packages/planning-center-base-ts/src/index.ts`
- **People package**: `packages/planning-center-people-ts/src/index.ts`

**Rule**: Always use public exports from `index.ts`. Never deep import from internal files (e.g., `./http-client` directly).

## Configuration Truth

**Single source**: `docs/content/reference/config.mdx` and `docs/content/reference/config.schema.json`

**Never invent configuration keys**. Only use:

- Keys defined in `docs/content/reference/config.mdx`
- Validated by `docs/content/reference/config.schema.json`
- Environment variables: `PCO_APP_ID`, `PCO_APP_SECRET` (for OAuth only)

## Code Style

- **TypeScript strict mode**: No `any` types
- **JSON:API compliance**: All responses follow JSON:API 1.0
- **Error handling**: Always use `PcoApiError` or `PcoError`
- **Rate limiting**: Never bypass `PcoHttpClient` (it enforces rate limits)
- **Monorepo structure**: Always run `npm install` from root, not package directories

## When Uncertain

1. **Check exports**: Read `src/index.ts` of relevant package
2. **Check config**: See `docs/content/reference/config.mdx`
3. **Check examples**: See `docs/content/recipes/examples.mdx`
4. **Check concepts**: See `docs/content/concepts.mdx`

## Don'ts (Guardrails)

❌ **Don't invent config keys** - Only those in `docs/content/reference/config.mdx`  
❌ **Don't deep import** - Use public exports from `src/index.ts`  
❌ **Don't install from package dirs** - Always from monorepo root  
❌ **Don't use `any` types** - Everything is strictly typed  
❌ **Don't bypass rate limiting** - `PcoRateLimiter` handles it automatically  
❌ **Don't call API directly** - Use `PcoHttpClient` which handles auth, errors, retries  
❌ **Don't mutate response objects** - They're typed and immutable  
❌ **Don't create OAuth client without refresh handlers** - `onRefresh` and `onRefreshFailure` are required

## Monorepo Structure

- **Root**: Monorepo configuration, shared docs
- **packages/planning-center-base-ts**: Infrastructure package
- **packages/planning-center-people-ts**: People API client (depends on base)

**Dependency**: People package depends on base package via workspace link (`"*"` locally, `"^1.0.0"` when published).

## Testing Strategy

When touching code:

1. **Propose tests first** in `packages/*/tests/` or `__tests__/`
2. **Then implement** the feature
3. **Run tests**: `npm test` (from appropriate package directory)

For database code (if applicable in future):

- Follow invariants in `docs/content/concepts.mdx#data-invariants`
- Use transactions where required
- Handle rollbacks properly

## Package Development

### Adding to Base Package

- Extend `BaseModule` for new modules
- Export from `src/index.ts`
- Update base package README if adding major feature

### Adding to People Package

- Use base package utilities (don't duplicate)
- Extend existing modules or add new ones
- Export from `src/index.ts`
- Update people package docs

## Documentation

**Documentation source is in `docs/content/` directory** (committed to git, uses `.mdx` files for Nextra). **Documentation site infrastructure is in `docs/` directory** (`docs/app/`, `docs/next.config.mjs`, `docs/mdx-components.js`).

- All documentation content lives in `docs/content/` directory (committed, human-editable, uses .mdx files for Nextra)
- All documentation site infrastructure lives in `docs/` directory (app/, next.config.mjs, mdx-components.js)
- This keeps everything documentation-related in one place - docs/ is self-contained
- Just edit .mdx files directly in docs/content/ - no conversion needed
- Documentation site builds successfully (`npm run build:docs` - runs from docs/ directory)

## Code Generation Checklist

Before suggesting code:

- [ ] Read `docs/content/llm-context.mdx`
- [ ] Check `src/index.ts` for available exports
- [ ] Verify config keys in `docs/content/reference/config.mdx`
- [ ] Use examples from `docs/content/recipes/examples.mdx`
- [ ] Follow patterns in `docs/content/concepts.mdx`
- [ ] Check for existing similar code to maintain consistency

## Common Patterns

### Creating a Client

```typescript
import { PcoClient } from '@rachelallyson/planning-center-people-ts';

const client = new PcoClient({
  auth: {
    type: 'personal_access_token',
    personalAccessToken: 'token'
  }
});
```

### Error Handling

```typescript
import { PcoApiError } from '@rachelallyson/planning-center-people-ts';

try {
  await client.people.getById(id);
} catch (error) {
  if (error instanceof PcoApiError) {
    // Handle API error
  }
}
```

### Extending Base Package

```typescript
import { BaseModule } from '@rachelallyson/planning-center-base-ts';

class MyModule extends BaseModule {
  async getResource(id: string) {
    return this.getSingle(`/resources/${id}`);
  }
}
```

## Version Information

- Base Package: v1.0.0
- People Package: v2.8.0
- Node.js: >= 16.0.0 required
- TypeScript: ^5.9.3
