#!/usr/bin/env node
/**
 * Extracts URL Parameters (Can Include, Order By, Query By, Filter By) from
 * People vertex HTML docs and compares to api-options.ts. Run from people package.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const verticesDir = path.resolve(__dirname, '../../../docs/public/vertices/people/vertices');
const apiOptionsPath = path.resolve(__dirname, '../src/types/api-options.ts');

// Map vertex filename to our type prefix (must have *Include, *OrderField, or *WhereClause in api-options)
const fileToPrefix = {
  person: 'Person',
  household: 'Household',
  campus: 'Campus',
  field_definition: 'FieldDefinition',
  workflow: 'Workflow',
  note: 'Note',
  list: 'List',
  report: 'Report',
  form: 'Form',
  service_time: 'ServiceTime',
  tab: 'Tab',
  field_data: 'FieldData',
};

function extractSection(html, sectionName) {
  const re = new RegExp(
    `<h1[^>]*>${sectionName}</h1>[\\s\\S]*?(?=<section|<h1|</section>|Pagination</h1>)`,
    'i'
  );
  const match = html.match(re);
  return match ? match[0] : '';
}

/** Get all table cell texts from a section (e.g. Order By, Can Include). */
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

const SKIP_CODE_VALUES = new Set(['include', 'order', 'Parameter', 'Value', 'Name', 'Type', 'Description', 'Assignable']);

function shouldAddCodeValue(v) {
  if (SKIP_CODE_VALUES.has(v) || /^where\[/.test(v)) return false;
  return /^[a-z_]/.test(v) || /\./.test(v);
}

function extractCodeValues(htmlFragment) {
  const codeRe = /<code[^>]*>([a-zA-Z0-9_.]+)<\/code>/g;
  const values = new Set();
  let m;
  while ((m = codeRe.exec(htmlFragment)) !== null) {
    const v = m[1];
    if (shouldAddCodeValue(v)) values.add(v);
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

/** Extract Query By param names from urlParams. Uses extractSection so the section is bounded correctly. */
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

function extractWhereFields(block) {
  const body = block.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
  const match = body.match(/(\w+)\??\s*:/g);
  return match ? match.map((v) => v.replace(/\??\s*:$/, '').trim()).sort() : [];
}

function parseApiOptionsTypes(content) {
  const types = {};
  const includeRe = /export type (\w+Include) =\s*([\s\S]*?)(?=export |$)/g;
  const orderRe = /export type (\w+OrderField) =\s*([\s\S]*?)(?=export |$)/g;
  const whereRe = /export (?:type|interface) (\w+WhereClause)[\s\S]*?\{([\s\S]*?)\}/g;
  const filterRe = /export type (\w+Filter) =\s*([\s\S]*?)(?=export |$)/g;

  let m;
  while ((m = includeRe.exec(content)) !== null) types[m[1]] = extractQuotedStrings(m[2]);
  while ((m = orderRe.exec(content)) !== null) types[m[1]] = extractQuotedStrings(m[2]);
  while ((m = whereRe.exec(content)) !== null) types[m[1]] = extractWhereFields(m[2]);
  while ((m = filterRe.exec(content)) !== null) types[m[1]] = extractQuotedStrings(m[2]);
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

  if (printDocOnly) {
    docOnlyByVertex[file] = {
      prefix,
      include: docInclude.filter((v) => v !== 'include'),
      order: docOrder.filter((v) => v !== 'order'),
      where: docWhere,
      filter: docFilter,
    };
  }

  const includeType = `${prefix}Include`;
  const orderType = `${prefix}OrderField`;
  const whereType = `${prefix}WhereClause`;
  const filterType = `${prefix}Filter`;

  const gaps = [];
  const extra = [];

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

  if (gaps.length > 0) results.missing.push({ vertex: file, gaps, extra });
  else if (extra.length > 0) results.extra.push({ vertex: file, extra });
  else if (docInclude.length || docOrder.length || docWhere.length || docFilter.length) results.ok.push(file);
  else results.ok.push(file);
}

if (printDocOnly) {
  console.log(JSON.stringify(docOnlyByVertex, null, 2));
  process.exit(0);
}

console.log('=== People API options: docs vs api-options.ts ===\n');

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
