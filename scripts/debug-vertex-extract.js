#!/usr/bin/env node
/**
 * Debug why field_data, phone, name_server, report_template return no content.
 * Run: node scripts/debug-vertex-extract.js
 */

import { chromium } from 'playwright';
import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DOCS_BASE = 'https://developer.planning.center/docs/#/apps/people/2025-11-10/vertices';
const VERTICES = ['field_data', 'phone', 'name_server', 'report_template'];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1200, height: 900 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  });

  for (const vertex of VERTICES) {
    const url = `${DOCS_BASE}/${vertex}`;
    console.log(`\n=== ${vertex} (${url}) ===`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('h1', { timeout: 15000 }).catch(() => null);
    await sleep(3000);

    const diag = await page.evaluate(() => {
      function ancestorHasSections(el, title) {
        const sections = el.querySelectorAll('section');
        const text = el.innerText.trim();
        return sections.length >= 1 && text.startsWith(title);
      }
      function collectAncestorInfo(h1) {
        const out = { ancestorsWithSections: [], lastMatch: null };
        if (!h1) return out;
        const title = h1.innerText.trim();
        let el = h1.parentElement;
        let depth = 0;
        while (el && depth < 25) {
          if (ancestorHasSections(el, title)) {
            out.ancestorsWithSections.push({
              tag: el.tagName,
              sectionsCount: el.querySelectorAll('section').length,
              startsWithTitle: true,
            });
            out.lastMatch = { tag: el.tagName };
          }
          el = el.parentElement;
          depth++;
        }
        return out;
      }
      const h1 = document.querySelector('h1');
      const body = document.body;
      const ancestor = collectAncestorInfo(h1);
      return {
        hasH1: !!h1,
        h1Text: h1 ? h1.innerText.trim() : null,
        ancestorsWithSections: ancestor.ancestorsWithSections,
        lastMatch: ancestor.lastMatch,
        bodyInnerTextLength: body ? body.innerText.length : 0,
        sectionCount: document.querySelectorAll('section').length,
        bodyTextSample: body ? body.innerText.trim().slice(0, 500) : '',
      };
    });

    console.log('  hasH1:', diag.hasH1, 'h1Text:', JSON.stringify(diag.h1Text));
    console.log('  section count:', diag.sectionCount, '| lastMatch:', diag.lastMatch || 'none');
    console.log('  body text sample:', diag.bodyTextSample?.slice(0, 200));
  }

  // Save one page HTML for inspection
  await page.goto(`${DOCS_BASE}/field_data`, { waitUntil: 'networkidle', timeout: 15000 });
  await sleep(2000);
  const html = await page.content();
  writeFileSync(join(__dirname, '..', 'docs', 'people-vertices-debug-field_data.html'), html, 'utf8');
  console.log('\nWrote docs/people-vertices-debug-field_data.html for inspection.');

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
