#!/usr/bin/env bash
# Creates an issue for this run, or reuses the one an earlier attempt made.
# With a parent number, it also links the issue as a native sub-issue and
# adds "- [ ] #<n>" to the parent's checklist.
# Uses only GitHub's REST API (gh api), because some environments block the
# GraphQL API that "gh issue" and "gh label" depend on.
# Usage: new-issue.sh <run-id> <key> "<title>" <body-file> [parent-number]
# Prints the issue number on stdout.
set -euo pipefail
run="$1"; key="$2"; title="$3"; body="$4"; parent="${5:-}"
label="issue-branch-workflow"
repo="repos/{owner}/{repo}"

for v in "$run" "$key"; do
  printf '%s' "$v" | grep -qE '^[A-Za-z0-9._-]+$' \
    || { echo "run id and key may only use letters, digits, '.', '_' and '-': $v" >&2; exit 1; }
done
[ -f "$body" ] || { echo "body file not found: $body" >&2; exit 1; }
marker="<!-- ibw:run=$run:key=$key -->"

if ! gh api "$repo/labels/$label" >/dev/null 2>&1; then
  gh api -X POST "$repo/labels" -f name="$label" -f color=5319E7 \
    -f description="Created by issue-branch-workflow" >/dev/null
fi

num="$(gh api --paginate "$repo/issues?labels=$label&state=all&per_page=100" \
  --jq ".[] | select(.pull_request == null) | select((.body // \"\") | contains(\"$marker\")) | .number" \
  | head -n1)"

if [ -n "$num" ]; then
  echo "reusing #$num for key $key" >&2
else
  tmp="$(mktemp)"; trap 'rm -f "$tmp"' EXIT
  { printf '%s\n' "$marker"; cat "$body"; } > "$tmp"
  num="$(gh api -X POST "$repo/issues" -f title="$title" -F body=@"$tmp" \
    -f "labels[]=$label" --jq .number)"
  echo "created #$num for key $key" >&2
fi

if [ -n "$parent" ]; then
  child_id="$(gh api "$repo/issues/$num" --jq .id)"
  if ! gh api -X POST "$repo/issues/$parent/sub_issues" -F sub_issue_id="$child_id" >/dev/null 2>&1; then
    echo "note: #$num was not linked as a sub-issue of #$parent (already linked, or sub-issues are unavailable)" >&2
  fi
  pbody="$(mktemp)"
  gh api "$repo/issues/$parent" --jq '.body // ""' | tr -d '\r' \
    | awk '{ l[NR] = $0 } END { n = NR; while (n > 0 && l[n] == "") n--; for (i = 1; i <= n; i++) print l[i] }' > "$pbody"
  if ! grep -qE "^- \[[ x]\] #$num\$" "$pbody"; then
    printf -- '- [ ] #%s\n' "$num" >> "$pbody"
    gh api -X PATCH "$repo/issues/$parent" -F body=@"$pbody" >/dev/null
  fi
  rm -f "$pbody"
fi

echo "$num"
