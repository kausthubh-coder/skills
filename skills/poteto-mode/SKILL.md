---
name: poteto-mode
description: Poteto's pstack engineering style and task playbooks. Run /poteto-mode with a task.
disable-model-invocation: true
---

# Poteto mode

Read [the full upstream skill](references/pstack/skills/poteto-mode/REFERENCE.md), then follow its matching playbook. The upstream skills, playbooks, agents and guide are bundled at `references/pstack/`. Load only the files the task needs.

This is a pinned copy of Lauren Tan's pstack, with an adapter for my Claude Code, Codex and T3 sessions. Apply the adapter below throughout the run, including in delegates. My session instructions, repo rules and existing authorization take precedence over the upstream defaults.

## Find the bundled files

Resolve upstream paths from the upstream file you are reading. A named pstack skill means `references/pstack/skills/<name>/REFERENCE.md`, read directly as a file. Bundled `SKILL.md` files are renamed to `REFERENCE.md` so agents do not discover them as separate global skills. When an upstream instruction or local link points to a bundled `SKILL.md`, read `REFERENCE.md` in that folder instead. Files the playbooks create in a project still use `SKILL.md`. These dependencies need no catalog entry or separate installation. Keep my existing global skills intact.

For a `poteto-agent`, read `references/pstack/agents/poteto-agent.md` and include this wrapper's absolute path and the upstream skill's absolute path in its brief. The delegate reads both. The parent owns the playbook.

## Use this session's tools

| Upstream instruction | In this session |
|---|---|
| `Task`, `poteto-agent`, `comment-sicko` | Read my `delegating` skill. Use the session's native subagent or T3 `delegate_task` as its instructions require. A bundled agent file supplies the brief, not a registered agent type. |
| Cursor model slugs and `setup-pstack` | Inherit the session model and settings by default. Honor explicit user choices through the available provider catalog. Report an unavailable requested model without silently replacing it. Do not create Cursor model rules. |
| Todo list | Use the session's plan tool, or keep a short checklist when it has none. |
| `AskQuestion` | Use the session's question tool when needed. Observe facts with tools before asking me. |
| Cursor's built-in `create-skill` | Read my `writing-for-agents` and `my-skills` skills. |
| `deslop`, `control-ui`, `control-cli` | Use an installed matching skill if available. Otherwise review the actual diff or drive the real UI or CLI with available tools. State any check you could not run. |
| `.cursor/skills/` and Cursor rules | Project skills go in `.agents/skills/`, with `.claude/skills` linked to it. Follow the repo's instruction-file conventions. |
| Cursor transcript lookup | Use `codex-threads` for Codex history and `threads` for T3 history. Read the actual thread before reporting it. |
| PR watchers, loops and wakeups | Follow the session's T3 PR watch and delegate completion tools. Never start an upstream watcher when T3 owns the wait. |
| Cursor Automations, cloud agents or Bugbot controls | Use an available equivalent only within the task's authorization. Report an unsupported step. If it is essential to the requested outcome, report the blocker. |

Use my project `worktree-<app>`, `verify-<app>` and `ship-<app>` skills for setup, proof and delivery. My stack and Git conventions come from the repo and my global instructions. Follow the task's scope for commits, pushes, deploys and messages to other people.

The upstream [Claude Code adapter](references/pstack/docs/harness/claude-code.md) is additional reference. This wrapper's mappings apply to the copied library, which is not installed as a Claude plugin. Invoke this entry as `/poteto-mode` in Claude Code or `$poteto-mode` in Codex.
