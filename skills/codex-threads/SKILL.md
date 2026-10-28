---
name: codex-threads
description: Read my Codex app threads and projects: list, search and open past threads and the files they touched. Use when I ask about a Codex thread or project, or what I did in the ChatGPT/Codex app.
---

# My Codex threads and projects

The Codex desktop app (the ChatGPT app's Codex side) keeps everything locally in `~/.codex`. `codex.mjs` next to this file reads it **read-only**; the app holds these databases open, so never write to them.

```
node <this folder>/codex.mjs projects                          # projects, their folders, thread counts
node <this folder>/codex.mjs threads [--project school] [--cwd <path>] [--since 7d] [--archived] [--all] [--limit 30]
node <this folder>/codex.mjs search "<text>" [--project inky] [--since 30d]   # titles, my messages, Codex replies
node <this folder>/codex.mjs read <id | id prefix | title words> [--last 3] [--tools] [--full]
node <this folder>/codex.mjs files <id>                        # files it changed, files I attached, images, outputs folder
```

- `threads` hides subagent and guardian-review threads; `--all` shows them. The `via` column says where a thread ran: `app` (Codex app), `t3` (T3 Code with a Codex model), `exec` (`codex exec`).
- `read` prints my messages and Codex's final replies. `--full` adds its progress updates, `--tools` one line per command, file edit, MCP call and web search. Long threads: start with `--last 3`.
- When a title matches several threads, `read` lists them; rerun with the id.
- Search is a plain substring match, case-insensitive, about a second over the whole history. Try a second wording before saying a thread doesn't exist.

## Files

A project is a set of normal folders on disk (`projects` prints them); read them with your usual tools. A thread outside a project worked in `~/Documents/Codex/<date>/<slug>/`, which is its `cwd`. Generated images are in `~/.codex/generated_images/<thread id>/`. `files` marks a path `(gone)` when it no longer exists.

## Where things live

For a question the script doesn't answer, query the source read-only (`sqlite3 "file:<path>?mode=ro"` or `node:sqlite` with `readOnly: true`):

| What | Where |
|---|---|
| Threads: title, cwd, model, branch, archived, rollout path | `state_5.sqlite` → `threads`; subagents in `thread_spawn_edges` |
| Every message and tool call, in order | `thread_history_1.sqlite` → `thread_items` (`item_type`, `item_json`), by `thread_id`, `rollout_ordinal` |
| Projects and which thread belongs to which | `.codex-global-state.json` → `local-projects`, `thread-project-assignments` (others match by `cwd`) |
| Older and subagent threads missing from the history DB | rollout files under `sessions/` and `archived_sessions/`, `.jsonl` or `.jsonl.zst` |

Plain ChatGPT chats and ChatGPT Pages live in OpenAI's cloud, not here. On the Mac mini the script reads the Mac's own `~/.codex`; to look at Mac threads from the laptop, run it there through the `threads` skill.
