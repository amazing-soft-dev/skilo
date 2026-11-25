# Pass: fill-width (under-filled boxes, card sizing, use of wide screens)

Scope: every page × viewport. Categories: Space use & composition, Component sizing & proportion. Goal: boxes are as big as their content needs, and wide screens are used where the content benefits.

## Evidence
- Capture runs: `node <skill>/scripts/ledger.mjs extract --run <run> --pass fill-width`
- Browser-tool runs: `__sdrAll.filter(r => r.ok).map(r => ({ p: r.page, vp: r.viewport, under: r.m.space.underfilled, wide: r.m.space.widthUse, cards: r.m.cardSets.map(c => [c.parent, c.count, c.perRow, c.widths, c.heights, c.padding, c.maxCharsPerLine]) })).filter(x => x.under.length + x.wide.length + x.cards.length)`

Keys: `space.underfilled[]` (for each set of sibling boxes, its fullest box: `fill` = content height / box height, `insetTop`/`insetBottom`, CSS `minHeight`, `height_css`, `padding`); `space.widthUse[]` (screens ≥ 1600px: sections whose content spans less than `wideShare` of the width); `cardSets[]` (from `measure.js`).

## Rules
1. **Under-filled boxes.** Even the fullest box of a set leaves a lot empty (content fills under ~55% and over 96px is empty, or the bottom inset is far bigger than the top). Usual causes: a `min-height`/fixed height, the grid stretching every card to the tallest neighbor, oversized padding, or content too short for a card at all.
2. **Should it be a box at all?** Two or three short lines with an icon read better as an icon + text row, a compact list or a 2×2 grid than as tall cards (especially four in a row with lots of air).
3. **Equal heights only when close.** One long card stretching a row is fine up to about 1.3× the others; beyond that, shorten the text, give the long one its own row, or let heights differ (`align-items: start`).
4. **Card sizing** (with `cardSets`): text wrapping under ~35 characters per line or titles over 2 lines → too narrow; lines over 75 characters or content under half the box → too wide; one width, padding, radius and media ratio per set; ≥ 280–320px for content cards (1 column phones, 2 tablets, 3 laptops, 4 only for small items); check in-between widths.
5. **Wide screens.** A narrow column with empty sides is right for reading text (≤ 75 characters). Grids, galleries, listings, dashboards, comparison tables and media should use more width at 1920+ (a wider container such as 1440–1600px, another column, or secondary content in the side space).

## Judge in the screenshot
Look at the box set: is the empty part deliberate (an image card whose photo fills it, a fixed-ratio tile in a gallery)? The script counts images inside the box as content; a background-image card is media and is skipped.

## Fix, in this order
1. Remove the `min-height`/fixed height, or let rows size to content (`align-items: start`, `grid-auto-rows: auto`).
2. Reduce padding to the component token; equalize top and bottom insets.
3. Change the layout: icon + text rows, a 2-column grid, or a list.
4. Wide screens: raise the container max-width for grids, add a column at `≥ 1600px`, keep prose at 65–75 characters.

## Severity
- Medium: a set of cards under ~55% filled on key pages; grids stuck at a narrow width on 1920+.
- High: when the under-filled set pushes key content below the first or second screen.
- Nit: single boxes.

## Write
`findings/fill-width.md` with fill ratios, insets, the CSS cause, the fix and the expected result ("feature cards 200px → 132px tall; the row ends 68px higher").
