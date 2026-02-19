#!/usr/bin/env node
/**
 * Fetches each Check-Ins API vertex page from PCO docs, saves the main content as HTML
 * (same structure/classes as the real site), collects the docs' stylesheets, and
 * generates a mini static site: index + one HTML page per vertex using the real HTML.
 *
 * Usage: npm run docs:export-check-ins-site
 * Output: docs/public/vertices/check-ins/ (index.html, vertices/*.html) for the combined docs site
 *
 * Optional: HEADLESS=1 to run without opening a visible browser.
 * Requires: npm install; run `npx playwright install chromium` once.
 */

import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const CHECK_INS_DOCS_BASE = 'https://developer.planning.center/docs/#/apps/check-ins/2025-05-28/vertices';
const DOCS_ORIGIN = 'https://developer.planning.center';

const VERTICES = [
  'event',
  'check_in',
  'event_time',
  'location',
  'station',
  'attendance_type',
  'headcount',
  'integration_link',
  'label',
  'option',
  'pre_check',
  'check_in_group',
  'roster_list_person',
  'theme',
  'pass',
  'event_label',
  'event_period',
  'person_event',
  // Single-only or nested (from API_PARAMS_VERIFICATION.md "Other vertices")
  'info', // PCO docs return 404 for /vertices/info (no standalone page); export skips it
  'check_in_time',
  'location_event_period',
  'location_event_time',
  'location_label',
  'organization',
  'person',
];

const SITE_DIR = join(ROOT, 'docs', 'public', 'vertices', 'check-ins');
const VERTICES_DIR = join(SITE_DIR, 'vertices');

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function slugToTitle(slug) {
  return slug
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** Get outermost content div (with classes) as full HTML; same logic as People script. */
async function extractVertexContentHTML(page, vertex) {
  const url = `${CHECK_INS_DOCS_BASE}/${vertex}`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('h1', { timeout: 15000 }).catch(() => null);
  await sleep(2500);

  return page.evaluate(() => {
    function elementIsContentRoot(el, title) {
      const sections = el.querySelectorAll('section');
      const text = el.innerText.trim();
      return sections.length >= 1 && text.startsWith(title);
    }
    function removeCopyButtons(container) {
      container.querySelectorAll('button').forEach((btn) => {
        if (btn.textContent.replace(/\s/g, '').toLowerCase().includes('copy')) btn.remove();
      });
    }
    const h1 = document.querySelector('h1');
    if (!h1) return null;
    const title = h1.innerText.trim();
    let lastMatch = null;
    let el = h1.parentElement;
    while (el) {
      if (elementIsContentRoot(el, title)) lastMatch = el;
      el = el.parentElement;
    }
    if (!lastMatch) return null;
    removeCopyButtons(lastMatch);
    return lastMatch.outerHTML;
  });
}

/** Collect stylesheet URLs and inline styles from current page (run after loading a vertex page). */
function collectStyles(page) {
  return page.evaluate((origin) => {
    const linkUrls = [];
    document.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
      const href = link.href;
      if (href && (href.startsWith(origin) || href.startsWith('http'))) linkUrls.push(href);
    });
    const inlineStyles = [];
    document.querySelectorAll('style').forEach((style) => {
      if (style.textContent) inlineStyles.push(style.textContent.trim());
    });
    return { linkUrls, inlineStyles };
  }, DOCS_ORIGIN);
}

/** Self-contained fallback so content is readable when PCO CSS vars/links don't apply. Uses !important to win over PCO's loaded styles. */
const FALLBACK_CSS = `
  body { background: #f0f0f0 !important; color: #1a1a1a !important; }
  .pco-vertices-content {
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    font-size: 15px !important;
    line-height: 1.5 !important;
    color: #1a1a1a !important;
    background: #fff !important;
    padding: 24px !important;
    max-width: 900px !important;
    margin: 0 auto !important;
  }
  .pco-vertices-content .tapestry-react-reset,
  .pco-vertices-content [class*="api-documentation"] {
    font-family: inherit !important;
    color: inherit !important;
    margin: 0 !important;
    padding: 0 !important;
    border: 0 !important;
    box-sizing: border-box !important;
  }
  .pco-vertices-content h1 {
    font-size: 1.5rem !important;
    font-weight: 600 !important;
    margin: 1.5em 0 0.5em !important;
    color: #1a1a1a !important;
  }
  .pco-vertices-content h1:first-child { margin-top: 0 !important; }
  .pco-vertices-content p {
    margin: 0.5em 0 1em !important;
    color: #333 !important;
  }
  .pco-vertices-content section {
    margin: 2em 0 !important;
    padding-bottom: 1em !important;
    border-bottom: 1px solid #e5e5e5 !important;
  }
  .pco-vertices-content section:last-of-type { border-bottom: 0 !important; }
  .pco-vertices-content svg {
    width: 1em !important;
    height: 1em !important;
    min-width: 14px !important;
    min-height: 14px !important;
    max-width: 1em !important;
    max-height: 1em !important;
    flex-shrink: 0 !important;
    fill: currentColor !important;
  }
  .pco-vertices-content section > a > svg {
    margin-left: 0.35em !important;
    opacity: 0.5 !important;
  }
  .pco-vertices-content a:not([role="button"]) {
    color: #0066cc !important;
    text-decoration: none !important;
  }
  .pco-vertices-content a:hover { text-decoration: underline !important; }
  .pco-vertices-content pre {
    background: #1d1f21 !important;
    color: #c5c8c6 !important;
    font-family: 'Monaco', 'Menlo', 'Consolas', monospace !important;
    font-size: 13px !important;
    padding: 1em !important;
    margin: 0.5em 0 1em !important;
    overflow: auto !important;
    border-radius: 4px !important;
    white-space: pre !important;
  }
  .pco-vertices-content pre code,
  .pco-vertices-content code {
    font-family: inherit !important;
    background: transparent !important;
    color: inherit !important;
  }
  .pco-vertices-content .token { color: inherit !important; }
  .pco-vertices-content table,
  .pco-vertices-content [role="table"],
  .pco-vertices-content [role="grid"] {
    width: 100% !important;
    border-collapse: collapse !important;
    margin: 0.5em 0 1em !important;
    font-size: 14px !important;
    display: table !important;
    border: 1px solid #e5e5e5 !important;
    border-radius: 4px !important;
    overflow: hidden !important;
  }
  .pco-vertices-content [role="rowgroup"] {
    display: table-row-group !important;
  }
  .pco-vertices-content [role="row"] {
    display: table-row !important;
  }
  .pco-vertices-content th,
  .pco-vertices-content td,
  .pco-vertices-content [role="columnheader"],
  .pco-vertices-content [role="cell"] {
    text-align: left !important;
    padding: 8px 12px !important;
    border: 1px solid #e5e5e5 !important;
    vertical-align: top !important;
    display: table-cell !important;
    background: #fff !important;
  }
  .pco-vertices-content th,
  .pco-vertices-content [role="columnheader"] {
    font-weight: 600 !important;
    background: #f5f5f5 !important;
  }
  .pco-vertices-content svg { vertical-align: middle !important; }
`;

function buildVertexPage(title, vertexSlug, contentHTML, styles) {
  void vertexSlug; // reserved for future permalink/breadcrumb
  const cssLinks = styles.linkUrls.map((href) => `    <link rel="stylesheet" href="${escapeHtml(href)}">`).join('\n');
  const inlineCss = styles.inlineStyles.length
    ? `    <style>\n${styles.inlineStyles.join('\n')}\n    </style>`
    : '';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)} – Check-Ins API</title>
${cssLinks}
${inlineCss}
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 0; }
    .pco-vertices-nav { padding: 12px 24px; background: #f5f5f5; border-bottom: 1px solid #ddd; }
    .pco-vertices-nav a { color: #0066cc; text-decoration: none; }
    .pco-vertices-nav a:hover { text-decoration: underline; }
    .pco-vertices-content { padding: 24px; margin: 0 auto; }
  </style>
  <style>${FALLBACK_CSS}</style>
</head>
<body>
  <nav class="pco-vertices-nav">
    <a href="../index.html">← Check-Ins vertices</a>
    <span style="margin-left: 12px;">${escapeHtml(title)}</span>
  </nav>
  <main class="pco-vertices-content">
${contentHTML}
  </main>
</body>
</html>
`;
}

function buildIndexPage(vertices) {
  const listItems = vertices
    .map(
      ({ vertex, title }) =>
        `    <li><a href="vertices/${escapeHtml(vertex)}.html">${escapeHtml(title)}</a> (<code>${escapeHtml(vertex)}</code>)</li>`
    )
    .join('\n');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Check-Ins API vertices</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 24px;margin: 0 auto; }
    h1 { margin-top: 0; }
    ul { line-height: 1.8; }
    a { color: #0066cc; }
    code { font-size: 0.9em; }
  </style>
</head>
<body>
  <p><a href="../">← PCO vertices</a></p>
  <h1>Check-Ins API vertices</h1>
  <p>Static snapshot from <a href="https://developer.planning.center/docs/#/apps/check-ins/2025-05-28/vertices/">PCO docs</a>. Each page uses the real HTML from the docs.</p>
  <ul>
${listItems}
  </ul>
</body>
</html>
`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function processOneVertex(page, vertex, stylesRef, results, failed) {
  let contentHTML = await extractVertexContentHTML(page, vertex);
  if (!contentHTML || contentHTML.length < 100) {
    failed.push(vertex);
    return { ok: false };
  }
  contentHTML = contentHTML.replace(
    /href="#\/apps\/check-ins\/[^"]*#([a-z0-9_-]+)"/gi,
    'href="#$1"'
  );
  if (results.length === 0) {
    stylesRef.current = await collectStyles(page);
    process.stdout.write('(styles collected) ');
  }
  const styles = stylesRef.current;
  results.push({
    vertex,
    title: slugToTitle(vertex),
    contentHTML,
  });
  writeFileSync(
    join(VERTICES_DIR, `${vertex}.html`),
    buildVertexPage(slugToTitle(vertex), vertex, contentHTML, styles),
    'utf8'
  );
  return { ok: true };
}

async function runVertexFetchLoop(page, stylesRef) {
  const results = [];
  const failed = [];
  for (const vertex of VERTICES) {
    process.stdout.write(`Fetching ${vertex}... `);
    try {
      const outcome = await processOneVertex(page, vertex, stylesRef, results, failed);
      process.stdout.write(outcome.ok ? 'OK\n' : 'No content\n');
    } catch (err) {
      failed.push(vertex);
      process.stdout.write(`Skip (${err.message?.slice(0, 40)})\n`);
    }
  }
  return { results, failed };
}

async function main() {
  mkdirSync(VERTICES_DIR, { recursive: true });

  const browser = await chromium.launch({
    headless: process.env.HEADLESS === '1',
  });
  const context = await browser.newContext({
    viewport: { width: 1200, height: 900 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();
  const stylesRef = { current: { linkUrls: [], inlineStyles: [] } };

  const { results, failed } = await runVertexFetchLoop(page, stylesRef);
  await browser.close();

  if (results.length === 0) {
    console.error('No vertex content could be extracted.');
    process.exit(1);
  }
  if (failed.length) {
    console.log('Skipped vertices:', failed.join(', '));
  }

  writeFileSync(join(SITE_DIR, 'index.html'), buildIndexPage(results), 'utf8');
  console.log(`Wrote ${join(SITE_DIR, 'index.html')}`);
  console.log(`Wrote ${results.length} vertex pages in ${VERTICES_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
