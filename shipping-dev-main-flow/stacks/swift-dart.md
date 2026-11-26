# Swift and Dart/Flutter: CI and versioning

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

## Swift — `Package.swift`

```yaml
# recipe: swift
- uses: swift-actions/setup-swift@v3
  with:
    swift-version: '6'
- run: swift build
- run: swift test
```

- Apple-platform apps need `runs-on: macos-latest` and `xcodebuild`. Linux works for server-side packages.
- Versioning: `"release-type": "simple"` with `"include-v-in-tag": false`. SwiftPM resolves packages from plain
  semver tags. Dependabot: `swift`.

## Dart / Flutter — `pubspec.yaml` + `pubspec.lock`

```yaml
# recipe: flutter
- uses: subosito/flutter-action@v2
  with:
    channel: stable
    cache: true
- run: flutter pub get --enforce-lockfile
- run: dart format --output=none --set-exit-if-changed .
- run: flutter analyze
- run: flutter test
- run: flutter build web                 # build job: pick the targets that ship
```

- Pure Dart: `dart-lang/setup-dart@v1`, `dart pub get --enforce-lockfile`, `dart analyze`, `dart test`.
- Versioning: `"release-type": "dart"` updates `version:` in `pubspec.yaml` and increments the `+build` number.
- Dependabot: `pub`.

## Verify

- `actionlint .github/workflows/*.yml` is clean (if available), and `check-setup.sh` has no "placeholder" FAIL.
- The commands from steps 2–3 pass locally on a clean checkout.

Reflow: a lint error → step 2 or 3. A command fails locally → fix the command or the project, then step 6.
Release PR CI fails after a bump → step 4 (lockfile or version file).
