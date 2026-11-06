---
name: clear-output
description: Make answers easy for me to take in, with plain words, inline diagrams, charts or animations. Use when you explain how something works, compare options, show numbers, or walk me through steps.
---

# Clear output

The goal: I understand your answer in one read, and I can check it. Most of my time with agents now goes into reading their output, so the cost of a hard-to-read answer is mine.

This follows Karpathy's ladder of output formats (2026-10-02): controlled English, then a diagram, then an HTML page, then an explainer video. T3 Code shows HTML inline in the chat (`html_render`), so a diagram, chart or animation can sit right above your reply instead of in a file I have to open.

## Pick the format

Use the simplest format that shows the thing I must understand or decide. Most answers are words plus at most one visual.

| The answer is mostly | Use |
|---|---|
| A fact, a yes or no, a short instruction | Words only |
| Parts and how they connect: a flow, a pipeline, states, before and after | An inline diagram |
| Numbers to compare, a trend, a ranking | An inline chart. Load `dataviz` first |
| Something that happens in order or moves: commits being replayed, a request passing through layers, a migration | An inline animation with step controls |
| A long story I'd rather watch, or I ask for a video | A real video: read `~/.skills-parked/hyperframes/SKILL.md` |
| A plan or report I'll come back to | A self-contained HTML file: show it with `html_render` and give me its absolute path. Don't publish it to claude.ai unless I ask |

The words still give the answer in the first two lines. The visual carries the structure. Don't describe the visual again in prose; say only what it can't show. When a visual fits, make it; don't end with "I can turn this into a diagram if you want".

## Words: about 80% of ASD-STE100

ASD-STE100 is the controlled English written for aircraft maintenance manuals, so that a tired reader can't misread a step. Go most of the way, not all of it:

- One instruction per sentence. Put the verb first. Number steps in the order I do them.
- Keep sentences short: 20 words at most for an instruction, 25 for a description.
- Use active voice and name who does it: "`sync.mjs` pulls the repo", not "the repo is pulled".
- Use one word for one thing. If you call it a "thread", never switch to "session" for the same thing.
- Use common words: use, start, before, make sure, about. Not utilize, commence, prior to, ensure, approximately.
- Use no more than three nouns in a row. "skill description token cost" becomes "how many tokens a skill's description costs".
- Explain a term I may not know in the same line, or swap it for a plain word.
- Put a warning on its own line, right before the step it is about.

**Keep every fact.** Make the sentences shorter, never the content thinner. In one test, a strict STE prompt made code explanations drop 40 to 47% of their facts, while a loose one dropped 8.5%. Split a long sentence into two; don't cut half of it.

## Inline visuals in T3

1. Write one self-contained HTML document: inline `<style>` and `<script>`, real names from the work (file names, commands, numbers), with labels on the figure itself.
2. Call `html_preview` and look at the PNG. Fix clipped labels, overlaps, text too small to read, and console errors. Check `appearance: "light"` once too.
3. Call `html_render` with `height` set to the `contentHeight` from the preview. Then write your reply. Don't announce the visual.

T3's frame rules (from the tool): no background on html, body or the outer element; no outer card or banner title; colors only from the theme variables (`--foreground`, `--muted-foreground`, `--border`, `--card`, `--primary`, `--chart-1` to `--chart-6`, `--radius`, `--font-sans`, `--font-mono`); fixed pixel heights for charts; never `vh` or `height:100%`.

- **Diagram:** boxes and arrows in inline SVG or flex HTML. Seven boxes at most. Each arrow says what moves along it ("pulls every 5 min"). One color marks the part I asked about; the rest stay neutral.
- **Chart:** follow `dataviz`. Sort the bars, label the values, no pies.
- **Animation:** use it only when order or motion is the point. Three to six steps, each with a one-line caption that changes with the step. Add Play, Back and Next buttons, so I can go at my own pace. Under `prefers-reduced-motion`, show each step without moving.

Outside T3 (the Codex app, a plain terminal, no `html_render` tool): put a small ASCII or Mermaid diagram in a code block, or write the HTML to a file and give me its absolute path.

## Before you send

- Can I get the answer from the first two lines alone?
- Did every fact from your notes make it in?
- Did you look at the preview PNG, not just write the HTML?
