# Release and versioning

Use for anything about version numbers, release PRs, tags, CHANGELOG, reverting a shipped change, or backports.
release-please does the work on every push to `main`. Never bump a version by hand.

## Contents

1. How versions move · 2. What happens on main · 3. Configure (setup mode) · 4. Force a version, pre-releases ·
5. Revert a change that already shipped · 6. Backports to an older major version · Verify

## Checklist

```
- [ ] 1. Task identified: explain versions / follow a release / configure / force / revert / backport
- [ ] 2. Matching section (1–6) followed in order
- [ ] 3. Verify passes
```

## 1. How versions move

From Conventional Commit types since the last release (checked against release-please 17's code):

| Commits since the last release | Before 1.0.0 (`bump-minor-pre-major`) | From 1.0.0 |
| --- | --- | --- |
| only `docs` `chore` `ci` `build` `test` `refactor` `style` | no release | no release |
| at least one `fix`, `perf` or `revert` | patch | patch |
| at least one `feat` | minor | minor |
| `!` or a `BREAKING CHANGE:` footer | minor | major |
| `Release-As: X.Y.Z` footer on a `feat`/`fix` commit | exactly X.Y.Z | exactly X.Y.Z |

## 2. What happens on main

1. Push to `main` → `release.yml` opens or updates the PR from `release-please--branches--main`. It bumps the
   stack's version file and `CHANGELOG.md`.
2. Lockfile stacks (uv, Ruby gems): the `lockfile` job adds a refresh commit to that PR.
3. CI passes → the merge workflow merges it → release-please tags `vX.Y.Z` and publishes a GitHub Release.
4. `main` now differs from `dev` → a back-merge PR `main` → `dev` opens and merges itself.

The release PR and back-merge PR are expected. Leave them alone.

## 3. Configure (setup mode)

- Copy `<skill-dir>/assets/release-please/release-please-config.json` and `.release-please-manifest.json` to the
  repo root.
- Set `"release-type"` and any `extra-files` from the stack file (`stacks/*.md`, "Versioning").
- Set the manifest to the version already in the stack's version file (else `0.1.0`), so the first release
  continues from it.
- Monorepo: one entry per package path, plus a plugin for linked versions:

```json
{
  "$schema": "https://raw.githubusercontent.com/googleapis/release-please/main/schemas/config.json",
  "separate-pull-requests": false,
  "packages": {
    "apps/web": { "release-type": "node", "component": "web" },
    "services/api": { "release-type": "python", "component": "api" }
  },
  "plugins": ["node-workspace"]
}
```

The manifest lists each path (`{ "apps/web": "1.4.0", "services/api": "0.9.2" }`), and tags become `web-v1.4.1`.

## 4. Force a version, pre-releases

- Force one: add the footer `Release-As: 2.0.0` to a `feat`/`fix` commit.
- First stable release: `Release-As: 1.0.0`.
- Pre-releases (`1.2.0-beta.1`): set `"prerelease": true` and `"versioning": "prerelease"` for the package,
  and remove them to go stable. Only do this when the user asks.

## 5. Revert a change that already shipped

1. Find the commit: `git log origin/main --oneline --grep "<subject>"`. For a merged PR, use its merge commit.
2. Urgent (production broken): branch `hotfix/<issue>-revert-…` from `origin/main`. Otherwise: `fix/<issue>-revert-…`
   from `origin/dev`.
3. `git revert <sha>`. For a merge commit, add `-m 1`. Keep the generated `Revert "…"` body and make the subject
   `revert: <original subject>`.
4. Ship it with [ship.md](ship.md) (or [hotfix.md](hotfix.md)). A `revert:` commit produces a patch release.

## 6. Backports to an older major version

The flow automates only `dev` → `main`. To patch `v1.x` after `v2` shipped:

1. Ask the user first: it adds a long-lived branch. Create `release/v1.x` from the last `v1` tag:
   `git push origin v1.4.2:refs/heads/release/v1.x`.
2. Add a ruleset for `refs/heads/release/*` copied from `assets/github/rulesets/main.json`.
3. In `release.yml`, add `release/v1.x` to the push branches and a second release-please step with
   `target-branch: release/v1.x`. Add `'release/**'` to `ci.yml`'s push branches. Don't add it to
   `open-pull-request.yml`, which would open a PR from it into `dev`.
4. Cherry-pick onto a `backport/<issue>-v1-<words>` branch from `release/v1.x`. The `backport/` prefix gets
   conventions checks but no automatic PR or merge. Open this one PR yourself
   (`gh pr create --base release/v1.x`): it needs a person's review and a merge commit.

## Verify

- `gh pr list --head release-please--branches--main --state all --limit 1` shows the release PR, and its files
  include the version file and `CHANGELOG.md`.
- After it merges, `gh release list --limit 1` shows the tag, and the version file on `main` matches it.
- `git diff --quiet origin/main origin/dev` succeeds after the back-merge. No PRs are left open.

Reflow: no release PR after a `fix`/`feat` reached main → [troubleshoot.md](troubleshoot.md) row 5. Release PR CI
red on the lockfile → section 3 and the stack file's lockfile note. The version file is wrong → fix
`release-type`/`extra-files` (section 3), then let the next release correct it. Never hand-edit the version.
