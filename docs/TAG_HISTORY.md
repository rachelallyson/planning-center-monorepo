# Git Tag History & Monorepo Migration

## Situation

This repository was originally just the `planning-center-people-ts` package. When it was split into a monorepo with multiple packages, **the entire git history was preserved** in this repository. This means:

1. **Tags**: All old tags (v2.3.0, v2.6.0, etc.) are from the people package, but they don't have package prefixes
2. **Commit History**: All commit messages were written when this was a single-package repo, so they don't mention which package they relate to
3. **File Structure**: Early commits show files at the repository root (e.g., `src/people.ts`), but those files now live in `packages/planning-center-people-ts/`

When looking at `git log`, you'll see commits like:
- "feat: Complete API modularization" - This was about the people package
- "V2.0" - This was a people package release
- "feat: update rate limiting" - This was about the people package

All of these commits predate the monorepo structure and relate to what is now `packages/planning-center-people-ts/`.

## Current Tags

The following tags exist from the pre-monorepo era (all are for the people package):

- `v2.3.0`
- `v2.3.1`
- `v2.6.0`
- `v2.6.1`
- `v2.6.2`
- `v2.6.3`
- `v2.7.0`
- `v2.8.0`

These tags point to releases of the people package before the monorepo structure was created.

## New Tagging Convention

For the monorepo, we use package-prefixed tags to clearly identify which package each tag refers to:

- **People package**: `people-ts-v2.x.x`
- **Base package**: `base-ts-v1.x.x`
- **Check-ins package**: `check-ins-ts-v1.x.x`

Example: When releasing `planning-center-people-ts` version 2.9.0, the tag would be `people-ts-v2.9.0`.

## Options for Handling Old Tags

### Option 1: Rename Old Tags (Recommended)

Rename the old tags to follow the new convention. This makes the history clearer for future developers.

**Pros:**
- Consistent tagging convention
- Clear which package each tag belongs to
- Better for long-term maintenance

**Cons:**
- Requires force-pushing tag deletions (if tags are already pushed to remote)
- May break links/scripts that reference old tag names
- Any published references to these tags will point to the old names

**How to do it:**
```bash
# Run the renaming script
./scripts/rename-old-tags.sh

# Review changes
git tag -l

# Push new tags
git push origin --tags

# Delete old tags from remote (carefully!)
git push origin --delete v2.3.0 v2.3.1 v2.6.0 v2.6.1 v2.6.2 v2.6.3 v2.7.0 v2.8.0
```

### Option 2: Leave Old Tags As-Is

Keep the old tags and just document that v2.x.x tags are for the people package.

**Pros:**
- No disruption to existing references
- Preserves original tag history
- No risk of breaking external references

**Cons:**
- Inconsistent tagging convention
- Requires documentation to explain
- Can be confusing for new contributors

### Option 3: Create Aliases

Keep old tags but also create new prefixed tags pointing to the same commits.

**Pros:**
- Maintains backward compatibility
- Adds clarity with new names
- No deletion needed

**Cons:**
- Duplicate tags (can be confusing)
- More tags to manage

## Understanding the Git History

### Commit History Timeline

1. **Initial commit (Oct 2025)**: Started as a single-package repository at the root
2. **Early development**: All commits related to the people package
3. **Monorepo migration**: Files were moved to `packages/planning-center-people-ts/`, but git history preserved
4. **Base package added**: New package created at `packages/planning-center-base-ts/`
5. **Check-ins package added**: New package created at `packages/planning-center-check-ins-ts/`

### Identifying Package-Specific Commits

To see commits that affect a specific package:

```bash
# People package commits
git log --oneline -- packages/planning-center-people-ts/

# Base package commits
git log --oneline -- packages/planning-center-base-ts/

# Check-ins package commits
git log --oneline -- packages/planning-center-check-ins-ts/
```

Note: Early commits (before monorepo) won't show up in package-specific paths because the files were at the root. To see all people-related history:

```bash
# All commits (including pre-monorepo)
git log --oneline --all

# Filter by what files existed at that commit
git log --oneline --all --diff-filter=A --name-only | grep -i people

# Or use the helper script
./scripts/git-history-by-package.sh people 50
```

### Historical Commits Are People Package

Any commit before the monorepo structure was created relates to the people package. The commit messages don't say "people package" because at the time, there was only one package.

## Current Status

As of the monorepo migration:
- People package is at version 2.9.0 (no tag yet)
- Old tags remain as `v2.x.x` (all refer to people package)
- New tagging convention is documented but not yet applied
- Git history contains all original commits, but context about "which package" is missing from early commits

## Recommendation

**For Tags:**
**Option 1 (Rename)** is recommended for a clean, consistent tagging convention, but only if:
- The tags haven't been widely referenced externally
- You're comfortable with the force-push process
- The team agrees to the change

If there are concerns about breaking external references, **Option 2 (Leave As-Is)** is safer and acceptable, as long as it's documented.

**For Commit History:**
You have two main options:

**Option A: Keep History As-Is (Recommended)**
- Accept that early commits show files at root
- Document that all pre-monorepo commits relate to the people package
- Use helper scripts (`scripts/git-history-by-package.sh`) to filter history
- Going forward, new commits can be more explicit about which package they affect

**Option B: Rewrite History**
- Use `scripts/rewrite-history-to-monorepo.sh` to move early commits under `packages/planning-center-people-ts/`
- **WARNING:** Rewrites all commit SHAs, requires force-push, breaks existing clones
- See [HISTORY_REWRITE_OPTIONS.md](./HISTORY_REWRITE_OPTIONS.md) for detailed analysis

**Recommendation:** Keep history as-is unless you want the cleanest possible structure and are comfortable with force-push and re-cloning.

## Tagging Going Forward

When creating new tags:

1. **People package**: Use format `people-ts-v{major}.{minor}.{patch}`
2. **Base package**: Use format `base-ts-v{major}.{minor}.{patch}`
3. **Check-ins package**: Use format `check-ins-ts-v{major}.{minor}.{patch}`

Example workflow:
```bash
# After publishing people-ts v2.9.0 to npm
git tag -a people-ts-v2.9.0 -m "Release people-ts v2.9.0: Matching improvements"
git push origin people-ts-v2.9.0
```

