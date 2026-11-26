# Scoring rubric

Read in the `score` pass. The checks themselves live in the pass files; this file maps them to categories, weights, grades and severity.

Score each category 0–4 (0 broken, 1 poor, 2 acceptable, 3 good, 4 excellent). Rules marked **(house)** in the pass files are starting thresholds, not published standards; the lens (`lenses.md`) and PROFILE.md may override them and shift weights by up to ±4 points each (total stays 100). WCAG minimums always apply. The report lists the weights used.

## Categories, default weights, and the passes that feed them

| # | Category | Weight | Passes |
|---|---|---|---|
| 1 | Audience & industry fit | 9 | hierarchy, lens |
| 2 | Hierarchy & main action | 11 | hierarchy, first-screen |
| 3 | Typography | 9 | typography |
| 4 | Color, contrast & harmony | 9 | color |
| 5 | Spacing, alignment & text rhythm | 6 | space-edges (text rhythm, proximity), details (alignment) |
| 6 | **Space use & composition** | 8 | space-gaps, space-edges (edge contact), space-columns, fill-width |
| 7 | Component sizing & proportion | 9 | fill-width (cards), responsive (targets) |
| 8 | Content type: text vs image | 7 | imagery |
| 9 | Responsive across resolutions | 9 | responsive, first-screen |
| 10 | Interaction & detail craft | 10 | states, details |
| 11 | Accessibility, design-facing | 6 | color, states, responsive |
| 12 | Consistency & design system | 3 | details, code |
| 13 | Copy & microcopy | 3 | copy |
| 14 | Motion | 1 | states |

**Space use & composition, how to score:** 4 = no empty bands, rhythm matches the site's own normal gap everywhere, columns balanced or sticky, first screen fits on short laptops; 3 = a few Medium gaps or one unbalanced row; 2 = empty bands on several pages or a shared wrapper doubling every gap; 1 = empty bands in the first screens of key pages or main actions pushed below the fold by space; 0 = pages that read as finished halfway down.

**Interaction & detail craft, how to score:** 4 = every component kind has every state, hover never shifts layout, icons consistent and aligned; 3 = gaps in one or two states or one icon inconsistency; 2 = missing hover or press on several kinds, mixed icon sets; 1 = no visible focus or broken hover on key controls; 0 = controls with no feedback at all.

## Scoring and grades
Points per category = score / 4 × weight; total out of 100. A ≥ 90, B ≥ 80, C ≥ 70, D ≥ 60, F below 60. **Any open Blocker caps the grade at C.**

## Severity
- **Blocker:** primary content or main action unreadable or unusable for the target audience: contrast failure on body or main action, content hidden at a common viewport (including a main action clipped or below the fold on a tool or checkout page), invisible focus, a core audience path with no way forward, missing viewport meta on phones.
- **High:** clearly hurts understanding, trust or conversion for most of the audience: wrong hierarchy, empty bands that read as the end of the page on key pages, the main action pushed below the fold on short laptops, a short column floating beside a tall one in the hero, decorative images pushing key info down, cramped cards, design that contradicts the audience (tiny grey text on a seniors' site).
- **Medium:** inconsistency or polish a design lead would want fixed before the next release (gaps over the rhythm, edge contacts, stranded actions, under-filled cards, missing hover or press states, icon misalignment).
- **Nit:** taste; optional.
