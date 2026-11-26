#!/usr/bin/env node
// senior-design-review: batch capture with Playwright.
// Screenshots (above the fold + full page) and measure.js output for every page x viewport x theme.
//
// Usage:
//   node capture.mjs --url http://localhost:3000 --pages /,/pricing --out .design-review/runs/2026-01-31
//   Options:
//     --viewports core | extended | fold | all | 390x844,1440x900   (default: core)
//     --themes light,dark                                    (default: light)
//     --dark-class dark        also add this class to <html> for dark (class-based themes)
//     --breakpoints 640,768    add each breakpoint -1px and +1px at 900px height
//     --wait 800               extra ms to wait after load (animations)
//     --opts lens.json         space thresholds from the lens (JSON object or file; see references/passes/space-gaps.md)
//
// Playwright is resolved from the project first (cwd), then from this script's location / global.
// Run with --help for this text. Exit code 1 if nothing could be captured.

import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, arr) => {
  if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]);
  return acc;
}, []));

if (args.help || !args.url) {
  console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1).filter((l, i, a) => a.slice(0, i + 1).every(x => x.startsWith('//'))).map(l => l.replace(/^\/\/ ?/, '')).join('\n'));
  process.exit(args.help ? 0 : 1);
}

function loadPlaywright() {
  for (const base of [join(process.cwd(), 'noop.js'), join(here, 'noop.js')]) {
    const req = createRequire(base);
    for (const name of ['playwright', '@playwright/test', 'playwright-core']) {
      try { const m = req(name); if (m.chromium) return m; } catch { /* try next */ }
    }
  }
  try { return createRequire(import.meta.url)('playwright'); } catch { return null; }
}

const VIEWPORTS = {
  core: ['360x800', '390x844', '768x1024', '1024x768', '1280x800', '1440x900', '1920x1080'],
  // short screens: laptop height after browser bars and 125% zoom, phones with browser bars
  fold: ['1280x620', '1366x650', '1440x700', '1536x730', '390x664', '360x640'],
  extended: ['320x568', '430x932', '844x390', '820x1180', '1366x768', '1536x864', '2560x1440', '3440x1440'],
};

const pw = loadPlaywright();
if (!pw) {
  console.error('Playwright not found. Install it in the project (npm i -D playwright && npx playwright install chromium) or use a browser tool instead.');
  process.exit(1);
}

const vpArg = String(args.viewports || 'core');
let viewports = vpArg === 'all' ? [...VIEWPORTS.core, ...VIEWPORTS.extended, ...VIEWPORTS.fold]
  : VIEWPORTS[vpArg] ? [...VIEWPORTS[vpArg]] : vpArg.split(',');
if (args.breakpoints) for (const b of String(args.breakpoints).split(',').map(Number)) viewports.push(`${b - 1}x900`, `${b + 1}x900`);
viewports = [...new Set(viewports)].map(v => { const [w, h] = v.split('x').map(Number); return { w, h }; }).filter(v => v.w && v.h);

const pages = String(args.pages || '/').split(',');
const themes = String(args.themes || 'light').split(',');
const out = resolve(String(args.out || `.design-review/runs/${new Date().toISOString().slice(0, 10)}`));
const measureSrc = readFileSync(join(here, 'measure.js'), 'utf8');
const spaceSrc = readFileSync(join(here, 'space.js'), 'utf8');
const settleSrc = readFileSync(join(here, 'settle.js'), 'utf8');
const optsArg = args.opts ? String(args.opts) : '';
const spaceOpts = !optsArg ? {} : optsArg.trim().startsWith('{') ? JSON.parse(optsArg) : JSON.parse(readFileSync(optsArg, 'utf8'));
const extraWait = Number(args.wait || 800);
const slug = p => (p.replace(/^\/|\/$/g, '').replace(/[^a-z0-9]+/gi, '-') || 'home').toLowerCase();

const browser = await pw.chromium.launch();
const summary = [];
for (const theme of themes) {
  for (const vp of viewports) {
    const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, colorScheme: theme === 'dark' ? 'dark' : 'light', deviceScaleFactor: vp.w < 768 ? 2 : 1 });
    const page = await ctx.newPage();
    for (const p of pages) {
      const name = `${vp.w}x${vp.h}-${theme}`, dir = join(out, 'screenshots', slug(p));
      const entry = { page: p, viewport: `${vp.w}x${vp.h}`, theme };
      try {
        const res = await page.goto(new URL(p, String(args.url)).href, { waitUntil: 'networkidle', timeout: 45000 });
        entry.status = res?.status();
        if (theme === 'dark' && args['dark-class']) await page.evaluate(c => document.documentElement.classList.add(c), String(args['dark-class']));
        await page.evaluate(() => document.fonts?.ready);
        await page.waitForTimeout(extraWait);
        // final visible state: reveal-on-scroll and entrance animations jumped to their end (see settle.js)
        const settled = await page.evaluate(settleSrc);
        mkdirSync(dir, { recursive: true });
        await page.screenshot({ path: join(dir, `${name}-fold.png`) });
        await page.screenshot({ path: join(dir, `${name}-full.png`), fullPage: true });
        const m = await page.evaluate(measureSrc);
        await page.evaluate(o => { window.__SDR_OPTS = o; }, spaceOpts);
        m.space = await page.evaluate(spaceSrc);
        m.settle = settled;
        mkdirSync(join(out, 'measure'), { recursive: true });
        writeFileSync(join(out, 'measure', `${slug(p)}-${name}.json`), JSON.stringify(m, null, 2));
        Object.assign(entry, { ok: true, overflow: m.horizontalOverflow, contrastIssues: m.contrastIssues.length, smallTargets: m.smallTargets.length, cardSets: m.cardSets.length, longLines: m.lineLengthIssues.length, fieldBoundaries: m.fieldBoundaryIssues.length, truncatedPlaceholders: m.placeholderTruncated.length, spaceGaps: m.space.oversizedGaps.length, edges: m.space.edgeIssues.length, firstScreenFits: m.space.firstScreen?.fits ?? null });
      } catch (e) {
        Object.assign(entry, { ok: false, error: String(e.message || e).split('\n')[0] });
      }
      summary.push(entry);
      console.log(entry.ok ? `ok   ${p} @ ${entry.viewport} ${theme}  contrast:${entry.contrastIssues} targets:${entry.smallTargets} fields:${entry.fieldBoundaries} overflow:${entry.overflow} gaps:${entry.spaceGaps} edges:${entry.edges} fold:${entry.firstScreenFits}` : `FAIL ${p} @ ${entry.viewport} ${theme}  ${entry.error}`);
    }
    await ctx.close();
  }
}
await browser.close();
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'capture-summary.json'), JSON.stringify(summary, null, 2));
console.log(`\n${summary.filter(s => s.ok).length}/${summary.length} captures -> ${out}`);
process.exit(summary.some(s => s.ok) ? 0 : 1);
