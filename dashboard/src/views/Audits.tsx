import { useState } from "react";
import type { ViewProps } from "./index";
import { shortDay } from "../api";
import { Empty, Section, Tag, ThreadLink } from "../ui";

const TONE = { good: "ok", mixed: "warn", bad: "bad" } as const;

export function Audits({ audits }: ViewProps) {
  const [open, setOpen] = useState(audits[0]?.file ?? "");
  if (!audits.length) return <Empty title="No audits yet">The scheduled audit writes one every two days. Run it now by typing <code>/audit-skills</code> in a library thread.</Empty>;
  return (
    <>
      <header className="page-head">
        <h1>Audits</h1>
        <p className="lede">Each run of <code>audit-skills</code>: what it read, how each thread went, and what it found. The full report for a run is an HTML page in <code>reports/audits/</code>.</p>
      </header>
      {audits.map((a) => {
        const counts = { good: 0, mixed: 0, bad: 0 };
        for (const t of a.threads ?? []) counts[t.verdict]++;
        const expanded = open === a.file;
        return (
          <Section key={a.file} title={`${shortDay(a.window.from)} – ${shortDay(a.window.to)}`} meta={`${a.threads?.length ?? 0} threads · ${counts.good} good · ${counts.mixed} mixed · ${counts.bad} bad`}
            action={<button className="btn ghost" aria-expanded={expanded} onClick={() => setOpen(expanded ? "" : a.file)}>{expanded ? "Hide threads" : "Show threads"}</button>}>
            <p className="audit-headline">{a.headline}</p>
            {a.summary?.length > 0 && <ul className="summary">{a.summary.map((s, i) => <li key={i}>{s}</li>)}</ul>}
            {expanded && (
              <div className="table-wrap"><table>
                <thead><tr><th>Thread</th><th>Project</th><th>Verdict</th><th>What happened</th></tr></thead>
                <tbody>
                  {(a.threads ?? []).sort((x, y) => (x.verdict > y.verdict ? 1 : -1)).map((t) => (
                    <tr key={t.threadId}>
                      <td><ThreadLink id={t.threadId} title={t.title} /></td>
                      <td>{t.project}</td>
                      <td><Tag tone={TONE[t.verdict]}>{t.verdict}</Tag></td>
                      <td>{t.summary}</td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            )}
          </Section>
        );
      })}
    </>
  );
}
