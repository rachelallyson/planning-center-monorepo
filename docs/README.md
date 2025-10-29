# Monorepo Documentation

This directory contains the **Nextra-based documentation site** for this monorepo.

## 📖 Documentation Site Structure

### Content (`docs/content/`)

All documentation content lives here and is served by Nextra:

- **[Index](./content/index.mdx)** - Documentation entry point
- **[Concepts](./content/concepts.mdx)** - Core concepts and architecture
- **[Guides](./content/guides/)** - How-to guides (quickstart, pagination, error handling)
- **[Reference](./content/reference/)** - Configuration and API reference
- **[Recipes](./content/recipes/)** - Code examples
- **[Troubleshooting](./content/troubleshooting.mdx)** - Common issues
- **[LLM Context](./content/llm-context.mdx)** - AI-friendly reference for code editors
- **[API Reference](./content/api/)** - Generated TypeDoc documentation

### Site Infrastructure (`docs/`)

- `app/` - Next.js App Router files (layout, pages, not-found)
- `next.config.mjs` - Next.js and Nextra configuration
- `mdx-components.js` - MDX component configuration

### Development Files

- **[Publishing Guide](./publishing.md)** - How to publish packages
- **[Build Verification](./verification.md)** - Verification checklist

## 📦 Package Documentation

All package documentation is unified in this monorepo documentation site:

- **[Documentation Index](./content/index.mdx)** - Complete documentation for both packages
- **[Base Package Reference](./content/concepts.mdx#base-package)** - Base package overview
- **[People Package Reference](./content/concepts.mdx#people-package)** - People package overview

Individual package READMEs:

- **[Base Package README](../packages/planning-center-base-ts/README.md)** - Base package quick reference
- **[People Package README](../packages/planning-center-people-ts/README.md)** - People package quick reference

## 🎯 Quick Links

**Using the packages?**

- → [Documentation Index](./content/index.mdx)

**Contributing to the monorepo?**

- → [Contributing Guide](../CONTRIBUTING.md)
- → [Publishing Guide](./publishing.md)
