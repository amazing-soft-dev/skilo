# Ship: push and land

Use after [commit.md](commit.md). The workflows open the PR and merge it. Your job is to push, watch and report.

## Checklist

```
- [ ] 1. Branch pushed
- [ ] 2. PR opened automatically (base dev; main for hotfix/)
- [ ] 3. CI passed is green on the PR's latest commit
- [ ] 4. PR merged by automation
- [ ] 5. Reported: issue, branch, PR link, CI result, where it stands
```

## Steps

### 1. Push

`git push -u origin HEAD`. GitLab: see [../hosts/gitlab.md](../hosts/gitlab.md) for the push options.

### 2. PR appears

`gh pr list --head "$(git branch --show-current)" --json number,url,baseRefName,isDraft`. Allow up to 2 minutes.
Don't create the PR yourself. Work in progress that mustn't merge yet: `gh pr ready <n> --undo` turns it into a
draft, which the merge workflow skips. `gh pr ready <n>` re-runs CI and lets it merge.

### 3. CI

`gh pr checks <n> --watch`. On a failure, follow [fix-ci.md](fix-ci.md), then come back to step 3.

### 4. Merge

`gh pr view <n> --json state,mergedAt,mergeCommit` should become `MERGED` within about a minute of green CI.
Everything after that is automatic:

- `dev` → `main` PR opens or updates, listing `Closes #N`, and merges when green.
- If there are `feat`/`fix`/`perf`/`revert` commits, a release PR follows (see [release.md](release.md)).
- A back-merge PR brings release commits into `dev`.

You don't have to wait for those unless the user asked for the change to reach `main` or be released.

### 5. Report

Give the issue, branch, PR URL, CI result, and where it stands: "on dev", "on main, release PR #N open", or
"released as vX.Y.Z".

## Verify

- `gh pr view <n> --json state,baseRefName` shows `MERGED` into the expected base.
- If the user asked for main or a release: the issue is `CLOSED` and `gh release list --limit 1` shows the tag.

Reflow:
- No PR after 2 minutes → [troubleshoot.md](troubleshoot.md) row 1, then step 2.
- Green but not merged → [troubleshoot.md](troubleshoot.md) row 3, then step 4.
- "Head moved" in the merge log means you pushed after CI started; wait for the new run (step 3).
- Behind or conflicting with `dev` → `git fetch origin && git merge origin/dev`, resolve, commit, then step 1.
  Use merge, not rebase, and never force-push a branch someone else works on.
