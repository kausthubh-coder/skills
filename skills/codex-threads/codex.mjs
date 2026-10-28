#!/usr/bin/env node
// Read my Codex app threads and projects from ~/.codex (read-only).
// Usage: node codex.mjs <projects|threads|search|read|files> [args] — see SKILL.md.
import { DatabaseSync } from "node:sqlite";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { zstdDecompressSync } from "node:zlib";

const HOME = process.env.CODEX_HOME || join(homedir(), ".codex");
const [cmd, ...rest] = process.argv.slice(2);
const { args, flags } = parseArgs(rest);

if (!existsSync(join(HOME, "state_5.sqlite"))) fail(`No Codex data at ${HOME} (set CODEX_HOME).`);
const state = openDb("state_5.sqlite");
const history = existsSync(join(HOME, "thread_history_1.sqlite")) ? openDb("thread_history_1.sqlite") : null;
const app = loadAppState();

const commands = { projects, threads, search, read, files };
if (!commands[cmd]) fail("Usage: node codex.mjs <projects|threads|search|read|files> [args]. See SKILL.md.");
commands[cmd]();

// ---- commands

function projects() {
  const counts = {};
  for (const t of listThreads({ all: false })) counts[t.project] = (counts[t.project] || 0) + 1;
  for (const p of app.projects) {
    console.log(`${p.name}  (${counts[p.name] || 0} threads)\n  ${p.rootPaths.join("\n  ")}`);
  }
  console.log(`(no project)  (${counts["(no project)"] || 0} threads)`);
}

function threads() {
  const rows = listThreads(flags).slice(0, num(flags.limit, 30));
  for (const t of rows) console.log(line(t));
  if (!rows.length) console.log("No threads match.");
}

function search() {
  const q = args.join(" ").trim();
  if (!q) fail('Usage: node codex.mjs search "<text>" [--project name] [--since 30d]');
  const pool = new Map(listThreads(flags).map((t) => [t.id, t]));
  const like = `%${q.toLowerCase()}%`;
  const hits = new Map();
  for (const t of pool.values()) {
    const where = [t.title, t.first_user_message].find((s) => s?.toLowerCase().includes(q.toLowerCase()));
    if (where) hits.set(t.id, { t, n: 1, snippet: where });
  }
  if (history) {
    const rows = history.prepare(`
      select thread_id, count(*) n, min(item_json) sample from thread_items
      where item_type in ('userMessage','agentMessage') and lower(item_json) like ?
      group by thread_id`).all(like);
    for (const r of rows) {
      const t = pool.get(r.thread_id);
      if (!t) continue;
      const prev = hits.get(t.id);
      hits.set(t.id, { t, n: r.n + (prev?.n || 0), snippet: prev?.snippet || itemText(JSON.parse(r.sample)) });
    }
  }
  const sorted = [...hits.values()].sort((a, b) => b.t.updated_at_ms - a.t.updated_at_ms).slice(0, num(flags.limit, 20));
  for (const h of sorted) console.log(`${line(h.t)}  [${h.n} hits]\n    ${around(h.snippet, q)}`);
  if (!sorted.length) console.log(`No threads mention "${q}".`);
}

function read() {
  const t = resolveThread(args.join(" "));
  const items = loadItems(t);
  console.log(`# ${t.title}\nid: ${t.id}\nproject: ${t.project}\ncwd: ${t.cwd}`);
  console.log(`created: ${date(t.created_at_ms)}  updated: ${date(t.updated_at_ms)}  via: ${t.via}  model: ${t.model || "?"}`);
  if (t.git_branch) console.log(`branch: ${t.git_branch}`);
  if (t.archived) console.log("archived: yes");
  const kids = state.prepare("select child_thread_id from thread_spawn_edges where parent_thread_id = ?").all(t.id);
  if (kids.length) console.log(`subagents: ${kids.map((k) => k.child_thread_id).join(", ")}`);
  console.log(`rollout: ${t.rollout_path}\n`);

  let turns = groupTurns(items);
  if (flags.last) turns = turns.slice(-num(flags.last, 3));
  for (const turn of turns) {
    for (const it of turn) {
      const out = render(it, flags);
      if (out) console.log(out + "\n");
    }
  }
}

function files() {
  const t = resolveThread(args.join(" "));
  const items = loadItems(t);
  const changed = new Map();
  const attached = new Set();
  const images = [];
  for (const it of items) {
    if (it.type === "fileChange") for (const c of it.changes || []) changed.set(c.path, c.kind?.type || c.kind || "update");
    if (it.type === "userMessage") for (const c of it.content || []) if (c.path) attached.add(c.path);
    if (it.type === "imageGeneration" && (it.savedPath || it.saved_path)) images.push(it.savedPath || it.saved_path);
  }
  console.log(`# ${t.title} (${t.id})\nproject: ${t.project}\ncwd: ${t.cwd}`);
  const out = app.outputDirs[t.id];
  if (out) console.log(`outputs folder: ${out}${existsSync(out) ? "" : " (gone)"}`);
  section("Files changed", [...changed].map(([p, k]) => `${k.padEnd(6)} ${p}${existsSync(p) ? "" : "  (gone)"}`));
  section("Files I attached", [...attached]);
  section("Images generated", images);
}

// ---- data

function listThreads(f) {
  let rows = state.prepare("select * from threads order by updated_at_ms desc").all().map(decorate);
  if (!f.all) rows = rows.filter((t) => !t.source.startsWith("{") && t.preview !== "");
  if (!f.archived) rows = rows.filter((t) => !t.archived);
  if (f.project) rows = rows.filter((t) => t.project.toLowerCase() === String(f.project).toLowerCase());
  if (f.cwd) {
    const want = norm(resolve(String(f.cwd)));
    rows = rows.filter((t) => norm(t.cwd).startsWith(want));
  }
  if (f.since) rows = rows.filter((t) => t.updated_at_ms >= Date.now() - duration(f.since));
  return rows;
}

function decorate(t) {
  t.created_at_ms ??= t.created_at * 1000;
  t.updated_at_ms ??= t.updated_at * 1000;
  t.cwd = t.cwd.replace(/^\\\\\?\\/, "");
  const agent = [t.agent_nickname, t.agent_path].filter(Boolean).join(" ");
  t.title = t.name || t.title || t.first_user_message?.slice(0, 80) || agent || "(untitled)";
  t.project = projectOf(t);
  t.via = { "Codex Desktop": "app", "T3 Code": "t3", t3code_desktop: "t3", codex_exec: "exec" }[t.originator] || t.originator || t.source;
  if (t.source.startsWith("{")) t.via = t.thread_source || "subagent";
  return t;
}

function projectOf(t) {
  const assigned = app.assignments[t.id]?.projectId;
  const byId = assigned && app.projects.find((p) => p.id === assigned);
  if (byId) return byId.name;
  let best = null;
  for (const p of app.projects)
    for (const r of p.rootPaths)
      if ((norm(t.cwd) + "/").startsWith(norm(r) + "/") && (!best || r.length > best.len)) best = { name: p.name, len: r.length };
  return best?.name || "(no project)";
}

function resolveThread(key) {
  if (!key) fail("Give a thread id, id prefix or words from its title.");
  const all = state.prepare("select * from threads").all().map(decorate);
  const exact = all.find((t) => t.id === key);
  if (exact) return exact;
  let found = all.filter((t) => t.id.startsWith(key));
  if (!found.length) found = all.filter((t) => t.title.toLowerCase().includes(key.toLowerCase()));
  if (found.length === 1) return found[0];
  if (!found.length) fail(`No thread matches "${key}". Try: node codex.mjs search "${key}"`);
  console.log(`${found.length} threads match "${key}"; pass an id:`);
  for (const t of found.sort((a, b) => b.updated_at_ms - a.updated_at_ms).slice(0, 20)) console.log(line(t));
  process.exit(1);
}

function loadItems(t) {
  if (history) {
    const rows = history.prepare("select turn_id, item_json from thread_items where thread_id = ? order by rollout_ordinal").all(t.id);
    if (rows.length) return rows.map((r) => ({ ...JSON.parse(r.item_json), turn: r.turn_id }));
  }
  return loadRollout(t.rollout_path);
}

// Older and subagent threads only exist as rollout files (.jsonl or .jsonl.zst) with snake_case items.
function loadRollout(path) {
  const candidates = [path, path + ".zst", path.replace(/\.zst$/, "")];
  const file = candidates.find((p) => p && existsSync(p));
  if (!file) return [];
  const raw = readFileSync(file);
  const text = file.endsWith(".zst") ? zstdDecompressSync(raw).toString("utf8") : raw.toString("utf8");
  const items = [];
  for (const l of text.split("\n")) {
    if (!l.includes('"item_completed"')) continue;
    const e = JSON.parse(l).payload;
    const it = camel(e.item);
    it.type = it.type[0].toLowerCase() + it.type.slice(1);
    items.push({ ...it, turn: e.turn_id });
  }
  return items;
}

function loadAppState() {
  const file = join(HOME, ".codex-global-state.json");
  const s = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : {};
  const order = s["project-order"] || [];
  const projects = Object.values(s["local-projects"] || {}).sort((a, b) => rank(order, a.id) - rank(order, b.id));
  return { projects, assignments: s["thread-project-assignments"] || {}, outputDirs: s["thread-projectless-output-directories"] || {} };
}

// ---- rendering

function render(it, f) {
  switch (it.type) {
    case "userMessage":
      return `## Me\n${itemText(it)}`;
    case "agentMessage":
      if (it.phase === "commentary" && !f.full) return null;
      return `## Codex${it.phase === "commentary" ? " (update)" : ""}\n${itemText(it)}`;
    case "commandExecution":
      return f.tools ? `> $ ${clip(shellBody(it.command), 200)}  [${it.status}${it.exitCode != null ? ` exit ${it.exitCode}` : ""}]` : null;
    case "fileChange":
      return f.tools ? `> edited ${(it.changes || []).map((c) => c.path).join(", ")}` : null;
    case "mcpToolCall":
      return f.tools ? `> ${it.server}.${it.tool} ${clip(JSON.stringify(it.arguments || {}), 160)}` : null;
    case "webSearch":
      return f.tools ? `> web search: ${it.query || it.action?.query || ""}` : null;
    case "imageGeneration":
      return f.tools ? `> generated image ${it.savedPath || ""}` : null;
    case "contextCompaction":
      return f.tools ? "> (context compacted)" : null;
    default:
      return null;
  }
}

function itemText(it) {
  if (typeof it.text === "string") return it.text;
  return (it.content || []).map((c) => c.text ?? (c.path ? `[attached ${c.path}]` : c.type === "image" ? "[image]" : "")).join("\n").trim();
}

// Drop the `"...\pwsh.exe" -Command` wrapper Codex puts around every command.
function shellBody(command) {
  const s = Array.isArray(command) ? command.join(" ") : String(command ?? "");
  return s.replace(/^"?[^"]*?(pwsh|powershell|bash|zsh|sh)(\.exe)?"?\s+(-NoProfile\s+)?(-Command|-lc|-c)\s+/i, "").replace(/\s+/g, " ");
}

function groupTurns(items) {
  const turns = [];
  for (const it of items) {
    if (it.type === "userMessage" || !turns.length) turns.push([]);
    turns.at(-1).push(it);
  }
  return turns;
}

function line(t) {
  return `${t.id}  ${date(t.updated_at_ms)}  ${t.project.padEnd(14)} ${t.via.padEnd(5)} ${clip(t.title, 70)}`;
}

function section(title, list) {
  console.log(`\n## ${title} (${list.length})`);
  for (const x of list) console.log(x);
}

// ---- helpers

function openDb(name) {
  return new DatabaseSync(join(HOME, name), { readOnly: true });
}

function parseArgs(argv) {
  const args = [], flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) args.push(a);
    else if (argv[i + 1] && !argv[i + 1].startsWith("--") && !["--all", "--archived", "--tools", "--full"].includes(a)) flags[a.slice(2)] = argv[++i];
    else flags[a.slice(2)] = true;
  }
  return { args, flags };
}

function camel(o) {
  if (Array.isArray(o)) return o.map(camel);
  if (!o || typeof o !== "object") return o;
  return Object.fromEntries(Object.entries(o).map(([k, v]) => [k.replace(/_([a-z])/g, (_, c) => c.toUpperCase()), camel(v)]));
}

function duration(s) {
  const m = String(s).match(/^(\d+)([hdw])$/);
  if (!m) fail(`--since takes 12h, 7d or 2w, not "${s}"`);
  return Number(m[1]) * { h: 3600e3, d: 86400e3, w: 604800e3 }[m[2]];
}

function around(text, q) {
  const flat = String(text).replace(/\s+/g, " ");
  const i = flat.toLowerCase().indexOf(q.toLowerCase());
  return clip(i < 0 ? flat : (i > 60 ? "…" : "") + flat.slice(Math.max(0, i - 60)), 180);
}

function norm(p) {
  return String(p).replace(/^\\\\\?\\/, "").replace(/\\/g, "/").replace(/\/+$/, "").toLowerCase();
}
function rank(order, id) {
  return order.includes(id) ? order.indexOf(id) : order.length;
}
function num(v, d) {
  return v === undefined || v === true ? d : Number(v);
}
function clip(s, n) {
  s = String(s ?? "");
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
function date(ms) {
  return new Date(ms).toISOString().slice(0, 16).replace("T", " ");
}
function fail(msg) {
  console.error(msg);
  process.exit(1);
}
