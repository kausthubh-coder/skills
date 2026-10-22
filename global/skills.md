# Skills: load these first

The skill list is easy to skip. This short list is not. When the case applies, load the skill before you start.

- Something is broken, blank, wrong, stuck, slow or not working, or I ask why something happens: `diagnosing-bugs`.
- You're writing prose a person will read (PR description, commit message, docs, README, post, email): `unslop`.
- You're about to say done: check the real result with the repo's `verify-<app>` skill. If there's none and you can't check your own work, use `create-verification-skill`.
- You measured a number (speed, load time, size, latency) or are reporting one: `benchmark-checklist`.
- First task in a new worktree, or install, env, port or backend look wrong: the repo's `worktree-<app>` skill. I say ship, deploy or release: the repo's `ship-<app>` skill. If the repo has neither, use `create-project-flows`.
- Anything I'll read beyond a chat reply (a plan, report, audit, comparison, write-up or explainer): an HTML page with `html-artifacts`. Never a Markdown file for me. Markdown is only for files agents read (AGENTS.md, skills).
- I correct you for the same thing twice: `correct`.
- Making a video, animation, motion graphic or product demo: the HyperFrames skills are parked so they don't crowd the menu. Read `~/.skills-parked/hyperframes/SKILL.md` first. When it says to load `/hyperframes-x` or another skill, read `~/.skills-parked/<that name>/SKILL.md`. When it says to run `npx hyperframes skills update <name>`, don't: that reinstalls them globally. Read `~/.skills-parked/<name>/SKILL.md` instead.
- Adding or changing Clerk auth: the Clerk skills are parked in `~/.skills-parked/` (`clerk-setup`, `clerk-cli`, `clerk-orgs` and others). Read the one that fits.
- Any Convex, Vercel or Cloudflare work (code, CLI, config, deploys, a question about them): read their official skill first. They're parked in `~/.skills-parked/`. Convex: `convex`, which routes to the `convex-*` skills. Cloudflare: `cloudflare`. Vercel: `deploy-to-vercel` for deploys, `vercel-cli`, `env-vars`, `ai-sdk`, `vercel-functions`; list the folder for the rest.
- I name a skill (`/name` or `$name`), even mid-sentence or misspelled: read its SKILL.md in `~/.claude/skills`, `~/.agents/skills` or the repo's `.agents/skills` and follow it. Never say a skill isn't installed without looking there.

# How I work

- Answer first, in plain words, in the first two lines; detail after, only if it helps. Name a branch, script or skill only with what it is.
- One problem per answer. Two causes get two answers.
- Do the obvious next step instead of asking "want me to?". Ask only when the choice is mine and changes what you do.
- If a shortcut changes what I asked for (a stub, a toy input, an extension instead of a built-in feature), say so before you build it.
- I interrupt to redirect, not to cancel. "continue" means carry on with the plan.
- "Ship", "deploy", "release" or "make it live" is the go for the whole ship: fix forward when a check or deploy fails on this change, release, clean up, without asking again. Never end a turn while a build or deploy you started is still running.

# Where my code lives

- Projects: `C:\Users\kaust\OneDrive\Documents\dev\<name>`. Experiments: `dev\sandbox\<name>`, one folder each (rules in `dev\sandbox\AGENTS.md`).
- Search a repo with the Grep tool, `rg` or `git grep`, never `grep -r`, `find` or `du` over it. My repos hold up to 200k untracked files (node_modules, prototypes): `grep -r` took 2 minutes in critly, `git grep` 0.14s. A hook blocks `grep -r`.
- Run anything that takes over a minute (builds, test suites, dev servers) with `run_in_background` and wait for it to finish. If a server or job hasn't answered within a minute, check that its process is alive and read its log; never poll it for minutes. Agents lost 11 hours in two weeks to commands that sat until the 10-minute limit.
- Stop a server by the PID you started, never by port. On Oct 12 an agent freed critly's port with `Stop-Process`, killing a dev server five other agents used; they polled it for two hours.
- A T3 "No project" thread runs in a throwaway folder in `C:\Users\kaust\.t3\scratch\`. I research and think through ideas there or in the sandbox, so never build a project in the scratch folder or the sandbox root. When an idea turns into a project, suggest `/init-project`.
