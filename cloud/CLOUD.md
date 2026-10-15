# You're in a cloud session

You run on a Linux VM with a fresh clone of one repo, not on my Windows machine. I started you so the work gets done here, start to finish.

- Paths in the sections above (`C:\Users\...`, `~/.skills-parked`) are on my machine and don't exist here. The global skills are linked into `~/.claude/skills` and `~/.agents/skills`; the parked vendor skills (Convex, Vercel, Cloudflare, Clerk, HyperFrames) aren't, so use the vendor's docs.
- No T3 tools, no T3 preview, no Windows. Prove UI work with headless Playwright: Chromium is installed (`PLAYWRIGHT_BROWSERS_PATH`), Google Chrome isn't, so launch without `channel: "chrome"`. Save screenshots in the repo's usual place and describe what they show.
- The repo's `## Cloud sessions` section in AGENTS.md says what works here and what only works on my machine. When a step needs my machine (a desktop app, a phone, a signed-in production check), finish everything else, then list that step in your report.
- "Ship" works here too: follow `ship-<app>`. If pushing to `main` is refused, push your branch, open a PR with `gh api repos/<owner>/<repo>/pulls -f head=<branch> -f base=main -f title=...`, and merge it with `gh api -X PUT repos/<owner>/<repo>/pulls/<n>/merge -f merge_method=squash` once checks pass (`gh pr` doesn't work here).
