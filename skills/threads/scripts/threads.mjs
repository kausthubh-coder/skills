#!/usr/bin/env node
// Start, steer and read T3 threads on my laptop or Mac mini from either one. T3's tools and its `t3 thread` CLI only
// reach the server on their own machine, so each machine runs `threads.mjs serve`: a bridge on its Tailscale address
// that runs `t3 thread` for the other one.
//
//   threads.mjs list [laptop|mac] [--all]        unsettled or running threads (--all: everything from the last 3 days)
//   threads.mjs show <thread> [--n 6]            state and latest messages
//   threads.mjs send <thread> <file|->           a busy thread gets it as its next turn; nothing is interrupted
//   threads.mjs start <laptop|mac> <file|-> [--branch <b> | --base <ref>] [--repo <name>] [--title <t>]
//                     [--provider <id> --model <slug>] [--from <thread id>] [--detach]
//   threads.mjs serve [--log <file>]             the bridge (LaunchAgent box.threads, Task Scheduler "Threads bridge")
//   threads.mjs install                          keep the bridge running on this machine
//
// <thread> is laptop:<id> or mac:<id>; a bare id is looked up on both. start --branch continues that branch in a new
// worktree; --base starts a new branch from a ref (default: the repo's default branch). --repo is the GitHub repo
// name, which can differ from the folder (likh is dev\murmur on the laptop); it defaults to this checkout's.
import { execFileSync, spawnSync } from "node:child_process";
import { appendFileSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";

const PORT = 4799;
// Tailscale addresses are fixed per device. The bridge listens only there, so the Mac's home network can't reach it.
const MACHINES = {
  laptop: { name: "laptop", ip: "100.88.91.2", home: "C:/Users/kaust" },
  mac: { name: "Mac mini", ip: "100.81.110.71", home: "/Users/dabot" },
};
const HERE = process.platform === "win32" ? "laptop" : "mac";
const OTHER = HERE === "laptop" ? "mac" : "laptop";
const SELF = fileURLToPath(import.meta.url);
const scriptOn = (m) => `${MACHINES[m].home}/.claude/skills/threads/scripts/threads.mjs`;
const ACTIVE = new Set(["preparing", "queued", "starting", "running", "waiting"]);

const [cmd, ...rest] = process.argv.slice(2);
const pos = [];
const opt = {};
for (let i = 0; i < rest.length; i++) {
  if (!rest[i].startsWith("--")) { pos.push(rest[i]); continue; }
  const key = rest[i].slice(2);
  opt[key] = rest[i + 1] === undefined || rest[i + 1].startsWith("--") ? true : rest[++i];
}

// The laptop's t3 is a .cmd wrapper around the desktop app. Run what it runs, so cmd.exe never re-quotes arguments.
function t3(args, input) {
  let command = "t3", pre = [], env = process.env;
  if (HERE === "laptop") {
    const wrapper = join(homedir(), ".t3", "bin", "t3.cmd");
    const m = /^"(.+\.exe)" "(.+\.mjs)" %\*\s*$/m.exec(readFileSync(wrapper, "utf8"));
    if (!m) throw new Error(`can't read ${wrapper}; open T3 Code once so it rewrites it`);
    [command, pre] = [m[1], [m[2]]];
    env = { ...env, ELECTRON_RUN_AS_NODE: "1", T3CODE_HOME: join(homedir(), ".t3"), T3CODE_CLI_PATH: wrapper, T3CODE_DESKTOP_CLI_LAUNCHER: "1" };
  }
  const r = spawnSync(command, [...pre, ...args], { input, encoding: "utf8", env, timeout: 280_000, windowsHide: true });
  if (r.status !== 0) throw new Error((r.stderr || r.stdout || r.error?.message || `t3 exited ${r.status}`).trim());
  return r.stdout.trim();
}

const git = (dir, ...args) => execFileSync("git", ["-C", dir, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
const repoName = (dir) => git(dir, "remote", "get-url", "origin").replace(/\.git$/, "").split(/[/:]/).pop();
const norm = (p) => resolve(p).replace(/\\/g, "/").replace(/\/$/, "").toLowerCase();
const db = () => new DatabaseSync(join(homedir(), ".t3", "userdata", "statev2.sqlite"), { readOnly: true });

function threadRows() {
  return db().prepare(`select t.thread_id id, t.title, t.updated_at updatedAt, t.payload_json payload,
      p.title project, p.workspace_root root,
      (select status from orchestration_v2_projection_runs r where r.thread_id = t.thread_id order by ordinal desc limit 1) status
    from orchestration_v2_projection_threads t join projection_projects p on p.project_id = t.project_id
    where t.deleted_at is null and t.archived_at is null order by t.updated_at desc`).all()
    .map(({ payload, ...r }) => {
      const p = JSON.parse(payload);
      return { ...r, status: r.status ?? "idle", branch: p.branch ?? null, cwd: p.worktreePath ?? r.root, settled: Boolean(p.settledAt), child: Boolean(p.lineage?.parentThreadId) };
    });
}

// The T3 thread running this script: the active thread whose checkout is the current folder.
function callerThread() {
  if (opt.from) return threadRows().find((r) => r.id === opt.from) ?? { id: opt.from, title: "" };
  const cwd = norm(process.cwd());
  const mine = threadRows().filter((r) => ACTIVE.has(r.status) && !r.child && norm(r.cwd) === cwd);
  return mine.length === 1 ? mine[0] : null;
}

// What the bridge runs. Each op runs on the machine that owns the threads.
const ops = {
  list: ({ all }) => threadRows()
    .filter((r) => !r.child && (all ? Date.now() - Date.parse(r.updatedAt) < 3 * 864e5 : ACTIVE.has(r.status) || !r.settled))
    .map(({ id, title, project, status, branch, updatedAt }) => ({ id, title, project, status, branch, updatedAt })),
  has: ({ id }) => ({ found: threadRows().some((r) => r.id === id) }),
  show: ({ id, n }) => ({ text: t3(["thread", "show", id, "--messages", String(n)]) }),
  send: ({ id, message }) => ({ text: t3(["thread", "send", id, "-"], message) }),
  start: ({ repo, branch, base, title, provider, model, message }) => {
    const root = db().prepare("select workspace_root root from projection_projects where deleted_at is null").all()
      .map((p) => p.root).find((dir) => { try { return repoName(dir).toLowerCase() === repo.toLowerCase(); } catch { return false; } });
    if (!root) throw new Error(`no T3 project for ${repo} on the ${MACHINES[HERE].name}`);
    git(root, "fetch", "-q", "origin");
    let ref = base;
    if (branch) ref = `origin/${branch}`;
    else if (!ref) { try { ref = git(root, "rev-parse", "--abbrev-ref", "origin/HEAD"); } catch { ref = "origin/main"; } }
    const args = ["thread", "start", root, "-", "--json", "--worktree", ref];
    if (branch) args.push("--branch", branch);
    if (title) args.push("--title", title);
    if (provider) args.push("--provider", provider);
    if (model) args.push("--model", model);
    return { ...JSON.parse(t3(args, message)), root, ref };
  },
};

async function on(machine, op, body) {
  if (machine === HERE) return ops[op](body);
  const { name, ip } = MACHINES[machine];
  let res;
  try {
    res = await fetch(`http://${ip}:${PORT}/${op}`, { method: "POST", body: JSON.stringify(body), signal: AbortSignal.timeout(300_000) });
  } catch (e) {
    if (e.name === "TimeoutError") throw new Error(`the ${name} didn't answer in 5 minutes; run \`list ${machine}\` before retrying`);
    throw new Error(`can't reach the ${name} (${e.cause?.code ?? e.message}): it's asleep, off Tailscale, or its bridge isn't running. Nothing was sent`);
  }
  const out = await res.json();
  if (!res.ok) throw new Error(`${name}: ${out.error}`);
  return out;
}

async function locate(address) {
  const m = /^(laptop|mac):(.+)$/.exec(address);
  if (m) return { machine: m[1], id: m[2] };
  for (const machine of [HERE, OTHER]) {
    try { if ((await on(machine, "has", { id: address })).found) return { machine, id: address }; } catch {}
  }
  throw new Error(`no thread ${address} on the ${MACHINES[HERE].name} or the reachable ${MACHINES[OTHER].name}`);
}

const readMessage = (src) => {
  if (!src) throw new Error("give the message as a file, or - for stdin");
  return (src === "-" ? readFileSync(0, "utf8") : readFileSync(src, "utf8")).trim();
};
const from = (t) => `my ${MACHINES[HERE].name} thread${t.title ? ` "${t.title}"` : ""} (${HERE}:${t.id})`;
const ago = (iso) => { const m = Math.round((Date.now() - Date.parse(iso)) / 6e4); return m < 60 ? `${m}m` : m < 2880 ? `${Math.round(m / 60)}h` : `${Math.round(m / 1440)}d`; };

function serve() {
  const log = (s) => { const line = `${new Date().toISOString().slice(0, 19)} ${s}\n`; opt.log ? appendFileSync(opt.log, line) : process.stdout.write(line); };
  // The parent keeps a child server alive; the child exits when sync pulls a new version of this file.
  if (!process.env.THREADS_BRIDGE_CHILD) {
    for (;;) {
      const r = spawnSync(process.execPath, [SELF, ...process.argv.slice(2)], { stdio: "inherit", windowsHide: true, env: { ...process.env, THREADS_BRIDGE_CHILD: "1" } });
      if (r.status !== 75) { log(`bridge exited ${r.status}; restarting in 10s`); spawnSync(process.execPath, ["-e", "setTimeout(()=>{},10000)"]); }
    }
  }
  const version = statSync(SELF).mtimeMs;
  setInterval(() => { if (statSync(SELF).mtimeMs !== version) { log("new version, restarting"); process.exit(75); } }, 30_000);
  const server = createServer(async (req, res) => {
    const reply = (code, body) => { res.writeHead(code, { "content-type": "application/json" }); res.end(JSON.stringify(body)); };
    const peer = req.socket.remoteAddress.replace(/^::ffff:/, "");
    const [a, b] = peer.split(".").map(Number);
    if (a !== 100 || b < 64 || b > 127) return reply(403, { error: "tailnet only" });
    if (req.method === "GET") return reply(200, { machine: HERE });
    const op = req.url.slice(1);
    if (req.method !== "POST" || !Object.hasOwn(ops, op)) return reply(404, { error: `no op ${op}` });
    let body = "";
    for await (const chunk of req) body += chunk;
    try {
      const args = JSON.parse(body);
      log(`${peer} ${op} ${args.id ?? args.repo ?? ""}`);
      reply(200, await ops[op](args));
    } catch (e) {
      log(`${peer} ${op} failed: ${e.message.split("\n")[0]}`);
      reply(500, { error: e.message });
    }
  });
  server.on("error", (e) => { log(`can't listen on ${MACHINES[HERE].ip}:${PORT}: ${e.message}`); process.exit(1); });
  server.listen(PORT, MACHINES[HERE].ip, () => log(`bridge up on ${MACHINES[HERE].ip}:${PORT}`));
}

// Keeps the bridge running on this machine. Safe to rerun.
function install() {
  if (HERE === "mac") {
    const plist = `${MACHINES.mac.home}/Library/LaunchAgents/box.threads.plist`;
    const log = `${MACHINES.mac.home}/box/logs/threads.log`;
    writeFileSync(plist, `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>box.threads</string>
  <key>ProgramArguments</key><array><string>${process.execPath}</string><string>${MACHINES.mac.home}/dev/agent-skills/skills/threads/scripts/threads.mjs</string><string>serve</string></array>
  <key>EnvironmentVariables</key><dict><key>PATH</key><string>/opt/homebrew/bin:/usr/local/bin:${MACHINES.mac.home}/.local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string></dict>
  <key>KeepAlive</key><true/>
  <key>RunAtLoad</key><true/>
  <key>StandardOutPath</key><string>${log}</string>
  <key>StandardErrorPath</key><string>${log}</string>
</dict></plist>
`);
    const uid = process.getuid();
    spawnSync("launchctl", ["bootout", `gui/${uid}/box.threads`]);
    execFileSync("launchctl", ["bootstrap", `gui/${uid}`, plist]);
    console.log(`LaunchAgent box.threads loaded; log ${log}`);
    return;
  }
  // Same pattern as scripts/sync-task.ps1: conhost --headless runs node without a window. The task fires every 5
  // minutes and IgnoreNew skips it while the bridge runs, so it comes back after a crash or a reboot.
  const log = join(homedir(), ".t3", "threads-bridge.log");
  const ps = `$q = '"'
$action = New-ScheduledTaskAction -Execute "conhost.exe" -Argument "--headless $q${process.execPath}$q $q${SELF}$q serve --log $q${log}$q"
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 5)
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit ([TimeSpan]::Zero)
Register-ScheduledTask -TaskName "Threads bridge" -Action $action -Trigger $trigger -Settings $settings -Force | Out-Null
Start-ScheduledTask -TaskName "Threads bridge"`;
  execFileSync("powershell", ["-NoProfile", "-Command", ps], { stdio: "inherit" });
  console.log(`Task Scheduler "Threads bridge" started; log ${log}`);
}

try {
  if (cmd === "serve") serve();
  else if (cmd === "install") install();
  else if (cmd === "list") {
    for (const machine of pos[0] ? [pos[0]] : [HERE, OTHER]) {
      let rows;
      try { rows = await on(machine, "list", { all: Boolean(opt.all) }); } catch (e) { console.log(`${MACHINES[machine].name}: ${e.message}\n`); continue; }
      console.log(`${MACHINES[machine].name}: ${rows.length} thread${rows.length === 1 ? "" : "s"}`);
      for (const r of rows) console.log(`  ${r.status.padEnd(10)} ${ago(r.updatedAt).padStart(4)}  ${r.project.padEnd(13).slice(0, 13)} ${r.title.slice(0, 48).padEnd(48)}  ${machine}:${r.id}`);
      console.log("");
    }
  } else if (cmd === "show") {
    const t = await locate(pos[0]);
    console.log((await on(t.machine, "show", { id: t.id, n: Number(opt.n ?? 6) })).text);
  } else if (cmd === "send") {
    const t = await locate(pos[0]);
    let message = readMessage(pos[1]);
    const me = t.machine === HERE ? null : callerThread();
    if (me) message = `From ${from(me)}. Reply with: node ${scriptOn(t.machine)} send ${HERE}:${me.id} <file>\n\n${message}`;
    console.log((await on(t.machine, "send", { id: t.id, message })).text);
  } else if (cmd === "start") {
    const machine = pos[0];
    if (!MACHINES[machine]) throw new Error("start needs a machine: laptop or mac");
    if (opt.branch && opt.base) throw new Error("use --branch to continue a branch or --base to start from a ref, not both");
    let message = readMessage(pos[1]);
    const me = opt.detach ? null : callerThread();
    if (me) {
      message += `\n\n---\nThis task comes from ${from(me)}, which can't see this thread. When you finish, send that thread your final report (verdict, evidence, what you couldn't check):\n\`node ${scriptOn(machine)} send ${HERE}:${me.id} <report file>\`\nFor a question only that thread or I can answer, send it the same way, then carry on with a sensible default.`;
    } else if (!opt.detach) console.error("threads: couldn't tell which thread is calling, so the new thread has no one to report to. Pass --from <thread id>, or --detach if it doesn't need to.");
    const out = await on(machine, "start", {
      repo: opt.repo ?? repoName(process.cwd()), branch: opt.branch, base: opt.base, title: opt.title,
      provider: opt.provider, model: opt.model, message,
    });
    console.log(`started ${machine}:${out.threadId} in ${out.root}, from ${out.ref}${me ? `; it reports back to ${HERE}:${me.id}` : ""}`);
  } else {
    console.error("usage: threads.mjs list|show|send|start|serve (see the top of this file)");
    process.exit(2);
  }
} catch (e) {
  console.error(`threads: ${e.message}`);
  process.exit(1);
}
