# Planning Center Online API Client Libraries

Monorepo for Planning Center Online TypeScript API client libraries.

## Packages

- **[@rachelallyson/planning-center-base-ts](./packages/planning-center-base-ts)** - Base library with shared infrastructure (HTTP client, auth, rate limiting, error handling)
- **[@rachelallyson/planning-center-people-ts](./packages/planning-center-people-ts)** - People API client
- **[@rachelallyson/planning-center-check-ins-ts](./packages/planning-center-check-ins-ts)** - Check-Ins API client

## Getting Started

**For users of the packages**, see:

- **[📚 Documentation Website](https://rachelallyson.github.io/planning-center-monorepo/)** - Full documentation site
- **[Documentation Site](./docs/content/index.mdx)** - Complete usage guide (quickstart, guides, API reference)
- **[Base Package README](./packages/planning-center-base-ts/README.md)** - Using the base package

**For developers working on this monorepo:**

```bash
# Install all dependencies (from monorepo root)
npm install

# Build all packages
npm run build
```

See [Contributing](./CONTRIBUTING.md) for development setup.

## Development

This monorepo uses npm workspaces. Each package can be developed independently, but they share dependencies at the root level.

### Adding a New Package

1. Create a new directory under `packages/`
2. Initialize with `package.json`
3. Add it to the root `package.json` workspaces array (already configured with `packages/*`)

### Publishing

See [Publishing Guide](./docs/publishing.md) for detailed publishing instructions.

## Documentation

- **[Documentation Website](https://rachelallyson.github.io/planning-center-monorepo/)** - Full documentation site (GitHub Pages)
- **[Documentation Content](./docs/content/)** - Source documentation files (`.mdx` files)

```bash
# Start local dev server
npm run docs:dev

# Build for production
npm run docs:build
```

## Structure

```
planning-center-monorepo/
├── packages/
│   ├── planning-center-base-ts/        # Base library
│   ├── planning-center-people-ts/      # People API client
│   └── planning-center-check-ins-ts/    # Check-Ins API client
├── pages/                         # Next.js/Nextra pages
│   ├── docs/                      # Monorepo docs
│   └── people/                    # People API docs (symlink to packages)
├── docs/                          # Source docs for monorepo section
├── package.json                   # Root workspace config
└── README.md
```
