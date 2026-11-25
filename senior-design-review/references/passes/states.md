# Pass: states (hover, focus, press, disabled, loading, empty, error, motion)

Scope: every page, at one desktop width (hover, keyboard) and one phone width (touch). Categories: Interaction & detail craft, Accessibility, Motion. Needs a browser tool; a batch capture can't hover or tab. Without one: judge from code (Inferred) and say so.

## How to check (browser tool)
1. Build an inventory of interactive components on the page, one of each kind: primary/secondary/ghost button, text link, nav item, card link, icon button, tab, chip, accordion, input, select, checkbox. `[...document.querySelectorAll('a,button,[role=button],input,select,textarea,summary,[tabindex]')].map(e => e.tagName + '.' + (e.className || '').toString().split(' ').slice(0, 3).join('.')).filter((v, i, a) => a.indexOf(v) === i)`
2. For each kind: screenshot (zoom) at rest → hover (the tool's hover action) → zoom again; Tab to it → zoom; mouse down if the tool can. Compare.
3. Stylesheet scan for hover rules not guarded for touch: `[...document.styleSheets].flatMap(s => { try { return [...s.cssRules] } catch { return [] } }).filter(r => r.selectorText?.includes(':hover') && !r.parentRule?.conditionText?.includes('hover')).length` (high counts mean sticky hover on touch devices; Tailwind v4 guards by default, v3 doesn't).
4. Utility-class projects (Tailwind, UnoCSS…): one scan finds every interactive element without hover or focus utilities across pages: load each page in an iframe and list `a,button,[role=button],input,select,summary` whose `className` has no `hover:` / `group-hover` / `focus-visible:` (group by kind: filled, outlined, text link, icon button, nav, footer). Check a global `:focus-visible` rule before calling missing focus classes a finding. Count `transition: all` only where `transition-duration` is non-zero: `all` is the browser default for every element.
5. `settle.forced` from the measurements: content revealed only by scripts. Check it appears promptly when scrolled into view, and with `prefers-reduced-motion: reduce` (DevTools rendering emulation or the OS setting).

## Rules
- **Every interactive element has hover** (pointer devices), **focus-visible** (≥ 3:1 against both the element and the page, offset so it isn't clipped by `overflow: hidden` parents or hidden under a sticky header), **active/press** (slightly darker or `scale(0.97–0.98)`, ~100ms), **disabled** (distinguishable, not invisible, `cursor: not-allowed` or default), **loading** (spinner replaces or joins the label without changing the button's width).
- **Hover increases emphasis**: hover/active/focus more prominent than rest, never a contrast drop.
- **Hover never shifts layout**: no border-width, font-weight or padding change that moves text or neighbors; use color, background, shadow, outline or transform.
- **Hover motion stays under the pointer**: an element that moves itself slides out from under a pointer at its edge and flickers; let a child carry the motion (`.card:hover .card-surface { transform: translateY(-2px) }`).
- **Touch:** hover styles inside `@media (hover: hover) and (pointer: fine)`, so taps don't leave elements stuck in hover; nothing important only on hover.
- **Whole-card links** show hover across the whole card and the whole card is clickable (stretched link), not just its title.
- **`cursor: pointer`** on clickable non-link elements (cards, custom buttons).
- **Transitions:** list properties (never `transition: all`), 100–200ms for hover and press, ≤ 300ms for UI changes, one easing family; `prefers-reduced-motion` respected; no entrance animation on every section.
- **Data states:** empty, loading (skeleton matches the final layout), error with a way forward, long lists; inline form validation tied to fields; submit stays enabled until the request starts.
- Seniors lens: focus rings at least 2px and clearly visible, hover never the only cue, no auto-advancing carousels; a moving list has a visible pause control.

Write `findings/states.md` with a **state matrix** (component kind × rest/hover/focus/active/disabled/loading: ✓ or finding ID). Mark done.
