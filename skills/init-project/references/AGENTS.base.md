# {{Project name}}

{{One paragraph: what this is, who uses it, and what they care about most. Name the stack in one line.}}

## Words we use

- **you**: the agent reading this file.
- **me**: the developer you are working for.
- **user**: the person who uses the product. Not me.
- {{domain terms an agent would otherwise guess wrong}}

## Map

| Where | What lives there |
|---|---|
| {{path}} | {{what}} |

Each feature lives in one folder with its UI, logic, data access and tests. Shared code goes in {{path}} only when two features really use it.

Deeper docs: {{docs/ index, or delete this line}}

## Commands

- Install: `{{cmd}}`
- Setup a fresh worktree: `{{cmd}}` (installs deps, copies dev env from the main checkout, picks a free port)
- Doctor: `{{cmd}}` (is this checkout and its backend healthy? run it first when anything looks off)
- Dev: `{{cmd}}` (port comes from `PORT`; ready when {{signal}})
- Test one file: `{{cmd}}`
- Typecheck and lint the files you changed: `{{cmd}}`
- Full check (CI runs this; run it only when asked): `{{cmd}}`

## Proving a change works

- Done means you saw it work, not that it compiles. Run the feature the way a user would and look at the result.
- Use the `verify-{{app}}` skill to launch, drive and capture evidence. If it does not exist yet, run `/create-verification-skill`.
- Test with real-shaped data: {{how to seed or copy data}}. An empty database is a bad test.
- A test calls the code the way its users do and asserts the exact result. Delete tests that would pass if every function returned undefined.
- Never edit or delete a test to make it pass. If the test is wrong, say so and explain why.
- A skipped check is not a pass. Report what you ran, what you saw, and what you did not check.
- Done means: verified, with evidence, and committed.

## Working with me

- A question gets an answer, not an action.
- When I ask for a plan, plan. Don't start building until I say go.
- Extend what exists. Propose a rewrite only in a plan, and wait.
- Edit files with your edit tool, not shell one-liners (Windows quoting breaks them).

## How we write code

- Boring and explicit over clever. If it is not written where it happens, you cannot see it, so avoid hidden wiring and magic strings.
- One way to do each thing. Finish migrations and delete the old way in the same change.
- A wrapper with one caller is just another file to open. Inline it.
- Names you can grep.
- Comments say why, never what. Keep the why next to weird code so nobody "cleans it up".
- Smallest change that solves the real problem. No scope creep.

## Rules and what enforces them

| Rule | Enforced by |
|---|---|
| {{rule}} | {{lint rule / type / test / script, or "nothing yet"}} |

When I correct you for the same thing twice, add the rule here and make something enforce it (`/correct`).

## Safety

- Never touch my live data, accounts or profiles: {{paths}}. Copy data in, never write back.
- Production needs my explicit go: deploys, `--prod` commands, releases, cloud builds, repo renames. Prod commands live in `docs/ops.md`, not here.
- Each worktree uses its own dev backend ({{local backend or preview}}), never production.
- Stop only processes you started, by the PID you captured. Never kill by name.
- No secrets in code, logs, screenshots or commits.
- Git: {{personal: once a change is verified, commit it and merge your branch into `main` | public: open a PR and wait for CI and my review}}.
