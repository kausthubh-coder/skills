#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
skills_version="${SKILLS_VERSION:-latest}"
tmp_root="$(mktemp -d)"

cleanup() {
  rm -rf "$tmp_root"
}
trap cleanup EXIT

home_dir="$tmp_root/home"
cache_dir="$tmp_root/npm-cache"
project_dir="$tmp_root/project"
mkdir -p "$home_dir" "$cache_dir" "$project_dir"

cd "$repo_root"

list_output="$tmp_root/list.out"
HOME="$home_dir" npm_config_cache="$cache_dir" \
  npx --yes "skills@$skills_version" add . --list >"$list_output"
grep -q 'oracle' "$list_output"

HOME="$home_dir" npm_config_cache="$cache_dir" \
  npx --yes "skills@$skills_version" add "$repo_root" \
    --skill oracle \
    --global \
    --agent codex \
    --copy \
    --yes

skill_dir="$home_dir/.agents/skills/oracle"
test -f "$skill_dir/SKILL.md"
test -x "$skill_dir/scripts/oracle_init.sh"
test -f "$skill_dir/references/orchestration.md"

bash "$skill_dir/scripts/oracle_init.sh" "$project_dir" >/dev/null
test -f "$project_dir/human.md"
test -f "$project_dir/test.md"
test -d "$project_dir/.artifacts/plans"

echo "skills CLI discovery, install, and oracle init: pass"
