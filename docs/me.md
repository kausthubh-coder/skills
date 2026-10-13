# How I work, and decisions so far

Who the skills are for, what I've decided and why, and the corrections I've given. Read this before changing a skill, so you don't redo a decision I already made. Add to it when I decide something new or correct you.

## My setup

- **Agents:** T3 Code running Claude Code and Codex, plus the Codex app. Nothing else (no Cursor, no OpenCode). Skills are linked into `~/.claude/skills` and `~/.agents/skills` only.
- **Machine:** Windows 11. Projects live in OneDrive at `C:\Users\kaust\OneDrive\Documents\dev`. Experiments go in `dev\sandbox\<name>`; real projects in `dev\<name>`. Read `dev\sandbox\AGENTS.md` for the sandbox rules and how promotion works.
- **Stack:** bun, Next.js for web apps, Convex, Clerk, Vercel. Nothing else by default; anything else is decided per project. New projects never use npm or npx. Existing repos keep the package manager their lockfile uses (krida is npm) until I decide to switch.
- **GitHub:** `kausthubh-coder`.
- **Cost:** for mechanical work that needs no taste (moving files, cleanups, bulk edits), use GPT subagents through T3 `delegate_task` to save Claude usage.

## How I like to work

- Keep it minimal. Fewer files, fewer skills, shorter docs. I'll ask for more.
- I'm fast and impatient. Do the obvious thing, tell me what you did, don't ask about choices with a sensible default.
- A question gets an answer, not an action.
- No security lectures. If something is actually dangerous for this task, say it in one line; otherwise skip it.
- I write fast with typos. Read for intent.
- Writing I'll read or post: plain, short, no em dashes. For my X posts: lowercase, short lines, my voice, specific and niche, not generic advice everyone already knows.

## Decisions (and why)

| Decision | Why |
|---|---|
| The library lives in `dev\agent-skills`, not sandbox | It's a real project, not an experiment |
| Linked with Windows junctions by `scripts/link.mjs` | An edit in the library is live in every agent at once; junctions need no admin |
| Project skills in `.agents/skills`, `.claude/skills` junctioned to it | Claude Code and Codex read the same folder; no duplicate copies |
| `/init-project` is for fresh projects only; `/optimize` is for existing ones | Different jobs: one interviews and scaffolds, the other audits and plans |
| Tiers: experiment (sandbox, commit to `main`), personal (dev, merge straight to `main`, no PRs), public (dev, PRs with CI) | Personal projects like krida and kriyan have no one to review a PR. Studi is public, so it gets PRs |
| Next.js, not Vite, for web apps | I asked for it: bun + Next.js + Convex + Clerk + Vercel is what I use |
| Sanskrit names are a taste, not a rule | Naming guidance exists so the agent knows my preferences, not to restrict it |
| `/optimize` reads T3 threads and Claude Code and Codex session history | My corrections live there; a correction given twice is a mistake class |
| T3 Code's own skills are not in the library or used as examples | Too T3-specific; they were noise |
| Ras Mic's skills are copied in (`evidence-driven-testing`, `before-and-after`, `code-structure`) | They're published for people to copy |
| Critly's skills are linked from the Critly checkout, not stored here | Critly generates them; a rebuild there should be live everywhere |
| AGENTS.md about 100 lines, deep material in `docs/` | See philosophy §3 |
| A short "load this skill when…" block (`global/skills.md`) in my global CLAUDE.md and Codex AGENTS.md | Trigger tests: process skills went from 0/3 to 3/3 with it; descriptions alone weren't enough |
| Every project gets `worktree-<app>` and `ship-<app>` skills (`create-project-flows`) | I start each task in a fresh T3 worktree; shipping should also update `main` and the main checkout |
| krida's optimize branch stays unmerged until I've tested it | I don't want to risk production. Not a skills problem |
| `bro` and `in-your-own-words` copied from pstack, user-only | I want to ask for a plain restatement, or for my goal played back |

## Corrections I've given (don't repeat these mistakes)

- Put things in sandbox that belonged in `dev\`.
- Assumed I use Cursor or OpenCode.
- Treated `/init-project` as a tool for existing repos.
- Said Ras Mic's skills couldn't be copied.
- Picked Vite and a pile of extra tools instead of my stack.
- Made Sanskrit naming sound like a rule.
- Left Codex and Claude history out of `/optimize`.
- Added T3 examples that were noise.
- Lectured me on security.
- Defaulted to a `dev` branch and PRs for personal projects.
- Thread drafts that were too generic, leaned on anti-cheating advice written for older models, or pushed too many things at once.
- Counted an unmerged branch I kept back on purpose as a skills failure.
- Proposed per-skill workarounds before testing why skills don't trigger. Test first.

## Projects the skills have been tested on

Audits from 2026-10-12 are in `reports/` (local only): krida, Studi/Inky (studi-2), kriyan. Their shared gaps are now the checklist in `skills/optimize/SKILL.md`. krida got the fixes; I'm redoing Studi and kriyan myself.
