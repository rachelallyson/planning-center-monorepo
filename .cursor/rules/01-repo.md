# Repository Rules for Cursor AI

## Package Goals

This monorepo provides **type-safe, production-ready TypeScript client libraries** for Planning Center Online (PCO) APIs.

### Core Objectives

1. **Type Safety** - Strict TypeScript with no `any` types, full JSON:API 1.0 type coverage
2. **Modern Architecture** - Modular, composable, class-based design with clear separation of concerns
3. **Production Readiness** - Built-in rate limiting, comprehensive error handling, automatic retries, timeouts, pagination
4. **Developer Experience** - Clear APIs, comprehensive documentation, helpful error messages
5. **Reusability** - Shared base package (HTTP client, auth, rate limiting) used by specific API clients

### The Three Packages

1. **Base Package** (`planning-center-base-ts`) - Shared infrastructure for building PCO API clients (HTTP client, auth, rate limiting, error handling, JSON:API types)
2. **People API Client** (`planning-center-people-ts`) - Complete client for managing people, contacts, workflows, fields, households, notes, lists, campus, serviceTime, forms, reports
3. **Check-Ins API Client** (`planning-center-check-ins-ts`) - Complete client for managing events, check-ins, locations, stations, labels, attendance, etc.

### Key Principles

- **JSON:API 1.0 Compliant** - Follows the JSON:API specification exactly
- **Zero External Runtime Dependencies** - Uses native fetch API (no axios, node-fetch, etc.)
- **Comprehensive Error Handling** - Typed errors with categories and severity levels
- **Built-in Rate Limiting** - Respects PCO's 100 requests per 20 seconds policy
- **Authentication Support** - Personal Access Tokens and OAuth 2.0 with token refresh

This is a **well-architected, type-safe SDK** for integrating with Planning Center Online APIs in TypeScript/JavaScript applications.

## Always Read First

Before generating any code, **always read** these files in order:

1. `docs/content/llm-context.mdx` - Quick AI reference
2. `docs/content/index.mdx` - Documentation entry point
3. `packages/*/src/index.ts` - Public API surface (truth for exports)

Additional reference files:

- `docs/content/concepts.mdx` - Architecture and invariants
- `docs/content/reference/config.mdx` - Configuration options

## Public API Surface

**Source of truth**: `packages/*/src/index.ts` files define what's publicly exported.

- **Base package**: `packages/planning-center-base-ts/src/index.ts`
- **People package**: `packages/planning-center-people-ts/src/index.ts`
- **Check-Ins package**: `packages/planning-center-check-ins-ts/src/index.ts`

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
- **packages/planning-center-check-ins-ts**: Check-Ins API client (depends on base)

**Dependencies**: Both People and Check-Ins packages depend on base package via workspace link (`"*"` locally, `"^1.0.0"` when published).

## Testing Strategy

When touching code:

1. **When uncertain, propose tests first** - Use tests to clarify requirements and edge cases
2. **Then implement** the feature
3. **Run tests**: `npm test` (from appropriate package directory)

For database code (if applicable in future):

- Follow invariants in `docs/content/concepts.mdx#data-invariants`
- Use transactions where required
- Handle rollbacks properly

## Test Writing Rules

**Core Principle**: Tests must fail explicitly when something is wrong. No silent skips or error suppression.

### ❌ Forbidden Patterns

1. **No try-catch blocks unless testing error handling**
   - ❌ `try { ... } catch (error) { return; }` - This suppresses failures
   - ❌ `try { ... } catch (error) { if (error.status === 401) return; }` - No auth error skipping
   - ✅ Only use try-catch in tests specifically named "error handling" or "should handle X errors"

2. **No conditional early returns that skip tests**
   - ❌ `if (data.length === 0) { console.log('Skipping'); return; }` - Tests should fail, not skip
   - ❌ `if (!testCard) { return; }` - Missing data means test should fail
   - ✅ Use assertions instead: `expect(data.length).toBeGreaterThan(0);`

3. **No error suppression in cleanup**
   - ❌ `afterAll(async () => { try { await cleanup(); } catch (e) { console.warn(e); } })`
   - ✅ `afterAll(async () => { await cleanup(); })` - Cleanup failures should fail the test

### ✅ Correct Patterns

1. **Use assertions for preconditions**

   ```typescript
   const workflowCards = await client.workflows.getPersonWorkflowCards(testPersonId);
   expect(workflowCards.data.length).toBeGreaterThan(0); // Fail if no data
   ```

2. **Error handling tests are the exception**

   ```typescript
   it('should handle validation errors', async () => {
     try {
       await client.people.create(invalidData);
       throw new Error('Should have failed');
     } catch (error) {
       expect(error.message).toMatch(/validation/i);
     }
   });
   ```

3. **Cleanup without error suppression**

   ```typescript
   afterAll(async () => {
     if (testPersonId) {
       await client.people.delete(testPersonId); // Will fail if cleanup fails
     }
   });
   ```

### Test Structure Requirements

- **Every test must be executable** - No skipping based on environment or data availability
- **Tests fail explicitly** - Use `expect()` assertions, not conditional returns
- **Cleanup failures are test failures** - Don't suppress cleanup errors
- **Error handling tests** - The only legitimate use of try-catch in tests

### Type Validation Requirements

**Critical**: All integration tests MUST validate that TypeScript types match actual API responses.

#### Required Type Validation

1. **Validate resource structure** - Every test that receives API responses must validate:

   ```typescript
   // Always validate type and id
   expect(resource.type).toBe('ExpectedType');
   expect(resource.id).toBeDefined();
   expect(typeof resource.id).toBe('string');
   ```

2. **Validate attribute types** - For any attribute accessed in tests:

   ```typescript
   // Use type validators from tests/type-validators.ts
   import { validateStringAttribute, validateBooleanAttribute } from '../type-validators';
   
   if (resource.attributes?.field_name !== undefined) {
       validateStringAttribute(resource.attributes, 'field_name');
   }
   ```

3. **Use existing type validators** - Always prefer using helpers from `tests/type-validators.ts`:
   - `validateResourceStructure()` - Validates type, id
   - `validateStringAttribute()` - Validates string fields
   - `validateBooleanAttribute()` - Validates boolean fields
   - `validateNumberAttribute()` - Validates number fields
   - `validateDateAttribute()` - Validates ISO8601 date strings
   - `validateRelationship()` - Validates relationship structure
   - `validateIncludedResources()` - Validates included resources

4. **Dedicated type validation tests** - Every module should have dedicated attribute type validation tests:
   - Use `attribute-type-validation.integration.test.ts` pattern
   - Test ALL attributes that appear in type definitions
   - Verify types match exactly (string vs null vs undefined)

#### Examples

✅ **Correct - Using type validators**:

```typescript
it('should get person with correct types', async () => {
    const person = await client.people.getById('123');
    
    validateResourceStructure(person, 'Person');
    if (person.attributes?.first_name !== undefined) {
        validateStringAttribute(person.attributes, 'first_name');
    }
});
```

✅ **Correct - Explicit type checking**:

```typescript
it('should create event with correct structure', async () => {
    const event = await client.events.create(data);
    
    expect(event.type).toBe('Event');
    expect(typeof event.id).toBe('string');
    if (event.attributes?.name !== undefined) {
        expect(typeof event.attributes.name).toBe('string');
    }
});
```

❌ **Incorrect - No type validation**:

```typescript
it('should get person', async () => {
    const person = await client.people.getById('123');
    // Missing: No validation that types match API response
    expect(person).toBeDefined();
});
```

#### Type Validation Best Practices

- **Always validate when field is present** - Use `if (attributes?.field !== undefined)` pattern
- **Test nullable fields** - Check for both `null` and `string` types where applicable
- **Validate relationships** - Check relationship data structure matches JSON:API spec
- **Validate included resources** - When using `includes`, validate included resource types
- **Update types when API changes** - If tests fail due to type mismatches, update TypeScript types first

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
