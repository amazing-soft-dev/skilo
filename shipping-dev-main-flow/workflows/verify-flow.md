# Verify the flow end to end

Use after setup, after changing any flow file, or when the user asks whether the flow works. Configuration
alone proves nothing: run real changes through it.

## Checklist

```
- [ ] 1. check-setup.sh all PASS
- [ ] 2. Scenario A: docs change → dev → main, issue closed, no release
- [ ] 3. Scenario B: fix → main → release PR → tag → back-merge, trees equal, nothing left open
- [ ] 4. Scenario C: hotfix → main, issue closed → patch release → back-merge
- [ ] 5. Negative checks: bad subject blocked, chore/ gets no PR, direct push rejected, tag delete rejected
- [ ] 6. Results reported with PR numbers and tags
```

## Automated run (throwaway repo only)

`<skill-dir>/scripts/live-test/run-live-test.sh OWNER/REPO` runs steps 1–5 against a sample Python + uv project.
It **replaces `main` and `dev`** and asks the user to type the repo name first. It needs `git`, `gh`, `GH_TOKEN` in
the environment (admin on the repo, `workflow` scope) and the same token saved as the repo secret. It writes
`live-test-*.log` next to the script.

When the agent can't reach the user's token, give the user the script to run and analyze the log they send back.
Never ask them to paste the token.

## Manual run (a real repo)

Use the repo's own stack. Create one issue per scenario and use the micro-skills:

- **A:** `docs/<n>-verify-flow`, one-line doc change → [ship.md](ship.md). Expect: PR into dev merged, then
  dev → main merged with `Closes #n` in its body, issue closed, and no release PR within 2 minutes.
- **B:** `fix/<n>-…` with a `fix:` commit. Expect: release PR (version file + CHANGELOG), merged, tag created,
  back-merge PR merged, then `git diff --quiet origin/main origin/dev` succeeds and `gh pr list` is empty.
- **C:** [hotfix.md](hotfix.md). Expect everything in its Verify section.
- **Negatives:** a commit subject `Update stuff` fails `Branch and commit conventions` and stays unmerged. A
  `chore/<n>-x` push gets no PR within 90 seconds. `git push origin HEAD:dev` is rejected. Deleting a `v*` tag is
  rejected. Clean up the test PRs and branches afterwards.

## Verify

Every box above is ticked with a PR number, tag name or command output.

Reflow: map each failure to its fix:

| Failed | Go to |
| --- | --- |
| No PR opened | [troubleshoot.md](troubleshoot.md) row 1 |
| PR not merged | [troubleshoot.md](troubleshoot.md) rows 2–3 |
| Issue not closed | [troubleshoot.md](troubleshoot.md) row 4 |
| No release, or the wrong version | [release.md](release.md) Verify |
| Back-merge missing or loops | [troubleshoot.md](troubleshoot.md) rows 6–8 |
| Negative check passed when it should fail | [setup-repo.md](setup-repo.md) step 7 |

Fix, then re-run only the failed scenario, then the full list once more.
