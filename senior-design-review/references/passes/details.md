# Pass: details (icons, surfaces, small craft)

Scope: every page, zoomed screenshots at one desktop and one phone width. Categories: Interaction & detail craft, Consistency. Small things, judged closely: zoom into button rows, nav, card headers, list bullets, footers.

## Evidence (browser tool, per page)
Icon audit: `[...document.querySelectorAll('svg, img[src$=".svg"], i[class*="icon"], [class*="icon"] > svg')].filter(i => { const r = i.getBoundingClientRect(); return r.width && r.width <= 48; }).map(i => { const r = i.getBoundingClientRect(), host = i.closest('a,button,li,p,span,div'), t = [...(host?.childNodes || [])].find(n => n.nodeType === 3 && n.textContent.trim()); let dy = null; if (t) { const rg = document.createRange(); rg.selectNodeContents(t); const tr = rg.getBoundingClientRect(); dy = Math.round((r.top + r.height / 2) - (tr.top + tr.height / 2)); } return [host?.tagName, Math.round(r.width) + 'x' + Math.round(r.height), getComputedStyle(i).strokeWidth || i.getAttribute('stroke-width'), getComputedStyle(i).color, dy]; })` → size, stroke width, color, vertical offset of the icon's center from its label's center.

## Rules
**Icons**
- One family (same stroke width, corner style, fill/outline style); a fixed size per context (inline ≈ text cap height to 1.25 em, buttons 16–20px, navigation 20–24px).
- Icon center within ±1px of its label's center (`dy`); the gap between icon and label the same in every button.
- Optical, not only geometric, centering: play triangles, arrows and asymmetric glyphs need a nudge.
- `currentColor` so icons follow text and hover colors; icons that carry meaning ≥ 3:1 contrast and have a label (visible, or `aria-label` on icon-only buttons); decorative icons `aria-hidden`.
- SVG icons from a library or authored set, not emoji or Unicode characters; never blurry raster icons.
- Directional icons flip in RTL.

**Surfaces**
- Nested rounded corners: outer radius = inner radius + padding (mismatched nested radii are the most common "feels off" detail).
- A small set of radii and shadows; shadows share one light direction and have offset + blur; no hard 0-blur offset shadows unless the brand is deliberately neo-brutalist.
- Image edges on similar backgrounds get a subtle 1px inset outline (black or white at ~10%).
- `text-wrap: balance` on headings, `tabular-nums` on changing numbers, no layout shift when fonts or images load.
- Browser surfaces themed: text selection (`::selection`), caret, scrollbars (`color-scheme`, `scrollbar-color`), `<meta name="theme-color">`, favicon and touch icon.

**Template tells** (`hierarchy` pass lists the page-level ones): an eyebrow label over every heading, identical icon-plus-heading-plus-text cards as the page structure, gradient text, glass blur as decoration, middle-dot meta strings everywhere.

Write `findings/details.md` (group by component kind; each finding with the zoomed evidence and the exact CSS/SVG fix). Mark done.
