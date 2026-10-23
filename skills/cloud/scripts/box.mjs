// Runs next to a T3 server and talks to it: piped into an InstaBox machine by cloud.mjs (which puts
// `const JOB = {...}` above this line), or run the same way on my laptop for the device-hub handoff.
// It talks to T3 the way T3's web app does: a short-lived bearer session, a WebSocket ticket, then orchestration
// RPCs over /ws. T3 has no CLI or MCP route for starting a thread from outside.
import { execFileSync } from "node:child_process";
import { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";

const HOME = homedir();
const WINDOWS = process.platform === "win32";
const env = { ...process.env, PATH: `${HOME}/.local/bin:${HOME}/.bun/bin:${process.env.PATH}` };
const run = (cmd, args, opts = {}) => execFileSync(cmd, args, { encoding: "utf8", env, ...opts }).trim();
// The desktop app's CLI on my laptop is a .cmd, which only runs through cmd.
const t3 = (args) => (WINDOWS ? run("cmd", ["/c", `${HOME}\\.t3\\bin\\t3.cmd`, ...args]) : run("t3", args));
const db = () => new DatabaseSync(`${HOME}/.t3/userdata/statev2.sqlite`, { readOnly: true });
const memAvailableMb = () => Math.round(Number(/MemAvailable:\s+(\d+)/.exec(readFileSync("/proc/meminfo", "utf8"))[1]) / 1024);
const SERVER = (() => { try { return JSON.parse(readFileSync(`${HOME}/.t3/userdata/server-runtime.json`, "utf8")).origin; } catch { return "http://localhost:3773"; } })();

async function withServer(fn) {
  const label = `cloud-skill-${process.pid}`;
  const token = t3(["auth", "session", "issue", "--ttl", "10m", "--label", label, "--token-only"]);
  try {
    const res = await fetch(`${SERVER}/api/auth/websocket-ticket`, { method: "POST", headers: { authorization: `Bearer ${token}` } });
    const { ticket } = await res.json();
    if (!ticket) throw new Error(`T3 gave no WebSocket ticket (HTTP ${res.status})`);
    const ws = new WebSocket(`${SERVER.replace(/^http/, "ws")}/ws?orchestrationProtocol=2&wsTicket=${encodeURIComponent(ticket)}`);
    await new Promise((ok, fail) => { ws.onopen = ok; ws.onerror = () => fail(new Error("T3 refused the WebSocket")); });
    let next = 1;
    const call = (tag, payload) => new Promise((ok, fail) => {
      const id = String(next++);
      ws.onmessage = (e) => {
        const m = JSON.parse(e.data);
        if (m._tag === "Ping") return ws.send('{"_tag":"Pong"}');
        if (m.requestId !== id) return;
        if (m._tag === "Exit" && m.exit._tag === "Success") ok(m.exit.value);
        else fail(new Error(`${tag} failed: ${JSON.stringify(m).slice(0, 800)}`));
      };
      ws.send(JSON.stringify({ _tag: "Request", id, tag, payload, headers: [] }));
    });
    try { return await fn(call); } finally { ws.close(); }
  } finally {
    const block = t3(["auth", "session", "list"]).split(/\r?\n\s*\r?\n/).find((b) => b.includes(`client: ${label}`));
    const id = block?.match(/[0-9a-f]{8}-[0-9a-f-]{27}/)?.[0];
    if (id) t3(["auth", "session", "revoke", id]);
  }
}

// The branch's worktree on this machine: the one T3 already uses, or a new one under ~/.t3/worktrees/<repo>/.
function worktreeFor(repo, branch) {
  const dir = `${HOME}/dev/${repo}`;
  if (!existsSync(`${dir}/.git`)) run("gh", ["repo", "clone", `kausthubh-coder/${repo}`, dir, "--", "-q"]);
  run("git", ["-C", dir, "fetch", "-q", "origin", branch]);
  const listed = run("git", ["-C", dir, "worktree", "list", "--porcelain"]).split("\n\n")
    .find((w) => w.split("\n").includes(`branch refs/heads/${branch}`));
  if (listed) {
    const path = listed.match(/^worktree (.+)$/m)[1];
    run("git", ["-C", path, "merge", "-q", "--ff-only", `origin/${branch}`]);
    return { dir, path };
  }
  const path = `${HOME}/.t3/worktrees/${repo}/${branch.replace(/[^\w.-]+/g, "-")}`;
  mkdirSync(`${HOME}/.t3/worktrees/${repo}`, { recursive: true });
  const local = run("git", ["-C", dir, "branch", "--list", branch]);
  run("git", ["-C", dir, "worktree", "add", "-q", ...(local ? [path, branch] : ["--track", "-b", branch, path, `origin/${branch}`])]);
  return { dir, path };
}

function projectFor(dir, repo) {
  const find = () => db().prepare("select project_id from projection_projects where workspace_root = ? and deleted_at is null").get(dir)?.project_id;
  if (!find()) t3(["project", "add", dir, "--title", repo]);
  return find();
}

function activeRun(threadId) {
  return db().prepare("select run_id from orchestration_v2_projection_runs where thread_id = ? and status in ('running','waiting','starting','preparing') order by ordinal desc").get(threadId)?.run_id;
}

// T3 throttles all agents together past the agents slice's memory.high; over it, commands hang instead of failing.
const readOr = (f, d) => { try { return readFileSync(f, "utf8").trim(); } catch { return d; } };
function health() {
  const SLICE = `/sys/fs/cgroup/user.slice/user-${process.getuid()}.slice/user@${process.getuid()}.service/app.slice/app-t3code.slice/app-t3code-agents.slice`;
  const gb = (b) => (Number(b) / 1024 ** 3).toFixed(1);
  const high = readOr(`${SLICE}/memory.high`, "max");
  const throttled = /^high (\d+)/m.exec(readOr(`${SLICE}/memory.events`, ""))?.[1] ?? "?";
  return `load ${readOr("/proc/loadavg", "?").split(" ").slice(0, 3).join(" ")} on 4 vCPU; agents use ${gb(readOr(`${SLICE}/memory.current`, 0))} GB of ${high === "max" ? "no cap" : gb(high) + " GB"} (${throttled} throttle events since T3 started); ${memAvailableMb()} MB free`;
}

// Threads whose last run stopped at the Claude usage limit and haven't run since.
function stoppedAtLimit(d) {
  return d.prepare(`select t.thread_id, t.title, json_extract(i.payload_json, '$.failure.resetAt') reset_at
      from orchestration_v2_projection_threads t
      join orchestration_v2_projection_runs r on r.thread_id = t.thread_id
        and r.ordinal = (select max(ordinal) from orchestration_v2_projection_runs where thread_id = t.thread_id)
      join orchestration_v2_projection_turn_items i on i.run_id = r.run_id and i.type = 'error'
        and json_extract(i.payload_json, '$.failure.class') = 'usage_limit'
      where t.deleted_at is null and t.archived_at is null and r.status = 'failed' and t.thread_id not like 'thread:%'
      group by t.thread_id`).all();
}

const jobs = {
  mem: async () => console.log(memAvailableMb()),

  move: async ({ repo, branch, title, brief, instance, model }) => {
    const { dir, path } = worktreeFor(repo, branch);
    const projectId = projectFor(dir, repo);
    const threadId = randomUUID();
    await withServer((call) => call("orchestration.launchThread", {
      commandId: randomUUID(), creationSource: "web", threadId, projectId, title, generateTitle: false,
      modelSelection: { instanceId: instance, model }, runtimeMode: "full-access", interactionMode: "default",
      workspaceStrategy: { type: "existing_worktree", worktreePath: path, branch },
      initialMessage: { messageId: randomUUID(), text: brief, attachments: [] },
    }));
    console.log(JSON.stringify({ threadId, worktree: path, memAvailableMb: memAvailableMb() }));
  },

  send: async ({ threadId, text }) => {
    const runId = activeRun(threadId);
    await withServer((call) => call("orchestration.dispatchCommand", {
      type: "message.dispatch", commandId: randomUUID(), createdBy: "user", creationSource: "web", threadId,
      messageId: randomUUID(), text, attachments: [],
      dispatchMode: runId ? { type: "steer_active", targetRunId: runId } : { type: "start_immediately" },
    }));
    console.log(runId ? "steered the running turn" : "started a new turn");
  },

  // Restart threads the usage limit stopped, once the limit has reset. A paused machine misses T3's own retry.
  resume: async ({ text }) => {
    const due = stoppedAtLimit(db()).filter((t) => !t.reset_at || Date.parse(t.reset_at) < Date.now());
    if (!due.length) return console.log("nothing stopped at the usage limit");
    await withServer(async (call) => {
      for (const t of due) {
        await call("orchestration.dispatchCommand", {
          type: "message.dispatch", commandId: randomUUID(), createdBy: "user", creationSource: "web", threadId: t.thread_id,
          messageId: randomUUID(), text, attachments: [], dispatchMode: { type: "start_immediately" },
        });
        console.log(`resumed ${t.thread_id}  ${t.title}`);
      }
    });
  },

  // Cloud side: idle threads whose last message ends with a "## Laptop device check" brief (BOX.md).
  handoffs: async () => {
    const d = db();
    const rows = d.prepare(`select t.thread_id, t.title, t.payload_json, p.title project, p.workspace_root root,
        (select payload_json from orchestration_v2_projection_messages m where m.thread_id = t.thread_id
          order by created_at desc limit 1) last
      from orchestration_v2_projection_threads t join projection_projects p on p.project_id = t.project_id
      where t.deleted_at is null and t.archived_at is null and t.thread_id not like 'thread:%'`).all();
    const out = [];
    for (const r of rows) {
      const last = r.last && JSON.parse(r.last);
      const at = last?.role === "assistant" ? last.text?.search(/^#{1,3} Laptop device check\s*$/m) : -1;
      if (at < 0 || activeRun(r.thread_id)) continue;
      out.push({ threadId: r.thread_id, title: r.title, messageId: last.id, project: r.project,
        repo: r.root.split("/").pop(), branch: JSON.parse(r.payload_json).branch ?? null, brief: last.text.slice(at) });
    }
    console.log(JSON.stringify(out));
  },

  // Laptop side: a thread in the project with this title (or repo folder), in a new worktree from origin/<branch>.
  launchHere: async ({ threadId = randomUUID(), project, repo, branch, title, text, instance, model }) => {
    const projects = db().prepare("select project_id, title, workspace_root from projection_projects where deleted_at is null").all();
    const p = projects.find((x) => x.title.toLowerCase() === project.toLowerCase())
      ?? projects.find((x) => x.workspace_root.split(/[\\/]/).pop().toLowerCase() === repo.toLowerCase());
    if (!p) throw new Error(`no T3 project here for ${project} (${repo})`);
    await withServer((call) => call("orchestration.launchThread", {
      commandId: randomUUID(), creationSource: "web", threadId, projectId: p.project_id, title, generateTitle: false,
      modelSelection: { instanceId: instance, model }, runtimeMode: "full-access", interactionMode: "default",
      workspaceStrategy: branch ? { type: "worktree", baseRef: branch, startFromOrigin: true } : { type: "root" },
      initialMessage: { messageId: randomUUID(), text, attachments: [] },
    }));
    console.log(JSON.stringify({ threadId }));
  },

  delete: async ({ threadId }) => {
    await withServer((call) => call("orchestration.dispatchCommand", { type: "thread.delete", commandId: randomUUID(), threadId }));
    console.log(`deleted ${threadId}`);
  },

  // Whether a thread exists, its latest run status and last assistant message.
  result: async ({ threadId }) => {
    const d = db();
    const exists = Boolean(d.prepare("select 1 from orchestration_v2_projection_threads where thread_id = ? and deleted_at is null").get(threadId));
    const runStatus = d.prepare("select status from orchestration_v2_projection_runs where thread_id = ? order by ordinal desc limit 1").get(threadId)?.status ?? null;
    const last = d.prepare("select payload_json from orchestration_v2_projection_messages where thread_id = ? and role = 'assistant' order by created_at desc limit 1").get(threadId);
    console.log(JSON.stringify({ exists, runStatus, active: Boolean(activeRun(threadId)), text: last ? JSON.parse(last.payload_json).text : null }));
  },

  peek: async ({ threadId, n }) => {
    const d = db();
    console.log(health());
    if (!threadId) {
      // A thread "running" with no new item for 15 minutes is usually stuck on memory or a wait, not working.
      const rows = d.prepare(`select t.thread_id, t.title, t.updated_at,
          (select status from orchestration_v2_projection_runs r where r.thread_id = t.thread_id
            order by status in ('running','waiting','starting','preparing') desc, ordinal desc limit 1) status,
          (select max(updated_at) from orchestration_v2_projection_turn_items i where i.thread_id = t.thread_id) last_item
        from orchestration_v2_projection_threads t where t.deleted_at is null and t.archived_at is null
          and t.thread_id not like 'thread:%'
        order by t.updated_at desc limit ?`).all(n);
      const limited = new Set(stoppedAtLimit(d).map((t) => t.thread_id));
      for (const r of rows) {
        const quiet = Math.round((Date.now() - Date.parse(r.last_item ?? r.updated_at)) / 60000);
        const flag = limited.has(r.thread_id) ? "  << stopped at usage limit (cloud.mjs resume)"
          : r.status === "running" && quiet >= 15 ? `  << running but silent ${quiet} min` : "";
        console.log(`${r.updated_at.slice(5, 16)}  ${(r.status || "idle").padEnd(9)} ${r.thread_id}  ${r.title}${flag}`);
      }
      return;
    }
    for (const r of d.prepare("select ordinal, status from orchestration_v2_projection_runs where thread_id = ? order by ordinal").all(threadId)) console.log(`run ${r.ordinal} ${r.status}`);
    const msgs = d.prepare("select role, created_at, payload_json from orchestration_v2_projection_messages where thread_id = ? order by created_at desc limit ?").all(threadId, n).reverse();
    for (const m of msgs) console.log(`\n[${m.created_at.slice(5, 16)} ${m.role}] ${(JSON.parse(m.payload_json).text || "").replace(/\s+/g, " ").slice(0, 600)}`);
  },
};

await jobs[JOB.cmd](JOB);
