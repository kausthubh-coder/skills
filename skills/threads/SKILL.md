---
name: threads
description: Start, steer and read T3 threads on my laptop or Mac mini from either machine. Use to move a thread to the Mac, get a Windows check from the laptop, manage threads on both, or answer a message from the other machine.
---

# Threads across my laptop and Mac mini

T3's thread tools only reach threads on their own machine. `threads.mjs` reaches both: each machine runs a small bridge on its Tailscale address, and the script calls the other machine's bridge, which runs T3's own `t3 thread` CLI there. Threads on this machine work too, so one command covers both.

The script, called `T` below: `node C:\Users\kaust\.claude\skills\threads\scripts\threads.mjs` on the laptop, `node ~/.claude/skills/threads/scripts/threads.mjs` on the Mac.

```
T list [laptop|mac] [--all]     # threads on both machines; the last column is each thread's address
T show mac:<id> [--n 6]         # its state and latest messages
T send mac:<id> <file>          # queued as its next turn; never interrupts
T start mac <brief file> --branch <b>   # continue branch <b> in a new worktree there
T start laptop <brief file> --base origin/<b>   # a new branch from <b>
```

A new thread only gets its brief, and a remote machine only sees what's on GitHub. Before `start`, push what it needs; after it, check `T show` reports a run within a minute.

`start` tells the new thread who started it and how to send its final report back. Every `send` from a thread says which thread it came from and how to reply. Reports arrive in your thread as a new message, so don't poll; end your turn or carry on. `--detach` leaves the reply line off, for work that's now the other thread's. Run `start` and `send` from your thread's own checkout so the script can tell which thread you are; if it says it can't, pass `--from <your thread id>`.

## Move this thread to the other machine

1. Commit what the new thread needs on this branch (plans, notes, unfinished work as a `WIP:` commit) and push. On `main`, make a branch first. This push isn't a ship.
2. Write the brief to a temp file. It's all the new thread gets: the goal in my words and what I first asked; what's done (commits, PRs) and what's left; every decision I made, plus the defaults you picked and that they're defaults; the files to read first. Don't point at this thread's messages: the other machine can't read them.
3. `T start mac <brief> --branch <branch> --detach --title "<project>: <task>"`.
4. Tell me the new thread's title and address. From now on don't push to that branch from here; two threads pushing one branch collide.

## A Mac thread needs Windows

The laptop does Windows checks for large app changes, or when I ask. Push the branch, then `T start laptop <brief> --base origin/<branch> --title "<project>: Windows check"`. The brief says what to run and what passing looks like, and that the laptop thread must not push or merge. Keep working on what doesn't depend on the result. If the laptop can't be reached, it's asleep: put the check under "Needs you" in your report instead of waiting.

## Manage threads on both machines

`T list` shows what's running where. Read a thread with `T show` before you steer it, and send only what changes its course; don't message a working thread to ask how it's going. When I ask how things are going, give each thread's state and its last real result in a line, not its whole history.

## A message from the other machine

It starts with `From my <machine> thread "<title>" (<address>)` and the reply command. Do what it asks if it's in scope, and answer with that command. A final report needs no answer.

## When it fails

- `can't reach the Mac mini` or `the laptop`: that machine is asleep, off Tailscale, or its bridge is down. Nothing was sent.
- Bridge down: `T install` on that machine starts it and keeps it running (LaunchAgent `box.threads`, log `~/box/logs/threads.log`; Task Scheduler "Threads bridge", log `~/.t3/threads-bridge.log`). The bridge restarts itself when skills sync pulls a new version of the script.
- `no T3 project for <repo>`: that machine has no checkout of the repo registered in T3. `--repo` takes the GitHub name, which can differ from the folder.
