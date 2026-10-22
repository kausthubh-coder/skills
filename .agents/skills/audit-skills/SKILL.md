---
name: audit-skills
description: "Audit how well my skills worked in my recent threads and update the skills dashboard. Use for /audit-skills, the scheduled audit, or when I ask how my skills or agents are doing."
---

# Audit my skills

Find out whether my skills did their job in my recent work, and what to change. The output feeds the dashboard in `dashboard/`. Read `docs/philosophy.md`, `docs/me.md` and `global/skills.md` first: they define "did its job".

## 1. Window and collector

- Window: from the last audit's `window.to` (newest `reports/audits/<date>.json`) to now. With no audit, the last 3 days. Write `window.to` as a UTC timestamp (`2026-10-15T23:25Z`), not a date, so the next run starts where this one stopped.
- `<today>` below is today's date. If `reports/audits/<today>.json` already exists, use `<today>b` (then `c`): it sorts as the newest, and the earlier audit stays.
- Run `bun dashboard/collect.ts`. It counts loads and flags candidate signals; it doesn't judge. Use its `reports/dashboard/data.json` to see which projects and threads were busy.

## 2. Read the threads

Every T3 thread with activity in the window, in every project (`t3_project_list`, then `t3_thread_list` with `settled` true and false). Also the Codex Desktop sessions T3 never sees (school work runs there): in `data.json` they're the `codex` sessions with no `threadId`; the reader opens their rollouts in `~/.codex/sessions` by `cwd` and judges only messages inside the window. Skip `eval: …` threads and the thread running this audit. Split them across parallel reader agents by project. Each reader reads all my messages, the agent's final answers, and the activity view for Skill calls, SKILL.md reads, checks run and whether the app was driven, then writes `reports/audits/raw/<batch>.json`:

```json
{"batch":"","window":{"from":"","to":""},
 "threads":[{"threadId":"","project":"","title":"","agent":"claude|codex","date":"","skills":[],"verdict":"good|mixed|bad","summary":""}],
 "signals":[{"kind":"frustration|praise|repeat|done_then_broken|missed_skill|correction","threadId":"","project":"","date":"","quote":"","context":"","skill":null}],
 "skills":[{"name":"","grade":"working|mixed|missed|not_needed","evidence":"","threadIds":[]}],
 "suggestions":[{"kind":"add|retire|fix-skill|agents-md|routing|project|upstream","title":"","why":"","impact":"high|med|low","evidence":[{"threadId":"","quote":""}]}]}
```

Only real signals: "this is stupid" about a bug isn't frustration at the agent. Quote me exactly. Include Critly: its two skills, and whether UI work ran `critly check` or `taste`.

Suggestions are changes to the library: global skills, routing, `global/skills.md`, this audit. A project's own bugs and gaps (its scripts, docs, project skills) aren't suggestions. Ask what library skill should have prevented them, and suggest that change if one exists. Otherwise they get a single line per project in the report, for a thread in that project.

## 3. Judge and write

1. Read every batch file yourself. Merge duplicate suggestions, drop weak ones, check the strongest claims against a thread, and rank them. Look at `reports/dashboard/decisions.json`: don't re-suggest what I skipped unless something new happened; carry out what I accepted since the last audit (each in its own commit, proven), and say what you did.
2. Write `reports/audits/raw/_meta.json`: `{"title": "<the verdict, at most 6 words>", "dek": "<one line, at most 14 words>", "headline": "<the answer as a sentence>", "summary": ["3-5 lines"], "suggestions": [<final ranked list, at most 8, each with a kebab-case "id" and a "short" of at most 6 words>]}`. The dashboard shows only `title`, `dek` and `short`; I don't read paragraphs there. Each evidence item is `{threadId, quote, context}`: a quote I can't place on its own needs the one-line context.
3. `bun dashboard/merge-audit.ts <today>` writes `reports/audits/<today>.json`. Then move `raw/` to `reports/audits/raw-<today>/`.
4. Write the report a person reads as an HTML page with `html-artifacts` (Report type): `reports/audits/<today>.html`.

## 4. The dashboard

- Open it in T3's preview (port 4791) and look at Overview and anything you changed. If it isn't already up, start the server detached so it outlives your turn: my accept and skip buttons live there, and a background command dies at the 2-hour limit (`Start-Process bun -ArgumentList server.ts -WorkingDirectory dashboard -WindowStyle Hidden`).
- You may change the site when something you found deserves a place (a view, a column, a chart). At most one addition per run, and remove a view nobody needs before adding one. Read `dashboard/AGENTS.md` first. `bun run typecheck` and a Critly check (`bun run lint:ui` in `dashboard/`) must pass, then commit.
- Never put quotes or data in committed files; they stay in `reports/`.

## 5. Report

End with a few lines: the headline, the top suggestions numbered (so I can also reply "accept 1 3, skip 2" in the thread; record those in `reports/dashboard/decisions.json`), what you changed, and anything you couldn't read.
