# Java and Kotlin (Maven, Gradle): CI and versioning

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

## Java / Kotlin — Maven (`pom.xml`)

```yaml
# recipe: maven
- uses: actions/setup-java@v6
  with:
    distribution: temurin
    java-version-file: .java-version   # or java-version: 21
    cache: maven
- run: ./mvnw -B -ntp verify             # lint plugins (spotless, checkstyle) bind to verify
```

- Versioning: `"release-type": "maven"` with `"skip-snapshot": true`. It updates `<version>` in `pom.xml`.
  Without `skip-snapshot`, it opens a second "-SNAPSHOT" PR after every release.
- Dependabot: `maven`.

## Java / Kotlin — Gradle (`build.gradle[.kts]`, `settings.gradle[.kts]`)

```yaml
# recipe: gradle
- uses: actions/setup-java@v6
  with:
    distribution: temurin
    java-version-file: .java-version
- uses: gradle/actions/setup-gradle@v6
- run: ./gradlew check
- run: ./gradlew build -x check          # build job
```

- Versioning: `"release-type": "simple"` plus an extra file. Put the version in `gradle.properties` between
  markers, and Gradle reads it automatically:

  ```properties
  # x-release-please-start-version
  version=0.1.0
  # x-release-please-end
  ```

  Config: `"extra-files": ["gradle.properties"]`. Android: do the same for `versionName`, and keep
  `versionCode` as a separate counter.
- Dependabot: `gradle`.

## Verify

- `actionlint .github/workflows/*.yml` is clean (if available), and `check-setup.sh` has no "placeholder" FAIL.
- The commands from steps 2–3 pass locally on a clean checkout.

Reflow: a lint error → step 2 or 3. A command fails locally → fix the command or the project, then step 6.
Release PR CI fails after a bump → step 4 (lockfile or version file).
