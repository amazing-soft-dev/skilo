# Ruby, PHP and Elixir: CI and versioning

Use from [../workflows/setup-repo.md](../workflows/setup-repo.md) steps 3–5, or to fix CI for this stack.
Each block is a list of steps that goes under `steps:` after `- uses: actions/checkout@v7`: lint, type and test
steps in the `check` job, setup and build steps in the `build` job.

## Checklist

```
- [ ] 1. Package manager identified from the lockfile; the project's own scripts (Makefile, package scripts, tox…) preferred
- [ ] 2. check steps in ci.yml, with lines for tools the project doesn't configure deleted
- [ ] 3. build steps in ci.yml, with an assertion that the artifact exists
- [ ] 4. release-type and extra-files set; lockfile job added if this file says so
- [ ] 5. Dependabot ecosystem set (target-branch: dev)
- [ ] 6. Every command run once locally, or reported as not runnable here
```

Rules: install with the lockfile frozen, so CI fails when it's stale. Take the runtime version from the repo
(`.nvmrc`, `.python-version`, `go.mod`, `global.json`, `.tool-versions`…). Never hide a missing tool with
`--if-present`, `|| true` or `continue-on-error`: a check that can't fail is worse than none.

## Ruby — `Gemfile` + `Gemfile.lock`

```yaml
# recipe: ruby
- uses: ruby/setup-ruby@v1
  with:
    bundler-cache: true                  # reads .ruby-version; installs with the lockfile
- run: bundle exec rubocop
- run: bundle exec rspec                 # or bin/rails test
```

- Versioning: `"release-type": "ruby"` with `"version-file": "lib/<gem>/version.rb"` for gems. Rails apps
  usually don't version; use `simple`.
- **Lockfile refresh needed for gems**: `Gemfile.lock` lists the gem's own version under `PATH`. Add
  `<skill-dir>/assets/github/lockfile-refresh-job.yml` to `release.yml` with `- uses: ruby/setup-ruby@v1` and `- run: bundle lock`.
- Dependabot: `bundler`. Publish: `gem build` + `gem push` (or trusted publishing with `rubygems/release-gem`).

## PHP — `composer.json` + `composer.lock`

```yaml
# recipe: php
- uses: shivammathur/setup-php@v2
  with:
    php-version-file: .php-version       # or php-version: '8.4'
    tools: composer
- run: composer validate --strict
- run: composer install --no-interaction --prefer-dist
- run: vendor/bin/pint --test            # or vendor/bin/phpcs
- run: vendor/bin/phpstan analyse
- run: vendor/bin/phpunit
```

- Versioning: `"release-type": "php"` updates `"version"` in `composer.json`. Packagist libraries normally leave
  that field out and rely on tags: use `"simple"` for them.
- Dependabot: `composer`.

## Elixir — `mix.exs` + `mix.lock`

```yaml
# recipe: elixir
- uses: erlef/setup-beam@v1
  with:
    version-file: .tool-versions
    version-type: strict
- run: mix deps.get --check-locked
- run: mix format --check-formatted
- run: mix compile --warnings-as-errors
- run: mix credo --strict                # only with credo
- run: mix test
```

- Versioning: `"release-type": "elixir"` updates `@version "…"` or `version: "…"` in `mix.exs`.
- Dependabot: `mix`. Publish: `mix hex.publish --yes` with `HEX_API_KEY`.

## Verify

- `actionlint .github/workflows/*.yml` is clean (if available), and `check-setup.sh` has no "placeholder" FAIL.
- The commands from steps 2–3 pass locally on a clean checkout.

Reflow: a lint error → step 2 or 3. A command fails locally → fix the command or the project, then step 6.
Release PR CI fails after a bump → step 4 (lockfile or version file).
