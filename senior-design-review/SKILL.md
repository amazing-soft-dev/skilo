---
name: senior-design-review
description: Review a website you built (UI + code, any framework) like a senior designer, judged for its industry and audience: color, hierarchy, sizing, text vs image, many resolutions. Scored fixes.
---

# Senior Design Review

Review a website the user built the way a senior designer or design lead runs a design crit: understand **who the site is for and what business it is in**, look at the rendered pages at many resolutions, read the code that produces them, judge what works **for that audience**, and return prioritized findings with **exact fixes in the project's own framework and styling system**, each pointing to the `file:line` that causes it.

Works for any web stack (React/Next, Vue/Nuxt, Svelte, Angular, Astro, Django, Rails, Laravel, PHP, WordPress, Hugo, plain HTML, Shopify). Never assume Tailwind or React.

This skill **judges**. Performance, SEO, security or deep accessibility audits → `/optimize-app`. Teardown or clone of someone else's site → `/website-audit-and-clone`.

## Files in this skill

Paths are relative to this skill's folder. Read a reference only at the step that needs it; run scripts rather than reading them.

| File | Use at |
|---|---|
| `references/lenses.md` | Step 1: audience & industry lenses, weight shifts |
| `references/frameworks.md` | Steps 0, 2, 3: stack detection, run commands, viewports, breakpoints, element → source |
| `references/styling.md` | Step 5 and every fix: tokens per styling system, code smells, fix translation |
| `references/rubric.md` | Step 6: the 13 scoring categories, grades, severity |
| `references/edge-cases.md` | When an unusual situation comes up |
| `scripts/capture.mjs` | Step 3: batch screenshots + measurements with Playwright (`--help`) |
| `scripts/capture-cdp.mjs` | Step 3: same output without Playwright, driving installed Chrome/Edge over the DevTools protocol (Node ≥ 22) |
| `scripts/measure.js` | Step 4: page measurements; evaluate in a browser tool when Playwright isn't used |
| `scripts/locate.js` | Step 4: map an element to its React/Vue/Svelte/Angular/Astro source |

## Defaults (don't ask; write them in an Assumptions block)

| Decision | Default |
|---|---|
| Mode | **Review only**; no source changes. Fix mode only when the user says fix / apply / polish |
| Audience & industry | Inferred (Step 1). One question allowed only if it can't be inferred |
| Pages | Home, main landing pages, pricing, signup/login, main app screen, one per dynamic template, 404. Every route if 10 or fewer |
| Resolutions | Core viewports on every page, extended on key pages, breakpoint edges (`frameworks.md`) |
| Themes | Light, and dark if supported |
| Output | `.design-review/` at the repo root; `.gitignore` always updated (see "Where files go") |

## Workflow

### Step 0: Intake
1. Read `.design-review/PROFILE.md` if it exists: audience lens, accepted exceptions, overrides, last score.
2. Detect the framework, routes, styling system and UI libraries (`frameworks.md`, `styling.md`).
3. Inventory the intended design system from code: colors, type scale, spacing, radii, shadows, breakpoints, containers, fonts. Read design docs if present (DESIGN.md, a brand guide, a template audit such as `docs/audit/`) and record deliberate choices under "Brand decisions" in PROFILE.md so they aren't "fixed" later.
4. Set up `.design-review/` and `.gitignore` (see "Where files go") before writing anything else.
5. Create a task list and `.design-review/runs/<date>/progress.md` so a long run can resume.

### Step 1: Audience & industry lens
Write the audience profile (template in `lenses.md`): industry and business goal, primary and secondary audiences, context of use, each audience's main path. Sources: the user, PROFILE.md, DESIGN.md/CLAUDE.md/README, site copy, analytics the user shares. Pick and combine lenses; they change thresholds, weights and red flags but never lower WCAG minimums. Record the lens in PROFILE.md.

### Step 2: Preflight
Choose the evidence level and state it: **rendered + code** (best), **code + screenshots**, or **code only** (visual findings Inferred). Get the site running or use the user's URL (`frameworks.md` → Run the site). Never invent secrets or use real users' credentials. Production builds can take minutes: start the build in the background and do the Step 5 code reading while it runs. If serving it needs a local run config (for example a `.claude/launch.json` entry), add it and say so in Assumptions.

### Step 3: Capture at many resolutions
- **Playwright available** (in the project or globally): run
  `node <skill>/scripts/capture.mjs --url <base> --pages /,/pricing --viewports core --themes light,dark --breakpoints <project breakpoints> --out .design-review/runs/<date>`
  then again with `--viewports extended` for key pages. It saves above-the-fold and full-page screenshots plus measurement JSON per page × viewport × theme, and `capture-summary.json`. Use `--dark-class` for class-based dark mode.
- **No Playwright package, but Chrome or Edge installed:** run `scripts/capture-cdp.mjs` with the same arguments (`--help` lists them). It writes the same files and needs no install.
- **Otherwise:** use the session's browser tool (load its skill first) at the same viewports, and evaluate `scripts/measure.js` per capture. Browser-tool screenshots aren't saved to disk, so the report cites measurements instead of image paths.
- **Windows Git Bash:** prefix the command with `MSYS_NO_PATHCONV=1`, or `--pages /` becomes `C:/Program Files/Git/`.
- In a browser tool, also capture what a batch run can't: hover and keyboard focus, menus, modals, accordions, form states (never submit to real endpoints), loading, error, 404, empty lists, 200% zoom, stress content (long titles, missing images, longest locale), at one phone and one desktop width.

### Step 4: Measure and map to source
Every color, size and spacing finding quotes a measured value from the measurement JSON. Read it critically:
- `contrastIssues` lists computed failures (`ratio < need`) first, then two kinds where the ratio is a guess. A failure marked `overBackdrop: true` is on a see-through surface that floats over other content (a fixed, sticky or overlaid bar, a backdrop-filter panel), so its background was composed from the wrong layers. Text over images (`overImage: true`, often 21:1) is listed whatever its ratio. For both, sample the pixels behind the text in the screenshot before calling it a failure or a pass.
- `cardSets` detects framed boxes (radius, border or shadow) that repeat as siblings. If cards are drawn another way and it comes back empty, measure card widths in a browser tool instead and say so in "Not checked".
- `smallTargets` repeats on every page for shared header/footer controls; report them once.
- `fieldBoundaryIssues` lists form fields whose outline (a border, or a ring drawn as a box-shadow) and fill both stay under 3:1 against the surface around them; `placeholderTruncated` lists placeholders wider than their field.
- Measurements are at rest and from the page's own DOM: hover, open menus and content inside canvas or frames need screenshots.

Map elements to code with `scripts/locate.js` in dev builds, or grep for visible text and class names (`frameworks.md` → Element → source).

### Step 5: Code review
Check the design-facing code smells in `styling.md` for the project's systems (raw values instead of tokens, variant sprawl, removed focus, image components, fonts, motion guards, fragile grids, missing states).

### Step 6: Judge
Score the 13 categories in `rubric.md` with the lens weights. Look at the screenshots, not just the numbers: hierarchy, harmony, imagery and audience fit need eyes.

### Step 7: Findings
Each finding: ID by category, severity (Blocker / High / Medium / Nit, defined in `rubric.md`), Confirmed or Inferred, page @ viewport @ theme, selector and `file:line`, which audience it affects, the rule and its source, an **exact fix in the project's system** ("Change X to Y because Z", with the new measured value), and effort S/M/L. Group repeats into one finding; name what works well.

Before writing a fix, check that it fits:
- **Measure the room it needs.** "Keep it on one line", "make it bigger" or "add padding" must fit the available width or height at every tested viewport; if it only fits in some places, say where and give the alternative for the rest.
- **Check shared components everywhere they appear.** A header, banner, card or button used on several pages or in several contexts (hero vs footer, desktop vs phone) needs a fix that works in all of them, or a named variant for the one that differs.
- **Give the expected result, not just the change:** the new measured value or position (for example where the primary action lands at 1366×768), so the fix can be verified.

### Step 8: Report
Write `.design-review/runs/<date>/report.md`:

```
# Design review: <site> (<date>)
Grade: B (82/100) · Projected after Blocker/High fixes: A (91) · Evidence: rendered + code (staging) · Stack: <framework> + <styling>
Audience: <primary> + <secondary> · Industry: <industry> · Lens: <lens names>
Pages: 6 · Viewports: 7 core + 8 extended + breakpoint edges · Themes: light/dark
Blockers 1 · High 4 · Medium 9 · Nits 6 · Accepted exceptions skipped: 2
.gitignore: `.design-review/runs/` already ignored | added

## Assumptions
## Audience profile
## Top 5 changes (highest impact first)
## Scores by category (weights used, vs last review)
## Findings
| ID | Sev | Category | Audience | Where (page @ viewport, file:line) | Evidence | Rule | Fix | Effort |
## Resolution matrix (page × viewport: pass / issue IDs)
## What works well
## Not checked (and why)
## Before/after (fix mode)
```

A low grade can come from the rubric's scale (2/4 "acceptable" earns 50% of a category), so when most categories are 2–3 say in one line under the grade what drives it and what the projected grade is.

In chat: grade (with the projection), the audience in one line, top 5 changes, the report path, whether `.gitignore` was updated, and an offer of fix mode.

### Step 9: Improve this skill
After the report, look back at the run: where the scripts or references failed, misled or were missing (a tool not installed, a false positive, a mangled argument, a rule the lens didn't cover, a calibration that felt wrong). Propose changes to this skill's files as a unified diff in chat, one short reason per change, and **wait for the user's approval before applying**. Never edit the skill folder without approval, and never put project details (names, URLs, findings) into the skill.

## Fix mode

When the user says fix, apply or polish (all, by severity, or by IDs):
1. Blockers → High → Medium; Nits only if asked.
2. One finding per change, smallest change, in the project's framework and tokens (`styling.md`). One commit per finding if the user wants commits; never push.
3. **Ask first** before changing brand colors, fonts or logo; rewriting the meaning of copy; removing images, sections or content; restructuring navigation or layouts across many pages; adding dependencies or a UI library.
4. Re-capture the same pages, viewports and themes into `runs/<date>/after/`, re-measure, re-score, note regressions.
5. Run the project's lint, typecheck and tests if present. When each finding gets its own branch, run the tests on each branch alone, not only on all of them combined: a markup change can trip a guard test that counts elements or compares a snapshot (an animation inventory, a DOM or visual baseline), and that branch must carry the updated baseline itself.

## Scoped modes
- **"Review my changes" / PR:** `git diff` against the base branch → affected components/templates → the routes using them, plus global effects of token or theme changes.
- **One page or component:** same rules; check the component everywhere it's used.
- **Storybook / Histoire / Ladle:** also review components in isolation (all variants and states).
- **Design comp provided:** differences are findings unless the build is better; say why.

## Where files go

The skill lives in a skills folder (`~/.claude/skills/` for personal use, or a repo's `.claude/skills/` for a team). Never write outputs into any skills folder.

```
.design-review/
  PROFILE.md     # committed: audience lens, brand decisions, overrides, accepted exceptions, score history (never secrets)
  runs/          # NOT committed: reports, screenshots, measurements
```

**`.gitignore` (required, every run)**, at the git repository root (`git rev-parse --show-toplevel`; in a monorepo, the repo root):
1. Create `.gitignore` if it doesn't exist.
2. If `git check-ignore -q .design-review/runs/x.png` fails, append:
   ```
   # senior-design-review outputs (screenshots, reports)
   .design-review/runs/
   ```
   Leave other lines untouched. Never ignore `.design-review/` as a whole: PROFILE.md stays committed.
3. If files under `runs/` are already tracked, tell the user and give `git rm -r --cached .design-review/runs`; don't run it unless asked.
4. Say in the report and in chat whether the line was already there or added.

This is the only tracked file outside `.design-review/` that review mode changes; "report only" or "don't change code" still allows it, so say you added it. Not a git repo: skip this step and say so. User doesn't want any files in the project ("don't touch the repo"): write to `~/.design-review/<project-name>/`, skip `.gitignore`, and say where.

## Common mistakes
- Judging without an audience profile, or applying one audience's taste to another.
- Opinions without a measured value or an exact fix.
- Fixes in Tailwind or React for a project that uses something else.
- Reviewing only one or two resolutions.
- Burying Blockers under Nits; "fixing" deliberate brand choices into generic defaults.
- Calling code-only judgments Confirmed.
- Reporting `overImage` or `overBackdrop` contrast flags as failures, or trusting an empty `cardSets` as "no cards".
- Skipping `.gitignore`, ignoring all of `.design-review/`, or writing outputs into a skills folder.
