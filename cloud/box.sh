#!/bin/bash
# Sets up my InstaBox machine as a T3 machine: bun, my git identity, my global skills and rules (with BOX.md
# instead of CLOUD.md), and my repos in ~/dev with their .claude/skills links. T3's own server is installed
# separately (t3.codes/install.sh, then `t3 service install`).
#
#   instabox ssh t3 -- 'curl -fsSL https://raw.githubusercontent.com/kausthubh-coder/skills/main/cloud/box.sh | bash'
#
# Safe to rerun: it clones what's missing and fast-forwards nothing else. Private repos need `gh auth login` first;
# until then they're skipped and listed.
set -u
log() { echo "box: $*" >&2; }

export PATH="$HOME/.local/bin:$HOME/.bun/bin:$PATH"
for rc in ~/.profile ~/.bashrc; do
  grep -q '.bun/bin' "$rc" 2>/dev/null || echo 'export PATH="$HOME/.local/bin:$HOME/.bun/bin:$PATH"' >> "$rc"
done
command -v bun >/dev/null || { curl -fsSL https://bun.sh/install | bash >&2 && log "installed bun"; }
# Vercel's CLI globally; Convex and Clerk run from each project (bunx convex, bunx clerk@latest).
command -v vercel >/dev/null || { bun add -g vercel >/dev/null 2>&1 && log "installed vercel"; }

# My laptop's identity, so Vercel deploys these commits too.
git config --global user.name "Kausthubh Nandimandalam"
git config --global user.email "kvnandim@ncsu.edu"
gh auth status >/dev/null 2>&1 && gh auth setup-git >&2

# Global skills and rules. stdout is only for a Claude hook, so drop it here.
curl -fsSL https://raw.githubusercontent.com/kausthubh-coder/skills/main/cloud/session.sh | CLOUD_RULES=BOX.md bash >/dev/null

# Repos: ~/dev/<repo>, named as on GitHub. `t3 project add` fails while T3's service is still starting.
mkdir -p ~/dev
for _ in $(seq 30); do systemctl --user is-active -q t3code 2>/dev/null && break; sleep 2; done
skipped=()
for repo in krida kriyan likh loka megha critly portfolio inky amy; do
  dir=~/dev/$repo
  if [ ! -d "$dir/.git" ]; then
    gh repo clone "kausthubh-coder/$repo" "$dir" -- -q >&2 2>/dev/null \
      || git clone -q "https://github.com/kausthubh-coder/$repo" "$dir" 2>/dev/null \
      || { skipped+=("$repo"); continue; }
    log "cloned $repo"
  fi
  # Repo skills live in .agents/skills; Claude reads .claude/skills, a gitignored link on my laptop.
  if [ -d "$dir/.agents/skills" ] && [ ! -e "$dir/.claude/skills" ]; then
    mkdir -p "$dir/.claude" && ln -s ../.agents/skills "$dir/.claude/skills"
  fi
  # A T3 project titled as on my laptop, so T3 shows one project with both machines. Fails quietly if added.
  case $repo in loka) title=Loka ;; portfolio) title=kausthubh-portfolio ;; inky) title=studi-2 ;; *) title=$repo ;; esac
  command -v t3 >/dev/null && t3 project add "$dir" --title "$title" >/dev/null 2>&1 && log "added $title to T3"
done
[ ${#skipped[@]} -gt 0 ] && log "not cloned (sign in with gh auth login, then rerun): ${skipped[*]}"
log "done"
