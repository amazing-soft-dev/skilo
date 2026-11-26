# Node.js (npm, pnpm, Yarn, bun): CI and versioning

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

## Node.js — `package.json` + `package-lock.json` / `pnpm-lock.yaml` / `yarn.lock` / `bun.lock`

```yaml
# recipe: node-npm
- uses: actions/setup-node@v7
  with:
    node-version-file: .nvmrc        # or package.json (engines.node)
    cache: npm
- run: npm ci
- run: npm run lint
- run: npm run typecheck
- run: npm test
- run: npm run build                 # build job
```

pnpm: add `- uses: pnpm/action-setup@v6` (it reads `packageManager` from `package.json`) before `setup-node`, then
use `cache: pnpm`, `pnpm install --frozen-lockfile`, `pnpm lint` and so on.
Yarn (Berry): `- run: corepack enable` before `setup-node`, `cache: yarn`, `yarn install --immutable`.

```yaml
# recipe: node-bun
- uses: oven-sh/setup-bun@v2
  with:
    bun-version-file: package.json
- run: bun install --frozen-lockfile
- run: bun run lint
- run: bun test
- run: bun run build                 # build job
```

- Versioning: `"release-type": "node"`. It updates `package.json` and `package-lock.json`. pnpm, Yarn and bun
  lockfiles don't store the project's own version, so they need no refresh.
- Dependabot: `npm` (also covers pnpm and Yarn), `bun` for bun.
- Publish (libraries): `actions/setup-node` with `registry-url: https://registry.npmjs.org`, then
  `npm publish --provenance --access public` with `NODE_AUTH_TOKEN`. Needs `id-token: write` permission.

## Verify

- `actionlint .github/workflows/*.yml` is clean (if available), and `check-setup.sh` has no "placeholder" FAIL.
- The commands from steps 2–3 pass locally on a clean checkout.

Reflow: a lint error → step 2 or 3. A command fails locally → fix the command or the project, then step 6.
Release PR CI fails after a bump → step 4 (lockfile or version file).
