---
name: delegating
description: Hand work to another agent well, whether a subagent, a T3 thread, a cloud thread or Devin. Use before you start one, while it runs, and before you report what it did.
user-invocable: false
---

# Delegating

Another agent saves you context and time, not responsibility. What it reports is yours once you repeat it.

Don't split work you can finish yourself in this session. Fan out only across real seams: slices that don't need each other's answers. For many similar units, run one end to end first; it tests the brief and the check cheaply.

## Pick who does it

- **A piece of your own task whose answer comes back to you** (research, reading across many files, one slice of a check): a subagent. Mechanical work with no taste in it (moves, renames, bulk edits, conversions) goes to a GPT subagent through T3 `delegate_task`, which saves my Claude usage. Judgment (design, grading, anything I'll read) stays on Claude.
- **Independent work I'll follow on its own** (its own feature or PR): a new T3 thread in its own worktree, only when I ask for separate threads.
- **Long work that shouldn't depend on my laptop:** a thread on my InstaBox machine, through the `cloud` skill. Only when I say cloud or online, or the project already runs there. Agents twice sent work to the cloud that I never asked for, and I had to undo it.
- **What only a phone or a Mac can show** (the Android emulator, the iOS Simulator, macOS desktop apps): Devin, as `cloud/BOX.md` says. A build passing in CI isn't that test; Devin running the app is.

## The brief

The other agent knows only what you write down. A brief that works has:

- **The goal in my words**, and why I want it.
- **Done as a check that passes or fails**: "every caller migrated, the old API deleted, the suite green". Never a duration or "work on X".
- **A fresh base**: `origin/<branch>`, fetched now. Five worktrees cut from a stale local `main` lost hours (kriyan was 41 commits behind, krida 31).
- **Facts you checked, not remembered.** A manager told a cloud agent portfolio was a personal repo, and the agent switched portfolio's ship skill to direct pushes.
- **What it may touch**: its own worktree, branch or output file. No push or merge unless that's the job. Never stop a server it didn't start.
- **What to report**: PASS, ISSUES or BLOCKED; the evidence (commands and their output, screenshots, SHAs); and what it didn't check.
- **Questions it can't settle:** it picks a default, says so in the report and keeps going. Only irreversible steps and my product or taste calls wait for me.

If you're writing the same instruction into a second brief, it belongs in the rules every agent reads instead (the repo's AGENTS.md, or `cloud/BOX.md` for the machine).

## While it runs

- Split work into slices that don't share a writer. Two agents on one branch, file or state record overwrite each other.
- Wait inside your turn, in the background, and keep answering me. A manager blocked 57 minutes on a thread wait answered my 19:28 question at 20:24. Never end your turn on work that's still running; its result won't reach me.
- If it's quiet longer than the job should take, check it's alive (its process, its last message) instead of waiting longer. Check through what it leaves behind (pushed commits, the PR, `t3_thread_read`, `task_status`); don't message a working agent just to ask how it's going.
- Work on a cloud machine is pushed after every unit worth keeping; say so in the first brief, not after the first loss. Commits that exist only on one machine are lost if it dies.
- A cloud machine gives all its threads about 4 GB together, and pauses when no turn is running, which freezes subagents mid-task. One heavy build or dev server per machine; send the next thread to the other machine (`cloud.mjs peek` shows memory and load).
- My laptop and both machines share one Claude account. A big fan-out here stalls every cloud thread at the usage limit: on Oct 22, six max-effort agents in fast mode took a session from 20% to 100% in 16 minutes. Check what's running on the machines before you fan out, and use fast mode only when I ask.

## When it finishes

- Read its diff and rerun its strongest claim yourself before you repeat it. On Oct 15, six readers' reports had two claims wrong, caught only because the manager checked. "Not in the docs" doesn't mean "can't".
- A PASS holds for the commit it tested. Push a new commit and the test is due again; green CI is part of the evidence, not the verdict.
- Send the next round to a fresh agent with everything: the original brief, every later instruction, the last report and its branch. Reuse an agent only when the work needs state it holds, like its checkout or a server it's running.
- Report in your own words: what changed for me, the proof, and what's still unverified. Don't paste its summary.
