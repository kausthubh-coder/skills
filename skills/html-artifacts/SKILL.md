---
name: html-artifacts
description: Write a single-file HTML page that explains something to a person - a report on work an agent did, a plan to review, a lesson on a topic, or a comparison to decide from. Use when asked for an HTML page, report, plan, explainer or artifact, or to visualize, teach or walk someone through something.
---

# HTML artifacts

A page that moves knowledge from you to a person with as little effort on their side as possible. The reader is busy, wasn't there while you worked, and scans: the headline, the numbers, the first words of each line. They stop as soon as they have what they need. So the test for every choice below: **the first screen gives the answer, and the whole page reads in under a minute.** Explanation and evidence wait one click away, folded.

If the user asked for a page, write one. If you're choosing the format yourself, a page beats chat when there's structure to show (a flow, a comparison, a change, evidence to check) or the reader will come back to it. A short answer stays in chat.

## 1. Name the reader's question

Before writing, say in one line who reads this and the question they bring. That picks the page type; read its skeleton in [references/page-types.md](references/page-types.md).

| They're asking | Type |
|---|---|
| What did you do, and can I trust it? | Report |
| What will you do, and should I say yes? | Plan |
| Help me understand X | Teach |
| Which one should I pick? | Compare |

Then gather the material: the diff, the commands you ran and their output, the sources you read, with dates. Collect the evidence before you write about it.

## 2. Keep to the text budget

Pages from agents usually fail the same way: too many words. Write the fewest that carry the answer.

- **The first screen is the answer.** A serif h1 of at most 8 words that states the finding ("Process skills *got skipped*", not "Skills audit"), then a stats row or one visual, then what you need from the reader as a numbered list they can answer by number.
- **Headings state the point in 6 words or fewer.** Reading only the headings gives the whole argument.
- **Paragraphs are one or two short sentences.** Anything longer is explanation and goes in a fold.
- **A number, a table row or a visual beats a sentence.** "3 of 74 threads went badly" in a stat or a row, not a paragraph about it.
- **Explanation goes in `<details>`**: the reasoning, the quotes, the logs, the file lists. The visible page holds the claims; the folds hold the why and the proof. Each summary says what's inside ("Evidence: 4 quotes from 3 threads").
- **Say each thing once.** No summary that the sections repeat, no closing recap.
- **Budget: 350 visible words** (outside `<details>`) for reports, plans and comparisons. Teach pages may run longer; the rules above still hold per section. `scripts/check.mjs` counts.

Front-load the first words of every heading, list item and row with the word that tells it apart. Plain words, active voice, specific nouns; define a term before you use it. Mark how you know each claim: verified (you ran it), inferred, or not checked. Run the `unslop` skill on the prose.

## 3. Show what prose can't

Use a visual when the reader must relate several parts at once. Each one makes one claim, labeled directly. Read [references/visuals.md](references/visuals.md) before drawing a diagram or adding anything interactive.

| Showing | Use |
|---|---|
| The few numbers that prove the answer | `.stats` |
| Steps or a pipeline | `.flow` (the changed step `.hl`), or `ol.steps` for steps to follow |
| What changed | `.pair` (before/after) |
| Options against criteria, or many items with a value each | a table, the pick as `tr.pick`, magnitudes as a `.bar` in a cell |
| Structure, dependencies, state over time | a diagram (inline SVG or Mermaid, per visuals.md) |
| Numbers compared over time or across many series | a chart: use the `dataviz` skill |

The page is complete with zero clicks on the visible part. Interaction is for "what if?" questions and self-checks.

## 4. Build it

If the repo already has a format for these pages, follow it. Otherwise copy the template to where the page will live, before writing any content:

```
cp <this skill's folder>/assets/template.html <destination>.html
```

Then edit the copy. Everything after `</footer>` is an embedded font (about 58 KB of base64), so read the file only up to there and leave the rest as it is. Set `data-type` on `<main>` to the page type.

The template is an editorial page: warm paper, Instrument Serif for the headline, section heads and numbers, a quiet sans for the rest, hairlines between things, and one orange-red accent. Its dark mode is a design of its own. Keep that look:

- The accent goes on one or two things per screen: the h1's italic phrase, the asks' numerals, the pick, the one stat that matters.
- Space and hairlines do the grouping. The only label-like element is the one status word in the header.
- Stay within its tokens and components, and delete every block you don't use.

The saved file is the artifact and stands alone: someone opens it next month, offline, in dark mode. Inline CSS, the embedded font, images inlined or beside the file, and any library pinned to an exact version. For type, spacing and hierarchy detail, the `critly` skill's Typography, Color and Layout concepts apply.

## 5. Check it

1. `node <this skill's folder>/scripts/check.mjs page.html` until it reports no errors, and fix each warning or know why not. It checks leftover TODOs, structure, unpinned scripts, alt text, the word budget, h1 and h2 length, and paragraph length.
2. Screenshot the saved file in a real browser, phone and desktop, dark and light, and look at every image:
   ```
   bunx playwright@1 screenshot --full-page --viewport-size=390,844 --color-scheme=dark "file:///<abs path>" phone-dark.png
   bunx playwright@1 screenshot --full-page --viewport-size=1280,800 --color-scheme=light "file:///<abs path>" desk-light.png
   ```
   (First run on a machine: `bunx playwright@1 install chromium`.) A phone screenshot wider than 390px means something overflows. The first 844px of the phone shot should hold the h1, the numbers and the asks. T3's `html_preview` is not this check: it renders inside T3's theme.
3. Read the visible page top to bottom once as the reader, folds closed. If it takes more than a minute, cut or fold.

## 6. Deliver

- **Where:** in a repo, wherever it keeps plans or reports (`.agent/plans`, `docs/plans`…); otherwise `.agents/plans/` for plans and `.agents/reports/` for the rest, named `<date>-<slug>.html`. Outside a repo, the current folder.
- **Show it:** in T3, also `html_render` the same file with `<style>html{background:none}body{padding:0}</style>` added so it sits on the thread's background. Elsewhere, give the absolute path.
- Reply with the answer in a line or two, the path, and anything you couldn't check. The page already says the rest.
