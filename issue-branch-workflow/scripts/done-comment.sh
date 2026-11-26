#!/usr/bin/env bash
# Posts the "branch finished" comment on an issue, once (REST API only).
# Usage: done-comment.sh <issue-number> <body-file>
# Adds the <!-- ibw:done --> marker itself; does nothing if a comment with
# that marker is already there.
set -euo pipefail
n="$1"; body="$2"
repo="repos/{owner}/{repo}"
marker="<!-- ibw:done -->"
[ -f "$body" ] || { echo "body file not found: $body" >&2; exit 1; }

if gh api --paginate "$repo/issues/$n/comments?per_page=100" --jq '.[].body' | grep -qF "$marker"; then
  echo "done comment already on #$n"; exit 0
fi
tmp="$(mktemp)"; trap 'rm -f "$tmp"' EXIT
{ printf '%s\n' "$marker"; cat "$body"; } > "$tmp"
gh api -X POST "$repo/issues/$n/comments" -F body=@"$tmp" >/dev/null
echo "posted done comment on #$n"
