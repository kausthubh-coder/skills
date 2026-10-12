---
name: my-skills
description: Add, edit, remove or update skills in my personal skill library, which is linked into every agent globally. Use when I say "add this to my skills", "update my skill", "make this a global skill", or ask what is in my library.
---

# My skill library

The library lives at `C:\Users\kaust\OneDrive\Documents\dev\agent-skills`, a public git repo (`kausthubh-coder/skills`). Read its `README.md` before changing anything. Commit each change; push only when I ask. `reports/` is gitignored, so keep anything private there.

- `skills/<name>/` are global skills. Each is linked (a junction) into `~/.agents/skills` (Codex) and `~/.claude/skills` (Claude Code), so an edit in the library is live in every agent at once. Edit the library copy, never the linked path.
- `sources.json` records where each skill came from (upstream repo, path, commit, license) and what I changed.
- `CATALOG.md` lists every skill I looked at upstream and whether I took it.
- `critly` and `critly-audit` are linked from my Critly checkout (`sources.json` → `local`), not stored here. Change them in `C:\Users\kaust\OneDrive\Documents\dev\critly\craft` and commit there. `critly/references/` and the marked section of `critly/SKILL.md` are generated from `content/` by `bun run build:skill`: edit the concept, then rebuild. The rest of `critly/SKILL.md` and all of `critly-audit/` are hand-written.

## Add a skill

1. A skill that only matters for one repo goes in that repo's `.agents/skills/`, not here.
2. Create `skills/<name>/SKILL.md`. The folder name and the `name:` field must match. Follow the `writing-for-agents` skill for the description: front-load the trigger, one trigger per branch.
3. From upstream: copy the whole folder from `_sources/`, add an entry to `sources.json` with the commit, and record every edit you make under `changes`. Only copy skills whose license allows it (MIT is fine). For no license or a restrictive one, install from upstream with `bunx skills add <repo> -g` instead and note it in `CATALOG.md`.
4. Run `node scripts/link.mjs` to link it everywhere. Run it again after a rename or delete; it prunes stale links.

## Update from upstream

Run `node scripts/upstream.mjs`. It pulls `_sources/` and lists the adopted skills whose upstream changed since the recorded commit. For each one, show me the diff, reapply our `changes` on top if I want the update, then bump the commit in `sources.json`.

## Keep it small

Every global skill's description is in context in every session of every agent. Before adding one, ask whether I will really use it outside one project. Suggest removing skills I have not used.
