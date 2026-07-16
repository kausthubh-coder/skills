---
name: oracle
description: >-
  Run the user's agentic engineering workflow with `oracle init`, `oracle plan`,
  and `oracle implement`: one structured project-local `.artifacts` workspace,
  human.html and test.md; real Codex thread orchestration; parallel feature lanes
  in isolated Git worktrees; fresh implementation, testing, and review threads;
  internal subagent fan-out; evidence-backed refinement loops; and dated HTML
  plans and conclusions. Use when the user invokes Oracle for project setup,
  planning, implementation, parallel work, testing, review, or closed-loop work.
---

# Oracle

## Purpose

Package the user's normal engineering workflow so it does not need to be restated. Invoke the global skill as `$oracle init`, `$oracle plan`, or `$oracle implement` (natural-language `oracle ...` is equivalent). Oracle has three commands:

```text
oracle init [project root]
oracle plan <goal>
oracle implement <goal or plan>
```

Oracle combines five behaviors:

1. Create a durable `.artifacts/` workspace with human-readable project context and polished HTML artifacts.
2. Split separable work into parallel feature lanes with isolated Git state.
3. Give each lane fresh implementation, testing, and review threads.
4. Close every lane with project-specific `.artifacts/test.md` evidence and scored review.
5. Repeat failed lanes, integrate accepted lanes, then run final regression and release review.

## Commands

### `oracle init`

Initialize or repair the Oracle workspace without changing production behavior:

```bash
bash <oracle-skill-dir>/scripts/oracle_init.sh <resolved-root>
```

Create or repair the single `.artifacts/` workspace, including `human.html`, `test.md`, `runs/`, `plans/`, `designs/workbench/`, `demos/`, `conclusions/`, `examples/`, and `sandbox/`. Preserve existing content. Inspect the project and replace starter placeholders with verified commands and architecture when practical.

`.artifacts/human.html` is the polished internal codebase map for people and agents. `.artifacts/test.md` is the project-specific operating manual used by testing threads. Test evidence belongs under `.artifacts/runs/<run-id>/`.

If legacy root `.design`, `.sandbox`, `human.md`, or `test.md` content exists, initialization preserves it and creates `.artifacts/legacy-migration.md`, a fingerprinted manifest, and a pending status. Read and reconcile the legacy content before planning or implementation. Runs remain blocked until `.artifacts/legacy-migration.status` is explicitly set to `reconciled`; never mark it reconciled without merging operational testing instructions and durable project knowledge. Added, changed, or removed content anywhere in the non-generated legacy tree resets the status to `pending`, and every run start recomputes the inventory so a stale reconciled marker cannot bypass the gate. If the legacy inventory becomes empty, verify the removals were intentional before reconciling it.

### `oracle plan`

Research and create a decision-grade plan without editing production source.

- Run initialization first when needed.
- Read `.artifacts/human.html`, `.artifacts/test.md`, repository instructions, product/design docs, source, tests, and relevant prior artifacts.
- Create real research threads for independent repo mapping, external research, architecture, UX, risk, and test strategy when parallel work improves the answer.
- Research threads may use private subagents for narrower fan-out.
- The orchestrator synthesizes facts, assumptions, alternatives, lane boundaries, dependencies, acceptance criteria, and verification into `.artifacts/plans/<run-id>-plan.html`.
- For UI work, use `.artifacts/designs/workbench/<run-id>/` for runnable variants and `.artifacts/designs/` for the exported decision record.
- Build every HTML plan from the HTML artifact standard. Use diagrams, timelines, comparison tables, matrices, or score plots only when they make relationships or evidence easier to understand.
- Plan mode is production-source read-only and artifact-write. Do not commit, push, or deploy.

### `oracle implement`

Implement the goal or matching plan through parallel closed-loop lanes.

- Run initialization and load the matching plan.
- Turn the current thread into the orchestrator for substantial or separable work. It manages intent, lanes, threads, resources, evidence, integration decisions, and artifacts; it does not write feature source.
- Split by independently shippable behavior, ownership, and mutable resources. Examples: CLI lane, web-app lane, backend lane, or multiple independent web feature lanes.
- Give each lane a unique branch/worktree, write scope, resource scope, and acceptance contract.
- Run each lane as a sequential three-thread loop: implementation thread, testing thread, then independent review/scoring thread.
- Run different lanes concurrently when their code and mutable resources do not overlap.
- When a lane fails, start a fresh implementation thread with the failed evidence, produce a new checkpoint, then start fresh testing and review threads. Do not ask the original writer to be its only reviewer.
- After lanes pass, use an integration thread to combine accepted checkpoints, then fresh regression-testing and final-review threads against the integrated revision.
- Update shared `.artifacts/human.html` and `.artifacts/test.md` only through the integration/docs owner after lane findings are reconciled.
- For visible work, capture a Peekaboo demo when practical.
- Create `.artifacts/conclusions/<run-id>-conclusion.html` with lane history, final diff, evidence, scores, limitations, and release status.

Words after a command describe the request. Testing, review, design, sandboxing, orchestration, demos, and conclusions are stages inside `plan` or `implement`, not additional commands.

## Real Thread Orchestration

For substantial `oracle implement` runs, real Codex threads are the durable phase boundaries. Private subagents are additional helpers inside those threads, not replacements for the implementation/test/review separation.

The orchestrator may use `list_projects`, `create_thread`, `read_thread`, `send_message_to_thread`, and related Codex task tools. Use a real worktree environment for every writing lane. Record every thread ID, role, branch, worktree, checkpoint, status, and artifact path in the run ledger.

Invoking `$oracle plan` or `$oracle implement` explicitly opts into the real role threads defined by this command contract. When Oracle is inferred from ordinary natural language rather than explicitly invoked, confirm thread creation once before calling user-visible task tools. If real-thread tools are unavailable, report the workflow as blocked; do not silently collapse implementation, testing, and review into one thread.

### Lane State Machine

```text
queued
  -> implementation thread writes and freezes checkpoint N
  -> testing thread follows .artifacts/test.md against checkpoint N
  -> review thread audits checkpoint N plus test evidence and scores it
  -> accepted
     OR findings -> fresh implementation thread -> checkpoint N+1 -> fresh test -> fresh review
```

Rules:

1. No implementation writer, tester, or reviewer operates on a moving revision.
2. Do not run test/review against a lane until its writer has exited and the checkpoint identity is frozen.
3. The testing thread does not fix source. It records reproducible failures and evidence.
4. The review thread is fresh, read-only, did not author the code, and receives the exact diff plus test evidence.
5. A fix round uses fresh threads. Reuse a thread only for a tightly related clarification, never as the only independent review.
6. No two active writers edit the same file or overlapping behavior, even in different worktrees.
7. One mutable resource has one owner at a time: browser profile, port, Clerk user, Convex deployment, database, fixture set, emulator/device, or provider sandbox.
8. Competing implementations are explicit alternatives. Select one; do not merge both automatically.
9. Role threads return structured results. The orchestrator alone materializes canonical ledgers, lane evidence, scorecards, and HTML artifacts in the root project; lane branches do not commit competing run-control files.
10. The orchestrator may write canonical artifacts but delegates source changes, testing, review, and integration to role threads.

## Parallel Lanes

Create as many lanes as the architecture supports; do not use a fixed thread count. A project with a CLI and a web app may have a CLI lane plus one or more independent web lanes, each running its own three-thread loop concurrently.

Do not create decorative parallelism. Two tasks belong in separate lanes only when they have:

- Disjoint or explicitly ordered source ownership.
- Independent acceptance criteria.
- Independent or schedulable mutable resources.
- A clear integration contract.

If two features share schemas, generated clients, migrations, core types, or the same live service state, extract a prerequisite lane or sequence them.

## Threads And Subagents

- The orchestrator creates and manages real Codex threads.
- Each real thread receives a narrow context packet rather than the full conversation.
- A worker thread may use private subagents for read-heavy exploration, logs, UI critique, or bounded disjoint work.
- Worker threads must not create more real Codex threads unless the orchestrator explicitly delegates lane coordination.
- Close completed private subagents promptly. Archive or clearly label completed real threads after their evidence is recorded.
- There is no arbitrary maximum lane count or loop-round count. Capacity is constrained by real independence and shared resources, not by a small hard-coded number.
- Honor actual host/tool concurrency and any user-specified cost or token budget. Queue excess lanes; do not treat “no arbitrary cap” as infinite operational capacity.

## Checkpoint And Git Contract

Independent testing/review worktrees need an immutable revision.

- Record whether local checkpoint commits are authorized. A local checkpoint commit is never permission to push.
- Prefer one scoped local checkpoint commit per lane round, named with run/lane/round, so fresh test and review threads can start from the exact ref.
- If local commits are not authorized, use an immutable patch/bundle plus tree identity and only use fresh threads when the runtime can target that exact checkout. Otherwise ask before claiming independent worktree verification.
- Never commit secrets, copied env files, auth state, `.artifacts/sandbox/worktrees/`, or machine-private evidence.
- Integration happens only after the lane review accepts the checkpoint.

## Load References

- `references/project-workspace.md`: root discovery, the consolidated `.artifacts` tree, `human.html`, `test.md`, design workbench, sandbox/worktrees, env safety, and Git/PR handling.
- `references/orchestration.md`: real threads, lane decomposition, context packets, checkpoints, resource locks, subagents, and integration.
- `references/quality-delivery.md`: plan acceptance, implementation/testing/review loops, interactive verification, scorecards, demos, conclusions, and stopping rules.
- `references/html-artifacts.md`: required structure, visual design, visualization selection, accessibility, provenance, and browser QA for HTML pages.
- `oracle init`: read project workspace.
- `oracle plan`: read all four, emphasizing plan acceptance, lane design, and the HTML artifact standard.
- `oracle implement`: read all four; use the HTML standard for design records and conclusions.

## Run Contract

For non-trivial work, create or resume one correlated run:

```bash
bash <oracle-skill-dir>/scripts/oracle_init.sh <resolved-root>
bash <oracle-skill-dir>/scripts/oracle_start_run.sh <resolved-root> <run-id> <plan|implement> "<short request>"
bash <oracle-skill-dir>/scripts/oracle_lane_state.sh <resolved-root> <run-id> <lane-id> <action> [...]
```

Use `YYYYMMDD-HHMM-short-slug`. Store lane briefs and rounds under `.artifacts/runs/<run-id>/lanes/<lane-id>/`. The lane-state helper enforces `checkpoint -> test -> review -> accept/fix-required` against one checkpoint identity; the orchestrator calls it after materializing each role's structured evidence. On resume, reconcile the ledger with actual Git branches/worktrees, active threads, processes, browser/device state, and external services.

After independent plan review resolves blocking gaps, the orchestrator writes `accepted` to `.artifacts/runs/<run-id>/plan-acceptance.status`. Do not start implementation lane threads while that marker is pending, including runs invoked directly with `oracle implement`.

## Intent And Authority

Before threads or external actions, record:

- Literal request, intended outcome, source of truth, scope, non-goals, and must-preserve behavior.
- Lane boundaries, dependencies, allowed paths, and mutable-resource ownership.
- Whether local commits, pushes, deploys, account changes, or production-data changes are authorized.
- Acceptance criteria, testing boundary, score target, and release boundary.
- Baseline policy: clean `HEAD`, an explicitly authorized frozen dirty-state checkpoint/patch, or a named existing branch. Every dependent lane starts from the same recorded identity.

Threads and subagents may narrow this authority, never broaden it. Never expose secrets in prompts, artifacts, logs, screenshots, videos, or commits.

## Done Means Evidence

A plan is accepted only when its facts are sourced, lane boundaries and dependencies are executable, acceptance criteria are testable, unresolved decisions are explicit, and an independent plan-review thread finds no blocking gap.

An implementation is accepted only when:

- Every required lane passed code tests, `.artifacts/test.md` interactive verification, and independent scored review on the same frozen checkpoint.
- The integrated revision passed cross-lane regression testing and final independent review.
- No unresolved P0/P1 issue remains and applicable score categories meet the target.
- Relevant loading, empty, error, auth, permission, network, responsive, recovery, and rollback states were checked.
- `.artifacts/human.html`, `.artifacts/test.md`, plan, lane evidence, and conclusion match reality.
- The final status uses honest language: prototype, locally verified, ready for integration, released, shipped, partial, or blocked.

Keep the chat response concise. Link the detailed HTML artifacts and report exact checkpoints, commands, interactive coverage, blockers, and release boundary.
