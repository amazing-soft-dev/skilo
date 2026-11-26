# Commit

Use when the change is ready to record. CI rejects any non-Conventional subject, and the subject decides the
next version.

## Checklist

```
- [ ] 1. Local checks pass: the same commands ci.yml runs
- [ ] 2. Staged only intended files, by name
- [ ] 3. No secrets in the staged diff
- [ ] 4. Conventional Commit subject, body explains why
- [ ] 5. Unrelated changes are in separate commits
```

## Steps

### 1. Local checks

Read `.github/workflows/ci.yml` and run the same lint, format, type-check, test and build commands locally.
If a tool isn't installed and can't be, say so in the report. Never claim checks passed that you didn't run.

### 2. Stage

`git status` and `git diff`, then `git add <path> …`. Use `git add -A` only when every change is yours and
intended. Never stage build output, `.env*`, editor files, or anything `.gitignore` should cover.

### 3. Secrets

Read `git diff --staged` for keys, tokens, passwords, private URLs and certificates. If one is there, unstage it
(`git restore --staged <file>`), tell the user, and suggest `.gitignore` or a secret store. A secret that was
already pushed must be rotated; deleting the commit doesn't make it safe.

### 4. Message

```
<type>(<optional scope>)<! if breaking>: <imperative summary, ≤ 72 chars, no trailing period>

<body: what changed and why, wrapped at 72>

<footers: Closes #12 | BREAKING CHANGE: <what breaks and how to migrate> | Release-As: 2.0.0>
```

| Type | Use for | Version at release |
| --- | --- | --- |
| `feat` | new user-visible behavior | minor |
| `fix` | bug fix | patch |
| `perf` | faster, same behavior | patch |
| `revert` | revert an earlier commit | patch |
| `docs` `style` `refactor` `test` `build` `ci` `chore` | everything else | none |
| `!` or a `BREAKING CHANGE:` footer | incompatible change | major (minor before 1.0) |

Scope is lowercase and optional: `feat(search):`. `Closes #N` is optional when the branch carries the number.
The issue closes when the change reaches `main`, not `dev`.

### 5. Split

One logical change per commit: don't mix a refactor with a feature. Use `git add -p` to split a file.

## Verify

- `git log --format=%s origin/dev..HEAD --no-merges` lines all match
  `^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([A-Za-z0-9._/-]+\))?!?: .+`
- `git show --stat HEAD` lists only intended files.
- The local checks from step 1 pass on the committed tree.

Reflow: a bad subject → step 4 (`git commit --amend` for the last commit; for older commits, create a fresh
branch from `origin/dev` and recommit, since interactive rebase needs a terminal). Wrong files → step 2 (`git reset --soft HEAD~1`, restage).
Checks fail → fix the code, then step 1.

Next: [ship.md](ship.md).
