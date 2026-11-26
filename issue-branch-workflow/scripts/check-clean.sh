#!/usr/bin/env bash
# Final check: nothing uncommitted, stashed or unpushed, in any worktree.
# Usage: check-clean.sh [branch ...]
#   With no branches, every local branch under feature/ must track a remote
#   branch and be in sync with it.
# Exit 0 = clean; 1 = something to fix (listed on stdout).
set -uo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
bad=0
report() { echo "$1"; [ -n "${2:-}" ] && printf '%s\n' "$2" | sed 's/^/    /'; bad=1; }

"$here/git-token.sh" fetch --quiet origin || report "PROBLEM: git fetch from origin failed"

while IFS= read -r wt; do
  [ -d "$wt" ] || continue
  out="$(git -C "$wt" status --porcelain)"
  [ -z "$out" ] || report "UNCOMMITTED changes in $wt:" "$out"
done < <(git worktree list --porcelain | sed -n 's/^worktree //p')

s="$(git stash list)"
[ -z "$s" ] || report "STASHES exist (explain them to the user):" "$s"

u="$(git log --branches --not --remotes --oneline)"
[ -z "$u" ] || report "UNPUSHED commits:" "$u"

if [ "$#" -gt 0 ]; then refs=(); for b in "$@"; do refs+=("refs/heads/$b"); done
else refs=(refs/heads/feature/); fi
while IFS='|' read -r branch upstream track; do
  [ -n "$branch" ] || continue
  if [ -z "$upstream" ]; then report "NO UPSTREAM: $branch (push it with git-token.sh push -u origin $branch)"
  elif [ "$upstream" != "origin/$branch" ]; then report "TRACKS THE WRONG BRANCH: $branch -> $upstream (push it with git-token.sh push -u origin $branch)"
  elif [ -n "$track" ] && [ "$track" != "[gone]" ]; then report "OUT OF SYNC: $branch $track"
  elif [ "$track" = "[gone]" ]; then report "REMOTE BRANCH GONE: $branch"
  fi
done < <(git for-each-ref --format='%(refname:short)|%(upstream:short)|%(upstream:track)' "${refs[@]}")

[ "$bad" -eq 0 ] && echo "clean: nothing uncommitted, stashed or unpushed"
exit "$bad"
