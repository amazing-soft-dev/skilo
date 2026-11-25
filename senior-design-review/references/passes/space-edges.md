# Pass: space-edges (contact with section edges, uneven bands, cramped text, heading proximity)

Scope: every page × viewport. Category: Space use & composition (spacing & alignment for text rhythm). Goal: everything that has an edge has room around it, and spacing says what belongs together.

## Evidence
- Capture runs: `node <skill>/scripts/ledger.mjs extract --run <run> --pass space-edges`
- Browser-tool runs: `__sdrAll.filter(r => r.ok).map(r => ({ p: r.page, vp: r.viewport, edges: r.m.space.edgeIssues.map(e => [e.sel, e.text, e.gapToBoundaryAbove, e.gapToBoundaryBelow, e.touching, e.uneven, e.cause]), stacked: r.m.space.stackedBoxes, cramped: r.m.space.crampedText.map(c => [c.text, c.gap, c.need]), headings: r.m.space.headingProximity.map(h => [h.text, h.spaceAbove, h.spaceBelow]) })).filter(x => x.edges.length + x.stacked.length + x.cramped.length + x.headings.length)`

Keys (`space.js`):
- `edgeIssues[]`: a box, card, callout or image closer than `edgeMin` (lens) to a background boundary (where a section's color changes), or the only content of a band with very different space above and below (`uneven`). `cause` names the band and its padding, and a margin collapsing through the band.
- `stackedBoxes[]`: two separate boxes stacked with under 8px between them.
- `crampedText[]`: consecutive paragraphs with less than `paraMinEm` of the font size between them.
- `headingProximity[]`: headings with more space below them than above (they float toward the previous block). A small label or pill right above a heading counts as part of the heading (the space is measured above the label), and a heading with content beside it (two-column intro) is skipped.

## Rules
1. **Room at section edges.** A box or image needs at least `edgeMin` between it and any background change. Zero means it touches: the eye reads the box as part of the next section, or as cut off.
2. **Even space in a band.** When a box is the only content of a band, the space above and below it should match (within about 25%, or 32px).
3. **Margin collapse is the classic cause.** A child's margin passes through a parent that has no padding, border or `display: flow-root`, so the space lands outside the colored band and the child touches the band edge. `cause` says so when it detects it.
4. **Paragraphs need space or an indent.** At least 0.5em between paragraphs (lens: seniors 0.75em), or a first-line indent. Bold or larger paragraphs that act as labels are excluded by the script.
5. **Proximity.** Space above a heading is at least the space below it; a heading belongs to what follows. The same goes for a caption and its image, a label and its field, a button and the text it acts on.
6. **Stacked boxes** need a visible gap (at least 8px, usually the component gap token) unless they are deliberately joined (a segmented list with shared borders).

## Judge in the screenshot
Zoom into each flagged edge (capture: crop ±80px around it; browser tool: `zoom` on the region). Confirm:
- Is the box deliberately straddling two sections (an overlapping card with a shadow, half on each color)? Then the script measured a negative distance and skipped it; if it was flagged, it is touching, not overlapping.
- Is the image meant to run edge to edge in its band (flush top and bottom)? The script skips that case; one flush edge and one padded edge is a slip.
- Does the boundary actually look like a boundary (two visibly different colors)? Bands with background images or gradients are marked `approx`.

## Fix, in this order
1. **Give the band padding** on the touching side, using the section spacing token (state it: "padding-bottom 0 → 24px").
2. **Stop the collapse:** `display: flow-root` on the band, or move the child's margin to the band's padding.
3. **Even a sole box:** equal `padding-block` on its band.
4. **Text rhythm:** `p + p { margin-top: 0.75em }` (or the project's prose class / `space-y` utility / stack component), and a heading rule `margin-top ≥ margin-bottom` (e.g. `h2 { margin: 2em 0 0.5em }`).
5. **Stacked boxes:** the parent's `gap` with the component spacing token.

## Severity
- High: a callout or disclaimer touching an edge on a key page (it reads as broken or cut off), or paragraphs with no space at all in body copy.
- Medium: edge contact elsewhere, uneven sole-box bands, headings closer to the previous block.
- Nit: a single 1–8px shortfall against the lens minimum.

## Write
`findings/space-edges.md` with measured distances, the cause, the fix and the expected value ("disclaimer bottom gap 0 → 24px, same as its top").
