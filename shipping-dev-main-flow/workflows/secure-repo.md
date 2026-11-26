# Secure the flow

Use during setup, or when the user asks who can ship, how tokens work, or about merge queues, signed commits or forks.

## Checklist

```
- [ ] 1. Token type chosen and saved (App preferred), with least privilege and an expiry
- [ ] 2. Review mode chosen and applied to the rulesets
- [ ] 3. User told what the flow does not protect against
- [ ] 4. Optional hardening decided: SHA pinning, merge queue, signed commits
```

## 1. Token

Workflows need a token other than `GITHUB_TOKEN`: events created with `GITHUB_TOKEN` don't start other workflows,
so PRs would never get CI and merges would never open the next PR.

**GitHub App (preferred).** Its tokens are short-lived and not tied to a person, and PRs it opens can be approved
by humans. Give it Contents, Pull requests, Issues and Workflows read/write, then install it on the repo. Save
`FLOW_APP_CLIENT_ID` as a variable and `FLOW_APP_PRIVATE_KEY` as a secret. In each workflow that uses
`secrets.GH_TOKEN`, add this as the first step, and replace `secrets.GH_TOKEN` with `steps.app-token.outputs.token`:

```yaml
      - id: app-token
        uses: actions/create-github-app-token@v3
        with:
          client-id: ${{ vars.FLOW_APP_CLIENT_ID }}
          private-key: ${{ secrets.FLOW_APP_PRIVATE_KEY }}
```

**Fine-grained PAT.** This repo only, with the same four permissions and an expiry date. Save it as `GH_TOKEN`.
PRs it opens are authored by its owner, who can't approve them.

Never print a token, paste it into chat, write it to a file, or put it in a URL. The user creates and saves it;
tools read it from the environment.

## 2. Review modes

| Mode | Ruleset change | Effect |
| --- | --- | --- |
| autonomous (default) | none | Any collaborator's green branch reaches production in minutes |
| guarded | `"require_code_owner_review": true` in both branch rulesets, plus `.github/CODEOWNERS` (`/.github/ @owner`) | PRs touching workflows or rulesets wait for an owner |
| reviewed | `"required_approving_review_count": 1` in `main.json` | Every PR into `main` needs an approval; features still land on `dev` automatically |

When a review is required, the automatic merge is skipped with a warning. The reviewer approves, then clicks
**Merge pull request → Create a merge commit**.

## 3. What it does and doesn't protect

- Fork PRs get no secrets and are never auto-merged.
- The merge workflow runs from the default branch's copy (`workflow_run`), so a PR can't change what merges it.
- Release tags (`v*`) can't be moved or deleted.
- **Anyone with write access can read repository secrets** by pushing a branch with a modified workflow. That's
  true of every GitHub Actions setup. Limit write access, use the App token so a leak expires within an hour, and
  use guarded mode.

## 4. Optional hardening

- **Pin actions to commit SHAs:** `uses: actions/checkout@<40-char sha> # v7`. Dependabot's `github-actions`
  entry keeps pins current.
- **Merge queue:** if the user enables it on `main`, add `merge_group:` to `ci.yml`'s `on:`, and in
  `merge-passing-pr.yml` change `gh pr merge … --merge` to `gh pr merge … --merge --auto` so PRs enter the queue.
  Verify with [verify-flow.md](verify-flow.md) afterwards.
- **Signed commits** (`required_signatures` rule): GitHub signs merge commits and release-please's API commits.
  Local commits must be signed (`git config commit.gpgsign true`). The lockfile job's `git push` commit is
  unsigned: sign it with a bot key, or don't require signatures on `main`. Tell the user which.

## Verify

- `gh secret list` shows `GH_TOKEN` (or `FLOW_APP_PRIVATE_KEY`, with the variable set).
- `gh api repos/OWNER/REPO/rulesets/<id>` reflects the chosen mode.
- The user has acknowledged the write-access point in section 3.

Reflow: missing secret → section 1. Mode not applied → section 2, then re-import the ruleset
([setup-repo.md](setup-repo.md) step 7).
