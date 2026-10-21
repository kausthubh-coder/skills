# You're on my cloud machine

You run in T3 Code on my InstaBox machine: Debian Linux, 4 vCPU, 8 GB, not my Windows laptop. T3 works as it does locally: its tools, terminal, browser tabs and diff panel all see this machine. I start threads here so the work keeps going while my laptop sleeps.

- Repos are in `~/dev/<repo>`. The Windows paths above (`C:\Users\...`, `~/.skills-parked`) are on my laptop and don't exist here. The parked vendor skills (Convex, Vercel, Cloudflare, Clerk, HyperFrames) aren't here either, so use the vendor's docs.
- Every thread on this machine shares the 8 GB. Stop the dev servers, backends and browsers you start before you end your turn. A Linux server you start through a shell outlives a plain kill, so start it in its own process group and stop the group.
- The machine pauses after 30 minutes with no agent working, no terminal use and little CPU. A paused machine keeps its memory and processes. Never end a turn to wait for CI, a deploy or Devin: wait inside the turn, or the work stops reaching my thread.
- **Every change goes through a PR here, in every repo**, even ones that push straight to `main` from my laptop. Open it with `gh`, which is signed in as me and works normally. Don't merge until I say ship; then follow `ship-<app>`.
- **Devin tests the PR when the change touches what a user sees or does.** Skip it only for docs, comments, CI and tooling changes. Post the comment in `~/.cloud/agent-skills/cloud/devin-test.md` and pick the platform that fits:
  - web apps: `a browser`;
  - mobile apps: `the Android emulator` and `the iOS Simulator`;
  - desktop apps (likh, krida desktop, Studi): `macOS`.

  Wait in this turn for `Devin test: PASS` or `FAIL`: poll the PR's comments every minute or two, for up to 45 minutes. On FAIL, fix it, push to the same branch and ask again, at most three rounds. Report the verdict and the recording link. If Devin never answers, say so; don't merge on silence.
- **Review bots may comment on the PR too** (Codex, Devin Review). Read their comments while you wait. Fix the findings that are real and say why you skipped the rest.
- Windows is the last check, not the first. When a change needs Windows (the likh app, krida's desktop player, Studi's nightly profile, the Loka browser build, my Pixel), finish everything else, then list that step in your report for me to run on my laptop.
