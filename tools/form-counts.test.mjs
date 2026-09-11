#!/usr/bin/env node
// Fixtures for tools/form-counts.mjs.
//
//   node tools/form-counts.test.mjs
//
// This is the only automation in the repository that writes to the public
// profile page, so what matters is not that it parses a good page but that it
// refuses a bad one. Every case below asserts the script exits non-zero AND
// leaves profile/README.md untouched — publishing a wrong number is worse than
// publishing a stale one.
//
// Each case runs against a copy of the script in a temporary tree, so a failing
// assertion can never write to the real README.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..');

const VALID =
  '<meta itemprop="name" content="All 1,912 New Jersey Court Forms, Free">' +
  '<meta name="description" content="Browse and fill out 712 official New Jersey Judiciary forms ' +
  'plus 1200 county, municipal, federal and state-agency forms.">' +
  '<label>Show only guided online forms (485)</label>';

// Swap one substring of the valid page to simulate upstream drift.
const mutate = (from, to) => VALID.replace(from, to);

function run(html) {
  const dir = mkdtempSync(join(tmpdir(), 'form-counts-'));
  try {
    mkdirSync(join(dir, 'tools'));
    mkdirSync(join(dir, 'profile'));
    copyFileSync(join(HERE, 'form-counts.mjs'), join(dir, 'tools', 'form-counts.mjs'));
    copyFileSync(join(REPO, 'profile', 'README.md'), join(dir, 'profile', 'README.md'));
    const before = readFileSync(join(dir, 'profile', 'README.md'), 'utf8');
    const page = join(dir, 'page.html');
    writeFileSync(page, html);

    let status = 0, output = '';
    try {
      output = execFileSync(process.execPath, [join(dir, 'tools', 'form-counts.mjs')], {
        env: { ...process.env, FORM_COUNTS_SOURCE: page },
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    } catch (e) {
      status = e.status ?? 1;
      output = `${e.stdout ?? ''}${e.stderr ?? ''}`;
    }
    const after = readFileSync(join(dir, 'profile', 'README.md'), 'utf8');
    return { status, output, untouched: before === after };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// Each entry: name, page, and a fragment the error message must contain.
const rejected = [
  ['a cached error page', '<html><body>502 Bad Gateway</body></html>', 'could not find'],
  ['an empty response', '', 'could not find'],
  ['the total label reworded', mutate('All 1,912 New Jersey Court Forms', 'Every 1,912 NJ Court Form'), '"total"'],
  ['the fill-online filter removed', mutate('Show only guided online forms (485)', 'Show fillable forms'), '"fillable"'],
  ['a total that collapsed to 3', mutate('All 1,912 New', 'All 3 New'), 'implausible total'],
  ['an absurdly large total', mutate('All 1,912 New', 'All 999,999 New'), 'implausible total'],
  ['zero forms', mutate('All 1,912 New', 'All 0 New'), 'not a positive integer'],
  ['fillable exceeding total', mutate('forms (485)', 'forms (99999)'), 'exceeds total'],
  ['official exceeding total', mutate('out 712 official', 'out 5000 official'), 'exceeds total'],
];

for (const [name, html, expected] of rejected) {
  test(`refuses ${name}`, () => {
    const { status, output, untouched } = run(html);
    assert.notEqual(status, 0, 'should exit non-zero');
    assert.match(output, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.ok(untouched, 'must not write to README.md when the page is rejected');
  });
}

test('accepts a well-formed page', () => {
  const { status, output } = run(VALID);
  assert.equal(status, 0, output);
  assert.match(output, /"total":1912/);
  assert.match(output, /"fillable":485/);
});

// The markers are the other way the README can be corrupted, independent of
// what the upstream page says.
const markerCases = [
  ['markers in reverse order', '<!-- form-counts:end -->\n<!-- form-counts:start -->\n', 'appears before'],
  ['no markers at all', 'nothing here\n', 'not found'],
  ['a duplicated marker pair',
    '<!-- form-counts:start -->\na\n<!-- form-counts:end -->\n<!-- form-counts:start -->\nb\n<!-- form-counts:end -->\n',
    'more than one'],
];

for (const [name, readme, expected] of markerCases) {
  test(`refuses ${name}`, () => {
    const dir = mkdtempSync(join(tmpdir(), 'form-counts-'));
    try {
      mkdirSync(join(dir, 'tools'));
      mkdirSync(join(dir, 'profile'));
      copyFileSync(join(HERE, 'form-counts.mjs'), join(dir, 'tools', 'form-counts.mjs'));
      writeFileSync(join(dir, 'profile', 'README.md'), readme);
      const page = join(dir, 'page.html');
      writeFileSync(page, VALID);
      let status = 0, output = '';
      try {
        execFileSync(process.execPath, [join(dir, 'tools', 'form-counts.mjs')], {
          env: { ...process.env, FORM_COUNTS_SOURCE: page }, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
        });
      } catch (e) {
        status = e.status ?? 1;
        output = `${e.stdout ?? ''}${e.stderr ?? ''}`;
      }
      assert.notEqual(status, 0, 'should exit non-zero');
      assert.match(output, new RegExp(expected));
      assert.equal(readFileSync(join(dir, 'profile', 'README.md'), 'utf8'), readme, 'must not rewrite a malformed README');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
}
