---
name: init-project
description: Start a brand-new project from scratch - interview me about what it is and who it's for, help pick a name, scaffold it on my stack (bun, Next.js, Convex, Clerk, Vercel) in sandbox or dev, and set it up agent-native (AGENTS.md, vertical slices, project skills, verification). Use for /init-project or "start a new project". For an existing repo use /optimize.
disable-model-invocation: true
---

# Init project

Create a new project with me, end to end. Interview first, build second. Nothing gets created until the interview is done and I've confirmed the summary.

## 0. Where you're starting from

My code lives in OneDrive:

```
C:\Users\kaust\OneDrive\Documents\dev\
  <name>\          personal and public projects, one git repo each
  sandbox\         experiments; sandbox\AGENTS.md has its rules and how promotion works
    <name>\
```

I almost never have a folder yet when I run this. I start thinking or researching an idea in a T3 "No project" thread (its folder is a throwaway `C:\Users\kaust\.t3\scratch\<date-slug>\`) or in the sandbox project (`dev\sandbox`), and run `/init-project` in that same thread once the idea firms up.

- The folder you're in is not the project. Never scaffold into `.t3\scratch`, `.t3\projects` or the sandbox root. The project goes where its tier says (step 1), and you create that folder in step 3.
- Read the thread so far and the current folder first. Research, notes, a name idea or decisions already made are interview answers; don't ask them again. Copy notes worth keeping into the new project's `docs/`.
- If the idea already has a folder in `dev\sandbox\`, build on it: keep it there for an experiment, or promote it to `dev\` (steps in `sandbox\AGENTS.md`) for personal and public. Don't start a second folder for the same idea.

## 1. Interview

Use the `grilling` skill's format: rounds of numbered questions, each with your recommended answer, worded so "yes" accepts it. Ask only what changes what you build. Look up facts yourself (folders, GitHub, npm).

Round 1, always:

- **What is it?** One or two sentences, and the one thing it must do well.
- **Who is it for?** This sets the tier, which sets everything else:

  | Tier | Who | Where it lives | Rigor | Git |
  |---|---|---|---|---|
  | experiment | just me, testing an idea | `dev\sandbox\<name>` | README, short AGENTS.md, no CI | commit to `main` |
  | personal | me and a few friends | `dev\<name>`, private GitHub repo | + verify skill, tests on core logic, deployed | worktree branches merge straight into `main`, no PRs |
  | public | other people use it, or it's published / open source | `dev\<name>`, GitHub repo | + LICENSE, stricter lint, error tracking | PRs with CI before `main` |

- **Surface:** web app, desktop app, CLI, library, or several.

Later rounds, only what the answers so far leave open: backend and data, accounts and auth, AI features, payments, anything deployed or scheduled. Then the name (step 2).

End with a one-screen summary (name, tier, location, stack, first feature) and wait for my yes.

## 2. Name

Read [references/naming.md](references/naming.md). Offer 5-8 candidates. Check each before offering it:

- No folder with that name in `C:\Users\kaust\OneDrive\Documents\dev` or `dev\sandbox`.
- `gh repo view kausthubh-coder/<name>` fails (name is free on my GitHub).
- For public projects: `npm view <name>` fails if it will ship as a package, and say whether `<name>.vercel.app` looks taken (open it).

## 3. Scaffold

Read [references/stack.md](references/stack.md). Use the official generators and CLIs (`bun create next-app`, `bunx convex dev`, the `clerk-setup` skill in `~/.skills-parked/clerk-setup/`), not hand-written config. Use bun everywhere, never npm or npx.

Steps only I can do (signing in to Convex, Clerk keys, linking Vercel, creating the GitHub repo) are mine: list them as one numbered checklist with exact commands and links, do everything around them, and continue when I say they're done. Don't stall the rest of setup waiting on them.

## 4. Agent-native structure

- Lay out code by feature, following [references/layout.md](references/layout.md). The first feature gets its own folder from day one.
- Write `AGENTS.md` from [references/AGENTS.base.md](references/AGENTS.base.md). Fill every `{{...}}` from what you just built; delete sections that don't apply yet. Keep it under about 100 lines.
- `CLAUDE.md` is one line: `@AGENTS.md`.
- Project skills go in `.agents/skills/`. Link `.claude/skills` to it so Claude Code and Codex read the same folder. On Windows: `New-Item -ItemType Junction -Path .claude\skills -Target .agents\skills` (a junction needs no admin rights).
- Lint, strict types, and a test runner with one real behavior test, so `bun run check` works from the first commit. Add the day-one items from `stack.md` (`.gitattributes`, `PORT`, setup and doctor scripts).
- Run `create-project-flows` to write `worktree-<name>` and `ship-<name>` (experiments can skip ship). Personal and public tiers: register the project in T3 Code (`t3_project_create` if available), and set setup as its worktree-create script the way that skill says. `t3_project_update` scripts are silently ignored.

## 5. Verification

Once the app runs and shows its first real screen, run `create-verification-skill` to write `.agents/skills/verify-<name>/`. Experiments can skip this; personal and public can't. Tell me to run `maintain-verification-skill` after big feature changes.

## 6. Finish

- `git init` and make the first commit on `main`. Ask before creating the GitHub repo; after that, follow the tier's git flow.
- Experiments: add the folder to "What's here now" in `dev\sandbox\AGENTS.md`.
- This thread is still bound to the folder it started in, so use absolute paths into the new project. For personal and public, tell me to open new threads in its T3 project from now on.
- Reply with: what exists, how to run it, my remaining checklist items, and the first three features you'd build next.
