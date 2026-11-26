#!/usr/bin/env bash
# Runs one git command authenticated with GH_TOKEN.
# The token is read from the environment only when git asks for credentials,
# so it never appears on the command line, in .git/config, in the remote URL
# or in logs. SSH remotes are reached over HTTPS for this command only.
#
# Usage: git-token.sh <git arguments...>
#   git-token.sh fetch origin
#   git-token.sh push -u origin feature/42-login-rate-limit
#
# For pushes it refuses force, delete and mirror, and pushes to dev, main or
# master. The one exception is init-empty-repo.sh, which sets IBW_BOOTSTRAP=1
# to create the first branches of a repository that has none.
set -euo pipefail
[ -n "${GH_TOKEN:-}" ] || { echo "GH_TOKEN is not set" >&2; exit 2; }

host="${GH_HOST:-github.com}"
helper='!f() { test "$1" = get || exit 0; echo username=x-access-token; echo "password=$GH_TOKEN"; }; f'
auth=(
  -c credential.helper=
  -c "credential.https://$host.helper="
  -c "credential.https://$host.helper=$helper"
  -c "url.https://$host/.insteadOf=git@$host:"
  -c "url.https://$host/.insteadOf=ssh://git@$host/"
)

if [ "${1:-}" = "push" ]; then
  allow_protected=0
  if [ "${IBW_BOOTSTRAP:-}" = "1" ]; then
    if [ -n "$(git "${auth[@]}" ls-remote --heads origin)" ]; then
      echo "refused: IBW_BOOTSTRAP is only for a repository with no branches" >&2; exit 3
    fi
    allow_protected=1
  fi
  for arg in "$@"; do
    case "$arg" in
      -f|--force|--force-with-lease|--force-with-lease=*|--force-if-includes|--mirror|--delete|-d|--prune|+*)
        echo "refused: '$arg' is not allowed by issue-branch-workflow" >&2; exit 3 ;;
      dev|main|master|*:dev|*:main|*:master|refs/heads/dev|refs/heads/main|refs/heads/master|*:refs/heads/dev|*:refs/heads/main|*:refs/heads/master)
        if [ "$allow_protected" != 1 ]; then
          echo "refused: never push directly to '$arg'" >&2; exit 3
        fi ;;
    esac
  done
fi

exec git "${auth[@]}" "$@"
