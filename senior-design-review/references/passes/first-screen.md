# Pass: first-screen (does the opening fit, how much of it is wasted)

Scope: every page × viewport; the short-laptop (`fold`) viewports on key pages matter most. Category: Responsive (and Hierarchy & CTA for what the first screen says). Goal: on every screen people really use, the first screen shows what the page is, why it matters and the main action.

## Why short viewports
Device specs overstate height. Browser tabs, address and bookmark bars take ~110–140px, the OS taskbar more, and Windows' default 125% scaling turns a 1920×1080 laptop into 1536×~730 CSS pixels. Phones lose ~100–180px to browser bars. So test `fold`: 1280×620, 1366×650, 1440×700, 1536×730, 390×664, 360×640.

## Evidence
- Capture runs: `node <skill>/scripts/ledger.mjs extract --run <run> --pass first-screen`, plus the `*-fold.png` screenshots.
- Browser-tool runs (phone rows must be confirmed in mobile emulation, see `capture.md`): `__sdrAll.filter(r => r.ok).map(r => ({ p: r.page, vp: r.viewport, f: r.m.space.firstScreen, clipped: r.m.space.clipped }))`, then a screenshot at each failing viewport (resize the tab, open the page).

Keys (`space.js` → `firstScreen`): `headline`, `mainAction` (first filled/outlined button after the headline in the hero), `mainActionBottom`, `viewportH`, `headerBottom` (sticky/fixed header), `bottomBar` (fixed bar at the bottom, e.g. a mobile call bar or cookie banner), `fits`, `overflowPx`, `spaceAboveFirstContent`, `headlineFontSize`, `heroHeight`. `clipped[]`: sections that hide overflowing content.

## Rules
1. **Fit.** The headline, the line that explains it and the main action are fully visible above the fold (below the header, above any bottom bar) at every tested viewport. A main action cut at the bottom edge counts as not visible.
2. **Opening waste.** Space above the first content (header gap + breadcrumbs + pill/badge + padding) over ~15% of the screen on short laptops pushes everything down. Each small item stacked above the headline costs a line.
3. **Hint of more.** On landing pages the first screen should show the start of what follows (or a clear cue); a full-height hero with nothing below the fold line reads as a complete page.
4. **Clipped content.** A `100vh` section with `overflow: hidden` cuts its own content on short screens: a Blocker if the main action is cut.
5. **Lens:** for older audiences, never solve this by shrinking body or button text below the lens minimum. Cut space and decoration first.

## Fix, in this order (state the pixels each step saves)
1. **Reduce the stack above the headline:** smaller top padding on short screens; breadcrumbs and pill on one line, or the pill removed where the breadcrumb already says it.
2. **Height-aware spacing:** `@media (max-height: 760px) and (min-width: 1024px) { .hero { padding-block: 32px } }`, or `padding-block: clamp(24px, 6vh, 96px)`.
3. **Height-aware headline size** (desktop only, never below the lens heading minimum): `font-size: clamp(2.5rem, 1.5rem + 2.5vw + 1vh, 4rem)` instead of a fixed large size.
4. **Shorter hero media on short screens:** `max-height: 60vh; object-fit: cover`, or the image beside the text instead of above it.
5. **Move secondary items below:** a second button, trust badges, long lead paragraphs (keep one line visible).

## Severity
- Blocker: the main action of a tool, sign-up, booking or checkout page is not visible at a common viewport, or a clipped section hides it.
- High: the main action is below the fold at 1366×650 / 1536×730 or on a phone with browser bars, on a landing or key page.
- Medium: it fits only after removing the bottom bar; opening waste over 15%.

## Write
`findings/first-screen.md` with a table: page × viewport → fits / overflowPx / opening waste, then grouped findings with the fix and the expected result ("main action bottom 642px → 560px at 1366×650; visible with 82px to spare").
