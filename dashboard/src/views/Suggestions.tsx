import { useState } from "react";
import type { ViewProps } from "./index";
import type { Audit, Decisions, Suggestion } from "../api";
import { Empty, Section, Tag, ThreadLink } from "../ui";

const IMPACT = { high: 0, med: 1, low: 2 } as const;
const KIND_LABEL: Record<Suggestion["kind"], string> = {
  add: "add skill", retire: "retire", "fix-skill": "fix skill", "agents-md": "AGENTS.md", routing: "routing", project: "project", upstream: "upstream",
};

// Suggestions from every audit, newest audit first, deduped by id.
export function allSuggestions(audits: Audit[]) {
  const seen = new Map<string, Suggestion & { auditDate: string }>();
  for (const a of audits) for (const s of a.suggestions ?? []) if (!seen.has(s.id)) seen.set(s.id, { ...s, auditDate: a.date });
  return [...seen.values()].sort((a, b) => IMPACT[a.impact] - IMPACT[b.impact]);
}
export const openSuggestions = (audits: Audit[], d: Decisions) => allSuggestions(audits).filter((s) => !d[s.id]);

export function SuggestionRow({ s, decisions, decide }: { s: Suggestion; decisions: Decisions; decide: ViewProps["decide"] }) {
  const [open, setOpen] = useState(false);
  const status = decisions[s.id]?.status;
  return (
    <div className="needs-row">
      <div>
        <div className="needs-title">
          <b>{s.title}</b>
          <Tag tone={s.impact === "high" ? "info" : undefined}>{KIND_LABEL[s.kind] ?? s.kind}</Tag>
          {status && <Tag tone={status === "accepted" ? "ok" : undefined}>{status}</Tag>}
        </div>
        <p>{s.why}</p>
        {s.evidence?.length > 0 && (
          <button className="linkish" aria-expanded={open} onClick={() => setOpen(!open)}>
            {open ? "Hide evidence" : `Evidence (${s.evidence.length})`}
          </button>
        )}
        {open && (
          <ul className="evidence">
            {s.evidence.map((e, i) => <li key={i}><q>{e.quote}</q> <ThreadLink id={e.threadId} title="thread" /></li>)}
          </ul>
        )}
      </div>
      <div className="actions">
        {status ? (
          <button className="btn ghost" onClick={() => decide(s.id, "open")}>Undo</button>
        ) : (
          <>
            <button className="btn accent" onClick={() => decide(s.id, "accepted")}>Accept</button>
            <button className="btn ghost" onClick={() => decide(s.id, "skipped")}>Skip</button>
          </>
        )}
      </div>
    </div>
  );
}

export function Suggestions({ audits, decisions, decide }: ViewProps) {
  const [filter, setFilter] = useState<"open" | "accepted" | "skipped">("open");
  const all = allSuggestions(audits);
  const shown = all.filter((s) => (filter === "open" ? !decisions[s.id] : decisions[s.id]?.status === filter));
  const count = (f: typeof filter) => all.filter((s) => (f === "open" ? !decisions[s.id] : decisions[s.id]?.status === f)).length;
  return (
    <>
      <header className="page-head">
        <h1>Suggestions</h1>
        <p className="lede">What the audit thinks you should add, retire or fix. Accepted ones get done by the next audit run, or say "do the accepted suggestions" in any library thread.</p>
      </header>
      <div className="chips" role="tablist">
        {(["open", "accepted", "skipped"] as const).map((f) => (
          <button key={f} role="tab" aria-selected={filter === f} className="chip" onClick={() => setFilter(f)}>
            {f} <span className="num muted">{count(f)}</span>
          </button>
        ))}
      </div>
      <Section title={`${shown.length} ${filter}`}>
        {shown.length ? <div className="needs">{shown.map((s) => <SuggestionRow key={s.id} s={s} decisions={decisions} decide={decide} />)}</div>
          : <Empty title={`No ${filter} suggestions`}>{filter === "open" ? "You've decided on everything. The next audit adds more." : "Nothing here yet."}</Empty>}
      </Section>
    </>
  );
}
