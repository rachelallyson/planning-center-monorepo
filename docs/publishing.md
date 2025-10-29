# Publishing Guide

This document describes how to publish packages from this monorepo.

## Prerequisites

1. You must be logged in to npm: `npm login`
2. You must have publish access to the `@rachelallyson` scope
3. All packages must be built before publishing

## Publishing Base Package

The base package (`@rachelallyson/planning-center-base-ts`) should be published first:

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

## Publishing People Package

After the base package is published:

```bash
cd packages/planning-center-people-ts

# Update dependency to use published version (not local workspace reference)
# Edit package.json and change:
# "@rachelallyson/planning-center-base-ts": "*"
# to:
# "@rachelallyson/planning-center-base-ts": "^1.0.0" (or latest version)

# Build the package
npm run build

# Run tests to ensure everything works
npm test

# Publish
npm publish
```

## Versioning Strategy

- **Base package**: Start at 1.0.0, follow semver
  - Major: Breaking changes to public API
  - Minor: New features, backward compatible
  - Patch: Bug fixes, backward compatible

- **People package**: Already at 2.8.0, continue semver
  - Major: Breaking changes
  - Minor: New features
  - Patch: Bug fixes

## Tagging Releases

After publishing, tag the release using the package-prefixed format:

- **Base package**: `git tag -a base-ts-v1.0.0 -m "Release base-ts v1.0.0"`
- **People package**: `git tag -a people-ts-v2.9.0 -m "Release people-ts v2.9.0"`
- **Check-ins package**: `git tag -a check-ins-ts-v1.0.0 -m "Release check-ins-ts v1.0.0"`

Then push the tag: `git push origin <tag-name>`

**Note:** Old tags (v2.3.0, v2.6.0, etc.) are from before the monorepo migration. See [TAG_HISTORY.md](./TAG_HISTORY.md) for details on the tagging convention migration.

## After Publishing

1. Update the people package's dependency back to `*` for local development (monorepo workspace)
2. Tag the release in git using the package-prefixed format (see above)
3. Update CHANGELOG.md files if maintained

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
- Update people package dependency version
