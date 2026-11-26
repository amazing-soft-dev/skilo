---
name: senior-design-review
description: Review a website you built (UI + code, any framework) like a senior designer, judged for its industry and audience. Space use (empty bands, gaps, edges, columns, first screen), hierarchy, type, color, imagery, hover and icon details, many resolutions. Scored fixes.
---

# Senior Design Review

Review a website the user built the way a senior designer or design lead runs a design crit: understand **who the site is for and what business it is in**, look at the rendered pages at many resolutions, read the code that produces them, judge what works **for that audience**, and return prioritized findings with **exact fixes in the project's own framework and styling system**, each pointing to the `file:line` that causes it.

Works for any web stack (React/Next, Vue/Nuxt, Svelte, Angular, Astro, Django, Rails, Laravel, PHP, WordPress, Hugo, plain HTML, Shopify). Never assume Tailwind or React.

This skill **judges**. Performance, SEO, security or deep accessibility audits → `/optimize-app`. Teardown or clone of someone else's site → `/website-audit-and-clone`.

## How this skill runs: micro-passes and a ledger

A review is many small passes, never one big look. Each pass checks **one thing** (empty space between sections, boxes touching section edges, the first screen, hover states…) across every page and viewport, using only its own evidence.

1. `node <skill>/scripts/ledger.mjs next --run <run>` names the next pass and its open cells (page × viewport).
2. Read **only** that pass's file in `references/passes/`. Don't read the others yet.
3. Get only that pass's evidence: `ledger.mjs extract --pass <name>` (Playwright/CDP runs), or the pass file's snippet (browser-tool runs).
4. Judge it, with screenshots where the pass file says so. Write `findings/<pass>.md` (write "No findings", with what was checked, if there are none).
5. `ledger.mjs mark --pass <name> --status done` for the cells you actually checked. If a cell can't be checked now, mark it `skipped` with a reason and keep going. Mark it `blocked` only after 2 attempts, or with `--permanent` when a retry can't help (no source code access, auth wall). Blocked cells end up under "Not checked".
6. Back to step 1. Stop only when `next` says nothing is open.

Before the report: `ledger.mjs verify` must say READY. If it doesn't, retry what it lists (skipped cells first). Then run the final check (Step 3 below). The ledger is the memory of the run: after a break or a context reset, `ledger.mjs status` shows exactly where to resume.

## Files in this skill

Paths are relative to this skill's folder. Read a file only when its pass comes up; run scripts rather than reading them.

| File | Use |
|---|---|
| `references/passes/*.md` | One small file per pass, read when `ledger next` names it |
| `references/lenses.md` | Lens pass: audience & industry lenses, weight shifts, **space thresholds per lens** |
| `references/frameworks.md` | Intake and capture: stack detection, run commands, viewports, breakpoints, element → source |
| `references/styling.md` | Code pass and every fix: tokens per styling system, code smells, fix translation |
| `references/rubric.md` | Score pass: the 14 categories, weights, grades, severity |
| `references/edge-cases.md` | When an unusual situation comes up |
| `scripts/ledger.mjs` | The pass ledger: init, next, extract, mark, verify, notchecked (`--help`) |
| `scripts/capture.mjs` | Batch screenshots + measurements with Playwright (`--help`) |
| `scripts/capture-cdp.mjs` | Same output without Playwright, driving installed Chrome/Edge over the DevTools protocol (Node ≥ 22) |
| `scripts/batch.js` | Browser-tool runs: measures many pages × viewports via same-origin iframes, in the background |
| `scripts/bundle.js` | settle + measure + space + batch in one paste for browser tools (rebuild with `node scripts/bundle.mjs`, which also prints the function lengths that verify a paste) |
| `scripts/settle.js` | Puts the page in its final visible state (scroll-reveal, entrance animations) before measuring |
| `scripts/measure.js` | Contrast, type sizes, cards, targets, fields, media |
| `scripts/space.js` | Space use: gaps, empty bands, edges, columns, fill, stranded actions, first-screen fit, and the CSS causing each (lens thresholds via `--opts`) |
| `scripts/locate.js` | Map an element to its React/Vue/Svelte/Angular/Astro source |
| `tests/fixture-space.html`, `tests/selftest.mjs` | A page with every space defect plus well-spaced controls, and a self-test that checks the scripts still find each one (`node tests/selftest.mjs`, needs Chrome/Edge) |

## Defaults (don't ask; write them in an Assumptions block)

| Decision | Default |
|---|---|
| Mode | **Review only**; no source changes. Fix mode only when the user says fix / apply / polish |
| Audience & industry | Inferred (lens pass). One question allowed only if it can't be inferred |
| Pages | Home, main landing pages, pricing, signup/login, main app screen, one per dynamic template, 404. Every route if 10 or fewer |
| Resolutions | Core viewports on every page; short-laptop (`fold`) and extended viewports on key pages; breakpoint edges (`frameworks.md`) |
| Themes | Light, and dark if supported |
| Output | `.design-review/` at the repo root; `.gitignore` always updated (see "Where files go") |

## Workflow

### Step 0: Set up the run
Create `.design-review/runs/<date>/` (see "Where files go"), choose pages and viewports, then:
`node <skill>/scripts/ledger.mjs init --run <run> --pages ... --viewports <core> --key-pages ... --key-viewports <fold + extended> [--themes light,dark]`
Create a task list mirroring the passes.

### Step 1: Passes, in ledger order
`intake` → `lens` → `capture` → `space-gaps` → `space-edges` → `space-columns` → `first-screen` → `fill-width` → `responsive` → `hierarchy` → `typography` → `color` → `imagery` → `states` → `details` → `copy` → `code` → `score` → `report`.
Follow the loop above. The order matters: space passes come early because empty space, cramped edges and a hidden first screen are what users notice first, and later passes (hierarchy, imagery) build on a layout that has already been judged.

Every finding, in every pass: ID by category, severity (Blocker / High / Medium / Nit, `rubric.md`), Confirmed or Inferred, page @ viewport @ theme, selector and `file:line`, which audience it affects, the rule, the **measured value**, the **cause** (which CSS makes it, e.g. `section.py-32 padding-bottom 128px + next section padding-top 128px`), an **exact fix in the project's system**, the **expected result** after the fix (the new measured value), and effort S/M/L. Group repeats across pages and viewports into one finding.

Before writing a fix, check that it fits:
- **Measure the room it needs.** "Keep it on one line", "make it bigger" or "add padding" must fit the available width or height at every tested viewport; if it only fits in some places, say where and give the alternative for the rest.
- **Check shared components everywhere they appear.** A header, banner, card, section wrapper or spacing token used on several pages needs a fix that works in all of them, or a named variant for the one that differs.
- **Removing space must not cram.** A gap fix lands on the page's normal rhythm (or the lens minimum), never below it; check the result against the `space-edges` rules.

### Step 2: Score and report
The `score` and `report` passes (their files say how).

### Step 3: Final check before answering (always)
1. `ledger.mjs verify` → READY. Not ready: retry the listed cells now (re-capture, re-run the snippet, take the missing screenshot). Only then block what truly can't be done.
2. Re-read the report against this list and fix what fails:
   - every finding has a measured value, a cause, an exact fix and an expected result;
   - every Blocker and High was seen in a screenshot (not only in numbers);
   - every page × viewport in the ledger appears in the resolution matrix;
   - "Not checked" lists every blocked cell (`ledger.mjs notchecked`) and every pass that had no evidence;
   - no fix makes another finding worse (a gap fix that creates an edge contact, a sticky column hidden under the header).
3. If anything failed, go back to that pass, then verify again.

In chat: grade (with the projection), the audience in one line, top 5 changes, the report path, whether `.gitignore` was updated, what wasn't checked, and an offer of fix mode.

### Step 4: Improve this skill
After the report, look back at the run: where the scripts or references failed, misled or were missing (a tool not installed, a false positive, a mangled argument, a rule the lens didn't cover, a calibration that felt wrong). Propose changes to this skill's files as a unified diff in chat, one short reason per change, and **wait for the user's approval before applying**. Never edit the skill folder without approval, and never put project details (names, URLs, findings) into the skill: write the general rule that would have caught it. After changing a script, run `node <skill>/tests/selftest.mjs` (every planted defect still found, the well-spaced controls still clean); when a real site showed a new pattern, add it to the fixture and a check to the self-test first.

## Fix mode

When the user says fix, apply or polish (all, by severity, or by IDs):
1. Blockers → High → Medium; Nits only if asked.
2. One finding per change, smallest change, in the project's framework and tokens (`styling.md`). Space fixes go to the spacing owner (the section wrapper, the token, the parent `gap`), not to one-off margins. One commit per finding if the user wants commits; never push.
3. **Ask first** before changing brand colors, fonts or logo; rewriting the meaning of copy; removing images, sections or content; restructuring navigation or layouts across many pages; adding dependencies or a UI library.
4. Re-capture the same pages, viewports and themes into `runs/<date>/after/`, re-measure, re-score, note regressions (re-run the space passes especially: removing space in one place often creates an edge contact or a cramped group elsewhere).
5. Run the project's lint, typecheck and tests if present. When each finding gets its own branch, run the tests on each branch alone, not only on all of them combined: a markup change can trip a guard test that counts elements or compares a snapshot (an animation inventory, a DOM or visual baseline), and that branch must carry the updated baseline itself.

## Scoped modes
- **"Review my changes" / PR:** `git diff` against the base branch → affected components/templates → the routes using them, plus global effects of token or theme changes. Init the ledger with just those pages.
- **One page or component:** same rules; check the component everywhere it's used.
- **Only one concern** ("just the spacing", "only hover states"): init the ledger as usual, then mark the other passes `blocked --permanent --reason "out of scope (user asked for X only)"`; the report says so.
- **Storybook / Histoire / Ladle:** also review components in isolation (all variants and states).
- **Design comp provided:** differences are findings unless the build is better; say why.

## Where files go

The skill lives in a skills folder (`~/.claude/skills/` for personal use, or a repo's `.claude/skills/` for a team). Never write outputs into any skills folder.

```
.design-review/
  PROFILE.md       # committed: audience lens, lens thresholds, brand decisions, overrides, accepted exceptions, score history (never secrets)
  runs/<date>/     # NOT committed
    ledger.json    # the pass ledger
    lens.json      # space thresholds used (capture --opts lens.json, or __SDR_BATCH.opts)
    measure/       # one JSON per page x viewport x theme
    screenshots/
    findings/      # one file per pass
    report.md
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

This is the only tracked file outside `.design-review/` that review mode changes; "report only" or "don't change code" still allows it, so say you added it. Not a git repo: skip this step and say so. The user doesn't want any files in the project ("don't touch the repo"), or the source isn't available to you: write to `~/.design-review/<project-name>/` (or the session's working folder), skip `.gitignore`, and say where.

## Common mistakes
- Looking at everything at once instead of one pass at a time; reporting before `ledger verify` is READY.
- Judging without an audience profile, or applying one audience's taste to another. "Generous for seniors" means bigger text, targets and spacing *inside* groups, not empty bands between them.
- Measuring before `settle`: scroll-reveal content still at opacity 0 looks like empty space.
- Browser-tool runs: navigating the measuring tab (it wipes the results), or reporting phone first-screen numbers from iframes without confirming them in mobile emulation.
- Opinions without a measured value, a cause and an exact fix.
- Fixes in Tailwind or React for a project that uses something else.
- Reviewing only one or two resolutions, or only tall ones: short laptops (1366×650 after browser bars) are where heroes overflow.
- Burying Blockers under Nits; "fixing" deliberate brand choices into generic defaults.
- Calling code-only judgments Confirmed.
- Reporting `overImage` or `overBackdrop` contrast flags as failures, or trusting an empty `cardSets` as "no cards".
- Skipping `.gitignore`, ignoring all of `.design-review/`, or writing outputs into a skills folder.
