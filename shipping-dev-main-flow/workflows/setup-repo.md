# Set up the flow in a repository

Use when the repo doesn't have the flow yet, or to port or repair it. All templates are tested files in
`<skill-dir>/assets/`. Copy them; don't retype them. Not on GitHub: [../hosts/](../hosts/gitlab.md).

## Checklist

```
- [ ] 1. Decisions made: stack(s), versioning on/off, review mode, token type
- [ ] 2. Templates copied into the repo
- [ ] 3. ci.yml placeholder steps replaced with the stack's steps
- [ ] 4. Release config written for the stack (or release automation removed)
- [ ] 5. dependabot.yml has the stack's ecosystems
- [ ] 6. Bootstrap: files on main, main is default, dev created, GH_TOKEN saved, settings set
- [ ] 7. Rulesets imported
- [ ] 8. check-setup.sh: all PASS
```

## Steps

### 1. Decide

Read from the repo first. Ask only what you can't read.

| Decision | Default |
| --- | --- |
| Stack(s), package paths | Detect from the files in SKILL.md's stack table |
| Versioning | On. Turn it off only if the user says so |
| Review mode | autonomous (see [secure-repo.md](secure-repo.md)) |
| Token | GitHub App; a fine-grained PAT is acceptable |

Importing rulesets blocks direct pushes to `main` and `dev` for everyone from then on. Confirm with the user
before steps 6–7 on a repo other people use.

### 2. Copy

```bash
mkdir -p .github
cp -R <skill-dir>/assets/github/workflows <skill-dir>/assets/github/rulesets <skill-dir>/assets/github/dependabot.yml .github/
cp <skill-dir>/assets/release-please/release-please-config.json <skill-dir>/assets/release-please/.release-please-manifest.json .
```

Keep workflow `name:` values and job names exactly: rulesets require the check `CI passed`, and the merge workflow
listens for the workflow `CI`. For guarded review mode, also copy `assets/github/CODEOWNERS` and replace `@OWNER`.

### 3. Fill CI

In `.github/workflows/ci.yml`, replace both `Replace with stack steps` placeholders with the steps from the stack
file: lint/type/test steps in `check`, build steps in `build`. Monorepo or several stacks: one job per package,
each listed in `ci-passed`'s `needs` and in its `Require every job to succeed` step. Run each command locally once.

### 4. Release config

From the stack file's "Versioning" section, set `release-type` and `extra-files` in
`release-please-config.json`, and set the manifest version (see [release.md](release.md) section 3). Lockfile
stacks (uv, Ruby gems): paste `assets/github/lockfile-refresh-job.yml` under `jobs:` in `release.yml` and fill in
its tool step. Versioning off: delete `release.yml`, both release-please files, and the `release-please--…` line
in `merge-passing-pr.yml`.

### 5. Dependabot

Replace the `npm` entry with one entry per stack ecosystem and manifest directory. Keep `github-actions`.
Every entry keeps `target-branch: dev`.

### 6. Bootstrap (admin; in this order, because rulesets block direct pushes)

1. Commit everything and push it to `main` before any ruleset exists.
2. Make `main` the default branch. GitHub closes issues only on merges into the default branch, and
   `workflow_run` only reads the default branch's workflow files.
3. `git push origin main:dev`.
4. Create the token ([secure-repo.md](secure-repo.md) section 1) and save it as the `GH_TOKEN` secret.
5. `gh api -X PATCH repos/OWNER/REPO -F allow_merge_commit=true -F delete_branch_on_merge=true`

### 7. Rulesets

```bash
for f in dev main tags; do gh api -X POST repos/OWNER/REPO/rulesets --input .github/rulesets/$f.json; done
```

To change one later: list the ids with `gh api repos/OWNER/REPO/rulesets`, then
`gh api -X PUT repos/OWNER/REPO/rulesets/<id> --input .github/rulesets/<file>.json`.
Keep `strict_required_status_checks_policy: false`: each release adds merge commits to both branches, and the strict
setting would block every PR. Never add `required_linear_history`. `integration_id: 15368` means only GitHub
Actions can satisfy `CI passed`.

### 8. Validate

`bash <skill-dir>/scripts/check-setup.sh OWNER/REPO` in the repo. Then run [verify-flow.md](verify-flow.md).

## Verify

`check-setup.sh` prints PASS for every line.

Reflow: each FAIL line names the step here (for example `→ setup-repo step 3`). Go back to it, fix, and re-run
the script. Repeat until there are no FAIL lines.
