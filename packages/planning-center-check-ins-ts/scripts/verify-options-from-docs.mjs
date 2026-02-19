#!/usr/bin/env node
/**
 * Extracts URL Parameters (Can Include, Order By, Query By, Filter By) from
 * vertex HTML docs and compares to api-options.ts. Run from repo root or check-ins package.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const verticesDir = path.resolve(__dirname, '../../../docs/public/vertices/check-ins/vertices');
const apiOptionsPath = path.resolve(__dirname, '../src/types/api-options.ts');

// Map vertex filename (e.g. event) to our type prefix (Event, CheckIn, ...)
const fileToPrefix = {
  event: 'Event',
  check_in: 'CheckIn',
  event_time: 'EventTime',
  location: 'Location',
  station: 'Station',
  attendance_type: 'AttendanceType',
  headcount: 'Headcount',
  integration_link: 'IntegrationLink',
  label: 'Label',
  option: 'Option',
  pre_check: 'PreCheck',
  check_in_group: 'CheckInGroup',
  roster_list_person: 'RosterListPerson',
  theme: 'Theme',
  pass: 'Pass',
  event_label: 'EventLabel',
  event_period: 'EventPeriod',
  person_event: 'PersonEvent',
};

function extractSection(html, sectionName) {
  const re = new RegExp(
    `<h1[^>]*>${sectionName}</h1>[\\s\\S]*?(?=<section|<h1|</section>|Pagination</h1>)`,
    'i'
  );
  const match = html.match(re);
  return match ? match[0] : '';
}

/** Get all table cell texts from a section. */
function getSectionCells(htmlFragment) {
  const cellRe = /<div role="cell"[^>]*>([^<]+)<\/div>/g;
  const cells = [];
  let m;
  while ((m = cellRe.exec(htmlFragment)) !== null) cells.push(m[1].trim());
  return cells;
}

/** Order By / Can Include: 4 columns (Parameter, Value, Type, Description). Value at 1, 5, 9, ...
 *  Some rows have 3 cols (Value at 4, 8, 12). Collect both positions; regex keeps only identifier-like cells. */
function extractTableValueColumn(htmlFragment) {
  const cells = getSectionCells(htmlFragment);
  const values = new Set();
  const add = (v) => {
    if (v && v !== 'Value' && /^[a-z_][a-z0-9_.]*$/i.test(v)) values.add(v);
  };
  for (let i = 1; i < cells.length; i += 4) add(cells[i]);
  for (let i = 4; i < cells.length; i += 4) add(cells[i]);
  return [...values].sort();
}

function isRelevantCodeValue(v) {
  const skip = ['include', 'order', 'Parameter', 'Value', 'Name', 'Type', 'Description', 'Assignable'];
  if (skip.includes(v) || /^where\[/.test(v)) return false;
  return /^[a-z_]/.test(v) || /\./.test(v);
}

function extractCodeValues(htmlFragment) {
  const codeRe = /<code[^>]*>([a-zA-Z0-9_.]+)<\/code>/g;
  const values = new Set();
  let m;
  while ((m = codeRe.exec(htmlFragment)) !== null) {
    if (isRelevantCodeValue(m[1])) values.add(m[1]);
  }
  return [...values].sort();
}

function collectNamesFromCells(cells) {
  const names = new Set();
  for (let i = 0; i < cells.length; i += 3) {
    const name = cells[i];
    if (name && name !== 'Name') names.add(name);
  }
  return [...names].sort();
}

/** Extract Query By param names (Name column only). Uses extractSection so the section is bounded correctly. */
function extractQueryByNames(htmlFragment, sectionName = 'Query By') {
  const section = extractSection(htmlFragment, sectionName);
  if (!section) return [];
  return collectNamesFromCells(getSectionCells(section));
}

function extractQuotedStrings(block) {
  const cleaned = block.replace(/\/\*[\s\S]*?\*\//g, '');
  const match = cleaned.match(/'([^']+)'/g);
  return match ? match.map((v) => v.slice(1, -1)).sort() : [];
}

function parseIncludeTypes(content, types) {
  const re = /export type (\w+Include) =\s*([\s\S]*?)(?=export |$)/g;
  let m;
  while ((m = re.exec(content)) !== null) types[m[1]] = extractQuotedStrings(m[2]);
}

function parseOrderTypes(content, types) {
  const re = /export type (\w+OrderField) =\s*([\s\S]*?)(?=export |$)/g;
  let m;
  while ((m = re.exec(content)) !== null) types[m[1]] = extractQuotedStrings(m[2]);
}

function parseWhereTypes(content, types) {
  const re = /export (?:type|interface) (\w+WhereClause)[\s\S]*?\{([\s\S]*?)\}/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    const body = m[2].replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
    const vals = body.match(/(\w+)\??\s*:/g);
    types[m[1]] = vals ? vals.map((v) => v.replace(/\??\s*:$/, '').trim()).sort() : [];
  }
}

function parseFilterTypes(content, types) {
  const re = /export type (\w+Filter) =\s*([\s\S]*?)(?=export |$)/g;
  let m;
  while ((m = re.exec(content)) !== null) types[m[1]] = extractQuotedStrings(m[2]);
}

function parseApiOptionsTypes(content) {
  const types = {};
  parseIncludeTypes(content, types);
  parseOrderTypes(content, types);
  parseWhereTypes(content, types);
  parseFilterTypes(content, types);
  return types;
}

const printDocOnly = process.argv.includes('--print-doc');
const apiContent = fs.readFileSync(apiOptionsPath, 'utf8');
const apiTypes = parseApiOptionsTypes(apiContent);

const results = { ok: [], missing: [], extra: [], noDoc: [] };
const docOnlyByVertex = {};

for (const [file, prefix] of Object.entries(fileToPrefix)) {
  const filePath = path.join(verticesDir, `${file}.html`);
  if (!fs.existsSync(filePath)) {
    results.noDoc.push(file);
    continue;
  }
  const html = fs.readFileSync(filePath, 'utf8');
  const urlParams = html.includes('id="url-parameters"') ? html.split('id="url-parameters"')[1]?.split('id="endpoints"')[0] || '' : '';

  const canInclude = extractSection(urlParams, 'Can Include');
  const orderBy = extractSection(urlParams, 'Order By');
  const filterBy = extractSection(urlParams, 'Filter By');

  let docInclude = canInclude ? extractTableValueColumn(canInclude) : [];
  let docOrder = orderBy ? extractTableValueColumn(orderBy) : [];
  const docWhere = urlParams ? extractQueryByNames(urlParams, 'Query By') : [];
  let docFilter = filterBy ? (getSectionCells(filterBy).length > 0 ? extractTableValueColumn(filterBy) : extractCodeValues(filterBy).filter((v) => v.length > 2)) : [];
  docInclude = docInclude.filter((v) => v !== 'include');
  docOrder = docOrder.filter((v) => v !== 'order');

  const includeType = `${prefix}Include`;
  const orderType = `${prefix}OrderField`;
  const whereType = `${prefix}WhereClause`;
  const filterType = `${prefix}Filter`;

  const gaps = []; // doc has it, we don't → need to add to api-options
  const extra = []; // we have it, doc doesn't → often intentional (API compatibility)

  if (apiTypes[includeType] && docInclude.length > 0) {
    const ours = new Set(apiTypes[includeType]);
    const docs = new Set(docInclude);
    [...docs].filter((d) => !ours.has(d)).forEach((d) => gaps.push(`Include: doc has "${d}" not in api-options`));
    [...ours].filter((o) => !docs.has(o)).forEach((o) => extra.push(`Include: api-options has "${o}" not in doc`));
  }
  if (apiTypes[orderType] && docOrder.length > 0) {
    const ours = new Set(apiTypes[orderType]);
    const docs = new Set(docOrder);
    [...docs].filter((d) => !ours.has(d)).forEach((d) => gaps.push(`Order: doc has "${d}" not in api-options`));
    [...ours].filter((o) => !docs.has(o)).forEach((o) => extra.push(`Order: api-options has "${o}" not in doc`));
  }
  if (apiTypes[whereType] && docWhere.length > 0 && apiTypes[whereType].length > 0) {
    const ours = new Set(apiTypes[whereType]);
    const docs = new Set(docWhere);
    [...docs].filter((d) => !ours.has(d)).forEach((d) => gaps.push(`Where: doc has "${d}" not in api-options`));
    [...ours].filter((o) => !docs.has(o)).forEach((o) => extra.push(`Where: api-options has "${o}" not in doc`));
  }
  if (apiTypes[filterType] && docFilter.length > 0) {
    const ours = new Set(apiTypes[filterType]);
    const docs = new Set(docFilter);
    [...docs].filter((d) => !ours.has(d)).forEach((d) => gaps.push(`Filter: doc has "${d}" not in api-options`));
    [...ours].filter((o) => !docs.has(o)).forEach((o) => extra.push(`Filter: api-options has "${o}" not in doc`));
  }

  if (printDocOnly) {
    docOnlyByVertex[file] = {
      prefix,
      include: docInclude,
      order: docOrder,
      where: docWhere,
      filter: docFilter,
    };
  }

  if (gaps.length > 0) results.missing.push({ vertex: file, gaps, extra });
  else if (extra.length > 0) results.extra.push({ vertex: file, extra });
  else if (docInclude.length || docOrder.length || docWhere.length || docFilter.length) results.ok.push(file);
  else results.ok.push(file);
}

if (printDocOnly) {
  console.log(JSON.stringify(docOnlyByVertex, null, 2));
  process.exit(0);
}

console.log('=== Check-Ins API options: docs vs api-options.ts ===\n');

const gapCount = results.missing.reduce((n, { gaps }) => n + gaps.length, 0);
if (gapCount === 0) {
  console.log('Gaps: 0 — nothing in the doc is missing from api-options. ✓');
} else {
  console.log('Gaps:', gapCount, '(doc has it, api-options does not — add these):');
  results.missing.forEach(({ vertex, gaps }) => {
    gaps.forEach((g) => console.log('  ', vertex + ':', g));
  });
}

console.log('OK:', results.ok.length, 'vertices —', results.ok.join(', '));

if (results.extra.length) {
  console.log('\nExtra (api-options has more than doc — remove these so api-options matches docs):');
  results.extra.forEach(({ vertex, extra }) => {
    extra.slice(0, 5).forEach((e) => console.log('  ', vertex + ':', e));
    if (extra.length > 5) console.log('  ', vertex + ': ... and', extra.length - 5, 'more');
  });
  process.exit(1);
}
if (results.noDoc.length) console.log('\nNo HTML file:', results.noDoc.join(', '));
console.log('');
