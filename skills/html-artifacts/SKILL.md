---
name: html-artifacts
description: Write a single-file HTML page that explains something to a person - a report on work an agent did, a plan to review, a lesson on a topic, or a comparison to decide from. Use when asked for an HTML page, report, plan, explainer or artifact, or to visualize, teach or walk someone through something.
---

# HTML artifacts

A page that moves knowledge from you to a person with as little effort on their side as possible. The reader is busy, wasn't there while you worked, and reads maybe a quarter of the words on a page: they scan the headings and the first words of each line, and stop as soon as they have what they need. So the test for every choice below: **can they get the answer in 30 seconds and the evidence in 5 minutes?**

If the user asked for a page, write one. If you're choosing the format yourself, a page beats chat when there's structure to show (a flow, a comparison, a change, evidence to check) or the reader will come back to it. A short answer, or something that would be only headings and paragraphs, stays in chat.

## 1. Name the reader's question

Before writing, say in one line who reads this and the question they bring. That picks the page type; read its skeleton in [references/page-types.md](references/page-types.md).

| They're asking | Type |
|---|---|
| What did you do, and can I trust it? | Report |
| What will you do, and should I say yes? | Plan |
| Help me understand X | Teach |
| Which one should I pick? | Compare |

Then gather the material: the diff, the commands you ran and their output, the sources you read, with dates. Collect the evidence before you write prose about it.

## 2. Answer first

- **The h1 is the answer** as a sentence: "Imports no longer duplicate rows; the prod backfill needs your go-ahead", not "Importer report".
- Under it, three to five lines: outcome, strongest evidence, main risk. A reader who stops there knows what matters.
- If you need something from the reader (a decision, an approval, answers), ask right after the summary, numbered so they can reply by number.
- **Headings state their section's point**, so reading only the headings gives the whole argument. Each covers all of its section and nothing else.
- **Front-load the first two words** of every heading, list item and link with the word that tells it apart. Readers skip a run of items that start the same way.
- Depth goes last, or folded into `<details>` whose summary says what's inside ("Full test output: 214 passed, 0 failed"). Fold only what some readers need, at most two levels deep. Anything most readers need stays visible.

## 3. Write for low load

- One idea per paragraph, the point in its first sentence. Plain words, active voice, specific nouns.
- Define a term before you use it. Jargon the reader doesn't share costs more than anything else on the page.
- **Concrete first**: the real example (this repo's commit graph, this month's invoice), then the general rule.
- Prose for reasoning (because, so, unless); lists and tables for parallel items. A bulleted list flattens an argument.
- Mark how you know: verified (you ran it), inferred, or not checked. Name what you skipped.
- Cut what doesn't serve the question: process narration ("First I looked at…"), restating the summary, praise of the work, hype words ("robust", "successfully"). Bold a few key phrases, never whole sentences. Run the `unslop` skill on the prose.
- Aim for a 3-5 minute read for reports and plans. Past that, fold or split. `scripts/check.mjs` prints the word count.

## 4. Show what prose can't

Use a visual when the reader must relate several parts at once: a sequence, a structure, a change, a comparison, a magnitude. Each one makes one claim, labeled directly, with its explanation right beside it. Read [references/visuals.md](references/visuals.md) before drawing a diagram or adding anything interactive.

| Showing | Use |
|---|---|
| Steps or a pipeline | `.flow` or `.steps` |
| What changed | `.pair` (before/after), or the flow with the changed step highlighted |
| Options against criteria | a table, the pick highlighted (`tr.pick`) |
| Structure, dependencies, state over time | a diagram (inline SVG or Mermaid, per visuals.md) |
| Numbers being compared | a chart: use the `dataviz` skill |
| One status or one number | a word and a tag, no chart |

The page is complete with zero clicks. Interaction is for "what if?" questions (a cost calculator with your scenario filled in) and self-checks.

## 5. Build it

If the repo already has a format for these pages (a stylesheet, earlier plans), follow it. Otherwise copy [assets/template.html](assets/template.html) and fill it: it has the type scale, spacing, light and dark themes, print styles and the components named above. Delete every block you don't use, and stay within its tokens rather than adding colors or sizes.

The saved file is the artifact, and it stands alone: someone opens it in a browser next month, offline, in dark mode. So it carries its own colors for both schemes (the template's), inline CSS, system fonts, images inlined or beside the file, and any library pinned to an exact version. Build the file first; showing it in a chat is a copy of it (step 7), not the target.

Keep the look quiet so the content leads. Color marks meaning (status, the changed thing, the pick) and always comes with a word. Labels are sentence case. Numbers like 01/02 only for a real sequence. A boxed card only for a bounded item, never around a whole section. Gradients, emoji, decorative icons and rows of big standalone numbers read as generated, so they go. For type, spacing and hierarchy detail, the `critly` skill's Typography, Color and Layout concepts apply.

## 6. Check it

1. `node <this skill's folder>/scripts/check.mjs page.html` until it reports no errors: leftover TODOs, structure, unpinned scripts, missing alt text, length.
2. Screenshot the saved file in a real browser, phone and desktop, dark and light, and look at every image:
   ```
   bunx playwright@1 screenshot --full-page --viewport-size=390,844 --color-scheme=dark "file:///<abs path>" phone-dark.png
   bunx playwright@1 screenshot --full-page --viewport-size=1280,800 --color-scheme=light "file:///<abs path>" desk-light.png
   ```
   (First run on a machine: `bunx playwright@1 install chromium`.) A phone screenshot wider than 390px means something overflows. Check that all text is readable in both schemes, diagrams read on a phone, and the first screen holds the answer. T3's `html_preview` is not this check: it renders inside T3's theme, so a page that only works there passes it.
3. Read it top to bottom once as the reader. Rewrite anything you had to read twice.

## 7. Deliver

- **Where:** in a repo, wherever it keeps plans or reports (`.agent/plans`, `docs/plans`…); otherwise `.agents/plans/` for plans and `.agents/reports/` for the rest, named `<date>-<slug>.html`. Outside a repo, the current folder.
- **Show it:** in T3, also `html_render` the same file with `<style>html{background:none}body{padding:0}</style>` added so it sits on the thread's background. Elsewhere, give the absolute path.
- Reply with the answer in a line or two, the path, and anything you couldn't check. The page already says the rest.
