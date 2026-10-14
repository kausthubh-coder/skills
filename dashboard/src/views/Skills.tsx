import { Fragment, useState } from "react";
import type { ViewProps } from "./index";
import type { Skill } from "../api";
import { shortDay } from "../api";
import { Head, Tag, ThreadLink, type Tone } from "../ui";

const SOURCES = ["library", "critly", "plugin"] as const;
const GRADE_TONE: Record<string, Tone> = { working: "ok", mixed: "warn", missed: "bad", not_needed: undefined };
const DAY = 86400000;

function status(s: Skill, grade?: string): [string, Tone] {
  if (grade) return [grade.replace("_", " "), GRADE_TONE[grade]];
  if (s.misses > 0 && s.loads === 0) return ["missed", "bad"];
  if (s.misses > s.loads) return ["often missed", "warn"];
  if (!s.lastUsed || Date.now() - Date.parse(s.lastUsed) > 14 * DAY) return ["unused", undefined];
  return ["in use", "ok"];
}
const Cell = ({ n }: { n: number }) => <td className={`n ${n ? "" : "zero"}`}>{n}</td>;

export function Skills({ data, audits }: ViewProps) {
  const [source, setSource] = useState<(typeof SOURCES)[number] | "all">("library");
  const [openRow, setOpenRow] = useState<string | null>(null);
  const grades = new Map((audits[0]?.skills ?? []).map((g) => [g.name, g]));
  const rows = data.skills.filter((s) => source === "all" || s.source === source)
    .sort((a, b) => b.loads - a.loads || b.misses - a.misses || a.name.localeCompare(b.name));
  return (
    <>
      <Head eyebrow={`Since ${shortDay(data.since)}`} title="Which skills load." />
      <div className="filters" role="tablist">
        {(["all", ...SOURCES] as const).map((f) => (
          <button key={f} role="tab" aria-selected={source === f} className="chip" onClick={() => setSource(f)}>
            {f} {f === "all" ? data.skills.length : data.skills.filter((s) => s.source === f).length}
          </button>
        ))}
      </div>
      <div className="table-wrap"><table>
        <thead><tr><th>Skill</th><th className="n">Loads</th><th className="n">Claude</th><th className="n">Codex</th><th className="n" title="Unconfirmed: a routing rule applied and the skill didn't load">Misses?</th><th className="n">Last</th><th>Grade</th></tr></thead>
        <tbody>
          {rows.map((s) => {
            const g = grades.get(s.name);
            const [label, tone] = status(s, g?.grade);
            const expanded = openRow === s.name;
            return (
              <Fragment key={s.name}>
                <tr className={g ? "clickable" : ""} onClick={() => g && setOpenRow(expanded ? null : s.name)} aria-expanded={g ? expanded : undefined}>
                  <td className="mono">{s.name}{s.userOnly && <span className="muted"> /</span>}</td>
                  <Cell n={s.loads} /><Cell n={s.claude} /><Cell n={s.codex} /><Cell n={s.misses} />
                  <td className="n">{s.lastUsed ? shortDay(s.lastUsed) : <span className="muted">—</span>}</td>
                  <td><Tag tone={tone}>{label}</Tag></td>
                </tr>
                {expanded && g && (
                  <tr className="detail"><td colSpan={7}>
                    {g.evidence}{" "}
                    {g.threadIds.slice(0, 5).map((id, i) => <Fragment key={id}>{i > 0 && " · "}<ThreadLink id={id}>thread {i + 1}</ThreadLink></Fragment>)}
                  </td></tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table></div>
    </>
  );
}
