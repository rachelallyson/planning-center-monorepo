#!/usr/bin/env node
/**
 * After TypeDoc runs it wipes docs/content/api. This script restores
 * index.mdx and _meta files so the sidebar shows Overview, Base, People, Check-Ins.
 */
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const API = join(__dirname, '..', 'docs', 'content', 'api')

const INDEX_MDX = `# Overview

TypeDoc-generated API reference for the three packages in this monorepo.

## Packages

- [Base](/api/planning-center-base-ts/src/) — \`@rachelallyson/planning-center-base-ts\`: HTTP client, pagination, errors, JSON:API types, base module
- [People](/api/planning-center-people-ts/src/) — People API client and types
- [Check-Ins](/api/planning-center-check-ins-ts/src/) — Check-Ins API client and types

Each package has separate pages for **Classes**, **Interfaces**, **Types**, and **Functions**. Use the sidebar to browse.
`

const ROOT_META_JS = `/** @type {import('nextra').MetaRecord} */
export default {
  index: 'Overview',
  README: { display: 'hidden' },
  'planning-center-base-ts': { title: 'Base' },
  'planning-center-people-ts': { title: 'People' },
  'planning-center-check-ins-ts': { title: 'Check-Ins' },
}
`

// Nextra only loads _meta.js/tsx (not .json) for sidebar titles and display
const PACKAGE_META_JS = `/** @type {import('nextra').MetaRecord} */
export default {
  src: 'Exports',
}
`
const SRC_META_JS = `/** @type {import('nextra').MetaRecord} */
export default {
  README: { display: 'hidden' },
}
`

mkdirSync(API, { recursive: true })
writeFileSync(join(API, 'index.mdx'), INDEX_MDX, 'utf8')
writeFileSync(join(API, '_meta.js'), ROOT_META_JS, 'utf8')

for (const pkg of ['planning-center-base-ts', 'planning-center-people-ts', 'planning-center-check-ins-ts']) {
  const dir = join(API, pkg)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, '_meta.js'), PACKAGE_META_JS, 'utf8')
  const srcDir = join(dir, 'src')
  mkdirSync(srcDir, { recursive: true })
  writeFileSync(join(srcDir, '_meta.js'), SRC_META_JS, 'utf8')
}

console.log('API docs meta and index restored.')
