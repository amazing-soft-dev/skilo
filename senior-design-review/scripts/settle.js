// senior-design-review: settle the page into its final visible state before measuring. Evaluate in the page; returns JSON.
// Scroll-reveal and entrance animations leave content at opacity 0 (or shifted) until it is scrolled into view, and
// scroll-driven animations (animation-timeline: view()) hide it again at the top of the page. Measured as-is, that
// content looks like empty space. This scrolls through the page, jumps every CSS animation and transition to its
// end state, and reveals in-flow content that a script still holds at opacity 0. What it had to force is reported:
// content that only appears through scripts is itself worth a look (motion, slow devices, failed scripts).
// Registers window.__sdr.settle (async) for scripts/batch.js.
(() => {
  const settle = async () => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const H = innerHeight;
    for (let y = 0; y < document.documentElement.scrollHeight; y += H / 2) { scrollTo(0, y); await sleep(60); }
    const st = document.createElement('style');
    st.id = 'sdr-settle';
    st.textContent = '*,*::before,*::after{animation-duration:1ms!important;animation-delay:0s!important;animation-iteration-count:1!important;animation-fill-mode:both!important;animation-timeline:auto!important;transition-duration:0s!important;transition-delay:0s!important;scroll-behavior:auto!important}';
    document.head.appendChild(st);
    scrollTo(0, 0);
    // Scripts can hide content again a moment after the scroll back to the top (observers fire late), so force in passes.
    // "Hidden" is opacity under 0.05, not exactly 0: JS animation libraries start from values like 0.001, and a hidden or
    // background tab pauses their animation frames, so they never get past it.
    const forced = [];
    for (let pass = 0; pass < 3; pass++) {
    await sleep(200);
    for (const el of document.body.querySelectorAll('*')) {
      const cs = getComputedStyle(el);
      // content = text or media (a fade-in wrapper around a hero image has no text but is just as visible to people)
      if (parseFloat(cs.opacity) >= 0.05 || !((el.innerText || '').trim().length >= 3 || el.matches('img,video,picture,canvas') || el.querySelector('img,video,picture,canvas'))) continue;
      // only in-flow content: absolutely positioned layers are usually slides, menus or tooltips that are hidden on purpose
      if (cs.position === 'absolute' || cs.position === 'fixed' || el.closest('[aria-hidden="true"],[hidden],[inert]')) continue;
      if (el.parentElement && parseFloat(getComputedStyle(el.parentElement).opacity) < 0.05) continue; // the outermost one is enough
      el.style.setProperty('opacity', '1', 'important');
      if (cs.transform !== 'none') el.style.setProperty('transform', 'none', 'important');
      if (forced.some(f => f.el === el)) continue;
      forced.push({ el, sel: el.id ? '#' + el.id : el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : ''), text: ((el.innerText || '').replace(/\s+/g, ' ').trim() || el.querySelector('img')?.alt || el.getAttribute?.('alt') || '[media]').slice(0, 40), top: Math.round(el.getBoundingClientRect().top + scrollY) });
    }
    }
    return { settled: true, forcedVisible: forced.length, forced: forced.slice(0, 20).map(({ el, ...f }) => f) };
  };
  try { window.__sdr = Object.assign(window.__sdr || {}, { settle }); } catch (e) { /* read-only window */ }
  return settle();
})()
