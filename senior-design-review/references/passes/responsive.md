# Pass: responsive (overflow, targets, reflow)

Scope: every page × viewport. Category: Responsive across resolutions (+ Accessibility for targets). Goal: nothing breaks, scrolls sideways or becomes untouchable at any size.

## Evidence
- Capture runs: `node <skill>/scripts/ledger.mjs extract --run <run> --pass responsive`
- Browser-tool runs: `__sdrAll.filter(r => r.ok).map(r => ({ p: r.page, vp: r.viewport, overflow: r.m.horizontalOverflow, meta: r.m.viewportMeta, targets: r.m.smallTargets, ph: r.m.placeholderTruncated })).filter(x => x.overflow || !x.meta || x.targets.length || x.ph.length)`

## Rules
- **No horizontal scroll or clipping** at any viewport (`horizontalOverflow`), including breakpoint edges and 320px. Rows that switch to one line at a breakpoint usually overflow just above it, where the row has the least room: when a row has nowrap labels or fixed minimums, check 50–100px above that breakpoint as well as its edge. Find the culprit: `[...document.querySelectorAll('*')].filter(e => e.getBoundingClientRect().right > document.documentElement.clientWidth + 1)` (deepest first).
- **Viewport meta present** (`viewportMeta`: `width=device-width, initial-scale=1`; never `user-scalable=no` or `maximum-scale=1`). Missing = phones render a ~980px page shrunk: a Blocker on phones.
- **Phones:** usable navigation, main action reachable early, no hover-only information, landscape (844×390) still usable, fixed bottom bars don't cover content or the last row of the page (`padding-bottom` equal to the bar height on the body).
- **Large screens** (1920+, ultrawide): content constrained by max-width, no stretched lines or giant empty heroes; media sharp. Full-height heroes become a small island on very tall screens: the headline still scales and the next section is hinted at.
- **Embedded interactive content** (games, players, maps, editors, canvas, iframes) shrinks on phones: check text and control size inside it, and whether full screen or landscape is offered.
- **Zoom 200% and 320px reflow:** readable without scrolling in two directions.
- **Targets** (`smallTargets`): ≥ 24px, 44px on touch (seniors: 44–48px everywhere); inline text links exempt. Icon-only controls are usually sized to their icon: check the clickable box, not the glyph. A fix that raises touch targets keeps the 24px minimum at desktop widths too. Report shared header/footer controls once.
- **Placeholders and labels fit** at the smallest phone width (`placeholderTruncated`).

## Severity
Blocker: horizontal scroll or clipped main content on phones, missing viewport meta. High: targets under 24px on touch for primary controls, content under a fixed bar. Medium: overflow at one breakpoint edge, placeholder truncation.

Write `findings/responsive.md`. Mark the cells done.
