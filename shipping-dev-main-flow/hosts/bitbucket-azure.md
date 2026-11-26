# Bitbucket Cloud and Azure DevOps

Use when the repo is on Bitbucket or Azure DevOps. **Untested**: port the two GitHub scripts
(`assets/github/workflows/open-pull-request.yml`, `merge-passing-pr.yml`) to the host's CLI or REST API, then run
every scenario in [../workflows/verify-flow.md](../workflows/verify-flow.md).

## Checklist

```
- [ ] 1. main and dev protected: PR-only, merge commit only
- [ ] 2. A passing build required before merge
- [ ] 3. PR-opening and auto-merge scripts ported
- [ ] 4. Versioning via commitizen; dependency updates via Renovate
- [ ] 5. verify-flow scenarios pass
```

## Mapping

The same rules apply. Map them to native settings, and port the two scripts (`open-pull-request`, `merge`) to
the host's CLI or REST API:

| Piece | Bitbucket Cloud | Azure DevOps |
| --- | --- | --- |
| Block pushes to `dev`/`main` | Branch restrictions: no direct writes, merge via PR only | Branch policies: require a PR |
| Required CI | Merge checks: minimum successful builds = 1 | Build validation policy |
| Merge commit only | Merge strategies: "Merge commit" only | Limit merge types: basic merge (no fast-forward) |
| Auto-merge | Pipeline step calling the merge REST endpoint after the build passes | Auto-complete set by the PR-opening script |
| Release versioning | commitizen in a pipeline on `main` (as GitLab) | commitizen in a pipeline on `main` |
| Dependency PRs | Renovate | Renovate |

## Verify

All scenarios in [../workflows/verify-flow.md](../workflows/verify-flow.md) pass.

Reflow: map each failure to the checklist item for that piece, fix it, and re-run that scenario.
