# Eval scenarios

One per heading. "Me" is how to answer as me. Add scenarios when a real run goes wrong in a new way.

## init-project

### experiment: bill splitter
- **Open with:** `/init-project i want to try a quick thing to split bills with my roommates, just for me to test`
- **Me:** just me, web app, no accounts, no deploy yet. Accept its recommended name.
- **Good run:** experiment tier, so a short interview (1-2 rounds), sandbox location, no Clerk, no verify skill required, short AGENTS.md, a first commit on `main`.

### personal: shared watchlist
- **Open with:** `/init-project`
- **Me:** (when asked) a shared watchlist for me and 3 friends, see what each other is watching. Web. Sign in yes. Deployed yes. Want a Sanskrit-ish name but open to others.
- **Good run:** personal tier; Next.js + Convex + Clerk + Vercel; a 5-8 name mix with availability checked; a `features/watchlist/` slice; setup and doctor scripts; `PORT`; `.gitattributes`; verify skill created once the app runs; git flow is merge to `main`, no PRs.

### public: CLI, not a web app
- **Open with:** `/init-project open source cli that renames files using ai, people will npm install it`
- **Me:** public, CLI only, no backend, no accounts.
- **Good run:** doesn't force Next.js, Convex or Clerk onto a CLI; still bun; checks the npm name; LICENSE; PR flow; slices still apply.

### vague idea
- **Open with:** `/init-project idk something with ai flashcards for my classes`
- **Me:** vague at first; when pushed: for me and classmates, web, wants it to make cards from lecture PDFs.
- **Good run:** interviews until the idea is concrete, with a recommendation each time; doesn't start building before my yes on the summary.

### after research in a No project thread
- **Open with (scratch):** first `look into apps that let a study group share one pomodoro timer, what exists and what's missing`, let it answer, then `/init-project lets build this`.
- **Me:** for me and my study group, web, sign in yes.
- **Good run:** uses the research as answers and doesn't re-ask what's settled; personal tier, so the project goes to `dev\<name>` and not the scratch folder (with the eval constraints, it says where it would have gone); copies useful research into `docs/`; at the end, says to open new threads in the new project.

## optimize

### krida, quick
- **Repo:** krida (`dev\krida`), worktree.
- **Open with:** `/optimize quick`
- **Good run:** krida was fixed on 2026-10-12, so it should find little. It must not invent findings; every finding has evidence. Reads T3, Claude and Codex history only at standard depth or deeper.

### fresh project, standard
- **Repo:** the newest project made with `/init-project` (check `t3_project_list`), worktree.
- **Open with:** `/optimize standard`
- **Good run:** finds real gaps or says there are none; reads my threads for that repo; writes the plan to the repo's plans folder and waits.

## html-artifacts

### teach: git rebase
- **Open with (scratch):** `make me an html page that explains git rebase vs merge, i always mess it up`
- **Me:** knows basic git (commit, push, branches). Messes up when rebasing a branch someone else pushed to.
- **Good run:** h1 states the model in a sentence; terms before use; a drawn commit graph before and after; the "rebasing a shared branch" mistake refuted head-on; self-check questions with hidden answers; check.mjs clean; screenshots at 390 and 1280 looked at; `html_render` in the thread.

### report: what the agent did
- **Repo:** krida, worktree.
- **Open with:** `write up what changed in the last few commits as an html report so i can review it`
- **Good run:** h1 is the outcome, not "Report"; changes grouped by behavior; each claim beside its evidence; checks named, skipped ones marked; at most 350 visible words, the rest folded; saved in the repo's plans folder or `.agents/reports/`.

### compare: costs
- **Open with (scratch):** `html page comparing convex vs supabase vs neon for a small app, mainly cost`
- **Good run:** h1 is a recommendation with its condition; one table with real numbers, the assumptions and the date prices were checked; sources linked; no invented prices.

### Every html-artifacts run
- **Good run, on top of the above:** no template look and none of the listed tells; a look you can explain from the content (the generic test passes: the three scenario pages don't look alike); body text 16px or more; `check.mjs` clean, `critly check` passing in both schemes, the taste images opened; readable in light and dark, on a phone and printed with folds open.

## create-project-flows

### repo with flows, new worktree
- **Repo:** krida, kriyan, likh or Critly once `agent-flows` is merged; a fresh T3 worktree thread.
- **Open with:** `the search sheet flickers, fix it`
- **Good run:** before touching code it runs `worktree-<app>` (setup, then doctor), gets its own port and backend, and never edits the main checkout. Then it fixes the bug.

### ship
- **Repo:** same, in an eval worktree with a trivial verified change.
- **Open with:** `ship it`
- **Me:** says no to anything outward ("dry run only").
- **Good run:** loads `ship-<app>`, checks it's ready, then prints the land, deploy and smoke-test commands without running them, along with how to update the main checkout and what to clean up. Asks for my go before anything leaves the machine.

### cloud session
- **Repo:** any repo with `scripts/cloud.mjs`; a new megha "Claude Code on the web" thread with nothing in the prompt about setup.
- **Open with:** `list your skills, then run the full check and one headless screenshot`
- **Good run:** the global rules and the cloud note arrived, the global, Critly and repo skills are listed, setup is done by the hook, the check passes, the screenshot is looked at.

## cloud-pr

### one change, end to end
- **Repo:** krida, on a small visible change.
- **Open with:** `/cloud-pr krida <the change>`
- **Me:** says nothing until the end.
- **Good run:** a Claude cloud thread opens a PR and stops; Devin tests it on the right platform and comments `Devin test: PASS/FAIL` with a recording; a FAIL goes back to the same cloud thread, which pushes to the same branch, and Devin retests; on pass I get three lines. Nothing merges without "ship".

### a failure Devin has to catch
- **Same, but** the task carries a bug that only shows when the feature is used (not in typecheck or tests).
- **Good run:** Devin marks it FAIL with steps to reproduce; the fix round passes.

## Should not trigger

### plain question
- **Open with (any repo):** `how does the dev server pick its port here?`
- **Good run:** answers the question. No skill runs, nothing is changed.
