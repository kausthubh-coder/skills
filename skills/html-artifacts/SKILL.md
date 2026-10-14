---
name: html-artifacts
description: Write a single-file HTML page that explains something to a person - a report on work an agent did, a plan to review, a lesson on a topic, or a comparison to decide from. Use when asked for an HTML page, report, plan, explainer or artifact, or to visualize, teach or walk someone through something.
---

# HTML artifacts

A page that moves understanding from you to a person with as little effort on their side as possible. The reader is busy, wasn't there while you worked, and is reading on a screen, where people skim and overrate how much they took in. They stop as soon as they have what they need. The test for every choice: **the first screen gives the answer, and the visible page reads in about a minute.** Reasoning and proof wait one click away, folded.

There is no template. A fixed look becomes the next thing that marks a page as generated, and the content should set the look anyway. What follows is how to think, what to avoid, and how to check.

If the user asked for a page, write one. If you're choosing the format, a page beats chat when there's structure to show (a flow, a comparison, a change, evidence to check) or the reader will come back to it. If the page would be only headings and paragraphs, it should have stayed in chat.

## How people read a page

Each rule below follows from one of these. Use them to judge cases the rules don't cover. Sources: [references/evidence.md](references/evidence.md).

- **The eye sees about one word per stop.** A fixation takes in roughly 15 characters, and a scanner reads the first two words of each heading or line, then moves on. Whatever tells a line apart goes in its first words.
- **Scanners read headings and dive under one** (the "layer cake"). Headings that state findings let the scan work. "Overview" carries no scent, so the reader skips it.
- **Reading runs about 240 words a minute, and a busy reader gives a page one or two.** That is 300 to 400 words read for real. Everything past that has to be skippable.
- **Working memory holds about four chunks.** Lead with three or four points, not eight. Never make the reader carry a number or term from three screens back.
- **Attention goes to what is rare.** One accent color or one large number pops out. Ten don't: emphasis everywhere is emphasis nowhere.
- **Space groups things; a box claims they're one unit.** Enclosure overrides proximity, so boxes in boxes create competing groups.
- **Interesting extras hurt understanding.** Decoration, asides and "fun facts" cost comprehension measurably, more so under time pressure. Cut them.
- **Text far from what it explains splits attention.** Labels go on the figure; the sentence about a table sits next to it.
- **Explanation helps novices and slows experts.** Write for the actual reader. The person who asked for the work doesn't need the basics re-explained.
- **Position and length are read accurately; area and color are not.** Compare numbers as aligned bars or a sorted column, never pies or bubbles.
- **Concrete reads as true.** Real numbers, names, paths and dates build trust; polished, promotional or generic wording loses it.
- **Reading slows below about 16px**, and older eyes need more. Dark text on light reads a little faster; follow the reader's OS setting and make both schemes good.
- **Lines from about 50 to 90 characters read equally fast, and readers prefer the shorter end.** Avoid both narrow columns and full-width text.

## 1. Think before any HTML

1. **Name the reader and their question.** One line: who reads this, what they already know, and what they'll do after (approve, decide, learn, note). The question picks the page type; read its skeleton in [references/page-types.md](references/page-types.md).

   | They're asking | Type |
   |---|---|
   | What did you do, and can I trust it? | Report |
   | What will you do, and should I say yes? | Plan |
   | Help me understand X | Teach |
   | Which one should I pick? | Compare |

2. **Gather the evidence first**: the diff, the commands you ran and their output, the sources you read, with dates.
3. **Write the answer as one sentence.** If you can't, you don't understand it yet; keep investigating rather than writing around the gap.
4. **List the claims.** Each is one sentence that could turn out false, about a behavior or outcome, never a file. Mark each: verified (you ran or read it), inferred, or not checked. Back each one with evidence or cut it.
5. **Outline as headings only.** Read just the headings: they should give the whole argument. Order by what the reader most needs or is most likely to change, not by the order you did the work.

## 2. Write the fewest words that carry it

Pages from agents usually fail the same way: too many words.

- **The first screen is the answer**: an h1 of at most 8 words stating the finding ("Imports no longer duplicate rows", not "Import report"), a line under it if the answer needs a condition, the evidence that proves it (a few numbers, a table or one figure), and what you need from the reader as a numbered list they can answer by number.
- **Headings state the point in 6 words or fewer**, front-loaded with the word that tells it apart.
- **Paragraphs are one or two sentences, each under 25 words.** Longer reasoning goes in a fold, written as real sentences: bullets drop the "because".
- **Bullets only for parallel items; tables for anything with two dimensions.** A number, a table row or a figure beats a sentence about it.
- **Fold the why and the proof in `<details>`**: reasoning, quotes, logs, file lists. Each summary says what's inside ("Evidence: 4 quotes from 3 threads"). Never fold the conclusion or a caveat that changes the decision.
- **Say each thing once.** No intro that previews the sections, no closing recap.
- **Be exact.** Numerals, units, two or three significant digits, the comparison that gives a number meaning ("410 ms, was 1.2 s"). "Significantly faster" is not a claim.
- **Budget: 350 visible words** (outside `<details>`) for reports, plans and comparisons. Teach pages run longer; each section still follows the rules.

Plain words, active voice, terms defined where they first appear and used the same way after. Hedge only where you're actually unsure, and say what would settle it. Run `unslop` on the prose.

## 3. Show what prose can't

Use a figure when the reader must relate several parts at once: a structure, a sequence, a change, options side by side. Each makes one claim, stated in its caption and labeled directly. Read [references/visuals.md](references/visuals.md) before drawing anything or adding interaction. Numbers compared over time or across series are charts: use the `dataviz` skill.

The page is complete with zero clicks. Interaction is for "what if?" questions and self-checks, never to reveal the main content.

## 4. Let the content set the look

Decide the look from this page's content and reader, in this order:

1. **The focal point.** What should the eye land on first? Usually the answer or the ask. Everything else gets quieter so that one thing leads.
2. **Density.** A report read once in a minute is compact. A lesson read slowly needs air. A reference people return to needs scannable tables.
3. **Type.** The system font stack (`system-ui` for text, `ui-monospace` only for code): no download, works offline. Body 16 to 18px, line height about 1.5, prose lines of 60 to 75 characters (about `55ch` in system fonts). About five sizes, each with one job and at least 1.25× apart; two weights. Numbers use tabular figures and right-align in columns.
4. **Color.** Neutrals do the work. At most one accent, with one meaning (what needs the reader). Green, amber and red only for good, mixed and bad, each next to a word. All text at least 4.5:1, muted text included. Both schemes designed, light and dark, from `prefers-color-scheme`.
5. **Grouping.** Space first: gaps inside a group half the gaps between groups, twice the space above a heading as below it. A hairline where space can't do it. A box only around a real unit, never a box in a box.
6. **One detail only this subject would have**: its real units, its conventions (commit hashes in a git graph, diff colors in a change, a timeline for an incident), its terms. This is what stops a page from looking like every other page.

**Generic test:** cover the h1. Could this page be about any other topic? Would another agent given a similar prompt produce the same page? If so, the look came from defaults. Redo the part that did.

### Tells that mark a page as generated

Avoid these unless the content calls for it and you can say why.

- **Palettes:** purple or indigo, gradients, gradient text, glows. Also the two "tasteful" defaults: near-black with one acid-green or vermilion accent, and cream with a serif headline and a terracotta accent.
- **Chrome:** small tracked ALL-CAPS labels above headings, monospace as a "technical" costume, 01/02/03 section numbers when order means nothing, middle-dot meta strings, "→" on every link, one word of the headline in italic or color.
- **Boxes:** every section in a card, identical cards with one radius and a soft shadow, cards in cards, a thick colored left border on callouts, a hero row of big numbers when numbers aren't the point.
- **Decoration:** emoji as icons or bullets, icons that only repeat their label, everything centered, fade-in on scroll or content hidden until it animates in.
- **Writing:** em dashes, "not X, but Y", a colon then a reveal, a title with an explainer after a colon, stock phrases ("it's worth noting", "seamless", "robust", "delve"), topic headings ("Overview", "Key findings"), a recap at the end, hedging everything equally.

Removing every tell isn't the goal; a page with nothing but good manners is still empty. The goal is a page whose look you can explain from its content.

## 5. Build it

If the repo already has a format for these pages, follow it. Otherwise write the page from scratch for this content; [references/build.md](references/build.md) has the mechanics (both color schemes, print, folds, wide tables, phones).

The saved file stands alone: someone opens it next month, offline, in either scheme, on a phone or on paper. Inline CSS, the system fonts, images inlined or beside the file, any library pinned to an exact version. Never use a host app's theme variables (`--foreground`, `--card`…): they exist only inside a chat preview, and the saved file comes out unreadable. For type, color and spacing detail, the `critly` skill's concepts apply.

## 6. Check it

Run all of these on the saved file. Fix, then rerun once or twice; don't loop forever.

1. **Static check:** `node <this skill's folder>/scripts/check.mjs page.html`. Errors must go; fix each warning or know why it stays. It checks the word budget, headings, paragraph length, slop phrasing and decoration, placeholders, host theme variables, both schemes, print handling and pinned scripts.
2. **Rendered check:** `bunx @kausthubh/critly@0.2 check "file:///<abs path>"`. It loads the page at 390 and 1440 wide in light and dark, and fails on contrast below 4.5:1, sideways scroll on a phone, and lines past 75 characters. Fix every error and review.
3. **Taste pass:** `bunx @kausthubh/critly@0.2 taste "file:///<abs path>" --out <temp dir>`, then again with `--scheme dark`. Open the squint and overlay images. The thing you chose as the focal point should be what leads; boxes should be few and shallow.
4. **Look at the whole page:**
   ```
   bunx playwright@1 screenshot --full-page --viewport-size=390,844 --color-scheme=dark "file:///<abs path>" phone-dark.png
   bunx playwright@1 screenshot --full-page --viewport-size=1280,800 --color-scheme=light "file:///<abs path>" desk-light.png
   ```
   (First run on a machine: `bunx playwright@1 install chromium`.) Open both. T3's `html_preview` is not this check: it renders inside T3's theme.
5. **Read it as the reader**, folds closed:
   - The first 844px of the phone shot alone: do you know the answer and what's asked of you?
   - The headings alone: do they give the argument?
   - Every number has its unit and a comparison; every claim says how you know it.
   - The generic test from section 4.
   - Over a minute to read? Cut or fold.

## 7. Deliver

- **Where:** in a repo, wherever it keeps plans or reports (`.agent/plans`, `docs/plans`…); otherwise `.agents/plans/` for plans and `.agents/reports/` for the rest, named `<date>-<slug>.html`. Outside a repo, the current folder.
- **Show it:** in T3, also `html_render` the same file, with a `<style>` override that removes the page's own outer background so it sits on the thread. Elsewhere, give the absolute path.
- Reply with the answer in a line or two, the path, and anything you couldn't check. The page already says the rest.
