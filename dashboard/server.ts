// The dashboard server: serves the React page and a few JSON routes over the files in reports/.
//   bun dashboard/server.ts   (PORT defaults to 4791)
import fs from "node:fs";
import path from "node:path";
import index from "./index.html";
import { collect } from "./collect";

const root = path.resolve(import.meta.dir, "..");
const reports = path.join(root, "reports");
const dataPath = path.join(reports, "dashboard", "data.json");
const decisionsPath = path.join(reports, "dashboard", "decisions.json");
const auditsDir = path.join(reports, "audits");
const STALE_MS = 15 * 60 * 1000;

const readJson = (p: string, fallback: unknown) => (fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : fallback);

function data() {
  const fresh = fs.existsSync(dataPath) && Date.now() - fs.statSync(dataPath).mtimeMs < STALE_MS;
  if (!fresh) collect();
  return readJson(dataPath, {});
}

// Audits are reports/audits/<date>.json, written by the audit-skills run. Newest first.
function audits() {
  if (!fs.existsSync(auditsDir)) return [];
  return fs.readdirSync(auditsDir)
    .filter((f) => /^\d{4}-\d{2}-\d{2}.*\.json$/.test(f))
    .sort().reverse()
    .map((f) => ({ file: f, ...readJson(path.join(auditsDir, f), {}) }));
}

// Trigger tests: the latest run per (agent, variant, case) from reports/evals/trigger.jsonl.
function triggers() {
  const file = path.join(reports, "evals", "trigger.jsonl");
  if (!fs.existsSync(file)) return [];
  const rows = fs.readFileSync(file, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
  const groups = new Map<string, { agent: string; variant: string; id: string; expect: string; hits: number; runs: number; last: string }>();
  for (const r of rows) {
    const key = `${r.agent}|${r.variant ?? "global"}|${r.id}`;
    const g = groups.get(key) ?? { agent: r.agent, variant: r.variant ?? "global", id: r.id, expect: r.expect, hits: 0, runs: 0, last: "" };
    g.hits += r.hit ? 1 : 0; g.runs++; if (r.at > g.last) g.last = r.at;
    groups.set(key, g);
  }
  return [...groups.values()];
}

const server = Bun.serve({
  port: Number(process.env.PORT ?? 4791),
  development: process.env.NODE_ENV !== "production",
  routes: {
    "/": index,
    "/api/data": () => Response.json(data()),
    "/api/collect": { POST: () => { const r = collect(); return Response.json({ ...r, data: readJson(dataPath, {}) }); } },
    "/api/audits": () => Response.json(audits()),
    "/api/triggers": () => Response.json(triggers()),
    "/api/decisions": {
      GET: () => Response.json(readJson(decisionsPath, {})),
      // Accept or skip a suggestion. The next audit run reads these and acts on accepted ones.
      POST: async (req) => {
        const { id, status } = (await req.json()) as { id: string; status: "accepted" | "skipped" | "open" };
        const all = readJson(decisionsPath, {}) as Record<string, unknown>;
        if (status === "open") delete all[id]; else all[id] = { status, at: new Date().toISOString() };
        fs.mkdirSync(path.dirname(decisionsPath), { recursive: true });
        fs.writeFileSync(decisionsPath, JSON.stringify(all, null, 2));
        return Response.json(all);
      },
    },
  },
});

console.log(`skills dashboard on ${server.url}`);
