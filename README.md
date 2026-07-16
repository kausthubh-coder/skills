# Oracle

[![skills.sh](https://skills.sh/b/kausthubh-coder/skills)](https://skills.sh/kausthubh-coder/skills)

Oracle is a Codex-first agent skill for planning and implementing software through
one structured project-local `.artifacts/` workspace, isolated Git worktrees,
independent implementation, testing, and review tasks, polished HTML decision
pages, and evidence-backed refinement loops.

## Install

Install Oracle globally for Codex:

```bash
npx skills add kausthubh-coder/skills \
  --skill oracle \
  --global \
  --agent codex \
  --yes
```

Install it into the current project for any agent supported by the `skills` CLI:

```bash
npx skills add kausthubh-coder/skills --skill oracle
```

The repository will appear on skills.sh automatically after the public GitHub
source is installed through the `skills` CLI. There is no separate submission
form.

## Commands

```text
oracle init [project root]
oracle plan <goal>
oracle implement <goal or plan>
```

- `oracle init` creates or repairs `.artifacts/human.html`, `.artifacts/test.md`,
  plans, designs and runnable variants, examples, demos, conclusions, run
  evidence, prototypes, and sandbox worktrees without changing product behavior.
- `oracle plan` researches the project and writes a dated, decision-grade HTML
  plan under `.artifacts/plans/`.
- `oracle implement` splits separable work into isolated lanes, gives each lane
  fresh implementation, testing, and review tasks, loops on evidence, integrates
  accepted checkpoints, and writes a dated conclusion under
  `.artifacts/conclusions/`.

HTML artifacts follow a shared offline-friendly visual standard. They use
structured summaries, architecture or dependency diagrams, timelines,
comparison tables, test matrices, and score plots when those representations
make the evidence easier to understand.

In Codex, invoke the skill directly:

```text
$oracle init
$oracle plan redesign the onboarding flow
$oracle implement the accepted onboarding plan
```

## Compatibility

The workspace, planning, testing, artifact, and Git contracts are portable. The
full implementation workflow is Codex-first because it relies on real Codex
tasks/threads for independent implementation, testing, and review roles. An
agent without equivalent task orchestration should not claim that it completed
the full Oracle loop.

Oracle never grants permission to push, deploy, mutate production data, or
expose secrets. Those actions still require explicit user authority.

## Repository Layout

```text
skills/oracle/
  SKILL.md
  agents/openai.yaml
  assets/templates/
  references/
  scripts/
  tests/
```

The `skills/oracle/` directory is the complete installable unit. Repository
documentation and license files remain outside the installed skill.

## Development

Run the deterministic regression suite:

```bash
bash skills/oracle/tests/oracle_scripts_test.sh
bash tests/html_artifacts_test.sh
```

Check local discovery with the official CLI:

```bash
npx skills add . --list
```

Test a disposable install before publishing:

```bash
bash tests/skills_cli_smoke.sh
```

## License

MIT
