# Oracle Project Workspace

Use this reference for root discovery, `oracle init`, artifacts, `human.md`, `test.md`, `.design`, `.sandbox`, worktrees, environment safety, and Git/PR evidence.

## Resolve The Project Root

1. Prefer `git rev-parse --show-toplevel` inside a repository or worktree.
2. If the in-app browser shows a local file, infer and verify its owning project.
3. Otherwise use the current directory only when it has project markers such as `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, README, `src/`, or `app/`.
4. Treat a directory containing unrelated projects as an umbrella, not a project.
5. If no project exists, use `${ORACLE_HOME:-$HOME/.oracle}` only for genuinely projectless planning and label it as a global fallback. Move artifacts when a real project is selected.

Before planning or implementation, read the closest `AGENTS.md`, `human.md`/`HUMAN.md`, `test.md`/`TEST.md`, README, product/design docs, source, tests, and prior Oracle artifacts.

## `oracle init`

Run:

```bash
bash <oracle-skill-dir>/scripts/oracle_init.sh <resolved-root>
```

`oracle plan` and `oracle implement` also run initialization when required. Initialization preserves existing files and creates missing workflow structure:

```text
.artifacts/
  runs/
  plans/
  designs/
  demos/
  conclusions/
.design/
.sandbox/
  worktrees/
human.md
test.md
```

Do not create `.plan/`. HTML plans belong in `.artifacts/plans/`. `human.md` and `test.md` remain at the project root because every role thread must find them immediately.

Initialization creates starter guidance, not verified truth. Inspect the project, run or validate commands, and replace placeholders before relying on them.

## Correlated Runs, Lanes, And Artifacts

Use one `YYYYMMDD-HHMM-short-slug` across the run:

```text
.artifacts/runs/20260712-1430-settings-redesign/
.artifacts/plans/20260712-1430-settings-redesign-plan.html
.artifacts/designs/20260712-1430-settings-redesign-design.html
.artifacts/demos/20260712-1430-settings-redesign-demo.mp4
.artifacts/conclusions/20260712-1430-settings-redesign-conclusion.html
.design/20260712-1430-settings-redesign/
.sandbox/worktrees/20260712-1430-settings-redesign-web-editor/
```

The run directory has one lane directory per independently testable feature:

```text
.artifacts/runs/<run-id>/
  ledger.md
  threads.md
  subagents.md
  decisions.md
  resource-locks.md
  thread-briefs/
  subagent-briefs/
  lanes/
    <lane-id>/
      lane.md
      rounds/
        1/
          implementation.md
          testing.md
          review.md
          scorecard.json
  evidence/
```

Every HTML artifact visibly includes date/time, run ID, project name/root, artifact type, lane summary, release boundary, and links to sibling artifacts. Keep pages self-contained and phone-readable.

Never store env values, auth cookies, credentials, private user data, raw transcripts, or bulky caches in `.artifacts/`.

## human.md

`human.md` is the internal map a person can read to understand how the whole codebase works. It is not automatically the public README or marketing page.

Document:

- Product purpose, audience, current status, and core user workflows.
- Install, run, build, lint, test, and verification commands.
- Surfaces such as web, CLI, mobile, backend, workers, and shared packages.
- Architecture: entry points, routes/screens/commands, services, state, data flow, storage, APIs, jobs, and key folders.
- Ownership boundaries, generated code, shared contracts, and safe parallel lane boundaries.
- Required env variable names and setup assumptions, never values.
- Coding, design, testing, security, and operational conventions.
- Oracle artifact, design, sandbox, and testing locations.
- Known gaps, sharp edges, and last meaningful Oracle update.

Parallel lane threads propose changes, but the final integration/docs owner updates shared `human.md` after accepted behavior is integrated.

## test.md

`test.md` is the project-specific operating manual for closing the loop. It is read by every testing thread and should describe how to test the real project, not a generic ideal.

Include:

- Definition of done, fastest reliable smoke path, full verification path, and required regression boundary.
- Install, run, build, typecheck, lint, unit, integration, end-to-end, codegen, and contract commands that were verified.
- Required env variable names, fixtures, seed/reset steps, test accounts, and mutable-resource locks.
- Exact interactive tool, URL/device, viewport, auth state, routes/screens/commands, controls, and edge states.
- How to capture screenshots, logs, console/network errors, ADB evidence, and cleanup.
- Known flaky, unsupported, external-service-dependent, or manual-only checks.
- Surface-specific sections so CLI, web, mobile, backend, and shared contracts can be tested independently.
- Date, tested revision, and summary of the last verified update.

### Web

- Dev server command, URL/port, Browser Use backend, viewport matrix, and browser-profile ownership.
- Affected routes, links, buttons, forms, menus, dialogs, keyboard/focus behavior, loading/empty/error/permission/network states, console/network inspection, and screenshots.

### Clerk And Convex

- Exact Clerk agentic-task/browser login flow for a real signed-in test session.
- Approved test user, signed-in/signed-out coverage, auth-state reuse, and no fake guest bypass.
- Convex deployment/seed/reset, codegen/typecheck, schema assumptions, validators, ownership boundaries, and exclusive deployment/user locks.

### CLI

- Build/install invocation, working directory, fixtures, environment, stdin, stdout/stderr, exit codes, filesystem effects, invalid input, retries, idempotency, cleanup, and platform matrix.

### Expo, Android, And iOS

- Expo/dev-client/build commands and emulator/simulator/device setup.
- ADB install, launch, stop/reset, logcat, screenshot, UI tree, input, deep link, package/activity, and cleanup commands.
- Computer Use steps for touch, navigation, back, keyboard, permission, offline, error, and recovery flows.

### Desktop, Backend, And Libraries

- Build/launch or fixture/service commands, permissions, safe data, contracts, failure paths, retries, persisted state, cleanup, and OS integration where applicable.

The testing thread records what actually worked under the lane round. It proposes stale `test.md` corrections; the integration/docs owner applies them after all lanes are reconciled.

## Local Design Workbench

`.design/` is the runnable project-shaped UI exploration area. `.artifacts/designs/` stores exported summaries and decisions.

Use:

```text
.design/<run-id>/brief.md
.design/<run-id>/manifest.json
.design/<run-id>/context/
.design/<run-id>/variants/<intent>/
.design/<run-id>/review/
.design/<run-id>/exports/
```

Mirror only useful UI structure, components, tokens, layouts, fixtures, and mocked boundaries. Each variant states what is real, copied, mocked, or fake and how to run it. Do not copy secrets, production data, dependency caches, or unrelated backend code.

## Sandbox And Worktrees

Use `.sandbox/` for standalone prototypes and project-local isolated worktrees:

- Standalone prototype: `.sandbox/<run-id>-<lane-id>/`.
- Local Git worktree: `.sandbox/worktrees/<run-id>-<lane-id>/`.
- Codex-managed thread worktree: may live outside `.sandbox`; record its actual path, branch, and SHA in `threads.md`.

Create a project-local worktree with an explicit env-file list:

```bash
bash <oracle-skill-dir>/scripts/oracle_sandbox_worktree.sh \
  <resolved-root> <run-id>-<lane-id> [base-ref] [branch-name] ".env,.env.local"
```

Only launch a thread against that local worktree when the runtime supports targeting the exact checkout. Otherwise use `create_thread` with its worktree environment and record the Codex-managed path.

### Env Safety

- Inspect `test.md` and source to determine the minimum env files required by a lane.
- Pass required filenames explicitly; the helper copies none by default.
- Accept only top-level `.env` or `.env.*` filenames, skip templates, and reject symlinks.
- Require the destination to be Git-ignored and mode `0600`.
- Record filenames only. Never print, artifact, commit, or PR values.
- Different lane worktrees receive only the env files needed for their tests.

## Git And Checkpoints

Preserve unrelated dirty changes. Record whether local checkpoint commits are authorized separately from push/merge/deploy authority.

For independent lane testing and review, prefer a local checkpoint commit on `oracle/<run-id>/<lane-id>`. Every role reports the exact SHA it inspected. Never push or merge merely because a checkpoint exists.

When appropriate, a final PR includes source, tests, `human.md`, `test.md`, and useful plan/design/conclusion artifacts. Exclude worktrees, copied env files, credentials, auth state, raw transcripts, dependency caches, and machine-private noise.

The PR description links plan and conclusion artifacts, summarizes lane checkpoints and integration, lists exact code and interactive verification, identifies mocks versus real systems, and names untested or unpromoted work.
