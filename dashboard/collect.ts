// Collector: reads my Claude Code and Codex sessions plus T3's thread list, and writes
// reports/dashboard/data.json for the dashboard. No AI, read-only, incremental (a file is
// re-parsed only when it changed). The audit agent judges what this flags; this only counts.
//
//   bun dashboard/collect.ts
import { Database } from "bun:sqlite";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const root = path.resolve(import.meta.dir, "..");
const outDir = path.join(root, "reports", "dashboard");
const home = os.homedir();
const SINCE = "2026-10-01";
const DEV = path.join(home, "OneDrive", "Documents", "dev");

// --- what counts as what -----------------------------------------------------------------

const FRUSTRATION = /\b(wtf|tf|stupid|dumb|still (not|doesn'?t|isn'?t|broken|the same)|not working|doesn'?t work|isn'?t working|i (already )?said|i told you|why did you|why would you|you didn'?t|so bad|looks bad|looks weird|confus|annoying|ugh)\b/i;
const PRAISE = /\b(good (job|jpn|work)|nice( work| job)?|perfect|love (it|this)|great( job| work)?|awesome|amazing|well done|thank(s| you))\b/i;
// Narrow on purpose: a bug report is "it's broken", not every message that mentions an error.
const BUG = /\b(not working|doesn'?t work|isn'?t working|broken|blank screen|is (just )?blank|crash(es|ing|ed)?|stuck|still (fails|failing))\b/i;
const DONE_CLAIM = /\b(done|fixed|works|working now|merged|is live|shipped|deployed|all set)\b/i;
const STILL_BROKEN = /\b(still|not working|doesn'?t work|isn'?t working|broken|same (thing|issue|problem)|nope|didn'?t (work|fix))\b/i;
const CRITLY_RUN = /\b(critly (check|taste)|lint:ui|taste:ui)\b/;

// --- skills I have ---------------------------------------------------------------------------

type SkillInfo = { name: string; source: string; userOnly: boolean };
function listSkills(): SkillInfo[] {
  const seen = new Map<string, SkillInfo>();
  for (const dir of [path.join(home, ".claude", "skills"), path.join(home, ".agents", "skills")]) {
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      const md = path.join(dir, name, "SKILL.md");
      if (seen.has(name) || !fs.existsSync(md)) continue;
      const text = fs.readFileSync(md, "utf8");
      let real = md;
      try { real = fs.realpathSync(md); } catch {}
      const source = real.includes(`${path.sep}agent-skills${path.sep}`) ? "library"
        : real.includes(`${path.sep}critly${path.sep}`) ? "critly"
        : /^(clerk-|hyperframes|media-use|motion-graphics|general-video|faceless-explainer|product-launch-video)/.test(name) ? "plugin" : "other";
      seen.set(name, { name, source, userOnly: /^disable-model-invocation:\s*true/m.test(text) });
    }
  }
  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
}

// --- T3 threads ------------------------------------------------------------------------------

type Thread = { threadId: string; title: string; project: string; projectId: string; worktree?: string; byAgent: boolean };
function readT3() {
  const byNative = new Map<string, Thread>();
  const byCwd = new Map<string, Thread>();
  const projects = new Map<string, { title: string; root: string }>();
  const dbPath = path.join(home, ".t3", "userdata", "statev2.sqlite");
  if (!fs.existsSync(dbPath)) return { byNative, byCwd, projects };
  const db = new Database(dbPath, { readonly: true });
  for (const p of db.query("select project_id, title, workspace_root from projection_projects").all() as any[]) {
    projects.set(p.project_id, { title: p.title, root: p.workspace_root });
  }
  const threads = new Map<string, Thread>();
  for (const t of db.query("select thread_id, project_id, title, payload_json from orchestration_v2_projection_threads where deleted_at is null").all() as any[]) {
    const payload = JSON.parse(t.payload_json ?? "{}");
    const thread: Thread = {
      threadId: t.thread_id, title: t.title, projectId: t.project_id, project: projectName(projects.get(t.project_id)?.title ?? ""),
      worktree: payload.worktreePath ?? undefined,
      // threads an agent launched (delegated tasks, evals) open with a prompt the agent wrote, not me
      byAgent: payload.createdBy === "agent" || String(t.thread_id).startsWith("mcp:"),
    };
    threads.set(t.thread_id, thread);
    if (thread.worktree) byCwd.set(norm(thread.worktree), thread);
  }
  for (const r of db.query("select thread_id, payload_json from orchestration_v2_projection_provider_threads").all() as any[]) {
    const native = JSON.parse(r.payload_json ?? "{}").nativeThreadRef?.nativeId;
    const thread = threads.get(r.thread_id);
    if (native && thread) byNative.set(native, thread);
  }
  db.close();
  return { byNative, byCwd, projects };
}

const norm = (p: string) => path.resolve(p).toLowerCase();
function projectName(s: string) {
  const l = s.toLowerCase();
  if (l.includes("murmur") || l.includes("likh")) return "likh";
  for (const k of ["krida", "kriyan", "critly", "studi", "agent-skills", "portfolio", "sandbox", "amy"]) if (l.includes(k)) return k === "studi" ? "studi" : k;
  if (l.includes("scratch") || l === "no project") return "scratch";
  return l || "other";
}
function projectFromCwd(cwd: string) {
  const l = cwd.toLowerCase().replace(/\//g, "\\");
  if (l.includes("\\.t3\\scratch")) return "scratch";
  if (/\\appdata\\local\\temp\\/.test(l)) return "eval";
  const m = l.match(/\\\.t3\\worktrees\\([^\\]+)/) ?? l.match(/\\dev\\(?:sandbox\\)?([^\\]+)/) ?? l.match(/\\documents\\chatgpt\\([^\\]+)/);
  return m ? projectName(m[1]) : "other";
}

// --- one session ---------------------------------------------------------------------------

type Load = { skill: string; how: "tool" | "read" | "slash" | "mention"; at: string };
type Signal = { kind: string; at: string; text: string; skill?: string };
type Session = {
  id: string; agent: "claude" | "codex"; file: string; cwd: string; start: string; end: string;
  userMsgs: number; loads: Load[]; signals: Signal[]; critlyRuns: number; prCreates: number;
};

const skillFromPath = (s: string) => [...s.matchAll(/skills[\\/]+([a-z0-9-]+)[\\/]+SKILL\.md/gi)].map((m) => m[1].toLowerCase());
const clip = (t: string) => t.replace(/\s+/g, " ").trim().slice(0, 220);
const tokens = (t: string) => new Set(t.toLowerCase().match(/[a-z]{3,}/g) ?? []);
function similar(a: Set<string>, b: Set<string>) {
  if (a.size < 5 || b.size < 5) return false;
  let both = 0;
  for (const x of a) if (b.has(x)) both++;
  return both / (a.size + b.size - both) >= 0.6;
}

function judgeTurns(s: Session, turns: { role: "user" | "assistant"; text: string; at: string }[], skillNames: Set<string>) {
  const seenUser: Set<string>[] = [];
  let lastAssistant = "";
  for (const t of turns) {
    if (t.role === "assistant") { lastAssistant = t.text; continue; }
    const text = t.text;
    // text the harness injects into the user turn, not something I typed
    if (/This session is being continued|^Update on pull request|<in-app-browser-context|^\[SYSTEM NOTIFICATION|^Delegated task |^<task-notification|^\[Historical user|^# Files mentioned|^Continue where you left off/.test(text)) continue;
    s.userMsgs++;
    for (const m of text.matchAll(/\$([a-z0-9-]+)/gi)) if (skillNames.has(m[1].toLowerCase())) s.loads.push({ skill: m[1].toLowerCase(), how: "mention", at: t.at });
    // tone words only mean much in short messages; long dictated ones match by accident
    const short = text.length <= 400;
    if (short && FRUSTRATION.test(text)) s.signals.push({ kind: "frustration", at: t.at, text: clip(text) });
    if (short && PRAISE.test(text)) s.signals.push({ kind: "praise", at: t.at, text: clip(text) });
    if (short && lastAssistant && DONE_CLAIM.test(lastAssistant.slice(-600)) && STILL_BROKEN.test(text)) s.signals.push({ kind: "done_then_broken", at: t.at, text: clip(text) });
    const tok = tokens(text);
    if (text.length <= 600 && seenUser.some((prev) => similar(prev, tok))) s.signals.push({ kind: "repeat", at: t.at, text: clip(text) });
    seenUser.push(tok);
    if (BUG.test(text)) s.signals.push({ kind: "bug_report", at: t.at, text: clip(text) });
  }
  // the first bug report in a session with no diagnosing-bugs load after it is a candidate miss
  const firstBug = s.signals.find((x) => x.kind === "bug_report");
  if (firstBug && !s.loads.some((l) => l.skill === "diagnosing-bugs" && l.at >= firstBug.at)) {
    s.signals.push({ kind: "missed_skill", at: firstBug.at, text: firstBug.text, skill: "diagnosing-bugs" });
  }
  s.signals = s.signals.filter((x) => x.kind !== "bug_report");
  if (s.prCreates && !s.loads.some((l) => l.skill === "unslop")) s.signals.push({ kind: "missed_skill", at: s.end, text: "opened a PR without loading unslop", skill: "unslop" });
}

function parseClaude(file: string, skillNames: Set<string>): Session | null {
  const s: Session = { id: path.basename(file, ".jsonl"), agent: "claude", file, cwd: "", start: "", end: "", userMsgs: 0, loads: [], signals: [], critlyRuns: 0, prCreates: 0 };
  const turns: { role: "user" | "assistant"; text: string; at: string }[] = [];
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    if (!line) continue;
    let j: any; try { j = JSON.parse(line); } catch { continue; }
    const at: string = j.timestamp ?? "";
    if (at) { if (!s.start) s.start = at; s.end = at; }
    if (j.cwd && !s.cwd) s.cwd = j.cwd;
    const c = j.message?.content;
    if (j.type === "user" && !j.isMeta) {
      const text = typeof c === "string" ? c : Array.isArray(c) ? c.filter((x: any) => x.type === "text").map((x: any) => x.text).join("\n") : "";
      const slash = text.match(/<command-name>\/?([^<\s]+)<\/command-name>/);
      if (slash) { if (skillNames.has(slash[1].toLowerCase())) s.loads.push({ skill: slash[1].toLowerCase(), how: "slash", at }); continue; }
      if (!text || text.startsWith("<") || text.startsWith("Base directory for this skill") || text.startsWith("[SYSTEM")) continue;
      turns.push({ role: "user", text, at });
    }
    if (j.type === "assistant" && Array.isArray(c)) {
      for (const x of c) {
        if (x.type === "text") turns.push({ role: "assistant", text: x.text, at });
        if (x.type !== "tool_use") continue;
        if (x.name === "Skill" && x.input?.skill) s.loads.push({ skill: String(x.input.skill).toLowerCase(), how: "tool", at });
        const input = JSON.stringify(x.input ?? {});
        if (x.name === "Read") for (const sk of skillFromPath(input)) s.loads.push({ skill: sk, how: "read", at });
        if (CRITLY_RUN.test(input)) s.critlyRuns++;
        if (/gh pr create/.test(input)) s.prCreates++;
      }
    }
  }
  if (!s.start) return null;
  judgeTurns(s, turns, skillNames);
  return s;
}

function parseCodex(file: string, skillNames: Set<string>): Session | null {
  const s: Session = { id: "", agent: "codex", file, cwd: "", start: "", end: "", userMsgs: 0, loads: [], signals: [], critlyRuns: 0, prCreates: 0 };
  const turns: { role: "user" | "assistant"; text: string; at: string }[] = [];
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    if (!line) continue;
    let j: any; try { j = JSON.parse(line); } catch { continue; }
    const at: string = j.timestamp ?? "";
    if (at) { if (!s.start) s.start = at; s.end = at; }
    const p = j.payload ?? {};
    if (j.type === "session_meta") s.id = p.id ?? p.session_id ?? s.id;
    if (j.type === "turn_context" && p.cwd && !s.cwd) s.cwd = p.cwd;
    if (j.type !== "response_item") continue;
    if (p.type === "message" && (p.role === "user" || p.role === "assistant")) {
      const text = (p.content ?? []).map((x: any) => x.text ?? "").join("\n");
      if (p.role === "user" && (!text || text.startsWith("<") || text.startsWith("# AGENTS.md"))) continue;
      turns.push({ role: p.role, text, at });
    }
    if (p.type === "function_call" || p.type === "custom_tool_call") {
      const input = String(p.arguments ?? p.input ?? "");
      for (const sk of skillFromPath(input)) s.loads.push({ skill: sk, how: "read", at });
      if (CRITLY_RUN.test(input)) s.critlyRuns++;
      if (/gh pr create/.test(input)) s.prCreates++;
    }
  }
  if (!s.start) return null;
  if (!s.id) s.id = path.basename(file, ".jsonl");
  judgeTurns(s, turns, skillNames);
  return s;
}

// --- walk, with a cache ----------------------------------------------------------------------

function* files(dir: string, skipSubagents: boolean): Generator<string> {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!(skipSubagents && e.name === "subagents")) yield* files(p, skipSubagents); }
    else if (p.endsWith(".jsonl")) yield p;
  }
}

function flowsFor(repo: string) {
  const has = (ref: string, kind: string) => {
    const r = spawnSync("git", ["-C", repo, "ls-tree", "-d", "--name-only", ref, ".agents/skills/"], { encoding: "utf8" });
    return r.status === 0 && r.stdout.split("\n").some((l) => l.split("/").pop()!.startsWith(kind));
  };
  // origin/main, not local main: some main checkouts are weeks behind
  const state = (kind: string) => has("origin/main", kind) ? "main" : has("agent-flows", kind) || has("t3/optimize-agent-workflow", kind) ? "branch" : "none";
  return { worktree: state("worktree-"), ship: state("ship-"), verify: state("verify-") };
}

export function collect() {
  fs.mkdirSync(outDir, { recursive: true });
  const cachePath = path.join(outDir, "cache.json");
  const cache: Record<string, { key: string; s: Session | null }> = fs.existsSync(cachePath) ? JSON.parse(fs.readFileSync(cachePath, "utf8")) : {};
  const skills = listSkills();
  const skillNames = new Set(skills.map((x) => x.name));
  const t3 = readT3();
  const sessions: (Session & { threadId?: string; threadTitle?: string; project: string })[] = [];
  const nextCache: typeof cache = {};
  const sources: [string, boolean, "claude" | "codex"][] = [
    [path.join(home, ".claude", "projects"), true, "claude"],
    [path.join(home, ".codex", "sessions"), false, "codex"],
  ];
  let parsed = 0;
  for (const [dir, skipSub, agent] of sources) {
    for (const f of files(dir, skipSub)) {
      const st = fs.statSync(f);
      if (st.mtime.toISOString().slice(0, 10) < SINCE) continue;
      const key = `${st.size}:${st.mtimeMs}`;
      let s = cache[f]?.key === key ? cache[f].s : undefined;
      if (s === undefined) { s = agent === "claude" ? parseClaude(f, skillNames) : parseCodex(f, skillNames); parsed++; }
      nextCache[f] = { key, s };
      if (!s || s.start.slice(0, 10) < SINCE) continue;
      const thread = t3.byNative.get(s.id) ?? (s.cwd ? t3.byCwd.get(norm(s.cwd)) : undefined);
      const project = thread?.project ?? projectFromCwd(s.cwd || f);
      // trigger tests and other headless eval runs aren't my work; leave them out of every number
      if (project === "eval" || /^eval: /.test(thread?.title ?? "")) continue;
      const mine = !thread?.byAgent;
      sessions.push({ ...s, signals: mine ? s.signals : [], userMsgs: mine ? s.userMsgs : 0, threadId: thread?.threadId, threadTitle: thread?.title, project });
    }
  }
  fs.writeFileSync(cachePath, JSON.stringify(nextCache));

  // roll-ups the views use
  const day = (at: string) => at.slice(0, 10);
  const daily: Record<string, any> = {};
  const skillStats: Record<string, any> = {};
  const projects: Record<string, any> = {};
  for (const s of sessions) {
    const d = (daily[day(s.start)] ??= { day: day(s.start), sessions: 0, claude: 0, codex: 0, frustration: 0, praise: 0, misses: 0 });
    d.sessions++;
    for (const l of s.loads) {
      daily[day(l.at)] ??= { day: day(l.at), sessions: 0, claude: 0, codex: 0, frustration: 0, praise: 0, misses: 0 };
      daily[day(l.at)][s.agent]++;
      const k = (skillStats[l.skill] ??= { name: l.skill, loads: 0, tool: 0, read: 0, slash: 0, mention: 0, claude: 0, codex: 0, misses: 0, lastUsed: "", sessions: new Set<string>() });
      k.loads++; k[l.how]++; k[s.agent]++; k.sessions.add(s.id);
      if (l.at > k.lastUsed) k.lastUsed = l.at;
    }
    const p = (projects[s.project] ??= { name: s.project, sessions: 0, userMsgs: 0, frustration: 0, praise: 0, misses: 0, loads: 0 });
    p.sessions++; p.userMsgs += s.userMsgs; p.loads += s.loads.length;
    for (const g of s.signals) {
      const dd = (daily[day(g.at)] ??= { day: day(g.at), sessions: 0, claude: 0, codex: 0, frustration: 0, praise: 0, misses: 0 });
      if (g.kind === "frustration") { dd.frustration++; p.frustration++; }
      if (g.kind === "praise") { dd.praise++; p.praise++; }
      if (g.kind === "missed_skill") {
        dd.misses++; p.misses++;
        const k = (skillStats[g.skill!] ??= { name: g.skill, loads: 0, tool: 0, read: 0, slash: 0, mention: 0, claude: 0, codex: 0, misses: 0, lastUsed: "", sessions: new Set<string>() });
        k.misses++;
      }
    }
  }
  const repos: Record<string, string> = { krida: "krida", kriyan: "kriyan", likh: "murmur", critly: "critly", studi: "studi-2" };
  for (const [name, folder] of Object.entries(repos)) {
    projects[name] ??= { name, sessions: 0, userMsgs: 0, frustration: 0, praise: 0, misses: 0, loads: 0 };
    projects[name].flows = flowsFor(path.join(DEV, folder));
  }
  for (const s of skills) skillStats[s.name] ??= { name: s.name, loads: 0, tool: 0, read: 0, slash: 0, mention: 0, claude: 0, codex: 0, misses: 0, lastUsed: "", sessions: new Set<string>() };

  const signals = sessions.flatMap((s) => s.signals.map((g) => ({ ...g, agent: s.agent, project: s.project, threadId: s.threadId, threadTitle: s.threadTitle, sessionId: s.id })))
    .sort((a, b) => b.at.localeCompare(a.at));
  const data = {
    generatedAt: new Date().toISOString(),
    since: SINCE,
    totals: {
      sessions: sessions.length,
      claudeSessions: sessions.filter((s) => s.agent === "claude").length,
      codexSessions: sessions.filter((s) => s.agent === "codex").length,
      loads: sessions.reduce((n, s) => n + s.loads.length, 0),
      critlyRuns: sessions.reduce((n, s) => n + s.critlyRuns, 0),
    },
    skills: skills.map((s) => ({ ...s, ...skillStats[s.name], sessions: skillStats[s.name].sessions.size })),
    otherLoads: Object.values(skillStats).filter((k: any) => !skillNames.has(k.name)).map((k: any) => ({ ...k, sessions: k.sessions.size })),
    daily: Object.values(daily).sort((a: any, b: any) => a.day.localeCompare(b.day)),
    projects: Object.values(projects).sort((a: any, b: any) => b.sessions - a.sessions),
    signals: signals.slice(0, 600),
    sessions: sessions.map(({ signals, loads, file, ...rest }) => ({ ...rest, loads: loads.length, skills: [...new Set(loads.map((l) => l.skill))] }))
      .sort((a, b) => b.start.localeCompare(a.start)),
  };
  fs.writeFileSync(path.join(outDir, "data.json"), JSON.stringify(data));
  return { parsed, sessions: sessions.length, signals: signals.length };
}

if (import.meta.main) {
  const t = Date.now();
  const r = collect();
  console.log(`collected ${r.sessions} sessions (${r.parsed} parsed), ${r.signals} signals in ${((Date.now() - t) / 1000).toFixed(1)}s`);
}
