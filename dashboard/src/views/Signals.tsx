import { useState } from "react";
import type { ViewProps } from "./index";
import type { SignalKind } from "../api";
import { shortDay } from "../api";
import { Dot, Empty, Head, KIND, ThreadLink } from "../ui";

const KINDS: SignalKind[] = ["correction", "missed_skill", "done_then_broken", "frustration", "repeat", "praise"];
type Row = { kind: SignalKind; date: string; project: string; quote: string; threadId?: string; skill?: string | null };

export function Signals({ data, audits }: ViewProps) {
  const audit = audits[0];
  const [source, setSource] = useState<"confirmed" | "candidates">(audit ? "confirmed" : "candidates");
  const [kind, setKind] = useState<SignalKind | "all">("all");
  const rows: Row[] = source === "confirmed"
    ? (audit?.signals ?? [])
    : data.signals.map((s) => ({ kind: s.kind, date: s.at, project: s.project, quote: s.text, threadId: s.threadId, skill: s.skill }));
  const shown = rows.filter((r) => kind === "all" || r.kind === kind).sort((a, b) => b.date.localeCompare(a.date));
  return (
    <>
      <Head eyebrow="Your words" title="What you told the agents." />
      <div className="filters">
        <button role="tab" aria-selected={source === "confirmed"} className="chip" disabled={!audit} onClick={() => setSource("confirmed")}>confirmed {audit?.signals.length ?? 0}</button>
        <button role="tab" aria-selected={source === "candidates"} className="chip" onClick={() => setSource("candidates")}>unconfirmed {data.signals.length}</button>
      </div>
      <div className="filters" style={{ marginTop: 0 }}>
        {(["all", ...KINDS] as const).map((k) => (
          <button key={k} className="chip" aria-pressed={kind === k} onClick={() => setKind(k)}>
            {k === "all" ? "all" : KIND[k].label} {k === "all" ? rows.length : rows.filter((r) => r.kind === k).length}
          </button>
        ))}
      </div>
      {shown.length ? (
        <ul className="rows">
          {shown.slice(0, 200).map((r, i) => (
            <li key={i} className="row">
              <Dot tone={KIND[r.kind]?.tone} />
              <span className="grow"><ThreadLink id={r.threadId}><q>{r.quote}</q></ThreadLink></span>
              <span className="label">{r.project}</span>
              <span className="label num">{shortDay(r.date)}</span>
            </li>
          ))}
        </ul>
      ) : <Empty title="Nothing here." />}
    </>
  );
}
