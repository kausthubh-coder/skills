# Oracle

[![skills.sh](https://skills.sh/b/kausthubh-coder/oracle-skill)](https://skills.sh/kausthubh-coder/oracle-skill)

Oracle is a Codex-first agent skill for planning and implementing software through
project-local artifacts, isolated Git worktrees, independent implementation,
testing, and review tasks, and evidence-backed refinement loops.

## Install

Install Oracle globally for Codex:

```bash
npx skills add kausthubh-coder/oracle-skill \
  --skill oracle \
  --global \
  --agent codex \
  --yes
```

Install it into the current project for any agent supported by the `skills` CLI:

```bash
npx skills add kausthubh-coder/oracle-skill --skill oracle
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

- `oracle init` creates or repairs `.artifacts/`, `.design/`, `.sandbox/`,
  `human.md`, and `test.md` without changing product behavior.
- `oracle plan` researches the project and writes a dated, decision-grade HTML
  plan under `.artifacts/plans/`.
- `oracle implement` splits separable work into isolated lanes, gives each lane
  fresh implementation, testing, and review tasks, loops on evidence, integrates
  accepted checkpoints, and writes a dated conclusion under
  `.artifacts/conclusions/`.

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
