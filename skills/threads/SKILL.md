---
name: threads
description: Start, steer and read T3 threads on my laptop or Mac mini from either machine. Use to move a thread to the Mac, get a Windows check from the laptop, manage threads on both, or answer a message from the other machine.
---

# Threads across my laptop and Mac mini

Use T3's native remote MCP connections. The local `t3-code` tools target the machine running the agent, even when the user views that thread from another device.

| Agent runs on | Other machine's MCP server | Native URL |
|---|---|---|
| Mac mini | `t3-laptop` | `https://kaust-pc.taile36082.ts.net/mcp` |
| Windows laptop | `t3-mac` | `https://t3.taile36082.ts.net/mcp` |

Both Codex and Claude Code use their native MCP configuration and OAuth sign-in. New agent sessions load these connections. Confirm the target with its remote `t3_environment_read` before acting.

Use the selected server's `t3_project_list`, `t3_thread_list`, `t3_thread_read`, `t3_thread_send`, and `t3_thread_launch`. A project or thread ID belongs to its environment; look up the destination project rather than reusing the source project ID. Read a thread before steering it. Use `mode: "queue"` for a new turn, and `mode: "steer"` only for an intended mid-turn change.

For a task that reports back, include the source machine, thread ID and link in its brief. Tell the target to send its final report through the return MCP server's `t3_thread_send` with `mode: "queue"`. Sending and replying need explicit instructions; T3 does not copy this conversation into a new thread. For an independent handoff, leave out the return task.

Use native bounded waits when needed and follow the tool's `next`. A completion wake replaces polling. Keep working on independent steps while another machine runs.

## Move this thread to the other machine

1. Commit what the new thread needs on this branch (plans, notes, unfinished work as a `WIP:` commit) and push. On `main`, make a branch first. This push isn't a ship.
2. Write a self-contained brief: the goal in my words and what I first asked; what's done, the pushed SHA and PRs; what's left; my decisions and your stated defaults; the files to read first.
3. Find the Mac project through `t3-mac`. Launch there with `workspaceStrategy: {type: "worktree", baseRef: "origin/<branch>", branch: "<branch>"}`. The target must fetch origin and confirm its starting commit matches the pushed SHA before editing.
4. Read the destination thread to confirm it started. Give me its returned link. From then on, the Mac thread owns pushes to that branch.

## A Mac thread needs Windows

The laptop does Windows checks for large app changes, or when I ask. Push the branch, find the laptop project through `t3-laptop`, and launch a test thread with `workspaceStrategy: {type: "worktree", baseRef: "origin/<branch>"}`. Give it the pushed SHA, what to run, what passing looks like, and the return MCP server and source thread ID. It must fetch origin, check the starting SHA, and leave pushes and merges to the source thread. Keep working on independent steps.

## Manage threads on both machines

List projects and relevant threads through each machine's native MCP server. Read the latest messages before reporting state. Give each thread's state and last real result in one line, using its returned link. Message a working thread only to change its course.

## A message from the other machine

Read the named thread through its machine's native MCP server. Do the requested work if it is in scope, and send the answer through that server's `t3_thread_send`. A final report needs no answer.

## When it fails

- Missing remote tools: start a fresh agent session after checking its native MCP configuration. Codex uses `codex mcp list`; Claude uses `claude mcp list`.
- Sign-in required: use `codex mcp login <server>` or `claude mcp login <server>`. Add `--no-browser` on a headless machine. Approve through T3's native pairing flow. Pairing codes are one-time approval inputs, not MCP bearer tokens; keep credentials out of messages and reports.
- Unreachable laptop: check Tailscale and the native HTTPS route once. If it is asleep or offline, report the Windows check under "Needs you" and continue independent work. A timeout alone does not prove it is asleep.
- Missing project: check the destination's registered projects and checkout paths. Repository names can differ from folder names.

Native setup is documented in [T3's outside-agent guide](https://github.com/pingdotgg/t3code/blob/main/docs/user/outside-agents.md). The old custom bridge is retired; use native connections for both directions.
