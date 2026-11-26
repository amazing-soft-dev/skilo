#!/usr/bin/env bash
# Ticks one task line ("- [ ] <text>") in an issue body (REST API only).
# Usage: tick.sh <issue-number> "<exact task text>"
#   tick.sh 42 "feat(auth): add sliding-window rate limiter"
#   tick.sh 41 "#42"          (parent checklist)
# Exit 0 = ticked or already ticked; 1 = line not found.
set -euo pipefail
n="$1"; text="$2"
repo="repos/{owner}/{repo}"
before="$(mktemp)"; after="$(mktemp)"
trap 'rm -f "$before" "$after"' EXIT

gh api "$repo/issues/$n" --jq '.body // ""' | tr -d '\r' \
  | awk '{ l[NR] = $0 } END { n = NR; while (n > 0 && l[n] == "") n--; for (i = 1; i <= n; i++) print l[i] }' > "$before"
if grep -qxF -- "- [x] $text" "$before"; then
  echo "already ticked on #$n: $text"; exit 0
fi
awk -v s="- [ ] $text" -v r="- [x] $text" \
  '!done && $0 == s { print r; done = 1; next } { print }' "$before" > "$after"
if cmp -s "$before" "$after"; then
  echo "NOTE: task line not found on #$n: $text" >&2; exit 1
fi
gh api -X PATCH "$repo/issues/$n" -F body=@"$after" >/dev/null
echo "ticked on #$n: $text"
