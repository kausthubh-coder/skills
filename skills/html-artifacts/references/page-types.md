# Page types

Each type answers a different question for a different moment. Start from the skeleton, then cut any section that has nothing true to say. The section headings below are roles; on the page, write headings that state each section's point.

## Report: "what did you do, and can I trust it?"

The reader was not there. They want the outcome, then enough evidence to believe it, then what is left for them.

1. **h1 = the outcome.** "Imports no longer duplicate rows; the backfill still needs a run on prod." Status tag: done, partly done, blocked.
2. **Summary**: what changed, the strongest evidence, the main risk, what I need from you.
3. **What changed, by behavior.** Group by what a user or caller now sees, not by file. A before/after pair or a flow with the changed step highlighted usually beats a list of edits.
4. **Why this way.** Only the decisions a reviewer might question, each with the alternative you rejected and why. Skip if nothing was a judgement call.
5. **Evidence.** What you ran and what came back: commands, test names, screenshots, numbers. Put each claim next to its evidence (the test result beside the behavior it proves), long output folded. Mark each as verified, inferred, or not checked. A small pass/fail matrix works when there are several surfaces or states; a wall of green checks says less than one honest "not checked".
6. **Risks and what's left.** Unverified paths, follow-ups, anything you changed that the task didn't ask for.
7. **Details** (folded): file list with one line each, the full diff summary, logs.

A report that says "all checks pass" must name the checks. Name the skipped ones too; a reader trusts a report that admits gaps more than one that has none.

## Plan: "what will you do, and should I say yes?"

The reader is approving. Make the decision easy and the scope impossible to misread.

1. **h1 = the proposal in one sentence.** "Move auth to Clerk in three steps, starting with the web app."
2. **What I need from you**, right under the summary: approve, choose between options, or answer specific questions. Number the questions so they can be answered by number.
3. **The goal and the done-criteria.** What will be true when this is finished, stated so it can be checked.
4. **The approach.** A diagram when order or dependencies matter (steps, phases, what blocks what). Each step says what it produces and how you will know it worked.
5. **Options considered** (only if there was a real choice), including doing nothing: a table, the pick highlighted, then the reasoning as a short paragraph. Reasons are an argument, so they read better as prose than as bullets.
6. **Scope and non-goals.** In and out, explicitly. Non-goals prevent the "I thought you were also…" conversation.
7. **Risks**, found by a premortem: assume it shipped and failed, then list why. Each risk gets what you'll do about it. Open questions and assumptions are listed apart from decisions, so the reader can see what is settled.
8. **Details** (folded): files you expect to touch, data or API changes, migration and rollback.

## Teach: "help me understand X"

The reader wants a working mental model, not a reference manual. Build it in the order a good teacher would at a whiteboard.

1. **h1 = the one-sentence model.** "A rebase replays your commits on top of someone else's, which is why their hashes change."
2. **Why it matters to them**: the concrete situation where they'll need this, preferably from their own project.
3. **Terms first, briefly.** Define the 3-5 words the rest of the page depends on before using them (a short definition list), and give the mental model in a sentence or a picture. Learning the parts before the process keeps the main explanation from carrying two loads at once.
4. **One concrete example, walked through.** Show the state before, each step, the state after. For anything that changes over time (git history, a request through a system, a data structure), draw each state rather than describing it.
5. **Then the general rule**, now that the example gives it something to attach to. If an analogy helps, spell out the mapping ("the branch label is like a bookmark: moving it doesn't move the pages") and say where it breaks.
6. **The common mistake.** State the misconception people actually have, say plainly that it's wrong, and explain why, all in one place. Correcting it head-on works; it doesn't entrench the mistake.
7. **Check yourself**: two to four questions at the end of each major section, in `<details class="check">` with the answer and its reason inside. Ask questions that need the model ("what happens to commit C if…"), not recall of a definition. Answering from memory, then seeing the answer, is what makes it stick.
8. **When to use what** (if the topic has alternatives): a small decision table or "if X, use Y" list.
9. **Go deeper** (folded or at the end): edge cases, links to the primary docs.

Match depth to the reader. Worked examples and definitions help a newcomer and slow down an expert, so when the reader knows the basics, skip to the part they're missing, or add a "skip to the rule" link.

## Compare: "which one should I pick?"

For frameworks, services, approaches, costs.

1. **h1 = the recommendation and its condition.** "Use Convex unless you need SQL joins across tenants."
2. **The criteria that matter for this decision**, stated up front, a few at most. Ten criteria means you haven't decided what matters.
3. **One table**: at most five options, the same criteria for each, the recommended option highlighted, numbers right-aligned with units in the header. Every cell holds a value or a short judgement ("$25/mo at 1M calls"), not a bare checkmark or "Good". Options as rows keeps the table narrow enough for a phone.
4. **Cost** gets its own small table or chart when money is a criterion: the same usage scenario priced for each option, with the assumptions written down and the date the prices were checked.
5. **When the answer flips**: the situations where a different option wins.
6. **Sources**, with dates. Prices and limits go stale.

## Mixed pages

A page can be a report followed by a plan ("here's what I found, here's what I propose"). Keep the order: what is true now, then what to do about it. Put the ask at the top regardless.
