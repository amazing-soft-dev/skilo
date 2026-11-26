# Hotfix

Use only when what's on `main` (production) is broken and can't wait for the next `dev` → `main` release.
Everything else goes through [start-work.md](start-work.md).

## Checklist

```
- [ ] 1. Issue exists, marked as a production incident
- [ ] 2. Branch hotfix/<issue>-<words> from fresh origin/main
- [ ] 3. Smallest fix, plus a test that fails without it
- [ ] 4. fix: commit (or revert:), pushed
- [ ] 5. PR into main auto-merged; issue closed
- [ ] 6. Patch release tagged
- [ ] 7. Back-merge PR main → dev merged
```

## Steps

1. **Issue:** `gh issue create --title "Hotfix: <symptom>" --label bug` (skip `--label` if the label doesn't
   exist).
2. **Branch:**
   ```bash
   git fetch origin
   git switch -c hotfix/31-restore-login origin/main
   ```
3. **Fix:** change only what restores service. Add a regression test. Leave refactors for a later `fix/` branch.
4. **Commit and push:** follow [commit.md](commit.md) steps 1–4 with a `fix:` subject. To undo a bad change
   instead, `git revert <sha>` gives a `revert:` subject. Then `git push -u origin HEAD`.
5. **Land:** the PR opens into `main` with `Closes #N` in its body. Watch it with [ship.md](ship.md) steps 2–4.
6. **Release:** a release PR opens with the patch version and merges itself. Check with
   `gh release list --limit 1`.
7. **Back-merge:** a `main` → `dev` PR opens and merges itself. If it conflicts, see
   [troubleshoot.md](troubleshoot.md) row 7.

If `dev` needs a different fix for the same bug (code has diverged), make it in a normal `fix/` branch after
the back-merge lands.

## Verify

- `gh pr list --head hotfix/<…> --state merged` shows the PR merged into `main`.
- `gh issue view <n> --json state` is `CLOSED`.
- `gh release list --limit 1` shows the new patch tag.
- `git fetch origin && git merge-base --is-ancestor origin/main origin/dev` succeeds (dev contains the fix).

Reflow: PR not merged → [fix-ci.md](fix-ci.md), then step 5. No release PR → [release.md](release.md) Verify.
Back-merge missing → [troubleshoot.md](troubleshoot.md) row 6.
