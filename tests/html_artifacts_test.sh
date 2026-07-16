#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
tmp_root="$(mktemp -d)"
trap 'rm -rf "$tmp_root"' EXIT

project="$tmp_root/project"
mkdir -p "$project"
bash "$repo_root/skills/oracle/scripts/oracle_init.sh" "$project" >/dev/null

human="$project/.artifacts/human.html"
template_name="$(cat "$project/.artifacts/examples/current-template.txt")"
example="$project/.artifacts/examples/$template_name"

test -f "$human"
test -f "$example"
grep -qi '^<!DOCTYPE html>' "$human"
grep -q 'name="viewport"' "$human"
grep -q '@media (max-width:760px)' "$human"
grep -q '@media (prefers-reduced-motion:reduce)' "$human"
grep -q '@media print' "$human"
grep -q 'min-width:620px' "$human"
grep -q 'overflow-wrap:anywhere' "$human"
if grep -Fq "$project" "$human"; then
  echo "Generated human.html contains an absolute project path" >&2
  exit 1
fi
grep -q 'href="test.md"' "$human"
grep -q 'href="plans/"' "$human"
grep -q 'href="designs/"' "$human"
grep -q 'href="sandbox/"' "$human"
grep -q 'oracle-html-template-version: 2' "$example"
grep -q 'data-state="{{STATUS_STATE}}"' "$example"
grep -q 'aria-hidden="true"' "$example"
grep -q 'min-width: 620px' "$example"
grep -q '@media (prefers-reduced-motion: reduce)' "$example"
grep -q -- '--success: #176238' "$example"
grep -q -- '--warning: #784600' "$example"
grep -q -- '--danger: #8f2525' "$example"
grep -q -- '--accent:#005963' "$human"
grep -q -- '--warn:#784600' "$human"
if grep -Eq '>4\.[05]<' "$example"; then
  echo "HTML template contains realistic hard-coded review scores" >&2
  exit 1
fi
if grep -q 'role="img"' "$example"; then
  echo "HTML template hides flow labels behind generic image semantics" >&2
  exit 1
fi

npm_config_cache="${npm_config_cache:-$tmp_root/npm-cache}" \
  npx --yes html-validate@11.5.6 "$human" "$example"

echo "HTML structure, responsive rules, links, and validation: pass"
