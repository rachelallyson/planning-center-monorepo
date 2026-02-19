#!/usr/bin/env node
/**
 * Debug why name_server, report_template (People) and info (Check-Ins) return no content.
 * Run: node scripts/debug-no-content-vertices.js
 */

import { chromium } from 'playwright';

const PEOPLE_BASE = 'https://developer.planning.center/docs/#/apps/people/2025-11-10/vertices';
const CHECK_INS_BASE = 'https://developer.planning.center/docs/#/apps/check-ins/2025-05-28/vertices';

const TO_CHECK = [
  { app: 'People', vertex: 'name_server', url: `${PEOPLE_BASE}/name_server` },
  { app: 'People', vertex: 'report_template', url: `${PEOPLE_BASE}/report_template` },
  { app: 'Check-Ins', vertex: 'info', url: `${CHECK_INS_BASE}/info` },
];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1200, height: 900 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  });

  for (const { app, vertex, url } of TO_CHECK) {
    console.log(`\n=== ${app}: ${vertex} ===`);
    console.log('URL:', url);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('h1', { timeout: 15000 }).catch(() => null);
    await sleep(3500);

    const diag = await page.evaluate(() => {
      function getPageDiag() {
        const h1 = document.querySelector('h1');
        const body = document.body;
        const bodyText = body ? body.innerText : '';
        return {
          hasH1: !!h1,
          h1Text: h1 ? h1.innerText.trim() : null,
          sectionCount: document.querySelectorAll('section').length,
          bodyTextLength: bodyText.length,
          has404Message: bodyText.includes('Request failed with status code 404'),
          bodySnippet: bodyText.trim().slice(0, 400),
        };
      }
      return getPageDiag();
    });

    console.log('  h1:', JSON.stringify(diag.h1Text));
    console.log('  sections:', diag.sectionCount);
    console.log('  body length:', diag.bodyTextLength);
    console.log('  has 404 message:', diag.has404Message);
    if (diag.bodySnippet) console.log('  snippet:', diag.bodySnippet.slice(0, 250).replace(/\n/g, ' '));
  }

  await browser.close();
  console.log('\nDone.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
