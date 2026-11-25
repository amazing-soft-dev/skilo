// senior-design-review: measure many pages x viewports in ONE browser-tool call, for sessions without Playwright or CDP.
// 1. Open any page of the site (same origin) in the browser tool. Give the tab a real size first (resize it to the
//    largest viewport you test); a hidden or 0x0 tab never triggers lazy images or scroll-reveal content.
// 2. Evaluate scripts/bundle.js once in that tab (settle.js + measure.js + space.js + this file; build it with `node scripts/bundle.mjs`).
// 3. Evaluate:  window.__SDR_BATCH = { pages: ['/', '/pricing'], viewports: ['390x844', '1440x900'], opts: {...lens}, wait: 600 }; __sdr.start()
//    Browser tools give up on a call after ~45s (and a hidden pane runs timers slower), so start() returns at once and
//    the batch keeps running in the page. Poll with __sdr.status() until running is false. (__sdr.batch() is the
//    same run awaited, for tools without a time limit.)
//    Results accumulate in window.__sdrAll across runs (a page@viewport measured again replaces the old entry); the
//    latest run alone is window.__sdrBatch. Too big to return at once: each pass pulls only its own keys, e.g.
//    __sdrAll.map(r => ({ page: r.page, vp: r.viewport, gaps: r.m?.space.oversizedGaps }))
// Each page loads in a same-origin iframe sized to the viewport, so media queries, vh units and the fold match that size.
// Limits: no screenshots (take those with the browser tool's own screenshot at the same size); cross-origin pages can't be read.
(() => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const batch = async () => {
    const B = Object.assign({ pages: ['/'], viewports: ['390x844', '1440x900'], opts: {}, wait: 600, timeout: 20000 }, window.__SDR_BATCH || {});
    if (!window.__sdr?.measure || !window.__sdr?.space || !window.__sdr?.settle) return 'Evaluate bundle.js (settle + measure + space + batch) in this tab first.';
    const out = [], started = Date.now();
    const host = document.createElement('div');
    host.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;overflow:visible;z-index:2147483647;pointer-events:none;opacity:0';
    document.body.appendChild(host);
    for (const vp of B.viewports) {
      const [w, h] = String(vp).split('x').map(Number);
      for (const p of B.pages) {
        const f = document.createElement('iframe');
        f.style.cssText = `position:absolute;left:0;top:0;border:0;width:${w}px;height:${h}px`;
        f.src = new URL(p, location.href).href;
        host.appendChild(f);
        const entry = { page: p, viewport: vp };
        try {
          try { entry.status = (await fetch(f.src, { credentials: 'include' })).status; } catch { entry.status = null; }
          await new Promise((res, rej) => { f.onload = res; setTimeout(() => rej(new Error('load timeout')), B.timeout); });
          const win = f.contentWindow, doc = win.document;
          if (B.darkClass) doc.documentElement.classList.add(B.darkClass);
          // phones and tablets use overlay scrollbars; a desktop scrollbar inside a narrow iframe steals ~15px and adds wrapping
          if (w < 1024) { const ss = doc.createElement('style'); ss.textContent = 'html{scrollbar-width:none}html::-webkit-scrollbar{display:none}'; doc.head.appendChild(ss); }
          await doc.fonts?.ready;
          await sleep(B.wait);
          const settled = await win.eval('(' + window.__sdr.settle.toString() + ')()');
          win.__SDR_OPTS = B.opts;
          entry.m = win.eval('(' + window.__sdr.measure.toString() + ')()');
          entry.m.space = win.eval('(' + window.__sdr.space.toString() + ')()');
          entry.m.settle = settled;
          entry.ok = true;
        } catch (e) { entry.ok = false; entry.error = String(e.message || e); }
        f.remove();
        out.push(entry);
        window.__sdrProgress = { running: true, done: out.length, total: B.pages.length * B.viewports.length, last: `${p} @ ${vp}` };
      }
    }
    host.remove();
    window.__sdrBatch = out;
    const keep = (window.__sdrAll || []).filter(a => !out.some(e => e.page === a.page && e.viewport === a.viewport));
    window.__sdrAll = [...keep, ...out];
    return out.map(e => e.ok
      ? `${e.status && e.status >= 400 ? 'HTTP' + e.status : 'ok  '} ${e.page} @ ${e.viewport}  overflow:${e.m.horizontalOverflow} contrast:${e.m.contrastIssues.length} gaps:${e.m.space.oversizedGaps.length} edges:${e.m.space.edgeIssues.length} columns:${e.m.space.columns.length} fold:${e.m.space.firstScreen?.fits} forced:${e.m.settle.forcedVisible}`
      : `FAIL ${e.page} @ ${e.viewport}  ${e.error}`).join('\n') + `\n${out.filter(e => e.ok).length}/${out.length} in ${Math.round((Date.now() - started) / 1000)}s -> window.__sdrBatch`;
  };
  const start = () => {
    if (window.__sdrProgress?.running) return 'a batch is already running: poll __sdr.status()';
    const B = window.__SDR_BATCH || {}, total = (B.pages || ['/']).length * (B.viewports || [1, 2]).length;
    window.__sdrProgress = { running: true, done: 0, total };
    batch().then(summary => { window.__sdrProgress = { ...window.__sdrProgress, running: false, summary }; },
      e => { window.__sdrProgress = { ...window.__sdrProgress, running: false, summary: 'FAILED ' + (e.message || e) }; });
    return `started ${total} capture(s): poll __sdr.status()`;
  };
  const status = () => window.__sdrProgress || { running: false, done: 0, total: 0 };
  try { window.__sdr = Object.assign(window.__sdr || {}, { batch, start, status }); } catch (e) { /* read-only window */ }
  return 'batch ready: set window.__SDR_BATCH then call __sdr.start() and poll __sdr.status()';
})()
