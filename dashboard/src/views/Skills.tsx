import { Fragment, useState } from "react";
import type { ViewProps } from "./index";
import type { Skill } from "../api";
import { shortDay } from "../api";
import { Section, Tag, ThreadLink } from "../ui";

const SOURCES = ["library", "critly", "plugin", "other"] as const;
const GRADE_TONE = { working: "ok", mixed: "warn", missed: "bad", not_needed: undefined } as const;
const DAY = 86400000;

function status(s: Skill, grade?: string) {
  if (grade) return <Tag tone={GRADE_TONE[grade as keyof typeof GRADE_TONE]}>{grade.replace("_", " ")}</Tag>;
  if (s.misses > 0 && s.loads === 0) return <Tag tone="bad">missed</Tag>;
  if (s.misses > s.loads) return <Tag tone="warn">often missed</Tag>;
  if (!s.lastUsed || Date.now() - Date.parse(s.lastUsed) > 14 * DAY) return <Tag>{s.userOnly ? "user-only, unused" : "unused 14 days"}</Tag>;
  return <Tag tone="ok">in use</Tag>;
}

export function Skills({ data, audits }: ViewProps) {
  const [source, setSource] = useState<(typeof SOURCES)[number] | "all">("library");
  const [openRow, setOpenRow] = useState<string | null>(null);
  const grades = new Map((audits[0]?.skills ?? []).map((g) => [g.name, g]));
  const rows = data.skills
    .filter((s) => source === "all" || s.source === source)
    .sort((a, b) => b.loads - a.loads || b.misses - a.misses || a.name.localeCompare(b.name));
  return (
    <>
      <header className="page-head">
        <h1>Skills</h1>
        <p className="lede">Every skill an agent can load, how often it did since {shortDay(data.since)}, and the audit's grade. A load is the Skill tool, a SKILL.md read, or you typing <code>/name</code> or <code>$name</code>. Misses are unconfirmed: a bug report with no <code>diagnosing-bugs</code>, a PR opened with no <code>unslop</code>. Click a graded row for the audit's evidence.</p>
      </header>
      <div className="chips" role="tablist">
        {(["all", ...SOURCES] as const).map((f) => (
          <button key={f} role="tab" aria-selected={source === f} className="chip" onClick={() => setSource(f)}>
            {f} <span className="num muted">{f === "all" ? data.skills.length : data.skills.filter((s) => s.source === f).length}</span>
          </button>
        ))}
      </div>
      <Section title={`${rows.length} skills`}>
        <div className="table-wrap"><table>
          <thead><tr><th>Skill</th><th className="n">Loads</th><th className="n">Claude</th><th className="n">Codex</th><th className="n" title="Times a routing rule applied and the skill didn't load. Word-list matches until the audit confirms them.">Misses?</th><th>Last used</th><th>Status</th></tr></thead>
          <tbody>
            {rows.map((s) => {
              const g = grades.get(s.name);
              const expanded = openRow === s.name;
              return (
                <Fragment key={s.name}>
                  <tr className={g ? "clickable" : ""} onClick={() => g && setOpenRow(expanded ? null : s.name)} aria-expanded={g ? expanded : undefined}>
                    <td><code>{s.name}</code>{s.userOnly && <span className="muted small"> · user-only</span>}</td>
                    <td className="n">{s.loads}</td><td className="n">{s.claude}</td><td className="n">{s.codex}</td>
                    <td className="n">{s.misses || ""}</td>
                    <td className="num">{s.lastUsed ? shortDay(s.lastUsed) : <span className="muted">never</span>}</td>
                    <td>{status(s, g?.grade)}</td>
                  </tr>
                  {expanded && g && (
                    <tr className="detail"><td colSpan={7}>
                      <p>{g.evidence}</p>
                      <p className="muted">{g.threadIds.slice(0, 6).map((id, i) => <Fragment key={id}>{i > 0 && " · "}<ThreadLink id={id} title={`thread ${i + 1}`} /></Fragment>)}</p>
                    </td></tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table></div>
      </Section>
    </>
  );
}
