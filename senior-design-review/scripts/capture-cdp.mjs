#!/usr/bin/env node
// Playwright-free fallback for the senior-design-review capture: drives installed Chrome over the
// DevTools protocol (Node >= 22 global WebSocket). Same output layout as capture.mjs.
// node cdp-capture.mjs --url http://localhost:3000 --pages /,/pricing --viewports 390x844,1440x900 --out DIR --measure path/to/measure.js
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, arr) => {
  if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]);
  return acc;
}, []));
const VIEWPORTS = {
  core: ['360x800', '390x844', '768x1024', '1024x768', '1280x800', '1440x900', '1920x1080'],
  extended: ['320x568', '430x932', '844x390', '820x1180', '1366x768', '1536x864', '2560x1440', '3440x1440'],
};
const vpArg = String(args.viewports || 'core');
let viewports = vpArg === 'all' ? [...VIEWPORTS.core, ...VIEWPORTS.extended] : VIEWPORTS[vpArg] ? [...VIEWPORTS[vpArg]] : vpArg.split(',');
if (args.breakpoints) for (const b of String(args.breakpoints).split(',').map(Number)) viewports.push(`${b - 1}x900`, `${b + 1}x900`);
viewports = [...new Set(viewports)].map(v => { const [w, h] = v.split('x').map(Number); return { w, h }; });
const pages = String(args.pages || '/').split(',');
const out = resolve(String(args.out));
const measureSrc = readFileSync(String(args.measure), 'utf8');
const full = args.full !== 'false';
const slug = p => (p.replace(/^\/|\/$/g, '').replace(/[^a-z0-9]+/gi, '-') || 'home').toLowerCase();

const chromePaths = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'];
const chrome = chromePaths.find(existsSync);
const port = 9333 + Math.floor(Math.random() * 500);
const profile = join(tmpdir(), `sdr-cdp-${port}`);
const proc = spawn(chrome, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--no-first-run', '--hide-scrollbars', '--force-color-profile=srgb', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ver;
for (let i = 0; i < 50 && !ver; i++) { try { ver = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); } catch { await sleep(200); } }
const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r, { once: true }));
let id = 0; const pending = new Map(); const listeners = [];
ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { const { res, rej } = pending.get(m.id); pending.delete(m.id); m.error ? rej(new Error(m.error.message)) : res(m.result); } else listeners.forEach(l => l(m)); });
const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
const evaluate = async expr => (await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result.value;
const waitLoad = () => new Promise(r => { const t = setTimeout(r, 30000); listeners.push(m => { if (m.method === 'Page.loadEventFired') { clearTimeout(t); r(); } }); });
await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'dark' }] });

const summary = [];
for (const vp of viewports) {
  const mobile = vp.w < 768;
  await send('Emulation.setDeviceMetricsOverride', { width: vp.w, height: vp.h, deviceScaleFactor: mobile ? 2 : 1, mobile });
  await send('Emulation.setTouchEmulationEnabled', { enabled: mobile });
  for (const p of pages) {
    const name = `${vp.w}x${vp.h}-dark`, dir = join(out, 'screenshots', slug(p));
    const entry = { page: p, viewport: `${vp.w}x${vp.h}`, theme: 'dark' };
    try {
      const loaded = waitLoad();
      await send('Page.navigate', { url: new URL(p, String(args.url)).href });
      await loaded; listeners.length = 0;
      await evaluate('document.fonts.ready.then(() => 1)');
      await evaluate('(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight / 2) { scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); } scrollTo(0, 0); return 1; })()');
      await sleep(Number(args.wait || 900));
      mkdirSync(dir, { recursive: true });
      const fold = await send('Page.captureScreenshot', { format: 'png' });
      writeFileSync(join(dir, `${name}-fold.png`), Buffer.from(fold.data, 'base64'));
      if (full) {
        const h = await evaluate('Math.min(document.documentElement.scrollHeight, 16000)');
        const shot = await send('Page.captureScreenshot', { format: 'jpeg', quality: 70, captureBeyondViewport: true, clip: { x: 0, y: 0, width: vp.w, height: h, scale: mobile ? 0.5 : 1 } });
        writeFileSync(join(dir, `${name}-full.jpg`), Buffer.from(shot.data, 'base64'));
        await send('Emulation.setDeviceMetricsOverride', { width: vp.w, height: vp.h, deviceScaleFactor: mobile ? 2 : 1, mobile });
      }
      await evaluate('scrollTo(0,0)'); await sleep(200);
      const m = await evaluate(measureSrc);
      mkdirSync(join(out, 'measure'), { recursive: true });
      writeFileSync(join(out, 'measure', `${slug(p)}-${name}.json`), JSON.stringify(m, null, 2));
      Object.assign(entry, { ok: true, overflow: m.horizontalOverflow, contrastIssues: m.contrastIssues.length, smallTargets: m.smallTargets.length, cardSets: m.cardSets.length, longLines: m.lineLengthIssues.length, fieldBoundaries: m.fieldBoundaryIssues.length, truncatedPlaceholders: m.placeholderTruncated.length });
    } catch (e) { Object.assign(entry, { ok: false, error: String(e.message || e).split('\n')[0] }); }
    summary.push(entry);
    console.log(entry.ok ? `ok   ${p} @ ${entry.viewport}  contrast:${entry.contrastIssues} targets:${entry.smallTargets} fields:${entry.fieldBoundaries} overflow:${entry.overflow}` : `FAIL ${p} @ ${entry.viewport}  ${entry.error}`);
  }
}
mkdirSync(out, { recursive: true });
const sumFile = join(out, 'capture-summary.json');
const prev = existsSync(sumFile) ? JSON.parse(readFileSync(sumFile, 'utf8')) : [];
writeFileSync(sumFile, JSON.stringify([...prev, ...summary], null, 2));
ws.close(); proc.kill();
console.log(`\n${summary.filter(s => s.ok).length}/${summary.length} captures -> ${out}`);
