# Oracle Thread Orchestration And Context

Use this reference for real Codex threads, parallel feature lanes, worktree/checkpoint safety, private subagents, independent critique, mutable resources, and root-context management.

## Roles

### Orchestrator Thread

The thread in which the user invokes a substantial `oracle plan` or `oracle implement` becomes the orchestrator. It owns:

- User intent, source of truth, authority, plan, lane graph, and stopping decisions.
- Thread creation, context packets, status tracking, resource locks, and conflict prevention.
- Run ledger, decisions, synthesized evidence, artifact accuracy, and final response.

For an orchestrated implementation, it does not write feature source, operate the application as the tester, or perform the only review. It delegates those roles to fresh threads so its context stays focused on coordination and judgment.

### Real Codex Threads

Real threads are user-visible, durable workflow stages. Use current Codex task tools such as:

1. `list_projects` to resolve the saved project.
2. `create_thread` to start a role thread in a local or worktree environment.
3. `read_thread` to collect status and concise results.
4. `send_message_to_thread` for a scoped follow-up.
5. `fork_thread` only when inherited history is intentionally useful; do not use a writer-history fork as the independent reviewer.
6. Thread archive/pin/title tools to keep a large run navigable.

Always verify the worker's actual project root, branch, worktree, baseline SHA, and mutable-resource assignment. Never infer them from the thread title.

Explicit `$oracle plan` and `$oracle implement` invocations authorize the real role threads defined by those commands. If Oracle is only inferred from an ordinary request, confirm user-visible thread creation once. If the host has no real-thread capability, mark the run blocked rather than substituting same-thread role play.

### Private Subagents

Private subagents are fast helpers inside a real thread. They are useful for repo exploration, current docs, logs, alternatives, test analysis, security, or UI critique. They do not replace fresh implementation/test/review threads.

The orchestrator creates all real threads unless it explicitly assigns a lane coordinator. Worker threads may fan out to private subagents but should not recursively create user-owned threads by default.

## Decompose Into Feature Lanes

A lane is one independently testable behavior with explicit source and resource ownership. Examples:

```text
run: codespark
  lane web-editor       -> editor UI and browser flow
  lane web-billing      -> pricing/checkout UI and billing API
  lane cli-generate     -> CLI command and filesystem behavior
  lane shared-schema    -> prerequisite schema/client contract
```

Parallelize `web-editor`, `web-billing`, and `cli-generate` only if their files, schemas, ports, accounts, deployments, and fixtures are independent. If both web lanes depend on `shared-schema`, complete and accept that prerequisite first, then fan out.

Each lane brief records:

- Lane ID, user outcome, scope, non-goals, and acceptance criteria.
- Allowed and forbidden paths; shared/generated paths and integration owner.
- Baseline ref, branch, worktree, and checkpoint convention.
- Required `human.md`, `test.md`, plan/design artifacts, and prior decisions.
- Mutable-resource locks and cleanup obligations.
- Expected implementation, test, and review evidence.
- Dependencies, dependents, integration contract, and release boundary.

## Parallel Lane Loop

Each lane runs this sequence. Different lanes may run the sequence concurrently; phases inside one lane are sequential.

### 1. Implementation Thread

- Start in the lane's isolated worktree/branch.
- Read the lane packet, relevant source, project instructions, `human.md`, and `test.md`.
- Own only the assigned source behavior. Do not edit shared files owned by another lane.
- Use private subagents or an explicitly requested specialist such as Claude for bounded help, but allow only one active editor for the same code.
- Run focused developer checks while writing.
- Stop all writers, capture the diff, and freeze checkpoint `N`.
- Return changed files, checkpoint identity, commands/results, known gaps, and test setup notes.

### 2. Testing Thread

- Start fresh from the exact frozen checkpoint `N`, never from a moving branch.
- Read `test.md` immediately before testing.
- Run required code tests and the actual user flow with Browser Use, Computer Use, ADB/emulator, or project-native commands.
- Exercise every affected control and relevant happy, loading, empty, invalid, auth, permission, network, error, retry, responsive, persistence, and recovery state.
- Do not repair production source. Record reproducible failures, screenshots/logs, environment, auth/data setup, and untested scope.
- Propose `test.md` corrections without editing shared documentation unless this thread owns it.

### 3. Review And Scoring Thread

- Start fresh and read-only from checkpoint `N`.
- Receive intent, plan, lane contract, exact diff, changed files, code-test results, interactive evidence, screenshots/logs, and known gaps.
- Review correctness, regressions, security/privacy/auth/secrets, project fit, test credibility, UI/UX/accessibility, performance/reliability, docs truth, and release readiness.
- Lead with P0-P3 findings and exact evidence.
- Return 0-5 scores for applicable categories, readiness `yes|no|blocked`, untested scope, and the smallest next fix.
- It must not be the implementation thread, a fork containing the writer's rationale, or the only agent that authored the code.

### 4. Orchestrator Decision

- Reproduce or reconcile severe findings where practical.
- Accept the checkpoint only when lane gates pass.
- If not accepted, write a round summary and create a fresh implementation thread with the complete current lane packet, accepted decisions, latest checkpoint, failed evidence, and authorized fix scope. Omit prior writer rationale and raw conversation.
- After the fix checkpoint, create fresh testing and review threads. Do not rerun unchanged prompts against unchanged code.

## Checkpoint Strategy

Fresh worktree threads need a stable ref. Before implementation, determine whether local checkpoint commits are authorized.

Preferred branch shape:

```text
oracle/<run-id>/<lane-id>
```

Preferred local checkpoint message:

```text
oracle(<lane-id>): round <N> checkpoint
```

A local checkpoint is a testing mechanism, not permission to push or merge. Record the SHA in the lane ledger. Test and review threads must report the SHA they actually inspected.

If commits are not authorized:

- Freeze an immutable patch/bundle and tree identity.
- Use fresh threads only when they can target the exact checkout without another writer.
- Otherwise pause and request authority for local checkpoints; do not pretend separate worktrees tested the same uncommitted state.

## Worktree Placement

Use a distinct worktree for every concurrent writing lane.

- When `create_thread` supplies a Codex-managed worktree, record its real path and branch in `.artifacts/runs/<run-id>/threads.md`.
- When the runtime can launch a thread against an exact local checkout, project-local worktrees may live under `.sandbox/worktrees/<run-id>-<lane-id>/`.
- The location is less important than verified isolation and a shared checkpoint identity. Never copy source directories by hand as a substitute for Git lineage.
- Test and review threads may each use fresh read-only worktrees from the lane checkpoint. They must not share a mutable checkout with an active writer.

## Baseline Policy

Before creating lanes, choose and record exactly one baseline:

- Clean `HEAD` or a named clean branch.
- An explicitly authorized local checkpoint containing scoped dirty changes that are part of the source of truth.
- An immutable patch/bundle plus base SHA when commits are not authorized and the runtime can reproduce it exactly.

Do not let worktree creation silently omit relevant dirty changes. Every dependent lane must report the same baseline identity before writing.

## Integration Loop

Accepted lanes are not the final product. After all prerequisite lanes pass:

1. Start an integration thread from the intended base.
2. Integrate accepted lane checkpoints in dependency order.
3. Resolve conflicts against the plan; do not silently choose behavior.
4. Run code-level integration checks and update shared generated files.
5. Use a docs owner in this phase to update root `human.md` and `test.md` from accepted lane findings.
6. Freeze the integrated checkpoint.
7. Start a fresh regression-testing thread for cross-lane flows.
8. Start a fresh final-review thread with the integrated diff and regression evidence.
9. If integration gates fail, create a fresh integration-fix thread and repeat regression plus final review.

## Resource Locks And Capacity

Parallel worktrees do not isolate external state. Maintain a resource table in the run ledger:

| Resource | Owner thread/lane | Mode | Start state | Cleanup | Status |
| --- | --- | --- | --- | --- | --- |
| port 3000 | web-editor test | exclusive | stopped | stop server | available |
| Clerk test user | web-billing test | exclusive | signed out | sign out | reserved |
| Convex dev deployment | shared-schema | exclusive writer | known seed | reset seed | reserved |
| Android emulator | mobile test | exclusive | clean snapshot | restore | available |

Serialize operations that share a deployment, test user, browser profile, database, emulator, port, fixture set, or provider sandbox. Read-only review of saved evidence may remain parallel.

Use lock states `available -> reserved -> active -> cleanup -> available`. On thread failure or interruption, verify the owner has stopped and cleanup completed before reclaiming the resource. Record stale owners and blockers instead of force-reassigning blindly.

There is no arbitrary small thread cap, but host/tool concurrency and user-specified cost/token budgets are real constraints. Queue unblocked lanes beyond current capacity and start them as capacity and resource locks become available. A thread-creation failure is a recorded blocker/retry event, not permission to collapse roles.

## Thread Context Packet

Every real thread gets a narrow packet:

```text
run_id:
lane_id:
round:
role: research | plan-review | implement | test | review | integrate | regression-test | final-review
goal and intended user outcome:
source of truth:
baseline/checkpoint SHA:
project root and worktree:
allowed paths:
forbidden/shared paths:
must preserve:
acceptance criteria:
human.md/test.md/plan/design links:
mutable resources and prohibited resources:
authority for commits/push/deploy/external changes:
required evidence and return schema:
```

Do not paste the full root conversation. Include decisions and evidence needed for that role only.

For `research`, replace lane/checkpoint fields with the exact research question, source-read-only boundary, allowed primary sources, known assumptions, citation requirements, and concise facts/options/risks return schema. For `plan-review`, include the draft-plan path, user outcome, facts/assumptions, lane graph, acceptance criteria, testing strategy, unresolved decisions, review rubric, and findings-first verdict.

All role threads return structured results to the orchestrator. Only the orchestrator writes canonical `implementation.md`, `testing.md`, `review.md`, `scorecard.json`, registries, and HTML artifacts in the root run directory. Test/review worktrees remain source/evidence read-only unless a narrowly authorized local capture path is outside tracked source.

## Context And Registry

The orchestrator keeps durable state under `.artifacts/runs/<run-id>/`:

```text
ledger.md
threads.md
decisions.md
resource-locks.md
thread-briefs/
lanes/<lane-id>/
  lane.md
  rounds/<N>/
    implementation.md
    testing.md
    review.md
    scorecard.json
evidence/
```

Store summaries and selected evidence, not raw transcripts. On compaction or resume, reconstruct from the ledger, lane checkpoints, test evidence, and decisions rather than model memory.

Use `scripts/oracle_lane_state.sh` to initialize a lane and enforce checkpoint, testing, review, and acceptance order. The helper is a state guard, not a substitute for the canonical implementation/testing/review evidence written by the orchestrator.

## Concurrency Policy

There is no fixed arbitrary maximum number of real threads or loop rounds. Use the number justified by independent lanes and role phases, while respecting actual host capacity, resource locks, and user budgets. `agents.max_threads` limits private subagents only; it is not a cap on real Codex threads.

Avoid:

- **Under-parallelization:** one thread serially implements unrelated CLI and web features.
- **Role collapse:** the writer tests casually and then approves its own work.
- **Phase overlap:** tester/reviewer examines code while the writer is still editing it.
- **Duplicate writers:** multiple worktrees modify the same schema or shared component without ordering.
- **Decorative threads:** several threads repeat the same scan and add synthesis cost.
- **Context leakage:** reviewers receive the writer's rationale instead of the neutral intent, diff, and evidence.

## Optional Specialists

If the user explicitly invokes a specialist skill such as Claude for UI/UX or Convex work, use it inside the assigned implementation thread. Claude may inspect, implement, and close its own developer loop, but:

- No Codex writer edits the same lane concurrently.
- The lane still freezes a checkpoint.
- A separate Oracle testing thread independently follows `test.md`.
- A separate Oracle review thread independently scores the code and evidence.
- The orchestrator decides acceptance and integration.
