# Devin: test a pull request

The prompt `/cloud-pr` sends to Devin to test a PR that a Claude cloud thread opened. Fill the `{…}` parts. Keep it in sync with `skills/cloud-pr/SKILL.md`.

```text
Test pull request {pr_url} on {platform}. You are the tester: never push, never commit, never edit the PR.

1. Check out the PR's branch. Set up the repo the way its AGENTS.md says, then follow its verify-<app> skill in .agents/skills/ for the features this PR changes: {what_changed}.
2. Drive them like a user would on {platform}, including the cases most likely to break. Record the test.
3. Post one comment on the PR. First line exactly `Devin test: PASS` or `Devin test: FAIL`. Then, short: what you tested and on what, what you saw, and for each failure the steps to reproduce it and what you expected. End with links to the recording and this session.
4. If you couldn't run something (setup broke, a login you don't have), say so in the comment and mark it FAIL, with what's missing.
```

Platforms: `browser` (Linux, Chrome), `Android emulator` (Linux; the repo's `.devin/blueprint.yaml` installs it), `iOS Simulator` or `macOS` (macOS VM). Windows is never Devin's job; `/cloud-pr` runs those checks on my machine.
