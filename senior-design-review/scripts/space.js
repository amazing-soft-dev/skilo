// senior-design-review: space measurement. Evaluate in the page like measure.js (returns JSON).
// Finds empty bands, oversized gaps, boxes touching section edges, cramped text, unequal side-by-side
// columns, under-filled boxes, stranded action rows and whether the first screen fits.
// Thresholds come from the lens: set window.__SDR_OPTS = {...} before evaluating (see references/passes/space-*.md).
// Also registers itself as window.__sdr.space so scripts/batch.js can run it inside same-origin iframes.
(() => {
  const run = (opts) => {
    const O = Object.assign({
      gapMultiplier: 1.5,   // a gap is oversized when > multiplier x the page's normal section gap ...
      gapFloor: 96,         // ... and > this many px (seniors/luxury lenses raise it)
      bandShare: 0.25,      // an empty band taller than this share of the screen height reads as "page ended"
      bandHard: 0.4,        // ... and this share is always High
      edgeMin: 16,          // min px between a box/image and a background boundary (phones use edgeMinPhone)
      edgeMinPhone: 12,
      paraMinEm: 0.5,       // min gap between consecutive paragraphs, in em of the lower paragraph
      fillMin: 0.55,        // a box whose content fills less than this share of its height is under-filled
      orphanGap: 96,        // an action row with more empty space than this above AND below is stranded
      columnDiffPx: 160,    // side-by-side columns are unequal when their content heights differ by more than this ...
      columnDiff: 0.3,      // ... and by more than this share of the taller column
      farShare: 0.3,        // an action is far from its text when the empty width between them exceeds this share of the row
      wideShare: 0.5        // on screens >= 1600px, a section whose content spans less than this share of the width is flagged
    }, opts || window.__SDR_OPTS || {});
    scrollTo(0, 0);
    // after settle.js: re-apply the final visible state right before measuring (reveal scripts can re-hide content late)
    if (document.getElementById('sdr-settle')) for (const el of document.body.querySelectorAll('*')) { const cs = getComputedStyle(el); if (parseFloat(cs.opacity) < 0.05 && ((el.innerText || '').trim().length >= 3 || el.matches('img,video,picture,canvas') || el.querySelector('img,video,picture,canvas')) && cs.position !== 'absolute' && cs.position !== 'fixed' && !el.closest('[aria-hidden="true"],[hidden],[inert]')) { el.style.setProperty('opacity', '1', 'important'); if (cs.transform !== 'none') el.style.setProperty('transform', 'none', 'important'); } }
    // CW, not innerWidth: a classic scrollbar (Windows) takes ~15px, so full-width sections end before innerWidth.
    const W = innerWidth, CW = document.documentElement.clientWidth || W, H = innerHeight, phone = W < 768, edgeMin = phone ? O.edgeMinPhone : O.edgeMin;
    const cv = document.createElement('canvas'); cv.width = cv.height = 1;
    const cx = cv.getContext('2d', { willReadFrequently: true });
    const rgba = c => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = 'rgba(0,0,0,0)'; cx.fillStyle = c; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255]; };
    const over = (t, b) => { const a = t[3] + b[3] * (1 - t[3]); if (!a) return [255, 255, 255, 0]; return [0, 1, 2].map(i => (t[i] * t[3] + b[i] * b[3] * (1 - t[3])) / a).concat(a); };
    const effBg = el => { const layers = []; let img = false; for (let e = el; e; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.backgroundImage !== 'none') img = true; const c = rgba(cs.backgroundColor); if (c[3] > 0) { layers.push(c); if (c[3] >= 1) break; } } let out = [255, 255, 255, 1]; for (let i = layers.length - 1; i >= 0; i--) out = over(layers[i], out); return { c: out, img }; };
    const diff = (a, b) => Math.max(...[0, 1, 2].map(i => Math.abs(a[i] - b[i])));
    const r2 = v => Math.round(v);
    const top = r => r.top + scrollY, bot = r => r.bottom + scrollY;
    const vis = el => { if (el.checkVisibility && !el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) return false; const r = el.getBoundingClientRect(); return r.width > 1 && r.height > 1; };
    const sel = el => { if (!el || !el.tagName) return ''; if (el.id) return '#' + el.id; const c = typeof el.className === 'string' ? el.className.trim().split(/\s+/).filter(Boolean).slice(0, 3).join('.') : ''; return el.tagName.toLowerCase() + (c ? '.' + c : ''); };
    const label = el => (el?.innerText || el?.getAttribute?.('aria-label') || el?.getAttribute?.('alt') || '').replace(/\s+/g, ' ').trim().slice(0, 50);
    const where = el => ({ sel: sel(el), text: label(el) });
    // Chrome that floats over the page: anything inside a fixed element, or inside a sticky element that is stuck at the
    // top at scroll 0 (a header, even a zero-height sticky wrapper around the real bar). Sticky elements further down
    // (sticky columns, scroll-stacking cards) are content and stay in.
    const stuckCache = new Map();
    const inFixed = el => {
      for (let e = el; e && e !== document.body; e = e.parentElement) {
        if (stuckCache.has(e)) { if (stuckCache.get(e)) return true; continue; }
        const cs = getComputedStyle(e);
        // a sticky header can start below a utility bar (top 48px at scroll 0): wide + near the top + small sticky offset = chrome
        const rr = e.getBoundingClientRect();
        const v = cs.position === 'fixed' || (cs.position === 'sticky' && (rr.top <= 1 || (rr.top < H * 0.3 && (rr.width > CW * 0.8 || e.matches('header,nav,[role=banner]')) && (parseFloat(cs.top) || 0) < H * 0.15)));
        stuckCache.set(e, v); if (v) return true;
      }
      return false;
    };

    // ---- 1. Ink: what a reader sees as content. Text line boxes, media, controls and framed boxes (cards count as solid).
    const all = [...document.body.querySelectorAll('*')].filter(e => !['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'BR'].includes(e.tagName));
    const ink = [], boxes = [], bands = [];
    const isButtonLike = (el, cs) => { if (!el.matches('a,button,[role=button],input[type=submit],input[type=button]')) return false; const r = el.getBoundingClientRect(); if (r.height < 28 || r.width < 48) return false; return rgba(cs.backgroundColor)[3] > 0 || parseFloat(cs.borderTopWidth) > 0 || cs.boxShadow !== 'none'; };
    let headerBottom = 0, bottomBar = 0;
    for (const el of all) {
      if (!vis(el)) continue;
      const cs = getComputedStyle(el), r = el.getBoundingClientRect();
      if (inFixed(el)) {
        // what floats over the first screen: header bars at the top, action/cookie bars at the bottom
        if (r.width > CW * 0.5 && r.height < H * 0.3) { if (r.top < H * 0.15) headerBottom = Math.max(headerBottom, r.bottom); else if (r.bottom >= H - 2 && cs.position === 'fixed') bottomBar = Math.max(bottomBar, H - r.top); }
        continue;
      }
      const fullBleed = r.left <= 1 && r.right >= CW - 1;
      const bgc = rgba(cs.backgroundColor), hasImg = cs.backgroundImage !== 'none';
      if (fullBleed && (bgc[3] > 0 || hasImg) && r.height > 24 && el !== document.body && el !== document.documentElement) {
        const own = effBg(el), parent = effBg(el.parentElement || el);
        if (hasImg || diff(own.c, parent.c) > 6) bands.push({ el, top: top(r), bottom: bot(r), img: hasImg });
        continue;
      }
      const framed = ['Top', 'Right', 'Bottom', 'Left'].every(s => parseFloat(cs['border' + s + 'Width']) > 0) || cs.boxShadow !== 'none' ||
        ((bgc[3] > 0 || hasImg) && diff(effBg(el).c, effBg(el.parentElement || el).c) > 6);
      const media = el.matches('img,video,canvas,iframe,svg,picture,object,embed') || (hasImg && r.width * r.height > 2500);
      const control = el.matches('input:not([type=hidden]),select,textarea,button');
      if ((framed && r.width >= 40 && r.height >= 24) || media || control) {
        if (media && el.closest('svg') !== el && el.tagName !== 'svg' && el.closest('svg')) continue;
        const item = { el, top: top(r), bottom: bot(r), left: r.left, right: r.right, kind: media ? 'media' : control ? 'control' : 'box' };
        ink.push(item); if (!control) boxes.push(item);
      }
    }
    const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const range = document.createRange();
    for (let n = tw.nextNode(); n; n = tw.nextNode()) {
      if (!n.textContent.trim()) continue;
      const p = n.parentElement; if (!p || ['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE'].includes(p.tagName) || !vis(p) || inFixed(p)) continue;
      range.selectNodeContents(n);
      for (const r of range.getClientRects()) if (r.width > 1 && r.height > 4) ink.push({ el: p, top: top(r), bottom: bot(r), left: r.left, right: r.right, kind: 'text' });
    }
    ink.sort((a, b) => a.top - b.top);
    const docH = document.documentElement.scrollHeight;

    // Background boundaries: where a full-bleed band with a visibly different background starts or ends.
    const lines = [];
    // one line per y; it remembers the band that starts there and the band that ends there (often both)
    for (const b of bands) for (const [y, edge] of [[b.top, 'starts'], [b.bottom, 'ends']]) {
      if (y <= 2 || y >= docH - 2) continue;
      let l = lines.find(l => Math.abs(l.y - y) < 3);
      if (!l) { l = { y: r2(y), band: sel(b.el), approx: b.img }; lines.push(l); }
      if (!l[edge]) l[edge] = b.el;
    }
    lines.sort((a, b) => a.y - b.y);

    // ---- 2. Vertical gaps across the full width (nothing to read from left to right).
    const merged = [];
    for (const i of ink) { const last = merged[merged.length - 1]; if (last && i.top <= last.bottom + 1) { if (i.bottom > last.bottom) { last.bottom = i.bottom; last.lastEl = i.el; } } else merged.push({ top: i.top, bottom: i.bottom, firstEl: i.el, lastEl: i.el }); }
    const sections = [...(document.querySelector('main') || document.body).children].filter(e => vis(e) && e.getBoundingClientRect().height > 80);
    const secTops = sections.map(e => top(e.getBoundingClientRect()));
    const gaps = [];
    for (let i = 1; i < merged.length; i++) {
      const g = { top: r2(merged[i - 1].bottom), bottom: r2(merged[i].top) }; g.h = g.bottom - g.top;
      if (g.h < 8) continue;
      g.crossesSection = secTops.some(t => t > g.top - 4 && t < g.bottom + 4) || lines.some(l => l.y > g.top && l.y < g.bottom);
      g.above = where(merged[i - 1].lastEl); g.below = where(merged[i].firstEl); g.aboveEl = merged[i - 1].lastEl; g.belowEl = merged[i].firstEl;
      gaps.push(g);
    }
    for (const g of gaps) if (!g.aboveEl) g.aboveEl = g.belowEl = document.body;
    // Which CSS makes a gap: paddings and margins of the elements walking out from each side, min-heights, parent gaps.
    const spacingSources = (aboveEl, belowEl, gTop, gBot) => {
      const out = [], add = (e, prop, v) => { if (v >= 8) out.push(`${sel(e)} ${prop} ${r2(v)}px`); };
      for (let e = aboveEl; e && e !== document.body; e = e.parentElement) {
        const r = e.getBoundingClientRect(); if (bot(r) > gBot + 1) break;
        const cs = getComputedStyle(e); add(e, 'padding-bottom', parseFloat(cs.paddingBottom)); add(e, 'margin-bottom', parseFloat(cs.marginBottom));
        if (!['0px', 'auto', 'none'].includes(cs.minHeight)) out.push(`${sel(e)} min-height ${cs.minHeight}`);
      }
      for (let e = belowEl; e && e !== document.body; e = e.parentElement) {
        const r = e.getBoundingClientRect(); if (top(r) < gTop - 1) break;
        const cs = getComputedStyle(e); add(e, 'padding-top', parseFloat(cs.paddingTop)); add(e, 'margin-top', parseFloat(cs.marginTop));
      }
      let common = aboveEl; while (common && !common.contains(belowEl)) common = common.parentElement;
      if (common && common !== document.body) { const cs = getComputedStyle(common); if (/flex|grid/.test(cs.display)) add(common, 'row-gap', parseFloat(cs.rowGap)); }
      return out.slice(0, 10);
    };
    const median = a => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
    const secGaps = gaps.filter(g => g.crossesSection).map(g => g.h);
    const big = gaps.map(g => g.h).filter(h => h >= 24).sort((a, b) => a - b);
    const normalGap = secGaps.length >= 3 ? median(secGaps) : big.length ? big[Math.floor(big.length * 0.75)] : O.gapFloor;
    const limit = Math.max(normalGap * O.gapMultiplier, O.gapFloor);
    const oversizedGaps = gaps.filter(g => g.h > limit || g.h > O.bandShare * H).map(({ aboveEl, belowEl, ...g }) => ({
      ...g, sources: spacingSources(aboveEl, belowEl, g.top, g.bottom), ratioToNormal: +(g.h / normalGap).toFixed(2), screenShare: +(g.h / H).toFixed(2),
      kind: g.h > O.bandHard * H ? 'empty-band-hard' : g.h > O.bandShare * H ? 'empty-band' : 'oversized',
      boundaries: lines.filter(l => l.y > g.top && l.y < g.bottom).map(l => l.y)
    }));

    // ---- 3. Edges: boxes and images that touch a background boundary, or sit unevenly inside a band.
    const edgeIssues = [];
    for (const b of boxes) {
      if (b.right - b.left < 120 || b.bottom - b.top < 40) continue;
      if (b.el.closest('[aria-hidden="true"]') || (b.el.tagName.toLowerCase() === 'svg' && !b.el.getAttribute('role') && !b.el.getAttribute('aria-label'))) continue; // decorative
      // only outermost boxes: skip a box inside another box (its parent box owns the edge)
      if (boxes.some(o => o !== b && o.el.contains(b.el) && o.el !== b.el)) continue;
      const above = [...lines].reverse().find(l => l.y <= b.top + 2), below = lines.find(l => l.y >= b.bottom - 2);
      const dTop = above ? r2(b.top - above.y) : null, dBot = below ? r2(below.y - b.bottom) : null;
      // media flush with both edges of its band is a deliberate edge-to-edge image, not a spacing slip
      if (b.kind === 'media' && dTop !== null && dBot !== null && Math.abs(dTop) <= 2 && Math.abs(dBot) <= 2) continue;
      const kiss = [];
      if (dTop !== null && dTop >= -2 && dTop < edgeMin) kiss.push('top');
      if (dBot !== null && dBot >= -2 && dBot < edgeMin) kiss.push('bottom');
      // sole content of its band: compare its top and bottom space
      let uneven = null;
      if (above && below) {
        const others = ink.filter(i => i.top >= above.y && i.bottom <= below.y && !b.el.contains(i.el) && i.el !== b.el);
        if (!others.length && dTop >= 0 && dBot >= 0) { const mx = Math.max(dTop, dBot), mn = Math.min(dTop, dBot); if (mx - mn > 32 && mx > 2 * mn) uneven = { top: dTop, bottom: dBot }; }
      }
      // likely cause: the band has no padding on that side, and/or the box's margin collapses through the band edge
      const cause = [];
      const bcs = getComputedStyle(b.el);
      for (const [side, line] of [['top', above], ['bottom', below]]) {
        // the box's own band: the one starting at the line above it, or ending at the line below it
        const band = side === 'top' ? line?.starts : line?.ends;
        if (!kiss.includes(side) || !band) continue;
        const pad = parseFloat(getComputedStyle(band)[side === 'top' ? 'paddingTop' : 'paddingBottom']), boxMargin = parseFloat(bcs[side === 'top' ? 'marginTop' : 'marginBottom']);
        cause.push(`${side}: ${sel(band)} padding-${side} ${r2(pad)}px` + (boxMargin ? `, box margin-${side} ${r2(boxMargin)}px${pad === 0 ? ' (collapses through the band: give the band padding or display:flow-root)' : ''}` : ''));
      }
      if (kiss.length || uneven) edgeIssues.push({ ...where(b.el), kind: b.kind, cause, top: r2(b.top), bottom: r2(b.bottom), gapToBoundaryAbove: dTop, gapToBoundaryBelow: dBot, touching: kiss, uneven, need: edgeMin });
    }
    // Stacked boxes with (almost) no space between them, when they are not items of the same list.
    const stacked = [];
    const outer = boxes.filter(b => !boxes.some(o => o !== b && o.el.contains(b.el)));
    for (const a of outer) for (const b of outer) {
      if (a === b || b.top < a.bottom - 2) continue;
      const g = b.top - a.bottom, ov = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      if (g >= -1 && g < 8 && ov > 0.5 * Math.min(a.right - a.left, b.right - b.left) && a.el.parentElement !== b.el.parentElement)
        stacked.push({ upper: where(a.el), lower: where(b.el), gap: r2(g) });
    }

    // ---- 4. Text rhythm: paragraphs with no space between them; headings closer to what's above than to their own content.
    const crampedText = [], headingProximity = [];
    const blocks = [...document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, blockquote, dl, ul, ol, figure, table')].filter(e => vis(e) && !inFixed(e));
    for (const p of blocks) {
      const n = p.nextElementSibling; if (!n || !vis(n) || !['P', 'UL', 'OL', 'BLOCKQUOTE'].includes(n.tagName) || p.tagName !== 'P') continue;
      const a = p.getBoundingClientRect(), b = n.getBoundingClientRect(), fs = parseFloat(getComputedStyle(n).fontSize);
      const g = b.top - a.bottom, pcs = getComputedStyle(p);
      if (+pcs.fontWeight >= 600 || parseFloat(pcs.fontSize) > fs * 1.1) continue; // label or heading styled as <p>
      if (g >= -1 && g < O.paraMinEm * fs && Math.abs(a.left - b.left) < 40) crampedText.push({ ...where(p), next: where(n), gap: r2(g), need: r2(O.paraMinEm * fs) });
    }
    for (const h of blocks.filter(e => /^H[2-4]$/.test(e.tagName))) {
      const r = h.getBoundingClientRect(), t = top(r), b = bot(r);
      const prev = ink.filter(i => i.bottom <= t + 1 && i.right > r.left && i.left < r.right && !h.contains(i.el)).pop();
      const next = ink.find(i => i.top >= b - 1 && i.right > r.left && i.left < r.right && !h.contains(i.el));
      if (!prev || !next) continue;
      // content beside the heading (two-column intro: heading left, content right) means it isn't floating
      if (ink.some(i => !h.contains(i.el) && i.left >= r.right - 2 && i.top < b + 40 && i.bottom > t - 20)) continue;
      let above = r2(t - prev.bottom);
      // a small label or pill right above the heading belongs to it: measure the space above the label instead
      const hfs = parseFloat(getComputedStyle(h).fontSize);
      if (above < 32 && prev.kind !== 'media' && label(prev.el).length < 40 && parseFloat(getComputedStyle(prev.el).fontSize) < hfs * 0.6) {
        const p2 = ink.filter(i => i.bottom <= prev.top + 1 && i.right > r.left && i.left < r.right && !h.contains(i.el) && !prev.el.contains(i.el) && !i.el.contains(prev.el)).pop();
        if (!p2) continue;
        above = r2(prev.top - p2.bottom);
      }
      const below = r2(next.top - b);
      if (below > above && below > 24) headingProximity.push({ ...where(h), spaceAbove: above, spaceBelow: below });
    }

    // ---- 5. Side-by-side columns with very different content heights (short column floats in empty space).
    const inkIn = el => { const r = el.getBoundingClientRect(), t = top(r), b = bot(r); const mine = ink.filter(i => (i.el !== el || i.kind === 'text') && el.contains(i.el) && i.bottom > t && i.top < b); if (!mine.length) return null; return { top: Math.max(t, Math.min(...mine.map(i => i.top))), bottom: Math.min(b, Math.max(...mine.map(i => i.bottom))) }; };
    const columns = [];
    for (const p of all) {
      if (!vis(p) || inFixed(p)) continue;
      const kids = [...p.children].filter(c => vis(c) && c.getBoundingClientRect().width >= 0.2 * p.getBoundingClientRect().width && c.getBoundingClientRect().height > 40);
      if (kids.length < 2 || kids.length > 3) continue;
      const rs = kids.map(k => k.getBoundingClientRect());
      const sideBySide = rs.every((a, i) => rs.every((b, j) => i === j || a.right <= b.left + 2 || b.right <= a.left + 2)) && rs.every(a => rs.every(b => Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 0.3 * Math.min(a.height, b.height)));
      if (!sideBySide) continue;
      const sameCards = kids.every(k => k.className === kids[0].className && k.tagName === kids[0].tagName) && kids.length > 2;
      if (sameCards) continue;
      const c = kids.map(k => ({ k, ink: inkIn(k) })).filter(x => x.ink);
      if (c.length < 2) continue;
      c.sort((a, b) => (a.ink.bottom - a.ink.top) - (b.ink.bottom - b.ink.top));
      const s = c[0], t = c[c.length - 1], sh = s.ink.bottom - s.ink.top, th = t.ink.bottom - t.ink.top;
      if (th - sh < Math.max(O.columnDiffPx, O.columnDiff * th)) continue;
      let sticky = false; for (const e of [s.k, ...s.k.querySelectorAll('*')]) if (getComputedStyle(e).position === 'sticky') { sticky = true; break; }
      const pcs = getComputedStyle(p), kcs = getComputedStyle(s.k);
      const emptyAbove = r2(s.ink.top - t.ink.top), emptyBelow = r2(t.ink.bottom - s.ink.bottom);
      const fits = sh + headerBottom + bottomBar + 32 <= H;
      // overflow hidden/auto/scroll on any ancestor stops position: sticky from sticking (overflow: clip doesn't)
      let blocker = null; for (let e = p; e && e !== document.body; e = e.parentElement) { const ecs = getComputedStyle(e); if (/hidden|auto|scroll/.test(ecs.overflowY + ' ' + ecs.overflowX)) { blocker = `${sel(e)} overflow ${ecs.overflowX}/${ecs.overflowY}`; break; } }
      columns.push({ row: where(p), short: where(s.k), tall: where(t.k), shortHeight: r2(sh), tallHeight: r2(th), emptyAbove, emptyBelow,
        align: kcs.alignSelf !== 'auto' ? kcs.alignSelf : pcs.alignItems, sticky, shortFitsScreen: fits, stickyBlockedBy: blocker,
        suggest: sticky ? 'already sticky: check top offset clears the header (' + r2(headerBottom) + 'px)' : fits ? 'sticky' + (blocker ? ' (change ' + blocker + ' to clip first)' : '') : 'align-start, then rebalance content' });
    }

    // ---- 6. Under-filled boxes: content uses little of the box (fixed/min heights, oversized padding).
    const underfilled = [];
    const groupsBy = new Map();
    for (const b of outer) if (b.kind === 'box') { const k = b.el.parentElement; if (!groupsBy.has(k)) groupsBy.set(k, []); groupsBy.get(k).push(b); }
    for (const [, set] of groupsBy) {
      const measured = set.map(b => ({ b, i: inkIn(b.el) })).filter(x => x.i && x.b.bottom - x.b.top > 80);
      if (!measured.length) continue;
      const fullest = measured.reduce((m, x) => (x.i.bottom - x.i.top) > (m.i.bottom - m.i.top) ? x : m);
      const h = fullest.b.bottom - fullest.b.top, ch = fullest.i.bottom - fullest.i.top;
      const insetTop = r2(fullest.i.top - fullest.b.top), insetBottom = r2(fullest.b.bottom - fullest.i.bottom);
      const fill = ch / h, cs = getComputedStyle(fullest.b.el);
      if ((fill < O.fillMin && h - ch > 96) || (fill < 0.85 && insetBottom > insetTop * 1.5 + 24)) // insets only matter when the box is actually under-filled (an image-topped card or a scroll table is fine)
        underfilled.push({ ...where(fullest.b.el), count: set.length, height: r2(h), contentHeight: r2(ch), fill: +fill.toFixed(2), insetTop, insetBottom, minHeight: cs.minHeight, height_css: cs.height, padding: cs.padding });
    }

    // ---- 7. Action rows: stranded between empty space, or far across the row from the text they belong to.
    const orphanActions = [], farActions = [];
    const seen = new Set();
    for (const el of all) {
      if (!vis(el) || inFixed(el) || !isButtonLike(el, getComputedStyle(el))) continue;
      let g = el; while (g.parentElement && g.parentElement !== document.body && [...g.parentElement.children].filter(vis).every(c => c === g || isButtonLike(c, getComputedStyle(c)) || !label(c) || [...c.querySelectorAll('a,button')].some(x => isButtonLike(x, getComputedStyle(x))))) { g = g.parentElement; if (g.getBoundingClientRect().height > 160) { g = el.parentElement; break; } }
      if (seen.has(g)) continue; seen.add(g);
      const r = g.getBoundingClientRect(), t = top(r), b = bot(r);
      const outside = ink.filter(i => !g.contains(i.el) && !i.el.contains(g));
      const besides = outside.some(i => i.bottom > t + 2 && i.top < b - 2); // text or boxes beside it in the same row
      const prev = outside.filter(i => i.bottom <= t + 1).reduce((m, i) => !m || i.bottom > m.bottom ? i : m, null);
      const next = outside.filter(i => i.top >= b - 1).reduce((m, i) => !m || i.top < m.top ? i : m, null);
      const ga = prev ? r2(t - prev.bottom) : null, gb = next ? r2(next.top - b) : null;
      if (!besides && ga !== null && gb !== null && ga > O.orphanGap && gb > O.orphanGap) orphanActions.push({ ...where(g), spaceAbove: ga, spaceBelow: gb, above: where(prev.el), below: where(next.el) });
      else if (!besides && ga !== null && ga > O.orphanGap && ga > 2.5 * (gb ?? 0)) orphanActions.push({ ...where(g), spaceAbove: ga, spaceBelow: gb, detachedFrom: where(prev.el) });
      // far: in a row with text to its left, separated by a wide empty stretch
      const row = g.parentElement; if (!row || row.closest('header,nav,footer,[role=banner],[role=navigation],[role=contentinfo]')) continue;
      const rr = row.getBoundingClientRect(); if (rr.width < 700 || inFixed(row) || top(rr) < Math.max(120, headerBottom + 8)) continue;
      const textSib = [...row.children].filter(c => c !== g && !c.contains(g) && vis(c) && label(c).length > 20 && c.getBoundingClientRect().right <= r.left + 2);
      for (const ts of textSib) {
        const tr = ts.getBoundingClientRect(), textRight = Math.max(...ink.filter(i => ts.contains(i.el) && i.kind === 'text').map(i => i.right), tr.left);
        const empty = r.left - textRight;
        if (empty > O.farShare * rr.width && empty > 240) farActions.push({ ...where(g), text: where(ts), emptyWidth: r2(empty), rowWidth: r2(rr.width) });
      }
    }

    // ---- 8. First screen: does the opening headline + lead + main action fit above the fold?
    const h1 = [...document.querySelectorAll('h1')].find(vis) || [...document.querySelectorAll('h2')].find(vis);
    let firstScreen = null;
    if (h1) {
      const hr = h1.getBoundingClientRect();
      let hero = h1; while (hero.parentElement && hero.parentElement !== document.body && hero.parentElement.tagName !== 'MAIN' && hero.getBoundingClientRect().height < H * 0.4) hero = hero.parentElement;
      const after = [...hero.querySelectorAll('a,button,[role=button]')].filter(e => vis(e) && isButtonLike(e, getComputedStyle(e)) && (h1.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING));
      const cta = after[0] || null;
      const lead = [...hero.querySelectorAll('p')].find(p => vis(p) && (h1.compareDocumentPosition(p) & Node.DOCUMENT_POSITION_FOLLOWING));
      const end = cta || lead || h1, er = end.getBoundingClientRect();
      const firstInk = ink.find(i => i.top >= headerBottom - 1);
      firstScreen = {
        headline: where(h1), headlineTop: r2(hr.top), mainAction: cta ? where(cta) : null, mainActionBottom: r2(er.bottom), viewportH: H, headerBottom: r2(headerBottom),
        bottomBar: r2(bottomBar), fits: er.bottom <= H - bottomBar - 8, overflowPx: Math.max(0, r2(er.bottom - (H - bottomBar - 8))),
        spaceAboveFirstContent: firstInk ? r2(firstInk.top - headerBottom) : null,
        headlineFontSize: getComputedStyle(h1).fontSize, heroHeight: r2(hero.getBoundingClientRect().height)
      };
    }
    const clipped = sections.filter(s => { const cs = getComputedStyle(s); return /hidden|clip/.test(cs.overflowY) && s.scrollHeight > s.clientHeight + 4; }) // vertical only: overflow-x: clip (marquees) hides nothing important.map(s => ({ ...where(s), contentHeight: s.scrollHeight, boxHeight: s.clientHeight }));

    // ---- 9. Section use: sparse sections, and narrow content on wide screens.
    const sparseSections = [], widthUse = [];
    for (const s of sections) {
      const r = s.getBoundingClientRect(), t = top(r), b = bot(r);
      const mine = merged.filter(m => m.bottom > t && m.top < b).map(m => [Math.max(m.top, t), Math.min(m.bottom, b)]);
      if (mine.length) {
        // content span = first to last content, minus internal gaps that are themselves oversized
        let span = mine[mine.length - 1][1] - mine[0][0];
        for (let i = 1; i < mine.length; i++) { const gh = mine[i][0] - mine[i - 1][1]; if (gh > limit) span -= gh; }
        const share = span / r.height;
        if (r.height > 240 && share < 0.5) sparseSections.push({ ...where(s), height: r2(r.height), contentShare: +share.toFixed(2), spaceAboveContent: r2(mine[0][0] - t), spaceBelowContent: r2(b - mine[mine.length - 1][1]) });
      }
      if (W >= 1600) {
        const xs = ink.filter(i => s.contains(i.el)); if (!xs.length) continue;
        const l = Math.min(...xs.map(i => i.left)), rr = Math.max(...xs.map(i => i.right));
        const share2 = (rr - l) / CW;
        if (share2 < O.wideShare) widthUse.push({ ...where(s), contentLeft: r2(l), contentRight: r2(rr), widthShare: +share2.toFixed(2), emptySides: r2(CW - (rr - l)) });
      }
    }

    return {
      viewport: W + 'x' + H, options: O, headerBottom: r2(headerBottom), bottomBar: r2(bottomBar), settled: !!document.getElementById('sdr-settle'), docHeight: docH, screens: +(docH / H).toFixed(1),
      normalSectionGap: r2(normalGap), gapLimit: r2(limit), gapCount: gaps.length,
      oversizedGaps, edgeIssues: edgeIssues.slice(0, 40), stackedBoxes: stacked.slice(0, 20), crampedText: crampedText.slice(0, 30), headingProximity: headingProximity.slice(0, 30),
      columns, underfilled: underfilled.slice(0, 30), orphanActions, farActions, firstScreen, clipped, sparseSections, widthUse,
      boundaries: lines.slice(0, 80).map(({ starts, ends, ...l }) => l)
    };
  };
  try { window.__sdr = Object.assign(window.__sdr || {}, { space: run }); } catch (e) { /* read-only window */ }
  return run();
})()
