# Pass: space-gaps (empty bands, oversized gaps, sparse sections)

Scope: every page × viewport. Category: Space use & composition. Goal: no stretch of the page is empty without a reason, and the rhythm between sections is the site's own, not accidental.

## Evidence
- Capture runs: `node <skill>/scripts/ledger.mjs extract --run <run> --pass space-gaps`
- Browser-tool runs: `__sdrAll.filter(r => r.ok && r.m.space.oversizedGaps.length + r.m.space.sparseSections.length).map(r => ({ p: r.page, vp: r.viewport, normal: r.m.space.normalSectionGap, limit: r.m.space.gapLimit, gaps: r.m.space.oversizedGaps.map(g => [g.top, g.h, g.kind, g.ratioToNormal, g.screenShare, g.above.text, g.below.text, g.sources]), sparse: r.m.space.sparseSections.map(s => [s.sel, s.contentShare, s.spaceAboveContent, s.spaceBelowContent]) }))` (page by page if it is long)

Keys (`space.js`):
- `normalSectionGap`: the page's own rhythm at this viewport (median gap that crosses a section boundary). `gapLimit` = max(normal × `gapMultiplier`, `gapFloor`), both from the lens.
- `oversizedGaps[]`: full-width stretches with nothing to read. `kind`: `oversized` (over the limit), `empty-band` (taller than `bandShare` of the screen), `empty-band-hard` (taller than `bandHard`). `sources` lists the CSS that builds the gap.
- `sparseSections[]`: sections whose content spans less than half their height (a heading and a button inside 400px of padding).

## Rules
1. **Empty band (false floor).** A full-width stretch with nothing to read that is taller than a quarter of the screen makes people think the page has ended, and it costs a scroll for nothing. Older readers, low-vision users zooming in, and anyone on a short laptop feel this most.
2. **Inconsistent rhythm.** A gap well over the page's own section gap (ratio ≥ 1.5) reads as a mistake or as a break between unrelated pages.
3. **Doubled spacing** is the usual cause: section A's bottom padding + section B's top padding (+ a wrapper margin), each fine alone. `sources` shows the stack.
4. **Sparse section.** A section that is mostly padding (content share under 0.5) is a band in disguise: a heading-and-button strip, a lone quote, an intro line before a grid.
5. **Space that scales with the screen.** `vh`/`vw` paddings and `min-height: 100vh` blocks grow on tall and ultrawide screens and crush on short ones; compare the same gap across viewports.

## Judge in the screenshot
Crop the gap with a little content above and below (capture runs: full-page screenshot at `top − 100 … bottom + 100`; browser tool: resize to the viewport, open the page, scroll to `top`, screenshot). Then decide:
- Is something there the scripts can't read? A full-bleed photo, a chart drawn in canvas, an embed or map that didn't load in the capture? Then it isn't empty: check the embed loads, note it in "Not checked" if it didn't.
- Is the pause deliberate: a chapter change on a long story page, a luxury brand's breathing room? It must still stay under the lens limit and must not fall at the bottom of the first screen (where it looks like the end).
- A decorative background (gradient, pattern, blurred shapes) across the gap does not make it content.

## Exceptions
The gap before the footer may be up to the limit. A full-screen hero is allowed on landing pages if the first screen still shows the headline, the main action and a hint of what follows (`first-screen` pass).

## Fix, in this order
1. **One owner for section spacing.** Remove the doubled half: e.g. sections own only top padding and the last one adds bottom padding, or the parent uses `gap`/`flex-direction: column` with one token, or `section + section { padding-top: 0 }` where both pad. Name the token.
2. **Bring the gap to the page's normal rhythm** (state the number: "256px → 128px, the normal section gap at this viewport").
3. **Merge sparse sections** into a neighbor: a heading-and-button strip becomes the header row of the section it introduces; a lone CTA joins the content it acts on.
4. **Clamp screen-relative spacing:** `padding-block: clamp(48px, 8vh, 128px)`; for heroes see `first-screen`.
5. Never fix by shrinking below the lens minimum or by cramming groups together (`space-edges` rules still apply).

Translate each fix into the project's system (`styling.md`): Tailwind `py-32` → `pt-24 pb-0` or a shared `section-y` class; Bootstrap `py-5` utilities or `$spacer` multiples; MUI `sx={{ py }}`/theme spacing; CSS variables in vanilla CSS.

## Severity
- High: an empty band ≥ 40% of the screen, or any empty band inside the first two screens of a key page, or repeated on most pages (a shared wrapper).
- Medium: empty bands 25–40% of the screen, sparse sections, gaps ≥ 1.5× the normal rhythm.
- Nit: a single gap just over the limit on one viewport.

## Write
`findings/space-gaps.md`: one finding per cause (a shared wrapper is one finding with every page × viewport it affects), with measured gap, ratio to normal, screen share, `sources`, fix, expected result ("gap 256px → 128px; the 'Reviews' heading moves up 128px at 1366×650").
