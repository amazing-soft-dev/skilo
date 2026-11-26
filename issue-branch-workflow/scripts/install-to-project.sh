#!/usr/bin/env bash
# Makes sure the current repo has its own copy of this skill, and prints
# where it is. The project copy is the one to follow: the user may have
# edited it, so it is never overwritten.
# Usage: install-to-project.sh          (run from inside the repo)
# Prints: PROJECT_COPY=<path> and STATUS=this-copy|existing|installed
set -euo pipefail
src="$(cd "$(dirname "$0")/.." && pwd -P)"
common="$(git rev-parse --path-format=absolute --git-common-dir 2>/dev/null)" \
  || { echo "not inside a git repository (git 2.31+ required)" >&2; exit 1; }
main="$(dirname "$common")"
rel=".claude/skills/issue-branch-workflow"
dst="$main/$rel"
version() { sed -n 's/.*ibw-version: \([0-9][0-9]*\).*/\1/p' "$1/SKILL.md" | head -n1; }

if [ -d "$dst" ] && [ "$(cd "$dst" && pwd -P)" = "$src" ]; then
  status=this-copy
elif [ -f "$dst/SKILL.md" ]; then
  status=existing
  have="$(version "$dst")"; new="$(version "$src")"
  if [ -n "$have" ] && [ -n "$new" ] && [ "$have" -lt "$new" ]; then
    echo "NOTE: the project copy is version $have; version $new is available. Update only if the user asks." >&2
  fi
else
  mkdir -p "$dst"
  cp -R "$src/." "$dst/"
  chmod +x "$dst"/scripts/*.sh 2>/dev/null || true
  if ! git -C "$main" ls-files --error-unmatch "$rel/SKILL.md" >/dev/null 2>&1; then
    exclude="$common/info/exclude"; mkdir -p "$(dirname "$exclude")"; touch "$exclude"
    grep -qxF "/$rel/" "$exclude" || printf '/%s/\n' "$rel" >> "$exclude"
  fi
  status=installed
fi
echo "PROJECT_COPY=$dst"
echo "STATUS=$status"
