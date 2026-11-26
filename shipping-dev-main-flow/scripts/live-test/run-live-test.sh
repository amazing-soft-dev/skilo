#!/usr/bin/env bash
# Live end-to-end test of the shipping-dev-main-flow skill.
#
#   bash run-live-test.sh OWNER/REPO
#
# Run it from Git Bash (Windows), macOS or Linux, in a shell where GH_TOKEN is set.
# The token is never printed. git and gh read it from the environment.
# WARNING: it replaces main and dev in OWNER/REPO. Use a throwaway repository.
set -uo pipefail

REPO="${1:?usage: bash run-live-test.sh OWNER/REPO}"
HERE="$(cd "$(dirname "$0")" && pwd)"
LOG="$HERE/live-test-$(date +%Y%m%d-%H%M%S).log"
exec > >(tee -a "$LOG") 2>&1

PASS=0; FAIL=0
ok()   { echo "PASS $*"; PASS=$((PASS + 1)); }
bad()  { echo "FAIL $*"; FAIL=$((FAIL + 1)); }
step() { echo; echo "=== $* ($(date +%H:%M:%S))"; }
note() { echo "     $*"; }

# git with gh as the credential helper, for this script only (no global config changes).
G() { git -c credential.helper= -c 'credential.helper=!gh auth git-credential' "$@"; }

# ---------------------------------------------------------------- preflight
step "Preflight"
command -v git >/dev/null || { echo "git is not installed"; exit 1; }
command -v gh  >/dev/null || { echo "GitHub CLI (gh) is not installed: https://cli.github.com"; exit 1; }
[ -n "${GH_TOKEN:-}" ] || { echo "GH_TOKEN is not set in this shell"; exit 1; }
gh api "repos/$REPO" --jq .full_name >/dev/null || { echo "Cannot read $REPO with this token"; exit 1; }
note "gh $(gh --version | head -1 | awk '{print $3}'), git $(git --version | awk '{print $3}')"
ADMIN=$(gh api "repos/$REPO" --jq .permissions.admin)
[ "$ADMIN" = true ] && ok "token has admin on $REPO" || bad "token is not admin on $REPO (settings and rulesets need admin)"
if gh secret list -R "$REPO" 2>/dev/null | grep -q '^GH_TOKEN'; then ok "repository secret GH_TOKEN exists"
else bad "repository secret GH_TOKEN not found (Settings → Secrets and variables → Actions)"; fi

echo
echo "This REPLACES main and dev in $REPO, deletes its other branches, open PRs, releases and v* tags,"
echo "and creates issues, PRs and releases. Only use a throwaway repository."
read -r -p "Type the repository name ($REPO) to continue: " answer
[ "$answer" = "$REPO" ] || { echo "Cancelled."; exit 1; }

START_TIME=$(date -u +%Y-%m-%dT%H:%M:%SZ)
WORK="$(mktemp -d)"

# ---------------------------------------------------------------- helpers
max_number() { gh api "repos/$REPO/issues?state=all&per_page=1&sort=created&direction=desc" --jq '.[0].number // 0'; }
new_issue()  { gh issue create -R "$REPO" --title "$1" --body "Created by the dev-main flow live test." | grep -oE '[0-9]+$'; }
latest_pr()  { gh pr list -R "$REPO" --head "$1" --base "$2" --state all --limit 50 --json number --jq 'map(.number) | max // 0'; }
pr_state()   { gh pr view "$1" -R "$REPO" --json state --jq .state; }
open_prs()   { gh pr list -R "$REPO" --state open --json number,headRefName,baseRefName --jq '.[] | "#\(.number) \(.headRefName) → \(.baseRefName)"'; }

# wait_new_pr HEAD BASE AFTER_NUMBER [TIMEOUT] → prints the PR number
wait_new_pr() {
  local start=$SECONDS n
  while (( SECONDS - start < ${4:-600} )); do
    n=$(latest_pr "$1" "$2"); if (( n > $3 )); then echo "$n"; return 0; fi
    sleep 15
  done
  return 1
}
# wait_merged PR [TIMEOUT]
wait_merged() {
  local start=$SECONDS s
  while (( SECONDS - start < ${2:-900} )); do
    s=$(pr_state "$1"); [ "$s" = MERGED ] && return 0
    [ "$s" = CLOSED ] && return 1
    sleep 15
  done
  return 1
}
wait_issue_closed() {
  local start=$SECONDS
  while (( SECONDS - start < 300 )); do
    [ "$(gh issue view "$1" -R "$REPO" --json state --jq .state)" = CLOSED ] && return 0
    sleep 15
  done
  return 1
}
latest_tag() { gh release list -R "$REPO" --limit 1 --json tagName --jq '.[0].tagName // ""'; }
wait_new_release() {  # BEFORE_TAG → prints new tag
  local start=$SECONDS t
  while (( SECONDS - start < 600 )); do
    t=$(latest_tag); if [ -n "$t" ] && [ "$t" != "$1" ]; then echo "$t"; return 0; fi
    sleep 15
  done
  return 1
}
explain_pr() {  # dump checks and runs to help diagnose a stuck PR
  note "PR #$1 state: $(pr_state "$1")"
  gh pr checks "$1" -R "$REPO" 2>&1 | sed 's/^/       /' | head -20
  gh run list -R "$REPO" --limit 8 2>&1 | sed 's/^/       /'
}

# release_cycle BASELINE: after a change reaches main, expect release PR → merge → tag → back-merge → equal trees
release_cycle() {
  local base=$1 label=$2 before_tag=$3 rp bm tag files
  if rp=$(wait_new_pr release-please--branches--main main "$base"); then ok "$label: release PR #$rp opened"
  else bad "$label: no release PR opened"; gh run list -R "$REPO" --workflow Release --limit 3; return 1; fi
  files=$(gh pr view "$rp" -R "$REPO" --json files --jq '.files[].path' | tr '\n' ' ')
  [[ "$files" == *pyproject.toml* && "$files" == *CHANGELOG.md* ]] && ok "$label: release PR bumps pyproject.toml and CHANGELOG.md" \
    || bad "$label: release PR files were: $files"
  if wait_merged "$rp"; then ok "$label: release PR #$rp auto-merged"; else bad "$label: release PR #$rp not merged"; explain_pr "$rp"; return 1; fi
  gh pr view "$rp" -R "$REPO" --json commits --jq '.commits[].messageHeadline' | grep -q "refresh lockfile" \
    && ok "$label: lockfile-refresh job added its commit" || note "no lockfile-refresh commit (fine only if uv.lock was already current)"
  if tag=$(wait_new_release "$before_tag"); then ok "$label: GitHub release $tag created"; else bad "$label: no new release/tag"; return 1; fi
  if bm=$(wait_new_pr main dev "$base"); then ok "$label: back-merge PR #$bm opened (main → dev)"
  else bad "$label: no back-merge PR"; return 1; fi
  if wait_merged "$bm"; then ok "$label: back-merge PR #$bm auto-merged"; else bad "$label: back-merge #$bm not merged"; explain_pr "$bm"; return 1; fi
  sleep 90
  G -C "$WORK/repo" fetch -q origin
  if git -C "$WORK/repo" diff --quiet origin/main origin/dev; then ok "$label: dev and main have the same files"
  else bad "$label: dev and main differ after back-merge"; fi
  local left; left=$(open_prs)
  [ -z "$left" ] && ok "$label: no PRs left open (no release loop)" || bad "$label: PRs still open: $left"
  local v; v=$(git -C "$WORK/repo" show origin/main:pyproject.toml | grep -m1 '^version' | cut -d'"' -f2)
  [ "v$v" = "$tag" ] && ok "$label: pyproject.toml on main is $v, matching $tag" || bad "$label: pyproject.toml says $v but tag is $tag"
  LAST_TAG=$tag
}

# ---------------------------------------------------------------- reset the sandbox
step "Reset $REPO"
for id in $(gh api "repos/$REPO/rulesets" --jq '.[] | select(.name | test("^Protect (main|dev|release tags)$")) | .id' 2>/dev/null); do
  gh api -X DELETE "repos/$REPO/rulesets/$id" >/dev/null && note "removed old ruleset $id"
done
for n in $(gh pr list -R "$REPO" --state open --json number --jq '.[].number'); do gh pr close "$n" -R "$REPO" >/dev/null; done
for t in $(gh release list -R "$REPO" --limit 100 --json tagName --jq '.[].tagName'); do gh release delete "$t" -R "$REPO" --yes --cleanup-tag >/dev/null; done
G clone -q "https://github.com/$REPO.git" "$WORK/repo" 2>/dev/null || { echo "clone failed"; exit 1; }
cd "$WORK/repo" || { echo "cannot enter the clone"; exit 1; }
git config user.name  >/dev/null || git config user.name  "flow live test"
git config user.email >/dev/null || git config user.email "flow-live-test@users.noreply.github.com"
git config core.autocrlf false
for t in $(git ls-remote --tags origin 'v*' | awk '{print $2}' | grep -v '\^{}'); do G push -q origin ":$t"; done
for b in $(git ls-remote --heads origin | awk '{print $2}' | sed 's#refs/heads/##' | grep -vxE 'main|dev'); do G push -q origin --delete "$b"; done

# ---------------------------------------------------------------- bootstrap
step "Bootstrap the flow"
git checkout -q --orphan flow-bootstrap
git rm -rqf --cached . >/dev/null 2>&1 || true
[ "$(pwd)" = "$WORK/repo" ] && [ -d .git ] || { echo "refusing to clean outside the clone"; exit 1; }
find . -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
cp -R "$HERE/project/." .
git add -A
git commit -qm "chore: bootstrap dev-main flow live test"
G push -q -f origin HEAD:main && G push -q -f origin HEAD:dev && ok "pushed main and dev" || { bad "bootstrap push failed"; exit 1; }
gh api -X PATCH "repos/$REPO" -f default_branch=main -F allow_merge_commit=true -F delete_branch_on_merge=true \
  -F has_issues=true >/dev/null && ok "default branch main, merge commits allowed, head branches auto-deleted" \
  || bad "could not update repository settings"
RS_OK=1
for f in dev main tags; do
  gh api -X POST "repos/$REPO/rulesets" --input ".github/rulesets/$f.json" >/dev/null || RS_OK=0
done
[ $RS_OK = 1 ] && ok "rulesets dev, main and tags imported" || bad "ruleset import failed"
note "waiting 60s for the bootstrap workflow runs to settle"; sleep 60
LAST_TAG=$(latest_tag)

# ---------------------------------------------------------------- scenario A
scenario_a() {
  step "Scenario A: docs change → dev → main, issue closes, no release"
  local base A br pr rel
  base=$(max_number); A=$(new_issue "Live test A: docs change"); br="docs/$A-live-test"
  G fetch -q origin && git switch -q -c "$br" origin/dev
  echo "- Scenario A ran at $(date -u +%FT%TZ)" >> docs/live-test.md
  git add docs/live-test.md && git commit -qm "docs: record live test A" && G push -q -u origin HEAD
  if pr=$(wait_new_pr "$br" dev "$base"); then ok "A: PR #$pr opened into dev automatically"; else bad "A: no PR into dev"; gh run list -R "$REPO" --limit 5; return; fi
  gh pr view "$pr" -R "$REPO" --json title --jq .title | grep -q "^docs: record live test A$" && ok "A: PR title is the first commit subject" || bad "A: unexpected PR title"
  if wait_merged "$pr"; then ok "A: PR #$pr auto-merged into dev"; else bad "A: PR #$pr not merged"; explain_pr "$pr"; return; fi
  if rel=$(wait_new_pr dev main "$base"); then ok "A: dev → main PR #$rel opened"; else bad "A: no dev → main PR"; return; fi
  gh pr view "$rel" -R "$REPO" --json body --jq .body | grep -q "Closes #$A" && ok "A: dev → main body says Closes #$A" || bad "A: dev → main body lacks Closes #$A"
  if wait_merged "$rel"; then ok "A: dev → main PR #$rel auto-merged"; else bad "A: dev → main #$rel not merged"; explain_pr "$rel"; return; fi
  wait_issue_closed "$A" && ok "A: issue #$A closed" || bad "A: issue #$A still open"
  sleep 90
  [ "$(latest_pr release-please--branches--main main)" -le "$base" ] && ok "A: docs-only change opened no release PR" || bad "A: a release PR opened for a docs-only change"
  [ -z "$(open_prs)" ] && ok "A: no PRs left open" || bad "A: PRs still open: $(open_prs)"
}

# ---------------------------------------------------------------- scenario B
scenario_b() {
  step "Scenario B: fix → dev → main → release PR → tag → back-merge"
  local base B br pr rel
  base=$(max_number); B=$(new_issue "Live test B: fix"); br="fix/$B-live-test"
  G fetch -q origin && git switch -q -c "$br" origin/dev
  sed -i 's/return f"Hello, {name}!"/return f"Hello, {name.strip()}!"/' src/flowdemo/__init__.py
  git commit -qam "fix(greet): ignore surrounding whitespace in names" && G push -q -u origin HEAD
  if pr=$(wait_new_pr "$br" dev "$base"); then ok "B: PR #$pr opened into dev"; else bad "B: no PR into dev"; return; fi
  if wait_merged "$pr"; then ok "B: PR #$pr auto-merged into dev"; else bad "B: PR #$pr not merged"; explain_pr "$pr"; return; fi
  if rel=$(wait_new_pr dev main "$base"); then ok "B: dev → main PR #$rel opened"; else bad "B: no dev → main PR"; return; fi
  if wait_merged "$rel"; then ok "B: dev → main PR #$rel auto-merged"; else bad "B: dev → main #$rel not merged"; explain_pr "$rel"; return; fi
  wait_issue_closed "$B" && ok "B: issue #$B closed" || bad "B: issue #$B still open"
  release_cycle "$base" B "$LAST_TAG"
}

# ---------------------------------------------------------------- scenario C
scenario_c() {
  step "Scenario C: hotfix → main → patch release → back-merge into dev"
  local base C br pr body
  base=$(max_number); C=$(new_issue "Live test C: hotfix"); br="hotfix/$C-live-test"
  G fetch -q origin && git switch -q -c "$br" origin/main
  printf '\n\ndef farewell(name: str) -> str:\n    return f"Bye, {name}!"\n' >> src/flowdemo/__init__.py
  git commit -qam "fix(greet): add farewell for the logout page" && G push -q -u origin HEAD
  if pr=$(wait_new_pr "$br" main "$base"); then ok "C: hotfix PR #$pr opened into main"; else bad "C: no hotfix PR into main"; return; fi
  body=$(gh pr view "$pr" -R "$REPO" --json body --jq .body)
  [[ "$body" == *"Closes #$C"* ]] && ok "C: hotfix PR body says Closes #$C" || bad "C: hotfix PR body lacks Closes #$C"
  if wait_merged "$pr"; then ok "C: hotfix PR #$pr auto-merged into main"; else bad "C: hotfix #$pr not merged"; explain_pr "$pr"; return; fi
  wait_issue_closed "$C" && ok "C: issue #$C closed" || bad "C: issue #$C still open"
  release_cycle "$base" C "$LAST_TAG"
}

# ---------------------------------------------------------------- negative checks
negatives() {
  step "Negative checks"
  local base N br pr
  base=$(max_number); N=$(new_issue "Live test N: bad commit subject"); br="feat/$N-bad-subject"
  G fetch -q origin && git switch -q -c "$br" origin/dev
  echo "- bad subject test" >> docs/live-test.md && git commit -qam "Update stuff" && G push -q -u origin HEAD
  if pr=$(wait_new_pr "$br" dev "$base"); then
    gh pr checks "$pr" -R "$REPO" --watch --interval 20 >/dev/null 2>&1
    gh pr checks "$pr" -R "$REPO" 2>/dev/null | grep -E "^Branch and commit conventions\s+fail" -q \
      && ok "N: 'Update stuff' fails Branch and commit conventions" || bad "N: conventions check did not fail as expected"
    sleep 45
    [ "$(pr_state "$pr")" = OPEN ] && ok "N: failing PR #$pr was not merged" || bad "N: failing PR #$pr was merged"
    gh pr close "$pr" -R "$REPO" --delete-branch >/dev/null
  else bad "N: no PR for the bad-subject branch"; fi
  gh issue close "$N" -R "$REPO" >/dev/null

  base=$(max_number); br="chore/$((base + 1))-no-pr"
  G fetch -q origin && git switch -q -c "$br" origin/dev
  echo "- chore test" >> docs/live-test.md && git commit -qam "chore: unsupported prefix" && G push -q -u origin HEAD
  sleep 90
  [ "$(latest_pr "$br" dev)" -eq 0 ] && ok "N: chore/ branch got no PR" || bad "N: chore/ branch got a PR"
  G push -q origin --delete "$br"

  if G push -q origin HEAD:dev 2>/dev/null; then bad "N: direct push to dev was accepted"; else ok "N: direct push to dev rejected"; fi
  if [ -n "$LAST_TAG" ]; then
    if G push -q origin ":refs/tags/$LAST_TAG" 2>/dev/null; then bad "N: deleting tag $LAST_TAG was accepted"; else ok "N: deleting tag $LAST_TAG rejected"; fi
  fi
}

scenario_a
scenario_b
scenario_c
negatives

step "Summary"
echo "PASS: $PASS   FAIL: $FAIL   (started $START_TIME)"
echo "Log: $LOG"
echo "Send this log file back to Claude."
cd "$HERE" && [ -n "$WORK" ] && rm -rf "$WORK"
[ "$FAIL" -eq 0 ]
