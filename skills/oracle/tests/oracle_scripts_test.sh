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

file_mode() {
  stat -f '%Lp' "$1" 2>/dev/null || stat -c '%a' "$1"
}

plain="$tmp/plain project"
mkdir -p "$plain"
bash "$skill_dir/scripts/oracle_init.sh" "$plain" >/dev/null
test -f "$plain/.artifacts/human.html"
test -f "$plain/.artifacts/test.md"
test -f "$plain/.artifacts/sandbox/README.md"
test -d "$plain/.artifacts/sandbox/prototypes"
test -d "$plain/.artifacts/sandbox/worktrees"
test -d "$plain/.artifacts/designs/workbench"
test -f "$plain/.artifacts/examples/current-template.txt"
template_name="$(cat "$plain/.artifacts/examples/current-template.txt")"
test -f "$plain/.artifacts/examples/$template_name"
test ! -e "$plain/human.md"
test ! -e "$plain/test.md"
test ! -e "$plain/.design"
test ! -e "$plain/.sandbox"
grep -qi '^<!doctype html>' "$plain/.artifacts/human.html"
grep -q 'name="viewport"' "$plain/.artifacts/human.html"
grep -q 'id="ownership"' "$plain/.artifacts/human.html"
grep -q 'id="architecture"' "$plain/.artifacts/human.html"
if grep -Fq "$plain" "$plain/.artifacts/human.html"; then
  echo "human.html leaked an absolute project path" >&2
  exit 1
fi
grep -q '^## CLI Testing$' "$plain/.artifacts/test.md"
grep -q '{{ARTIFACT_TITLE}}' "$plain/.artifacts/examples/$template_name"
grep -q 'prefers-color-scheme' "$plain/.artifacts/examples/$template_name"

outside="$tmp/outside"
symlink_root="$tmp/symlink-root"
mkdir -p "$outside" "$symlink_root"
ln -s "$outside" "$symlink_root/.artifacts"
expect_failure bash "$skill_dir/scripts/oracle_init.sh" "$symlink_root"
test ! -e "$outside/runs"

child_symlink_root="$tmp/child-symlink-root"
mkdir -p "$child_symlink_root/.artifacts"
ln -s "$outside/human-target" "$child_symlink_root/.artifacts/human.html"
expect_failure bash "$skill_dir/scripts/oracle_init.sh" "$child_symlink_root"
test ! -e "$outside/human-target"

type_collision_root="$tmp/type-collision-root"
template_collision="$type_collision_root/.artifacts/examples/html-artifact-template-v2.html"
mkdir -p "$template_collision"
chmod 755 "$template_collision"
expect_failure bash "$skill_dir/scripts/oracle_init.sh" "$type_collision_root"
test -d "$template_collision"
test "$(file_mode "$template_collision")" = "755"
test ! -e "$template_collision/artifact-template.html"

altered_template_root="$tmp/altered-template-root"
altered_template="$altered_template_root/.artifacts/examples/html-artifact-template-v2.html"
mkdir -p "$(dirname "$altered_template")"
printf '%s\n' '<!doctype html><script>customized()</script>' > "$altered_template"
altered_template_hash="$(shasum "$altered_template")"
expect_failure bash "$skill_dir/scripts/oracle_init.sh" "$altered_template_root"
test "$altered_template_hash" = "$(shasum "$altered_template")"
test ! -e "$altered_template_root/.artifacts/examples/current-template.txt"

legacy_root="$tmp/legacy-root"
mkdir -p "$legacy_root/.design" "$legacy_root/.sandbox"
printf '%s\n' 'legacy human' > "$legacy_root/human.md"
bash "$skill_dir/scripts/oracle_init.sh" "$legacy_root" >/dev/null 2>&1
test -f "$legacy_root/human.md"
test ! -e "$legacy_root/test.md"
test -d "$legacy_root/.design"
test -d "$legacy_root/.sandbox"
test -f "$legacy_root/.artifacts/human.html"
test -f "$legacy_root/.artifacts/test.md"
test "$(cat "$legacy_root/.artifacts/legacy-migration.status")" = "pending"
test -f "$legacy_root/.artifacts/legacy-migration.md"
test -f "$legacy_root/.artifacts/legacy-manifest.tsv"
test "$(grep -c '^- `human.md`$' "$legacy_root/.artifacts/legacy-migration.md")" = "1"
test "$(grep -c '^- `test.md`$' "$legacy_root/.artifacts/legacy-migration.md" || true)" = "0"
expect_failure bash "$skill_dir/scripts/oracle_start_run.sh" "$legacy_root" 20260712-1159-legacy-migration plan "must reconcile"
printf '%s\n' 'reconciled' > "$legacy_root/.artifacts/legacy-migration.status"

printf '%s\n' 'legacy tests: safe-special-command' > "$legacy_root/test.md"
bash "$skill_dir/scripts/oracle_init.sh" "$legacy_root" >/dev/null 2>&1
test "$(cat "$legacy_root/.artifacts/legacy-migration.status")" = "pending"
test "$(grep -c '^- `test.md`$' "$legacy_root/.artifacts/legacy-migration.md")" = "1"
expect_failure bash "$skill_dir/scripts/oracle_start_run.sh" "$legacy_root" 20260712-1159-legacy-migration plan "new legacy path must reopen migration"

printf '%s\n' 'reconciled' > "$legacy_root/.artifacts/legacy-migration.status"
printf '%s\n' 'legacy tests changed: safe-special-command --strict' > "$legacy_root/test.md"
bash "$skill_dir/scripts/oracle_init.sh" "$legacy_root" >/dev/null 2>&1
test "$(cat "$legacy_root/.artifacts/legacy-migration.status")" = "pending"
expect_failure bash "$skill_dir/scripts/oracle_start_run.sh" "$legacy_root" 20260712-1159-legacy-migration plan "changed legacy file must reopen migration"

printf '%s\n' 'reconciled' > "$legacy_root/.artifacts/legacy-migration.status"
printf '%s\n' 'legacy design variant' > "$legacy_root/.design/variant.md"
bash "$skill_dir/scripts/oracle_init.sh" "$legacy_root" >/dev/null 2>&1
test "$(cat "$legacy_root/.artifacts/legacy-migration.status")" = "pending"
printf '%s\n' 'reconciled' > "$legacy_root/.artifacts/legacy-migration.status"
printf '%s\n' 'legacy design variant changed' > "$legacy_root/.design/variant.md"
bash "$skill_dir/scripts/oracle_init.sh" "$legacy_root" >/dev/null 2>&1
test "$(cat "$legacy_root/.artifacts/legacy-migration.status")" = "pending"

printf '%s\n' 'reconciled' > "$legacy_root/.artifacts/legacy-migration.status"
mkdir -p "$legacy_root/.design/flows/code/editor/variants"
printf '%s\n' 'deep legacy design variant' > "$legacy_root/.design/flows/code/editor/variants/view.html"
bash "$skill_dir/scripts/oracle_init.sh" "$legacy_root" >/dev/null 2>&1
test "$(cat "$legacy_root/.artifacts/legacy-migration.status")" = "pending"

printf '%s\n' 'reconciled' > "$legacy_root/.artifacts/legacy-migration.status"
printf '%s\n' 'deep legacy design variant changed' > "$legacy_root/.design/flows/code/editor/variants/view.html"
bash "$skill_dir/scripts/oracle_init.sh" "$legacy_root" >/dev/null 2>&1
test "$(cat "$legacy_root/.artifacts/legacy-migration.status")" = "pending"

printf '%s\n' 'reconciled' > "$legacy_root/.artifacts/legacy-migration.status"
newline_legacy_file="$legacy_root/.design/"$'line\nbreak'
printf '%s\n' 'newline legacy design' > "$newline_legacy_file"
bash "$skill_dir/scripts/oracle_init.sh" "$legacy_root" >/dev/null 2>&1
test "$(cat "$legacy_root/.artifacts/legacy-migration.status")" = "pending"

printf '%s\n' 'reconciled' > "$legacy_root/.artifacts/legacy-migration.status"
printf '%s\n' 'newline legacy design changed' > "$newline_legacy_file"
bash "$skill_dir/scripts/oracle_init.sh" "$legacy_root" >/dev/null 2>&1
test "$(cat "$legacy_root/.artifacts/legacy-migration.status")" = "pending"

printf '%s\n' 'reconciled' > "$legacy_root/.artifacts/legacy-migration.status"
printf '%s\n' 'legacy human changed after init' > "$legacy_root/human.md"
expect_failure bash "$skill_dir/scripts/oracle_start_run.sh" "$legacy_root" 20260712-1159-legacy-migration plan "direct run must recheck legacy manifest"
bash "$skill_dir/scripts/oracle_init.sh" "$legacy_root" >/dev/null 2>&1
test "$(cat "$legacy_root/.artifacts/legacy-migration.status")" = "pending"

printf '%s\n' 'reconciled' > "$legacy_root/.artifacts/legacy-migration.status"
rm "$legacy_root/.artifacts/legacy-migration.md"
bash "$skill_dir/scripts/oracle_init.sh" "$legacy_root" >/dev/null 2>&1
test -f "$legacy_root/.artifacts/legacy-migration.md"
test "$(cat "$legacy_root/.artifacts/legacy-migration.status")" = "reconciled"
bash "$skill_dir/scripts/oracle_start_run.sh" "$legacy_root" 20260712-1159-legacy-migration plan "reconciled plan" >/dev/null

deletion_root="$tmp/deletion-root"
mkdir -p "$deletion_root"
printf '%s\n' 'legacy human only' > "$deletion_root/human.md"
bash "$skill_dir/scripts/oracle_init.sh" "$deletion_root" >/dev/null 2>&1
test "$(cat "$deletion_root/.artifacts/legacy-migration.status")" = "pending"
rm "$deletion_root/human.md"
expect_failure bash "$skill_dir/scripts/oracle_start_run.sh" "$deletion_root" 20260712-1157-deleted-legacy plan "deleted legacy content must fail closed"
bash "$skill_dir/scripts/oracle_init.sh" "$deletion_root" >/dev/null 2>&1
test "$(cat "$deletion_root/.artifacts/legacy-migration.status")" = "pending"
test ! -s "$deletion_root/.artifacts/legacy-manifest.tsv"
grep -q 'prior inventory changed to empty' "$deletion_root/.artifacts/legacy-migration.md"
printf '%s\n' 'reconciled' > "$deletion_root/.artifacts/legacy-migration.status"
bash "$skill_dir/scripts/oracle_start_run.sh" "$deletion_root" 20260712-1157-deleted-legacy plan "intentional deletion reconciled" >/dev/null

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

helper_symlink_repo="$tmp/helper-symlink-repo"
helper_symlink_outside="$tmp/helper-symlink-outside"
git init -q "$helper_symlink_repo"
git -C "$helper_symlink_repo" config user.name Oracle-Test
git -C "$helper_symlink_repo" config user.email oracle@test.invalid
printf 'base\n' > "$helper_symlink_repo/app.txt"
git -C "$helper_symlink_repo" add app.txt
git -C "$helper_symlink_repo" commit -qm baseline
mkdir -p "$helper_symlink_outside"
ln -s "$helper_symlink_outside" "$helper_symlink_repo/.artifacts"
expect_failure bash "$skill_dir/scripts/oracle_sandbox_worktree.sh" "$helper_symlink_repo" 20260712-1158-symlink-ancestor HEAD
test ! -e "$helper_symlink_outside/sandbox"

noenv_id=20260712-1201-cli-noenv
bash "$skill_dir/scripts/oracle_sandbox_worktree.sh" "$repo" "$noenv_id" HEAD >/dev/null
test ! -e "$repo/.artifacts/sandbox/worktrees/$noenv_id/.env.local"
test "$(git -C "$repo/.artifacts/sandbox/worktrees/$noenv_id" rev-parse HEAD)" = "$(git -C "$repo" rev-parse HEAD)"

env_id=20260712-1202-web-env
bash "$skill_dir/scripts/oracle_sandbox_worktree.sh" "$repo" "$env_id" HEAD "" ".env.local" >/dev/null
test -f "$repo/.artifacts/sandbox/worktrees/$env_id/.env.local"
test "$(file_mode "$repo/.artifacts/sandbox/worktrees/$env_id/.env.local")" = "600"

gitignore_before="$(shasum "$repo/.artifacts/sandbox/.gitignore")"
tracked_id=20260712-1203-tracked-env
expect_failure bash "$skill_dir/scripts/oracle_sandbox_worktree.sh" "$repo" "$tracked_id" HEAD "" ".env.tracked"
test ! -e "$repo/.artifacts/sandbox/worktrees/$tracked_id"
if git -C "$repo" show-ref --verify --quiet "refs/heads/oracle/$tracked_id"; then
  echo "Tracked-env failure left a branch" >&2
  exit 1
fi
test "$gitignore_before" = "$(shasum "$repo/.artifacts/sandbox/.gitignore")"

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
test ! -e "$cross_repo/.artifacts/sandbox/worktrees/$cross_id"

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
test ! -e "$symlink_repo/.artifacts/sandbox/worktrees/$bad_id"
if git -C "$symlink_repo" show-ref --verify --quiet "refs/heads/oracle/$bad_id"; then
  echo "Symlink-env failure left a branch" >&2
  exit 1
fi

bash -n "$skill_dir"/scripts/*.sh "$skill_dir"/tests/*.sh

printf '%s\n' \
  "oracle init and templates: pass" \
  "consolidated artifact paths and legacy preservation: pass" \
  "human HTML and reusable visual template: pass" \
  "managed symlink and path-type rejection: pass" \
  "NUL-safe legacy manifest, fail-closed start gate, report repair, and deduplicated notice: pass" \
  "immutable template integrity: pass" \
  "worktree ancestor symlink rejection before mutation: pass" \
  "plan acceptance and phase integrity: pass" \
  "direct-implement plan gate: pass" \
  "lane state ordering, latest-round binding, and scorecards: pass" \
  "nested lane symlink rejection: pass" \
  "worktree checkpoint identity: pass" \
  "explicit env policy and mode: pass" \
  "tracked/cross-ref/symlink env rollback: pass" \
  "Bash syntax: pass"
