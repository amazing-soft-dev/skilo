#!/usr/bin/env bash
# Validates a repository's dev → main flow setup. Each FAIL names the micro-skill step that fixes it.
#
#   bash check-setup.sh [OWNER/REPO]      # run from the repository root
#
# File checks always run. GitHub checks run when `gh` is installed and authenticated (GH_TOKEN or gh auth login).
# Exit code: 0 when there is no FAIL, 1 otherwise. Never prints tokens.
set -uo pipefail

PASS=0; FAIL=0; WARN=0
pass() { echo "PASS $1"; PASS=$((PASS + 1)); }
fail() { echo "FAIL $1  → workflows/$2"; FAIL=$((FAIL + 1)); }
warn() { echo "WARN $1"; WARN=$((WARN + 1)); }
check() {  # check "<description>" "<fix pointer>" <command...>
  local d=$1 f=$2; shift 2
  if "$@" >/dev/null 2>&1; then pass "$d"; else fail "$d" "$f"; fi
}
has() { grep -q -- "$2" "$1" 2>/dev/null; }
lacks() { ! grep -q -- "$2" "$1" 2>/dev/null; }
json_ok() {
  if command -v python3 >/dev/null 2>&1; then python3 -m json.tool "$1" >/dev/null 2>&1
  elif command -v node >/dev/null 2>&1; then node -e "JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'))" "$1"
  else return 2; fi
}

W=.github/workflows
echo "== Files"
for f in open-pull-request.yml merge-passing-pr.yml ci.yml; do
  check "$W/$f exists" "setup-repo.md step 2" test -f "$W/$f"
done
if [ -f "$W/ci.yml" ]; then
  check "ci.yml is named CI" "setup-repo.md step 2" grep -qE '^name: CI$' "$W/ci.yml"
  check "ci.yml has the 'CI passed' job" "setup-repo.md step 2" has "$W/ci.yml" "name: CI passed"
  check "ci.yml has the conventions job" "setup-repo.md step 2" has "$W/ci.yml" "name: Branch and commit conventions"
  check "ci.yml placeholder steps replaced with stack steps" "setup-repo.md step 3" lacks "$W/ci.yml" "Replace with stack steps"
  check "ci.yml re-runs when a draft is marked ready" "setup-repo.md step 2" has "$W/ci.yml" "ready_for_review"
fi
if [ -f "$W/merge-passing-pr.yml" ]; then
  check "merge workflow listens for the CI workflow" "setup-repo.md step 2" has "$W/merge-passing-pr.yml" "workflows: \[CI\]"
  check "merge workflow merges with merge commits" "setup-repo.md step 2" has "$W/merge-passing-pr.yml" "--merge --match-head-commit"
  check "merge workflow skips drafts and forks" "setup-repo.md step 2" has "$W/merge-passing-pr.yml" "isDraft"
fi
if [ -f "$W/open-pull-request.yml" ]; then
  check "open-PR workflow compares trees (no release loop)" "setup-repo.md step 2" has "$W/open-pull-request.yml" "tree_differs"
fi
for f in "$W/open-pull-request.yml" "$W/merge-passing-pr.yml"; do
  [ -f "$f" ] || continue
  if has "$f" 'secrets.GH_TOKEN' || has "$f" 'steps.app-token.outputs.token'; then pass "$(basename "$f") uses a PAT or App token"
  else fail "$(basename "$f") must not rely on GITHUB_TOKEN" "secure-repo.md section 1"; fi
done

echo "== Versioning"
if [ -f "$W/release.yml" ]; then
  for f in release-please-config.json .release-please-manifest.json; do
    if [ ! -f "$f" ]; then fail "$f exists" "release.md section 3"; continue; fi
    json_ok "$f"; rc=$?
    if [ $rc -eq 0 ]; then pass "$f is valid JSON"; elif [ $rc -eq 2 ]; then warn "$f not parsed (no python3 or node)"; else fail "$f is valid JSON" "release.md section 3"; fi
  done
  check "release job exposes prs_created (needed by the lockfile job)" "setup-repo.md step 4" has "$W/release.yml" "prs_created: \${{ steps.release.outputs.prs_created }}"
  if [ -f uv.lock ] || { [ -f Gemfile.lock ] && ls ./*.gemspec >/dev/null 2>&1; }; then
    check "lockfile-refresh job present (lockfile stores the project version)" "setup-repo.md step 4" has "$W/release.yml" "lockfile:"
  fi
  if has release-please-config.json '"release-type": "simple"' && { [ -f package.json ] || [ -f pyproject.toml ] || [ -f Cargo.toml ] || [ -f pom.xml ]; }; then
    warn "release-type is 'simple' but a stack manifest exists; check the stacks/*.md Versioning section"
  fi
else
  warn "no release.yml: versioning is off (fine only if the user chose that)"
fi

echo "== Dependabot"
D=.github/dependabot.yml
if [ -f "$D" ]; then
  n_eco=$(grep -c 'package-ecosystem:' "$D"); n_dev=$(grep -c 'target-branch: dev' "$D")
  [ "$n_eco" -eq "$n_dev" ] && pass "every Dependabot entry targets dev" || fail "every Dependabot entry targets dev ($n_dev of $n_eco)" "setup-repo.md step 5"
  check "Dependabot keeps GitHub Actions updated" "setup-repo.md step 5" has "$D" "package-ecosystem: github-actions"
  if has "$D" "package-ecosystem: npm" && [ ! -f package.json ]; then fail "npm entry present but no package.json" "setup-repo.md step 5"; fi
else
  warn "no .github/dependabot.yml"
fi

echo "== GitHub"
if ! command -v gh >/dev/null 2>&1 || ! gh auth status >/dev/null 2>&1; then
  warn "gh not installed or not authenticated: GitHub checks skipped"
else
  REPO="${1:-$(gh repo view --json nameWithOwner --jq .nameWithOwner 2>/dev/null)}"
  if [ -z "$REPO" ]; then warn "could not tell which repository this is; pass OWNER/REPO"; else
    echo "   repository: $REPO"
    info=$(gh api "repos/$REPO" --jq '"\(.default_branch) \(.allow_merge_commit)"' 2>/dev/null)
    read -r def mc <<< "$info"
    [ "$def" = main ] && pass "default branch is main" || fail "default branch is main (it is '$def')" "setup-repo.md step 6"
    [ "$mc" = true ] && pass "merge commits allowed" || fail "merge commits allowed" "setup-repo.md step 6"
    check "dev branch exists" "setup-repo.md step 6" gh api "repos/$REPO/branches/dev"
    secrets=$(gh secret list -R "$REPO" 2>/dev/null) || secrets="__unreadable__"
    if [ "$secrets" = "__unreadable__" ]; then warn "cannot list secrets (needs admin); check GH_TOKEN by hand"
    elif grep -qE '^(GH_TOKEN|FLOW_APP_PRIVATE_KEY)\b' <<< "$secrets"; then pass "GH_TOKEN (or App key) secret saved"
    else fail "GH_TOKEN (or App key) secret saved" "secure-repo.md section 1"; fi
    for b in main dev; do
      if ! gh api "repos/$REPO/rules/branches/$b" --jq 'map(.type) | index("pull_request") != null' 2>/dev/null | grep -q true; then
        fail "$b requires pull requests (ruleset)" "setup-repo.md step 7"; continue
      fi
      pass "$b requires pull requests (ruleset)"
      gh api "repos/$REPO/rules/branches/$b" --jq '.[] | select(.type=="pull_request") | .parameters.allowed_merge_methods // [] | index("merge") != null' 2>/dev/null | grep -q true \
        && pass "$b allows merge commits in its ruleset" || fail "$b allows merge commits in its ruleset" "setup-repo.md step 7"
      gh api "repos/$REPO/rules/branches/$b" --jq '[.[] | select(.type=="required_status_checks") | .parameters.required_status_checks[].context] | index("CI passed") != null' 2>/dev/null | grep -q true \
        && pass "$b requires the 'CI passed' check" || fail "$b requires the 'CI passed' check" "setup-repo.md step 7"
      gh api "repos/$REPO/rules/branches/$b" --jq '[.[] | select(.type=="required_status_checks") | .parameters.strict_required_status_checks_policy] | any' 2>/dev/null | grep -q false \
        && pass "$b does not require branches to be up to date" || fail "$b must not require branches to be up to date" "setup-repo.md step 7"
      gh api "repos/$REPO/rules/branches/$b" --jq 'map(.type) | index("required_linear_history") == null' 2>/dev/null | grep -q true \
        && pass "$b does not require linear history" || fail "$b must not require linear history" "setup-repo.md step 7"
    done
    gh api "repos/$REPO/rulesets" --jq '[.[] | select(.target=="tag")] | length > 0' 2>/dev/null | grep -q true \
      && pass "release tags are protected (tag ruleset)" || fail "release tags are protected (tag ruleset)" "setup-repo.md step 7"
  fi
fi

echo
echo "PASS $PASS  FAIL $FAIL  WARN $WARN"
[ "$FAIL" -eq 0 ]
