# Oracle Quality And Delivery

Use this reference for plan acceptance, lane loops, project-specific testing, independent review, integration, scorecards, UI quality, demos, conclusions, and stopping rules.

## `oracle plan` Flow

1. Restate the literal request and intended user outcome.
2. Read `.artifacts/human.html`, `.artifacts/test.md`, repository instructions, product/design docs, source, routes/commands, data model, tests, and prior artifacts.
3. Separate observed facts, user statements, assumptions, inferences, and open questions.
4. Research unstable external facts through primary official sources.
5. Create parallel real research threads for independent repo mapping, service/architecture options, UX, risks, and test strategy when useful. Those threads may use private subagents.
6. Ask only questions that materially change behavior, architecture, data safety, cost, permissions, or release scope.
7. Compare paths with one rubric: fit, complexity, migration risk, cost/services, test burden, reversibility, and recommendation.
8. Define the lane graph: prerequisites, parallel lanes, shared files/contracts, mutable resources, integration order, and acceptance criteria.
9. Give the draft plan to a fresh plan-review thread. Resolve blocking gaps before marking it decision-grade.

Create `.artifacts/plans/<run-id>-plan.html` with:

- Date/time, run ID, repository identity and relative root, goal, scope/non-goals, source of truth, and authority. Do not embed a machine-specific absolute path in commit-worthy HTML.
- Current-state findings and source paths.
- Facts, assumptions, questions, sources, options, and selected/rejected rationale.
- Technical design, data/API/UI/CLI behavior, migration/rollback, security, and edge cases.
- Lane graph with ownership, dependencies, worktree/checkpoint strategy, resources, and integration contract.
- `.artifacts/test.md` strategy, interactive tools, fixtures/auth/data setup, acceptance criteria, score targets, and release boundary.
- Related design workbench, sandbox, run ledger, and expected conclusion paths under `.artifacts/`.
- Plan-review findings and disposition.

Follow `references/html-artifacts.md`. Use a dependency graph, sequence,
comparison table, timeline, test matrix, or other visual only when it
communicates the plan more clearly than prose.

Plan acceptance requires sourced facts, executable lane boundaries, testable acceptance criteria, explicit unresolved decisions, and no blocking plan-review finding. Planning is production-source read-only.
When those conditions pass, the orchestrator writes `accepted` to the run's `plan-acceptance.status`; this is the executable promotion gate for implementation.

## `oracle implement` Parallel Closed Loop

The orchestrator manages multiple lane loops:

```text
lane A: implement thread -> .artifacts/test.md testing thread -> review/score thread -> fix/repeat
lane B: implement thread -> .artifacts/test.md testing thread -> review/score thread -> fix/repeat
lane C: implement thread -> .artifacts/test.md testing thread -> review/score thread -> fix/repeat
                                     |
                                     v
accepted lane checkpoints -> integration thread -> regression test thread -> final review thread
```

### 1. Baseline And Lane Graph

- Load the matching plan, `.artifacts/human.html`, `.artifacts/test.md`, source/tests, and repo instructions.
- Record branch/SHA, dirty state, user changes, local-commit authority, mutable resources, and release authority.
- Choose one reproducible baseline: clean `HEAD`/named branch, an explicitly authorized checkpoint containing relevant dirty changes, or an immutable patch plus base SHA. Do not let worktrees silently omit source-of-truth changes.
- Confirm lane boundaries and shared/generated files. Extract prerequisite lanes when ownership overlaps.
- Initialize `threads.md`, `resource-locks.md`, and one lane directory per feature.

### 2. Implementation Threads

- Start one real worktree thread for each currently unblocked lane.
- Give exact allowed/forbidden paths and resource scope.
- Allow private subagent fan-out inside a lane, but keep one editor per overlapping behavior.
- Use an explicitly requested specialist such as Claude inside the implementation thread only; no concurrent Codex editor on that lane.
- Run focused developer checks and freeze an immutable checkpoint.
- Do not let the orchestrator silently patch feature source between checkpoints.

### 3. Testing Threads

After a lane writer exits, start a fresh testing thread from the exact checkpoint.

- Read `.artifacts/test.md` immediately before operating the app.
- Run focused unit/component tests first, then relevant typecheck, lint, codegen, schema/contract, integration, build, and regression commands.
- Use Browser Use for web; ADB plus Computer Use for native/mobile; Computer Use for desktop; real commands and fixtures for CLI/backend/library work.
- Verify every affected route/screen/command, control, state, side effect, and cleanup path.
- Record exact command, result, checkpoint, URL/device/viewport, auth/data state, screenshots/logs, failure reproduction, duration when useful, and untested scope.
- Do not fix source. Return failed evidence to the orchestrator.
- Return structured evidence; the orchestrator writes the canonical lane-round testing record in the root run directory.

### 4. Review And Score Threads

After testing is stable, start a fresh read-only review thread from the same checkpoint. Supply:

- Intent, plan, lane acceptance criteria, checkpoint, exact diff, and changed files.
- Code-test commands/results.
- Interactive coverage, screenshots/logs, URL/device/viewports/auth/data state, and errors.
- Known blockers, skipped checks, and proposed release status.

Review axes:

- Correctness, regressions, edge cases, race/data-loss behavior.
- Security, privacy, auth/ownership, validation, permissions, secrets, and dependencies.
- Test credibility and missing coverage.
- UI/UX intent, accessibility, responsive behavior, states, copy, and interaction completeness.
- CLI/API contract quality where applicable.
- Performance, reliability, project-pattern fit, maintainability, docs, and release truth.

The reviewer did not write the code and does not inherit writer rationale as its review context.
It returns structured findings and scores; the orchestrator writes the canonical review and scorecard artifacts.

### 5. Lane Refinement

When a lane gate fails:

1. Record the failed evidence, severity, and scores under `lanes/<lane-id>/rounds/<N>/`.
2. Form one concrete hypothesis and authorized fix scope.
3. Start a fresh implementation thread from the latest checkpoint.
4. Freeze checkpoint `N+1`.
5. Start fresh testing and review threads against `N+1`.
6. Repeat while each round produces new evidence or meaningful improvement.

Do not rerun unchanged prompts against unchanged code. Do not accept a lane because a writer believes a reviewer is wrong; reproduce or explicitly disposition the finding.

### 6. Integration And Regression

After required lanes pass:

- Start an integration thread and combine accepted checkpoints in dependency order.
- Resolve conflicts against user intent and the plan.
- Update shared/generated files plus `.artifacts/human.html` and `.artifacts/test.md` through the designated integration/docs owner.
- Freeze the integrated revision.
- Start a fresh regression-testing thread for cross-lane workflows and shared contracts.
- Start a fresh final-review thread with the complete diff and regression evidence.
- If either fails, use a fresh integration-fix thread and repeat both gates.

## Project-Specific Interactive Testing

### Web

- Start the documented server and verify the actual URL.
- Use Browser Use for all changed flows, desktop/mobile viewports, keyboard/focus, screenshots, console, and network errors.
- Click every affected control; verify loading, empty, disabled, invalid, permission, auth, network, retry, success, and recovery states.

### Clerk And Convex

- Use the documented Clerk agentic-task/browser login process for a real signed-in session.
- Test relevant signed-in and signed-out behavior; never invent a guest bypass.
- Use the documented Convex deployment and seeded data.
- Run codegen/typecheck and verify schema, validators, auth/ownership, and public/private boundaries.
- Serialize threads sharing a deployment, test user, seed set, or browser profile.

### CLI

- Build/install the exact checkpoint.
- Exercise help, happy path, invalid input, stdin, stdout/stderr, exit codes, filesystem effects, config/env behavior, retries, idempotency, interruption, and cleanup.
- Test from documented working directories and on required platforms/shells.

### Expo, Android, And iOS

- Follow the documented Expo/dev-client/build flow.
- Use ADB for install, launch, stop/reset, logcat, screenshot, UI tree, input, package/activity, and deep links.
- Use Computer Use for touch, navigation, back, keyboard, permissions, loading, offline, error, and recovery.
- Verify the actual build/version and reset state.

### Desktop, Backend, And Libraries

- Build and launch or run real functions/commands with safe fixtures.
- Verify windows/menus/files/permissions or contracts/invalid input/exit codes/retries/idempotency/cleanup as applicable.

If auth, quota, schema drift, credentials, browser attachment, device setup, or external services block testing, record the exact blocker and best honest fallback. Never fabricate a pass.

## Review Scorecard

Review threads return 0-5 evidence-backed scores for applicable categories:

- Implementation correctness.
- Tests and `.artifacts/test.md` coverage.
- Security, privacy, auth, and secrets.
- UI/UX and product-intent fit.
- Accessibility and responsive behavior.
- CLI/API contract quality.
- Performance and reliability.
- Project-pattern fit and maintainability.
- Docs, artifacts, and `.artifacts/human.html` accuracy.
- Integration/deployment readiness.

Also return P0-P3 findings, untested scope, accepted risks, and readiness for the authorized release boundary as `yes`, `no`, or `blocked`.

Default lane and final pass:

- Every applicable category is at least 4/5.
- No unresolved P0/P1 remains.
- P2 findings are fixed or explicitly accepted by the orchestrator/user.
- Required code and interactive evidence exists for the exact checkpoint.
- Artifacts and release language match reality.

A score without concrete evidence is not a pass.

## UI And Design Quality

For UI work, use `.artifacts/designs/workbench/` and the available UI design/audit skill when variants or deeper critique help. Verify the actual target workflow, expected controls, existing design system, hierarchy, density, responsive constraints, text fit, complete states, keyboard/focus, semantic labels, contrast, reduced motion, and desktop/mobile layouts.

The UI implementation thread may use a specialist such as Claude when explicitly requested. The independent testing and review threads still verify the result; specialist self-testing is useful developer evidence, not the final Oracle gate.

## Stop Conditions

Do not impose an arbitrary loop count, thread count, dollar cap, or response-only definition of done. Stop a lane or the integrated run when:

1. Required gates pass and acceptance criteria are evidenced.
2. The user explicitly accepts a named risk or untested boundary.
3. A hard blocker requires user input, credentials, service recovery, or unavailable infrastructure.
4. Further work shows evidenced diminishing returns with no new hypothesis or meaningful improvement.

Record the reason per lane and for the integrated run.

## Peekaboo Demo

After the integrated visible behavior passes, verify Peekaboo and capture a focused phone-friendly demo under `.artifacts/demos/`. Show the happy path and one important edge/error state when practical. Avoid secrets and unrelated windows. Verify the MP4 is non-empty and references the tested integrated checkpoint.

Reference: `https://peekaboo.sh/commands/capture.html`

## Conclusion

`oracle implement` ends with `.artifacts/conclusions/<run-id>-conclusion.html` containing:

- Original goal, plan, authority, final integrated checkpoint, and release boundary.
- Lane graph, thread roles, round history, accepted checkpoints, and integration order.
- Synthesized decisions and specialist use, not raw transcripts.
- Design/sandbox paths and selected/rejected choices.
- Code tests, exact outcomes, interactive coverage, screenshots/errors, devices/viewports/auth/data state, and edge cases.
- Review findings, scorecards, fixes, blockers, risks, and untested scope.
- `.artifacts/human.html` and `.artifacts/test.md` updates.
- Embedded Peekaboo demo when available.
- Git/PR/deploy status and honest final status.

Follow `references/html-artifacts.md`. Use a lane timeline, verification matrix,
and compact score plot when they improve understanding, and remove any example
visual that is not backed by this run's evidence.

Use `locally verified` only for an integrated revision that passed local gates. Use `shipped` only after the requested release action occurred and was verified.
