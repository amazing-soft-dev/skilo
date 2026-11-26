# Python (uv, Poetry, pip): CI and versioning

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

## Python — `pyproject.toml` (+ `uv.lock` / `poetry.lock`) or `requirements*.txt`

```yaml
# recipe: python-uv
- uses: astral-sh/setup-uv@v7
  with:
    enable-cache: true               # reads .python-version
- run: uv sync --locked
- run: uv run ruff check .
- run: uv run ruff format --check .
- run: uv run mypy .
- run: uv run pytest
- run: uv build                      # build job (packages only)
```

```yaml
# recipe: python-poetry
- run: pipx install poetry
- uses: actions/setup-python@v7
  with:
    python-version-file: .python-version
    cache: poetry
- run: poetry check --lock
- run: poetry install --no-interaction
- run: poetry run pytest
```

```yaml
# recipe: python-pip
- uses: actions/setup-python@v7
  with:
    python-version-file: .python-version
    cache: pip
- run: python -m pip install -r requirements.txt -r requirements-dev.txt
- run: python -m pytest
```

- Versioning: `"release-type": "python"`. It updates `[project].version` (or `[tool.poetry].version`) in
  `pyproject.toml`, `setup.py`/`setup.cfg`, and `__version__` in `<package>/__init__.py` or `version.py`.
- **Lockfile refresh needed for uv**: `uv.lock` records the project's own version, so after the bump
  `uv sync --locked` fails on the release PR. Add `<skill-dir>/assets/github/lockfile-refresh-job.yml` to `release.yml` with
  `- uses: astral-sh/setup-uv@v7` and `- run: uv lock`. Poetry's lock doesn't store it.
- Dependabot: `uv` for uv, `pip` for pip and Poetry.
- Publish: `uv build` then `pypa/gh-action-pypi-publish@release/v1` with trusted publishing (`id-token: write`).

## Verify

- `actionlint .github/workflows/*.yml` is clean (if available), and `check-setup.sh` has no "placeholder" FAIL.
- The commands from steps 2–3 pass locally on a clean checkout.

Reflow: a lint error → step 2 or 3. A command fails locally → fix the command or the project, then step 6.
Release PR CI fails after a bump → step 4 (lockfile or version file).
