#!/usr/bin/env bash
set -euo pipefail

skill_dir="$(cd "$(dirname "$0")/.." && pwd -P)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

expect_failure() {
  if "$@" >/dev/null 2>&1; then
    echo "Expected failure but command passed: $*" >&2
    exit 1
  fi
}

plain="$tmp/plain project"
mkdir -p "$plain"
bash "$skill_dir/scripts/oracle_init.sh" "$plain" >/dev/null
test -f "$plain/human.md"
test -f "$plain/test.md"
test -f "$plain/.sandbox/README.md"
grep -q '^## Surfaces And Ownership$' "$plain/human.md"
grep -q '^## CLI Testing$' "$plain/test.md"

outside="$tmp/outside"
symlink_root="$tmp/symlink-root"
mkdir -p "$outside" "$symlink_root"
ln -s "$outside" "$symlink_root/.artifacts"
expect_failure bash "$skill_dir/scripts/oracle_init.sh" "$symlink_root"
test ! -e "$outside/runs"

child_symlink_root="$tmp/child-symlink-root"
mkdir -p "$child_symlink_root"
ln -s "$outside/human-target" "$child_symlink_root/human.md"
expect_failure bash "$skill_dir/scripts/oracle_init.sh" "$child_symlink_root"
test ! -e "$outside/human-target"

run_id=20260712-1200-thread-lanes
bash "$skill_dir/scripts/oracle_start_run.sh" "$plain" "$run_id" plan "plan cli and web" >/dev/null
run="$plain/.artifacts/runs/$run_id"
test -f "$run/threads.md"
test -f "$run/resource-locks.md"
test -d "$run/thread-briefs"
test -d "$run/lanes"
grep -q 'source-read-only / artifact-write' "$run/ledger.md"
expect_failure bash "$skill_dir/scripts/oracle_start_run.sh" "$plain" "$run_id" implement "premature implementation"
printf 'accepted\n' > "$run/plan-acceptance.status"
bash "$skill_dir/scripts/oracle_start_run.sh" "$plain" "$run_id" implement "implement cli and web" >/dev/null
test "$(cat "$run/current-phase.txt")" = "implement"
rm "$run/current-phase.txt"
expect_failure bash "$skill_dir/scripts/oracle_start_run.sh" "$plain" "$run_id" plan "phase regression"
bash "$skill_dir/scripts/oracle_start_run.sh" "$plain" "$run_id" implement "resume implementation" >/dev/null
test "$(cat "$run/current-phase.txt")" = "implement"
rm "$run/initial-request.txt"
bash "$skill_dir/scripts/oracle_start_run.sh" "$plain" "$run_id" implement "second resume" >/dev/null
test "$(cat "$run/initial-request.txt")" = "plan cli and web"

lane_script="$skill_dir/scripts/oracle_lane_state.sh"
direct_id=20260712-1205-direct-implement
bash "$skill_dir/scripts/oracle_start_run.sh" "$plain" "$direct_id" implement "direct implementation" >/dev/null
bash "$lane_script" "$plain" "$direct_id" direct-lane init >/dev/null
expect_failure bash "$lane_script" "$plain" "$direct_id" direct-lane checkpoint 1 abcdef0
printf 'accepted\n' > "$plain/.artifacts/runs/$direct_id/plan-acceptance.status"
bash "$lane_script" "$plain" "$direct_id" direct-lane checkpoint 1 abcdef0 >/dev/null

bash "$lane_script" "$plain" "$run_id" web-editor init >/dev/null
bash "$lane_script" "$plain" "$run_id" web-editor checkpoint 1 abcdef1 >/dev/null
bash "$lane_script" "$plain" "$run_id" web-editor test 1 abcdef1 pass >/dev/null
bash "$lane_script" "$plain" "$run_id" web-editor review 1 abcdef1 pass "implementation=4,tests=5,security=4" none >/dev/null
bash "$lane_script" "$plain" "$run_id" web-editor accept 1 abcdef1 >/dev/null
test "$(cat "$run/lanes/web-editor/state.txt")" = "accepted"

bash "$lane_script" "$plain" "$run_id" cli init >/dev/null
expect_failure bash "$lane_script" "$plain" "$run_id" cli test 1 abcdef2 pass
bash "$lane_script" "$plain" "$run_id" cli checkpoint 1 abcdef2 >/dev/null
bash "$lane_script" "$plain" "$run_id" cli test 1 abcdef2 fail >/dev/null
bash "$lane_script" "$plain" "$run_id" cli review 1 abcdef2 fail "implementation=2,tests=3" p1 >/dev/null
test "$(cat "$run/lanes/cli/state.txt")" = "fix-required"
expect_failure bash "$lane_script" "$plain" "$run_id" cli checkpoint 3 abcdef4
bash "$lane_script" "$plain" "$run_id" cli checkpoint 2 abcdef3 >/dev/null
bash "$lane_script" "$plain" "$run_id" cli test 2 abcdef3 pass >/dev/null
bash "$lane_script" "$plain" "$run_id" cli review 2 abcdef3 pass "implementation=5,tests=5,security=4" none >/dev/null
bash "$lane_script" "$plain" "$run_id" cli accept 2 abcdef3 >/dev/null

bash "$lane_script" "$plain" "$run_id" low-score init >/dev/null
bash "$lane_script" "$plain" "$run_id" low-score checkpoint 1 abcdef5 >/dev/null
bash "$lane_script" "$plain" "$run_id" low-score test 1 abcdef5 pass >/dev/null
bash "$lane_script" "$plain" "$run_id" low-score review 1 abcdef5 pass "implementation=5,tests=3" none >/dev/null
test "$(cat "$run/lanes/low-score/state.txt")" = "fix-required"

bash "$lane_script" "$plain" "$run_id" stale-round init >/dev/null
bash "$lane_script" "$plain" "$run_id" stale-round checkpoint 1 aaa1111 >/dev/null
bash "$lane_script" "$plain" "$run_id" stale-round test 1 aaa1111 fail >/dev/null
bash "$lane_script" "$plain" "$run_id" stale-round review 1 aaa1111 fail "implementation=2,tests=2" p1 >/dev/null
bash "$lane_script" "$plain" "$run_id" stale-round checkpoint 2 bbb2222 >/dev/null
expect_failure bash "$lane_script" "$plain" "$run_id" stale-round test 1 aaa1111 pass
bash "$lane_script" "$plain" "$run_id" stale-round test 2 bbb2222 pass >/dev/null
expect_failure bash "$lane_script" "$plain" "$run_id" stale-round review 1 aaa1111 pass "implementation=5,tests=5" none
bash "$lane_script" "$plain" "$run_id" stale-round review 2 bbb2222 pass "implementation=5,tests=5" none >/dev/null
expect_failure bash "$lane_script" "$plain" "$run_id" stale-round accept 1 aaa1111
bash "$lane_script" "$plain" "$run_id" stale-round accept 2 bbb2222 >/dev/null
test "$(cat "$run/lanes/stale-round/accepted-checkpoint.txt")" = "bbb2222"

bash "$lane_script" "$plain" "$run_id" symlink-rounds init >/dev/null
rm -rf "$run/lanes/symlink-rounds/rounds"
mkdir -p "$outside/lane-rounds"
ln -s "$outside/lane-rounds" "$run/lanes/symlink-rounds/rounds"
expect_failure bash "$lane_script" "$plain" "$run_id" symlink-rounds checkpoint 1 abcdef6
test ! -e "$outside/lane-rounds/1"

repo="$tmp/repo"
git init -q "$repo"
git -C "$repo" config user.name Oracle-Test
git -C "$repo" config user.email oracle@test.invalid
printf 'base\n' > "$repo/app.txt"
printf '.env.local\n.env.tracked\n' > "$repo/.gitignore"
printf 'SECRET=test-only\n' > "$repo/.env.local"
printf 'TRACKED=checkpoint\n' > "$repo/.env.tracked"
git -C "$repo" add app.txt .gitignore
git -C "$repo" add -f .env.tracked
git -C "$repo" commit -qm baseline
bash "$skill_dir/scripts/oracle_init.sh" "$repo" >/dev/null

noenv_id=20260712-1201-cli-noenv
bash "$skill_dir/scripts/oracle_sandbox_worktree.sh" "$repo" "$noenv_id" HEAD >/dev/null
test ! -e "$repo/.sandbox/worktrees/$noenv_id/.env.local"
test "$(git -C "$repo/.sandbox/worktrees/$noenv_id" rev-parse HEAD)" = "$(git -C "$repo" rev-parse HEAD)"

env_id=20260712-1202-web-env
bash "$skill_dir/scripts/oracle_sandbox_worktree.sh" "$repo" "$env_id" HEAD "" ".env.local" >/dev/null
test -f "$repo/.sandbox/worktrees/$env_id/.env.local"
test "$(stat -f '%Lp' "$repo/.sandbox/worktrees/$env_id/.env.local")" = "600"

gitignore_before="$(shasum "$repo/.sandbox/.gitignore")"
tracked_id=20260712-1203-tracked-env
expect_failure bash "$skill_dir/scripts/oracle_sandbox_worktree.sh" "$repo" "$tracked_id" HEAD "" ".env.tracked"
test ! -e "$repo/.sandbox/worktrees/$tracked_id"
if git -C "$repo" show-ref --verify --quiet "refs/heads/oracle/$tracked_id"; then
  echo "Tracked-env failure left a branch" >&2
  exit 1
fi
test "$gitignore_before" = "$(shasum "$repo/.sandbox/.gitignore")"

cross_repo="$tmp/cross-ref-repo"
git init -q "$cross_repo"
git -C "$cross_repo" config user.name Oracle-Test
git -C "$cross_repo" config user.email oracle@test.invalid
printf 'base\n' > "$cross_repo/app.txt"
printf '.env.cross\n' > "$cross_repo/.gitignore"
git -C "$cross_repo" add app.txt .gitignore
git -C "$cross_repo" commit -qm older
older_sha="$(git -C "$cross_repo" rev-parse HEAD)"
printf 'TRACKED=newer\n' > "$cross_repo/.env.cross"
git -C "$cross_repo" add -f .env.cross
git -C "$cross_repo" commit -qm newer
bash "$skill_dir/scripts/oracle_init.sh" "$cross_repo" >/dev/null
cross_id=20260712-1206-cross-ref-env
expect_failure bash "$skill_dir/scripts/oracle_sandbox_worktree.sh" "$cross_repo" "$cross_id" "$older_sha" "" ".env.cross"
test ! -e "$cross_repo/.sandbox/worktrees/$cross_id"

symlink_repo="$tmp/symlink-repo"
git init -q "$symlink_repo"
git -C "$symlink_repo" config user.name Oracle-Test
git -C "$symlink_repo" config user.email oracle@test.invalid
printf 'base\n' > "$symlink_repo/app.txt"
printf '.env.local\n' > "$symlink_repo/.gitignore"
git -C "$symlink_repo" add app.txt .gitignore
git -C "$symlink_repo" commit -qm baseline
printf 'OUTSIDE=test-only\n' > "$tmp/outside-env"
ln -s "$tmp/outside-env" "$symlink_repo/.env.local"
bash "$skill_dir/scripts/oracle_init.sh" "$symlink_repo" >/dev/null
bad_id=20260712-1204-reject-symlink
expect_failure bash "$skill_dir/scripts/oracle_sandbox_worktree.sh" "$symlink_repo" "$bad_id" HEAD "" ".env.local"
test ! -e "$symlink_repo/.sandbox/worktrees/$bad_id"
if git -C "$symlink_repo" show-ref --verify --quiet "refs/heads/oracle/$bad_id"; then
  echo "Symlink-env failure left a branch" >&2
  exit 1
fi

bash -n "$skill_dir"/scripts/*.sh "$skill_dir"/tests/*.sh

printf '%s\n' \
  "oracle init and templates: pass" \
  "managed symlink rejection: pass" \
  "plan acceptance and phase integrity: pass" \
  "direct-implement plan gate: pass" \
  "lane state ordering, latest-round binding, and scorecards: pass" \
  "nested lane symlink rejection: pass" \
  "worktree checkpoint identity: pass" \
  "explicit env policy and mode: pass" \
  "tracked/cross-ref/symlink env rollback: pass" \
  "Bash syntax: pass"
