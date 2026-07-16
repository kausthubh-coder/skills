# Oracle HTML Artifacts

Use this reference whenever Oracle creates or updates `human.html`, a plan,
design record, conclusion, dashboard, comparison, or other HTML artifact.

## Purpose

An Oracle HTML page is a durable decision surface, not a chat transcript. A
person should understand the current state, important evidence, decisions, and
next action in a few minutes without reading the underlying agent conversation.

Every page must be:

- Self-contained and readable from `file://` without a build step.
- Accurate to the named revision, run, date, and verification boundary.
- Structured for scanning on desktop and mobile down to 320px.
- Accessible with semantic landmarks, headings, tables, labels, focus order,
  contrast, and text alternatives for meaningful visuals.
- Honest about assumptions, blocked checks, mocks, and external dependencies.

Read `.artifacts/examples/current-template.txt` and start from the named
immutable versioned template when practical. Copy it to the destination,
replace its placeholders, remove irrelevant example sections, and preserve only
visuals that improve comprehension.

Do not customize the installed versioned template in place. Oracle init verifies
it against the packaged template and fails closed on a mismatch; copy it to a
dated artifact path before editing.

Before delivery, verify no `{{PLACEHOLDER}}` token remains. Status is neutral by
default; set `data-state` to `pass`, `warning`, or `fail` only when evidence
supports that meaning. Replace score labels and bar percentages together, use a
declared scale, and remove the score section when scores are not part of the
actual review contract.

## Required Frame

Every artifact includes:

1. **Header:** literal project or feature name, artifact type, one-sentence
   purpose, status, generated/updated date, run ID, and revision when relevant.
2. **Executive summary:** outcome, strongest evidence, main risk, and next
   action. Keep this short.
3. **Navigation:** links to the major sections and sibling Oracle artifacts.
4. **Main evidence:** facts and source paths, architecture or behavior,
   decisions, verification, risks, and release boundary.
5. **Provenance footer:** exact revision/checkpoint, commands or evidence paths,
   authoring workflow, and last-updated timestamp.

Use stable anchors and relative links so sibling files continue to work when the
repository is cloned elsewhere.

## Page Schemas

### `.artifacts/human.html`

Maintain this as the human-readable codebase map:

- Product purpose, audience, maturity, and primary workflows.
- Quick-start commands and environment variable names, never secret values.
- Architecture, entry points, services, state/data flow, and key directories.
- Web, CLI, mobile, backend, workers, shared contracts, and ownership.
- Testing route through `.artifacts/test.md`.
- Safe parallel boundaries, generated code, operational constraints, known
  gaps, and a dated change history.

Prefer a system map for architecture, a flow for the main user journey, and a
table for surface ownership. Keep README marketing content separate.

### Plan

Store at `.artifacts/plans/<run-id>-plan.html` and include:

- Goal, user outcome, scope, non-goals, authority, and source of truth.
- Current-state evidence, facts, assumptions, questions, and external sources.
- Options compared with one rubric and explicit selected/rejected rationale.
- Technical and UX design, data/API changes, migration, rollback, security,
  edge cases, and compatibility.
- Dependency/lane graph, file ownership, resource locks, integration order,
  acceptance criteria, test strategy, and release boundary.
- Independent plan-review findings and their disposition.

Use a dependency graph when order matters, a comparison table for alternatives,
and a phase timeline when sequencing is easier to see than read.

### Design Record

Store exported decisions at `.artifacts/designs/<run-id>-design.html`; runnable
variants live under `.artifacts/designs/workbench/<run-id>/`.

Include the user problem, constraints, screenshots or runnable variant links,
variant comparison, selected direction, interaction and responsive states,
accessibility, design-system fit, audit findings, and implementation handoff.

Use side-by-side or small-multiple comparisons only when all variants remain
legible. Never hide required comparison dimensions behind a toggle.

### Conclusion

Store at `.artifacts/conclusions/<run-id>-conclusion.html` and include:

- What changed and what did not.
- Lane/round history and accepted checkpoints.
- Integrated revision and exact diff boundary.
- Automated and interactive verification, including failed or skipped checks.
- Review scores, unresolved findings, accepted risks, and rollback notes.
- Demo links, release/deployment status, and the next responsible action.

Use a lane timeline for parallel work, a compact score plot for review
dimensions, and a pass/fail matrix for verification. Do not turn subjective
scores into false precision.

## Choosing A Visualization

Use a visual only when it makes a relationship, sequence, magnitude, or state
faster to understand.

| Information | Preferred representation |
| --- | --- |
| Architecture or dependencies | Labeled node-edge diagram or Mermaid |
| User or system sequence | Flowchart or sequence diagram |
| Parallel lanes over time | Aligned lane timeline |
| Options across shared criteria | Comparison table or small multiples |
| Scores on the same scale | Horizontal bars with values and thresholds |
| Test coverage across surfaces/states | Matrix with text plus status marks |
| Milestones and decisions | Chronological timeline |
| One current status | Plain labeled status, not a chart |
| Long prose without relationships | Headings, lists, and tables, not decoration |

Rules:

- Put labels and important values directly on marks when possible.
- Pair color with text, shape, or pattern; never make color the only signal.
- Keep one stable color meaning across the page: pass, warning, failure, info.
- Use a shared scale for comparisons and state what the scale means.
- Prefer Mermaid for static labeled relationships when the rendering runtime is
  guaranteed. Otherwise use semantic HTML/CSS or embed a local exported SVG/PNG
  with useful alt text. Do not depend on an unpinned remote script for a local
  artifact.
- Do not add charts, KPI cards, gradients, decorative blobs, or dashboards just
  to make the page look busy.

## Visual System

- Use a neutral page background, high-contrast text, and a small semantic color
  set rather than one dominant hue.
- Use no more than two type families; system fonts are preferred for offline
  portability. Keep letter spacing at `0`.
- Keep content width readable, with full-width diagrams and tables only when
  they need the space.
- Sections are unframed and separated by spacing or rules. Use bordered cards
  only for compact summaries, warnings, or repeated bounded items. Never nest
  cards.
- Keep radii at 8px or less, shadows subtle or absent, and motion optional with
  `prefers-reduced-motion` support.
- Tables need headers and responsive overflow. Long identifiers and paths must
  wrap without covering other content.
- Include print styles that remove navigation chrome and preserve useful URLs.
- Support `prefers-color-scheme` when it does not compromise print output.

## Evidence And Safety

- Name exact files, commands, revisions, URLs, screenshots, and demo paths.
- Distinguish observed, tested, inferred, assumed, blocked, and not applicable.
- Never embed secrets, auth cookies, private user data, raw transcripts, full
  environment files, or unrelated screenshots.
- Keep artifacts useful in Git: deterministic structure, restrained generated
  noise, relative links, and concise diffs.
- Open every final HTML page in a browser. Check desktop and mobile widths,
  anchors, relative links, tables, diagrams, overflow, contrast, and print
  layout before calling it complete.
