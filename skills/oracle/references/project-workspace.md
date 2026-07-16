# Oracle Project Workspace

Use this reference for project-root discovery, `oracle init`, the consolidated
`.artifacts/` tree, human documentation, project testing, design workbench,
sandbox worktrees, environment safety, and Git/PR evidence.

## Resolve The Project Root

1. Prefer `git rev-parse --show-toplevel` inside a repository or worktree.
2. If the in-app browser shows a local file, infer and verify its owning project.
3. Otherwise use the current directory only when it has project markers such as
   `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, README, `src/`, or
   `app/`.
4. Treat a directory containing unrelated projects as an umbrella, not a project.
5. If no project exists, use `${ORACLE_HOME:-$HOME/.oracle}` only for genuinely
   projectless planning and label it as a global fallback. Move artifacts when a
   real project is selected.

Before planning or implementation, read the closest `AGENTS.md`, README,
`.artifacts/human.html`, `.artifacts/test.md`, product/design docs, source,
tests, and relevant prior Oracle artifacts.

## `oracle init`

Run:

```bash
bash <oracle-skill-dir>/scripts/oracle_init.sh <resolved-root>
```

`oracle plan` and `oracle implement` also initialize when required. The canonical
project shape is:

```text
.artifacts/
  README.md
  human.html
  test.md
  runs/
  plans/
  designs/
    README.md
    index.json
    workbench/
  demos/
  conclusions/
  examples/
    README.md
    current-template.txt
    html-artifact-template-vN.html
  sandbox/
    README.md
    prototypes/
    worktrees/
```

Do not create root `.plan/`, `.design/`, or `.sandbox/` folders. Do not create a
root `human.md` or `test.md`. Oracle workflow material belongs under
`.artifacts/` so it is easy to find, correlate, review, include selectively in a
PR, or remove without scattering files across the project root.

Initialization preserves existing content. If it finds legacy `.design/`,
`.sandbox/`, `human.md`, or `test.md`, it creates the new canonical structure,
`.artifacts/legacy-migration.md`, and a pending migration status without deleting
or moving legacy content. Planning and implementation runs are blocked until a
human or responsible integration/docs owner merges operational testing guidance
and durable project knowledge, verifies the canonical files, and sets
`.artifacts/legacy-migration.status` to `reconciled`. Never move a registered live
Git worktree directory; remove or relocate it with `git worktree` operations.
Oracle stores a relative-path fingerprint inventory in
`.artifacts/legacy-manifest.tsv`; newly discovered paths or changed legacy files
within the bounded inventory reset the status to `pending` and require another
reconciliation.

Starter content is not verified truth. Inspect the project, validate commands,
and update `.artifacts/human.html` and `.artifacts/test.md` before relying on them.

## Correlated Runs And Files

Use one `YYYYMMDD-HHMM-short-slug` identifier across related files:

```text
.artifacts/runs/20260716-1430-settings-redesign/
.artifacts/plans/20260716-1430-settings-redesign-plan.html
.artifacts/designs/20260716-1430-settings-redesign-design.html
.artifacts/designs/workbench/20260716-1430-settings-redesign/
.artifacts/demos/20260716-1430-settings-redesign-demo.mp4
.artifacts/conclusions/20260716-1430-settings-redesign-conclusion.html
.artifacts/sandbox/worktrees/20260716-1430-settings-redesign-web-editor/
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

Every final HTML artifact visibly includes date/time, run ID, project identity,
artifact type, revision or checkpoint, release boundary, and relative links to
sibling artifacts. Follow `references/html-artifacts.md` for structure, visual
selection, accessibility, and browser QA.

Never store env values, auth cookies, credentials, private user data, raw
transcripts, or bulky caches in committed artifacts.

## Human Project Guide

`.artifacts/human.html` is the internal map a person can open to understand how
the whole codebase works. It is not automatically the public README or a
marketing page.

Keep it current with:

- Product purpose, audience, maturity, and core user workflows.
- Verified install, run, build, lint, test, and verification commands.
- Surfaces such as web, CLI, mobile, backend, workers, and shared packages.
- Architecture: entry points, routes/screens/commands, services, state, data
  flow, storage, APIs, jobs, and key folders.
- Ownership boundaries, generated code, shared contracts, and safe parallel
  lane boundaries.
- Required environment variable names and setup assumptions, never values.
- Coding, design, testing, security, and operational conventions.
- Known gaps, sharp edges, artifact links, and a dated change history.

Use a small architecture or user-flow visual when it communicates the system
better than prose. Use tables for commands and ownership. Parallel lane tasks
propose updates, but the integration/docs owner reconciles the shared page after
accepted behavior is integrated.

## Project Testing Guide

`.artifacts/test.md` is the project-specific operating manual for closing the
loop. Every testing task reads it before verification.

Include:

- Definition of done, fastest reliable smoke path, full verification path, and
  required regression boundary.
- Verified install, run, build, typecheck, lint, unit, integration, end-to-end,
  codegen, and contract commands.
- Required environment variable names, fixtures, seed/reset steps, approved test
  accounts, and mutable-resource locks.
- Exact interactive tool, URL/device, viewport, auth state, routes/screens/
  commands, controls, edge states, and evidence capture.
- Known flaky, unsupported, external-service-dependent, and manual-only checks.
- Date, tested revision, and summary of the last verified update.

### Web, Clerk, And Convex

- Record dev-server command, URL/port, Browser Use backend, viewport matrix, and
  browser-profile ownership.
- Cover affected routes, controls, keyboard/focus behavior, loading, empty,
  error, permission, network, and responsive states plus console/network checks.
- For Clerk, record the approved agentic-task/browser login procedure and test
  user. Do not invent a guest bypass.
- For Convex, record deployment, seed/reset, codegen/typecheck, validators,
  ownership boundaries, and exclusive deployment/user locks.

### CLI, Native, Desktop, Backend, And Libraries

- CLI: working directory, fixtures, stdin/stdout/stderr, exit codes, filesystem
  effects, invalid input, retries, idempotency, interruption, and cleanup.
- Expo/mobile: dev-client/build commands, emulator/simulator/device, ADB or iOS
  tooling, permissions, offline/error/recovery states, and Computer Use steps.
- Desktop/backend/libraries: build/launch commands, safe data, contracts, failure
  paths, retries, persisted state, cleanup, and platform behavior.

Testing tasks record what actually worked under the lane round and propose stale
guide corrections. The integration/docs owner applies them after reconciliation.

## Design Workbench

Runnable, project-shaped UI exploration lives at:

```text
.artifacts/designs/workbench/<run-id>/
  brief.md
  manifest.json
  context/
  variants/
    v1-<intent>/
    v2-<intent>/
  review/
  exports/
```

Export the selected direction and rationale to
`.artifacts/designs/<run-id>-design.html`. Mirror only useful UI structure,
components, tokens, layouts, fixtures, and mocked boundaries. Each variant says
what is real, copied, mocked, or fake and how to run it. Do not copy secrets,
production data, dependency caches, or unrelated backend code.

## Sandbox And Worktrees

Use `.artifacts/sandbox/` for isolated prototypes and project-local worktrees:

- Prototype: `.artifacts/sandbox/prototypes/<run-id>-<lane-id>/`.
- Local Git worktree: `.artifacts/sandbox/worktrees/<run-id>-<lane-id>/`.
- Codex-managed task worktree: may live elsewhere; record its actual path,
  branch, and SHA in the run's `threads.md`.

Create a local worktree with an explicit env-file list:

```bash
bash <oracle-skill-dir>/scripts/oracle_sandbox_worktree.sh \
  <resolved-root> <run-id>-<lane-id> [base-ref] [branch-name] ".env,.env.local"
```

Only launch a task against that worktree when the runtime can target the exact
checkout. Otherwise use the host's managed worktree and record its path.

### Environment Safety

- Inspect `.artifacts/test.md` and source to determine the minimum env files.
- Pass filenames explicitly; the helper copies none by default.
- Accept only top-level `.env` or `.env.*`, skip templates, and reject symlinks.
- Require each source env file to be ignored and each copied file to be mode
  `0600`.
- Record filenames only. Never print, artifact, commit, or PR values.
- Give each lane only the env files needed for its verification.

## Git, PRs, And Cleanup

Preserve unrelated dirty changes. Record local checkpoint-commit authority
separately from push, merge, deploy, or external-service authority.

For independent testing and review, prefer a local checkpoint commit on a scoped
Oracle branch. Every role reports the exact SHA it inspected. Never push or merge
merely because a checkpoint exists.

When appropriate, a PR includes source, tests, `.artifacts/human.html`,
`.artifacts/test.md`, and useful plan/design/conclusion evidence. Exclude
`.artifacts/sandbox/worktrees/`, copied env files, credentials, auth state, raw
transcripts, dependency caches, and machine-private noise.

The PR description links the plan and conclusion, summarizes lane checkpoints
and integration, lists exact automated and interactive verification, identifies
mocks versus real systems, and names untested or unpromoted work.
