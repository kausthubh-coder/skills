# Page types

Each type answers a different question. Start from its skeleton and cut any part that has nothing true to say. The parts below are roles; on the page, each heading states its section's point in 6 words or fewer.

Every type opens the same way. **The first screen**: the h1 (the answer, 8 words at most), a dek line if the h1 needs a condition, a stats row or one visual, and the asks. Every type folds the same things: reasoning, quotes, logs, file lists and long output go in `<details>`, with a summary that says what's inside. The visible page is about 350 words; only teach pages run longer.

## Report: "what did you do, and can I trust it?"

The reader was not there. They want the outcome, enough evidence to believe it, and what's left for them.

1. **First screen.** h1 = the outcome ("Imports no longer duplicate rows"). Status word: done, partly done or blocked. Stats: the two to four numbers that prove it (tests passed, rows fixed, threads read). Asks, if any.
2. **What changed, by behavior.** What a user or caller now sees, not which files moved. A before/after pair, a flow with the changed step marked, or one table row per behavior.
3. **Evidence.** A table: claim, how you checked it, result (verified, inferred or not checked). The command output folds under it. One honest "not checked" row says more than a column of passes.
4. **Risks and what's left.** One `.note` line each, with what you'll do about it.
5. **Folded:** decisions a reviewer might question (each with the alternative you rejected), the file list, logs.

A report that says "all checks pass" names the checks, and names the skipped ones too.

## Plan: "what will you do, and should I say yes?"

The reader is approving. Make the decision easy and the scope impossible to misread.

1. **First screen.** h1 = the proposal ("Move auth to Clerk in three steps"). Stats or the flow of phases. Asks: approve, choose, or numbered questions they can answer by number.
2. **Done when.** Two to four checkable lines.
3. **The approach.** A `.flow` or `ol.steps`; each step is one line saying what it produces and how you'll know it worked.
4. **Options** (only if there was a real choice, including doing nothing): a table with the pick row marked. The reasoning folds under it.
5. **Scope.** In and out as a `.pair`. Non-goals prevent the "I thought you were also…" conversation.
6. **Risks**, found by a premortem (assume it shipped and failed; list why). One `.note` each, with the response. Keep open questions apart from decisions.
7. **Folded:** files you expect to touch, data or API changes, migration and rollback.

## Teach: "help me understand X"

The reader wants a working mental model. Set `<main data-type="teach">`: the page may run past 350 words, but each section still opens with its point and keeps paragraphs to two sentences.

1. **First screen.** h1 = the model in a phrase ("Rebase replays your commits"), the dek gives the full sentence, then one picture of it.
2. **Why it matters to them**: the situation where they'll need this, from their own project if you can. One or two lines.
3. **Terms first.** The 3-5 words the rest depends on, defined briefly, before the walkthrough uses them.
4. **One concrete example, walked through.** Draw the state before, each step, and after. For anything that changes over time, draw each state rather than describing it.
5. **Then the rule**, now that the example gives it something to attach to. If an analogy helps, spell out the mapping and say where it breaks.
6. **The common mistake**, refuted head-on in one place: what people believe, that it's wrong, and why.
7. **Check yourself**: two to four questions per major section in `<details class="check">`, answer and reason inside. Ask questions that need the model ("what happens to commit C if…"), not recall.
8. **When to use what** (if there are alternatives): a small table.
9. **Folded:** edge cases, links to the primary docs.

When the reader knows the basics, skip to the part they're missing.

## Compare: "which one should I pick?"

1. **First screen.** h1 = the recommendation; the dek gives its condition ("Use Convex", then "unless you need SQL joins across tenants"). Stats only if a number decides it (cost at your usage).
2. **One table**: at most five options as rows, a few criteria as columns, the pick row marked, numbers right-aligned with units in the header. Every cell holds a value or a short judgement ("$25/mo at 1M calls"), never a bare checkmark.
3. **Cost** in its own small table when money is a criterion: the same scenario priced for each option. Assumptions and the date the prices were checked fold under it.
4. **When the answer flips**: one `.note` line per situation where another option wins.
5. **Sources** with dates, in the footer. Prices and limits go stale.

## Mixed pages

A report followed by a plan ("here's what I found, here's what I propose"): what is true now, then what to do about it. The asks stay on the first screen regardless.
