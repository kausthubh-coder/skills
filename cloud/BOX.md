# You're on my cloud machine

You run in T3 Code on my InstaBox machine: Debian Linux, 4 vCPU, 8 GB, not my Windows laptop. T3 works as it does locally: its tools, terminal, browser tabs and diff panel all see this machine. I start threads here so the work keeps going while my laptop sleeps.

- Repos are in `~/dev/<repo>`. The Windows paths above (`C:\Users\...`, `~/.skills-parked`) are on my laptop and don't exist here. The parked vendor skills (Convex, Vercel, Cloudflare, Clerk, HyperFrames) aren't here either, so use the vendor's docs.
- Every thread on this machine shares the 8 GB. Stop the dev servers, backends and browsers you start before you end your turn. A Linux server you start through a shell outlives a plain kill, so start it in its own process group and stop the group.
- The machine pauses after 30 minutes with no agent working, no terminal use and little CPU. A paused machine keeps its memory and processes. Never end a turn to wait for CI, a deploy or Devin: wait inside the turn, or the work stops reaching my thread.
- **Every change goes through a PR here, in every repo**, even ones that push straight to `main` from my laptop. Open it with `gh`, which is signed in as me and works normally. Don't merge until I say ship; then follow `ship-<app>`. Push after every unit of work worth keeping: commits that exist only on this machine are lost if it's reset.
- **Test everything you can here first**, with the repo's `verify-<app>` skill: web apps in T3's browser tabs or Playwright, CLIs, backends, tests. A desktop app that runs on Linux can run on the machine's desktop (`DISPLAY=:1`).
- **Devin tests only what this machine can't**, when the change touches what a user sees or does. A build passing in CI isn't that test; Devin running the app is. There's no KVM here, so that means:
  - phones (a mobile app, or a web app in a phone's browser): `the Android emulator` and `the iOS Simulator`;
  - desktop apps that don't run on Linux (likh, krida desktop): `macOS`.

  Start it with the `devin` MCP tools: `devin_session_create` with the prompt in `~/.cloud/agent-skills/cloud/devin-test.md`, the PR's repo, and the platform (macOS for the iOS Simulator and desktop apps). Every minute a Devin machine works comes out of my daily Devin quota, which my ChatGPT plan doesn't cover. On Oct 21, eight test sessions in 90 minutes used up the whole day and four stopped halfway with `out_of_quota`. So watch the session instead of just waiting for it:
  - Wait in this turn with `devin_session_gather` in 5-minute slices (`timeout_seconds` 300). After each slice, read its latest messages (`devin_session_interact` `get_messages`) and decide. If it asks something, answer it. If it's testing the wrong thing, or has been stuck on the same step for 10 minutes, message it to correct course, or `terminate` it and report what blocked it.
  - Once it posts its verdict, read it and send the session to `sleep`.
  - On FAIL, retest only after you fix a bug in your own code: push to the same branch and message the same session, at most three rounds. A failure caused by Devin's machine (no microphone, a missing login) won't pass on a retest. Put that step on my list instead.
  - On `out_of_quota`, stop. Don't start more Devin sessions today; report what went untested.

  Report the verdict and the recording link. If Devin never answers, say so; don't merge on silence. If the `devin` tools are missing, post the prompt as a `/devin` PR comment instead and poll the comments.
- Windows is the last check, not the first. When a change needs Windows (the likh app, krida's desktop player, Studi's nightly profile, the Loka browser build, my Pixel), finish everything else, then list that step in your report for me to run on my laptop.
