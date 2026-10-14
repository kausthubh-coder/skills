import type { ViewProps } from "./index";
import type { Place } from "../api";
import { Head, Tag } from "../ui";

const PLACE: Record<Place, ["main" | "branch" | "none", "ok" | "warn" | "bad"]> = { main: ["main", "ok"], branch: ["branch", "warn"], none: ["none", "bad"] };
const Flow = ({ p }: { p?: Place }) => (p ? <Tag tone={PLACE[p][1]}>{PLACE[p][0]}</Tag> : <span className="muted">—</span>);
// The audit names projects as T3 does ("No project", "kausthubh-portfolio"); the collector shortens them.
const key = (name: string) => {
  const l = name.toLowerCase();
  if (l.includes("portfolio")) return "portfolio";
  if (l.includes("murmur") || l.includes("likh")) return "likh";
  if (l.includes("scratch") || l === "no project") return "scratch";
  if (l.includes("studi")) return "studi";
  return l;
};

export function Projects({ data, audits }: ViewProps) {
  const verdicts = new Map<string, { good: number; mixed: number; bad: number }>();
  for (const t of audits[0]?.threads ?? []) {
    const v = verdicts.get(key(t.project)) ?? { good: 0, mixed: 0, bad: 0 };
    v[t.verdict]++; verdicts.set(key(t.project), v);
  }
  const rows = data.projects.filter((p) => (p.sessions > 0 || p.flows) && p.name !== "other");
  return (
    <>
      <Head eyebrow="Projects" title="Setup and how threads went." />
      <div className="table-wrap" style={{ marginTop: 24 }}><table>
        <thead><tr><th>Project</th><th className="n">Sessions</th><th className="n">Good</th><th className="n">Mixed</th><th className="n">Bad</th><th>Worktree</th><th>Ship</th><th>Verify</th></tr></thead>
        <tbody>
          {rows.map((p) => {
            const v = verdicts.get(key(p.name));
            return (
              <tr key={p.name}>
                <td>{p.name}</td>
                <td className="n">{p.sessions}</td>
                <td className={`n ${v?.good ? "" : "zero"}`}>{v ? v.good : "—"}</td>
                <td className={`n ${v?.mixed ? "" : "zero"}`}>{v ? v.mixed : "—"}</td>
                <td className={`n ${v?.bad ? "" : "zero"}`} style={v?.bad ? { color: "var(--bad)" } : undefined}>{v ? v.bad : "—"}</td>
                <td><Flow p={p.flows?.worktree} /></td><td><Flow p={p.flows?.ship} /></td><td><Flow p={p.flows?.verify} /></td>
              </tr>
            );
          })}
        </tbody>
      </table></div>
    </>
  );
}
