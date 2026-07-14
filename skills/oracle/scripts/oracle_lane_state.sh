#!/usr/bin/env bash
set -euo pipefail

root="${1:-}"
run_id="${2:-}"
lane_id="${3:-}"
action="${4:-}"
round="${5:-}"
checkpoint="${6:-}"
verdict="${7:-}"
score="${8:-}"
blocking_findings="${9:-none}"

if [ -z "$root" ] || [ -z "$run_id" ] || [ -z "$lane_id" ] || [ -z "$action" ]; then
  echo "Usage: oracle_lane_state.sh <root> <run-id> <lane-id> <init|checkpoint|test|review|accept> [round] [checkpoint] [verdict] [category=score,...] [none|p0|p1|p0,p1]" >&2
  exit 1
fi

if [[ ! "$run_id" =~ ^[0-9]{8}-[0-9]{4}-[a-z0-9][a-z0-9-]*$ ]]; then
  echo "Oracle lane error: invalid run ID" >&2
  exit 1
fi
if [[ ! "$lane_id" =~ ^[a-z0-9][a-z0-9-]*$ ]]; then
  echo "Oracle lane error: invalid lane ID" >&2
  exit 1
fi

root="$(cd "$root" && pwd -P)"
run_dir="$root/.artifacts/runs/$run_id"
lanes_dir="$run_dir/lanes"
lane_dir="$lanes_dir/$lane_id"
rounds_dir="$lane_dir/rounds"
state_file="$lane_dir/state.txt"
last_round_file="$lane_dir/last-round.txt"
lock_dir="$lanes_dir/.$lane_id.state.lock"

for managed_path in \
  "$root/.artifacts" \
  "$root/.artifacts/runs" \
  "$run_dir" \
  "$lanes_dir" \
  "$lane_dir" \
  "$rounds_dir" \
  "$state_file" \
  "$last_round_file" \
  "$run_dir/current-phase.txt" \
  "$run_dir/plan-acceptance.status"; do
  if [ -L "$managed_path" ]; then
    echo "Oracle lane error: managed path must not be a symlink: $managed_path" >&2
    exit 1
  fi
done

if [ ! -f "$run_dir/.initialized" ] || [ ! -d "$lanes_dir" ]; then
  echo "Oracle lane error: initialize the Oracle run first: $run_dir" >&2
  exit 1
fi

if ! mkdir "$lock_dir" 2>/dev/null; then
  echo "Oracle lane error: another orchestrator operation owns lane state: $lane_id" >&2
  exit 1
fi

cleanup_lane_lock() {
  rmdir "$lock_dir" 2>/dev/null || true
}
trap cleanup_lane_lock EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

write_atomic() {
  destination="$1"
  value="$2"
  if [ -L "$destination" ]; then
    echo "Oracle lane error: state destination must not be a symlink: $destination" >&2
    exit 1
  fi
  temporary="$destination.tmp.$$"
  if [ -e "$temporary" ] || [ -L "$temporary" ]; then
    echo "Oracle lane error: temporary state path exists: $temporary" >&2
    exit 1
  fi
  printf '%s\n' "$value" > "$temporary"
  mv "$temporary" "$destination"
}

read_state() {
  if [ ! -f "$state_file" ]; then
    echo "Oracle lane error: lane is not initialized: $lane_id" >&2
    exit 1
  fi
  sed -n '1p' "$state_file"
}

validate_round_checkpoint() {
  if [[ ! "$round" =~ ^[1-9][0-9]*$ ]]; then
    echo "Oracle lane error: round must be a positive integer" >&2
    exit 1
  fi
  if [[ ! "$checkpoint" =~ ^[0-9a-fA-F]{7,64}$ ]]; then
    echo "Oracle lane error: checkpoint must be a 7-64 character hex identity" >&2
    exit 1
  fi
}

require_implementation_gate() {
  if [ -L "$run_dir/current-phase.txt" ] || [ ! -f "$run_dir/current-phase.txt" ] \
    || [ "$(sed -n '1p' "$run_dir/current-phase.txt")" != "implement" ]; then
    echo "Oracle lane error: lane transitions require current phase implement" >&2
    exit 1
  fi
  if [ -L "$run_dir/plan-acceptance.status" ] || [ ! -f "$run_dir/plan-acceptance.status" ] \
    || [ "$(sed -n '1p' "$run_dir/plan-acceptance.status")" != "accepted" ]; then
    echo "Oracle lane error: lane transitions require accepted plan evidence" >&2
    exit 1
  fi
}

validate_existing_round_paths() {
  round_dir="$rounds_dir/$round"
  for managed_round_path in \
    "$rounds_dir" \
    "$round_dir" \
    "$round_dir/checkpoint.txt" \
    "$round_dir/implementation.status" \
    "$round_dir/testing.status" \
    "$round_dir/review.status" \
    "$round_dir/scorecard.tsv" \
    "$round_dir/blocking-findings.status"; do
    if [ -L "$managed_round_path" ]; then
      echo "Oracle lane error: managed round path must not be a symlink: $managed_round_path" >&2
      exit 1
    fi
  done
  if [ ! -d "$rounds_dir" ] || [ "$(cd "$rounds_dir" && pwd -P)" != "$rounds_dir" ]; then
    echo "Oracle lane error: rounds directory escaped the lane" >&2
    exit 1
  fi
  if [ -d "$round_dir" ] && [ "$(cd "$round_dir" && pwd -P)" != "$round_dir" ]; then
    echo "Oracle lane error: round directory escaped the lane" >&2
    exit 1
  fi
}

require_current_round() {
  if [ -L "$last_round_file" ] || [ ! -f "$last_round_file" ] \
    || [[ ! "$(sed -n '1p' "$last_round_file")" =~ ^[1-9][0-9]*$ ]]; then
    echo "Oracle lane error: missing or invalid current round state" >&2
    exit 1
  fi
  current_round="$(sed -n '1p' "$last_round_file")"
  if [ "$round" -ne "$current_round" ]; then
    echo "Oracle lane error: action must target current round $current_round, received $round" >&2
    exit 1
  fi
}

case "$action" in
  init)
    if [ -e "$lane_dir" ]; then
      if [ -f "$state_file" ]; then
        echo "Oracle lane already initialized: $lane_id [$(sed -n '1p' "$state_file")]"
        exit 0
      fi
      echo "Oracle lane error: lane directory exists without state: $lane_dir" >&2
      exit 1
    fi
    mkdir -p "$rounds_dir"
    cat > "$lane_dir/lane.md" <<EOF
# Oracle Lane

- Run ID: $run_id
- Lane ID: $lane_id
- Outcome: pending
- Scope/non-goals: pending
- Allowed/forbidden paths: pending
- Baseline/branch/worktree: pending
- Mutable resources: pending
- Dependencies/integration contract: pending
- Acceptance criteria: pending
EOF
    write_atomic "$state_file" "queued"
    write_atomic "$last_round_file" "0"
    echo "Oracle lane initialized: $lane_id [queued]"
    ;;

  checkpoint)
    validate_round_checkpoint
    require_implementation_gate
    current_state="$(read_state)"
    if [ "$current_state" != "queued" ] && [ "$current_state" != "fix-required" ]; then
      echo "Oracle lane error: checkpoint requires queued or fix-required state, found $current_state" >&2
      exit 1
    fi
    validate_existing_round_paths
    if [ ! -f "$last_round_file" ] || [[ ! "$(sed -n '1p' "$last_round_file")" =~ ^[0-9]+$ ]]; then
      echo "Oracle lane error: missing or invalid last-round state" >&2
      exit 1
    fi
    expected_round="$(( $(sed -n '1p' "$last_round_file") + 1 ))"
    if [ "$round" -ne "$expected_round" ]; then
      echo "Oracle lane error: expected contiguous round $expected_round, received $round" >&2
      exit 1
    fi
    if [ -L "$round_dir" ] || [ -e "$round_dir" ]; then
      echo "Oracle lane error: round already exists: $round" >&2
      exit 1
    fi
    mkdir "$round_dir"
    if [ "$(cd "$round_dir" && pwd -P)" != "$round_dir" ]; then
      echo "Oracle lane error: created round directory escaped the lane" >&2
      exit 1
    fi
    write_atomic "$round_dir/checkpoint.txt" "$checkpoint"
    write_atomic "$round_dir/implementation.status" "complete"
    write_atomic "$last_round_file" "$round"
    write_atomic "$state_file" "testing"
    echo "Oracle lane checkpoint frozen: $lane_id round $round [$checkpoint]"
    ;;

  test)
    validate_round_checkpoint
    require_implementation_gate
    require_current_round
    current_state="$(read_state)"
    if [ "$current_state" != "testing" ]; then
      echo "Oracle lane error: test requires testing state, found $current_state" >&2
      exit 1
    fi
    case "$verdict" in pass|fail|blocked) ;; *) echo "Oracle lane error: test verdict must be pass, fail, or blocked" >&2; exit 1 ;; esac
    validate_existing_round_paths
    if [ ! -f "$round_dir/checkpoint.txt" ] || [ "$(sed -n '1p' "$round_dir/checkpoint.txt")" != "$checkpoint" ]; then
      echo "Oracle lane error: test checkpoint does not match frozen round" >&2
      exit 1
    fi
    write_atomic "$round_dir/testing.status" "$verdict"
    write_atomic "$state_file" "reviewing"
    echo "Oracle lane test recorded: $lane_id round $round [$verdict]"
    ;;

  review)
    validate_round_checkpoint
    require_implementation_gate
    require_current_round
    current_state="$(read_state)"
    if [ "$current_state" != "reviewing" ]; then
      echo "Oracle lane error: review requires reviewing state, found $current_state" >&2
      exit 1
    fi
    case "$verdict" in pass|fail|blocked) ;; *) echo "Oracle lane error: review verdict must be pass, fail, or blocked" >&2; exit 1 ;; esac
    if [ -z "$score" ]; then
      echo "Oracle lane error: review requires category=score pairs" >&2
      exit 1
    fi
    case "$blocking_findings" in none|p0|p1|p0,p1|p1,p0) ;; *) echo "Oracle lane error: blocking findings must be none, p0, p1, or p0,p1" >&2; exit 1 ;; esac
    validate_existing_round_paths
    if [ ! -f "$round_dir/checkpoint.txt" ] || [ "$(sed -n '1p' "$round_dir/checkpoint.txt")" != "$checkpoint" ]; then
      echo "Oracle lane error: review checkpoint does not match frozen round" >&2
      exit 1
    fi
    if [ ! -f "$round_dir/testing.status" ]; then
      echo "Oracle lane error: review requires recorded testing evidence" >&2
      exit 1
    fi
    scorecard_tmp="$round_dir/scorecard.tsv.tmp.$$"
    if [ -e "$scorecard_tmp" ] || [ -L "$scorecard_tmp" ]; then
      echo "Oracle lane error: temporary scorecard path exists" >&2
      exit 1
    fi
    minimum_score=5
    category_count=0
    IFS=',' read -r -a category_scores <<< "$score"
    for category_score in "${category_scores[@]}"; do
      category="${category_score%%=*}"
      category_value="${category_score#*=}"
      if [ "$category" = "$category_score" ] || [[ ! "$category" =~ ^[a-z][a-z0-9-]*$ ]] \
        || [[ ! "$category_value" =~ ^[0-5]$ ]]; then
        rm -f "$scorecard_tmp"
        echo "Oracle lane error: scorecard entries must be category=0..5" >&2
        exit 1
      fi
      printf '%s\t%s\n' "$category" "$category_value" >> "$scorecard_tmp"
      if [ "$category_value" -lt "$minimum_score" ]; then
        minimum_score="$category_value"
      fi
      category_count="$((category_count + 1))"
    done
    if [ "$category_count" -eq 0 ]; then
      rm -f "$scorecard_tmp"
      echo "Oracle lane error: scorecard must contain at least one category" >&2
      exit 1
    fi
    mv "$scorecard_tmp" "$round_dir/scorecard.tsv"
    write_atomic "$round_dir/review.status" "$verdict"
    write_atomic "$round_dir/blocking-findings.status" "$blocking_findings"
    test_verdict="$(sed -n '1p' "$round_dir/testing.status")"
    if [ "$test_verdict" = "pass" ] && [ "$verdict" = "pass" ] \
      && [ "$minimum_score" -ge 4 ] && [ "$blocking_findings" = "none" ]; then
      write_atomic "$state_file" "accepted-ready"
    else
      write_atomic "$state_file" "fix-required"
    fi
    echo "Oracle lane review recorded: $lane_id round $round [$verdict, minimum $minimum_score/5, blockers $blocking_findings]"
    ;;

  accept)
    validate_round_checkpoint
    require_implementation_gate
    require_current_round
    current_state="$(read_state)"
    if [ "$current_state" != "accepted-ready" ]; then
      echo "Oracle lane error: accept requires accepted-ready state, found $current_state" >&2
      exit 1
    fi
    validate_existing_round_paths
    if [ ! -f "$round_dir/checkpoint.txt" ] || [ "$(sed -n '1p' "$round_dir/checkpoint.txt")" != "$checkpoint" ]; then
      echo "Oracle lane error: accepted checkpoint does not match frozen round" >&2
      exit 1
    fi
    write_atomic "$lane_dir/accepted-checkpoint.txt" "$checkpoint"
    write_atomic "$state_file" "accepted"
    echo "Oracle lane accepted: $lane_id round $round [$checkpoint]"
    ;;

  *)
    echo "Oracle lane error: action must be init, checkpoint, test, review, or accept" >&2
    exit 1
    ;;
esac
