# Publishing Guide

This document describes how to publish packages from this monorepo.

## Before publishing (checklist)

Use this short checklist before running publish commands:

1. **Versions and changelogs** – Each package’s `package.json` `version` matches the latest `## [x.y.z]` in that package’s `CHANGELOG.md`. Add a new `## [x.y.z]` for any `[Unreleased]` entries and bump the version.
2. **Regenerate API docs** – Run `npm run docs:api` from the monorepo root so `docs/content/api/` is up to date, then commit if you want the new docs deployed.
3. **Build and test** – Run `npm run publish:prep:full` (builds all packages, then runs tests in base, people, and check-ins).
4. **Dry run** – Run `npm run publish:all` to do a full dry run (build, test, then `npm publish --dry-run` for each package).
5. **Publish** – Run `npm run publish:all:real`, then tag and push (see [Tagging releases](#tagging-releases)).

## Release readiness: from WIP to publish

You often have a branch with lots of uncommitted (or committed) work—changelogs, version bumps, code, and docs all mixed together. **You don’t have to publish from a “clean” branch.** Publishing is a separate step you do when you’re ready.

**Two-phase mindset:**

1. **Day-to-day:** Commit work in whatever chunks make sense. You don’t need to touch changelogs or versions. Untracked files (e.g. generated docs, scripts) can stay untracked until you want them in the repo.
2. **When you’re ready to release:** Decide what’s in scope for this release, then do a single **release prep** pass:
   - Update each package’s **CHANGELOG.md** (move `[Unreleased]` into `[x.y.z]` with a date).
   - Bump **version** in each package’s `package.json` to match.
   - Commit those changes (e.g. `chore: release prep`), then run the build/test and publish steps below.

**Checklist:** Use **[Release readiness checklist](./release-readiness.md)** for a step-by-step list (changelogs, versions, commit, test, dry-run, publish, tag). No need to “tidy” the whole branch—just get release prep in order and publish.

## Prerequisites

1. You must be logged in to npm: `npm login`
2. You must have publish access to the `@rachelallyson` scope
3. All packages must be built before publishing

## Quick path (all packages)

From the monorepo root, after doing the pre-publish checklist below:

1. **One-shot dry run** (build, test, dry-run all three packages):
   ```bash
   npm run publish:all
   ```
2. If that succeeds, **publish for real** (base → people → check-ins):
   ```bash
   npm run publish:all:real
   ```
3. **Tag and push** (use the versions you just published):
   ```bash
   git tag -a planning-center-base-ts@2.0.0 -m "Release base-ts 2.0.0"
   git tag -a planning-center-people-ts@4.0.0 -m "Release people-ts 4.0.0"
   git tag -a planning-center-check-ins-ts@4.0.0 -m "Release check-ins-ts 4.0.0"
   git push origin planning-center-base-ts@2.0.0 origin planning-center-people-ts@4.0.0 origin planning-center-check-ins-ts@4.0.0
   ```

## Pre-publish checklist

From the monorepo root:

1. **Versions and changelogs**: For each package, ensure `package.json` `version` matches the latest `## [x.y.z]` in that package’s `CHANGELOG.md`. If you have `## [Unreleased]` entries, add a new `## [x.y.z]` section and bump the version in `package.json`.
2. **Base dependency**: People and check-ins must depend on `@rachelallyson/planning-center-base-ts` with a version range (e.g. `^2.0.0` for base 2.x), not `file:../...`, so the published tarball is valid. Workspaces still resolve to the local base package during development.
3. **Build and test**: `npm run publish:prep:full` — builds then runs tests in base, people, and check-ins.
4. **Dry run**: `npm run publish:dry-run` (or `npm run publish:all`) — confirms tarball contents and that publish would succeed.

Publish in dependency order: **base → people → check-ins**.

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

- **Dependencies**: People and check-ins both depend on `@rachelallyson/planning-center-base-ts` (e.g. `^2.0.0` for base 2.x). No change needed if already set.
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

- **Base package**: `git tag -a planning-center-base-ts@2.0.0 -m "Release base-ts 2.0.0"`
- **People package**: `git tag -a planning-center-people-ts@4.0.0 -m "Release people-ts 4.0.0"`
- **Check-ins package**: `git tag -a planning-center-check-ins-ts@4.0.0 -m "Release check-ins-ts 4.0.0"`

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
- Update people/check-ins dependency version in their `package.json` if needed (e.g. `^2.0.0` for base 2.x)
