# Testing skills with real threads

A skill is only as good as what an agent actually does with it. Reading `SKILL.md` and judging it is not a test. Run it in a fresh T3 thread, play me, watch where it goes, and grade the result.

## Run a suite

1. **Pick scenarios** from `evals/scenarios.md`, or write new ones there first. A scenario has: the skill, the opening message, who I am in it (my answers to likely questions), and what a good run looks like.
2. **Launch one thread per scenario** with `t3_thread_launch`, all in parallel:
   - Skills that make a new project (`/init-project`): `scratch: true`. Put the eval constraints below at the top of `message`.
   - Skills that work on an existing repo (`/optimize`, `correct`, `create-verification-skill`): `projectId` of that repo with `workspaceStrategy: {type: "worktree", baseRef: "main", branch: "eval/<skill>-<date>"}`, so the real checkout is untouched.
   - Model: I use both Claude and Codex. Run each important scenario once on each (`orchestrator_capabilities` lists the model IDs). A skill that only works on one model is a finding.
   - Title: `eval: <skill> / <scenario>`.
3. **Play me.** When the thread asks something, answer the way the scenario and `docs/me.md` say I would: short, typos fine, no extra help. Use `t3_pending_request_respond` for question prompts and `t3_thread_send` for chat. Don't coach it toward the right answer; that hides the bug. If it asks something a good run wouldn't need to ask, answer it, then note that as a finding.
4. **Follow it** with `t3_thread_wait` (bounded timeouts) and `t3_thread_read`. Use `view: "activity"` to see tool calls, not just messages.
5. **Check the output yourself.** Open the files it made and run what it says works (`bun run check`, the dev server, the doctor). The thread saying "done" is a claim, not evidence.
6. **Grade** each run with the rubric below and write it up as an HTML page with `html-artifacts` (Report type) in `reports/evals/<date>-<skill>.html` (local only). For each finding, include a quote or `file:line` and a link to the thread (`[title](t3-thread://v1/<threadId>)`).
7. **Fix and rerun.** Change the skill for findings that repeat or matter, then rerun the scenarios that failed. Never call a fix done until a rerun proves it.
8. **Clean up.** Delete the scratch folders and eval worktrees and branches. Keep the threads; they're the evidence.

### Eval constraints (paste into every `/init-project` eval)

> This is a test run of a skill. Do everything the skill says, except: create the project in your current folder instead of `dev\` or `dev\sandbox\` (this overrides the skill's rule against scaffolding in `.t3\scratch`); don't create GitHub repos, T3 projects, Vercel projects or anything in the cloud; when you reach a step only I can do (signing in, keys), list it as the skill says and carry on with everything you can do without it.

## Trigger tests

Whether an agent picks a skill on its own is tested separately and cheaply. Use `evals/trigger/`, with cases in `cases.json` taken from real prompts. `node evals/trigger/run.mjs snapshot global` copies the skills Claude sees now into `variants/global` (gitignored). Copy that folder to make a variant: edit descriptions, drop skills, or add a `_CLAUDE.md` of always-loaded lines. Then run `node evals/trigger/run.mjs claude <variant> 3` or `node evals/trigger/run.mjs codex 2`. Rerun them after changing any description. The first results are in `reports/evals/2026-10-13-trigger.html`.

## Rubric

| Area | Good run |
|---|---|
| Trigger | The skill loaded when it should (and stayed quiet in "should not trigger" scenarios) |
| Steps | It did what the skill says, in order, without skipping steps |
| Questions | It asked only what changed what it built, with a recommended answer each time. It looked things up instead of asking |
| My setup | My stack, tiers, paths and git flow, with nothing extra added (`docs/me.md`) |
| Philosophy | The output follows `docs/philosophy.md`: verification exists and works, rules enforced by structure, feature folders, AGENTS.md a short map |
| Result | Works when you run it yourself. Checks pass, the app starts, the first feature exists |
| Honesty | The final report matches what you found. Skipped checks are named as skipped |
| Cost | Turns and time. Note anything that wasted many of either |

## Turning findings into changes

- Same failure in two or more runs, or on both models: change the skill.
- Fix the cause, not the symptom. If the agent skipped a step, ask why: was the step buried, vague, or in conflict with another line? Usually you rewrite or remove a line rather than adding a "MUST".
- Prefer shorter. If a fix makes the skill longer, see what you can cut.
- Re-read `docs/philosophy.md` §5: don't add procedures that make up for a weaker model.
- Record the finding, the change and the rerun result in the report.
