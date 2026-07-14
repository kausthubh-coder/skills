#!/usr/bin/env bash
set -euo pipefail

root="${1:-}"

if [ -z "$root" ]; then
  if git_root="$(git rev-parse --show-toplevel 2>/dev/null)"; then
    root="$git_root"
  else
    echo "Oracle init error: pass an explicit project root when not inside a Git repository" >&2
    exit 1
  fi
fi

if [ ! -d "$root" ]; then
  echo "Oracle init error: root does not exist: $root" >&2
  exit 1
fi

root="$(cd "$root" && pwd -P)"
now="$(date +"%Y-%m-%d %H:%M:%S %Z")"

for managed_path in \
  "$root/.artifacts" \
  "$root/.artifacts/runs" \
  "$root/.artifacts/plans" \
  "$root/.artifacts/designs" \
  "$root/.artifacts/demos" \
  "$root/.artifacts/conclusions" \
  "$root/.design" \
  "$root/.design/README.md" \
  "$root/.design/index.json" \
  "$root/.design/.gitignore" \
  "$root/.sandbox" \
  "$root/.sandbox/worktrees" \
  "$root/.sandbox/.gitignore" \
  "$root/.sandbox/README.md" \
  "$root/human.md" \
  "$root/HUMAN.md" \
  "$root/test.md" \
  "$root/TEST.md"; do
  if [ -L "$managed_path" ]; then
    echo "Oracle init error: managed path must not be a symlink: $managed_path" >&2
    exit 1
  fi
done

mkdir -p \
  "$root/.artifacts/runs" \
  "$root/.artifacts/plans" \
  "$root/.artifacts/designs" \
  "$root/.artifacts/demos" \
  "$root/.artifacts/conclusions" \
  "$root/.design" \
  "$root/.sandbox/worktrees"

init_lock="$root/.artifacts/.oracle-init.lock"
if ! mkdir "$init_lock" 2>/dev/null; then
  echo "Oracle init error: another initializer may own this project: $init_lock" >&2
  echo "Verify no Oracle initializer is active before removing a stale lock." >&2
  exit 1
fi

cleanup_init() {
  rmdir "$init_lock" 2>/dev/null || true
}
trap cleanup_init EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

if [ ! -f "$root/human.md" ] && [ ! -f "$root/HUMAN.md" ]; then
  cat > "$root/human.md" <<EOF
# human.md

Human-readable project guide for agents and developers.

## Project

- Purpose:
- Audience:
- Current status:

## Runbook

- Install:
- Run:
- Test:
- Build:
- Verify:
- Testing guide: test.md

## Architecture

- Entry points:
- Key folders:
- Data/state:
- APIs/services:
- Background jobs:

## Surfaces And Ownership

- Web:
- CLI:
- Mobile/desktop:
- Backend/workers:
- Shared contracts/generated code:
- Safe parallel lane boundaries:

## Conventions

- Coding:
- UI/design:
- Testing:
- Secrets:

## Oracle Workspace

- Plans: .artifacts/plans/
- Run ledgers: .artifacts/runs/
- Design records: .artifacts/designs/
- Demos: .artifacts/demos/
- Conclusions: .artifacts/conclusions/
- Design workbench: .design/
- Sandboxes: .sandbox/
- Testing guide: test.md

## Known Gaps

- TBD

## Last Oracle Update

- $now: Oracle workspace initialized.
EOF
fi

if [ ! -f "$root/test.md" ] && [ ! -f "$root/TEST.md" ]; then
  cat > "$root/test.md" <<EOF
# test.md

Project-specific testing guide for agents and developers.

## Testing Contract

- What must be true before work is considered tested:
- Fastest reliable smoke test:
- Full verification path:
- Preferred interactive tool: Browser Use / Computer Use / ADB / project-native CLI
- Oracle lane loop: implementation thread -> frozen checkpoint -> fresh testing thread -> fresh review/scoring thread -> fix with fresh threads -> repeat
- Rule: test and review the same immutable checkpoint; testers report failures but do not edit production source

## Commands

- Install:
- Run app:
- Lint:
- Unit tests:
- Integration tests:
- End-to-end tests:
- Build:

## Browser Testing

- Dev server command:
- Local URL:
- Browser tool:
- Full click-through scope:
- Required env vars:
- Required test user/auth state:
- Clerk agentic-task/browser login flow, when Clerk is used:
- Seed data:
- Reset/cleanup:

## Auth And Data

- Auth provider:
- Data/backend provider:
- How to create or access a signed-in test session:
- How to seed/reset test data:
- Logged-out flows to check:
- Logged-in flows to check:

## Native And Mobile Testing

- Expo command:
- Android emulator/device:
- ADB install/launch/log/screenshot/input commands:
- iOS simulator/device:
- Local build/APK/IPA command:
- When to use Computer Use:
- Full click-through scope:

## CLI Testing

- Build/install command:
- Working directory and fixtures:
- Commands and arguments:
- stdin/stdout/stderr expectations:
- Exit codes:
- Filesystem/config/env effects:
- Invalid input, retries, idempotency, interruption, and cleanup:

## Manual Smoke Checklist

- [ ] App starts
- [ ] Main happy path works
- [ ] Every affected route/screen was opened
- [ ] Every affected button/form/menu/panel/command was clicked or exercised
- [ ] Auth/session states checked when relevant
- [ ] Browser Use or Computer Use was used for affected UI flows when possible
- [ ] Error/empty/loading states checked
- [ ] Data persisted or reset as expected
- [ ] Exact checkpoint SHA/build identity recorded

## Known Issues

- Flaky tests:
- Unsupported local flows:
- External services required:

## Last Oracle Test Update

- $now: Oracle testing guide initialized.
EOF
fi

if [ ! -f "$root/.design/README.md" ]; then
  cat > "$root/.design/README.md" <<'EOF'
# .design

Local UI design workbench for runnable, project-shaped mockups and visual iteration.

Use `.design/` for working design prototypes and variants. Use `.artifacts/designs/`
for exported HTML summaries, screenshots, and decision records.

Recommended run structure:

```text
.design/
  index.json
  <run-id>/
    brief.md
    manifest.json
    context/
    variants/
      v1-<intent>/
      v2-<intent>/
    review/
    exports/
```

Each variant should state what is real, mocked, copied, or fake, and how to run it.
Do not store secrets, production data, node_modules, build output, or dependency
caches here.
EOF
fi

if [ ! -f "$root/.design/index.json" ]; then
  cat > "$root/.design/index.json" <<EOF
{
  "version": 1,
  "purpose": "Oracle local UI design workbench",
  "updatedAt": "$now",
  "runs": []
}
EOF
fi

if [ ! -f "$root/.design/.gitignore" ]; then
  cat > "$root/.design/.gitignore" <<'EOF'
# Local design-workbench dependencies and generated output
**/node_modules/
**/.next/
**/.expo/
**/dist/
**/build/
**/coverage/
**/.cache/
**/.DS_Store

# Never keep local secrets in design workspaces
**/.env
**/.env.*
!**/.env.example
!**/.env.sample
!**/.env.template
!**/.env.dist
EOF
fi

if [ ! -f "$root/.sandbox/.gitignore" ]; then
  cat > "$root/.sandbox/.gitignore" <<'EOF'
# Oracle local sandbox machinery
worktrees/
env/

# Local env files copied for runnable sandbox worktrees
**/.env
**/.env.*
!**/.env.example
!**/.env.sample
!**/.env.template
!**/.env.dist
EOF
fi

if [ ! -f "$root/.sandbox/README.md" ]; then
  cat > "$root/.sandbox/README.md" <<'EOF'
# .sandbox

Local isolation for Oracle prototypes and Git worktrees.

- Standalone prototype: `<run-id>-<lane-id>/`
- Existing-project worktree: `worktrees/<run-id>-<lane-id>/`
- Codex-managed thread worktrees may live elsewhere; record their real paths,
  branches, and checkpoint SHAs in `.artifacts/runs/<run-id>/threads.md`.

Never commit worktree directories, copied env files, credentials, auth state,
dependency caches, or machine-private evidence.
EOF
fi

echo "Oracle workspace initialized at: $root"
echo "Confirmed:"
echo "  $root/.artifacts/runs"
echo "  $root/.artifacts/plans"
echo "  $root/.artifacts/designs"
echo "  $root/.artifacts/demos"
echo "  $root/.artifacts/conclusions"
echo "  $root/.design"
echo "  $root/.sandbox"
echo "  $root/.sandbox/worktrees"
if [ -f "$root/human.md" ]; then
  echo "  $root/human.md"
elif [ -f "$root/HUMAN.md" ]; then
  echo "  $root/HUMAN.md"
fi
if [ -f "$root/test.md" ]; then
  echo "  $root/test.md"
elif [ -f "$root/TEST.md" ]; then
  echo "  $root/TEST.md"
fi
