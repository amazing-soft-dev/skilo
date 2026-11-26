# Start work: issue and branch

Use before changing any file. For a production emergency, use [hotfix.md](hotfix.md) instead.

## Checklist

```
- [ ] 1. Issue exists and its number is noted
- [ ] 2. Prefix chosen (feat / fix / docs / ci / build)
- [ ] 3. Branch created from fresh origin/dev, named <prefix>/<issue>-<kebab-words>
- [ ] 4. Working tree clean before the first edit
```

## Steps

### 1. Issue

Search first so you don't duplicate one: `gh issue list --search "<keywords>" --state open`.
Otherwise create one: `gh issue create --title "<what>" --body "<why and acceptance criteria>"`.
Note the number. One issue per branch; split bigger work into several issues.

### 2. Prefix

| Change | Prefix |
| --- | --- |
| New behavior users can see | `feat` |
| Bug fix, or a refactor that corrects behavior | `fix` |
| Docs only | `docs` |
| Workflows, CI config | `ci` |
| Build tooling, dependencies, scripts | `build` |

`chore/`, `refactor/` and `test/` aren't prefixes. Pick the closest one above; the commit type can still be
`refactor`, `test`, `chore` or `perf` (see [commit.md](commit.md)).

### 3. Branch

```bash
git fetch origin
git switch -c feat/12-add-search origin/dev
```

Use lowercase kebab words after the number: `[a-z0-9._-]`. CI rejects uppercase letters and missing numbers.

### 4. Clean tree

`git status --short` must be empty. If you find someone else's uncommitted work, stop and ask the user. Don't
stash or discard it.

## Verify

- `git branch --show-current` matches `^(feat|fix|docs|ci|build)/[0-9]+-[a-z0-9._-]+$`.
- `git merge-base --is-ancestor origin/dev HEAD` succeeds.
- `gh issue view <n> --json state` says `OPEN`.

Reflow: a wrong name → step 3 (`git branch -m <new-name>` before pushing). Not based on the latest dev → step 3.
Issue closed or missing → step 1.

Next: make the change, then [commit.md](commit.md).
