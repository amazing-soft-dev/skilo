# Pass: intake (site, once)

Goal: know the stack, the routes and the intended design system before judging anything.

1. Read `.design-review/PROFILE.md` if it exists: audience lens, lens thresholds, accepted exceptions, overrides, last score.
2. Detect the framework, routes, styling system and UI libraries (`frameworks.md`, `styling.md`).
3. Inventory the intended design system from code: colors, type scale, **spacing scale and section spacing** (the class, token or component every section uses for its vertical padding; note it, most space findings trace back to it), radii, shadows, breakpoints, containers, fonts, sticky/fixed elements (header, bottom bars), motion libraries (scroll-reveal). Read design docs if present (DESIGN.md, a brand guide, `docs/audit/`) and record deliberate choices under "Brand decisions" in PROFILE.md so they aren't "fixed" later.
4. Set up `.design-review/` and `.gitignore` (SKILL.md → "Where files go").
5. Evidence level, stated in Assumptions: **rendered + code** (best), **rendered only** (no source: every `file:line` becomes a selector plus "Inferred"), **code + screenshots**, or **code only** (visual findings Inferred).

No source available: do steps 1 and 4 with what you have, write what is missing to `findings/intake.md`, mark this pass done and the `code` pass `blocked --permanent --reason "no source access"`.

Write `findings/intake.md` (stack, routes, tokens, section-spacing owner, sticky/fixed elements, evidence level). Mark `intake` done.
