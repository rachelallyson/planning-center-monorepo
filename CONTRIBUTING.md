# Contributing Guide

Thank you for contributing to the Planning Center API client libraries monorepo!

## Prerequisites

- **Node.js**: >= 16.0.0 (>= 20.0 for docs)
- **npm**: 7+ (for workspaces support)
- **TypeScript**: ^5.9.3

## Setup

### 1. Clone and Install

```bash
git clone https://github.com/rachelallyson/planning-center-monorepo.git
cd planning-center-monorepo

# Always install from root (required for workspace linking)
npm install
```

**Important**: Never run `npm install` from package directories. Always run from the monorepo root.

### 2. Build Packages

```bash
# Build both packages
npm run build

# Or build individually
npm run build:base      # Base package
npm run build:people    # People package
```

The base package builds automatically on install (via `prepare` hook).

## Development Workflow

### Running Tests

```bash
# Run all tests (from root)
npm test

# Run specific package tests
npm run test:base
npm run test:people

# Or from package directory
cd packages/planning-center-people-ts
npm test
```

### TypeScript Checking

```bash
# Check types (from package directory)
cd packages/planning-center-base-ts
npx tsc --noEmit

cd ../planning-center-people-ts
npx tsc --noEmit
```

### Watch Mode

```bash
# From package directory
cd packages/planning-center-base-ts
npm run dev  # Watches and rebuilds on changes

cd ../planning-center-people-ts
npm run dev
```

### Documentation Development

**Documentation Structure**:

- **Content**: All documentation content lives in `docs/content/` directory (committed to git, uses `.mdx` files for Nextra)
- **Infrastructure**: Documentation site infrastructure lives in `docs/` directory (`docs/app/`, `docs/next.config.mjs`, `docs/mdx-components.js`)
- **Self-contained**: Everything documentation-related is in `docs/` - no sync needed, no separate content/ directory
- **Editing**: Just edit `.mdx` files directly in `docs/content/` - no conversion needed

**Development Workflow**:

```bash
# Start docs dev server (runs from root, cd's to docs/ automatically)
npm run dev:docs

# Build docs (runs from root, cd's to docs/ automatically)
npm run build:docs

# Start production server (runs from root, cd's to docs/ automatically)
npm run start:docs
```

**Documentation Files**:

- `docs/content/index.mdx` - Documentation entry point
- `docs/content/concepts.mdx` - Core concepts and architecture
- `docs/content/guides/*.mdx` - How-to guides
- `docs/content/reference/*.mdx` - Reference documentation
- `docs/content/recipes/*.mdx` - Code examples
- `docs/content/api/*.md` - Generated API docs (via TypeDoc)

**Generating API Documentation**:

```bash
# Generate TypeDoc API docs for both packages
npx typedoc

# API docs are generated into docs/content/api/
```

**Previewing Changes**:

1. Edit `.mdx` files in `docs/content/`
2. Run `npm run dev:docs` to preview locally
3. Changes appear immediately in browser (Next.js hot reload)

## Code Style

### TypeScript

- **Strict mode**: Always enabled, no `any` types
- **Format**: Use consistent formatting (consider Prettier if not already configured)
- **Imports**: Use public exports from `src/index.ts`, avoid deep imports

### Monorepo Guidelines

- **Base package**: Infrastructure only, no domain-specific logic
- **People package**: Uses base package, contains People API-specific code
- **Shared code**: Should be in base package
- **Dependencies**: People depends on base via workspace link (`"*"`)

## Adding New Code

### To Base Package

1. Add code to `packages/planning-center-base-ts/src/`
2. Export from `packages/planning-center-base-ts/src/index.ts`
3. Add tests to `packages/planning-center-base-ts/tests/`
4. Update base package README if adding major feature
5. Run tests: `npm run test:base`

### To People Package

1. Add code to `packages/planning-center-people-ts/src/`
2. Use base package utilities (don't duplicate)
3. Export from `packages/planning-center-people-ts/src/index.ts`
4. Add tests to `packages/planning-center-people-ts/tests/`
5. Update documentation in `docs/content/` (guides, concepts, API reference)
6. Run tests: `npm run test:people`

## Testing

### Test Structure

- Unit tests: `packages/*/tests/*.test.ts`
- Integration tests: `packages/*/tests/*.integration.test.ts`
- Test utilities: `packages/*/tests/setup.ts`

### Running Tests

```bash
# All tests
npm test

# Specific package
npm run test:base
npm run test:people

# Watch mode
cd packages/planning-center-people-ts
npm run test:watch

# Coverage
cd packages/planning-center-people-ts
npm run test:coverage
```

### Writing Tests

1. **Propose tests first** in `tests/` directory
2. **Then implement** the feature
3. **Run tests** to verify

Example test structure:

```typescript
describe('MyFeature', () => {
  it('should do something', async () => {
    // Arrange
    const client = createTestClient();
    
    // Act
    const result = await client.people.getAll();
    
    // Assert
    expect(result.data).toBeDefined();
  });
});
```

## Linting

Currently, linting is not configured. Consider adding ESLint or similar in the future.

```bash
npm run lint
```

## Documentation

### Editing Documentation

1. Edit `.mdx` files in `docs/` directory
2. Run `npm run docs:dev` to preview
3. Commit changes

**File locations**:

- All documentation: `docs/content/` (`.mdx` files for Nextra)
- Documentation site infrastructure: `docs/app/`, `docs/next.config.mjs`, `docs/mdx-components.js`

### Generating API Docs

```bash
# Generate TypeDoc API docs
npx typedoc

# Watch mode
npx typedoc --watch
```

API docs are generated into `docs/api/` directory.

## Release Process

### Versioning

- Follow [Semantic Versioning](https://semver.org/)
- Update version in `package.json`
- Update `CHANGELOG.md`

### Publishing

1. **Build packages**: `npm run build`
2. **Run tests**: `npm test`
3. **Update versions**: Update `package.json` versions
4. **Update CHANGELOG**: Add release notes
5. **Commit changes**: `git commit -m "chore: release vX.Y.Z"`
6. **Tag release**: `git tag vX.Y.Z`
7. **Publish**: See [Publishing Guide](./docs/publishing.md)

See [docs/publishing.md](./docs/publishing.md) for detailed publishing instructions.

## Commit Messages

Use conventional commits format:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Test additions/changes
- `chore:` Maintenance tasks

Example:

```
feat(people): add findOrCreate method
fix(base): handle rate limit retry correctly
docs: update quickstart guide
```

## Pull Request Checklist

Before submitting a PR:

- [ ] Code follows TypeScript strict mode
- [ ] Tests added/updated and passing
- [ ] Documentation updated (if needed)
- [ ] `npm run build` succeeds
- [ ] `npm test` passes
- [ ] TypeScript compiles (`tsc --noEmit`)
- [ ] Commits follow conventional commit format
- [ ] PR description explains changes

## Getting Help

- **Issues**: [GitHub Issues](https://github.com/rachelallyson/planning-center-monorepo/issues)
- **Documentation**: [docs/index.mdx](./docs/index.mdx)
- **Troubleshooting**: [docs/troubleshooting.mdx](./docs/troubleshooting.mdx)

## Code of Conduct

Be respectful, inclusive, and constructive in all interactions.

---

Thank you for contributing! 🎉
