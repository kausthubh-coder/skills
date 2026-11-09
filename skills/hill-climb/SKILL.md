---
name: hill-climb
description: Improve something step by step against a score until it stops getting better. Use when I say "hill climb".
disable-model-invocation: true
---

# Hill climb

A hill climb is a loop of change, measure, keep or revert. Agents climb well because they don't tire, and the score tells them the truth about each change. The climb is only as good as the score: pick one that moves when the thing really gets better, plus guardrails that must not get worse (tests, other metrics, quality).

If my prompt already says what to score and when to stop, start. If not, propose the score, guardrails and stop, and wait for my go.

- **Measured** (load time, bundle size, benchmark): follow `benchmark-checklist`. A gain inside the noise is no gain.
- **Judged** (UI/UX feel, writing): a rubric scored by a council of models from my subscriptions (the ones I name, or the best `orchestrator_capabilities` lists), each judging alone. Score the best apps in the niche on the same rubric. The judges' spread is the noise.

Log each round in the repo (change, score, kept or reverted), commit what you keep, and end with the curve and what helped.
