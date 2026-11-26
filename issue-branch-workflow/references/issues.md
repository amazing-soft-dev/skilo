# Issue and comment templates

Write each body to a temporary file and pass it to `scripts/new-issue.sh`. The script adds the hidden run marker itself, so leave it out of these bodies.

## Parent issue

```markdown
## Goal
<one paragraph from the plan>

## Sub-issues
```

Leave the `## Sub-issues` section empty. `new-issue.sh` adds a `- [ ] #<n>` line for each child as it is created, and the child is also linked as a native sub-issue.

## Child issue

```markdown
## Summary
<scope>

## Tasks
- [ ] feat(auth): add sliding-window rate limiter
- [ ] test(auth): cover limiter edge cases

## Acceptance criteria
- <criterion>

## Dependencies
Part of #<parent>. Blocked by #<n>.   (drop "Blocked by" if there is none)
```

Each task line must match its planned commit subject word for word, so `tick.sh` can tick it after the push.

## "Done" comment (step 7)

Write this to a file and pass it to `scripts/done-comment.sh <n> <file>`. The script adds the `<!-- ibw:done -->` marker, and skips posting if a comment with that marker is already there.

```markdown
All planned commits are pushed to `<branch>`.

Commits:
- <short sha> <subject>

Tests: <command and result>
```

Do not put any Claude attribution in issues or comments.
