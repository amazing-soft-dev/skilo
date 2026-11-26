# C/C++, containers and everything else: CI and versioning

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

## C / C++ — `CMakeLists.txt`

```yaml
# recipe: cmake
- run: cmake -S . -B build -DCMAKE_BUILD_TYPE=Release
- run: cmake --build build --parallel
- run: ctest --test-dir build --output-on-failure
```

- Versioning: `"release-type": "simple"` and mark the version line in `CMakeLists.txt`:
  `project(app VERSION 0.1.0) # x-release-please-version`, plus `"extra-files": ["CMakeLists.txt"]`.
- Dependabot: none for CMake itself (use `gitsubmodule` or `docker` where relevant).

## Containers — `Dockerfile` (alone or alongside any stack)

```yaml
# recipe: docker
- uses: docker/setup-buildx-action@v4
- uses: docker/build-push-action@v7
  with:
    context: .
    push: false                          # CI only proves it builds
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

- Versioning: whatever the app's stack uses. Image-only repos use `"simple"`. Dependabot: `docker`.
- Publish: in `release.yml`, log in to the registry and push the image tagged with
  `needs.release-please.outputs.tag_name`.

## Anything else (docs sites, scripts, infra, mixed)

Use `"release-type": "simple"`: it keeps the version in `version.txt` and the CHANGELOG. Point at any other file
with `extra-files` and an `x-release-please-version` comment on the version line. Terraform modules have
`terraform-module`, Helm charts `helm`.

## Verify

- `actionlint .github/workflows/*.yml` is clean (if available), and `check-setup.sh` has no "placeholder" FAIL.
- The commands from steps 2–3 pass locally on a clean checkout.

Reflow: a lint error → step 2 or 3. A command fails locally → fix the command or the project, then step 6.
Release PR CI fails after a bump → step 4 (lockfile or version file).
