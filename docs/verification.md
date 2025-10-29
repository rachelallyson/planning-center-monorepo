# Build Verification Checklist

Use this checklist to verify the monorepo is ready for publishing.

## Pre-Publishing Checklist

- [ ] **All TypeScript compiles without errors**

  ```bash
  cd packages/planning-center-base-ts && npx tsc --noEmit
  cd ../planning-center-people-ts && npx tsc --noEmit
  ```

- [ ] **Base package builds successfully**

  ```bash
  cd packages/planning-center-base-ts
  npm run build
  ls dist/  # Verify files exist
  ```

- [ ] **People package builds successfully**

  ```bash
  cd packages/planning-center-people-ts
  npm run build
  ls dist/  # Verify files exist
  ```

- [ ] **All tests pass**

  ```bash
  cd packages/planning-center-people-ts
  npm test
  ```

- [ ] **Base package exports are correct**
  - Check `packages/planning-center-base-ts/dist/index.d.ts`
  - Verify all expected exports are present

- [ ] **People package imports from base correctly**
  - Check `packages/planning-center-people-ts/src/client.ts`
  - Verify imports use `@rachelallyson/planning-center-base-ts`

- [ ] **Workspace dependency is configured**
  - Check `packages/planning-center-people-ts/package.json`
  - Should have `"@rachelallyson/planning-center-base-ts": "*"` (or `"workspace:*"` if using newer npm)

## Publishing Checklist

### Before Publishing Base Package

- [ ] Version number is correct in `package.json`
- [ ] All files listed in `package.json` `files` array exist
- [ ] LICENSE file exists
- [ ] README.md is up to date
- [ ] Built package: `npm run build`

### Before Publishing People Package

- [ ] Base package is already published to npm
- [ ] Dependency version updated (change from `workspace:*` to `^1.0.0` or specific version)
- [ ] All tests pass
- [ ] Built package: `npm run build`
- [ ] Can import and use the published base package locally

## Quick Verification Command

Run from monorepo root:

```bash
# Build both packages
npm run build

# Check for TypeScript errors
cd packages/planning-center-base-ts && npx tsc --noEmit && cd ../..
cd packages/planning-center-people-ts && npx tsc --noEmit && cd ../..

# Run tests
npm run test:people
```
