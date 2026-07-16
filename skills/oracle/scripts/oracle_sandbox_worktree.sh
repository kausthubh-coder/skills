#!/usr/bin/env bash
set -euo pipefail

root="${1:-}"
run_id="${2:-}"
base_ref="${3:-HEAD}"
branch_name="${4:-}"
env_files_csv="${5:-}"

if [ -z "$root" ] || [ -z "$run_id" ]; then
  echo "Usage: oracle_sandbox_worktree.sh <project-root> <run-id-lane-slug> [base-ref] [branch-name] [comma-separated-env-files]" >&2
  exit 1
fi

if [[ ! "$run_id" =~ ^[0-9]{8}-[0-9]{4}-[a-z0-9][a-z0-9-]*$ ]]; then
  echo "Oracle sandbox worktree error: run ID must match YYYYMMDD-HHMM-short-slug" >&2
  exit 1
fi

if [ ! -d "$root" ]; then
  echo "Oracle sandbox worktree error: root does not exist: $root" >&2
  exit 1
fi

root="$(cd "$root" && pwd -P)"

if ! git -C "$root" rev-parse --show-toplevel >/dev/null 2>&1; then
  echo "Oracle sandbox worktree error: root is not inside a Git repository: $root" >&2
  exit 1
fi

repo_root="$(cd "$(git -C "$root" rev-parse --show-toplevel)" && pwd -P)"
if [ "$repo_root" != "$root" ]; then
  echo "Oracle sandbox worktree error: use the Git root: $repo_root" >&2
  exit 1
fi

branch_name="${branch_name:-oracle/$run_id}"
if ! git check-ref-format --branch "$branch_name" >/dev/null 2>&1; then
  echo "Oracle sandbox worktree error: invalid branch name: $branch_name" >&2
  exit 1
fi

artifacts_dir="$root/.artifacts"
sandbox_dir="$artifacts_dir/sandbox"
worktrees_dir="$sandbox_dir/worktrees"

if [ -L "$artifacts_dir" ] || [ ! -d "$artifacts_dir" ]; then
  echo "Oracle sandbox worktree error: run oracle init and use a real .artifacts directory" >&2
  exit 1
fi

physical_artifacts_dir="$(cd "$artifacts_dir" && pwd -P)"
if [ "$physical_artifacts_dir" != "$artifacts_dir" ]; then
  echo "Oracle sandbox worktree error: physical .artifacts path escaped the project: $physical_artifacts_dir" >&2
  exit 1
fi

if [ -L "$sandbox_dir" ] || [ -L "$worktrees_dir" ]; then
  echo "Oracle sandbox worktree error: .artifacts/sandbox and its worktrees directory must not be symlinks" >&2
  exit 1
fi

mkdir -p "$worktrees_dir"

if [ -L "$sandbox_dir" ] || [ -L "$worktrees_dir" ]; then
  echo "Oracle sandbox worktree error: .artifacts/sandbox path changed to a symlink during setup" >&2
  exit 1
fi

physical_worktrees_dir="$(cd "$worktrees_dir" && pwd -P)"
if [ "$physical_worktrees_dir" != "$worktrees_dir" ]; then
  echo "Oracle sandbox worktree error: physical worktrees path escaped the project: $physical_worktrees_dir" >&2
  exit 1
fi

worktrees_dir="$physical_worktrees_dir"
worktree_path="$worktrees_dir/$run_id"

branch_preexisting="no"
if git -C "$root" show-ref --verify --quiet "refs/heads/$branch_name"; then
  branch_preexisting="yes"
  start_ref="$branch_name"
  start_sha="$(git -C "$root" rev-parse "$branch_name^{commit}")"
else
  if ! start_sha="$(git -C "$root" rev-parse "$base_ref^{commit}" 2>/dev/null)"; then
    echo "Oracle sandbox worktree error: base ref has no commit: $base_ref" >&2
    exit 1
  fi
  start_ref="$base_ref"
fi

source_dirty="no"
if [ -n "$(git -C "$root" status --short --untracked-files=all)" ]; then
  source_dirty="yes"
fi

if [ -e "$worktree_path" ]; then
  echo "Oracle sandbox worktree error: path already exists: $worktree_path" >&2
  exit 1
fi

sandbox_gitignore="$sandbox_dir/.gitignore"
if [ -L "$sandbox_gitignore" ] || [ ! -f "$sandbox_gitignore" ]; then
  echo "Oracle sandbox worktree error: run oracle init and use a real .artifacts/sandbox/.gitignore file" >&2
  exit 1
fi
if ! grep -qxF "worktrees/" "$sandbox_gitignore"; then
  echo "Oracle sandbox worktree error: .artifacts/sandbox/.gitignore must contain worktrees/" >&2
  exit 1
fi

if [ -n "$env_files_csv" ]; then
  IFS=',' read -r -a env_names <<< "$env_files_csv"
  for env_name in "${env_names[@]}"; do
    case "$env_name" in
      .env|.env.*) ;;
      *) echo "Oracle sandbox worktree error: env file must be a top-level .env or .env.* name: $env_name" >&2; exit 1 ;;
    esac
    case "$env_name" in
      */*|.env.example|.env.sample|.env.template|.env.dist|*.example|*.sample|*.template|*.dist)
        echo "Oracle sandbox worktree error: template, nested, or invalid env file is not copyable: $env_name" >&2
        exit 1
        ;;
    esac
    env_file="$root/$env_name"
    if [ -L "$env_file" ] || [ ! -f "$env_file" ]; then
      echo "Oracle sandbox worktree error: requested env source must be a real file: $env_name" >&2
      exit 1
    fi
    if git -C "$root" ls-files --error-unmatch -- "$env_name" >/dev/null 2>&1; then
      echo "Oracle sandbox worktree error: requested env file is tracked in the source checkout: $env_name" >&2
      exit 1
    fi
    if ! git -C "$root" check-ignore -q --no-index -- "$env_name"; then
      echo "Oracle sandbox worktree error: requested env file is not ignored in the source checkout: $env_name" >&2
      exit 1
    fi
  done
fi

created_worktree="no"
created_branch="no"

cleanup_on_error() {
  exit_code="$?"
  if [ "$exit_code" -ne 0 ] && [ "$created_worktree" = "yes" ]; then
    git -C "$root" worktree remove --force "$worktree_path" >/dev/null 2>&1 || true
    if [ "$created_branch" = "yes" ]; then
      git -C "$root" branch -D "$branch_name" >/dev/null 2>&1 || true
    fi
  fi
  exit "$exit_code"
}
trap cleanup_on_error EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

if [ "$branch_preexisting" = "yes" ]; then
  git -C "$root" worktree add "$worktree_path" "$branch_name"
else
  git -C "$root" worktree add -b "$branch_name" "$worktree_path" "$start_sha"
  created_branch="yes"
fi
created_worktree="yes"

actual_start_sha="$(git -C "$worktree_path" rev-parse HEAD)"
if [ "$actual_start_sha" != "$start_sha" ]; then
  echo "Oracle sandbox worktree error: worktree HEAD does not match resolved start SHA" >&2
  exit 1
fi

copied=0
if [ -n "$env_files_csv" ]; then
  for env_name in "${env_names[@]}"; do
    case "$env_name" in
      .env|.env.*) ;;
      *)
        echo "Oracle sandbox worktree error: env file must be a top-level .env or .env.* name: $env_name" >&2
        exit 1
        ;;
    esac

    case "$env_name" in
      */*|.env.example|.env.sample|.env.template|.env.dist|*.example|*.sample|*.template|*.dist)
        echo "Oracle sandbox worktree error: template, nested, or invalid env file is not copyable: $env_name" >&2
        exit 1
        ;;
    esac

    env_file="$root/$env_name"
    if [ -L "$env_file" ]; then
      echo "Oracle sandbox worktree error: env source must not be a symlink: $env_name" >&2
      exit 1
    fi
    if [ ! -f "$env_file" ]; then
      echo "Oracle sandbox worktree error: requested env file does not exist: $env_name" >&2
      exit 1
    fi

    if git -C "$worktree_path" ls-files --error-unmatch -- "$env_name" >/dev/null 2>&1; then
      echo "Oracle sandbox worktree error: requested env file is tracked; use the checkpoint version or remove it from the copy list: $env_name" >&2
      exit 1
    fi

    if ! git -C "$worktree_path" check-ignore -q --no-index -- "$env_name"; then
      echo "Oracle sandbox worktree error: requested env file is not Git-ignored: $env_name" >&2
      exit 1
    fi

    cp -p "$env_file" "$worktree_path/$env_name"
    chmod 600 "$worktree_path/$env_name"

    echo "Copied required env file by name only: $env_name"
    copied=1
  done
fi

echo "Oracle sandbox worktree created:"
echo "  root: $root"
echo "  worktree: $worktree_path"
echo "  branch: $branch_name"
echo "  branch preexisting: $branch_preexisting"
echo "  start ref: $start_ref"
echo "  start SHA: $start_sha"
echo "  requested base for new branch: $base_ref"
echo "  source checkout dirty before creation: $source_dirty"
if [ "$copied" -eq 0 ]; then
  echo "  env: no env files requested or copied"
else
  echo "  env: copied explicitly requested env files; values were not printed"
fi

trap - EXIT INT TERM
