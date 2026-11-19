# Scoring rubric

Read at Step 6. Score each category 0–4 (0 broken, 1 poor, 2 acceptable, 3 good, 4 excellent). Rules marked **(house)** are starting thresholds, not published standards; the lens (`lenses.md`) and PROFILE.md may override them and shift weights by up to ±4 points each (total stays 100). WCAG minimums always apply. The report lists the weights used.

## Contents
1. Audience & industry fit (10)
2. Hierarchy & CTA (12)
3. Typography (10)
4. Color, contrast & harmony (10)
5. Spacing, alignment & grid (8)
6. Component sizing & proportion (10)
7. Content type: text vs image (8)
8. Responsive across resolutions (10)
9. Interaction states (8)
10. Accessibility, design-facing (6)
11. Consistency & design system (4)
12. Copy & microcopy (3)
13. Motion (1)
- Scoring and grades
- Severity

## 1. Audience & industry fit (10)
- Does the page speak to the audience in the profile: tone, imagery, density, type size, motion level?
- Does each audience's main path have a clear entry and CTA?
- Industry expectations from the lens met (trust cues for insurance, product art for games, docs for dev tools)?
- Any lens red flags?

## 2. Hierarchy & CTA (12)
- **2-second test** on the above-the-fold screenshot at 1440 and 390: what is seen first, second, third, and does that match the page's one job?
- **Content priority:** the largest, highest element carries the most important message, not a decorative image or vague slogan.
- One primary action per view; secondary actions visibly quieter.
- Emphasis through weight and color before size.

## 3. Typography (10)
- Body text ≥ 16px (≥ 18px seniors lens); inputs ≥ 16px on mobile.
- Body line height 1.5–1.7; headings 1.1–1.3.
- Body line length 45–75 characters; flag paragraphs above 85 or below 35 (`lineLengthIssues`).
- **(house)** At most ~7 distinct font sizes per page (`fontSizes`), 3 weights per family, 2 families; scale steps ~1.2–1.333.
- Distinct heading levels; no widows in headings; no long centered paragraphs; no all-caps blocks.

## 4. Color, contrast & harmony (10)
- **WCAG:** normal text ≥ 4.5:1; large text (≥ 24px, or ≥ 18.66px bold) ≥ 3:1; UI boundaries, icons, focus rings ≥ 3:1. No rounding up (4.47:1 fails). Seniors and healthcare lenses: aim 7:1 for body.
- Check every CTA and accent against every surface it appears on, in both themes. Text over images or gradients (`overImage: true`): sample the lightest and darkest points behind it.
- **Harmony (house):** 1 primary hue + at most 1 accent + neutrals tinted toward the primary; brand/accent fill about 10% or less of a screen (gaming and creative lenses may go higher); saturated colors reserved for actions and status. Flag two saturated hues competing, muddy palettes, grey text on colored backgrounds.
- Palette fits the industry and audience (calm for insurance/finance/health; high energy acceptable for gaming).
- One color = one role; status colors not decorative; color never the only cue.
- Fixes give the token change and new ratio, e.g. "muted text #8A8A8A on #FFFFFF (3.45:1) → #6B6B6B (5.32:1)".

## 5. Spacing, alignment & grid (8)
- Values from the project's spacing scale; `oddSpacing` lists suspects (13px, 17px) to compare with the scale.
- **(house)** Space between groups at least 1.5–2× the space inside a group.
- Shared edges and grid columns; flag 1–8px misalignments.
- Consistent section rhythm and container max-width.

## 6. Component sizing & proportion (10), cards especially
Use `cardSets` from the measurement at every viewport.
- **Too small:** text wraps under ~35 characters per line (`maxCharsPerLine`); titles truncate or wrap to 3+ lines; padding under 16px; content touches edges; **(house)** more than ~6–8 elements in a card under ~320px wide.
- **Too big:** lines over 75 characters; content fills less than about half the card; a single item stretched full width.
- **Consistency:** one width, padding, radius and media ratio per set (`widths`, `mediaRatios`); equal heights per row; aligned bottom CTAs.
- **Importance:** featured items visibly emphasized; flag equal boxes for unequal content.
- **(house)** Content cards need ~280–320px minimum: 1 column on phones, 2 on tablets, 3 on laptops, 4 only for small items (`perRow`). Check in-between widths where cards get squeezed. Seniors lens: larger cards, fewer per row.
- **Should they be cards?** Homogeneous scannable data often reads better as a list or table (engineers and B2B lenses especially).
- **Targets:** ≥ 24px, 44px on touch (seniors: 44–48px everywhere); inline text links exempt (`smallTargets`).

## 7. Content type: text vs image (8)
Classify every item in `media` as **informational** (shows the product, real people, a diagram, data, a result, a real place) or **decorative** (stock, abstract shapes, generic illustration).
- Decorative image in prime space (`aboveFold`, or **(house)** `foldShare` ≳ 0.25 / ~25%+ of a section) → replace with text that does the job (headline + proof points, short list, sourced stat) or an informational image.
- Long prose describing something visual (a UI, process, comparison, numbers) → screenshot, diagram, steps or table.
- Text baked into images → real text. Menus, prices and job details must be text, never images or PDFs.
- Text over images must meet contrast everywhere → scrim, overlay or move the text.
- The lens decides how much imagery is right: gaming, e-commerce, hospitality and portfolios need strong informational imagery; dev tools, insurance and B2B usually need less, and it must be real.
- Icons: one set, consistent stroke and size; icon-only buttons labeled. Quality: not blurry (`blurry`), not stretched, consistent crops.

## 8. Responsive across resolutions (10)
- No horizontal scroll or clipping at any tested viewport (`horizontalOverflow`), including breakpoint edges and 320px.
- Phones: usable navigation, CTA reachable early, no hover-only information, landscape still usable.
- Short laptops (1366×768): primary CTA and value statement visible without scrolling.
- Large screens (1920+, ultrawide): content constrained by max-width, no stretched lines or giant empty heroes; media sharp.
- Zoom 200% and 320px reflow: readable without two-direction scrolling.

## 9. Interaction states (8)
Hover, clear focus-visible (≥ 3:1), active, disabled, loading on every interactive element; empty, loading (skeleton matches final layout), error and long-list states for data; inline form validation tied to fields.

## 10. Accessibility, design-facing (6)
Contrast, visible focus, target size, headings in order, alt-text roles, never color-only, reduced motion, reflow. Deep audits go to `/optimize-app`.

## 11. Consistency & design system (4)
Same component looks and behaves the same everywhere; few variants; the system's tokens instead of literals.

## 12. Copy & microcopy (3)
Headline says what it is and for whom in the audience's words (plain for seniors and consumers, specific and technical for engineers); CTA verbs say what happens; consistent terms; no placeholders.

## 13. Motion (1; gaming and creative lenses may raise it)
Purposeful, UI transitions about 300ms or less, not on every element, reduced motion respected.

Also flag generic template tells (identical rounded cards with the same soft shadow everywhere, gradient washes, an all-caps eyebrow on every heading, a generic stock hero) unless the brief or PROFILE.md says the look is intentional.

## Scoring and grades
Points per category = score / 4 × weight; total out of 100. A ≥ 90, B ≥ 80, C ≥ 70, D ≥ 60, F below 60. **Any open Blocker caps the grade at C.**

## Severity
- **Blocker:** primary content or CTA unreadable or unusable for the target audience: contrast failure on body or CTA, content hidden at a common viewport, invisible focus, a core audience path with no way forward.
- **High:** clearly hurts understanding, trust or conversion for most of the audience: wrong hierarchy, decorative image pushing key info below the fold, cramped cards, design that contradicts the audience (tiny grey text on a seniors' site).
- **Medium:** inconsistency or polish a design lead would want fixed before the next release.
- **Nit:** taste; optional.
