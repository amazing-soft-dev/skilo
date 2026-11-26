# GitLab

Use when the repo is on GitLab. The rules and micro-skills are the same; only the mechanisms change.
**Untested:** unlike the GitHub assets, nothing here has been run. Build it, then run every scenario in
[../workflows/verify-flow.md](../workflows/verify-flow.md) before relying on it.

## Checklist

```
- [ ] 1. Protected branches main and dev: no direct push, merge via MR only
- [ ] 2. Merge requests: merge commit, pipelines must succeed, delete source branch
- [ ] 3. main is the default branch
- [ ] 4. Pipeline jobs: conventions check, the stack's checks, release MR and back-merge MR jobs
- [ ] 5. Versioning via commitizen; dependency updates via Renovate
- [ ] 6. verify-flow scenarios pass
```

## Mapping

GitLab has native equivalents for most of the flow. Push options open the merge request, and "auto-merge" merges
it when the pipeline passes.

- **Settings → Repository → Protected branches:** `main` and `dev` with "Allowed to push and merge: No one"
  for pushes, and Maintainers (plus the project access token's role) for merges. Force push off.
- **Settings → Merge requests:** merge method "Merge commit", "Pipelines must succeed" on, "Delete source branch"
  on by default. Set `main` as the default branch so `Closes #n` works.
- **Opening MRs:** the agent pushes with options. Use these in [../workflows/ship.md](../workflows/ship.md) step 1:
  ```bash
  git push -u origin HEAD -o merge_request.create -o merge_request.target=dev \
    -o merge_request.merge_when_pipeline_succeeds -o merge_request.remove_source_branch
  ```
  (`hotfix/…` uses `merge_request.target=main`.)
- **`dev` → `main` and back-merge MRs:** a job in `.gitlab-ci.yml` that runs on `dev` and `main` pipelines, using
  a project access token (`api` scope) stored as the masked variable `FLOW_TOKEN`. It ports the
  `assets/github/workflows/open-pull-request.yml` logic: tree diff, then the `Closes` list from `git log`. Use the GitLab CLI:
  `glab mr create --source-branch dev --target-branch main --title … --description … --yes`, then
  `glab mr merge <id> --auto-merge --yes`. Update an existing MR with `glab mr update`.
- **Conventions check:** the same bash as the `conventions` job, with `CI_COMMIT_REF_NAME`,
  `CI_MERGE_REQUEST_DIFF_BASE_SHA` and `CI_COMMIT_SHA`, in a job with
  `rules: - if: $CI_PIPELINE_SOURCE == "merge_request_event"`.
- **Versioning:** release-please is GitHub-only. Use commitizen in a `main` pipeline job:
  `cz bump --yes --changelog --files-only` writes the next version (providers `pep621`, `npm`, `cargo`,
  `composer`…, or `version_files`) and the CHANGELOG from Conventional Commits. Commit that on `release/next`,
  push it with the auto-merge options targeting `main`, and tag `v$(cz version --project)` when it merges. Skip the
  bump job when `HEAD` is that release merge, so it doesn't loop. The back-merge job then brings it to `dev`.
- **Dependabot:** use Renovate with `baseBranches: ["dev"]` and `semanticCommits: "enabled"`.

## Verify

All scenarios in [../workflows/verify-flow.md](../workflows/verify-flow.md) pass, using `glab` in place of `gh`.

Reflow: an MR not created → step 4 (push options or token scope). Not merged → step 2 ("Pipelines must
succeed" and auto-merge). An issue didn't close → step 3.
