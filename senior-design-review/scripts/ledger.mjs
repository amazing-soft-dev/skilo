#!/usr/bin/env node
// senior-design-review: the pass ledger. Every pass x page x viewport is a cell; the report can't be written
// until `verify` passes. Work one pass at a time: `next` -> read that pass file -> `extract` -> judge -> write
// findings/<pass>.md -> `mark` -> `next` again.
//
// Usage (all commands take --run <dir>, the run folder, e.g. .design-review/runs/2026-11-25):
//   init     --pages /,/pricing --viewports 390x844,1440x900 [--key-pages /] [--key-viewports 1366x650,2560x1440] [--themes light,dark]
//   next                      the next pass with open cells, its file, and how to get its evidence
//   extract  --pass <name>    only that pass's measurements from measure/*.json, compact (Playwright/CDP runs)
//   mark     --pass <name> --status done|skipped|blocked [--page /x|all] [--viewport 390x844-light|all] [--reason "..."]
//   sync                      mark capture cells done for every measure/*.json present
//   status                    counts per pass
//   verify                    exit 0 only when every cell is done or blocked (with a reason) and every pass has its findings file
//   notchecked                blocked cells grouped by reason, for the report's "Not checked" section
//
// Statuses: pending -> done | skipped (try again later; counts attempts) | blocked (gave up: needs --reason, and either
// 2+ attempts or --permanent for things a retry can't change, like "no source code access").
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const [cmd, ...rest] = process.argv.slice(2);
const args = {};
for (let i = 0; i < rest.length; i++) if (rest[i].startsWith('--')) { const k = rest[i].slice(2); const v = rest[i + 1] && !rest[i + 1].startsWith('--') ? rest[++i] : true; args[k] = v; }
const help = () => { console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1).filter((l, i, a) => a.slice(0, i + 1).every(x => x.startsWith('//'))).map(l => l.replace(/^\/\/ ?/, '')).join('\n')); };
if (!cmd || cmd === '--help' || args.help) { help(); process.exit(cmd ? 0 : 1); }
if (!args.run) { console.error('--run <dir> is required'); process.exit(1); }
const run = resolve(String(args.run)), file = join(run, 'ledger.json');

// Order matters: `next` walks it top to bottom. scope: site (once), page (per page x theme), pv (per page x viewport x theme).
// keys: what `extract` pulls from measure JSON for that pass.
const PASSES = [
  { name: 'intake', scope: 'site' },
  { name: 'lens', scope: 'site' },
  { name: 'capture', scope: 'pv' },
  { name: 'space-gaps', scope: 'pv', keys: ['space.normalSectionGap', 'space.gapLimit', 'space.oversizedGaps', 'space.sparseSections'] },
  { name: 'space-edges', scope: 'pv', keys: ['space.edgeIssues', 'space.stackedBoxes', 'space.crampedText', 'space.headingProximity'] },
  { name: 'space-columns', scope: 'pv', keys: ['space.columns', 'space.orphanActions', 'space.farActions'] },
  { name: 'first-screen', scope: 'pv', keys: ['space.firstScreen', 'space.clipped'] },
  { name: 'fill-width', scope: 'pv', keys: ['space.underfilled', 'space.widthUse', 'cardSets'] },
  { name: 'responsive', scope: 'pv', keys: ['horizontalOverflow', 'smallTargets', 'placeholderTruncated'] },
  { name: 'hierarchy', scope: 'page' },
  { name: 'typography', scope: 'page', keys: ['fontSizes', 'lineLengthIssues'] },
  { name: 'color', scope: 'page', keys: ['contrastIssues', 'fieldBoundaryIssues'] },
  { name: 'imagery', scope: 'page', keys: ['media'] },
  { name: 'states', scope: 'page' },
  { name: 'details', scope: 'page' },
  { name: 'copy', scope: 'page' },
  { name: 'code', scope: 'site' },
  { name: 'score', scope: 'site' },
  { name: 'report', scope: 'site' }
];
const passFile = n => join(here, '..', 'references', 'passes', `${n}.md`);
const slug = p => (p.replace(/^\/|\/$/g, '').replace(/[^a-z0-9]+/gi, '-') || 'home').toLowerCase();
const load = () => { if (!existsSync(file)) { console.error(`No ledger at ${file}. Run init first.`); process.exit(1); } return JSON.parse(readFileSync(file, 'utf8')); };
const save = L => { mkdirSync(run, { recursive: true }); writeFileSync(file, JSON.stringify(L, null, 1)); };
const list = v => String(v || '').split(',').map(s => s.trim()).filter(Boolean);
const open = c => c.status === 'pending' || c.status === 'skipped';

if (cmd === 'init') {
  if (existsSync(file) && !args.force) { console.error(`Ledger exists at ${file}; pass --force to start over.`); process.exit(1); }
  const pages = list(args.pages), vps = list(args.viewports), themes = list(args.themes || 'light');
  const keyPages = list(args['key-pages']), keyVps = list(args['key-viewports']);
  if (!pages.length || !vps.length) { console.error('--pages and --viewports are required'); process.exit(1); }
  const variants = new Map();
  for (const p of pages) for (const v of vps) for (const t of themes) variants.set(`${p}@${v}-${t}`, { page: p, viewport: `${v}-${t}` });
  for (const p of keyPages) for (const v of keyVps) for (const t of themes) variants.set(`${p}@${v}-${t}`, { page: p, viewport: `${v}-${t}` });
  const cells = [];
  for (const P of PASSES) {
    if (P.scope === 'site') cells.push({ pass: P.name, page: '*', viewport: '*' });
    if (P.scope === 'page') for (const p of pages) for (const t of themes) cells.push({ pass: P.name, page: p, viewport: `*-${t}` });
    if (P.scope === 'pv') for (const v of variants.values()) cells.push({ pass: P.name, ...v });
  }
  for (const c of cells) Object.assign(c, { status: 'pending', attempts: 0, reason: '' });
  save({ created: new Date().toISOString(), pages, viewports: vps, keyPages, keyViewports: keyVps, themes, cells });
  const missing = PASSES.filter(P => !existsSync(passFile(P.name))).map(P => P.name);
  console.log(`${cells.length} cells across ${PASSES.length} passes -> ${file}`);
  if (missing.length) console.log(`warning: no pass file for ${missing.join(', ')}`);
  process.exit(0);
}

const L = load();

if (cmd === 'next') {
  const P = PASSES.find(P => L.cells.some(c => c.pass === P.name && open(c)));
  if (!P) { console.log('All passes have no open cells. Run verify.'); process.exit(0); }
  const cs = L.cells.filter(c => c.pass === P.name && open(c));
  const retry = cs.filter(c => c.status === 'skipped');
  console.log(`NEXT PASS: ${P.name} (${P.scope}) - ${cs.length} open cell(s)${retry.length ? `, ${retry.length} are retries` : ''}`);
  console.log(`Read: references/passes/${P.name}.md`);
  if (P.keys) console.log(`Evidence: node scripts/ledger.mjs extract --run ${args.run} --pass ${P.name}   (browser-tool run: see the pass file's snippet)`);
  for (const c of cs.slice(0, 12)) console.log(`  ${c.page} @ ${c.viewport}${c.status === 'skipped' ? `  (retry ${c.attempts}: ${c.reason})` : ''}`);
  if (cs.length > 12) console.log(`  ... and ${cs.length - 12} more`);
  process.exit(0);
}

if (cmd === 'extract') {
  const P = PASSES.find(P => P.name === args.pass);
  if (!P?.keys) { console.error(`Pass ${args.pass} has no measurement keys; it is judged from screenshots, code or other passes.`); process.exit(1); }
  const dir = join(run, 'measure');
  if (!existsSync(dir)) { console.error(`No ${dir}. Capture first (capture.mjs / capture-cdp.mjs), or use the browser snippet in the pass file.`); process.exit(1); }
  const get = (o, k) => k.split('.').reduce((a, x) => a?.[x], o);
  const empty = v => v == null || (Array.isArray(v) && !v.length) || v === false;
  let shown = 0;
  // only this pass's open cells (all of its cells with --all), so a pass sees just the work left
  const wanted = new Set(L.cells.filter(c => c.pass === P.name && (args.all || open(c))).map(c => `${slug(c.page)}-${c.viewport}.json`));
  for (const f of readdirSync(dir).filter(f => wanted.has(f)).sort()) {
    const m = JSON.parse(readFileSync(join(dir, f), 'utf8'));
    const picked = Object.fromEntries(P.keys.map(k => [k.replace(/^space\./, ''), get(m, k)]).filter(([, v]) => !empty(v)));
    const issues = Object.entries(picked).filter(([k]) => !['normalSectionGap', 'gapLimit'].includes(k));
    if (!issues.length && !args.all) continue;
    shown++;
    console.log(`## ${f.replace(/\.json$/, '')}\n${JSON.stringify(picked)}`);
  }
  const noFile = [...wanted].filter(f => !existsSync(join(dir, f)));
  if (noFile.length) console.log(`no measurement for ${noFile.length} open cell(s): ${noFile.slice(0, 6).join(', ')} (capture them, or mark skipped)`);
  if (!shown) console.log('No issues in the open cells for this pass (use --all to print everything).');
  process.exit(0);
}

if (cmd === 'mark') {
  const status = String(args.status || ''), pass = String(args.pass || '');
  if (!['done', 'skipped', 'blocked'].includes(status)) { console.error('--status done|skipped|blocked'); process.exit(1); }
  if (!PASSES.some(P => P.name === pass)) { console.error(`Unknown pass ${pass}. Passes: ${PASSES.map(P => P.name).join(', ')}`); process.exit(1); }
  if (status !== 'done' && !args.reason) { console.error(`--reason is required for ${status}`); process.exit(1); }
  const pages = args.page && args.page !== 'all' ? list(args.page) : null, vps = args.viewport && args.viewport !== 'all' ? list(args.viewport) : null;
  const targets = L.cells.filter(c => c.pass === pass && (!pages || pages.includes(c.page)) && (!vps || vps.includes(c.viewport)));
  if (!targets.length) { console.error('No matching cells. Check --page / --viewport against `status --pass`.'); process.exit(1); }
  const refused = [];
  for (const c of targets) {
    if (status === 'blocked' && c.attempts < 2 && !args.permanent) { refused.push(c); continue; }
    if (status === 'done' && pass !== 'capture' && PASSES.find(P => P.name === pass).scope === 'pv') {
      const cap = L.cells.find(x => x.pass === 'capture' && x.page === c.page && x.viewport === c.viewport);
      if (cap && cap.status !== 'done') { refused.push({ ...c, why: 'capture not done' }); continue; }
    }
    c.status = status; c.reason = String(args.reason || ''); if (status === 'skipped') c.attempts++;
  }
  save(L);
  console.log(`${pass}: ${targets.length - refused.length} cell(s) -> ${status}`);
  if (refused.length) {
    console.log(`refused ${refused.length}:`);
    for (const c of refused.slice(0, 10)) console.log(`  ${c.page} @ ${c.viewport}: ${c.why || 'blocked needs 2 attempts first (mark skipped, retry), or --permanent if a retry cannot help'}`);
    process.exitCode = 2;
  }
  process.exit();
}

if (cmd === 'sync') {
  const dir = join(run, 'measure'), have = new Set(existsSync(dir) ? readdirSync(dir) : []);
  let n = 0;
  for (const c of L.cells.filter(c => c.pass === 'capture' && c.status !== 'done')) if (have.has(`${slug(c.page)}-${c.viewport}.json`)) { c.status = 'done'; n++; }
  save(L); console.log(`capture: ${n} cell(s) marked done from measure/*.json`); process.exit(0);
}

if (cmd === 'status') {
  for (const P of PASSES) {
    const cs = L.cells.filter(c => c.pass === P.name && (!args.pass || args.pass === P.name));
    if (!cs.length) continue;
    const by = s => cs.filter(c => c.status === s).length;
    console.log(`${P.name.padEnd(14)} ${String(cs.length).padStart(4)} cells  done ${by('done')}  pending ${by('pending')}  skipped ${by('skipped')}  blocked ${by('blocked')}`);
    if (args.pass) for (const c of cs) console.log(`  ${c.status.padEnd(8)} ${c.page} @ ${c.viewport} ${c.reason}`);
  }
  process.exit(0);
}

if (cmd === 'verify') {
  const problems = [];
  const openCells = L.cells.filter(open);
  for (const P of PASSES) {
    const o = openCells.filter(c => c.pass === P.name);
    if (o.length) problems.push(`${P.name}: ${o.length} open (${o.filter(c => c.status === 'skipped').length} skipped) e.g. ${o.slice(0, 3).map(c => `${c.page}@${c.viewport}`).join(', ')}`);
    const worked = L.cells.some(c => c.pass === P.name && c.status === 'done');
    if (worked && !['capture', 'report'].includes(P.name) && !existsSync(join(run, 'findings', `${P.name}.md`))) problems.push(`${P.name}: cells marked done but findings/${P.name}.md is missing (write "No findings" if there are none)`);
  }
  const blockedNoReason = L.cells.filter(c => c.status === 'blocked' && !c.reason);
  if (blockedNoReason.length) problems.push(`${blockedNoReason.length} blocked cell(s) without a reason`);
  if (problems.length) {
    console.log('NOT READY. Fix these, then verify again:');
    for (const p of problems) console.log('  - ' + p);
    console.log('Retry skipped cells now (node scripts/ledger.mjs next); block a cell only after 2 attempts, or --permanent with a reason.');
    process.exit(1);
  }
  const blocked = L.cells.filter(c => c.status === 'blocked').length;
  console.log(`READY: ${L.cells.length} cells, ${blocked} blocked (list them under "Not checked": node scripts/ledger.mjs notchecked)`);
  process.exit(0);
}

if (cmd === 'notchecked') {
  const groups = new Map();
  for (const c of L.cells.filter(c => c.status === 'blocked')) { const k = `${c.pass}: ${c.reason}`; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(`${c.page}@${c.viewport}`); }
  if (!groups.size) console.log('Nothing blocked.');
  for (const [k, v] of groups) console.log(`- ${k} (${v.length}: ${v.slice(0, 6).join(', ')}${v.length > 6 ? ', ...' : ''})`);
  process.exit(0);
}

help(); process.exit(1);
