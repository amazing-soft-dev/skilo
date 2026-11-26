# Plan template

Fill this in and save it as `<IBW_DIR>/plan.md`. Then show it to the user in full and ask for approval.

Size the work sensibly, usually 2-8 issues. Each issue should be one coherent, reviewable unit that can be built and tested on its own from `dev`. Prefer issues that do not depend on each other. Where one truly needs another, make it a stacked branch and say so.

```markdown
# Plan: <task name>

## Goal
<one paragraph>

## Parent issue
<title of the tracking issue>

## Issues

### A. <title>
- Scope: <one line>
- Acceptance criteria:
  - <criterion>
- Depends on: none | <key>
- Branch: feature/<number>-<slug>   (number filled in once the issue exists)
- Base: dev | <dependency branch> (stacked)
- Commits, in order:
  1. feat(scope): <subject>
  2. test(scope): <subject>
- Files likely touched: <paths>
- Tests: <tests added or run>

### B. ...

## Trailers added to every commit
<the exact lines from .coauthors>

## Closing keywords
<"Refs #N" in every commit, because dev is not the default branch>
or
<"Closes #N" on each branch's last commit, because dev is the default branch>

## Run options
- Worktrees: on
- Parallel work on independent issues: off
- Label `issue-branch-workflow`: created if missing
```

In the approval question, mention that the user can turn parallel work on (it uses subagents when they are available).
