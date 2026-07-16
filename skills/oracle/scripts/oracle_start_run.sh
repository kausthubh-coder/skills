#!/usr/bin/env bash
set -euo pipefail

root="${1:-}"
run_id="${2:-}"
command_name="${3:-implement}"
request_text="${4:-none}"

if [ -z "$root" ] || [ -z "$run_id" ]; then
  echo "Usage: oracle_start_run.sh <project-root> <run-id> <plan|implement> [short-request]" >&2
  exit 1
fi

if [ ! -d "$root" ]; then
  echo "Oracle run error: root does not exist: $root" >&2
  exit 1
fi

if [[ ! "$run_id" =~ ^[0-9]{8}-[0-9]{4}-[a-z0-9][a-z0-9-]*$ ]]; then
  echo "Oracle run error: run ID must match YYYYMMDD-HHMM-short-slug" >&2
  exit 1
fi

if [ "$command_name" != "plan" ] && [ "$command_name" != "implement" ]; then
  echo "Oracle run error: command must be plan or implement" >&2
  exit 1
fi

root="$(cd "$root" && pwd -P)"
request_text="${request_text//$'\n'/ }"
request_text="${request_text//$'\t'/ }"
skill_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
legacy_manifest_helper="$skill_dir/scripts/oracle_legacy_manifest.sh"
artifacts_dir="$root/.artifacts"
runs_dir="$artifacts_dir/runs"
legacy_migration_status="$artifacts_dir/legacy-migration.status"
legacy_migration_report="$artifacts_dir/legacy-migration.md"
legacy_manifest_file="$artifacts_dir/legacy-manifest.tsv"
run_dir="$runs_dir/$run_id"
lock_dir="$runs_dir/.$run_id.init.lock"
tmp_run_dir=""
now="$(date +"%Y-%m-%d %H:%M:%S %Z")"

for managed_directory in "$artifacts_dir" "$runs_dir"; do
  if [ -L "$managed_directory" ] \
    || { [ -e "$managed_directory" ] && [ ! -d "$managed_directory" ]; }; then
    echo "Oracle run error: managed path must be a real directory: $managed_directory" >&2
    exit 1
  fi
done

for managed_file in \
  "$legacy_migration_status" \
  "$legacy_migration_report" \
  "$legacy_manifest_file"; do
  if [ -L "$managed_file" ] \
    || { [ -e "$managed_file" ] && [ ! -f "$managed_file" ]; }; then
    echo "Oracle run error: managed path must be a regular file: $managed_file" >&2
    exit 1
  fi
done

if [ ! -f "$legacy_manifest_helper" ] || [ -L "$legacy_manifest_helper" ]; then
  echo "Oracle run error: packaged legacy manifest helper is missing or unsafe: $legacy_manifest_helper" >&2
  exit 1
fi

legacy_current_manifest="$(bash "$legacy_manifest_helper" "$root")"
if [ -n "$legacy_current_manifest" ]; then
  if [ ! -f "$legacy_manifest_file" ] \
    || [ "$(cat "$legacy_manifest_file")" != "$legacy_current_manifest" ]; then
    echo "Oracle run error: current legacy Oracle content differs from the initialized manifest" >&2
    echo "Run Oracle init again, reconcile the changed content, and only then mark legacy-migration.status as 'reconciled'." >&2
    exit 1
  fi

  if [ ! -f "$legacy_migration_status" ] \
    || [ "$(sed -n '1p' "$legacy_migration_status")" != "reconciled" ]; then
    echo "Oracle run error: legacy Oracle content must be reconciled before planning or implementation" >&2
    echo "Review $artifacts_dir/legacy-migration.md and set legacy-migration.status to 'reconciled' only after merging required content." >&2
    exit 1
  fi
fi

mkdir -p "$runs_dir"

if [ -L "$runs_dir" ]; then
  echo "Oracle run error: runs directory became a symlink: $runs_dir" >&2
  exit 1
fi

if ! mkdir "$lock_dir" 2>/dev/null; then
  echo "Oracle run error: another initializer may own this run: $lock_dir" >&2
  echo "Verify no Oracle process is active before removing a stale lock." >&2
  exit 1
fi

cleanup() {
  if [ -n "$tmp_run_dir" ] && [ -d "$tmp_run_dir" ]; then
    rm -rf "$tmp_run_dir"
  fi
  rmdir "$lock_dir" 2>/dev/null || true
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

if [ -e "$run_dir" ] || [ -L "$run_dir" ]; then
  if [ -L "$run_dir" ] || [ ! -d "$run_dir" ]; then
    echo "Oracle run error: run path must be a real directory: $run_dir" >&2
    exit 1
  fi

  for managed_relative in \
    .initialized \
    ledger.md \
    decisions.md \
    resume-events.tsv \
    current-phase.txt \
    current-request.txt \
    initial-request.txt \
    plan-acceptance.status \
    threads.md \
    subagents.md \
    resource-locks.md \
    baseline \
    evidence \
    lanes \
    thread-briefs \
    subagent-briefs; do
    if [ -L "$run_dir/$managed_relative" ]; then
      echo "Oracle run error: managed run path must not be a symlink: $run_dir/$managed_relative" >&2
      exit 1
    fi
  done

  missing=0
  for required in \
    .initialized \
    ledger.md \
    decisions.md \
    resume-events.tsv \
    baseline/git-status-before.txt \
    baseline/git-diff-stat-before.txt \
    baseline/git-staged-diff-stat-before.txt \
    evidence/README.md; do
    if [ ! -f "$run_dir/$required" ]; then
      echo "Oracle run error: incomplete control plane, missing $required" >&2
      missing=1
    fi
  done

  if [ "$missing" -ne 0 ]; then
    echo "Inspect and repair or archive the partial run before resuming: $run_dir" >&2
    exit 1
  fi

  previous_phase="plan"
  if [ -f "$run_dir/current-phase.txt" ]; then
    previous_phase="$(sed -n '1p' "$run_dir/current-phase.txt")"
  elif grep -q $'\timplement\t' "$run_dir/resume-events.tsv" \
    || grep -q '^- Initial command: implement$' "$run_dir/ledger.md" \
    || grep -q '^- Command: implement$' "$run_dir/ledger.md"; then
    previous_phase="implement"
  fi

  if [ "$previous_phase" != "plan" ] && [ "$previous_phase" != "implement" ]; then
    echo "Oracle run error: invalid previous phase in control plane: $previous_phase" >&2
    exit 1
  fi

  if [ "$previous_phase" = "implement" ] && [ "$command_name" = "plan" ]; then
    echo "Oracle run error: an implementation run cannot transition back to plan: $run_id" >&2
    exit 1
  fi

  if [ "$previous_phase" = "plan" ] && [ "$command_name" = "implement" ]; then
    if [ ! -f "$run_dir/plan-acceptance.status" ] \
      || [ "$(sed -n '1p' "$run_dir/plan-acceptance.status")" != "accepted" ]; then
      echo "Oracle run error: plan must be independently reviewed and marked accepted before implementation" >&2
      echo "Expected: $run_dir/plan-acceptance.status containing 'accepted'" >&2
      exit 1
    fi
  fi

  mkdir -p \
    "$run_dir/thread-briefs" \
    "$run_dir/subagent-briefs" \
    "$run_dir/lanes" \
    "$run_dir/evidence"

  if [ ! -f "$run_dir/threads.md" ]; then
    cat > "$run_dir/threads.md" <<EOF
# Oracle Real Threads

- Run ID: $run_id
- The orchestrator owns intent, lane graph, resource locks, evidence synthesis, and final artifacts.
- Role phases inside one lane are sequential. Independent lanes may run concurrently.

| Thread ID | Lane | Round | Role | Branch/worktree | Checkpoint | Status | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| pending | pending | pending | pending | pending | pending | queued | pending |
EOF
  fi

  if [ ! -f "$run_dir/subagents.md" ]; then
    cat > "$run_dir/subagents.md" <<EOF
# Oracle Private Subagents

Private subagents may assist inside real role threads. They do not replace fresh implementation, testing, and review threads.

| Parent thread | Role | Mode | Scope | Status | Evidence |
| --- | --- | --- | --- | --- | --- |
| pending | pending | read-only | pending | queued | pending |
EOF
  fi

  if [ ! -f "$run_dir/resource-locks.md" ]; then
    cat > "$run_dir/resource-locks.md" <<EOF
# Oracle Resource Locks

| Resource | Owner thread/lane | Mode | Start state | Cleanup | Status |
| --- | --- | --- | --- | --- | --- |
| pending | none | exclusive | pending | pending | available |
EOF
  fi

  if [ ! -f "$run_dir/thread-briefs/README.md" ]; then
    cat > "$run_dir/thread-briefs/README.md" <<EOF
# Real Thread Briefs

Store one narrow context packet per real implementation, testing, review, integration, or regression thread. Include lane, round, role, checkpoint, exact checkout, allowed paths, resources, authority, acceptance criteria, source documents, and return schema.
EOF
  fi

  if [ ! -f "$run_dir/subagent-briefs/README.md" ]; then
    cat > "$run_dir/subagent-briefs/README.md" <<EOF
# Private Subagent Briefs

Store concise briefs for private helpers inside a real thread. Do not use private subagents as a substitute for independent role threads.
EOF
  fi

  if [ ! -f "$run_dir/initial-request.txt" ]; then
    recovered_request="$(awk -F '\t' '$2 == "created" { print $4; exit }' "$run_dir/resume-events.tsv")"
    if [ -z "$recovered_request" ]; then
      echo "Oracle run error: cannot recover initial request from resume history" >&2
      exit 1
    fi
    printf '%s\n' "$recovered_request" > "$run_dir/initial-request.txt"
  fi

  if [ ! -f "$run_dir/plan-acceptance.status" ]; then
    printf '%s\n' "pending" > "$run_dir/plan-acceptance.status"
  fi

  printf '%s\n' "$command_name" > "$run_dir/current-phase.txt"
  printf '%s\n' "$request_text" > "$run_dir/current-request.txt"
  printf '%s\tresume\t%s\t%s\n' "$now" "$command_name" "$request_text" >> "$run_dir/resume-events.tsv"

  echo "Oracle run already exists; control plane reconciled for resume:"
  echo "  $run_dir"
  echo "  phase: $previous_phase -> $command_name"
  echo "  request: $request_text"
  exit 0
fi

branch="not-a-git-repository"
sha="not-a-git-repository"
status_before="not-a-git-repository"
diff_stat_before="not-a-git-repository"
staged_diff_stat_before="not-a-git-repository"

if git -C "$root" rev-parse --show-toplevel >/dev/null 2>&1; then
  repo_root="$(cd "$(git -C "$root" rev-parse --show-toplevel)" && pwd -P)"
  if [ "$repo_root" != "$root" ]; then
    echo "Oracle run error: use the Git root: $repo_root" >&2
    exit 1
  fi

  branch="$(git -C "$root" branch --show-current)"
  [ -n "$branch" ] || branch="detached-or-unborn"
  if ! sha="$(git -C "$root" rev-parse HEAD 2>/dev/null)"; then
    sha="unborn-no-commit"
  fi
  status_before="$(git -C "$root" status --short --untracked-files=all)"
  diff_stat_before="$(git -C "$root" diff --stat)"
  staged_diff_stat_before="$(git -C "$root" diff --cached --stat)"
  [ -n "$status_before" ] || status_before="clean"
  [ -n "$diff_stat_before" ] || diff_stat_before="none"
  [ -n "$staged_diff_stat_before" ] || staged_diff_stat_before="none"
fi

tmp_run_dir="$runs_dir/.$run_id.tmp.$$"
if [ -e "$tmp_run_dir" ] || [ -L "$tmp_run_dir" ]; then
  echo "Oracle run error: temporary run path already exists: $tmp_run_dir" >&2
  exit 1
fi
mkdir -p \
  "$tmp_run_dir/baseline" \
  "$tmp_run_dir/thread-briefs" \
  "$tmp_run_dir/subagent-briefs" \
  "$tmp_run_dir/lanes" \
  "$tmp_run_dir/evidence"

printf '%s\n' "$status_before" > "$tmp_run_dir/baseline/git-status-before.txt"
printf '%s\n' "$diff_stat_before" > "$tmp_run_dir/baseline/git-diff-stat-before.txt"
printf '%s\n' "$staged_diff_stat_before" > "$tmp_run_dir/baseline/git-staged-diff-stat-before.txt"
printf '%s\n' "$command_name" > "$tmp_run_dir/current-phase.txt"
printf '%s\n' "$request_text" > "$tmp_run_dir/current-request.txt"
printf '%s\n' "$request_text" > "$tmp_run_dir/initial-request.txt"
printf '%s\n' "pending" > "$tmp_run_dir/plan-acceptance.status"
printf '%s\tcreated\t%s\t%s\n' "$now" "$command_name" "$request_text" > "$tmp_run_dir/resume-events.tsv"

cat > "$tmp_run_dir/threads.md" <<EOF
# Oracle Real Threads

- Run ID: $run_id
- The orchestrator owns intent, lane graph, resource locks, evidence synthesis, and final artifacts.
- Role phases inside one lane are sequential. Independent lanes may run concurrently.

| Thread ID | Lane | Round | Role | Branch/worktree | Checkpoint | Status | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| pending | pending | pending | pending | pending | pending | queued | pending |
EOF

cat > "$tmp_run_dir/subagents.md" <<EOF
# Oracle Private Subagents

Private subagents may assist inside real role threads. They do not replace fresh implementation, testing, and review threads.

| Parent thread | Role | Mode | Scope | Status | Evidence |
| --- | --- | --- | --- | --- | --- |
| pending | pending | read-only | pending | queued | pending |
EOF

cat > "$tmp_run_dir/resource-locks.md" <<EOF
# Oracle Resource Locks

| Resource | Owner thread/lane | Mode | Start state | Cleanup | Status |
| --- | --- | --- | --- | --- | --- |
| pending | none | exclusive | pending | pending | available |
EOF

cat > "$tmp_run_dir/decisions.md" <<EOF
# Oracle Decisions

- Run ID: $run_id
- Created: $now

Record decisions with evidence, alternatives, owner, and date. Do not store secrets, raw transcripts, or private data.
EOF

cat > "$tmp_run_dir/thread-briefs/README.md" <<EOF
# Real Thread Briefs

Store one narrow context packet per real implementation, testing, review, integration, regression-testing, or final-review thread. Include lane, round, role, checkpoint, exact checkout, allowed paths, resources, authority, acceptance criteria, source documents, and return schema.
EOF

cat > "$tmp_run_dir/subagent-briefs/README.md" <<EOF
# Private Subagent Briefs

Store concise briefs for private helpers inside a real thread. Do not use private subagents as a substitute for independent role threads.
EOF

cat > "$tmp_run_dir/evidence/README.md" <<EOF
# Evidence

Store selected safe evidence by lane, round, and role. Prefer command summaries, exact failure excerpts, screenshots, browser/device coverage, scorecards, and links. Do not store secrets, auth state, env values, raw private data, full transcripts, or bulky caches.
EOF

if [ "$command_name" = "plan" ]; then
  root_mode="source-read-only / artifact-write"
  root_next="create research threads and synthesize a decision-grade plan"
else
  root_mode="artifact-write / orchestration-only"
  root_next="define feature lanes, checkpoints, real role threads, and resource locks"
fi

cat > "$tmp_run_dir/ledger.md" <<EOF
# Oracle Run Ledger

- Run ID: $run_id
- Created: $now
- Project root: $root
- Initial command: $command_name
- Current phase: current-phase.txt
- Initial request: initial-request.txt
- Current request: current-request.txt
- Plan acceptance: plan-acceptance.status
- Baseline branch: $branch
- Baseline SHA: $sha
- Current state: discovered
- Overall verdict: pending
- Resume history: resume-events.tsv

## Intent And Authority

- Literal request: pending
- Intended outcome: pending
- Source of truth: pending
- Scope/non-goals: pending
- Must preserve: pending
- Baseline policy (clean ref / authorized dirty checkpoint / immutable patch): pending
- Local checkpoint commit authority: pending
- Push/merge/deploy/external authority: pending
- Acceptance criteria: pending
- Release boundary: pending

## Artifact Map

- Human guide: ../../human.html
- Testing guide: ../../test.md
- Plan: pending
- Design: pending or not applicable
- Design workbench: ../../designs/workbench/ or not applicable
- Sandbox/worktrees: ../../sandbox/worktrees/ or not applicable
- Real threads: threads.md
- Private subagents: subagents.md
- Resource locks: resource-locks.md
- Lane rounds: lanes/
- Evidence: evidence/
- Demo: pending or not applicable
- Conclusion: pending or not applicable for plan

## Lifecycle

- [x] Discovered
- [ ] Researched
- [ ] Plan independently reviewed
- [ ] Planned/decision-grade
- [ ] Lanes defined or not applicable
- [ ] Lane implementation/test/review loops accepted or not applicable
- [ ] Integrated or not applicable
- [ ] Cross-lane regression tested or not applicable
- [ ] Final independent review complete or not applicable
- [ ] Documentation reconciled
- [ ] Accepted or blocked
- [ ] Demonstrated or not applicable
- [ ] Concluded or plan delivered

## Workstreams

| Workstream | Owner | Mode | Scope | Dependencies | Status | Evidence/next action |
| --- | --- | --- | --- | --- | --- | --- |
| orchestrator | root thread | $root_mode | intent, lane graph, threads, resources, evidence, verdict, artifacts | none | active | $root_next |
| real threads | pending | role-specific | research or lane implement/test/review/integration | orchestrator briefs | queued | define only independent roles |
| private subagents | parent role threads | mostly read-only | narrow exploration, logs, critique, bounded help | parent brief | queued | optional internal fan-out |

## Lane Registry

| Lane | Outcome | Paths | Branch/worktree | Resources | Dependencies | Current round | State |
| --- | --- | --- | --- | --- | --- | --- | --- |
| pending | pending | pending | pending | pending | pending | 0 | queued |

## Loop Rounds

| Lane | Round | Implementation checkpoint | Test verdict | Review scores | Failed gates | Next action |
| --- | --- | --- | --- | --- | --- | --- |
| pending | 1 | pending | pending | pending | pending | define lane |

## Gates

| Gate | Required | Evidence | Verdict | Follow-up |
| --- | --- | --- | --- | --- |
| Decision-grade plan plus independent plan review | yes | pending | pending | pending |
| Isolated implementation checkpoint per lane | for implement | pending | pending | pending |
| Fresh .artifacts/test.md testing thread per lane | for implement | pending | pending | pending |
| Fresh independent review/scoring thread per lane | for implement | pending | pending | pending |
| Integrated checkpoint | for multi-lane implement | pending | pending | pending |
| Cross-lane regression testing thread | for multi-lane implement | pending | pending | pending |
| Final independent review thread | for implement | pending | pending | pending |
| UI/design audit | when UI changes | pending | pending | pending |
| .artifacts/human.html and .artifacts/test.md reconciliation | for implement | pending | pending | pending |
| Demo capture | when visible behavior changes | pending | pending | pending |

## Baseline

- Git status: baseline/git-status-before.txt
- Unstaged diff stat: baseline/git-diff-stat-before.txt
- Staged diff stat: baseline/git-staged-diff-stat-before.txt

## Context Snapshot

- Current decision: pending
- Accepted lane checkpoints: none
- Current failed gates: none
- Active real threads: none
- Active private subagents: none
- Resource locks: see resource-locks.md
- Next orchestrator action: $root_next

## Blockers And Accepted Risks

- None recorded.
EOF

touch "$tmp_run_dir/.initialized"

if [ -e "$run_dir" ] || [ -L "$run_dir" ]; then
  echo "Oracle run error: run appeared during initialization: $run_dir" >&2
  exit 1
fi

mv "$tmp_run_dir" "$run_dir"
tmp_run_dir=""

echo "Oracle run initialized atomically:"
echo "  $run_dir"
echo "  command: $command_name"
echo "  branch: $branch"
echo "  baseline: $sha"
