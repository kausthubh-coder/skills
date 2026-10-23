#!/bin/bash
# Sets up my InstaBox machine as a T3 machine: bun, my git identity, my global skills and rules (with BOX.md
# instead of CLOUD.md), and my repos in ~/dev with their .claude/skills links. T3's own server is installed
# separately (t3.codes/install.sh, then `t3 service install`). T3 Connect: `t3 connect --headless` (I approve the
# code), then `systemctl --user restart t3code`, or the server never opens its tunnel; `t3 connect status` checks.
# A machine cloned from a snapshot needs its own T3 identity (stop the service, delete environment-id,
# server-owner.sqlite*, statev2.sqlite* and secrets under ~/.t3/userdata) and its own `claude` login.
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
for repo in krida kriyan likh loka megha critly portfolio inky amy potli taru; do
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
  case $repo in loka) title=Loka ;; portfolio) title=kausthubh-portfolio ;; inky) title=studi-2 ;; taru) title=Taru ;; *) title=$repo ;; esac
  command -v t3 >/dev/null && t3 project add "$dir" --title "$title" >/dev/null 2>&1 && log "added $title to T3"
done
[ ${#skipped[@]} -gt 0 ] && log "not cloned (sign in with gh auth login, then rerun): ${skipped[*]}"

# megha as a T3 provider here too, so Claude Code on the web threads start without my laptop. Takes effect at T3's
# next start (systemctl --user restart t3code).
if [ -f ~/dev/megha/packages/megha/index.mjs ]; then
  (cd ~/dev/megha && bun install --silent >/dev/null 2>&1)
  node -e '
    const fs = require("fs"), f = process.env.HOME + "/.t3/userdata/settings.json";
    const s = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : {};
    s.providerInstances = s.providerInstances || {};
    s.providerInstances["megha-claude"] = { driver: "acpRegistry", displayName: "Claude Code on the web", config: {
      source: "local", commandPath: process.execPath,
      commandArgs: [process.env.HOME + "/dev/megha/packages/megha/index.mjs", "--backend", "claude",
        "--default-mode", "bypassPermissions", "--default-model", "claude-opus-5-5"] } };
    fs.writeFileSync(f, JSON.stringify(s, null, 2));' && log "megha-claude provider set"
fi
# Restart threads the Claude usage limit stopped. T3 retries on its own, but the machine pauses while a thread waits
# out the limit, and on Oct 22 threads sat idle 11 to 78 minutes after the reset until I typed "continue".
mkdir -p ~/.config/systemd/user
cat > ~/.config/cloud-resume.sh <<'EOF'
#!/bin/sh
export PATH="$HOME/.local/bin:$HOME/.bun/bin:/usr/local/bin:/usr/bin:/bin"
{ echo 'const JOB = { cmd: "resume", text: "The usage limit has reset. Check what your background jobs and helpers finished or lost, then carry on." };'
  cat "$HOME/.cloud/agent-skills/skills/cloud/scripts/box.mjs"; } | node --no-warnings --input-type=module -
EOF
cat > ~/.config/systemd/user/cloud-resume.service <<'EOF'
[Unit]
Description=Restart T3 threads stopped at the Claude usage limit
[Service]
Type=oneshot
ExecStart=/bin/sh %h/.config/cloud-resume.sh
EOF
cat > ~/.config/systemd/user/cloud-resume.timer <<'EOF'
[Unit]
Description=Check every 10 minutes for threads stopped at the usage limit
[Timer]
OnBootSec=5min
OnUnitActiveSec=10min
[Install]
WantedBy=timers.target
EOF
systemctl --user daemon-reload && systemctl --user enable --now cloud-resume.timer >/dev/null 2>&1 && log "cloud-resume timer on"

# A Linux browser for Playwright and page checks; Playwright's own download is often missing here.
command -v chromium >/dev/null || log "no /usr/bin/chromium: install it (sudo apt-get install -y chromium)"
grep -q CHROME_PATH ~/.profile 2>/dev/null || echo 'export CHROME_PATH=/usr/bin/chromium' >> ~/.profile
python3 -c 'import PIL' 2>/dev/null || log "no Pillow: sudo apt-get install -y python3-pil"
log "done"
