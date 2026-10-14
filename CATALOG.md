# Skill catalog

Every skill I looked at from the four sources (plus prior art for HTML pages at the end), what it does, and whether it's in the library.
Snapshot: 2026-10-11.

✅ in the library · ➕ worth adding later, or per project · ✖ skip (reason given)

## pstack (Lauren Tan, Cursor) · MIT · github.com/cursor/plugins/tree/main/pstack

Built for Cursor. Many skills read model settings from `~/.cursor/rules/pstack-models.mdc` and use Cursor's subagent tool, so they need adapting before they work elsewhere.

| Skill | What it does | |
|---|---|---|
| create-verification-skill | Writes a project skill that launches your app, drives it like a user, and captures proof. Includes a feature map | ✅ |
| maintain-verification-skill | Re-checks that verification skill against the current app and fixes what went stale | ✅ |
| correct | Finds mistakes agents keep repeating and makes them impossible: architecture, then types, then lint, then tests, docs last | ✅ |
| benchmark-checklist | Seven questions to vet a perf number before you trust it (did the work even happen, is the gap bigger than noise) | ✅ |
| unslop | Cuts AI tells from writing | ✅ |
| principle-prove-it-works | Check the real thing (run it, read the value), not a proxy like "it compiles" | ✅ |
| principle-test-behavior-not-implementation | Tests call code like users do and assert exact results. Kills slop tests | ✅ |
| principle-minimize-reader-load | Count layers and hidden state a reader must track; inline one-caller wrappers | ✅ |
| architect | Sketch types and module structure before code, then supervise the build | ➕ |
| arena | N agents attempt the same task; pick the best and graft in the good parts of the rest | ➕ needs model config adapted |
| blast-radius | Find what a change breaks elsewhere and prove the key safety fact by running code | ➕ depends on `how`/`why` |
| figure-it-out | Plan big migrations as an auditable playbook with a hypothesis loop | ➕ |
| how | Explain how a subsystem works using explorer subagents | ➕ needs model config adapted |
| why | Find why code is the way it is from git history, issues and docs | ➕ |
| interrogate | Several models adversarially review a diff, then a lead sorts the findings | ➕ |
| reflect | Review a session transcript and turn lessons into edits to skills | ➕ pairs with `my-skills` |
| show-me-your-work | TSV decision log for long unattended runs, audited at the end | ➕ |
| swarm | Fan out N parallel workers and merge one report | ➕ |
| technical-writing | Standard for docs, READMEs, PR descriptions | ➕ |
| typescript-best-practices | TS rules applied when editing .ts files | ➕ |
| principle-attack-the-premise | After two fixes fail the same way, question the shared assumption | ➕ |
| principle-boundary-discipline | Validate at system edges, trust types inside | ➕ |
| principle-build-the-lever | Write the script or codemod instead of doing work by hand | ➕ |
| principle-exhaust-the-design-space | Build 2-3 prototypes for decisions with no precedent | ➕ |
| principle-fix-root-causes | Trace to the root cause, no nil-check band-aids | ➕ overlaps `diagnosing-bugs` |
| principle-foundational-thinking | Get data structures right first | ➕ |
| principle-laziness-protocol | Bias toward deletion and the smallest change | ➕ |
| principle-make-operations-idempotent | Scripts and setup that are safe to run twice | ➕ |
| principle-migrate-callers-then-delete-legacy-apis | No compatibility layers; migrate and delete in one go | ➕ already in base AGENTS.md |
| principle-model-the-domain | State machines and unions instead of scattered if/else | ➕ |
| principle-never-block-on-the-human | Proceed on reversible work instead of asking | ➕ |
| principle-sequence-verifiable-units | Small steps, each checked; failing test before the fix | ➕ |
| principle-subtract-before-you-add | Delete dead code before building on top | ➕ |
| principle-type-system-discipline | Illegal states unrepresentable, branded primitives, parse at boundaries | ➕ |
| principle-encode-lessons-in-structure | Turn repeated instructions into lints and scripts | ✖ covered by `correct` |
| principle-explain-the-number | Name what limits a measured number | ✖ covered by `benchmark-checklist` |
| principle-guard-the-context-window | Send bulky output to subagents | ✖ harnesses handle this now |
| principle-outcome-oriented-execution | Skip throwaway compatibility code during planned rewrites | ✖ niche |
| principle-redesign-from-first-principles | Redesign as if the new requirement had always existed | ✖ pushes agents toward rewrites |
| principle-separate-before-serializing-shared-state | Give concurrent workers their own state instead of locks | ✖ niche |
| principle-experience-first | Pick user delight over implementation convenience | ✖ taste, put it in AGENTS.md if you agree |
| tdd | Narrow regression-test-first bug fixing | ✖ `diagnosing-bugs` covers it |
| teach | Explain a body of work so a person understands it | ✖ Matt's `teach` is similar |
| automate-me | Turn your working style into a personal "-mode" skill | ✖ base AGENTS.md does this |
| recall | Rebuild your recent context from Cursor chat history | ✖ Cursor-specific |
| ketchup | Plain-words catch-up on the chat | ✖ |
| bro | Restate the last message without jargon. Only I can run it (`/bro`) | ✅ |
| in-your-own-words | Restate the user's goal and problem before working (added upstream 2026-10-13). Only I can run it | ✅ |
| no-comments | Reviewer agent that strips needless comments | ✅ the agent's rules bundled as a reference, run as a plain subagent |
| make-bot-ui | Web UIs that wake a Grok Bot by webhook | ✖ Cursor/Grok-specific |
| poteto-mode | Lauren's full personal style and playbooks (hillclimb, perf issue, PRs) | ✖ read it for ideas, don't install |
| poteto-help | Help for pstack itself | ✖ |
| setup-pstack | Configures pstack's models | ✖ |

## Matt Pocock · MIT · github.com/mattpocock/skills

His engineering skills assume a setup step (`setup-matt-pocock-skills`) that configures an issue tracker and docs layout.

| Skill | What it does | |
|---|---|---|
| grilling | Interviews you in rounds about a plan, with a recommended answer for each question | ✅ |
| grill-me | Shortcut that calls `grilling` | ✖ retired 2026-10-13: never used, `grilling` covers it |
| handoff | Compacts the chat into a doc a fresh agent can continue from | ✅ |
| writing-for-agents | How to write skills and AGENTS.md: descriptions as triggers, context cost | ✅ use it when editing this library |
| diagnosing-bugs | Build a tight pass/fail loop for the bug first, then bisect and test hypotheses | ✅ |
| codebase-design | Vocabulary for deep modules, seams and locality; making code AI-navigable | ✅ |
| improve-codebase-architecture | Scans a repo for deepening opportunities and renders an HTML report | ➕ good for upgrading old projects |
| code-review | Reviews a diff against the repo's standards and the original spec, in parallel | ➕ |
| domain-modeling | Maintains a GLOSSARY.md and decision records | ➕ |
| grill-with-docs | Grilling that writes decision records and glossary as it goes | ➕ |
| prototype | Throwaway prototype to answer a design question | ➕ |
| research | Researches primary sources into a markdown file in the repo | ➕ |
| retro | Retrospective on a coding session | ➕ |
| tdd | Red-green-refactor | ➕ |
| to-spec / to-tickets | Turn a chat into a spec, then into tickets with dependencies | ➕ if you use an issue tracker |
| wayfinder | Plan work too big for one session as decision tickets | ➕ |
| wizard | Generates a bash wizard for steps only a human can do (credentials, dashboards) | ➕ |
| pr | Writes PR bodies | ➕ |
| teach | Teaches you a concept inside the workspace | ➕ |
| wait-what | "That didn't land, explain it again" | ➕ |
| git-guardrails-claude-code | Claude Code hooks that block destructive git commands | ➕ run once per machine |
| setup-pre-commit | Husky + lint-staged + typecheck + tests on commit | ➕ per project |
| implement / implement-spec | Implement from his spec and tickets | ✖ tied to his flow |
| triage | Issue triage state machine for maintainers | ✖ |
| ask-matt | Router over his skills | ✖ |
| setup-matt-pocock-skills | Config for his engineering skills | ✖ |
| to-questionnaire | Turn an open decision into a questionnaire for someone else | ✖ |
| migrate-to-shoehorn | Replace `as` casts in tests with shoehorn | ✖ niche |
| scaffold-exercises | Scaffolds his course exercises | ✖ |
| in-progress/* | chief-of-staff, claude-handoff, loop-me, setup-ts-deep-modules, writing-* | ✖ unfinished upstream; `setup-ts-deep-modules` is worth watching |

## Ras Mic (Michael Shimeles) · shared for people to copy · github.com/michaelshimeles/skills

His `AGENTS.md` (isolate → build → prove → ship) is worth reading. `before-and-after` is Vercel's skill under the PolyForm Shield license (fine for personal use).

| Skill | What it does | |
|---|---|---|
| evidence-driven-testing | Agent tests the UI by computer use while a screen recording with annotations captures it, then posts to the PR. Works on Windows with ffmpeg | ✖ retired 2026-10-13: never loaded; verify skills do this |
| before-and-after | Before/after screenshots for PRs via `@vercel/before-and-after` | ✖ retired 2026-10-13: never loaded |
| code-structure | Actions orchestrate, a shared service layer owns reusable logic | ✖ retired 2026-10-13: never loaded, overlaps `codebase-design` |
| greploop / greploop-apps | Loop fixing a PR until Greptile gives 5/5 | ✖ only if you use Greptile |
| new-feature | New worktree from origin/main for every task | ✖ T3 Code handles worktrees |
| unslop | Cuts AI tells | ✖ library uses pstack's |

## T3 Code · MIT · github.com/pingdotgg/t3code

Project-specific, so not installed.

| Skill | What it does | |
|---|---|---|
| test-t3-app | Tests T3's web/desktop UI through its Browser panel against isolated dev state: reuse a healthy dev server, never touch the real database, drive with the panel's snapshot/click tools, stop only what you started | example |
| test-t3-mobile | Same for the native iOS/Android app through the Device panel; builds the native client if it's missing or outdated | example |
| contribution-triage | Enforces T3's contribution policy: closes ineligible PRs, sends eligible ones to Macroscope review | ✖ only for maintainers |

Also worth reading: T3's `AGENTS.md` (glossary, "three ways to hurt yourself", "hit every surface") and its custom lint rules in `oxlint-plugin-t3code/`.

## HTML pages · researched for `html-artifacts` (2026-10-12, 2026-10-14)

Prior art for agents writing HTML for people. `html-artifacts` is my own skill; it borrows ideas from these, no files.

| Skill | What it does | |
|---|---|---|
| nicobailon/visual-explainer (MIT) | Explainer, diff-review and plan pages; figure-first rules, hand-drawn SVG, four visual "registers", slides and video | ✖ too heavy and a recognisable house style. Took: headings as claims, labeled arrows, the 390/1280 light/dark check |
| anthropics/skills frontend-design (Apache-2.0) | Distinctive product and marketing UI, with the best list of AI design tells | ✖ aimed at product UI. Took: the tells |
| anthropics/html-effectiveness (MIT) | 20 example pages from Thariq's "unreasonable effectiveness of HTML" post | ✖ examples only. Took: pages the reader can answer |
| dogum/html-artifacts (Apache-2.0) | When to use HTML vs markdown, a Playwright verify script, a tells list | ✖ its default CSS breaks its own rules. Took: the "would this just be headings and paragraphs?" test |
| plannotator/effective-html (MIT) | Router plus plan, diagram, wireframe and prototype skills | ✖ ties into its own CLI. Took: keep assumptions apart from decisions |
| f-labs-io/agent-html-skills (MIT) | 17 content skills with a submit-back listener | ✖ sprawling. Took: SVG text doesn't wrap, size boxes for it |
| pbakaus/impeccable | 24 design commands and a detector of 59 slop rules | ✖ big system on a binary. Took: the machine-checkable tells (side borders, kicker labels, content hidden at rest), "could this be any other product's page?" |
| leonxlnx/taste-skill | Taste rules for marketing pages, tells grouped in dated waves | ✖ wants motion on everything. Took: every "use this instead" look becomes the next tell, so give a procedure, not a style. This is why the template went |
| analyticalmonk/explain-this | Explainers with an outline check-in and a fact-check gate | ✖ long paragraphs. Took: back each claim or cut it |
| Anthropic artifact design guidance (Claude Code, unpublished) | How Claude.ai artifacts should look and draw diagrams | ✖ not a skill to copy. Took: one detail only this subject would have, draw the difference between options, complete at rest |

The research behind the rules (reading, perception, learning) is in `skills/html-artifacts/references/evidence.md`.
