# How I work, and decisions so far

Who the skills are for, what I've decided and why, and the corrections I've given. Read this before changing a skill, so you don't redo a decision I already made. Add to it when I decide something new or correct you.

## My setup

- **Agents:** T3 Code running Claude Code and Codex, plus the Codex app. Nothing else (no Cursor, no OpenCode). Skills are linked into `~/.claude/skills` and `~/.agents/skills` only.
- **Machine:** Windows 11. Projects live in OneDrive at `C:\Users\kaust\OneDrive\Documents\dev`. Experiments go in `dev\sandbox\<name>`; real projects in `dev\<name>`. Read `dev\sandbox\AGENTS.md` for the sandbox rules and how promotion works. A new idea starts with no folder: I research it in a T3 "No project" thread (a throwaway folder in `C:\Users\kaust\.t3\scratch\`) or in the sandbox project, and run `/init-project` from there.
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
| An unmerged branch I'm holding back is my call, not a skills failure | krida's optimize branch waited until I'd tested it (merged 2026-10-13) |
| Anything I read (plans, reports, audits, comparisons) is an HTML page from `html-artifacts`; Markdown only for files agents read | I don't read Markdown files. Also in `global/skills.md` |
| `html-artifacts` has no template (2026-10-14): each page's look comes from its content, held up by the slop list, `check.mjs` and `critly check`/`taste` | Both templates (editorial, then dark "Instrument") made every page look the same, and their signatures are on published lists of AI-design tells |
| HyperFrames and Clerk skills parked in `~/.skills-parked/`, reached through `global/skills.md` | They filled the `/` and `$` menus in every project. If `npx skills update` reinstalls them globally, park them again |
| Official Convex, Vercel and Cloudflare skills parked too (2026-10-14), copied by `node scripts/park.mjs` from the repos under `parked` in `sources.json`; the Cloudflare Claude Code plugin is disabled | I want the vendors' own skills on hand without 89 descriptions in every session. Rerun the script to update them |
| Skills only agents load (principles, benchmark, maintain-verification, writing-for-agents, codebase-design) have `user-invocable: false` | Hidden from my `/` menu; agents still load them |
| `/no-comments` copied from pstack | I want a comment-stripping pass on a diff |
| A "How I work" section in `global/skills.md` (2026-10-15): plain answer first, "ship" is the go for the whole ship | The 10-15 audit: agents stopped mid-ship to ask and I typed `$bro` to read answers. This file says it, but no agent outside this repo reads it |
| Cloud threads run the whole task (2026-10-15): build, prove, PR, and when I ask, a `/devin` comment on the PR has Devin (GPT-6.1-Sol) test it on Linux, macOS or mobile emulators; the thread waits, fixes and retests. Windows checks stay on my machine | In T3 I pick the project, start a thread and choose the cloud; the thread does the rest. Cloud work goes through PRs, even in personal repos, because Devin tests PRs. Devin testing is manual for now; per-project automatic once a project has users |
| Repos work in megha cloud threads (2026-10-15): `cloud/session.sh` gives the VM my skills and rules; each repo's `scripts/cloud.mjs` runs it from a SessionStart hook | I want to send whole tasks, ship included, to the cloud. A bare cloud clone has none of my skills, and Claude doesn't see the repo's skills either |
| My InstaBox machine `t3` is a T3 machine next to Local (2026-10-21): T3's server runs there as a service, reached at its published port 3773, which wakes the machine from its idle pause. `cloud/box.sh` sets it up (repos in `~/dev`, skills, `BOX.md` rules). New threads in krida and the other cloud-ready projects go there; Windows is the last check, not the first. Every change there is a PR. The machine tests what it can itself; Devin tests only what it can't (Android, iOS, macOS for desktop apps that don't run on Linux), through ChatGPT so it runs GPT-6.1-Sol. No automatic PR review from Codex or Devin | The laptop was the bottleneck (keep-awake threads, RAM, slow worktrees), and megha's cloud threads lose T3's diff, preview and terminal. Free plan: 5 machines of 4 vCPU / 8 GB; test before upgrading. InstaBox SSH certs last an hour, so T3 doesn't connect over SSH |
| `/cloud` moves a thread to an InstaBox machine, or steers and checks threads there, through `scripts/cloud.mjs`; `delegating` holds the rules for subagents, threads, cloud threads and Devin (2026-10-22). No-regressions and "repo docs are for agents" are global rules, not BOX.md ones | T3 can't start a thread on another machine, so moving krida and likh took hand-made calls to the machine's T3 server. Standing instructions I had to send to every cloud thread belong in the rules they all read. The delegation rules come from my threads (stale bases, blocked waits, unchecked subagent claims, unrequested cloud work) and pstack's lighter orchestration ideas; its heavy machinery fails philosophy §5 |
| `bro` and `in-your-own-words` copied from pstack, user-only | I want to ask for a plain restatement, or for my goal played back |
| `sharpen`, `create-formal-verification-skill` and `maintain-formal-verification-skill` copied from pstack, user-only (2026-10-20) | I asked for pstack's new skills across my threads. User-only keeps their descriptions out of every session |

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
- Wrote a plan and reports for me as Markdown files. Anything I read is HTML (`html-artifacts`).
- Sent a local-only build (a skills viewer just for me) to a cloud thread I never asked for, then piled up workarounds to get it back. Work runs locally unless I say cloud.
- Filled an audit's suggestions with one project's bugs (krida, 2026-10-21). The audit ranks changes to the skills; a project's own problems get a line for a thread in that project.

## Projects the skills have been tested on

Audits from 2026-10-12 are in `reports/` (local only): krida, Studi/Inky (studi-2), kriyan. Their shared gaps are now the checklist in `skills/optimize/SKILL.md`. krida got the fixes; I'm redoing Studi and kriyan myself.
