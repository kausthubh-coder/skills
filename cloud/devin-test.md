# Devin: test a pull request

The PR comment a cloud thread posts to have Devin test its PR (see `CLOUD.md`). A comment starting with `/devin` starts a Devin session on that PR; it posts under my GitHub account, which Devin needs. Fill the `{…}` parts.

```text
/devin You are the tester for this PR. Never push, commit or edit it.

1. Check out this PR's branch. Set up the repo the way AGENTS.md says, then follow its verify-<app> skill in .agents/skills/ for what this PR changes: {what_changed}.
2. Test it like a user on {platform}, including the cases most likely to break, and record it.
3. Reply on this PR with one comment. First line exactly `Devin test: PASS` or `Devin test: FAIL`. Then, short: what you tested and on what, what you saw, and for each failure the steps to reproduce it and what you expected. End with links to the recording and your session.
4. If you couldn't run something (setup broke, a login you don't have), say what's missing and mark it FAIL.
5. Stop once the comment is posted. Don't keep exploring: every minute you work uses my quota.
```

Platforms: `a browser` (Linux), `the Android emulator` (Linux; the repo's `.devin/blueprint.yaml` installs it), `the iOS Simulator` or `macOS`. Never Windows: those checks are mine.
