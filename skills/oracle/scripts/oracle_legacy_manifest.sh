#!/usr/bin/env bash
set -euo pipefail

root="${1:-}"

if [ -z "$root" ] || [ ! -d "$root" ]; then
  echo "Usage: oracle_legacy_manifest.sh <project-root>" >&2
  exit 1
fi

root="$(cd "$root" && pwd -P)"

hash_stream() {
  if command -v shasum >/dev/null 2>&1; then
    shasum -a 256 | awk '{print $1}'
  else
    sha256sum | awk '{print $1}'
  fi
}

hash_file() {
  if command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "$1" | awk '{print $1}'
  else
    sha256sum "$1" | awk '{print $1}'
  fi
}

legacy_paths=()
add_legacy_path() {
  local candidate="$1"
  local existing
  if [ ! -e "$candidate" ] && [ ! -L "$candidate" ]; then
    return
  fi
  for existing in "${legacy_paths[@]:-}"; do
    if [ -n "$existing" ] && [ "$candidate" -ef "$existing" ]; then
      return
    fi
  done
  legacy_paths+=("$candidate")
}

for candidate in \
  "$root/.design" \
  "$root/.sandbox" \
  "$root/human.md" \
  "$root/HUMAN.md" \
  "$root/test.md" \
  "$root/TEST.md"; do
  add_legacy_path "$candidate"
done

for legacy_path in "${legacy_paths[@]:-}"; do
  [ -n "$legacy_path" ] || continue
  relative_path="${legacy_path#"$root"/}"

  if [ -L "$legacy_path" ]; then
    kind="symlink"
    fingerprint="$(readlink "$legacy_path" | hash_stream)"
  elif [ -f "$legacy_path" ]; then
    kind="file"
    fingerprint="$(hash_file "$legacy_path")"
  elif [ -d "$legacy_path" ]; then
    kind="directory"
    fingerprint="$(
      cd "$legacy_path"
      while IFS= read -r -d '' entry; do
        if [ -L "$entry" ]; then
          record_hash="$({
            printf 'symlink\0%s\0' "$entry"
            readlink "$entry"
          } | hash_stream)"
        elif [ -f "$entry" ]; then
          record_hash="$({
            printf 'file\0%s\0' "$entry"
            hash_file "$entry"
          } | hash_stream)"
        elif [ -d "$entry" ]; then
          record_hash="$(printf 'directory\0%s\0' "$entry" | hash_stream)"
        else
          record_hash="$(printf 'other\0%s\0' "$entry" | hash_stream)"
        fi
        printf '%s\n' "$record_hash"
      done < <(
        find . -mindepth 1 \
          \( -name .git -o -name node_modules -o -name worktrees -o -name .next -o -name .expo -o -name dist -o -name build -o -name coverage -o -name .cache \) -prune \
          -o -print0
      ) | LC_ALL=C sort | hash_stream
    )"
  else
    kind="other"
    fingerprint="present"
  fi

  printf '%s\t%s\t%s\n' "$kind" "$relative_path" "$fingerprint"
done
