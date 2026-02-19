#!/usr/bin/env node
/**
 * Fetches each People API vertex page from PCO docs, extracts the main content,
 * and writes one markdown file documenting every vertex: description, Example Request,
 * Example Object, Attributes, Relationships, URL Parameters, Query By, Can Include,
 * Order By, Filter By (when present), Pagination, and Endpoints (Listing, Reading, etc.).
 *
 * Usage: npm run docs:export-people-markdown
 * Output: docs/people-vertices-docs.md
 *
 * Optional: HEADLESS=1 to run without opening a visible browser.
 * Requires: npm install; run `npx playwright install chromium` once.
 */

import { chromium } from 'playwright';
import TurndownService from 'turndown';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const PEOPLE_DOCS_BASE = 'https://developer.planning.center/docs/#/apps/people/2025-11-10/vertices';

const VERTICES = [
  'person',
  'household',
  'campus',
  'field_definition',
  'workflow',
  'note',
  'list',
  'report',
  'form',
  'service_time',
  'tab',
  'field_data',
  'address',
  'email',
  'phone',
  'household_membership',
  'organization',
  'inactive_reason',
  'name_server',
  'workflow_card',
  'list_category',
  'form_field',
  'form_category',
  'report_template',
];

const OUT_DIR = join(ROOT, 'docs');
const OUTPUT_PATH = join(OUT_DIR, 'people-vertices-docs.md');

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function slugToTitle(slug) {
  return slug
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function createTurndown() {
  const td = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
  td.addRule('preAsCode', {
    filter: 'pre',
    replacement(content) {
      return '\n\n```\n' + content.trim() + '\n```\n\n';
    },
  });
  return td;
}

/** Get main content HTML for markdown (same as before). */
async function extractVertexContent(page, vertex) {
  const url = `${PEOPLE_DOCS_BASE}/${vertex}`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('h1', { timeout: 15000 }).catch(() => null);
  await sleep(2500);

  const html = await page.evaluate(() => {
    function elementIsContentRoot(el, title) {
      const sections = el.querySelectorAll('section');
      const text = el.innerText.trim();
      return sections.length >= 1 && text.startsWith(title);
    }
    function findContentRoot(startH1) {
      if (!startH1) return null;
      const title = startH1.innerText.trim();
      let lastMatch = null;
      let el = startH1.parentElement;
      while (el) {
        if (elementIsContentRoot(el, title)) lastMatch = el;
        el = el.parentElement;
      }
      return lastMatch ? lastMatch.innerHTML : null;
    }
    return findContentRoot(document.querySelector('h1'));
  });

  return html;
}

async function captureOneVertex(page, vertex, turndown) {
  const html = await extractVertexContent(page, vertex);
  if (!html || html.trim().length < 100) return { failed: true, vertex };
  const markdown = turndown.turndown(html);
  return {
    failed: false,
    result: { vertex, title: slugToTitle(vertex), markdown },
  };
}

async function captureAllVertices(page) {
  const results = [];
  const failed = [];
  const turndown = createTurndown();

  for (const vertex of VERTICES) {
    process.stdout.write(`Fetching ${vertex}... `);
    try {
      const outcome = await captureOneVertex(page, vertex, turndown);
      if (outcome.failed) {
        failed.push(vertex);
        process.stdout.write('No content\n');
      } else {
        results.push(outcome.result);
        process.stdout.write('OK\n');
      }
    } catch (err) {
      failed.push(vertex);
      process.stdout.write(`Skip (${err.message?.slice(0, 40)})\n`);
    }
  }
  return { results, failed };
}

/** Remove noisy anchor-only links like "[\\n# Example Request\\n](#...)" and keep the heading. */
function cleanMarkdown(md) {
  return md.replace(/\[\s*#\s+(.+?)\s*\]\(#[^)]+\)/gs, '\n\n## $1\n\n').replace(/\n{3,}/g, '\n\n');
}

function buildMarkdownDoc(results) {
  const parts = [
    '# Planning Center People API – Vertex Reference',
    '',
    'Generated from [developer.planning.center](https://developer.planning.center/docs/#/apps/people/2025-11-10/vertices/).',
    '',
    '---',
    '',
  ];

  for (const { vertex, title, markdown } of results) {
    parts.push(`## ${title}`, '', `*Vertex: \`${vertex}\`*`, '', cleanMarkdown(markdown).trim(), '', '---', '');
  }

  return parts.join('\n');
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({
    headless: process.env.HEADLESS === '1',
  });
  const context = await browser.newContext({
    viewport: { width: 1200, height: 900 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  const { results, failed } = await captureAllVertices(page);
  await browser.close();

  if (results.length === 0) {
    console.error('No vertex content could be extracted.');
    process.exit(1);
  }
  if (failed.length) {
    console.log('Skipped vertices:', failed.join(', '));
  }

  const doc = buildMarkdownDoc(results);
  writeFileSync(OUTPUT_PATH, doc, 'utf8');
  console.log(`Wrote ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
