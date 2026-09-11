#!/usr/bin/env node
// Refreshes the form counts in profile/README.md from the live catalogue.
//
// The numbers are server-rendered on the runner's index page, so one fetch is
// enough. Every value is validated before anything is written: a layout change
// upstream must fail loudly here rather than quietly publish a wrong number on
// the Foundation's front door.
//
//   node tools/form-counts.mjs           rewrite the block in place
//   node tools/form-counts.mjs --check   report only, never write (exit 1 on drift)

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const SOURCE = 'https://in.formapauperis.com/nj/run/njforms/';
const README = join(dirname(fileURLToPath(import.meta.url)), '..', 'profile', 'README.md');
const START = '<!-- form-counts:start -->';
const END = '<!-- form-counts:end -->';

const PATTERNS = {
  total: /All ([\d,]+) New Jersey Court Forms/,
  official: /Browse and fill out ([\d,]+) official New Jersey Judiciary forms/,
  other: /official New Jersey Judiciary forms plus ([\d,]+) county/,
  fillable: /Show only guided online forms \(([\d,]+)\)/,
};

const num = (s) => Number(s.replace(/,/g, ''));
const fmt = (n) => n.toLocaleString('en-US');

function extract(html) {
  const out = {};
  for (const [key, re] of Object.entries(PATTERNS)) {
    const m = html.match(re);
    if (!m) throw new Error(`could not find the "${key}" count on ${SOURCE} — the page layout changed; update PATTERNS in this script`);
    const value = num(m[1]);
    if (!Number.isInteger(value) || value <= 0) throw new Error(`"${key}" parsed as ${m[1]}, which is not a positive integer`);
    out[key] = value;
  }
  // Sanity: a catalogue this size should never be absurdly small or large, and
  // the parts must be consistent with the whole.
  if (out.total < 100 || out.total > 100000) throw new Error(`implausible total: ${out.total}`);
  if (out.fillable > out.total) throw new Error(`fillable (${out.fillable}) exceeds total (${out.total})`);
  if (out.official > out.total) throw new Error(`official (${out.official}) exceeds total (${out.total})`);
  return out;
}

function block({ total, official, other, fillable }) {
  // "about" on the derived bucket: it is the residual category and moves most.
  const about = Math.round(other / 100) * 100;
  return [
    START,
    `- **${fmt(total)} forms** — ${fmt(official)} official New Jersey Judiciary forms, plus about ${fmt(about)} county, municipal, federal and state-agency forms.`,
    `- **${fmt(fillable)} fill out online** — answer the questions in your browser and download a completed PDF.`,
    END,
  ].join('\n');
}

const checkOnly = process.argv.includes('--check');

const res = await fetch(SOURCE, { headers: { 'user-agent': 'jacobrakaiFoundation-profile-counts/1.0' } });
if (!res.ok) throw new Error(`${SOURCE} returned ${res.status}`);
const counts = extract(await res.text());

const readme = readFileSync(README, 'utf8');
const from = readme.indexOf(START);
const to = readme.indexOf(END);
if (from === -1 || to === -1) throw new Error(`markers ${START} / ${END} not found in ${README}`);

const next = readme.slice(0, from) + block(counts) + readme.slice(to + END.length);

if (next === readme) {
  console.log('counts unchanged:', JSON.stringify(counts));
  process.exit(0);
}

console.log('counts changed:', JSON.stringify(counts));
if (checkOnly) {
  console.error('drift detected (--check, nothing written)');
  process.exit(1);
}
writeFileSync(README, next);
console.log('updated', README);
