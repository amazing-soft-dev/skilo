---
name: "dev-main-pr-flow"
description: "Ship changes through a dev→main PR flow (issue, prefixed branch, Conventional Commit, auto-PR, CI gate, auto-merge), or set that flow up in a repo of any language or framework."
---

# dev → main pull-request flow

A GitHub workflow that works the same in any language or framework. Only the CI job steps change from stack to stack.

- `dev` is where work lands. `main` is the release branch. Both live permanently.
- Rulesets block direct pushes, force-pushes, and deletion on both. A change lands only through a pull request, only as a **merge commit**, and only after the **CI passed** check is green. No human review is required.
- Three workflows automate everything after `git push`: **Open pull request**, **CI**, **Merge passing pull request**.
- Deployment is outside Actions. A hosting platform (Vercel, Netlify, Render, Fly, Cloudflare, etc.) tracks `main` through its Git connection.

First decide which mode applies:

- **Mode A: ship a change.** The repo already has `.github/workflows/open-pull-request.yml`, `merge-passing-pr.yml`, and `ci.yml` (and usually `.github/rulesets/`).
- **Mode B: set up the flow.** The repo doesn't have those files yet, or the user asks to add or port the flow.

---

## Mode A: Ship a change

Never push to `dev` or `main`. Never merge by hand, use `--admin`, squash, or rebase-merge unless the user explicitly asks.

1. **Open an issue** and note the number.
   ```bash
   gh issue create --title "Short title" --body "What and why"
   ```
2. **Branch from `origin/dev`**. Use one of these prefixes: `feat/`, `fix/`, `docs/`, `ci/`, `build/`. Put the issue number first.
   ```bash
   git fetch origin
   git switch -c feat/12-short-description origin/dev
   ```
   - Any other prefix (`chore/`, `refactor/`, `test/`) will **not** get a pull request opened or merged automatically. Pick the closest allowed prefix: `build/` for tooling and dependencies, `ci/` for workflows, `fix/` for refactors that correct behavior. The commit type can still be `refactor`, `test`, `chore`, or `perf`.
3. **Commit** with a Conventional Commit subject: `type(scope): short description`, e.g. `feat(home): add hero section`.
   - A `Closes #12` line is optional when the branch name already carries the number. `Fixes` and `Resolves` work too.
   - Run the project's own lint, type, test, and build commands locally first (see the stack table in Mode B).
4. **Push**:
   ```bash
   git push -u origin HEAD
   ```
5. **Watch it through.**
   ```bash
   gh pr list --head "$(git branch --show-current)"   # PR into dev appears after the workflow runs
   gh pr checks <number> --watch
   ```
   A green CI run merge-commits the PR into `dev`. That push opens or updates the `dev` → `main` PR, CI runs again, and a green run merges into `main`. GitHub then closes the issues listed in that PR's body.

### When something goes wrong

- **CI red:** `gh run view <run-id> --log-failed`, fix it on the same branch, and push again. The newer run cancels the older one.
- **Branch behind or conflicting with `dev`:** `git fetch origin && git merge origin/dev`, resolve, and push. Force-pushing a feature branch is allowed but unnecessary.
- **Merge skipped:** the merge step uses `--match-head-commit`, so a push after CI started just waits for the next green run.
- **`dev` → `main` CI red:** fix it with a new `fix/<issue>-…` branch into `dev`. Never patch `main`.
- **Issue didn't close:** only the `dev` → `main` PR closes issues. Check that the branch name starts with `<prefix>/<number>-` or that a commit has a `Closes #N` line.
- **Dependabot PRs** are outside this automation. A person merges or closes them.

---

## Mode B: Set up the flow in a repo

### 1. Detect the stack

Look at the repo root and any subprojects, and read the project's own task runner first (`Makefile`, `justfile`, `Taskfile.yml`, `package.json` scripts, `tox.ini`/`noxfile.py`, `composer.json` scripts, `mix` aliases). **Prefer the project's own commands over raw tool calls,** and include a step only for tools the project actually configures. Don't add a linter it doesn't use.

| Stack (detect by) | Setup action | Install | Lint / format | Type / static | Test | Build | Dependabot ecosystem |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Node (`package.json` + lockfile) | `actions/setup-node` (`node-version-file`, `cache`) | `npm ci` / `pnpm install --frozen-lockfile` / `yarn install --immutable` / `bun install --frozen-lockfile` | `run lint` | `run typecheck` | `run test` | `run build` | `npm` (also covers pnpm/yarn) / `bun` |
| Python (`pyproject.toml`, `requirements*.txt`) | `astral-sh/setup-uv` or `actions/setup-python` | `uv sync --frozen` / `poetry install` / `pip install -r …` | `ruff check .` + `ruff format --check .` | `mypy` / `pyright` | `pytest` | `uv build` | `uv` / `pip` |
| Go (`go.mod`) | `actions/setup-go` (`go-version-file: go.mod`) | `go mod download` | `golangci/golangci-lint-action`, `gofmt -l` | `go vet ./...` | `go test ./...` | `go build ./...` | `gomod` |
| Rust (`Cargo.toml`) | `dtolnay/rust-toolchain@stable` (`components: clippy, rustfmt`) | — | `cargo fmt --check` | `cargo clippy --all-targets -- -D warnings` | `cargo test --locked` | `cargo build --release --locked` | `cargo` |
| Java/Kotlin, Maven (`pom.xml`) | `actions/setup-java` (`temurin`, `cache: maven`) | — | via plugins | — | `./mvnw -B verify` | (in verify) | `maven` |
| Java/Kotlin, Gradle (`build.gradle[.kts]`) | `actions/setup-java` + `gradle/actions/setup-gradle` | — | `./gradlew check` | (in check) | (in check) | `./gradlew build` | `gradle` |
| .NET (`*.sln`, `*.csproj`) | `actions/setup-dotnet` | `dotnet restore` | `dotnet format --verify-no-changes` | `dotnet build --no-restore -warnaserror` | `dotnet test --no-build` | `dotnet publish` | `nuget` |
| Ruby (`Gemfile`) | `ruby/setup-ruby` (`bundler-cache: true`) | (cached) | `bundle exec rubocop` | `bundle exec srb tc` if used | `bundle exec rspec` / `bin/rails test` | — | `bundler` |
| PHP (`composer.json`) | `shivammathur/setup-php` | `composer install --no-interaction` | `vendor/bin/pint --test` / `phpcs` | `vendor/bin/phpstan analyse` | `vendor/bin/phpunit` | — | `composer` |
| Elixir (`mix.exs`) | `erlef/setup-beam` | `mix deps.get` | `mix format --check-formatted`, `mix credo` | `mix dialyzer` if used | `mix test` | `mix compile --warnings-as-errors` | `mix` |
| Dart/Flutter (`pubspec.yaml`) | `subosito/flutter-action` / `dart-lang/setup-dart` | `flutter pub get` | `dart format --set-exit-if-changed .` | `flutter analyze` | `flutter test` | `flutter build <target>` | `pub` |
| Swift (`Package.swift`) | `macos-latest` runner | `swift package resolve` | `swiftlint` if used | — | `swift test` | `swift build -c release` | `swift` |
| C/C++ (`CMakeLists.txt`) | — | `cmake -B build -DCMAKE_BUILD_TYPE=Release` | `clang-format --dry-run --Werror` if used | `clang-tidy` if used | `ctest --test-dir build` | `cmake --build build` | — |
| Containers (`Dockerfile`) | `docker/setup-buildx-action` | — | `hadolint` if used | — | — | `docker build .` | `docker` |

**Monorepos and mixed stacks:** one job per stack or package (or a matrix), and every one of them goes in `CI passed`'s `needs`.

**Build variants:** if the project ships more than one artifact (server and static export, several targets or platforms), build each one in a matrix and **assert the outputs**: expected files exist, and things that must not ship (e.g. an `api/` folder in a static export) are absent.

**Project-specific checks** (asset audits, schema or migration checks, generated-code drift) go in the lint job as extra steps.

### 2. Add the files

#### `.github/workflows/ci.yml`

Replace the `# STACK:` lines using the table. Keep the job **names** exactly as shown: the ruleset requires `CI passed`, and the merge workflow listens for the workflow named `CI`.

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [dev, main]
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: ci-${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: true

jobs:
  check:
    name: Lint and type check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      # STACK: setup action
      # STACK: install
      # STACK: lint / format check
      # STACK: type / static analysis
      # STACK: tests
      # PROJECT: extra checks

  build:
    name: Build (${{ matrix.variant }})
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        variant: [default]   # e.g. [server, static] or one entry per target
    steps:
      - uses: actions/checkout@v4
      # STACK: setup action
      # STACK: install
      # STACK: build for ${{ matrix.variant }}
      # PROJECT: assert expected outputs exist and forbidden ones don't

  ci-passed:
    name: CI passed
    if: always()
    needs: [check, build]
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
    steps:
      - name: Post or update summary comment
        if: github.event_name == 'pull_request' && github.event.pull_request.head.repo.full_name == github.repository
        env:
          GH_TOKEN: ${{ github.token }}
          PR: ${{ github.event.pull_request.number }}
          CHECK: ${{ needs.check.result }}
          BUILD: ${{ needs.build.result }}
          RUN_URL: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}
        run: |
          marker='<!-- ci-summary -->'
          body="$marker
          ### CI summary

          | Job | Result |
          | --- | --- |
          | Lint and type check | $CHECK |
          | Build | $BUILD |

          [Run details]($RUN_URL)"
          id=$(gh api "repos/$GITHUB_REPOSITORY/issues/$PR/comments" --paginate \
                 --jq ".[] | select(.body | startswith(\"$marker\")) | .id" | head -n1)
          if [ -n "$id" ]; then
            gh api -X PATCH "repos/$GITHUB_REPOSITORY/issues/comments/$id" -f body="$body"
          else
            gh api -X POST "repos/$GITHUB_REPOSITORY/issues/$PR/comments" -f body="$body"
          fi
      - name: Require all jobs to succeed
        env:
          CHECK: ${{ needs.check.result }}
          BUILD: ${{ needs.build.result }}
        run: |
          test "$CHECK" = success
          test "$BUILD" = success
```

#### `.github/workflows/open-pull-request.yml`

```yaml
name: Open pull request

on:
  push:
    branches: [dev, 'feat/**', 'fix/**', 'docs/**', 'ci/**', 'build/**']

permissions:
  contents: read

concurrency:
  group: open-pr-${{ github.ref }}
  cancel-in-progress: false

jobs:
  open:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - name: Open or update pull request
        env:
          GH_TOKEN: ${{ secrets.GH_TOKEN }}   # PAT, not GITHUB_TOKEN; see notes
          BRANCH: ${{ github.ref_name }}
        run: |
          set -euo pipefail
          git fetch origin dev main

          if [ "$BRANCH" = dev ]; then
            base=main
            if [ "$(git rev-list --count origin/main..origin/dev)" -eq 0 ]; then
              echo "dev is not ahead of main"; exit 0
            fi
            # Issue numbers from merged branch names and closing keywords since main
            log=$(git log origin/main..origin/dev --format=%B)
            issues=$(printf '%s\n' "$log" \
              | grep -oiE '(from [^ ]+/(feat|fix|docs|ci|build)/[0-9]+)|((close[sd]?|fix(e[sd])?|resolve[sd]?) #[0-9]+)' \
              | grep -oE '[0-9]+$' | sort -un || true)
            body="Release \`dev\` → \`main\`."$'\n'
            for n in $issues; do body+=$'\n'"Closes #$n"; done
          else
            base=dev
            if [ "$(git rev-list --count origin/dev..HEAD)" -eq 0 ]; then
              echo "$BRANCH has no commits beyond dev"; exit 0
            fi
          fi

          existing=$(gh pr list --head "$BRANCH" --base "$base" --state open \
                       --json number --jq '.[0].number // empty')

          if [ -n "$existing" ]; then
            if [ "$base" = main ]; then gh pr edit "$existing" --body "$body"; fi
            exit 0
          fi

          if [ "$base" = main ]; then
            gh pr create --base main --head dev --title "Release: dev → main" --body "$body"
          else
            gh pr create --base dev --head "$BRANCH" \
              --title "$(git log -1 --format=%s)" \
              --body "Automated pull request for \`$BRANCH\`."
          fi
```

#### `.github/workflows/merge-passing-pr.yml`

```yaml
name: Merge passing pull request

on:
  workflow_run:
    workflows: [CI]
    types: [completed]

permissions:
  contents: read

jobs:
  merge:
    if: github.event.workflow_run.conclusion == 'success' && github.event.workflow_run.event == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - name: Merge if eligible
        env:
          GH_TOKEN: ${{ secrets.GH_TOKEN }}
          REPO: ${{ github.repository }}
          HEAD_BRANCH: ${{ github.event.workflow_run.head_branch }}
          HEAD_SHA: ${{ github.event.workflow_run.head_sha }}
        run: |
          set -euo pipefail
          gh pr list -R "$REPO" --head "$HEAD_BRANCH" --state open \
            --json number,baseRefName,isCrossRepository \
            --jq '.[] | "\(.number) \(.baseRefName) \(.isCrossRepository)"' |
          while read -r number base cross; do
            [ "$cross" = false ] || continue
            if [[ "$HEAD_BRANCH" =~ ^(feat|fix|docs|ci|build)/ && "$base" == dev ]] \
               || [[ "$HEAD_BRANCH" == dev && "$base" == main ]]; then
              gh pr merge "$number" -R "$REPO" --merge --match-head-commit "$HEAD_SHA" \
                || echo "Head moved or merge blocked; waiting for the next green run."
            fi
          done
```

#### `.github/rulesets/main.json` (copy as `dev.json` with `refs/heads/dev` and name `Protect dev`)

```json
{
  "name": "Protect main",
  "target": "branch",
  "enforcement": "active",
  "conditions": { "ref_name": { "include": ["refs/heads/main"], "exclude": [] } },
  "bypass_actors": [],
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" },
    {
      "type": "pull_request",
      "parameters": {
        "required_approving_review_count": 0,
        "dismiss_stale_reviews_on_push": false,
        "require_code_owner_review": false,
        "require_last_push_approval": false,
        "required_review_thread_resolution": false,
        "allowed_merge_methods": ["merge"]
      }
    },
    {
      "type": "required_status_checks",
      "parameters": {
        "strict_required_status_checks_policy": false,
        "required_status_checks": [{ "context": "CI passed" }]
      }
    }
  ]
}
```

- Keep `strict_required_status_checks_policy` **false**. Each release adds a merge commit to `main` that `dev` never gets, so a strict "up to date" rule would block every later `dev` → `main` PR.
- Don't add `required_linear_history`. It forbids merge commits.
- Files in `.github/rulesets/` are **not** applied automatically. An admin imports them:
  ```bash
  gh api repos/OWNER/REPO/rulesets -X POST --input .github/rulesets/dev.json
  gh api repos/OWNER/REPO/rulesets -X POST --input .github/rulesets/main.json
  ```
  To update one: `gh api repos/OWNER/REPO/rulesets` to find the id, then `-X PUT repos/OWNER/REPO/rulesets/<id> --input …`.

#### `.github/dependabot.yml`

One entry for each ecosystem detected (see the table), plus `github-actions`:

```yaml
version: 2
updates:
  - package-ecosystem: github-actions
    directory: /
    schedule: { interval: weekly }
  - package-ecosystem: <ecosystem>   # npm, uv, pip, gomod, cargo, maven, gradle, nuget, bundler, composer, mix, pub, swift, docker
    directory: /                     # one entry per manifest directory in monorepos
    schedule: { interval: weekly }
```

Dependabot branches don't match the allowed prefixes, so the automation leaves them alone and a person merges or closes them. If they should go through the release PR, add `target-branch: dev`.

### 3. Repository settings (tell the user; most need admin rights)

1. **`GH_TOKEN` secret**: a fine-grained PAT (or a GitHub App token) scoped to this repo, with Contents, Pull requests, and Workflows set to read/write. It's required because events made with the default `GITHUB_TOKEN` don't trigger other workflows, so a PR opened or merged with it would never start CI or the next step. Workflows write access lets it merge PRs that touch `.github/workflows/`.
2. **General → Pull Requests**: allow merge commits. Squash and rebase can stay off.
3. Create `dev` from `main` if it doesn't exist. Making `dev` the default branch is optional.
4. The workflow files must be on the **default branch** for `workflow_run` (the merge workflow) to fire.
5. Import the rulesets (above) **after** CI has run once, so `CI passed` exists as a check.
6. **Deployment**: point the hosting platform's production branch at `main` (and preview deploys at PRs, if wanted). If the project deploys from Actions instead, add a separate workflow that runs on `push` to `main`, and don't put the deploy in `ci.yml`.

### 4. Verify end to end

Open a throwaway issue. Push `docs/<n>-verify-flow` with a one-line doc change. Confirm the PR into `dev` opens, CI goes green, it auto-merges, the `dev` → `main` PR opens with `Closes #<n>`, that PR merges, and the issue closes.

---

## How it fits together

```
issue #12 ─▶ feat/12-x ──push──▶ [Open pull request] ─▶ PR feat/12-x → dev
                                                          │ [CI] green
                                                          ▼ [Merge passing PR]
                                                   dev ──push──▶ [Open pull request] ─▶ PR dev → main (body: Closes #12)
                                                                                          │ [CI] green
                                                                                          ▼ [Merge passing PR]
                                                                                        main ─▶ host deploys; #12 closes
```