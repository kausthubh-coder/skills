import { useState } from "react";
import type { ViewProps } from "./index";
import type { Audit, Decisions, Suggestion } from "../api";
import { Dot, Empty, Head, ThreadLink } from "../ui";

const IMPACT = { high: 0, med: 1, low: 2 } as const;
const IMPACT_TONE = { high: "bad", med: "warn", low: undefined } as const;

// Suggestions from every audit, newest audit first, deduped by id, highest impact first.
export function allSuggestions(audits: Audit[]) {
  const seen = new Map<string, Suggestion>();
  for (const a of audits) for (const s of a.suggestions ?? []) if (!seen.has(s.id)) seen.set(s.id, s);
  return [...seen.values()].sort((a, b) => IMPACT[a.impact] - IMPACT[b.impact]);
}
export const openSuggestions = (audits: Audit[], d: Decisions) => allSuggestions(audits).filter((s) => !d[s.id]);

// One fix: a dot for impact, a few words, Accept / Skip. The reasoning opens on click.
export function FixRow({ s, decisions, decide }: { s: Suggestion; decisions: Decisions; decide: ViewProps["decide"] }) {
  const [open, setOpen] = useState(false);
  const status = decisions[s.id]?.status;
  return (
    <li className={`row ${status ? "done" : ""}`} style={{ flexWrap: "wrap" }}>
      <Dot tone={IMPACT_TONE[s.impact]} />
      <button className="linkish grow" style={{ textAlign: "left", color: "var(--text)" }} aria-expanded={open} onClick={() => setOpen(!open)}>
        {s.short ?? s.title}
      </button>
      {status ? (
        <button className="btn ghost" onClick={() => decide(s.id, "open")}>{status} · undo</button>
      ) : (
        <>
          <button className="btn accent" onClick={() => decide(s.id, "accepted")}>Accept</button>
          <button className="btn ghost" onClick={() => decide(s.id, "skipped")}>Skip</button>
        </>
      )}
      {open && (
        <div style={{ flexBasis: "100%", paddingLeft: 18, paddingBottom: 6, color: "var(--text-2)" }}>
          <p style={{ margin: "4px 0", maxWidth: "64ch" }}>{s.why}</p>
          {s.evidence?.slice(0, 3).map((e, i) => (
            <div key={i} className="sub"><ThreadLink id={e.threadId}><q>{e.quote}</q></ThreadLink></div>
          ))}
        </div>
      )}
    </li>
  );
}

export function Suggestions({ audits, decisions, decide }: ViewProps) {
  const [filter, setFilter] = useState<"open" | "accepted" | "skipped">("open");
  const all = allSuggestions(audits);
  const is = (s: Suggestion, f: typeof filter) => (f === "open" ? !decisions[s.id] : decisions[s.id]?.status === f);
  const shown = all.filter((s) => is(s, filter));
  return (
    <>
      <Head eyebrow="Fixes" title="What to change next." />
      <div className="filters" role="tablist">
        {(["open", "accepted", "skipped"] as const).map((f) => (
          <button key={f} role="tab" aria-selected={filter === f} className="chip" onClick={() => setFilter(f)}>{f} {all.filter((s) => is(s, f)).length}</button>
        ))}
      </div>
      {shown.length ? <ul className="rows">{shown.map((s) => <FixRow key={s.id} s={s} decisions={decisions} decide={decide} />)}</ul> : <Empty title={`No ${filter} fixes.`} />}
    </>
  );
}
