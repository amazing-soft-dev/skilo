#!/usr/bin/env bash
# Checks the environment and prints the paths the other steps use.
# Usage: preflight.sh            (run from anywhere inside the repo)
# Prints KEY=value lines on stdout and PROBLEM lines on stderr.
# Exit 0 = ready, 1 = at least one problem.
set -uo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
fail=0
problem() { echo "PROBLEM: $*" >&2; fail=1; }

git rev-parse --is-inside-work-tree >/dev/null 2>&1 \
  || { echo "PROBLEM: not inside a git repository" >&2; exit 1; }
common="$(git rev-parse --path-format=absolute --git-common-dir 2>/dev/null)" \
  || { echo "PROBLEM: git 2.31 or newer is required" >&2; exit 1; }
main="$(dirname "$common")"
ibw="$common/ibw"
mkdir -p "$ibw"

command -v gh >/dev/null 2>&1 || problem "the GitHub CLI (gh) is not installed"

origin="$(git -C "$main" remote get-url origin 2>/dev/null || true)"
case "$origin" in
  "") problem "there is no 'origin' remote" ;;
  *github.com[:/]*) ;;
  *) [ -n "${GH_HOST:-}" ] || problem "origin is not on github.com (set GH_HOST for GitHub Enterprise)" ;;
esac

login=""; default_branch=""
if [ -z "${GH_TOKEN:-}" ]; then
  problem "GH_TOKEN is not set; ask the user to export it (never paste it into chat)"
elif command -v gh >/dev/null 2>&1; then
  login="$(cd "$main" && gh api user --jq .login 2>/dev/null)" \
    || problem "GH_TOKEN is set but gh could not use it (expired or wrong token?)"
  perm="$(cd "$main" && gh repo view --json viewerPermission --jq .viewerPermission 2>/dev/null)" \
    || problem "gh could not read this repository with GH_TOKEN"
  case "${perm:-}" in
    WRITE|MAINTAIN|ADMIN) ;;
    *) problem "the token has '${perm:-no}' access to this repo; WRITE or higher is needed" ;;
  esac
  default_branch="$(cd "$main" && gh repo view --json defaultBranchRef --jq .defaultBranchRef.name 2>/dev/null || true)"
fi

[ -z "$(git -C "$main" status --porcelain)" ] \
  || problem "the main working tree has uncommitted changes; ask the user what to do with them"

if [ -n "${GH_TOKEN:-}" ]; then
  (cd "$main" && "$here/git-token.sh" fetch --quiet origin) || problem "git fetch from origin failed"
  git -C "$main" rev-parse --verify --quiet origin/dev >/dev/null \
    || problem "origin/dev does not exist; ask before creating it from the default branch"
fi

echo "MAIN=$main"
echo "SKILL=$(dirname "$here")"
echo "IBW_DIR=$ibw"
echo "DEFAULT_BRANCH=$default_branch"
echo "GH_LOGIN=$login"
exit "$fail"
