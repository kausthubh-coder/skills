// Shapes of what the server returns. collect.ts writes Data; the audit-skills run writes Audit.

export type Skill = {
  name: string; source: "library" | "critly" | "plugin" | "other"; userOnly: boolean;
  loads: number; tool: number; read: number; slash: number; mention: number;
  claude: number; codex: number; misses: number; lastUsed: string; sessions: number;
};
export type Day = { day: string; sessions: number; claude: number; codex: number; frustration: number; praise: number; misses: number };
export type Project = {
  name: string; sessions: number; userMsgs: number; frustration: number; praise: number; misses: number; loads: number;
  flows?: { worktree: Place; ship: Place; verify: Place };
};
export type Place = "main" | "branch" | "none";
export type Signal = {
  kind: SignalKind; at: string; text: string; skill?: string;
  agent: "claude" | "codex"; project: string; threadId?: string; threadTitle?: string;
};
export type SignalKind = "frustration" | "praise" | "repeat" | "done_then_broken" | "missed_skill" | "correction";
export type Data = {
  generatedAt: string; since: string;
  totals: { sessions: number; claudeSessions: number; codexSessions: number; loads: number; critlyRuns: number };
  skills: Skill[]; daily: Day[]; projects: Project[]; signals: Signal[];
};

export type AuditSignal = { kind: SignalKind; threadId: string; project: string; date: string; quote: string; context: string; skill?: string | null };
export type Suggestion = {
  id: string; kind: "add" | "retire" | "fix-skill" | "agents-md" | "routing" | "project" | "upstream";
  title: string; why: string; impact: "high" | "med" | "low"; evidence: { threadId: string; quote: string }[];
};
export type Audit = {
  file: string; date: string; window: { from: string; to: string };
  headline: string; summary: string[];
  threads: { threadId: string; project: string; title: string; agent: string; date: string; skills: string[]; verdict: "good" | "mixed" | "bad"; summary: string }[];
  signals: AuditSignal[];
  skills: { name: string; grade: "working" | "mixed" | "missed" | "not_needed"; evidence: string; threadIds: string[] }[];
  suggestions: Suggestion[];
};
export type Trigger = { agent: string; variant: string; id: string; expect: string; hits: number; runs: number; last: string };
export type Decisions = Record<string, { status: "accepted" | "skipped"; at: string }>;

const get = async <T,>(url: string) => (await fetch(url)).json() as Promise<T>;
export const api = {
  data: () => get<Data>("/api/data"),
  collect: async () => (await (await fetch("/api/collect", { method: "POST" })).json()).data as Data,
  audits: () => get<Audit[]>("/api/audits"),
  triggers: () => get<Trigger[]>("/api/triggers"),
  decisions: () => get<Decisions>("/api/decisions"),
  decide: async (id: string, status: "accepted" | "skipped" | "open") =>
    (await fetch("/api/decisions", { method: "POST", body: JSON.stringify({ id, status }) })).json() as Promise<Decisions>,
};

export const threadLink = (id?: string) => (id ? `t3-thread://v1/${id}` : undefined);
export const shortDay = (iso: string) => new Date(iso.length === 10 ? `${iso}T12:00:00` : iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
