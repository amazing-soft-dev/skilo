// senior-design-review: page measurement. Evaluate in the page (browser tool or Playwright page.evaluate); returns JSON.
(() => {
  scrollTo(0, 0);
  const cv = document.createElement('canvas'); cv.width = cv.height = 1;
  const cx = cv.getContext('2d', { willReadFrequently: true });
  // Converts any CSS color (rgb, hsl, oklch, color-mix) to sRGB via canvas
  const rgba = c => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = 'rgba(0,0,0,0)'; cx.fillStyle = c; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255]; };
  const over = (t, b) => { const a = t[3] + b[3] * (1 - t[3]); if (!a) return [255, 255, 255, 0]; return [0, 1, 2].map(i => (t[i] * t[3] + b[i] * b[3] * (1 - t[3])) / a).concat(a); };
  const lum = ([r, g, b]) => { const f = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const ratio = (a, b) => { const [h, l] = [lum(a), lum(b)].sort((x, y) => y - x); return Math.floor(((h + 0.05) / (l + 0.05)) * 100) / 100; };
  // The background is composed from the element's ancestors. That is wrong for a see-through surface that
  // sits on top of other content (a fixed or sticky bar, an overlay, anything with a backdrop filter): what
  // shows through it is whatever is painted underneath, not its ancestors. A failure computed on such a
  // surface is marked overBackdrop: the ratio is a guess until the pixels are sampled in a screenshot.
  const lifted = cs => (cs.backdropFilter && cs.backdropFilter !== 'none') || ['fixed', 'sticky', 'absolute'].includes(cs.position);
  const bgOf = el => { const layers = []; let img = false, backdrop = false; for (let e = el; e; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.backgroundImage !== 'none') img = true; const c = rgba(cs.backgroundColor); if (c[3] > 0) { layers.push(c); if (c[3] >= 1) break; if (lifted(cs)) backdrop = true; } } let out = [255, 255, 255, 1]; for (let i = layers.length - 1; i >= 0; i--) out = over(layers[i], out); return { color: out, overImage: img, overBackdrop: backdrop }; };
  const vis = el => { const r = el.getBoundingClientRect(), cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity > 0; };
  const sel = el => el.id ? '#' + el.id : el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.') : '');
  const lhOf = cs => cs.lineHeight === 'normal' ? parseFloat(cs.fontSize) * 1.2 : parseFloat(cs.lineHeight);
  const all = [...document.body.querySelectorAll('*')].filter(e => !['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE'].includes(e.tagName) && vis(e));

  const contrast = [], sizes = {}, odd = new Set(), lines = [], groups = new Map(), media = [];
  for (const el of all) {
    const cs = getComputedStyle(el), r = el.getBoundingClientRect();
    ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'rowGap', 'columnGap'].forEach(k => { const v = parseFloat(cs[k]); if (v >= 2 && v % 2) odd.add(Math.round(v * 10) / 10 + 'px'); });
    if (cs.backgroundImage.includes('url(') && r.width * r.height > 2500) media.push({ sel: sel(el), src: 'css-background', w: Math.round(r.width), h: Math.round(r.height), aboveFold: r.top + scrollY < innerHeight });
    // Card-like box: a full border, a shadow, or a rounded filled box. Square framed cards count too.
    const framed = ['Top', 'Right', 'Bottom', 'Left'].every(s => parseFloat(cs['border' + s + 'Width']) > 0);
    if (r.width >= 64 && r.height >= 64 && r.width < innerWidth * 0.95 && (el.children.length >= 2 || el.textContent.trim().length > 40) && el.parentElement &&
        (framed || cs.boxShadow !== 'none' || (parseFloat(cs.borderTopLeftRadius) > 0 && rgba(cs.backgroundColor)[3] > 0))) {
      // Group by the nearest ancestor with several children, so cards wrapped one per <li> or cell still form a set.
      let p = el.parentElement; while (p.children.length === 1 && p.parentElement && p !== document.body) p = p.parentElement;
      if (!groups.has(p)) groups.set(p, []); groups.get(p).push(el);
    }
    const own = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join(' ').trim();
    if (!own) continue;
    const fs = parseFloat(cs.fontSize), fw = +cs.fontWeight;
    sizes[cs.fontSize] = (sizes[cs.fontSize] || 0) + 1;
    const bg = bgOf(el), fg = over(rgba(cs.color), bg.color), cr = ratio(fg, bg.color);
    const large = fs >= 24 || (fs >= 18.66 && fw >= 700), need = large ? 3 : 4.5;
    if (cr < need || bg.overImage) contrast.push({ sel: sel(el), text: own.slice(0, 60), fontSize: cs.fontSize, ratio: cr, need, overImage: bg.overImage, overBackdrop: bg.overBackdrop });
    const len = el.textContent.trim().length;
    if (len > 120) { const n = Math.max(1, Math.round(r.height / lhOf(cs))); lines.push({ sel: sel(el), charsPerLine: Math.round(len / n), fontSize: cs.fontSize, lineHeight: +(lhOf(cs) / fs).toFixed(2) }); }
  }

  const cardSets = [...groups].filter(([, els]) => els.length >= 2).map(([p, els]) => {
    const rs = els.map(e => e.getBoundingClientRect()), cs = getComputedStyle(els[0]);
    const rows = {}; rs.forEach(r => { const t = Math.round(r.top); rows[t] = (rows[t] || 0) + 1; });
    const ratios = els.flatMap(e => [...e.querySelectorAll('img,video')]).map(m => { const b = m.getBoundingClientRect(); return b.height ? +(b.width / b.height).toFixed(2) : null; }).filter(Boolean);
    const cpl = els.map(e => { let best = 0; e.querySelectorAll('*').forEach(t => { const s = t.textContent.trim(); if (!t.children.length && s.length > 40) { const st = getComputedStyle(t); best = Math.max(best, Math.round(s.length / Math.max(1, Math.round(t.getBoundingClientRect().height / lhOf(st))))); } }); return best; });
    return { parent: sel(p), count: els.length, perRow: Math.max(...Object.values(rows)), widths: [...new Set(rs.map(r => Math.round(r.width)))], heights: [...new Set(rs.map(r => Math.round(r.height)))], padding: cs.padding, radius: cs.borderRadius, shadow: cs.boxShadow, mediaRatios: [...new Set(ratios)], maxCharsPerLine: Math.max(...cpl), elementsInFirstCard: els[0].querySelectorAll('*').length };
  });

  const minT = innerWidth < 768 ? 44 : 24;
  const smallTargets = [...document.querySelectorAll('a,button,[role=button],input,select,textarea,summary')].filter(vis)
    .map(e => ({ e, r: e.getBoundingClientRect(), inline: e.tagName === 'A' && getComputedStyle(e).display === 'inline' }))
    .filter(({ r, inline }) => !inline && (r.width < minT || r.height < minT)).slice(0, 40)
    .map(({ e, r }) => ({ sel: sel(e), w: Math.round(r.width), h: Math.round(r.height) }));

  // Form fields: the outline or the fill must reach 3:1 against the surface around the field (WCAG 1.4.11).
  // When the input itself is bare, the box drawn by a wrapper up to two levels up is used.
  const fieldBoundaryIssues = [], placeholderTruncated = [];
  // An outline drawn as a ring: a box-shadow layer with no offset and no blur and at least 1px of spread
  // (utility-class rings and many UI kits outline fields this way instead of with a border).
  const rings = st => st.boxShadow === 'none' ? [] : st.boxShadow.split(/,(?![^(]*\))/).map(part => {
    const m = part.trim().match(/^(.+?)\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+(-?[\d.]+)px(?:\s+inset)?$/);
    return m && !+m[2] && !+m[3] && !+m[4] && +m[5] >= 1 ? rgba(m[1]) : null;
  }).filter(c => c && c[3] > 0);
  const drawn = st => ['Top', 'Right', 'Bottom', 'Left'].some(s => parseFloat(st['border' + s + 'Width']) > 0) || rgba(st.backgroundColor)[3] > 0 || rings(st).length > 0;
  for (const f of document.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=range]):not([type=submit]):not([type=button]),select,textarea')) {
    const fr = f.getBoundingClientRect();
    // Skip tiny, off-screen and aria-hidden fields (honeypots and other bot traps).
    if (!vis(f) || fr.width < 40 || fr.right <= 0 || fr.left >= innerWidth || f.closest('[aria-hidden="true"]')) continue;
    let box = f; for (let i = 0; i < 2 && !drawn(getComputedStyle(box)) && box.parentElement; i++) box = box.parentElement;
    const bs = getComputedStyle(box), around = bgOf(box.parentElement || box).color, fill = bgOf(box).color;
    const side = ['Top', 'Right', 'Bottom', 'Left'].reduce((a, s) => parseFloat(bs['border' + s + 'Width']) > parseFloat(bs['border' + a + 'Width']) ? s : a, 'Bottom');
    const borderR = parseFloat(bs['border' + side + 'Width']) > 0 ? ratio(over(rgba(bs['border' + side + 'Color']), around), around) : 0;
    const edge = Math.max(borderR, ...rings(bs).map(c => ratio(over(c, around), around)));
    const fillR = ratio(fill, around);
    if (Math.max(edge, fillR) < 3) fieldBoundaryIssues.push({ sel: sel(f), border: edge, fill: fillR, need: 3 });
    const ph = f.getAttribute('placeholder');
    if (ph && f.tagName === 'INPUT') {
      const fs2 = getComputedStyle(f); cx.font = `${fs2.fontStyle} ${fs2.fontWeight} ${fs2.fontSize} ${fs2.fontFamily}`;
      const w = cx.measureText(ph).width + (parseFloat(fs2.letterSpacing) || 0) * ph.length;
      const room = f.clientWidth - parseFloat(fs2.paddingLeft) - parseFloat(fs2.paddingRight);
      if (w > room + 1) placeholderTruncated.push({ sel: sel(f), placeholder: ph.slice(0, 60), textW: Math.round(w), room: Math.round(room) });
    }
  }

  for (const m of document.querySelectorAll('img,video,picture > img,svg,canvas')) {
    if (!vis(m)) continue;
    const r = m.getBoundingClientRect(); if (r.width * r.height < 2500) continue;
    const top = r.top + scrollY, shown = Math.max(0, Math.min(top + r.height, innerHeight) - Math.max(top, 0));
    media.push({ sel: sel(m), src: String(m.currentSrc || m.src || '').split('/').pop().slice(0, 60), alt: m.getAttribute('alt'), w: Math.round(r.width), h: Math.round(r.height), aboveFold: top < innerHeight, foldShare: +((shown * r.width) / (innerWidth * innerHeight)).toFixed(2), blurry: m.naturalWidth ? m.naturalWidth < r.width * devicePixelRatio * 0.9 : null });
  }

  return {
    viewport: innerWidth + 'x' + innerHeight,
    theme: document.documentElement.classList.contains('dark') || matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
    horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
    fontSizes: sizes, oddSpacing: [...odd],
    // Most certain first, so the "check in the screenshot" entries never push a computed failure past the cap.
    contrastIssues: contrast.sort((a, b) => (a.overImage ? 2 : a.overBackdrop ? 1 : 0) - (b.overImage ? 2 : b.overBackdrop ? 1 : 0)).slice(0, 80),
    lineLengthIssues: lines.filter(l => l.charsPerLine > 80 || l.charsPerLine < 35).slice(0, 40),
    cardSets, smallTargets, fieldBoundaryIssues: fieldBoundaryIssues.slice(0, 30), placeholderTruncated, media
  };
})()
