# Pass: code (design-facing code smells, and mapping findings to source)

Scope: site, once. Categories: Consistency & design system (plus evidence for every other category). Needs the source; without it mark this pass `blocked --permanent --reason "no source access"` and keep every finding's location as a selector (Inferred).

1. Check the design-facing code smells in `styling.md` for the project's systems (raw values instead of tokens, variant sprawl, removed focus, image components, fonts, motion guards, fragile grids, missing states).
2. **Spacing ownership:** find where section spacing is defined (a section wrapper, a utility like `py-24`, a spacing token). Doubled spacing (each section padding top and bottom, plus wrapper margins) is the most common cause of `space-gaps` findings: record the file:line once and link every gap finding to it.
3. Anti-patterns to search for: `transition: all` / `transition-all`; `outline: none` / `outline-none` without a focus-visible replacement; `user-scalable=no` or `maximum-scale=1`; `<div onClick>` / `<span onClick>` instead of buttons; images without `width`/`height`; `min-height`/fixed `height` on text containers; `:hover` rules not inside `@media (hover: hover)`; `align-items: center` rows next to long content; `100vh` heroes with `overflow: hidden`.
4. Map every finding from earlier passes to `file:line`: `scripts/locate.js` in dev builds, or grep for visible text, ids and class names (`frameworks.md` → Element → source). Update the findings files.

Write `findings/code.md`. Mark done.
