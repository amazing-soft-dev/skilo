# Troubleshoot the automation

Use when a PR didn't open, didn't merge, an issue didn't close, or releases misbehave. Read the run log before
changing anything.

## Checklist

```
- [ ] 1. Symptom matched to a row below
- [ ] 2. Cause confirmed from a run log or API output
- [ ] 3. Fix applied
- [ ] 4. The original micro-skill's step re-run and verified
```

## Read the evidence

```bash
gh run list --limit 10                       # recent runs of every workflow
gh run view <id> --log                       # full log; --log-failed for failures only
gh pr view <n> --json state,isDraft,baseRefName,headRefName,mergeStateStatus
gh api repos/OWNER/REPO/rulesets             # what's enforced
```

## Symptoms

| # | Symptom | Likely cause | Fix |
| --- | --- | --- | --- |
| 1 | No PR after pushing a branch | prefix not allowed; no commits beyond the base; `GH_TOKEN` secret missing or expired | Read the "Open pull request" run; rename the branch or renew the secret |
| 2 | PR open, CI never ran | the PR was opened with `GITHUB_TOKEN` | the secret must be a PAT or App token ([secure-repo.md](secure-repo.md)) |
| 3 | CI green, not merged | draft PR; review required; head moved; merge workflow not on the default branch | Read the "Merge passing pull request" run; `gh pr ready`, approve, or push the workflow to main |
| 4 | Issue didn't close | default branch isn't `main`; no `<prefix>/<n>-` branch name or `Closes #n`; it only reached `dev` | fix the default branch, or add `Closes #n` in a commit; wait for `main` |
| 5 | No release PR after a `fix`/`feat` reached main | `GH_TOKEN` lacks rights; config `release-type` wrong; only hidden commit types | Read the "Release" run; check [release.md](release.md) sections 1 and 3 |
| 6 | No back-merge after a release or hotfix | the "Open pull request" run on `main` failed, or trees are already equal | Read that run; equal trees mean nothing is needed |
| 7 | Back-merge PR conflicts | someone edited a version file or CHANGELOG on `dev` | branch `fix/<n>-resolve-back-merge` from `dev`, `git merge origin/main`, resolve, push |
| 8 | Release PRs keep reopening | Maven snapshot PRs, or a changed workflow compares commit counts instead of trees | `"skip-snapshot": true`; restore `open-pull-request.yml` from assets |
| 9 | `dev` → `main` PR says "behind" | strict status-check policy is on | set `strict_required_status_checks_policy` to false and re-import ([setup-repo.md](setup-repo.md) step 7) |
| 10 | Release PR CI fails on the lockfile | the lockfile stores the project version | add `assets/github/lockfile-refresh-job.yml` ([setup-repo.md](setup-repo.md) step 4) |
| 11 | Pushes to `.github/workflows/` rejected | token lacks the `workflow` permission | update the token's permissions |
| 12 | A workflow change has no effect | `merge-passing-pr.yml` changes apply only after they reach `main` | ship the change through to `main` |

## Verify

The micro-skill that sent you here passes its own Verify section.

Reflow: still failing → step 2 with the newest run log. Two rounds without progress → report the log excerpt and
your diagnosis to the user and stop.
