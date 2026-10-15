# Skills: load these first

The skill list is easy to skip. This short list is not. When the case applies, load the skill before you start.

- Something is broken, blank, wrong, stuck, slow or not working, or I ask why something happens: `diagnosing-bugs`.
- You're writing prose a person will read (PR description, commit message, docs, README, post, email): `unslop`.
- You're about to say done: check the real result with the repo's `verify-<app>` skill. If there's none and you can't check your own work, use `create-verification-skill`.
- You measured a number (speed, load time, size, latency) or are reporting one: `benchmark-checklist`.
- First task in a new worktree, or install, env, port or backend look wrong: the repo's `worktree-<app>` skill. I say ship, deploy or release: the repo's `ship-<app>` skill. If the repo has neither, use `create-project-flows`.
- Anything I'll read beyond a chat reply (a plan, report, audit, comparison, write-up or explainer): an HTML page with `html-artifacts`. Never a Markdown file for me. Markdown is only for files agents read (AGENTS.md, skills).
- I correct you for the same thing twice: `correct`.
- Making a video, animation, motion graphic or product demo: the HyperFrames skills are parked so they don't crowd the menu. Read `~/.skills-parked/hyperframes/SKILL.md` first. When it says to load `/hyperframes-x` or another skill, read `~/.skills-parked/<that name>/SKILL.md`.
- Adding or changing Clerk auth: the Clerk skills are parked in `~/.skills-parked/` (`clerk-setup`, `clerk-cli`, `clerk-orgs` and others). Read the one that fits.
- Any Convex, Vercel or Cloudflare work (code, CLI, config, deploys, a question about them): read their official skill first. They're parked in `~/.skills-parked/`. Convex: `convex`, which routes to the `convex-*` skills. Cloudflare: `cloudflare`. Vercel: `deploy-to-vercel` for deploys, `vercel-cli`, `env-vars`, `ai-sdk`, `vercel-functions`; list the folder for the rest.
- I name a skill (`/name` or `$name`), even mid-sentence or misspelled: read its SKILL.md in `~/.claude/skills`, `~/.agents/skills` or the repo's `.agents/skills` and follow it. Never say a skill isn't installed without looking there.

# Where my code lives

- Projects: `C:\Users\kaust\OneDrive\Documents\dev\<name>`. Experiments: `dev\sandbox\<name>`, one folder each (rules in `dev\sandbox\AGENTS.md`).
- A T3 "No project" thread runs in a throwaway folder in `C:\Users\kaust\.t3\scratch\`. I research and think through ideas there or in the sandbox, so never build a project in the scratch folder or the sandbox root. When an idea turns into a project, suggest `/init-project`.
