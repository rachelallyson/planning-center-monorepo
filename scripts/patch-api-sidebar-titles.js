#!/usr/bin/env node
/**
 * Prepends front matter to TypeDoc-generated api package src.md files
 * so the docs sidebar shows "Exports" instead of "planning-center-.../src".
 */
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', 'docs', 'content', 'api')
const PACKAGES = ['planning-center-base-ts', 'planning-center-people-ts', 'planning-center-check-ins-ts']
const FRONT_MATTER = '---\ntitle: Exports\n---\n\n'

for (const pkg of PACKAGES) {
  const path = join(ROOT, pkg, 'src.md')
  try {
    const content = readFileSync(path, 'utf8')
    if (content.startsWith('---')) continue // already has front matter
    writeFileSync(path, FRONT_MATTER + content, 'utf8')
    console.log('Patched:', path)
  } catch (e) {
    console.warn('Skip', path, e.message)
  }
}
