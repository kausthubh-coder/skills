# Page types

Each type answers a different question. The parts below are roles, not a layout: cut any part that has nothing true to say, and on the page each heading states its section's point in 6 words or fewer.

Every type opens the same way. **The first screen**: the h1 (the answer, 8 words at most), a line under it if the answer needs a condition, the evidence that proves it, and the asks. The evidence takes whatever form the content has: two to four numbers when numbers are the point, a before/after, one figure, or a short table. A row of big numbers is not the default. Every type folds the same things: reasoning, quotes, logs, file lists and long output go in `<details>` with a summary that says what's inside. The visible page is about 350 words; only teach pages run longer.

## Report: "what did you do, and can I trust it?"

The reader was not there. They want the outcome, enough evidence to believe it, and what's left for them.

1. **First screen.** h1 = the outcome ("Imports no longer duplicate rows"). A status word: done, partly done or blocked. The two to four facts that prove it. Asks, if any, with a count of how many need the reader's judgment.
2. **What changed, by behavior.** What a user or caller now sees, not which files moved: a before/after, a flow with the changed step marked, or one row per behavior.
3. **Evidence.** A table: claim, how you checked it, result (verified, inferred or not checked). The command output folds under it. One honest "not checked" row says more than a column of passes.
4. **Where you deviated from the plan or the ask**, one line each, with why.
5. **Risks and what's left.** One line each, with what you'll do about it.
6. **Folded:** decisions a reviewer might question (each with the alternative you rejected), the file list, logs.

A report that says "all checks pass" names the checks, and names the skipped ones too. For a change the reader must review before merging, two or three questions at the end ("what happens now when an import is retried?") with answers folded tell them whether they understood it.

## Plan: "what will you do, and should I say yes?"

The reader is approving. Make the decision easy and the scope impossible to misread.

1. **First screen.** h1 = the proposal ("Move auth to Clerk in three steps"). The phases as a flow, or the numbers that justify it. Asks: approve, choose, or numbered questions they can answer by number.
2. **Decisions first.** The two to five choices the reader is most likely to change, each with your default and the alternative, so "no changes" is a complete answer. Mechanical steps they'll trust you on go last.
3. **Done when.** Two to four checkable lines.
4. **The approach.** Numbered steps; each is one line saying what it produces and how you'll know it worked.
5. **Options**, only if there was a real choice (including doing nothing): a table with the pick marked. The reasoning folds under it.
6. **Scope.** In and out side by side. Non-goals ("things that could be goals but aren't") prevent the "I thought you were also…" conversation.
7. **Risks**, found by a premortem (assume it shipped and failed; list why). One line each, with the response. Keep open questions apart from decisions.
8. **Folded:** files you expect to touch, data or API changes, migration and rollback.

After the work, the same plan can become the report: mark each step done, changed or dropped.

## Teach: "help me understand X"

The reader wants a working mental model. Set `<main data-type="teach">`: the page may run past 350 words, but each section still opens with its point and keeps paragraphs to two sentences.

1. **First screen.** h1 = the model in a phrase ("Rebase replays your commits"), the line under it gives the full sentence, then one picture of it.
2. **Why it matters to them**: the situation where they'll need this, from their own project if you can. One or two lines.
3. **Terms first.** The 3 to 5 words the rest depends on, defined briefly, before the walkthrough uses them.
4. **Predict first.** Before the walkthrough, ask the question the model answers ("after the rebase, what is commit C's parent?") and fold the answer. Guessing wrong and then seeing why is what makes it stick, especially where people usually hold the wrong idea.
5. **One concrete example, walked through.** Draw the state before, each step, and after. For anything that changes over time, draw each state rather than describing it.
6. **Then the rule**, now that the example gives it something to attach to, and step back down to a second concrete case. If an analogy helps, spell out the mapping and say where it breaks.
7. **The common mistake**, refuted head-on in one place: what people believe, that it's wrong, and why.
8. **Check yourself**: two to four questions per major section in folds, answer and reason inside. Questions that need the model ("what happens to commit C if…"), not recall.
9. **When to use what** (if there are alternatives): a small table.
10. **Folded:** edge cases, links to the primary docs.

When the reader knows the basics, skip to the part they're missing; scaffolding they don't need slows them down.

## Compare: "which one should I pick?"

1. **First screen.** h1 = the recommendation; the line under it gives its condition ("Use Convex", then "unless you need SQL joins across tenants"). Numbers only if a number decides it (cost at your usage).
2. **One table**: at most five options as rows, a few criteria as columns, the pick marked, numbers right-aligned with units in the header. Every cell holds a value or a short judgement ("$25/mo at 1M calls"), never a bare checkmark.
3. **Cost** in its own small table when money is a criterion: the same scenario priced for each option. Assumptions and the date the prices were checked fold under it.
4. **When the answer flips**: one line per situation where another option wins.
5. **Sources** with dates, visible at the end. Prices and limits go stale.

## Mixed pages

A report followed by a plan ("here's what I found, here's what I propose"): what is true now, then what to do about it. The asks stay on the first screen regardless.
