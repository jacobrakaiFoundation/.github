#!/usr/bin/env node
// Renders profile/README.md the way GitHub will and screenshots it, so the org
// profile page can be looked at before it is pushed. GitHub does not offer a
// preview of an organization profile, and the page's images are served from the
// default branch, so a pull request preview shows them broken until merge.
//
//   cd tools && npm install        (once — pulls in marked)
//   node tools/preview.mjs out/shot
//
// Produces desktop (858px, the profile column) and mobile (358px) shots in both
// themes, plus one pass with every image blanked — what a reader sees if the
// image proxy fails. Warns on horizontal overflow, which is the failure mode
// this page is most likely to hit, since GitHub renders tables as
// `display:block; width:max-content; overflow:auto`.
//
// The CSS below is a transcription of the Primer rules that affect this layout.
// It approximates GitHub; it is not GitHub. Treat it as a layout check.

import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { marked } from 'marked';
import { chromium } from 'playwright';

const REPO = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const RAW = 'https://raw.githubusercontent.com/jacobrakaiFoundation/.github/main/profile/';

const md = readFileSync(`${REPO}/profile/README.md`, 'utf8');
// Point image URLs at the working tree so unmerged assets render.
const body = marked.parse(md, { gfm: true }).replaceAll(RAW, '');

// GitHub Primer variables and the .markdown-body rules that affect this layout.
// Note: img deliberately has no `height:auto` — that omission is what reveals
// an <img height> attribute distorting an image once the column is narrower.
const css = `
:root[data-color-mode="light"]{--bg:#ffffff;--fg:#1f2328;--muted:#59636e;--border:#d1d9e0b3;--border-strong:#d1d9e0;--bg-muted:#f6f8fa;--accent:#0969da;--neutral:#818b981f}
:root[data-color-mode="dark"]{--bg:#0d1117;--fg:#f0f6fc;--muted:#9198a1;--border:#3d444db3;--border-strong:#3d444d;--bg-muted:#151b23;--accent:#4493f8;--neutral:#656c7633}
body{margin:0;background:var(--bg)}
.markdown-body{color:var(--fg);background:var(--bg);font:16px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans",Helvetica,Arial,sans-serif;padding:32px;box-sizing:border-box}
.markdown-body h1,.markdown-body h2{padding-bottom:.3em;border-bottom:1px solid var(--border);margin:24px 0 16px;font-weight:600}
.markdown-body h1{font-size:2em}.markdown-body h2{font-size:1.5em}
.markdown-body h3{font-size:1.25em;margin:24px 0 16px;font-weight:600}
.markdown-body p,.markdown-body ul{margin:0 0 16px}
.markdown-body a{color:var(--accent);text-decoration:none}
.markdown-body img{max-width:100%;box-sizing:content-box;background-color:var(--bg)}
.markdown-body blockquote{margin:0 0 16px;color:var(--muted);border-left:.25em solid var(--border-strong);padding:0 1em}
.markdown-body hr{height:.25em;border:0;background:var(--border-strong);margin:24px 0}
.markdown-body code{background:var(--neutral);border-radius:6px;font-size:85%;padding:.2em .4em;font-family:ui-monospace,monospace}
.markdown-body small{font-size:85%;color:var(--muted)}
.markdown-body ul{padding-left:2em}.markdown-body li{margin-top:.25em}
/* GitHub's theme-scoped image filter */
[data-color-mode="light"] [href$="#gh-dark-mode-only"],[data-color-mode="light"] [src$="#gh-dark-mode-only"],
[data-color-mode="dark"] [href$="#gh-light-mode-only"],[data-color-mode="dark"] [src$="#gh-light-mode-only"]{display:none}
`;

const page_html = (mode, blank) => `<!doctype html><html data-color-mode="${mode}"><head><meta charset="utf-8"><style>${css}</style></head><body><article class="markdown-body">${blank ? body.replaceAll(/<img [^>]*src="[^"]*"/g, '<img src=""') : body}</article></body></html>`;

const browser = await chromium.launch();
try {
const shots = [];
for (const mode of ['light', 'dark']) {
  for (const [label, width] of [['desktop', 858], ['mobile', 358]]) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 2 });
    const p = await ctx.newPage();
    writeFileSync(`${REPO}/profile/.preview.html`, page_html(mode, false));
    await p.goto(`file://${REPO}/profile/.preview.html`, { waitUntil: 'load' });
    const out = `${process.argv[2] || '/tmp/preview'}-${label}-${mode}.png`;
    await p.screenshot({ path: out, fullPage: true });
    // Horizontal-overflow assertion
    const overflow = await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    console.log(`${label}/${mode}: ${out}${overflow ? '  *** HORIZONTAL OVERFLOW ***' : ''}`);
    shots.push(out);
    await ctx.close();
  }
}
// Camo-failure pass: what a reader sees if images never load.
const ctx = await browser.newContext({ viewport: { width: 858, height: 900 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
writeFileSync(`${REPO}/profile/.preview.html`, page_html('light', true));
await p.goto(`file://${REPO}/profile/.preview.html`, { waitUntil: 'load' });
const noimg = `${process.argv[2] || '/tmp/preview'}-noimages.png`;
await p.screenshot({ path: noimg, fullPage: true });
console.log('no-images:', noimg);
} finally {
  // Always remove the scratch file; a thrown run used to leave it behind
  // as an untracked file sitting in the published-assets directory.
  await browser.close();
  rmSync(`${REPO}/profile/.preview.html`, { force: true });
}
