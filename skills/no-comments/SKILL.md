---
name: no-comments
description: "Strip needless comments from a diff with a fresh comment-hating reviewer, then fix what they were hiding. Use for /no-comments."
disable-model-invocation: true
---

# No comments

Send a fresh reviewer, Comment Sicko, over the code. Act on what it finds.

Defer to its fresh perspective.

## Scope

Use the files or diff I name. Otherwise use the current diff against the base branch (default `main`), including the working tree.

## Steps

1. Spawn one subagent whose instructions are [references/comment-sicko.md](references/comment-sicko.md), word for word, plus the scope. Claude Code: the Agent tool. Codex: a subagent, or a fresh pass of your own with only that file and the scope in mind. Don't restate its rules.
2. Check its report and diff. Reject:
   - edits to application code
   - edits outside the scope
   - deletions the exception list protects
   - a misstated `MUST KILL` reason
   - flags that treat intentional code we keep as guilty

   Reshape flags on our own code's surprises stay actionable; don't restore those comments. A keep survives only with proof it's about something we can't change. Restore a deletion only when an exact exception covers it and you can prove it in scope.

   Audit scoped lint and TypeScript suppressions it missed; suppressions guarding correctness or safety are `MUST KILL`. Before accepting a thin `IMPORTANT` or `do not remove` kill or keep, read the code around the symbol and its history (`git log -L` or `git blame`) to learn why it's there. An ambiguous kill stays deleted. A refuted or still-ambiguous keep gets deleted.

   If you reject a report, revert it and rerun once with the failure named. A second rejection: report it open and stop.
3. Fix trivial accepted flags directly: delete the dead path, drop the parameter, use the real API. If a fix needs a new shape, sketch it in a few lines for the whole accepted set and stop for my OK before building it.
4. Implement the smallest root-cause fix in scope and remove every named workaround. If the root cause is out of scope, land the smallest in-scope fix and report the rest as open. Never bolt on symptom guards.
5. Constraint comments ("do not remove", "do not change wording", "talk to X before changing"):
   - Keep the ones about things we can't change.
   - For the rest, offer the cheapest in-scope type, runtime check, test or lint that enforces it, and wait for my OK. In an unattended run or an eval, encode only what I approved up front. If I approve, encode it, then delete the comment.
   - Otherwise delete the comment, report the constraint as open, and sketch the out-of-scope work.
6. Report in a few lines:
   - comments deleted, and any restored
   - reruns
   - the sketch, if there was one
   - fixes made
   - checks offered and checks added
   - constraints left unenforced, and other open work
