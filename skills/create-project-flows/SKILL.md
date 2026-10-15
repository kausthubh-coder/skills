---
name: create-project-flows
description: "Give a repo its own worktree and ship skills. Use when new worktrees start broken (no deps, env, port or backend), shipping is done by hand, or a repo has no worktree-<app> or ship-<app> skill."
---

# Create project flows

I start every task in a fresh T3 worktree and ship from there. Two things keep breaking:

- **New worktrees.** They start without dependencies or `.env.local`, on a port another worktree already uses, and pointed at a dev backend that other worktrees overwrite.
- **Shipping.** It's done by hand. The main checkout falls weeks behind, and stale worktrees pile up.

This skill writes two project skills that fix both, tailored to this repo:

- `.agents/skills/worktree-<app>/`: make any checkout of this repo work, isolated, in one command.
- `.agents/skills/ship-<app>/`: take verified work to production and leave `main`, the main checkout and the worktree list clean.

`.claude/skills` must link to `.agents/skills` (gitignore the link) so Claude Code and Codex both find them.

## 1. Read the repo first

Find out, from the code and history rather than by asking:

- **Install:** the package manager. Keep the one the lockfile uses. My "bun only" is for new projects.
- **Dev:** how dev starts, and which ports it really binds. Check them; Next ignores `PORT` in `.env` files, for example.
- **Env:** where dev config comes from. Usually the main checkout's untracked env files (`git rev-parse --git-common-dir`), sometimes a folder like `~/.<app>/dev-env`. Separate dev values from production values, and from tokens a CLI pulled.
- **What must be isolated per checkout:**
  - Web: port and backend. For Convex, `convex dev --local` or an anonymous local deployment.
  - Desktop: data folder, IPC or pipe names, hotkeys, registry entries, the updater, and my installed copy, which agents never touch.
  - Name the shared backend that worktrees must stop pushing to.
- **Production:** every surface and what ships each one. Push to `main` with Vercel or CI, `convex deploy`, npm publish, tags and GitHub releases, an APK or installer build. Check whether pushing a non-main branch makes a preview, and what that costs (Convex preview quota). Read CI, AGENTS.md, `docs/ops.md`, `git log`, and my recent T3 threads where I said "merge and deploy" (`t3_thread_list`; search misses them) to see what actually worked.
- **Git flow:** personal repos merge straight into `main`; public ones go through a PR with CI, and my "ship" is the go to merge once CI passes. Take this from AGENTS.md or `docs/me.md` in my skill library.

## 2. The setup script

Write or extend `scripts/setup.mjs`, or the repo's equivalent, plus a `doctor`. Setup must:

- **Be safe to rerun and fast.** When nothing is missing it finishes in seconds.
- **Copy dev env** when it's missing. Refuse values that name production.
- **Install** dependencies when they're missing or older than the lockfile.
- **Claim a port per surface.** Derive it from a hash of the worktree path. Skip ports other worktrees have claimed, even ones not running now. Check that nothing answers on either `127.0.0.1` or `::1`. Write it where dev really reads it, or wrap the dev command so it does.
- **Give the checkout its own backend, and make `dev` use it.**
  - Point the frontend env at the local backend.
  - Change the dev script so nothing pushes to the shared backend by default.
  - Keep any opt-in to the shared backend explicit, read-only for functions, and say what it's for (third-party keys the local one lacks).
  - If isolation is impossible, say so in the skill and in the doctor output.
- **Link the skills.** Create the `.claude/skills` link (a junction on Windows).
- **Finish with the doctor and one summary line.**

The doctor checks the same things read-only and prints the fix command for each failure. It also reports how far the checkout is behind `origin/main`. Add `setup` and `doctor` to the repo's scripts.

Give the repo a remove command too. On Windows, `git worktree remove` leaves the `.claude\skills` junction and the folder behind. Delete the junction with `rmdir` (never a recursive delete through it), stop the checkout's backend and dev process trees (`taskkill /T /PID`), then remove the worktree.

## 3. worktree-<app>

The description says to use it at the start of every task in a new worktree, whenever install, env, port or backend look wrong, and before giving a helper agent its own checkout. The body covers:

- The setup, doctor, dev and remove commands, and what a healthy summary looks like.
- **Helpers.** `git worktree add` from `origin/main` under the same parent folder as T3's worktrees, then setup. One worktree and one backend per helper; never two agents in one checkout.
- **Never edit the main checkout.** Say where it is.
- **Cleanup.** Stop only processes you started, by PID and with their children. Remove a worktree only when its work is merged or I say so, and never one that another live thread is using (check `t3_thread_list`).

## 4. ship-<app>

The description says to use it only when I say ship, deploy, release, or merge and deploy. Each step is this repo's exact commands:

1. **Ready:**
   - The tree is clean and up to date with `origin/main`.
   - The full check passes.
   - Every changed feature was driven with `verify-<app>` and has evidence.
   - List what's going out (`git log origin/main..HEAD`) and which surfaces it touches.
   - Write down how to roll back.
2. **Backend first:** if landing deploys the frontend (Vercel on push), deploy schema and functions before landing.
3. **Land:**
   - Personal: fast-forward push from the worktree (`git push origin HEAD:main`). Don't merge in the main checkout.
   - Public: open the PR, wait for CI, then merge.
4. **Deploy and release** the surfaces this change touches: say what deploys on push, and run the rest (tags, releases, package publishes, app builds). When app code changed, the release is part of the ship, not a follow-up question. Watch each to the end; never end the turn while a build is queued or running.
5. **Check production** with a read-only smoke test of each shipped surface: the URL, the version, release assets, and a probe that reads but never writes.
6. **Update the main checkout:**
   - If it's clean and on `main`: `git -C <main> pull --ff-only`, then rerun setup there. In some repos this step is itself a deploy (globally linked skills); say so.
   - If it's dirty or on another branch: leave it alone and tell me.
7. **Clean up:** delete the merged branch locally and on the remote (not `gh pr merge --delete-branch` inside a worktree). A thread can't remove its own worktree, so list it for removal later.
8. **Report** in a few lines: what shipped, to which surfaces, the evidence, and anything skipped or left.

**Rules:**
- Production needs my go in this conversation. "Ship" is that go for every step above, including cleanup: don't stop to ask between steps.
- When a step fails because of this change (a deploy limit, a failing check), fix it, rerun the checks and carry on. Stop and tell me only when the cause is outside the change or the fix needs my decision.
- Never force-push, never skip checks, and never raise a warning cap to get through.

## 5. Wire it in

- **AGENTS.md:** the setup, doctor and remove commands, plus two lines. "Every task in a new worktree starts with `worktree-<app>`." "Ship only with `ship-<app>`, when I say so."
- **T3:** the worktree-create script must run setup.
  - When project settings are folded (`projectSettingsFolded: true` in `~/.t3/userdata/settings.json`), T3 reads scripts only from `projectSettingsOverrides["<projectId>"].defaultProjectScripts`. That list replaces the project's scripts, so carry the others over.
  - Use this entry: `{"id":"setup","name":"Setup","command":"<setup cmd>","icon":"configure","runOnWorktreeCreate":true,"async":false}`. It runs in PowerShell.
  - `t3_project_update` writes a field T3 ignores. The T3 project's `workspaceRoot` must be the git repo itself, or T3 can't make worktrees.
  - Back up `settings.json`, then set it there, or tell me.

## 6. Prove both

- **Worktree:**
  1. Make a brand-new worktree with nothing in it and run setup.
  2. Run the doctor.
  3. Start dev in it next to a second worktree. Confirm the ports and backends differ: data written in one is missing from the other.
  4. Remove both with the remove command.
  5. If you set the T3 script, launch an idle T3 thread in a new worktree and check that setup ran (its terminal log is in `~/.t3/userdata/logs/terminals/`).
- **Ship:** walk every step without doing anything that leaves the machine: print the push, deploy, publish and release commands instead of running them. Only actually ship when I asked for it.
- Report what you ran and what you saw. A flow that never ran is a draft.
