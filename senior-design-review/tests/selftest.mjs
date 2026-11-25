#!/usr/bin/env node
// senior-design-review self-test: run after changing settle.js, measure.js or space.js.
// Serves tests/fixture-space.html, captures it with capture-cdp.mjs (needs Chrome or Edge; --chrome <path> if not found)
// at three sizes, and checks that every planted defect is found and the well-spaced controls are not flagged.
// Usage: node tests/selftest.mjs [--chrome <path>]
import { createServer } from 'node:http';
import { readFileSync, readdirSync, rmSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(here, 'fixture-space.html'));
const server = createServer((req, res) => {
  if (req.url.startsWith('/fixture-space.html')) { res.writeHead(200, { 'content-type': 'text/html' }); res.end(html); }
  else { res.writeHead(404); res.end('not found'); }
}).listen(0);
const port = server.address().port, out = join(tmpdir(), `sdr-selftest-${port}`);
const chrome = process.argv.includes('--chrome') ? ['--chrome', process.argv[process.argv.indexOf('--chrome') + 1]] : [];
// async spawn: a synchronous one would block this process's server while the capture waits on it
const run = await new Promise(res => {
  const p = spawn(process.execPath, [join(here, '..', 'scripts', 'capture-cdp.mjs'), '--url', `http://localhost:${port}`, '--pages', '/fixture-space.html',
    '--viewports', '1440x900,1366x650,390x844', '--out', out, '--full', 'false', ...chrome]);
  let log = ''; p.stdout.on('data', d => log += d); p.stderr.on('data', d => log += d);
  p.on('close', status => res({ status, log }));
});
server.close();
if (run.status !== 0) { console.error(run.log); process.exit(1); }

const m = Object.fromEntries(readdirSync(join(out, 'measure')).map(f => [f.match(/(\d+x\d+)/)[1], JSON.parse(readFileSync(join(out, 'measure', f), 'utf8'))]));
let failed = 0;
const check = (name, ok) => { console.log(`${ok ? 'pass' : 'FAIL'}  ${name}`); if (!ok) failed++; };
const S = vp => m[vp].space;
for (const vp of ['1440x900', '1366x650']) {
  const s = S(vp);
  check(`${vp} empty band before the reviews heading`, s.oversizedGaps.some(g => g.below.text.startsWith('Read what our clients') && g.kind.startsWith('empty-band') && g.sources.length));
  check(`${vp} disclaimer touches its band's bottom edge`, s.edgeIssues.some(e => e.sel === '#disclaimer' && e.touching.includes('bottom') && e.cause.length));
  check(`${vp} photo touches its band's top edge`, s.edgeIssues.some(e => e.sel === '#photo' && e.touching.includes('top')));
  check(`${vp} short column beside a tall card -> sticky, overflow blocker named`, s.columns.some(c => c.short.sel === '#short-col' && c.suggest.startsWith('sticky') && /#unequal overflow hidden/.test(c.stickyBlockedBy || '')));
  check(`${vp} under-filled feature cards (min-height)`, s.underfilled.some(u => u.sel.includes('feat') && u.minHeight === '240px'));
  check(`${vp} stranded action row`, s.orphanActions.some(o => o.sel === '#orphan-row'));
  check(`${vp} far action in the reviews row`, s.farActions.some(f => f.sel === '#far-btn'));
  check(`${vp} cramped paragraphs`, s.crampedText.length >= 1);
  check(`${vp} heading closer to the previous block`, s.headingProximity.some(h => h.text.startsWith('Heading that floats')));
  check(`${vp} sticky header below a utility bar measured as chrome`, s.headerBottom === 120 && !s.edgeIssues.some(e => e.text.startsWith('Header')));
  check(`${vp} JS animation stuck at opacity 0.001 forced visible`, m[vp].settle.forced.some(f => f.sel === '#js-anim'));
  check(`${vp} scroll-reveal paragraph forced visible, not empty`, m[vp].settle.forcedVisible >= 1 && !s.headingProximity.some(h => h.text.startsWith('Revealed')));
  check(`${vp} fade-in wrapper around an image forced visible`, m[vp].settle.forced.some(f => f.sel === '#rev-img'));
  check(`${vp} sticky stacking cards counted as content`, !s.oversizedGaps.some(g => g.below.text.startsWith('Path 2') || g.above.text.startsWith('Two paths')));
  check(`${vp} eyebrow label and side-by-side heading not flagged`, !s.headingProximity.some(h => /eyebrow|beside its content/.test(h.text)));
  check(`${vp} well-spaced section not flagged`, !s.edgeIssues.some(e => e.sel.includes('good')) && !s.underfilled.some(u => u.sel.includes('good')) && !s.sparseSections.some(x => x.sel === '#good'));
}
check('sr-only heading not measured for contrast', !m['1440x900'].contrastIssues.some(c => c.text.startsWith('Site information')));
check('text over an <img> flagged overImage, not a computed failure', m['1440x900'].contrastIssues.some(c => c.text.startsWith('White text on a photo') && c.overImage));
check('1366x650 first screen measured', S('1366x650').firstScreen && typeof S('1366x650').firstScreen.fits === 'boolean');
check('390x844 fixed bottom bar measured', S('390x844').bottomBar === 64);
check('390x844 columns stack (no column findings)', S('390x844').columns.length === 0);
check('390x844 viewport meta read', m['390x844'].viewportMeta?.includes('width=device-width'));
rmSync(out, { recursive: true, force: true });
console.log(failed ? `\n${failed} check(s) failed` : '\nall checks passed');
process.exit(failed ? 1 : 0);
