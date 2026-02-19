# Release Readiness Checklist

Use this when you're ready to go from "a branch full of work" to "published release." Your branch does **not** need to be clean or minimal—you just need a clear decision on what is included in this release.

## 1. Decide what’s in this release

- [ ] All changes that should ship are **committed** (or you’re okay publishing from current uncommitted state).
- [ ] Anything that must **not** ship is reverted, stashed, or on another branch.
- [ ] You know which packages you’re releasing (often all three: base, people, check-ins).

## 2. Changelogs and versions

For **each** package you’re releasing:

- [ ] **CHANGELOG.md**: Move `## [Unreleased]` content into a new section `## [x.y.z] - YYYY-MM-DD` (use today’s date).
- [ ] **package.json**: Set `version` to that same `x.y.z` (e.g. `2.0.0`, `4.0.0`, `4.0.0` for base, people, check-ins).
- [ ] If the package has no `[Unreleased]` section and you’re not changing anything, leave version and changelog as-is (you’re re-tagging or not publishing that package).

**Semver reminder:** Major = breaking, Minor = new feature, Patch = bug fix.

## 3. Dependencies (if publishing people or check-ins)

- [ ] Both depend on `@rachelallyson/planning-center-base-ts` with a **version range** (e.g. `^2.0.0` for base 2.x), not `file:../...`. Workspaces still use the local base package during development.

## 4. Commit release prep (recommended)

- [ ] Commit changelog and version changes together, e.g.  
  `git add packages/*/CHANGELOG.md packages/*/package.json && git commit -m "chore: release prep (versions and changelogs)"`

## 5. (Optional) Regenerate API docs

- [ ] `npm run docs:api` — rebuilds packages and regenerates TypeDoc into `docs/content/api/`. Commit the result if you want the deployed docs site to show the latest API reference.

## 6. Build and test

From repo root:

- [ ] `npm run publish:prep:full` — builds and runs tests for base, people, check-ins. Fix any failures before publishing.

## 7. Dry run

- [ ] `npm run publish:all` — runs prep + dry-run publish for all three. Confirms tarball contents and that publish would succeed.

## 8. Publish and tag

- [ ] `npm run publish:all:real` — publishes in order: base → people → check-ins.
- [ ] Tag and push (use the versions you actually published):  
  See [Publishing Guide - Tagging Releases](./publishing.md#tagging-releases).

---

**Summary:** You can commit WIP in any order and at any time. When you’re ready to release, do steps 1–4 (changelogs + versions + commit), optionally step 5 (API docs), then 6–8 (test, dry-run, publish, tag). No need to “clean up” the branch beyond deciding what’s in scope for this release.
