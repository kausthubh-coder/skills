---
name: principle-prove-it-works
description: "Before you say done, check the real result, not a proxy. Use after any change: run the feature, read the actual value, inspect the diff. 'It compiles' or 'tests pass' is not proof."
user-invocable: false
---

# Prove It Works

Verify every task output by checking the real thing directly. Do not infer from proxies, self-reports, or "it compiles."

**Why:** Unverified work has unknown correctness. Indirect verification (file mtimes, output freshness, agent self-reports, cached screenshots) feels cheaper than direct observation. Acting on a wrong inference costs far more than checking the source.

Check the real thing, not a proxy:
- Check process liveness directly, not indirectly through derived state
- Read the actual value, not a cached or derived representation
- When verification fails, suspect the observation method before suspecting the system

## Run it before you review it again

A review reads the code; a run shows what the code does. Before another review or audit round, drive the real thing once: open the app, send the real message, run the real job. Once two review rounds in a row find only edge cases, stop reviewing and run it. In one project six audit and fix rounds took about 4.5 hours, and the bug that mattered (garbled output) showed up in the first real run.

## Script the check when you can

The strongest proof is a deterministic script that re-runs the same comparison, not a one-time eyeball. Write the script, run it, and keep its output as an artifact a reviewer can re-run instead of trusting your word.

Keep the artifact visible for the human. Commit it only for large or complex work where the trail has to be auditable later, like a big port or migration.
