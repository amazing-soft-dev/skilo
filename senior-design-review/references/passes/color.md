# Pass: color (contrast, field boundaries, harmony)

Scope: every page × theme (measurements from all viewports). Categories: Color, contrast & harmony; Accessibility.

## Evidence
- Capture runs: `node <skill>/scripts/ledger.mjs extract --run <run> --pass color --all`
- Browser-tool runs: `__sdrAll.filter(r => r.ok && r.viewport === '1440x900').map(r => ({ p: r.page, contrast: r.m.contrastIssues.filter(c => !c.overImage && !c.overBackdrop).map(c => [c.sel, c.text, c.ratio, c.need]), guess: r.m.contrastIssues.filter(c => c.overImage || c.overBackdrop).length, fields: r.m.fieldBoundaryIssues }))`, then the 390 viewport.

Read critically: `contrastIssues` lists computed failures (`ratio < need`) first, then two kinds where the ratio is a guess. `overBackdrop: true` = text on a see-through surface floating over other content (fixed, sticky or overlaid bar, backdrop-filter panel): its background was composed from the wrong layers. `overImage: true` (often 21:1) = text over an image or gradient, listed whatever its ratio. For both, sample the pixels behind the text in a zoomed screenshot before calling it a failure or a pass. `measure.js` measures in sRGB (wide-gamut colors may clip) and doesn't composite ancestor `opacity`.

## Rules
- **WCAG:** normal text ≥ 4.5:1; large text (≥ 24px, or ≥ 18.66px bold) ≥ 3:1; UI boundaries, icons, focus rings ≥ 3:1. No rounding up (4.47:1 fails). Seniors and healthcare lenses: aim 7:1 for body.
- **Form fields are UI boundaries:** on dark or low-contrast themes, a field's outline (or its fill against the page) is often the only thing that shows where it is, and hairline borders commonly fail 3:1 (`fieldBoundaryIssues`). Check placeholders and icons on the field's own surface too.
- Check every action color and accent against every surface it appears on, in both themes. Text over images or gradients: sample the lightest and darkest points behind it.
- **Harmony (house):** 1 primary hue + at most 1 accent + neutrals tinted toward the primary; brand/accent fill about 10% or less of a screen (gaming and creative lenses may go higher); saturated colors reserved for actions and status. Flag two saturated hues competing, muddy palettes, grey text on colored backgrounds (tint secondary text from the surface's hue instead).
- Palette fits the industry and audience (calm for insurance/finance/health; high energy acceptable for gaming). One color = one role; status colors not decorative; color never the only cue.
- Fixes give the token change and new ratio, e.g. "muted text #8A8A8A on #FFFFFF (3.45:1) → #6B6B6B (5.32:1)".

Write `findings/color.md`. Mark done.
