#!/usr/bin/env bash
# Creates an issue for this run, or reuses the one an earlier attempt made.
# With a parent number, it also links the issue as a native sub-issue and
# adds "- [ ] #<n>" to the parent's checklist.
# Usage: new-issue.sh <run-id> <key> "<title>" <body-file> [parent-number]
# Prints the issue number on stdout.
set -euo pipefail
run="$1"; key="$2"; title="$3"; body="$4"; parent="${5:-}"
label="issue-branch-workflow"

for v in "$run" "$key"; do
  printf '%s' "$v" | grep -qE '^[A-Za-z0-9._-]+$' \
    || { echo "run id and key may only use letters, digits, '.', '_' and '-': $v" >&2; exit 1; }
done
[ -f "$body" ] || { echo "body file not found: $body" >&2; exit 1; }
marker="<!-- ibw:run=$run:key=$key -->"

if ! gh label list --limit 500 --json name --jq '.[].name' | grep -qxF "$label"; then
  gh label create "$label" --color 5319E7 \
    --description "Created by issue-branch-workflow" >/dev/null
fi

num="$(gh issue list --label "$label" --state all --limit 500 --json number,body \
  --jq ".[] | select(.body | contains(\"$marker\")) | .number" | head -n1)"

if [ -n "$num" ]; then
  echo "reusing #$num for key $key" >&2
else
  tmp="$(mktemp)"; trap 'rm -f "$tmp"' EXIT
  { printf '%s\n' "$marker"; cat "$body"; } > "$tmp"
  url="$(gh issue create --title "$title" --label "$label" --body-file "$tmp")"
  num="${url##*/}"
  echo "created #$num for key $key" >&2
fi

if [ -n "$parent" ]; then
  child_id="$(gh api "repos/{owner}/{repo}/issues/$num" --jq .id)"
  if ! gh api -X POST "repos/{owner}/{repo}/issues/$parent/sub_issues" \
        -F sub_issue_id="$child_id" >/dev/null 2>&1; then
    echo "note: #$num was not linked as a sub-issue of #$parent (already linked, or sub-issues are unavailable)" >&2
  fi
  pbody="$(mktemp)"
  gh issue view "$parent" --json body --jq .body > "$pbody"
  if ! grep -qE "^- \[[ x]\] #$num\$" "$pbody"; then
    printf -- '- [ ] #%s\n' "$num" >> "$pbody"
    gh issue edit "$parent" --body-file "$pbody" >/dev/null
  fi
  rm -f "$pbody"
fi

echo "$num"
