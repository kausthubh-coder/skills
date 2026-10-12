#!/usr/bin/env bash
set -euo pipefail

root="${1:-}"

if [ -z "$root" ]; then
  if git_root="$(git rev-parse --show-toplevel 2>/dev/null)"; then
    root="$git_root"
  else
    echo "Oracle init error: pass an explicit project root when not inside a Git repository" >&2
    exit 1
  fi
fi

if [ ! -d "$root" ]; then
  echo "Oracle init error: root does not exist: $root" >&2
  exit 1
fi

root="$(cd "$root" && pwd -P)"
skill_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
template="$skill_dir/assets/templates/artifact-template.html"
legacy_manifest_helper="$skill_dir/scripts/oracle_legacy_manifest.sh"
template_version="2"
template_filename="html-artifact-template-v${template_version}.html"
artifacts="$root/.artifacts"
workspace_state="$artifacts/.oracle-workspace"
template_destination="$artifacts/examples/$template_filename"
now="$(date +"%Y-%m-%d %H:%M:%S %Z")"
iso_now="$(date +"%Y-%m-%dT%H:%M:%S%z")"
project_name="$(basename "$root")"

html_escape() {
  printf '%s' "$1" \
    | sed -e 's/&/\&amp;/g' -e 's/</\&lt;/g' -e 's/>/\&gt;/g' -e 's/"/\&quot;/g'
}

project_name_html="$(html_escape "$project_name")"
now_html="$(html_escape "$now")"

require_directory_path() {
  local path="$1"
  if [ -L "$path" ] || { [ -e "$path" ] && [ ! -d "$path" ]; }; then
    echo "Oracle init error: managed path must be a real directory: $path" >&2
    exit 1
  fi
}

require_file_path() {
  local path="$1"
  if [ -L "$path" ] || { [ -e "$path" ] && [ ! -f "$path" ]; }; then
    echo "Oracle init error: managed path must be a regular file: $path" >&2
    exit 1
  fi
}

for managed_directory in \
  "$artifacts" \
  "$artifacts/runs" \
  "$artifacts/plans" \
  "$artifacts/designs" \
  "$artifacts/designs/workbench" \
  "$artifacts/demos" \
  "$artifacts/conclusions" \
  "$artifacts/examples" \
  "$artifacts/sandbox" \
  "$artifacts/sandbox/worktrees" \
  "$artifacts/sandbox/prototypes"; do
  require_directory_path "$managed_directory"
done

for managed_file in \
  "$artifacts/README.md" \
  "$workspace_state" \
  "$artifacts/human.html" \
  "$artifacts/test.md" \
  "$artifacts/legacy-migration.status" \
  "$artifacts/legacy-migration.md" \
  "$artifacts/legacy-manifest.tsv" \
  "$artifacts/designs/README.md" \
  "$artifacts/designs/index.json" \
  "$artifacts/designs/.gitignore" \
  "$artifacts/examples/README.md" \
  "$artifacts/examples/current-template.txt" \
  "$template_destination" \
  "$artifacts/sandbox/.gitignore" \
  "$artifacts/sandbox/README.md"; do
  require_file_path "$managed_file"
done

if [ ! -f "$template" ] || [ -L "$template" ]; then
  echo "Oracle init error: packaged HTML template is missing or unsafe: $template" >&2
  exit 1
fi

if [ ! -f "$legacy_manifest_helper" ] || [ -L "$legacy_manifest_helper" ]; then
  echo "Oracle init error: packaged legacy manifest helper is missing or unsafe: $legacy_manifest_helper" >&2
  exit 1
fi

mkdir -p \
  "$artifacts/runs" \
  "$artifacts/plans" \
  "$artifacts/designs/workbench" \
  "$artifacts/demos" \
  "$artifacts/conclusions" \
  "$artifacts/examples" \
  "$artifacts/sandbox/worktrees" \
  "$artifacts/sandbox/prototypes"

init_lock="$artifacts/.oracle-init.lock"
manifest_tmp=""
if ! mkdir "$init_lock" 2>/dev/null; then
  echo "Oracle init error: another initializer may own this project: $init_lock" >&2
  echo "Verify no Oracle initializer is active before removing a stale lock." >&2
  exit 1
fi

cleanup_init() {
  if [ -n "$manifest_tmp" ] && [ -f "$manifest_tmp" ]; then
    rm -f "$manifest_tmp"
  fi
  rmdir "$init_lock" 2>/dev/null || true
}
trap cleanup_init EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

if [ ! -f "$artifacts/README.md" ]; then
  cat > "$artifacts/README.md" <<'EOF'
# Oracle Artifacts

This is the project-local workspace for Oracle planning, design, testing,
isolated experiments, run evidence, demos, conclusions, and human documentation.

```text
.artifacts/
  .oracle-workspace
  human.html
  test.md
  legacy-manifest.tsv
  runs/
  plans/
  designs/
    workbench/
  demos/
  conclusions/
  examples/
    current-template.txt
    html-artifact-template-vN.html
  sandbox/
    prototypes/
    worktrees/
```

`.oracle-workspace` and `legacy-manifest.tsv` are durable integrity controls.
Legacy projects also contain `legacy-migration.md` and
`legacy-migration.status` after old root-level Oracle material is detected, even
when that material is later removed.

- Commit `human.html`, `test.md`, and useful plans, design decisions, examples,
  demos, conclusions, and safe run evidence when they belong in the PR.
- Keep `sandbox/worktrees/`, copied env files, auth state, caches, raw transcripts,
  private data, and machine-only evidence out of Git.
- Correlate run outputs with one `YYYYMMDD-HHMM-short-slug` identifier.
EOF
fi

if [ ! -f "$artifacts/human.html" ]; then
  cat > "$artifacts/human.html" <<EOF
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <title>$project_name_html - Human Project Guide</title>
  <style>
    :root { --bg:#f7f8fa; --surface:#fff; --text:#172026; --muted:#58656e; --line:#d7dde1; --accent:#006b75; --accent-soft:#dff3f5; --warn:#955900; --warn-soft:#fff0cf; --code:#edf1f3; --radius:6px; }
    @media (prefers-color-scheme:dark) { :root { --bg:#111619; --surface:#192126; --text:#edf2f4; --muted:#b2bec5; --line:#344149; --accent:#67cbd2; --accent-soft:#17383c; --warn:#f1bd6c; --warn-soft:#3b2c15; --code:#232d33; } }
    * { box-sizing:border-box; }
    html { scroll-behavior:smooth; }
    body { margin:0; background:var(--bg); color:var(--text); font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; font-size:16px; line-height:1.6; letter-spacing:0; }
    a { color:var(--accent); text-underline-offset:3px; }
    a:focus-visible { outline:3px solid var(--accent); outline-offset:3px; }
    code { padding:.1rem .3rem; background:var(--code); border-radius:4px; font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace; overflow-wrap:anywhere; }
    h1,h2,h3 { line-height:1.2; letter-spacing:0; }
    h1 { margin:.25rem 0 .75rem; font-size:3.5rem; overflow-wrap:anywhere; }
    h2 { margin:0; font-size:1.5rem; }
    h3 { margin-bottom:.35rem; font-size:1rem; }
    p,li,td,th,dd { overflow-wrap:anywhere; }
    .shell { width:min(100% - 2rem,1120px); margin:0 auto; }
    header { padding:3rem 0 2rem; border-bottom:1px solid var(--line); }
    .eyebrow { color:var(--accent); font-weight:750; text-transform:uppercase; overflow-wrap:anywhere; }
    .lede { max-width:760px; color:var(--muted); font-size:1.08rem; }
    .meta { display:flex; flex-wrap:wrap; gap:.5rem 1.25rem; margin-top:1.25rem; color:var(--muted); }
    nav { border-bottom:1px solid var(--line); background:var(--surface); }
    nav ul { display:flex; flex-wrap:wrap; gap:.5rem 1.1rem; margin:0; padding:.8rem 0; list-style:none; }
    nav a { color:var(--text); font-weight:650; text-decoration:none; }
    main section { padding:2.4rem 0; border-bottom:1px solid var(--line); }
    .section-head { display:grid; grid-template-columns:minmax(180px,.3fr) minmax(0,1fr); gap:2rem; }
    .section-head>p { margin-top:0; color:var(--muted); }
    .facts { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:.75rem; margin-top:1.4rem; }
    .fact { padding:1rem; border:1px solid var(--line); border-radius:var(--radius); background:var(--surface); }
    .fact strong { display:block; margin-bottom:.25rem; }
    .fact p { margin:0; color:var(--muted); }
    .flow { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:1.2rem; margin:1.5rem 0; padding:0; list-style:none; }
    .step { position:relative; padding:1rem; border-top:3px solid var(--accent); background:var(--surface); }
    .step:not(:last-child)::after { position:absolute; top:50%; right:-1rem; color:var(--muted); content:"->"; }
    .step span { display:block; color:var(--muted); }
    .table-wrap { overflow-x:auto; margin-top:1.25rem; }
    table { width:100%; min-width:620px; border-collapse:collapse; background:var(--surface); }
    th,td { padding:.75rem; border:1px solid var(--line); text-align:left; vertical-align:top; }
    th { background:var(--code); }
    .callout { padding:1rem; border-left:4px solid var(--warn); background:var(--warn-soft); }
    .links { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:.75rem; padding:0; list-style:none; }
    .links a { display:block; min-height:100%; padding:1rem; border:1px solid var(--line); border-radius:var(--radius); background:var(--surface); font-weight:700; }
    footer { padding:2rem 0 3rem; color:var(--muted); }
    @media (max-width:760px) { h1 { font-size:2.2rem; } .section-head,.facts,.flow,.links { grid-template-columns:1fr; } .section-head { gap:.4rem; } .step:not(:last-child)::after { top:auto; right:50%; bottom:-1.1rem; content:"down"; font-size:.75rem; } }
    @media (prefers-reduced-motion:reduce) { html { scroll-behavior:auto; } }
    @media print { :root { --bg:#fff; --surface:#fff; --text:#111; --muted:#444; --line:#aaa; --accent:#005963; --accent-soft:#e6f2f3; --warn:#784600; --warn-soft:#fff1d6; --code:#f2f2f2; } nav { display:none; } body { font-size:11pt; } a::after { content:" (" attr(href) ")"; font-size:.85em; } section,table,.fact,.step { break-inside:avoid; } }
  </style>
</head>
<body>
  <header>
    <div class="shell">
      <div class="eyebrow">Human project guide</div>
      <h1>$project_name_html</h1>
      <p class="lede">A durable map of what this project does, how it is structured, how to run and test it, and where humans and agents should make changes.</p>
      <div class="meta"><span>Project root <code>.</code></span><time datetime="$iso_now">Initialized $now_html</time></div>
    </div>
  </header>
  <nav aria-label="Project guide sections"><div class="shell"><ul>
    <li><a href="#overview">Overview</a></li><li><a href="#runbook">Runbook</a></li><li><a href="#architecture">Architecture</a></li><li><a href="#ownership">Ownership</a></li><li><a href="#testing">Testing</a></li><li><a href="#artifacts">Artifacts</a></li><li><a href="#history">History</a></li>
  </ul></div></nav>
  <main class="shell">
    <section id="overview"><div class="section-head"><h2>Project overview</h2><p>Replace starter text with verified product and repository facts. Keep public marketing in README; keep the operational truth here.</p></div>
      <div class="facts"><article class="fact"><strong>Purpose</strong><p>TBD</p></article><article class="fact"><strong>Audience</strong><p>TBD</p></article><article class="fact"><strong>Status</strong><p>Unverified starter guide</p></article></div>
    </section>
    <section id="runbook"><div class="section-head"><h2>Start here</h2><p>Document commands that were actually run, prerequisites, environment variable names, local URLs, and expected success signals.</p></div>
      <div class="table-wrap"><table><thead><tr><th>Task</th><th>Command</th><th>Expected result</th></tr></thead><tbody><tr><td>Install</td><td><code>TBD</code></td><td>TBD</td></tr><tr><td>Run</td><td><code>TBD</code></td><td>TBD</td></tr><tr><td>Build</td><td><code>TBD</code></td><td>TBD</td></tr><tr><td>Fast test</td><td><code>TBD</code></td><td>See <a href="test.md">test.md</a></td></tr></tbody></table></div>
    </section>
    <section id="architecture"><div class="section-head"><h2>Architecture</h2><p>Show the smallest useful system map. Replace nodes and connections with real entry points, services, state, storage, and external boundaries.</p></div>
      <ol class="flow" aria-label="Starter architecture flow"><li class="step"><strong>Interface</strong><span>Routes, screens, or commands</span></li><li class="step"><strong>Application</strong><span>Use cases and state</span></li><li class="step"><strong>Services</strong><span>APIs, workers, providers</span></li><li class="step"><strong>Data</strong><span>Storage and contracts</span></li></ol>
      <div class="callout"><strong>Known architecture gaps:</strong> TBD</div>
    </section>
    <section id="ownership"><div class="section-head"><h2>Surfaces and ownership</h2><p>Identify safe parallel boundaries and shared files that require sequencing.</p></div>
      <div class="table-wrap"><table><thead><tr><th>Surface</th><th>Entry points</th><th>Owner or boundary</th><th>Verification</th></tr></thead><tbody><tr><td>Web</td><td>TBD</td><td>TBD</td><td>TBD</td></tr><tr><td>CLI</td><td>TBD</td><td>TBD</td><td>TBD</td></tr><tr><td>Backend</td><td>TBD</td><td>TBD</td><td>TBD</td></tr><tr><td>Shared/generated</td><td>TBD</td><td>Sequence before dependent lanes</td><td>TBD</td></tr></tbody></table></div>
    </section>
    <section id="testing"><div class="section-head"><h2>Testing contract</h2><p>The executable project-specific testing guide is <a href="test.md">.artifacts/test.md</a>. Keep auth, browser, device, fixtures, reset, and full click-through instructions there.</p></div></section>
    <section id="artifacts"><div class="section-head"><h2>Oracle workspace</h2><p>All Oracle-managed project material lives under this one <code>.artifacts/</code> tree.</p></div>
      <ul class="links"><li><a href="plans/">Plans</a></li><li><a href="designs/">Designs and workbench</a></li><li><a href="runs/">Run evidence</a></li><li><a href="demos/">Demos</a></li><li><a href="conclusions/">Conclusions</a></li><li><a href="examples/">Examples</a></li><li><a href="sandbox/">Sandbox</a></li><li><a href="test.md">Testing guide</a></li></ul>
    </section>
    <section id="history"><div class="section-head"><h2>Change history</h2><p>Add one concise dated entry after meaningful architecture, workflow, command, or ownership changes.</p></div><div class="table-wrap"><table><thead><tr><th>Date</th><th>Revision/run</th><th>Change</th><th>Evidence</th></tr></thead><tbody><tr><td>$now_html</td><td>Oracle init</td><td>Created consolidated project guide</td><td>Starter content requires project verification</td></tr></tbody></table></div></section>
  </main>
  <footer><div class="shell"><strong>Provenance:</strong> created by Oracle init on <time datetime="$iso_now">$now_html</time>; repository-relative root <code>.</code>; revision and verified evidence pending. Update this page after accepted integration and link the relevant run, plan, tests, and conclusion. Never include secret values, auth state, private data, or unsupported claims.</div></footer>
</body>
</html>
EOF
fi

if [ ! -f "$artifacts/test.md" ]; then
  cat > "$artifacts/test.md" <<EOF
# Oracle Project Testing Guide

Project-specific operating manual for agents and developers. Keep this accurate
to the real project and link verified evidence from \`.artifacts/runs/\`.

## Testing Contract

- Definition of done:
- Fastest reliable smoke test:
- Full verification path:
- Required regression boundary:
- Preferred interactive tool: Browser Use / Computer Use / ADB / project-native CLI
- Lane loop: implementation task -> frozen checkpoint -> fresh testing task -> fresh review/scoring task -> fix with fresh tasks -> repeat
- Rule: test and review the same immutable checkpoint; testers report failures but do not edit production source

## Commands

- Install:
- Run app:
- Lint/typecheck:
- Unit tests:
- Integration tests:
- End-to-end tests:
- Build/codegen/contracts:

## Browser Testing

- Dev server command and local URL:
- Browser tool and profile owner:
- Viewports:
- Routes and complete affected click-through:
- Required env variable names:
- Test user and auth flow:
- Clerk agentic-task/browser login flow, when Clerk is used:
- Fixtures, seed, reset, and cleanup:
- Console/network/screenshot evidence:

## Auth And Data

- Auth provider:
- Data/backend provider:
- Signed-in test-session procedure:
- Signed-out and permission-denied coverage:
- Seed/reset procedure:
- Exclusive mutable resources:

## Native And Mobile Testing

- Expo/dev-client/build command:
- Android emulator/device and ADB commands:
- iOS simulator/device:
- Computer Use flow:
- Permissions, offline, error, recovery, and full click-through scope:

## CLI Testing

- Build/install command:
- Working directory and fixtures:
- Commands, arguments, stdin, stdout/stderr, and exit codes:
- Filesystem/config/env effects:
- Invalid input, retries, idempotency, interruption, and cleanup:

## Manual Smoke Checklist

- [ ] App or executable starts
- [ ] Main happy path works
- [ ] Every affected route, screen, command, control, and keyboard path was exercised
- [ ] Auth/session and permission states were checked when relevant
- [ ] Browser Use, Computer Use, or device tooling covered affected UI flows
- [ ] Loading, empty, error, network, responsive, recovery, and rollback states were checked
- [ ] Data persisted or reset as expected
- [ ] Exact checkpoint SHA/build identity and evidence paths were recorded

## Known Issues And External Boundaries

- Flaky tests:
- Unsupported local flows:
- External services required:
- Manual-only checks:

## Last Verified Update

- $now: Starter guide created; commands and flows are not yet project-verified.
EOF
fi

if [ ! -f "$artifacts/designs/README.md" ]; then
  cat > "$artifacts/designs/README.md" <<'EOF'
# Oracle Designs

`designs/` stores exported design decisions. `designs/workbench/` stores runnable,
project-shaped UI explorations and variants.

```text
designs/
  <run-id>-design.html
  index.json
  workbench/
    <run-id>/
      brief.md
      manifest.json
      context/
      variants/
      review/
      exports/
```

Each variant states what is real, copied, mocked, or fake and how to run it. Do
not store secrets, production data, dependency caches, or unrelated backend code.
EOF
fi

if [ ! -f "$artifacts/designs/index.json" ]; then
  cat > "$artifacts/designs/index.json" <<EOF
{
  "version": 2,
  "purpose": "Oracle design records and runnable workbench",
  "updatedAt": "$now",
  "runs": []
}
EOF
fi

if [ ! -f "$artifacts/designs/.gitignore" ]; then
  cat > "$artifacts/designs/.gitignore" <<'EOF'
# Design-workbench dependencies and generated output
workbench/**/node_modules/
workbench/**/.next/
workbench/**/.expo/
workbench/**/dist/
workbench/**/build/
workbench/**/coverage/
workbench/**/.cache/
workbench/**/.DS_Store

# Never keep local secrets in design workspaces
workbench/**/.env
workbench/**/.env.*
!workbench/**/.env.example
!workbench/**/.env.sample
!workbench/**/.env.template
!workbench/**/.env.dist
EOF
fi

if [ ! -f "$artifacts/sandbox/.gitignore" ]; then
  cat > "$artifacts/sandbox/.gitignore" <<'EOF'
# Oracle local sandbox machinery
worktrees/
env/
prototypes/**/node_modules/
prototypes/**/.next/
prototypes/**/.expo/
prototypes/**/dist/
prototypes/**/build/
prototypes/**/.cache/

# Local env files copied for runnable sandboxes
**/.env
**/.env.*
!**/.env.example
!**/.env.sample
!**/.env.template
!**/.env.dist
EOF
fi

if [ ! -f "$artifacts/sandbox/README.md" ]; then
  cat > "$artifacts/sandbox/README.md" <<'EOF'
# Oracle Sandbox

Project-local isolation for prototypes and Git worktrees.

- Standalone prototype: `prototypes/<run-id>-<lane-id>/`
- Existing-project worktree: `worktrees/<run-id>-<lane-id>/`
- Codex-managed task worktrees may live elsewhere; record their actual paths,
  branches, and checkpoint SHAs in `.artifacts/runs/<run-id>/threads.md`.

Never commit worktree directories, copied env files, credentials, auth state,
dependency caches, or machine-private evidence.
EOF
fi

if [ ! -f "$artifacts/examples/README.md" ]; then
  cat > "$artifacts/examples/README.md" <<'EOF'
# Oracle Examples

- `current-template.txt` names the newest installed, immutable, versioned HTML
  template for plans, design records, conclusions, comparisons, and status
  artifacts.
- Copy the template to its final destination, replace placeholders, remove
  irrelevant example sections, and verify it in a browser at desktop and mobile
  widths.
- Do not edit a versioned template in place. Copy it first. A future Oracle init
  can add a newer version without overwriting prior examples or project output.
- Keep real project facts in final artifacts. Examples must not be mistaken for
  verified evidence.
EOF
fi

if [ -f "$template_destination" ] && ! cmp -s "$template" "$template_destination"; then
  echo "Oracle init error: immutable versioned HTML template differs from the packaged template: $template_destination" >&2
  echo "Move the customized file to a new artifact name, then rerun Oracle init." >&2
  exit 1
fi

if [ ! -f "$template_destination" ]; then
  cp "$template" "$template_destination"
  chmod 644 "$template_destination"
fi
printf '%s\n' "$template_filename" > "$artifacts/examples/current-template.txt"

legacy_seen_before="no"
if [ -f "$workspace_state" ]; then
  if ! grep -qx 'oracle-workspace-version=2' "$workspace_state"; then
    echo "Oracle init error: unsupported or damaged workspace state: $workspace_state" >&2
    exit 1
  fi
  if grep -qx 'legacy-migration-seen=yes' "$workspace_state"; then
    legacy_seen_before="yes"
  elif ! grep -qx 'legacy-migration-seen=no' "$workspace_state"; then
    echo "Oracle init error: workspace state is missing its legacy migration marker: $workspace_state" >&2
    exit 1
  fi
fi

migration_history_found="$legacy_seen_before"
if [ -e "$artifacts/legacy-migration.status" ] \
  || [ -e "$artifacts/legacy-migration.md" ] \
  || [ -s "$artifacts/legacy-manifest.tsv" ]; then
  migration_history_found="yes"
fi

manifest_tmp="$artifacts/.legacy-manifest.tmp.$$"
bash "$legacy_manifest_helper" "$root" > "$manifest_tmp"

manifest_changed="yes"
if [ -f "$artifacts/legacy-manifest.tsv" ] \
  && cmp -s "$manifest_tmp" "$artifacts/legacy-manifest.tsv"; then
  manifest_changed="no"
fi
mv "$manifest_tmp" "$artifacts/legacy-manifest.tsv"
manifest_tmp=""

if [ -s "$artifacts/legacy-manifest.tsv" ] || [ "$migration_history_found" = "yes" ]; then
  printf '%s\n' \
    'oracle-workspace-version=2' \
    'legacy-migration-seen=yes' > "$workspace_state"

  if [ "$manifest_changed" = "yes" ] || [ ! -f "$artifacts/legacy-migration.status" ]; then
    printf '%s\n' "pending" > "$artifacts/legacy-migration.status"
  fi

  if [ "$manifest_changed" = "yes" ] \
    || [ ! -f "$artifacts/legacy-migration.md" ] \
    || ! grep -qx '# Oracle Legacy Migration' "$artifacts/legacy-migration.md" \
    || ! grep -qx '## Required Reconciliation' "$artifacts/legacy-migration.md"; then
    {
      printf '%s\n\n' '# Oracle Legacy Migration'
      printf '%s\n\n' 'Legacy Oracle migration state was detected. Reconcile useful legacy content into the canonical `.artifacts/` workspace and verify any removals before starting a plan or implementation run.'
      printf '%s\n' '## Legacy Paths'
      if [ -s "$artifacts/legacy-manifest.tsv" ]; then
        while IFS=$'\t' read -r _legacy_kind legacy_relative _legacy_fingerprint; do
          printf -- '- `%s`\n' "$legacy_relative"
        done < "$artifacts/legacy-manifest.tsv"
      else
        printf '%s\n' '- No current legacy paths. A prior inventory changed to empty; verify that every removal was intentional and that useful content was reconciled.'
      fi
      printf '%s\n' \
        '' \
        '## Required Reconciliation' \
        '' \
        '1. Verify that missing legacy paths were intentionally removed; restore them first if deletion was accidental.' \
        '2. Merge operational testing instructions into `.artifacts/test.md`.' \
        '3. Merge durable codebase knowledge into `.artifacts/human.html`.' \
        '4. Move design prototypes only after verifying dependencies and paths.' \
        '5. Never move a registered live Git worktree directory by hand; use `git worktree` operations.' \
        '6. After verifying the canonical files, replace `pending` with `reconciled` in `.artifacts/legacy-migration.status`.' \
        '' \
        'Oracle fingerprints the full non-generated legacy tree in `.artifacts/legacy-manifest.tsv`. Added, changed, or removed legacy content resets the status to `pending`, and run start independently verifies the current tree against this manifest.'
    } > "$artifacts/legacy-migration.md"
  fi

  if [ -s "$artifacts/legacy-manifest.tsv" ]; then
    echo "Oracle init notice: legacy Oracle paths were preserved:" >&2
    while IFS=$'\t' read -r _legacy_kind legacy_relative _legacy_fingerprint; do
      echo "  $root/$legacy_relative" >&2
    done < "$artifacts/legacy-manifest.tsv"
  else
    echo "Oracle init notice: the prior legacy inventory is now empty; verify that removals were intentional." >&2
  fi
  if [ "$(sed -n '1p' "$artifacts/legacy-migration.status")" != "reconciled" ]; then
    echo "Oracle runs are blocked until .artifacts/legacy-migration.status is set to reconciled after manual review." >&2
  fi
else
  printf '%s\n' \
    'oracle-workspace-version=2' \
    'legacy-migration-seen=no' > "$workspace_state"
fi

echo "Oracle workspace initialized at: $root"
echo "Confirmed:"
echo "  $artifacts/human.html"
echo "  $artifacts/test.md"
echo "  $artifacts/runs"
echo "  $artifacts/plans"
echo "  $artifacts/designs"
echo "  $artifacts/designs/workbench"
echo "  $artifacts/demos"
echo "  $artifacts/conclusions"
echo "  $artifacts/examples"
echo "  $artifacts/sandbox"
echo "  $artifacts/sandbox/prototypes"
echo "  $artifacts/sandbox/worktrees"
