---
name: shipping-dev-main-flow
description: Ships code changes through a dev → main pull-request flow (issue, prefixed branch, Conventional Commit, auto-opened PR, CI gate, auto-merge, release-please version bump, back-merge) and installs that flow in repositories of any language. Use when committing, pushing, opening or merging a PR, fixing failing CI, shipping a hotfix, releasing or bumping versions in a repo that has open-pull-request.yml and merge-passing-pr.yml, or when asked to set up, port, audit or repair this workflow, its rulesets or its release automation. Takes priority over generic commit and PR commands in those repos.
---

# Shipping through the dev → main flow

```
issue #12 → feat/12-x ─push→ PR → dev ─CI passed→ auto-merge
            dev ─push→ PR dev → main (Closes #12) ─CI passed→ auto-merge
            main ─push→ release PR (version + CHANGELOG) → auto-merge → tag vX.Y.Z → back-merge PR main → dev
issue #20 → hotfix/20-x ─push→ PR → main ─CI passed→ auto-merge → patch release → back-merge into dev
```

People and agents only push branches. Workflows open every PR, and merge it as a merge commit once the
**CI passed** check is green. release-please derives versions from commit messages.

## 1. Detect the mode

- The repo has `.github/workflows/open-pull-request.yml` and `merge-passing-pr.yml` → **change mode**.
  This skill replaces generic commit/PR commands (`/commit-push-pr` and similar), which use the wrong base and
  branch names.
- They're missing and the user wants the flow, or asks to audit or repair it → **setup mode**.
- They're missing and the user didn't ask → follow the repo's own conventions; this skill doesn't apply.
- To audit an existing setup, run `bash <skill-dir>/scripts/check-setup.sh` in the repo. Every FAIL line names
  the micro-skill and step that fixes it.

`<skill-dir>` is this skill's base directory, shown when the skill loads.

## 2. Pick the micro-skill

| Situation | Read |
| --- | --- |
| Starting any change: issue and branch | [workflows/start-work.md](workflows/start-work.md) |
| Ready to commit | [workflows/commit.md](workflows/commit.md) |
| Pushing and getting it merged | [workflows/ship.md](workflows/ship.md) |
| CI is red | [workflows/fix-ci.md](workflows/fix-ci.md) |
| Production is broken | [workflows/hotfix.md](workflows/hotfix.md) |
| Versions, release PRs, reverting a shipped change, backports | [workflows/release.md](workflows/release.md) |
| Installing or porting the flow | [workflows/setup-repo.md](workflows/setup-repo.md) |
| Token, review modes, threat model, merge queue, signed commits | [workflows/secure-repo.md](workflows/secure-repo.md) |
| Proving the flow works end to end | [workflows/verify-flow.md](workflows/verify-flow.md) |
| The automation did something unexpected | [workflows/troubleshoot.md](workflows/troubleshoot.md) |

CI steps, version files and Dependabot ecosystems, by the files the repo contains:

| Repo contains | Read |
| --- | --- |
| `package.json` | [stacks/node.md](stacks/node.md) |
| `pyproject.toml`, `requirements*.txt` | [stacks/python.md](stacks/python.md) |
| `pom.xml`, `build.gradle[.kts]` | [stacks/jvm.md](stacks/jvm.md) |
| `go.mod`, `Cargo.toml` | [stacks/go-rust.md](stacks/go-rust.md) |
| `*.sln`, `*.csproj`, `global.json` | [stacks/dotnet.md](stacks/dotnet.md) |
| `Gemfile`, `composer.json`, `mix.exs` | [stacks/ruby-php-elixir.md](stacks/ruby-php-elixir.md) |
| `Package.swift`, `pubspec.yaml` | [stacks/swift-dart.md](stacks/swift-dart.md) |
| `CMakeLists.txt`, `Dockerfile`, anything else | [stacks/native-docker.md](stacks/native-docker.md) |

Not on GitHub: [hosts/gitlab.md](hosts/gitlab.md), [hosts/bitbucket-azure.md](hosts/bitbucket-azure.md).

## 3. Rules that hold in every micro-skill

1. Never push or force-push `dev` or `main`.
2. Never open, approve, merge or close the flow's PRs yourself (`gh pr create`, `gh pr merge`, `--admin`, squash,
   rebase). The workflows do that. Marking your own PR as a draft to stop it merging is allowed.
3. Branches are `<prefix>/<issue>-<kebab-words>`, with prefix `feat`, `fix`, `docs`, `ci` or `build` into `dev`,
   or `hotfix` into `main`. Any other prefix gets no PR and fails CI.
4. Never edit version numbers, `CHANGELOG.md`, `.release-please-manifest.json` or `v*` tags by hand.
5. Never weaken a check (skip tests, disable lint rules, `--no-verify`, `continue-on-error`) unless the user asks.
6. Never print, copy or store tokens. Tools read them from the environment.

## 4. How to run a micro-skill

1. Open the file and copy its **Checklist** into your response, or into the task list when one is available.
2. Work the steps in order. Tick a box only with evidence: command output, a PR URL, a check result.
3. Run its **Verify** section. Any box you can't tick has a **Reflow** line: go back to that step, redo it, and
   verify again.
4. Never report done while a box is unticked. Report what's blocked and the evidence.

## 5. Master checklists

Change (copy this, then each micro-skill's own checklist):

```
- [ ] start-work: issue #___ and branch <prefix>/___ from origin/dev (origin/main for hotfix)
- [ ] commit: Conventional Commit(s), no secrets, local checks pass
- [ ] ship: PR #___ auto-merged into dev (or main for hotfix)
- [ ] reported: issue, branch, PR, CI result, where it stands
```

Setup:

```
- [ ] setup-repo: files copied, CI filled from the stack file, bootstrap done, rulesets imported
- [ ] secure-repo: token chosen and saved, review mode chosen
- [ ] verify-flow: every scenario passed on the real repo
- [ ] check-setup.sh: all PASS
```

Reflow: a FAIL from `check-setup.sh` or a failed verify scenario sends you back to the micro-skill and step it names.
