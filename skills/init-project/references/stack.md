# My stack

| Need | Use |
|---|---|
| Runtime and package manager | bun (`bun`, `bunx`, never npm/npx) |
| Web app | Next.js |
| Backend, database, realtime | Convex |
| Auth | Clerk |
| Hosting | Vercel |

Everything else (styling, UI libraries, desktop, mobile, CLI) is decided per project in the interview. Pick what the project needs and keep it boring and popular.

## Set up from day one

Every one of my older projects hit these, so new ones start with them:

- `.gitattributes` with `* text=auto eol=lf`, so agents on Windows don't rewrite line endings across files they didn't change.
- Dev port from the `PORT` env var (Next.js reads it), so parallel worktrees don't collide.
- `scripts/setup.mjs` for a fresh worktree: `bun install`, copy `.env.local` from the main checkout (`git rev-parse --git-common-dir`), pick a free port. Register it as T3 Code's worktree-create script.
- `scripts/doctor.mjs` (`bun run doctor`): deps match the lockfile, env points at a dev backend not prod, port free, Convex reachable, Clerk keys present, how far behind `origin/main`. Agents run it before trusting a failure.
- A Convex backend per worktree (`bunx convex dev --local`) or per-branch previews, so worktrees don't overwrite each other's functions.
- Scripts: `dev`, `build`, `lint`, `typecheck`, `test`, `check` (the same steps CI runs), `doctor`, `setup`.
- Test files found by glob, never hand-listed.
- Run `bunx convex ai-files install` after Convex setup for the Convex guidelines.
