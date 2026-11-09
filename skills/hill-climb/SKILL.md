---
name: hill-climb
description: Improve something step by step against a score until it stops getting better. Use when I say "hill climb".
disable-model-invocation: true
---

# Hill climb

Hill climbing uses agents to keep improving one or more metrics: measure, look for what could make it better, change that, measure again to see if it did, and loop. The score keeps the agents honest, so the climb is only as good as the metrics. Pick ones that move when the thing really gets better, and watch that nothing else gets worse along the way.

If my prompt leaves the metric or when to stop unclear, suggest them and wait for my go.

Metrics come in two kinds:

- Measured ones like load time, bundle size or a benchmark: run them the same way each time (`benchmark-checklist`) and ignore gains inside the noise.
- Judged ones like UI/UX feel or writing: a rubric scored by a council of models from my subscriptions (the ones I name, or the best `orchestrator_capabilities` lists), each scoring on its own. Score the best apps in the niche the same way, so you know what good looks like.

Keep a log of the rounds in the repo and show me how the score moved at the end.
