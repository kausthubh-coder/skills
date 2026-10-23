---
name: cloud
description: Move this thread's work to my InstaBox cloud machine, or start, steer or check threads there. Use for /cloud, "move this to the cloud", "continue this online", or "check the cloud threads".
---

# Cloud: threads on my InstaBox machines

My InstaBox machines (`t3`, `t3-2`) each run their own T3 server. A thread there keeps working while my laptop sleeps, and it follows `cloud/BOX.md` (its rules are in its global CLAUDE.md). T3 can't start a thread on another machine. `scripts/cloud.mjs` does it from the laptop by making the same calls T3's web app makes to the machine's server.

Already on a machine? Use T3's own tools there (`t3_thread_launch`, `t3_thread_send`, `t3_thread_read`) for threads on that machine. The script needs the `instabox` CLI, which only my laptop has.

## Move this thread to the cloud

1. **Get the work onto GitHub.** The new thread only sees what's pushed. Commit what it needs on this thread's branch: plans, notes, and unfinished work as a `WIP:` commit. Then push. On `main` or with no branch, create one first. In a personal repo this is the one push the move needs; it isn't a ship.
2. **Write the brief to a temp file.** It's the only context the new thread gets, so it has to stand on its own:
   - the goal in my words, plus what I originally asked;
   - what's done (commits, PRs) and what's left, in order;
   - every answer and decision I gave. For questions I didn't answer, say which default you picked and that it's a default;
   - the files to read first, such as plan pages on the branch;
   - what the machine can't run (Windows, my phone): Devin tests it, or it goes on my list.

   Don't repeat `BOX.md`; the new thread already has it. Don't point to laptop threads by id: the machine can't read them. Paste what matters instead.
3. **Start it:** `node <this skill>/scripts/cloud.mjs move --repo <GitHub repo name> --branch <branch> --title "<project>: <task>" --brief <file>`. Use the GitHub repo name, which can differ from the folder (likh lives in `dev\murmur`). Without `--machine`, the script picks the machine with the most free memory. `--model` and `--instance` default to Opus on Claude. The script prints the machine and the new thread's id.
4. **Check it started:** `cloud.mjs peek --machine <m> --thread <id>` should show a run `running` within a minute.
5. **Tell me** the new thread's title and machine, the defaults you picked for me, and that this thread is unchanged. From here on, don't push to that branch from this thread; two threads pushing one branch collide.

## Steer or check threads there

- `cloud.mjs peek --machine t3` lists the threads and their status, plus the machine's load and how much of the agents' memory cap (about 4 GB) is used. It flags threads stopped at the usage limit and threads "running" but silent for 15 minutes. Add `--thread <id>` for one thread's runs and recent messages.
- `cloud.mjs send --machine t3 --thread <id> --text <file>` steers the running turn, or starts a new turn if the thread is idle. Use it for my instructions; don't nudge a thread that's on course.
- `cloud.mjs resume` restarts threads on both machines that the usage limit stopped, once it has reset. Each machine also runs it every 10 minutes while awake.

When I ask how the cloud threads are doing, answer for each thread:
- Is it moving? Look at when its last message was. Silent while "running" usually means the machine is throttled or paused, not working.
- Is it proving things: tests run, Devin verdicts, CI?
- Is it stuck: the same step repeating, or a wait that never ends?
- Is the machine OK? Agents near the 4 GB cap or a load over 8 hang. Stop what's left over, and send the next thread to the other machine.
