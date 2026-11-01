#!/usr/bin/env node
// Rewrites the headline in profile/foundation-{light,dark}.svg as outlined glyphs.
//
// The masthead carries the website homepage's <h1> in Playfair Display at weight
// 500 (docs/BRAND.md). Glyphs are outlined so the image never depends on font
// loading. Only the <title> and the headline group are replaced; the network
// motif and colours in each file are left untouched.
//
//   node tools/masthead.mjs <path to playfair-display-regular.woff2>
//
// Use the unsubset font from the website repo, src/fonts/orig-unsubset/: the
// served file is subset and may lack glyphs a new headline needs. When the
// homepage <h1> changes, update LINES to match it and rerun.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as fontkit from 'fontkit';
import wawoff2 from 'wawoff2';

const LINES = ['AI governance,', 'research, and forensics.'];
const WEIGHT = 500;
const FONT_SIZE = 76;
const LEFT = 56;
const BASELINES = [133, 225];
const CANVAS_WIDTH = 960;
const PROFILE = join(dirname(fileURLToPath(import.meta.url)), '..', 'profile');
const THEMES = ['light', 'dark'];

const HEADLINE_GROUP = /<g fill="(#[0-9a-f]{6})"><g transform="translate\(.*<\/g><\/g>\n/s;
const TITLE = /<title id="title">[^<]*<\/title>/;

function loadFont(path) {
  if (!path) throw new Error('usage: node tools/masthead.mjs <path to playfair-display-regular.woff2>');
  return wawoff2.decompress(readFileSync(path))
    .then((ttf) => fontkit.create(Buffer.from(ttf)).getVariation({ wght: WEIGHT }));
}

function linePath(font, text) {
  const run = font.layout(text);
  const missing = run.glyphs.filter((g) => g.id === 0).map((g) => String.fromCodePoint(...g.codePoints));
  if (missing.length) throw new Error(`font has no glyph for ${JSON.stringify(missing)} in ${JSON.stringify(text)}; use the unsubset font`);
  const glyphs = run.glyphs.map((g, i) => ({ glyph: g, position: run.positions[i] }));
  const placed = glyphs.reduce(
    (acc, { glyph, position }) => ({
      d: acc.d + glyph.path.translate(acc.x + position.xOffset, position.yOffset).toSVG(),
      x: acc.x + position.xAdvance,
    }),
    { d: '', x: 0 },
  );
  const width = (placed.x * FONT_SIZE) / font.unitsPerEm;
  if (LEFT + width > CANVAS_WIDTH - LEFT) {
    throw new Error(`line ${JSON.stringify(text)} is ${width.toFixed(1)}px wide and overruns the ${CANVAS_WIDTH}px masthead with a ${LEFT}px margin`);
  }
  return placed.d;
}

function headlineGroup(font, fill) {
  const scale = (FONT_SIZE / font.unitsPerEm).toFixed(8);
  const lines = LINES.map(
    (text, i) => `<g transform="translate(${LEFT} ${BASELINES[i]}) scale(${scale} -${scale})"><path d="${linePath(font, text)}"/></g>`,
  );
  return `<g fill="${fill}">${lines.join('')}</g>\n`;
}

function rewrite(svg, font, file) {
  const match = svg.match(HEADLINE_GROUP);
  if (!match || !TITLE.test(svg)) throw new Error(`${file} no longer has the expected <title> and headline group; update the patterns in this script`);
  return svg
    .replace(TITLE, `<title id="title">${LINES.join(' ')}</title>`)
    .replace(HEADLINE_GROUP, headlineGroup(font, match[1]));
}

const font = await loadFont(process.argv[2]);
for (const theme of THEMES) {
  const file = join(PROFILE, `foundation-${theme}.svg`);
  writeFileSync(file, rewrite(readFileSync(file, 'utf8'), font, file));
  console.log(`wrote ${file}`);
}
