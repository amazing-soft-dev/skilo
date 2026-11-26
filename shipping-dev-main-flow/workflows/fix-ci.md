# Fix CI

Use when `CI passed` is red on a flow PR. Find the root cause with evidence; never make checks weaker.

## Checklist

```
- [ ] 1. Failing job and log lines captured
- [ ] 2. Failure classified: code / conventions / infrastructure
- [ ] 3. Reproduced locally (code failures)
- [ ] 4. Root cause fixed and pushed to the same branch
- [ ] 5. CI passed is green on the new head
- [ ] 6. Attempt count ≤ 3; otherwise stopped and reported
```

## Steps

### 1. Evidence

```bash
gh pr checks <n>                      # which job failed
gh run view <run-id> --log-failed     # the failing lines
```

Keep the smallest log excerpt that shows the error.

### 2. Classify

| Class | Signs | Action |
| --- | --- | --- |
| Code / test | assertion, compile, lint or type error | steps 3–4 |
| Conventions | job "Branch and commit conventions" failed | fix the name or the message |
| Infrastructure | runner lost, network, rate limit, registry down, missing secret | don't change code; `gh run rerun <run-id> --failed` once |

Conventions fixes: wrong branch name → create the right one from the same commits, push it, and close the old PR
with `gh pr close <n> --delete-branch`. Bad subject on the last commit → `git commit --amend`, then
`git push --force-with-lease` (allowed only on your own feature branch).

### 3. Reproduce

Run the failing command from `ci.yml` locally with the same runtime version. If it passes locally, compare
versions, environment variables, OS and lockfile state before changing code.

### 4. Fix

Change the code or test that's wrong, not the check. Commit with a fitting type (`fix:`, `test:`, `build:`),
then push. The newer run replaces the older one.

### 5. Green

`gh pr checks <n> --watch` on the new head.

### 6. Stop rule

After three fix attempts on the same failure, or a second infrastructure failure, stop. Report the failing job,
the log excerpt, what you tried, and your best diagnosis. Ask how to proceed.

## Verify

- `gh pr checks <n>` shows `CI passed` as pass on the PR's current head SHA.
- The diff of your fix contains no skipped tests, disabled rules, or loosened thresholds.

Reflow: still red → step 1 with the new log (counts as an attempt). A weakened check in the diff → revert that
part, then step 4.

Next: [ship.md](ship.md) step 4.
