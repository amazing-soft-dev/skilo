#!/usr/bin/env bash
# Sets up a GitHub repository that has no commits yet: makes a first commit
# (README.md) and pushes it as both the default branch and dev.
# Run it only after the user has said yes, and only from the main repo folder.
# Usage: init-empty-repo.sh <default-branch> <coauthors-file>
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
default="$1"; coauthors="$2"
[ -n "$default" ] || { echo "usage: init-empty-repo.sh <default-branch> <coauthors-file>" >&2; exit 1; }

if [ -n "$("$here/git-token.sh" ls-remote --heads origin)" ]; then
  echo "refused: origin already has branches; this is only for an empty repository" >&2; exit 3
fi

if ! git rev-parse --verify --quiet HEAD >/dev/null; then
  git symbolic-ref HEAD "refs/heads/$default"
  name="$(basename "$(git rev-parse --show-toplevel)")"
  [ -e README.md ] || printf '# %s\n' "$name" > README.md
  git add README.md
  msg="$(mktemp)"; trap 'rm -f "$msg"' EXIT
  printf 'chore: initial commit\n\nAdd a README so the repository has a %s branch and a dev\nbranch to build feature branches from.\n' "$default" > "$msg"
  "$here/commit.sh" "$msg" "$coauthors"
fi

IBW_BOOTSTRAP=1 "$here/git-token.sh" push origin "HEAD:refs/heads/$default" "HEAD:refs/heads/dev"
"$here/git-token.sh" fetch --quiet origin
git branch --set-upstream-to="origin/$default" >/dev/null
echo "created $default and dev on origin"
