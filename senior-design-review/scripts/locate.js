// senior-design-review: map a rendered element to its source component (dev builds).
// Evaluate once in the page to install, then call: __sdrLocate('css selector')
// Reads React, Vue 2/3, Svelte, Angular and Astro dev metadata; Vue and Svelte often give the file path.
(() => {
  window.__sdrLocate = s => {
    const el = document.querySelector(s);
    if (!el) return 'selector not found';
    const out = [], add = v => { if (v && !out.includes(v)) out.push(v); };
    for (let e = el; e && out.length < 6; e = e.parentElement) {
      const fk = Object.keys(e).find(k => k.startsWith('__reactFiber$'));
      if (fk) {
        for (let f = e[fk]; f && out.length < 6; f = f.return) {
          const t = f.type;
          const n = typeof t === 'function' ? (t.displayName || t.name) : t?.displayName || t?.render?.name;
          if (n) add('react:' + n);
        }
        break;
      }
      if (e.__vueParentComponent) {
        for (let c = e.__vueParentComponent; c && out.length < 6; c = c.parent) add('vue:' + (c.type.__file || c.type.__name || c.type.name || ''));
        break;
      }
      if (e.__vue__) { add('vue2:' + (e.__vue__.$options.__file || e.__vue__.$options.name)); break; }
      if (e.__svelte_meta) { add('svelte:' + e.__svelte_meta.loc.file + ':' + e.__svelte_meta.loc.line); break; }
      if (window.ng?.getComponent) { const c = window.ng.getComponent(e); if (c) { add('angular:' + c.constructor.name); break; } }
      const island = e.closest?.('astro-island');
      if (island) { add('astro:' + island.getAttribute('component-url')); break; }
    }
    return out.length ? out : 'no framework metadata: grep the visible text, ids or class names';
  };
  return 'ready: call __sdrLocate(selector)';
})()
