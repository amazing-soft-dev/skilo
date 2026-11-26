# State file and resuming

The state file is `<IBW_DIR>/state.json`. `IBW_DIR` is inside `.git`, so the file is never committed, and every worktree of the repo shares it. Update it after each step, so an interrupted run can pick up where it stopped.

```json
{
  "run": "ibw-20261125-2109",
  "status": "approved",
  "plan": "/abs/path/.git/ibw/plan.md",
  "default_branch": "main",
  "parent": 41,
  "issues": [
    {
      "key": "A",
      "title": "Add rate limiting to login",
      "number": 42,
      "branch": "feature/42-login-rate-limit",
      "base": "dev",
      "worktree": "/abs/path/repo-worktrees/feature/42-login-rate-limit",
      "status": "in-progress",
      "commits": ["feat(auth): add sliding-window rate limiter"]
    }
  ]
}
```

- **Run statuses:** `planning`, then `approved`, then `done`.
- **Issue statuses:** `planned`, `issue-created`, `in-progress`, `pushed`.
- **Run id:** `ibw-YYYYMMDD-HHMM`, using letters, digits, `.`, `_` and `-` only. `new-issue.sh` builds its markers from it.

## Resuming (preflight step 2)

1. Look at three sources:
   - the state file, if it exists
   - issues from earlier runs: `gh issue list --label issue-branch-workflow --state open`
   - remote branches: `git ls-remote --heads origin 'feature/*'`
2. If any of them show an unfinished run, tell the user what is done and what is left. Ask: **Resume** / **Start a new run**.
3. **Resume:** continue from the first step that is not done. If the sources disagree, trust GitHub and the remote branches over the state file, and correct the file.
   - A commit subject in the state file that is not on the remote branch means that commit still needs pushing.
   - A ticked task with no matching commit means the box should be unticked.
   - `new-issue.sh` reuses an existing issue when it finds the run marker, so running it again is safe.
4. **Start a new run:** use a new run id. Leave the old issues and branches alone unless the user says otherwise.
5. **No state file and no marked issues:** this is a fresh run. Set the status to `planning` while you write the plan.
