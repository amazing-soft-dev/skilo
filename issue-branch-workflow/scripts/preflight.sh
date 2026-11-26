#!/usr/bin/env bash
# Checks the environment and prints the paths the other steps use.
# Uses only GitHub's REST API (gh api), because some environments block the
# GraphQL API that "gh repo view" and "gh issue" depend on.
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

# Raw URL (no insteadOf rewriting). gh works out owner/repo from it; when the
# remote is not a github.com URL (a proxy or mirror), set GH_REPO=owner/repo.
origin="$(git -C "$main" config --get remote.origin.url 2>/dev/null || true)"
case "$origin" in
  "") problem "there is no 'origin' remote" ;;
  *"${GH_HOST:-github.com}"[:/]*) ;;
  *) [ -n "${GH_REPO:-}" ] || problem "origin ($origin) is not a ${GH_HOST:-github.com} URL; set GH_REPO=owner/repo so gh knows the repository" ;;
esac

login=""; default_branch=""; empty="no"
if [ -z "${GH_TOKEN:-}" ]; then
  problem "GH_TOKEN is not set; ask the user to export it (never paste it into chat)"
elif command -v gh >/dev/null 2>&1; then
  login="$(cd "$main" && gh api user --jq .login 2>/dev/null)" \
    || problem "GH_TOKEN is set but gh could not use it (expired or wrong token?)"
  info="$(cd "$main" && gh api 'repos/{owner}/{repo}' --jq '"\(.permissions.push) \(.default_branch) \(.has_issues)"' 2>&1)" \
    || problem "gh could not read this repository with GH_TOKEN: $info"
  read -r can_push default_branch has_issues <<< "${info:-}"
  [ "${can_push:-}" = "true" ] || problem "the token cannot push to this repository; it needs write access"
  [ "${has_issues:-}" = "true" ] || problem "issues are turned off for this repository"
fi

[ -z "$(git -C "$main" status --porcelain)" ] \
  || problem "the main working tree has uncommitted changes; ask the user what to do with them"

if [ -n "${GH_TOKEN:-}" ]; then
  heads="$(cd "$main" && "$here/git-token.sh" ls-remote --heads origin 2>/dev/null)" \
    || problem "could not reach origin with GH_TOKEN"
  if [ -z "${heads:-}" ]; then
    empty="yes"
    problem "the repository is empty (no branches); ask before running init-empty-repo.sh"
  else
    (cd "$main" && "$here/git-token.sh" fetch --quiet origin) || problem "git fetch from origin failed"
    git -C "$main" rev-parse --verify --quiet origin/dev >/dev/null \
      || problem "origin/dev does not exist; ask before creating it from origin/${default_branch:-<default>}"
  fi
fi

echo "MAIN=$main"
echo "SKILL=$(dirname "$here")"
echo "IBW_DIR=$ibw"
echo "DEFAULT_BRANCH=$default_branch"
echo "EMPTY_REPO=$empty"
echo "GH_LOGIN=$login"
exit "$fail"
