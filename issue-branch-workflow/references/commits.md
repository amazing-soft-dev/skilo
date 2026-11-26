# Commit messages, trailers and closing keywords

## Message format

If the repo has its own commit style, use it. Otherwise use Conventional Commits:

```
feat(auth): add sliding-window rate limiter for login

Limit login attempts to 5 per minute per IP to slow down
credential-stuffing. Uses the existing Redis client so no new
dependency is added.

Refs #14
```

- **Subject:** about 72 characters at most, imperative mood, no trailing period. It must match the issue's task line word for word.
- **Body:** what changed and why, wrapped at about 72 characters.
- **Issue reference:** in its own paragraph (see the closing keywords below).
- **No trailers in the message file.** `commit.sh` adds them as the final paragraph, which is where GitHub looks for co-authors.

## The `.coauthors` file

It sits at the repo root and holds one git trailer per line, in the order they should appear. Blank lines and lines starting with `#` are ignored. Any trailer type works:

| Trailer | Value | Typical use |
|---|---|---|
| `Co-authored-by` | `Name <email>` | people who wrote the code with you; GitHub shows them as co-authors |
| `Signed-off-by` | `Name <email>` | DCO sign-off |
| `Reviewed-by` | `Name <email>` | review credit |
| `Assisted-by` | free text | tools or helpers that are not GitHub users |
| any other `Key: value` | free text | team conventions |

What `commit.sh` enforces:
- Every line must look like `Key: value`.
- `Co-authored-by`, `Signed-off-by`, `Reviewed-by`, `Acked-by` and `Tested-by` lines must contain an `<email>`.
- Any line naming Claude or an `@anthropic.com` address is skipped. Tell the user when this happens.
- Malformed lines are skipped and reported. Tell the user.
- After committing, it checks that every valid line made it into the commit and that no AI attribution got in.

## Closing keywords

GitHub only acts on `Closes #N`, `Fixes #N` and `Resolves #N` when the commit or PR reaches the **default** branch. Check `DEFAULT_BRANCH` from `preflight.sh`:

- **`dev` is not the default branch:** use `Refs #N` in every commit. The issue stays open until it is closed by a PR into the default branch that says `Closes #N`, or by hand.
- **`dev` is the default branch:** use `Refs #N` in every commit except the branch's last one, which uses `Closes #N`. The issue then closes when the branch is merged.

Write the choice into the plan so the user can see it before approving.
