# Go and Rust: CI and versioning

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

## Go — `go.mod`

```yaml
# recipe: go
- uses: actions/setup-go@v7
  with:
    go-version-file: go.mod
- run: test -z "$(gofmt -l .)" || { gofmt -l .; exit 1; }
- run: go vet ./...
- uses: golangci/golangci-lint-action@v9    # only with .golangci.yml
- run: go test -race ./...
- run: go build ./...                        # build job
```

- Versioning: `"release-type": "go"`. Go modules are versioned by git tags (`v1.2.3`), so it writes
  `CHANGELOG.md` and tags. A major version ≥ 2 also requires changing the module path to `/v2`: do that in the
  same `feat!:` change.
- Dependabot: `gomod`. Publish: none needed; the tag is the release. Use GoReleaser for binaries.

## Rust — `Cargo.toml` + `Cargo.lock`

```yaml
# recipe: rust
- uses: dtolnay/rust-toolchain@stable        # rust-toolchain.toml wins if present
  with:
    components: clippy, rustfmt
- uses: Swatinem/rust-cache@v2
- run: cargo fmt --all --check
- run: cargo clippy --all-targets --locked -- -D warnings
- run: cargo test --locked
- run: cargo build --release --locked        # build job
```

- Versioning: `"release-type": "rust"`. It updates `Cargo.toml` and `Cargo.lock`. For workspaces, add one package
  per crate and `"plugins": ["cargo-workspace"]`.
- Dependabot: `cargo`. Publish: `cargo publish --locked` with `CARGO_REGISTRY_TOKEN`.

## Verify

- `actionlint .github/workflows/*.yml` is clean (if available), and `check-setup.sh` has no "placeholder" FAIL.
- The commands from steps 2–3 pass locally on a clean checkout.

Reflow: a lint error → step 2 or 3. A command fails locally → fix the command or the project, then step 6.
Release PR CI fails after a bump → step 4 (lockfile or version file).
