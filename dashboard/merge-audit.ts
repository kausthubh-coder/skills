// Merge the readers' batch files (reports/audits/raw/*.json) into one audit, reports/audits/<date>.json,
// which the dashboard reads. Dedupes threads, signals and skills; gives each suggestion a stable id.
// The headline, summary and final suggestion ranking come from reports/audits/raw/_meta.json,
// which the auditing agent writes after reading the merged result.
//
//   bun dashboard/merge-audit.ts <date>
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dir, "..");
const rawDir = path.join(root, "reports", "audits", "raw");
const date = process.argv[2] ?? new Date().toISOString().slice(0, 10);
const GRADE_RANK = { missed: 0, mixed: 1, working: 2, not_needed: 3 } as Record<string, number>;
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

const batches = fs.readdirSync(rawDir).filter((f) => f.endsWith(".json") && f !== "_meta.json").map((f) => JSON.parse(fs.readFileSync(path.join(rawDir, f), "utf8")));
const meta = fs.existsSync(path.join(rawDir, "_meta.json")) ? JSON.parse(fs.readFileSync(path.join(rawDir, "_meta.json"), "utf8")) : {};

const threads = new Map<string, any>();
const signals = new Map<string, any>();
const skills = new Map<string, any>();
const suggestions: any[] = [];
let from = "9999", to = "0000";
for (const b of batches) {
  if (b.window?.from < from) from = b.window.from;
  if (b.window?.to > to) to = b.window.to;
  for (const t of b.threads ?? []) if (t.inWindow !== false && !threads.has(t.threadId)) threads.set(t.threadId, t);
  for (const s of b.signals ?? []) signals.set(`${s.threadId}|${s.kind}|${s.quote}`, s);
  for (const k of b.skills ?? []) {
    const prev = skills.get(k.name);
    if (!prev) { skills.set(k.name, { ...k, threadIds: [...(k.threadIds ?? [])] }); continue; }
    // keep the worst grade, and all the evidence
    if ((GRADE_RANK[k.grade] ?? 9) < (GRADE_RANK[prev.grade] ?? 9)) prev.grade = k.grade;
    prev.evidence = `${prev.evidence} ${k.evidence}`.trim();
    prev.threadIds = [...new Set([...prev.threadIds, ...(k.threadIds ?? [])])];
  }
  for (const s of b.suggestions ?? []) suggestions.push({ ...s, id: s.id ?? slug(s.title), batch: b.batch });
}

// The agent's final list wins: _meta.suggestions replaces the raw ones when present.
const finalSuggestions = (meta.suggestions ?? suggestions).map((s: any) => ({ ...s, id: s.id ?? slug(s.title) }));
const audit = {
  date, window: { from, to },
  title: meta.title, dek: meta.dek,
  headline: meta.headline ?? `${threads.size} threads read`,
  summary: meta.summary ?? [],
  threads: [...threads.values()],
  signals: [...signals.values()].sort((a, b) => b.date.localeCompare(a.date)),
  skills: [...skills.values()].sort((a, b) => (GRADE_RANK[a.grade] ?? 9) - (GRADE_RANK[b.grade] ?? 9)),
  suggestions: finalSuggestions,
  rawSuggestions: meta.suggestions ? suggestions : undefined,
};
const out = path.join(root, "reports", "audits", `${date}.json`);
fs.writeFileSync(out, JSON.stringify(audit, null, 2));
console.log(`${out}: ${audit.threads.length} threads, ${audit.signals.length} signals, ${audit.skills.length} skills, ${audit.suggestions.length} suggestions (${suggestions.length} raw)`);
