import { useState } from "react";
import type { ViewProps } from "./index";
import type { SignalKind } from "../api";
import { shortDay } from "../api";
import { Empty, KindTag, Section, ThreadLink } from "../ui";

const KINDS: SignalKind[] = ["frustration", "done_then_broken", "missed_skill", "repeat", "correction", "praise"];
type Row = { kind: SignalKind; date: string; project: string; quote: string; context?: string; threadId?: string; threadTitle?: string; skill?: string | null };

export function Signals({ data, audits }: ViewProps) {
  const audit = audits[0];
  const [source, setSource] = useState<"confirmed" | "candidates">(audit ? "confirmed" : "candidates");
  const [kind, setKind] = useState<SignalKind | "all">("all");
  const rows: Row[] = source === "confirmed"
    ? (audit?.signals ?? []).map((s) => ({ ...s }))
    : data.signals.map((s) => ({ kind: s.kind, date: s.at, project: s.project, quote: s.text, threadId: s.threadId, threadTitle: s.threadTitle, skill: s.skill }));
  const shown = rows.filter((r) => kind === "all" || r.kind === kind).sort((a, b) => b.date.localeCompare(a.date));
  return (
    <>
      <header className="page-head">
        <h1>Signals</h1>
        <p className="lede">What you said that tells how the agents did. Confirmed signals come from the audit reading each thread; candidates are the collector's word-list matches and include false alarms.</p>
      </header>
      <div className="chips" role="tablist">
        <button role="tab" aria-selected={source === "confirmed"} className="chip" onClick={() => setSource("confirmed")} disabled={!audit}>confirmed <span className="num muted">{audit?.signals.length ?? 0}</span></button>
        <button role="tab" aria-selected={source === "candidates"} className="chip" onClick={() => setSource("candidates")}>candidates <span className="num muted">{data.signals.length}</span></button>
        <span className="chip-gap" />
        {(["all", ...KINDS] as const).map((k) => (
          <button key={k} className="chip" aria-pressed={kind === k} onClick={() => setKind(k)}>
            {k.replace(/_/g, " ")} <span className="num muted">{k === "all" ? rows.length : rows.filter((r) => r.kind === k).length}</span>
          </button>
        ))}
      </div>
      <Section title={`${shown.length} signals`}>
        {shown.length ? (
          <ul className="feed">
            {shown.slice(0, 200).map((r, i) => (
              <li key={i}>
                <div className="feed-meta">
                  <KindTag kind={r.kind} />
                  <span className="num">{shortDay(r.date)}</span><span>{r.project}</span>
                  {r.skill && <code>{r.skill}</code>}
                  <ThreadLink id={r.threadId} title={r.threadTitle ?? "open thread"} />
                </div>
                <q>{r.quote}</q>
                {r.context && <p className="muted">{r.context}</p>}
              </li>
            ))}
          </ul>
        ) : <Empty title="Nothing matches">Try another kind, or switch between confirmed and candidates.</Empty>}
      </Section>
    </>
  );
}
