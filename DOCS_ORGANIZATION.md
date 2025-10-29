# Documentation Organization

This document explains how documentation is organized in this monorepo.

## Structure Overview

```
planning-center-monorepo/
├── README.md                    # Main monorepo entry point
├── CHANGELOG.md                 # Monorepo changelog
├── docs/                       # Monorepo-wide documentation
│   ├── README.md               # Documentation index
│   ├── quick-start.md          # Quick start guide
│   ├── publishing.md           # Publishing guide
│   ├── verification.md         # Build verification
│   └── troubleshooting.md      # Common issues
└── packages/
    ├── planning-center-base-ts/
    │   └── README.md           # Base package documentation
    └── planning-center-people-ts/
        ├── README.md           # People package main docs
        ├── CHANGELOG.md        # People package changelog
        ├── CONTRIBUTING.md     # Contributing guide
        ├── MIGRATION_GUIDE.md  # Migration guide (in package root)
        └── docs/               # People package documentation
            ├── index.md        # Main documentation entry point
            ├── api/            # Generated API docs (TypeDoc)
            ├── guides/         # Usage guides
            ├── release-notes/  # Release notes organized by version
            └── ...
```

## Documentation Categories

### Monorepo Documentation (`/docs`)

- **Getting Started**: Setup and installation
- **Development**: Troubleshooting, verification
- **Publishing**: How to publish packages

### Package Documentation

Each package maintains its own documentation:

- **README.md** in package root: Main package documentation, quick start, features
- **CHANGELOG.md**: Package-specific changelog
- **docs/** folder (if applicable): Additional documentation, API references, guides

## Guidelines

1. **Root README.md** should link to detailed docs but stay concise
2. **Package README.md** should be the primary entry point for that package
3. **docs/** folders contain detailed, organized documentation
4. **Release notes** should be in `docs/release-notes/` (not root)
5. **Migration guides** stay at package root level for visibility
