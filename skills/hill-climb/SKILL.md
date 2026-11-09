---
name: hill-climb
description: Improve something step by step against a score until it stops getting better. Use when I say "hill climb".
disable-model-invocation: true
---

# Hill climb

A hill climb is a loop: measure, make one change, measure again, keep it if the score went up and nothing else got worse, revert it if not. Agents are good at this because they don't tire of the loop, and the score tells them the truth about each change instead of their own guess. A port that keeps every test green while it gets faster, or a page whose load time drops change by change, is a hill climb.

The climb is only as good as the score. Most of the work is picking one that moves when the thing really gets better.

## First, the plan

Before you change anything, tell me and wait for my go:

- **Score:** the number you'll push up or down, and how you'll measure it.
- **Guardrails:** what must not get worse (tests, other metrics, quality). A change that breaks one is reverted, however good its score.
- **Baseline:** the score now.
- **Stop:** when you'll call it done (target, gains flatten, or a budget of rounds).

Two kinds of score:

- **Measured** (load time, bundle size, test pass rate, benchmark): run it the same way every time, several runs, and treat a gain smaller than the run-to-run noise as no gain. Follow `benchmark-checklist`.
- **Judged** (UI/UX feel, how a component reads, writing): write a rubric of named criteria (type, whitespace, hierarchy, ...) and have a council of models from my subscriptions score against it, using the models I name or the best ones `orchestrator_capabilities` lists. Each judge scores alone and doesn't see the others. Score the best apps in the niche on the same rubric, so the number means something. The spread between judges is the noise.

## Then, climb

- One change per round, so you know what moved the score.
- Keep a log in the repo: round, change, score, kept or reverted. Commit each kept change.
- When a change fails, work out why, and let that pick a different next idea.
- At the end, show me the curve, what helped most, and what you tried that didn't.
