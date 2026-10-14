import { useState } from "react";
import type { ViewProps } from "./index";
import { shortDay } from "../api";
import { Dot, Empty, Head, ThreadLink } from "../ui";

const TONE = { good: "ok", mixed: "warn", bad: "bad" } as const;

export function Audits({ audits }: ViewProps) {
  const [open, setOpen] = useState(audits[0]?.file ?? "");
  if (!audits.length) return <><Head eyebrow="Audits" title="No audits yet." /><Empty title="Type /audit-skills in a library thread." /></>;
  return (
    <>
      <Head eyebrow="Audits" title="Every run." />
      <ul className="rows" style={{ marginTop: 24 }}>
        {audits.map((a) => {
          const v = { good: 0, mixed: 0, bad: 0 };
          for (const t of a.threads ?? []) v[t.verdict]++;
          const expanded = open === a.file;
          return (
            <li key={a.file} className="row" style={{ flexWrap: "wrap" }}>
              <button className="linkish grow" style={{ textAlign: "left", color: "var(--text)" }} aria-expanded={expanded} onClick={() => setOpen(expanded ? "" : a.file)}>
                <span className="label num" style={{ marginRight: 12 }}>{shortDay(a.window.from)}–{shortDay(a.window.to)}</span>{a.title ?? a.headline}
              </button>
              <span className="label num"><span style={{ color: "var(--ok)" }}>{v.good}</span> · <span style={{ color: "var(--warn)" }}>{v.mixed}</span> · <span style={{ color: "var(--bad)" }}>{v.bad}</span></span>
              {expanded && (
                <ul className="rows" style={{ flexBasis: "100%", marginTop: 8 }}>
                  {(a.threads ?? []).sort((x, y) => (x.verdict > y.verdict ? 1 : -1)).map((t) => (
                    <li key={t.threadId} className="row">
                      <Dot tone={TONE[t.verdict]} />
                      <span className="grow"><ThreadLink id={t.threadId}>{t.title}</ThreadLink><span className="sub">{t.summary}</span></span>
                      <span className="label">{t.project}</span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
