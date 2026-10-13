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

`.claude/skills` must link to `.agents/skills` so Claude Code and Codex both find them.

## 1. Read the repo first

Find out, from the code and history rather than by asking:

- **Install:** the package manager and how to install. Use the lockfile that's there; don't switch npm to bun as a side effect.
- **Dev:** how dev starts, which ports it uses, and how a port is chosen.
- **Env:** which untracked env files exist in the main checkout. Find the main checkout with `git rev-parse --git-common-dir`. Note which values are dev and which would be production.
- **Backend:** whether each worktree can get its own. For Convex, `convex dev --local` or an anonymous local deployment. Name the shared deployment that worktrees must not push to.
- **Production:** what ships it today. Push to `main` with Vercel or a CI deploy, `convex deploy`, npm publish, GitHub releases, an APK or installer build. Read the CI workflows, AGENTS.md, `docs/ops.md` and `git log`. Read my recent T3 threads where I said "merge and deploy" (`t3_thread_list` for this project), since they show the steps that actually worked and the ones that broke.
- **Git flow:** personal repos merge straight into `main`; public ones go through a PR with CI. Take this from AGENTS.md or `docs/me.md` in my skill library.

## 2. The setup script

Write or extend `scripts/setup.mjs`, or the repo's equivalent, plus `doctor`. Setup must:

- **Be safe to rerun and fast.** When nothing is missing it finishes in seconds.
- **Copy env.** Copy the untracked dev env files from the main checkout when they're missing. Never copy production values.
- **Install.** Install dependencies when they're missing or older than the lockfile, using the repo's own package manager.
- **Pick a port.** Derive it from a hash of the worktree path, check it's free, and write it where the dev command reads it. Two worktrees never share a port.
- **Give the worktree its own backend,** or, if that's impossible, say plainly in the skill and the doctor output which shared one it uses.
- **Link the skills.** Create the `.claude/skills` link (a junction on Windows).
- **Finish with the doctor and one summary line.**

The doctor checks the same things read-only and prints the command that fixes each failure. It also reports how far the checkout is behind `origin/main`. Add `setup` and `doctor` to the repo's script list.

## 3. worktree-<app>

The description says to use it at the start of every task in a new worktree, whenever install, env, port or backend look wrong, and before giving a helper agent its own checkout. The body covers:

- The setup and doctor commands, and what a healthy summary looks like.
- **Helpers.** `git worktree add` from `origin/main` under the same parent folder as T3's worktrees, then setup. One worktree and one backend per helper; never two agents in one checkout.
- **Never edit the main checkout.** Say where it is.
- **Cleanup.** Stop only processes you started, by PID. Remove a worktree only when its work is merged or I say so, and never one that another live thread is using (check `t3_thread_list`).

## 4. ship-<app>

The description says to use it only when I say ship, deploy, release, or merge and deploy. Each step is this repo's exact commands:

1. **Ready:**
   - The tree is clean and up to date with `origin/main`.
   - The full check passes.
   - Every changed feature was driven with `verify-<app>` and has evidence.
   - List what's going out (`git log origin/main..HEAD`).
2. **Land:** follow the repo's git flow. Personal: merge into `main` and push. Public: PR, then wait for CI and my review.
3. **Deploy:** run the deploy, or say it happens on push, and watch it to the end with a bounded wait. Backend schema and functions go before the frontend that needs them.
4. **Check production** with a read-only smoke test of the shipped change: the URL, the version, and a probe that reads but never writes.
5. **Update the main checkout:**
   - If it's clean: `git -C <main> pull --ff-only`, then rerun setup there.
   - If it's dirty or on another branch: leave it alone and tell me.
6. **Clean up:** delete the merged branch locally and on the remote, and remove the worktree once no thread needs it.
7. **Report** in a few lines: what shipped, where, the evidence, and anything skipped or left.

**Rules:**
- Production needs my go in this conversation.
- Stop at the first failure.
- Never force-push, never skip checks, and never raise a warning cap to get through.
- Write down how to roll back before deploying.

## 5. Wire it in

- **AGENTS.md:** the setup and doctor commands, plus two lines. "Every task in a new worktree starts with `worktree-<app>`." "Ship only with `ship-<app>`, when I say so."
- **T3:** its worktree-create script should run setup with `async: false`.
  - When project settings are folded (`projectSettingsFolded: true` in `~/.t3/userdata/settings.json`), T3 only reads `projectSettingsOverrides["<projectId>"].defaultProjectScripts`.
  - Scripts saved with `t3_project_update` land in a field T3 ignores and silently never run.
  - Tell me, or set it there.

## 6. Prove both

- **Worktree:**
  1. Make a brand-new worktree with nothing in it and run setup.
  2. Run the doctor.
  3. Start dev in it next to a second worktree and confirm the ports and backends differ.
  4. Remove both.
- **Ship:** walk every step without doing anything that leaves the machine: print the push, deploy and release commands instead of running them. Only actually ship when I asked for it.
- Report what you ran and what you saw. A flow that never ran is a draft.
