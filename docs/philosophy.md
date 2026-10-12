# Philosophy

What I believe about building software with agents, and why. Every skill in this library should follow from something here. When a skill contradicts this file, fix the skill or argue for changing this file. Don't let them drift apart quietly.

Most of this came out of an X thread I wrote (2026-10-11, @KausthubhOS) and the research behind it. Sources are at the end.

## The premise

Readability still matters, but the main reader is now the agent. Agents don't get tired of messy code. They pay for it in other ways: context spent, wrong guesses, and copying the wrong pattern. So "quality" means something different now.

> old question: is this elegant?
> new question: can an agent change this safely without reading the whole repo?

## 1. Observability and verifiability (close the loop)

The agent needs a way to check its own work. The problem is what agents count as checking. They write tests that would pass if every function returned undefined, curl one endpoint, see green and call it done, while the app is still broken.

What actually helps:

- The app boots in its own worktree with one command.
- The agent can use it like a user would (browser, CLI, API).
- It can read the logs, screenshots and database state.
- Real-shaped seed data, not an empty database.
- Tests that check what the user sees, not that a function got called.
- Checks fast enough to rerun after every change.
- A doctor command, so broken setup shows up before the task, not halfway through it.

In this library: `create-verification-skill`, `maintain-verification-skill`, `principle-prove-it-works`, `principle-test-behavior-not-implementation`, `evidence-driven-testing`, and the setup/doctor scripts `/init-project` adds.

## 2. Guide it with the codebase, not the prompt

Agents optimize for whatever you check. If the only check is "tests pass", you get tests that pass, not code that works. They also copy whatever the code around them already does. If there are two ways to do something, they copy whichever one they saw first. A rule in AGENTS.md gets missed once the context is long.

So put the rules in the repo:

- One way to do each thing. Finish migrations and delete the old pattern.
- Types that make the wrong thing not compile.
- Lint rules whose error message tells the agent what to use instead.
- A clear "done" set before the work starts.

If you correct an agent for the same thing twice, turn it into a check. The order of strength: make it impossible (structure, types), then a lint rule, then a test, then docs last, because nothing fails when an agent skips a doc.

In this library: `correct`, `codebase-design`, the "Rules and what enforces them" table in `AGENTS.base.md`.

## 3. Make it easy to find

An agent only knows what it reads. Every extra file it opens to understand one feature eats context. T3 Code's AGENTS.md says their most common bug is a change that works on the path the agent tested and is missing everywhere else: it never found the other places.

What helps:

- Vertical slices: everything for one feature in one folder (UI, logic, data, tests), not split across `components/`, `hooks/`, `services/`.
- Names you can grep. No magic strings or wiring that only exists at runtime.
- One source of truth for shared types, so changing it breaks everything that uses it loudly.
- A short AGENTS.md (about 100 lines) that works as a map into `docs/`, not a giant rulebook. OpenAI started with one big file; it crowded out the task and went stale within weeks.
- A comment on why weird code exists, so the agent doesn't "clean it up".

Test: can a fresh agent answer "where does X come from?" and "what can change X?" quickly?

In this library: `layout.md` in `init-project`, `principle-minimize-reader-load`, `code-structure`, `writing-for-agents`.

## 4. Some clean-code advice flips

A lot of clean-code advice was made for humans reading code over years.

- A bit of duplication is fine if it keeps a feature in one place.
- A wrapper with one caller is just another file to open.
- Framework magic the agent can't see is a bug waiting to happen.
- Boring, popular tech the model already knows beats the new shiny thing. Don't build a new framework for agents; agents are best at what's all over their training data. Build tooling around existing frameworks.

## 5. Models are good now; don't build for the old ones

A lot of published advice (held-out benchmarks, read-only test files, elaborate anti-cheating setups, long "how to think" procedures) was written for weaker models. Current models are well aligned and capable. The job is to point them in the right direction and let them see results, not to police them.

The sorting question for anything we build: **would this still be useful if the model got 10x smarter?**

- **Ages well:** ways for the agent to see the app (harnesses, doctors, logs, deep links), sources of truth (real data, benchmarks, reference implementations), mechanical rules (types, lint, CI). A smarter model still can't know whether your app works without running it.
- **Goes stale:** elaborate prompt procedures, multi-step "how to think" skills, orchestration that makes up for weak models.

## 6. How skills should be written

- **Few global skills.** Every global skill's description is in context in every session of every agent. A skill that isn't used is noise.
- **Specific beats generic.** A skill about *my* stack, *my* tiers or *my* app's launch steps beats "write good code". Repo-specific skills live in the repo.
- **Steer, don't script.** Say what good looks like and why; leave the how to the model unless the steps are genuinely fixed (CLI commands, paths).
- **Description first.** Front-load the trigger, one trigger per branch (`writing-for-agents`).
- **Plain prose.** Run `unslop` on anything a person reads.
- **Copy, don't depend.** Adopt good upstream skills by copying them (license permitting) and recording the changes in `sources.json`, so they don't change under me.
- **Taste is a preference, not a rule.** Write preferences as "I usually…" so the agent can deviate when the project calls for it (naming is the example).

## Sources

- Cursor pstack skills: github.com/cursor/plugins/tree/main/pstack/skills (`create-verification-skill`, `test-behavior-not-implementation`, `correct`, `encode-lessons-in-structure`, `minimize-reader-load`)
- T3 Code: github.com/pingdotgg/t3code (AGENTS.md, `oxlint-plugin-t3code`, `packages/contracts`)
- OpenAI, harness engineering: openai.com/index/harness-engineering
- Anthropic, effective harnesses for long-running agents: anthropic.com/engineering/effective-harnesses-for-long-running-agents
- Chroma, context rot: research.trychroma.com/context-rot
