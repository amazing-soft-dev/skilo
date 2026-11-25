# Pass: lens (site, once)

Goal: decide who the site is for, and turn that into weights and **measurable thresholds** that every later pass uses.

1. Write the audience profile (template in `lenses.md`): industry and business goal, primary and secondary audiences, context of use, each audience's main path. Sources: the user, PROFILE.md, DESIGN.md/CLAUDE.md/README, site copy, analytics the user shares.
2. Pick and combine lenses (`lenses.md`). They change thresholds, weights and red flags but never lower WCAG minimums.
3. Write `runs/<date>/lens.json` from the "Space thresholds per lens" table in `lenses.md` (start from the defaults, apply each chosen lens's row; when two lenses disagree, take the stricter value for readability (bigger text and edge room) and the stricter value for dead space (smaller band share)). Save the same values in PROFILE.md.
4. Pass `lens.json` to every capture: `capture.mjs --opts runs/<date>/lens.json`, or `window.__SDR_BATCH.opts` in browser-tool runs.

Remember while judging: a lens that wants "more space" (older readers, luxury, editorial) means bigger type, line height, targets and room inside groups, never empty bands between groups. Empty bands hurt those audiences most (they read as the end of the page, and cost extra scrolling at high zoom).

Write `findings/lens.md` (the profile, lenses, weights used, thresholds). Mark `lens` done.
