# Pass: space-columns (unequal columns, stranded actions, far actions)

Scope: every page × viewport (side-by-side layouts exist only on wider viewports; phones usually have no cells to judge here, which is fine: mark them done after checking the extract is empty). Category: Space use & composition. Goal: no column floats in empty space beside a taller one, and every action sits next to what it acts on.

## Evidence
- Capture runs: `node <skill>/scripts/ledger.mjs extract --run <run> --pass space-columns`
- Browser-tool runs: `__sdrAll.filter(r => r.ok).map(r => ({ p: r.page, vp: r.viewport, cols: r.m.space.columns.map(c => [c.short.text, c.shortHeight, c.tallHeight, c.emptyAbove, c.emptyBelow, c.align, c.sticky, c.shortFitsScreen, c.suggest]), orphan: r.m.space.orphanActions.map(o => [o.text, o.spaceAbove, o.spaceBelow]), far: r.m.space.farActions.map(f => [f.text, f.emptyWidth, f.rowWidth]) })).filter(x => x.cols.length + x.orphan.length + x.far.length)`

Keys (`space.js`):
- `columns[]`: rows of 2–3 side-by-side columns whose content heights differ by more than `columnDiffPx` and `columnDiff`. `emptyAbove`/`emptyBelow` = empty space beside the short column, `align` = how it is aligned, `sticky` = already sticky, `stickyBlockedBy` = an ancestor whose `overflow` would stop sticky from working, `shortFitsScreen` = the short column fits between the header and any bottom bar, `suggest` = the script's first choice.
- `orphanActions[]`: button rows with more than `orphanGap` of empty space above and below them, or far below the content they follow.
- `farActions[]`: buttons separated from their text by a wide empty stretch in the same row (more than `farShare` of the row and 240px).

## Rules
1. **Unequal columns.** A short column centered (or stretched) beside a much taller one leaves empty space above and below it, and as the reader scrolls past the tall column the short one disappears. Decide by measurement:
   - **Short column fits the screen → make it sticky.** It stays in view while the tall column scrolls past: `position: sticky; top: <header height + 16–24px>; align-self: start`. Stripe's product pages, Apple's compare pages and documentation tables of contents all work this way.
   - **It doesn't fit → align it to the top**, then rebalance: move part of the tall column below the row, split it into two rows, or put the short column's main action at the end of the tall one too.
   - Never `align-items: center` a short column against one taller than the screen.
2. **Sticky done right.** The row must be `align-items: start` (stretch makes the sticky child as tall as the row, so it never sticks); no ancestor may have `overflow: hidden/auto/scroll` (`overflow: clip` is fine); `top` clears the header measured in `first-screen` (`headerBottom`); turn it off where the columns stack (`static` below the breakpoint); check it doesn't slide under a bottom bar.
3. **Stranded actions.** A button row with large empty space above and below belongs to nothing. Put it directly after the content it acts on (24–32px), or into that block's footer.
4. **Far actions.** On wide rows, a filled button pushed to the far side of a heading block (`justify-content: space-between`) splits the reader's eye path. Put the action under the text, or at the end of the text line, inside the text column's width. A small, secondary "View all →" link at the right of a section header is an accepted index pattern: flag it only when the action is a primary (filled) button or the empty stretch is over ~400px.

## Judge in the screenshot
For each column finding, look at the row at the viewport where it was measured, then scroll halfway down the tall column (browser tool) or crop that part of the full-page shot: is the short column out of sight while the tall one continues? For stranded and far actions, check that the action really relates to the content above or beside it (a page-level "Print" row may belong to the whole article: then it goes at the article's end or top, still attached).

## Fix examples
- Sticky (vanilla CSS): `.row { align-items: start } .row > .intro { position: sticky; top: calc(var(--header-h) + 24px) } @media (max-width: 1023px) { .row > .intro { position: static } }`. Tailwind: `lg:sticky lg:top-28 self-start` on the short column, `items-start` on the row. Bootstrap: `position-sticky` + `style="top: …"` + `align-self-start`.
- Stranded row: move it inside the previous block, `margin-top: 32px`, and remove the wrapper's large margins.
- Far action: `flex-direction: column; align-items: flex-start` on the header row, or keep the row but cap it with the text column's max-width.

## Severity
- High: a hero or key section where the short column holds the page's main action and leaves ≥ 200px empty above or below it.
- Medium: other unequal columns, stranded action rows, far primary actions.
- Nit: far secondary links.

## Write
`findings/space-columns.md`: measured heights and empty space, the decision (sticky / top-align / rebalance) with the reason (fits the screen or not), the fix, and the expected result ("intro stays in view from y=… to the end of the card; 209px empty above and below → 0").
