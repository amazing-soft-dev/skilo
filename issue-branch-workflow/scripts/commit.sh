#!/usr/bin/env bash
# Commits staged changes with the trailers from .coauthors, then verifies.
# Usage: commit.sh <message-file> <coauthors-file>
# The message file holds subject, body and the "Refs #N" paragraph, with no
# trailers. Any AI attribution in it is removed. Lines in .coauthors that
# name Claude or an @anthropic.com address, or are malformed, are skipped
# and reported on stderr.
# Exit 0 = committed and verified; 1 = verification failed (amend before pushing).
set -euo pipefail
msg="$1"; coauthors="$2"
[ -s "$msg" ] || { echo "message file is empty or missing: $msg" >&2; exit 1; }
git diff --cached --quiet && { echo "nothing is staged" >&2; exit 1; }

ai_line='@anthropic\.com|^[A-Za-z][A-Za-z0-9-]*:[[:space:]]*claude([[:space:]]|<|$)'
needs_email='^(co-authored-by|signed-off-by|reviewed-by|acked-by|tested-by):'
args=(); want=()

if [ -f "$coauthors" ]; then
  while IFS= read -r line || [ -n "$line" ]; do
    line="${line%$'\r'}"
    line="$(printf '%s' "$line" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"
    case "$line" in ''|'#'*) continue ;; esac
    if printf '%s\n' "$line" | grep -qiE "$ai_line"; then
      echo "skipped (AI attribution is not allowed): $line" >&2; continue
    fi
    if ! printf '%s\n' "$line" | grep -qE '^[A-Za-z][A-Za-z0-9-]*: .+$'; then
      echo "skipped (not 'Key: value'): $line" >&2; continue
    fi
    if printf '%s\n' "$line" | grep -qiE "$needs_email" \
       && ! printf '%s\n' "$line" | grep -qE '<[^<>@[:space:]]+@[^<>[:space:]]+>$'; then
      echo "skipped (needs 'Name <email>'): $line" >&2; continue
    fi
    args+=(--trailer "$line"); want+=("$line")
  done < "$coauthors"
else
  echo "note: $coauthors not found; committing without trailers" >&2
fi

# Remove attribution lines an agent or tool may have added.
strip='^(co-authored-by|assisted-by):.*(claude|anthropic\.com)|generated with \[?claude|claude\.ai/code/session_'
grep -viE "$strip" "$msg" > "$msg.clean" || true
mv "$msg.clean" "$msg"

git interpret-trailers --in-place --if-exists addIfDifferent ${args[@]+"${args[@]}"} "$msg"
git commit --quiet -F "$msg"

body="$(git log -1 --format=%B)"
status=0
if printf '%s\n' "$body" | grep -qiE "$strip"; then
  echo "ERROR: AI attribution found in the commit message" >&2; status=1
fi
for t in ${want[@]+"${want[@]}"}; do
  printf '%s\n' "$body" | grep -qxF "$t" || { echo "ERROR: trailer missing: $t" >&2; status=1; }
done
git log -1 --format='committed %h %s'
exit "$status"
