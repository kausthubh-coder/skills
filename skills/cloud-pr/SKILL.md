---
name: cloud-pr
description: Build a change in a Claude cloud thread, have Devin test the PR on real devices, loop fixes, then ship. Use when I say /cloud-pr <project> <task>.
disable-model-invocation: true
---

# Cloud PR

I hand you a project and a task. Claude Code on the web builds it and opens a PR, Devin tests that PR on the platform it needs, and you, a local T3 thread, carry Devin's verdict back until it passes. Then the PR merges when I say ship, or by itself if I said "ship when it passes". The point is that I don't babysit any of it.

Everything runs in the cloud except Windows checks. Keep me out of the loop until there's a pass, a real decision, or a stuck failure.

## 0. Is the repo ready

- The T3 project exists (`t3_project_list`) and its repo has `scripts/cloud.mjs` on `origin/main`. If not, run `create-project-flows` §6 on it first, from a cloud thread.
- Pick Devin's platform from the repo's AGENTS.md (`## Testing on Devin`): browser, Android emulator, iOS Simulator or macOS. Windows-only work (likh, Studi's desktop app) is step 4, never Devin.

## 1. Build: a Claude cloud thread opens the PR

`t3_thread_launch` with `projectId`, `workspaceStrategy: {type: "root"}`, `modelSelection: {instanceId: "megha-claude", model: "claude-opus-5-5", options: {mode: "bypassPermissions"}}`, and a message that holds:

- the task in my words, with anything from this thread it needs (the cloud can't read T3)
- "Work in PR mode (your cloud note): prove it, open the PR, put the PR URL in your last message, and stop."

Wait for it with `t3_thread_wait` (long timeouts, call again on timeout). Read its last message for the PR URL; if there's none, read why and fix the brief, or tell me. `link_pull_request` the PR.

## 2. Test: Devin

Testing is manual for now: you start it, once per round. Fill `cloud/devin-test.md` in my skill library (the PR URL, the platform, what changed in one line) and start a Devin cloud session with it:

```
devin --cloud --model <GPT-6.1-Sol's id from `devin models list`> -p "<the filled prompt>"
```

Run it in the background; it prints Devin's answer when the session ends. If the CLI isn't set up, use the Devin MCP (`devin_session_create`, then `devin_session_gather`) if it's connected; otherwise stop and tell me what to set up.

Devin posts its verdict on the PR (`Devin test: PASS` or `FAIL`). Read the comment with `gh pr view <n> --comments`, not just the CLI output.

## 3. Fix loop

On FAIL, `t3_thread_send` to the build thread: Devin's comment as it stands, plus "check out <branch>, fix it, rerun the checks, push to the same branch, and stop." Wait, then go back to step 2.

Stop after three failed rounds, or when a failure isn't about the code (a missing login, a broken device, a flaky emulator), and tell me what's stuck, in plain words.

## 4. Windows, when the change needs it

Launch a local T3 thread in a new worktree on the PR branch (`workspaceStrategy: {type: "worktree", baseRef: "<branch>", startFromOrigin: true}`) that runs the repo's `verify-<app>` for the changed feature and comments the result on the PR. Its failures go through step 3 like Devin's.

## 5. Done

When Devin passes (and Windows, when it ran), and CI is green:

- If I said "ship when it passes", send "ship" to the build thread and wait until it reports the ship is done.
- Otherwise tell me, in three lines: the PR, what Devin tested and its recording, and anything left.

`watch_pull_request` the PR while you wait on long steps, and `unwatch_pull_request` when you hand back to me.
