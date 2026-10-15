# skills

My personal skill library. One folder of skills, linked into Claude Code and Codex (CLI, app, and through T3 Code), plus a base `AGENTS.md` that new projects start from.

Lives at `dev/agent-skills` locally and [kausthubh-coder/skills](https://github.com/kausthubh-coder/skills) on GitHub.

A thread opened in this repo acts as the library's manager: `AGENTS.md` says how it tests skills in real threads and improves them. The thinking behind the skills is in `docs/philosophy.md`.

## Layout

| Path | What |
|---|---|
| `skills/` | Global skills. Each folder is linked into every agent, so an edit here is live everywhere |
| `skills/init-project/` | `/init-project`: start a new project (interview, name, scaffold on my stack, agent-native setup) |
| `skills/optimize/` | `/optimize`: audit an existing project and plan agent-native improvements at a chosen depth |
| `skills/init-project/references/AGENTS.base.md` | The base AGENTS.md every project starts from |
| `skills/create-project-flows/` | Writes a project's own `worktree-<app>` and `ship-<app>` skills |
| `dashboard/` | Skills dashboard: a small React site over my Claude Code, Codex and T3 history (T3 action "Dashboard", port 4791). Data stays in `reports/` |
| `.agents/skills/audit-skills/` | The audit that reads my threads every 48 hours (T3 scheduled task) and feeds the dashboard |
| `global/skills.md` | Short "load this skill when…" list, plus where my code lives, that `link.mjs` writes into `~/.claude/CLAUDE.md` and `~/.codex/AGENTS.md`. Agents skip skills they only see in the skill list (`reports/evals/2026-10-13-trigger.md`) |
| `skills/my-skills/` | Lets any agent add, edit or update skills in this library |
| `AGENTS.md`, `docs/` | The manager's brief, my philosophy, my setup and decisions, how skills are tested |
| `evals/scenarios.md` | Scenarios for testing skills in real threads |
| `sources.json` | Where each copied skill came from, its license, upstream commit, and what I changed. `local` lists my own repos whose skills are linked from their checkout |
| `CATALOG.md` | Every skill I looked at from pstack, Matt Pocock, Ras Mic and T3 Code, with a verdict |
| `scripts/link.mjs` | Links `skills/*` and each `local` repo's skills into each agent's global folder |
| `scripts/upstream.mjs` | Checks upstream repos for changes to adopted skills |
| `scripts/park.mjs` | Copies the vendor skills under `parked` in `sources.json` (Convex, Vercel, Cloudflare) into `~/.skills-parked/`, where no agent lists them; `global/skills.md` routes to them |
| `cloud/` | What a cloud session (megha: Claude Code on the web, Codex Cloud) runs first: `session.sh` clones this library and Critly, links their skills and writes my global rules; `CLOUD.md` is the cloud note added to those rules, including how a cloud thread asks Devin to test its PR (`devin-test.md`). Each repo calls it from `scripts/cloud.mjs` (`create-project-flows` §6) |
| `reports/` | Agent-native audits of my projects (local only, gitignored) |
| `licenses/` | Upstream licenses (MIT requires keeping them) |
| `_sources/` | Local clones of the upstream repos (gitignored) |
| `_retired/` | Skills I stopped using, kept for reference and not linked. Includes `oracle`, which this repo used to hold |

## Critly

`critly` and `critly-audit` belong to Critly (`dev/critly`, repo `kausthubh-coder/critly`), which generates them from its concepts with `bun run build:skill`. `sources.json` lists that folder under `local`, so `link.mjs` links them straight from the checkout: a rebuild there is live in every agent. Don't install them with `npx skills add` on this machine; that would put a second copy in the way.

## Global vs project skills

- **Global** (this library): skills I want in every project. Keep the list short; every skill's description is in context in every session.
- **Project**: skills for one repo (`verify-<app>`, deploy steps) live in that repo's `.agents/skills/`, with `.claude/skills` linked to it. `/init-project` sets this up for new projects; `/optimize` adds it to existing ones.

Where each agent reads skills:

| Agent | Global | Project |
|---|---|---|
| Claude Code | `~/.claude/skills` | `.claude/skills` |
| Codex | `~/.agents/skills` | `.agents/skills` |

## Use it

```
node scripts/link.mjs --dry-run   # see what would be linked
node scripts/link.mjs             # link new skills, prune deleted ones, sync global/skills.md
node scripts/link.mjs --unlink    # remove every link to this library
node scripts/upstream.mjs         # check upstream for changes
node scripts/park.mjs             # update the parked vendor skills
```

Links are junctions on Windows (no admin needed). The script never overwrites an existing folder; it reports a conflict instead.

## Notes

- `LICENSE` (MIT) covers my own skills. Copied skills keep their upstream license, listed in `sources.json`: pstack and Matt Pocock are MIT (notices in `licenses/`); `before-and-after` is PolyForm Shield.
- This folder is in OneDrive. If agents ever can't read a skill, mark the folder "Always keep on this device".
