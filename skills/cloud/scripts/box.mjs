// Runs on an InstaBox machine, piped in by cloud.mjs, which puts `const JOB = {...}` above this line.
// Talks to the machine's own T3 server the way T3's web app does: a short-lived bearer session, a WebSocket
// ticket, then orchestration RPCs over /ws. T3 has no CLI or MCP route for starting a thread from outside.
import { execFileSync } from "node:child_process";
import { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync } from "node:fs";

const HOME = process.env.HOME;
const env = { ...process.env, PATH: `${HOME}/.local/bin:${HOME}/.bun/bin:${process.env.PATH}` };
const run = (cmd, args, opts = {}) => execFileSync(cmd, args, { encoding: "utf8", env, ...opts }).trim();
const db = () => new DatabaseSync(`${HOME}/.t3/userdata/statev2.sqlite`, { readOnly: true });
const memAvailableMb = () => Math.round(Number(/MemAvailable:\s+(\d+)/.exec(readFileSync("/proc/meminfo", "utf8"))[1]) / 1024);

async function withServer(fn) {
  const label = `cloud-skill-${process.pid}`;
  const token = run("t3", ["auth", "session", "issue", "--ttl", "10m", "--label", label, "--token-only"]);
  try {
    const res = await fetch("http://localhost:3773/api/auth/websocket-ticket", { method: "POST", headers: { authorization: `Bearer ${token}` } });
    const { ticket } = await res.json();
    if (!ticket) throw new Error(`T3 gave no WebSocket ticket (HTTP ${res.status})`);
    const ws = new WebSocket(`ws://localhost:3773/ws?orchestrationProtocol=2&wsTicket=${encodeURIComponent(ticket)}`);
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
    const block = run("t3", ["auth", "session", "list"]).split(/\n\s*\n/).find((b) => b.includes(`client: ${label}`));
    const id = block?.match(/[0-9a-f]{8}-[0-9a-f-]{27}/)?.[0];
    if (id) run("t3", ["auth", "session", "revoke", id]);
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
  if (!find()) run("t3", ["project", "add", dir, "--title", repo]);
  return find();
}

function activeRun(threadId) {
  return db().prepare("select run_id from orchestration_v2_projection_runs where thread_id = ? and status in ('running','waiting','starting','preparing') order by ordinal desc").get(threadId)?.run_id;
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

  peek: async ({ threadId, n }) => {
    const d = db();
    console.log(`memory available: ${memAvailableMb()} MB`);
    if (!threadId) {
      const rows = d.prepare(`select t.thread_id, t.title, t.updated_at,
          (select status from orchestration_v2_projection_runs r where r.thread_id = t.thread_id
            order by status in ('running','waiting','starting','preparing') desc, ordinal desc limit 1) status
        from orchestration_v2_projection_threads t where t.deleted_at is null and t.archived_at is null
        order by t.updated_at desc limit ?`).all(n);
      for (const r of rows) console.log(`${r.updated_at.slice(5, 16)}  ${(r.status || "idle").padEnd(9)} ${r.thread_id}  ${r.title}`);
      return;
    }
    for (const r of d.prepare("select ordinal, status from orchestration_v2_projection_runs where thread_id = ? order by ordinal").all(threadId)) console.log(`run ${r.ordinal} ${r.status}`);
    const msgs = d.prepare("select role, created_at, payload_json from orchestration_v2_projection_messages where thread_id = ? order by created_at desc limit ?").all(threadId, n).reverse();
    for (const m of msgs) console.log(`\n[${m.created_at.slice(5, 16)} ${m.role}] ${(JSON.parse(m.payload_json).text || "").replace(/\s+/g, " ").slice(0, 600)}`);
  },
};

await jobs[JOB.cmd](JOB);
