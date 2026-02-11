# Publishing Guide

This document describes how to publish packages from this monorepo.

## Prerequisites

1. You must be logged in to npm: `npm login`
2. You must have publish access to the `@rachelallyson` scope
3. All packages must be built before publishing

## Pre-publish checklist

From the monorepo root:

1. **Versions and changelogs**: Ensure each package’s `package.json` version matches the latest `## [x.y.z]` entry in that package’s `CHANGELOG.md`.
2. **Build all**: `npm run docs:build:packages` (builds base, people, check-ins).
3. **Test all** (optional but recommended): `npm run publish:prep:full` — builds then runs `test:ci` in base, people, and check-ins.
4. **Dry run**: `npm run publish:dry-run` — builds and runs `npm publish --dry-run` in each package so you can confirm tarball contents and no publish errors.

Then publish in dependency order: **base → people and check-ins** (people and check-ins can be published in either order).

## Publishing Base Package

The base package (`@rachelallyson/planning-center-base-ts`) **must be published first** (people and check-ins depend on it):

```bash
cd packages/planning-center-base-ts

# Build the package
npm run build

# Verify the build
ls dist/

# Publish (will prompt for OTP if 2FA is enabled)
npm publish

# After publishing, verify version at https://www.npmjs.com/package/@rachelallyson/planning-center-base-ts
```

## Publishing People and Check-Ins Packages

After the base package is published:

- **Dependencies**: People and check-ins both depend on `@rachelallyson/planning-center-base-ts` (e.g. `^1.1.3`). No change needed if already set.
- Publish in either order:

**People** (`@rachelallyson/planning-center-people-ts`):

```bash
cd packages/planning-center-people-ts
npm run build
npm test
npm publish
```

**Check-Ins** (`@rachelallyson/planning-center-check-ins-ts`):

```bash
cd packages/planning-center-check-ins-ts
npm run build
npm run test:ci
npm publish
```

## Versioning Strategy

- **Base package**: Follow semver (e.g. 1.1.x)
  - Major: Breaking changes to public API
  - Minor: New features, backward compatible
  - Patch: Bug fixes, backward compatible

- **People and Check-Ins packages**: Follow semver (e.g. 3.x)
  - Major: Breaking changes
  - Minor: New features
  - Patch: Bug fixes

## Tagging Releases

After publishing, tag the release using the package-prefixed format (use the version you just published):

- **Base package**: `git tag -a planning-center-base-ts@1.1.3 -m "Release base-ts 1.1.3"`
- **People package**: `git tag -a planning-center-people-ts@3.1.2 -m "Release people-ts 3.1.2"`
- **Check-ins package**: `git tag -a planning-center-check-ins-ts@3.1.2 -m "Release check-ins-ts 3.1.2"`

Then push the tag: `git push origin <tag-name>`

**Note:** Old tags (v2.3.0, v2.6.0, etc.) are from before the monorepo migration. See [TAG_HISTORY.md](./TAG_HISTORY.md) for details on the tagging convention migration.

## After Publishing

1. Tag the release in git using the package-prefixed format (see above), then `git push origin <tag-name>`
2. CHANGELOG.md should already be updated before publishing
3. Pushing to `main` (including docs/ or package changes) triggers the docs deploy to GitHub Pages

## Troubleshooting

### "You do not have permission to publish"

- Ensure you're logged in: `npm whoami`
- Check that you have access to `@rachelallyson` scope
- Verify package.json has correct `publishConfig.access: "public"`

### Build fails

- Run `npm install` from the monorepo root first
- Check TypeScript errors: `npx tsc --noEmit`
- Ensure base package is built if people package fails

### Dependency not found

- Make sure base package is published first
- Check npm registry: `npm view @rachelallyson/planning-center-base-ts`
- Update people/check-ins dependency version in their `package.json` if needed (e.g. `^1.1.3`)
