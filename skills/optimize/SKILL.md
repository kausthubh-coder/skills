---
name: optimize
description: Audit an existing project for agent-native development and produce a ranked plan - verification, AGENTS.md, structure enforced by lint and types, vertical slices, test quality - at the depth I pick, then carry it out one verified step at a time. Use for /optimize. For a brand-new project use /init-project.
disable-model-invocation: true
---

# Optimize

Make an existing repo easier for agents to work in, so changes are verified, mistakes get caught by structure, and every feature is easy to find. Audit first, plan second, change code only for the items I pick.

## 1. Pick the depth

Ask once, recommending one based on the repo's size and state:

| Depth | What it covers | Typical result |
|---|---|---|
| quick | AGENTS.md, commands, verification gaps, obvious slop tests | a handful of fixes done in one session |
| standard | quick + mistakes agents keep repeating (git history, my T3 threads), lint and type rules, duplicate patterns, giant files | a plan for a few sessions |
| deep | standard + restructure toward vertical slices and deep modules, sequenced as a migration | a multi-step restructure plan |

Also ask whether there's an area I care about most (a feature, a pain point).

## 2. Audit

Use read-only subagents for the parallel parts. Every finding cites `file:line`, a commit, or a thread title. No finding without evidence.

1. **Verification.** Can an agent launch the app, use it like a user, and see the result (screens, logs, data)? Is there a `verify-*` skill, and does it still match the app? Are checks fast, and is there one command for them? Is test data realistic? Check tests against `principle-test-behavior-not-implementation`: list tests that would pass if every function returned undefined.
2. **Steering.** Is AGENTS.md a short, accurate map, or a long rulebook? List claims that are stale, contradict the code, or that nothing enforces. Find duplicate ways of doing the same thing, half-finished migrations, and dead code an agent might copy.
3. **Repeated mistakes** (standard and deep). Run the `correct` skill's "find the mistake classes" step over recent commits, reverts and fix-ups. Then read my past agent sessions for this repo and find where I corrected or pushed back on the agent. A correction I gave twice is a mistake class. Sources, use whichever exist:
   - T3 Code threads: `t3_project_list` (match `workspaceRoot`), then `t3_thread_list` and `t3_thread_read`.
   - Claude Code sessions: `~/.claude/projects/<repo path with separators as dashes>/*.jsonl` (also its worktree paths).
   - Codex sessions: `~/.codex/sessions/**/*.jsonl`; keep the ones whose `cwd` is this repo or one of its worktrees.
   Read user messages only, newest first, and stop when new sessions stop adding new mistake classes.
4. **Locality.** By feature or by layer? List the largest source files with line counts. Pick two real features and count the files you'd have to open to change each one. Note hidden wiring (dynamic names, magic strings, global state) that grep can't follow. Use `principle-minimize-reader-load` and `codebase-design`.
5. **Safety.** Ways an agent could touch live data, production deploys, my real profiles or secrets. Whether the repo works in a fresh worktree (env files, ports).

### Gaps every one of my projects had (check these first)

From the 2026-10-12 audits of krida, Studi and kriyan (`reports/` in the skill library):

- The main checkout is behind `origin/main` or has broken `node_modules`. T3 copies `.env.local` from it, so every new worktree starts broken.
- No `.gitattributes`, so line endings churn.
- Hard-coded dev port; parallel worktrees collide.
- All worktrees share one dev backend, so a branch's functions overwrite another's.
- No doctor: broken setup or dead credentials show up mid-task.
- Production commands written in AGENTS.md as routine; destructive admin functions with no deployment check.
- Dozens of stale worktrees with stranded uncommitted work.
- Tests listed by hand (some never run); e2e that skips on a missing function and looks like a pass.
- Agents said done without driving the changed screens.
- T3's worktree-create script never ran. With project settings folded, T3 only reads `projectSettingsOverrides` in `~/.t3/userdata/settings.json`, and scripts saved through `t3_project_update` are ignored. No `worktree-<app>` or `ship-<app>` skill, so the main checkout falls weeks behind.

## 3. Plan

Write the plan where this repo keeps plans (look for `.agent/plans`, `docs/plans`, or similar; otherwise `.agents/plans/`), named `optimize-<date>.md`. Use the repo's own format if it has one (Studi uses HTML plans).

- **Snapshot:** stack, layout, size, and the agent setup today.
- **Findings**, grouped by the five audit areas, each with evidence.
- **Plan:** numbered items ranked by value for effort, grouped as quick wins, medium, and deep. Each item says what changes, why (the finding it fixes), how it will be verified, and roughly how big it is.
- **For deep:** the restructure as an ordered migration, one feature folder at a time, each step leaving the app working.

Show me the plan and wait. I pick the items.

## 4. Carry it out

- One item at a time. Each ends in a state you checked: known-good, one change, check, next.
- Prefer the strongest fix: make the mistake impossible (structure, types), then a lint rule whose error says what to do instead, then a test, then docs last (the `correct` skill's order).
- Missing verification comes first. If there's no `verify-*` skill, run `create-verification-skill` before restructuring anything, so every later step can be proven. If one exists but may be stale, run `maintain-verification-skill`. If there's no `worktree-<app>` or `ship-<app>` skill, run `create-project-flows`.
- Restructures move code without changing behavior, so behavior tests and the verify skill must pass before and after each step.
- Never commit, push or deploy unless I ask. Update the plan file as items finish.
