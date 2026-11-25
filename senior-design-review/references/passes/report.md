# Pass: report (site, once)

Write `runs/<date>/report.md`:

```
# Design review: <site> (<date>)
Grade: B (82/100) · Projected after Blocker/High fixes: A (91) · Evidence: rendered + code (staging) · Stack: <framework> + <styling>
Audience: <primary> + <secondary> · Industry: <industry> · Lens: <lens names> · Thresholds: lens.json
Pages: 6 · Viewports: 7 core + 6 short-laptop + 2 extended + breakpoint edges · Themes: light/dark
Blockers 1 · High 4 · Medium 9 · Nits 6 · Accepted exceptions skipped: 2
Ledger: 412 cells checked, 6 blocked (see Not checked)
.gitignore: `.design-review/runs/` already ignored | added

## Assumptions
## Audience profile
## Top 5 changes (highest impact first)
## Scores by category (weights used, vs last review)
## Space map (per page: normal section gap, empty bands, edge contacts, unequal columns, first-screen fit per viewport)
## Findings
| ID | Sev | Category | Audience | Where (page @ viewport, file:line) | Evidence (measured) | Cause | Rule | Fix | Expected result | Effort |
## State matrix (component kind × state)
## Resolution matrix (page × viewport: pass / issue IDs)
## What works well
## Not checked (and why)   ← `node <skill>/scripts/ledger.mjs notchecked --run <run>`
## Before/after (fix mode)
```

A low grade can come from the rubric's scale (2/4 "acceptable" earns 50% of a category), so when most categories are 2–3 say in one line under the grade what drives it and what the projected grade is.

Then mark `report` done, run `ledger.mjs verify`, and do SKILL.md Step 3 (final check) before answering.
