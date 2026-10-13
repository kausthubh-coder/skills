# Plan: skills dashboard and automated audit

Status: plan, waiting for my go.

## What it's for

One place to see whether my skills are working: how often each one loads, where it should have loaded and didn't, how I reacted (mad, "good job", repeating myself), and what to change. A scheduled audit reads my threads every two days and fills it in. It covers my library skills and Critly's (`critly`, `critly-audit`, plus `critly check` and `taste` runs), across krida, kriyan, likh, Critly, Studi and this repo.

## Three pieces

1. **Collector** (`scripts/collect.mjs`, no AI, runs in seconds). It reads three sources:
   - Claude Code sessions (`~/.claude/projects/**/*.jsonl`)
   - Codex sessions (`~/.codex/sessions/**`)
   - T3's thread list (`~/.t3/userdata/statev2.sqlite`, read-only), to map each session to its thread, title and project through the worktree path

   It writes `reports/dashboard/data.json` and only reads what changed since the last run. For each session it records:
   - **Skill loads** and how each happened: the Skill tool, a SKILL.md read, `/name` typed, or `$name` mentioned. Also the Critly check and taste commands.
   - **Misses:** a `global/skills.md` condition matched but the skill never loaded. Examples: a bug report with no `diagnosing-bugs`, `gh pr create` with no `unslop`, "done" with no verify skill run.
   - **Signals in my messages**, found with a word list:
     - frustration ("wtf", "stupid", "still not", "i said", "why did you")
     - praise ("good job", "nice", "perfect", "love it")
     - corrections
     - "it's still broken" right after the agent said done
     - the same instruction given twice, in one thread or across a project's threads
2. **Audit run** (AI, every 2 days). It's a project skill in this repo, `.agents/skills/audit-skills/`, not a global one. It:
   - runs the collector, then judges only what's new since the last audit (GPT subagents for the bulk classification, the main agent for the verdicts)
   - confirms real frustration, real misses and real repeats
   - grades each skill that was used
   - turns repeats into rule candidates for `/correct`
   - reruns `evals/trigger` when a description or `global/skills.md` changed
   - writes `reports/audits/<date>.json` and `.md` with ranked recommendations

   It proposes. It never edits a skill without my OK.
3. **Dashboard** (`dashboard/`). `bun run dashboard` serves a small page from the data on a free port. Bun's built-in server with React, no framework, because it's one page for one person. It opens in a browser or T3's preview.

## Dashboard views

Feel: a tool I scan once every day or two, so it's compact and quiet. One accent for "needs me", and green, amber and red only when they mean something. Tabular numbers, desktop first.

- **Overview.** What leads is "needs your decision": open recommendations from the last audit. Below that:
  - loads and misses per day (Claude and Codex)
  - frustration against praise over time
  - the last audit's summary
- **Skills.** One row per skill: loads (auto, typed, via the routing block), misses, my reactions after it loaded, last used, and a flag for skills with no use in 14 days (retire candidates). A row opens the skill's timeline, quotes from misses and wins, thread links, and its grades over time.
- **Signals.** A feed of frustration, praise and "still broken" quotes with the project, thread, and what was or wasn't loaded. Repeated instructions are grouped, each with a "make it a rule" note for `/correct`.
- **Projects.** Per repo:
  - threads, frustration rate, praise rate
  - whether `main` has `worktree-<app>`, `ship-<app>` and `verify-<app>`
  - doctor and setup runs and their failures
- **Audits.** Every run with its recommendations and their status: open, accepted, done or rejected.
- **Trigger tests.** The latest `evals/trigger` results as a skill-by-case grid.

Build and finish it with the Critly skill: `.critly/policy.json`, `lint:ui` at exit 0, a taste pass on every view, and dark mode. Charts follow the `dataviz` skill.

## Privacy

This repo is public. The data, audits and quotes live under `reports/` (gitignored). Only code and the skill are committed.

## Schedule

T3 `schedule_task` every 48 hours in this project, a fresh thread per run (so each audit's thread is its own record). It runs on the main checkout: this repo doesn't need worktrees (I'm switching its threads to local).

## Order of work

1. Collector and data model. Check its counts against what I found by hand on 2026-10-13: about 60 self-picked skill loads in about 213 sessions, and zero for `diagnosing-bugs` before the routing block.
2. Dashboard: Overview, Skills and Signals, passing the Critly check and the taste pass.
3. `audit-skills` skill and one manual run. Read its output against a couple of threads I know.
4. Schedule it.
5. Projects, Audits and Trigger tests views, and tracking recommendation status.

## Open choices (defaults in bold)

- Cadence: **every 2 days** / daily / every 3 days.
- Who judges: **Claude for verdicts, GPT subagents for bulk classification** / all Claude / all GPT.
- Accepting a recommendation: **I tell the audit thread** / a button in the dashboard that opens a T3 thread to do it (later).
