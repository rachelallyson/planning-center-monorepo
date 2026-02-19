#!/usr/bin/env node
/**
 * Writes the combined PCO vertices index at docs/public/vertices/index.html.
 * People and Check-Ins content is generated directly there by the export scripts
 * (docs:export-people-site, docs:export-check-ins-site); no copying.
 *
 * Run: npm run docs:export-vertices  (runs both exports then this)
 * Or run this after exporting: node scripts/combine-vertices-site.js
 *
 * Then start the docs dev server and open http://localhost:3333/vertices/
 */

import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const VERTICES_PUBLIC = join(ROOT, 'docs', 'public', 'vertices');

const COMBINED_INDEX_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>PCO API vertices</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 24px; max-width: 720px; margin: 0 auto; }
    h1 { margin-top: 0; }
    .cards { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 24px; }
    .card { display: block; padding: 20px 24px; border: 1px solid #e5e5e5; border-radius: 8px; text-decoration: none; color: inherit; width: 280px; }
    .card:hover { border-color: #0066cc; background: #f8fafc; }
    .card h2 { margin: 0 0 8px; font-size: 1.25rem; color: #0066cc; }
    .card p { margin: 0; color: #555; font-size: 14px; }
  </style>
</head>
<body>
  <h1>PCO API vertices</h1>
  <p>Static snapshots of Planning Center API vertex docs. Choose an app:</p>
  <div class="cards">
    <a href="people/index.html" class="card">
      <h2>People API</h2>
      <p>Person, Household, Campus, Fields, Workflows, Notes, Lists, Reports, Forms, and more.</p>
    </a>
    <a href="check-ins/index.html" class="card">
      <h2>Check-Ins API</h2>
      <p>Event, Check-in, Location, Station, Labels, Passes, and more.</p>
    </a>
  </div>
</body>
</html>
`;

function main() {
  mkdirSync(VERTICES_PUBLIC, { recursive: true });
  writeFileSync(join(VERTICES_PUBLIC, 'index.html'), COMBINED_INDEX_HTML, 'utf8');
  console.log('Wrote docs/public/vertices/index.html (combined landing)');
  console.log('People and Check-Ins content is generated there by the export scripts.');
  console.log('Run the docs dev server and open http://localhost:3333/vertices/');
}

main();
