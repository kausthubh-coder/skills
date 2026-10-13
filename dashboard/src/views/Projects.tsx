import type { ViewProps } from "./index";
import type { Place } from "../api";
import { Section, Tag } from "../ui";

const PLACE: Record<Place, { label: string; tone: "ok" | "warn" | "bad" }> = {
  main: { label: "on main", tone: "ok" }, branch: { label: "on a branch", tone: "warn" }, none: { label: "none", tone: "bad" },
};
const Flow = ({ p }: { p?: Place }) => (p ? <Tag tone={PLACE[p].tone}>{PLACE[p].label}</Tag> : <span className="muted">—</span>);
const rate = (n: number, d: number) => (d ? `${Math.round((n / d) * 100)}%` : "—");
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
  const rows = data.projects.filter((p) => p.sessions > 0 || p.flows).filter((p) => p.name !== "other");
  return (
    <>
      <header className="page-head">
        <h1>Projects</h1>
        <p className="lede">Each repo's agent setup and how its threads went. Worktree, ship and verify are the project skills from <code>create-project-flows</code> and <code>create-verification-skill</code>; "on a branch" means built but not shipped.</p>
      </header>
      <Section title={`${rows.length} projects`}>
        <div className="table-wrap"><table>
          <thead><tr><th>Project</th><th className="n">Sessions</th><th className="n">Frustrated</th><th className="n">Praise</th><th>Last audit</th><th>Worktree</th><th>Ship</th><th>Verify</th></tr></thead>
          <tbody>
            {rows.map((p) => {
              const v = verdicts.get(key(p.name));
              return (
                <tr key={p.name}>
                  <td>{p.name}</td>
                  <td className="n">{p.sessions}</td>
                  <td className="n" title={`${p.frustration} of ${p.userMsgs} messages`}>{p.frustration ? `${p.frustration} · ${rate(p.frustration, p.userMsgs)}` : ""}</td>
                  <td className="n">{p.praise || ""}</td>
                  <td className="num">{v ? <span>{v.good} good · {v.mixed} mixed · <span className={v.bad ? "bad-text" : ""}>{v.bad} bad</span></span> : <span className="muted">not audited</span>}</td>
                  <td><Flow p={p.flows?.worktree} /></td><td><Flow p={p.flows?.ship} /></td><td><Flow p={p.flows?.verify} /></td>
                </tr>
              );
            })}
          </tbody>
        </table></div>
      </Section>
    </>
  );
}
