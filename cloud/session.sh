#!/bin/bash
# Gives a cloud session (Claude Code on the web, Codex Cloud) what my local agents have: the global skills
# from this library and Critly, my global rules, and a note on working in the cloud. A cloud VM starts from a
# bare clone of one repo, without any of that.
#
# Each repo's scripts/cloud.mjs runs this (Claude: SessionStart hook; Codex: the environment's setup script):
#   curl -fsSL https://raw.githubusercontent.com/kausthubh-coder/skills/main/cloud/session.sh | bash
#
# Safe to rerun. stdout becomes the session's context in Claude Code, so it prints only the rules; progress
# goes to stderr.
set -u
log() { echo "cloud: $*" >&2; }

fetch() { # fetch <repo> <dir>: shallow clone, or fast-forward an earlier one
  if [ -d "$2/.git" ]; then git -C "$2" pull -q --ff-only >&2 || log "couldn't update $2"
  else git clone -q --depth 1 "https://github.com/kausthubh-coder/$1" "$2" >&2 || log "couldn't clone $1"; fi
}
fetch skills ~/.cloud/agent-skills
fetch critly ~/.cloud/critly

# Link every skill into both agents' user folders. Claude Code picks up new skills in ~/.claude/skills mid-session.
n=0
for home in ~/.claude/skills ~/.agents/skills; do
  mkdir -p "$home"
  for s in ~/.cloud/agent-skills/skills/*/ ~/.cloud/critly/skills/*/; do
    [ -f "$s/SKILL.md" ] || continue
    name=$(basename "$s")
    [ -e "$home/$name" ] || { ln -s "$s" "$home/$name"; n=$((n + 1)); }
  done
done
log "linked $n skill folders"

# Commit as me. The VM commits as Claude, and Vercel's Hobby plan won't deploy a commit whose author isn't on the
# project: krida's first ship from the cloud landed on main and never went live. Set in the repo, since the cloud
# may set its own repo-level author.
if git rev-parse --git-dir >/dev/null 2>&1; then
  git config user.name "Kausthubh Nandimandalam"
  git config user.email "69598472+kausthubh-coder@users.noreply.github.com"
  log "git author set for $(basename "$(git rev-parse --show-toplevel)")"
fi

# Global rules for the next agent start (Codex reads ~/.codex/AGENTS.md; Claude reads ~/.claude/CLAUDE.md at launch).
rules=$(cat ~/.cloud/agent-skills/global/skills.md ~/.cloud/agent-skills/cloud/CLOUD.md 2>/dev/null)
mkdir -p ~/.claude ~/.codex
printf '%s\n' "$rules" > ~/.claude/CLAUDE.md
printf '%s\n' "$rules" > ~/.codex/AGENTS.md

# This session already started, so hand it the rules now.
printf '%s\n' "$rules"
