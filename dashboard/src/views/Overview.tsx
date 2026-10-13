import type { ViewProps } from "./index";
import { DayBars, Empty, KindTag, Section, ThreadLink } from "../ui";
import { SuggestionRow, openSuggestions } from "./Suggestions";
import { shortDay } from "../api";

const ROUTING_DAY = "2026-10-13";

export function Overview({ data, audits, decisions, decide, go }: ViewProps) {
  const audit = audits[0];
  const open = openSuggestions(audits, decisions);
  const days = data.daily.slice(-14);
  const confirmed = audit?.signals.filter((s) => s.kind !== "praise").slice(0, 5) ?? [];
  return (
    <>
      <header className="page-head">
        <p className="eyebrow">{audit ? `Audit of ${shortDay(audit.window.from)} – ${shortDay(audit.window.to)}` : "No audit yet"}</p>
        <h1>{audit?.headline ?? "Run the first audit to see how your skills are doing"}</h1>
        <p className="lede num">
          {data.totals.sessions} sessions since {shortDay(data.since)} · {data.totals.loads} skill loads · {data.totals.critlyRuns} Critly checks run
        </p>
      </header>

      <Section title="Needs you" meta={`${open.length} open suggestion${open.length === 1 ? "" : "s"}`} action={open.length > 5 ? <button className="btn ghost" onClick={() => go("suggestions")}>See all</button> : null}>
        {open.length ? (
          <div className="needs">{open.slice(0, 5).map((s) => <SuggestionRow key={s.id} s={s} decisions={decisions} decide={decide} />)}</div>
        ) : audit ? (
          <Empty title="Nothing waiting on you">Every suggestion from the last audit is accepted or skipped. The next audit adds new ones.</Empty>
        ) : (
          <Empty title="No suggestions yet">They come from the audit. It runs every two days, or type <code>/audit-skills</code> in a library thread.</Empty>
        )}
      </Section>

      <div className="grid2">
        <Section title="Skills loaded per day" meta="last 14 days">
          <DayBars
            days={days.map((d) => ({ day: d.day, values: [d.claude, d.codex] }))}
            series={[{ label: "Claude", color: "var(--series-1)" }, { label: "Codex", color: "var(--series-2)" }]}
            mark={days.some((d) => d.day === ROUTING_DAY) ? { day: ROUTING_DAY, label: "routing block added" } : undefined}
          />
        </Section>
        <Section title="How you reacted" meta="word-list matches">
          <DayBars
            days={days.map((d) => ({ day: d.day, values: [d.frustration, d.praise] }))}
            series={[{ label: "frustrated", color: "var(--warn)" }, { label: "praise", color: "var(--ok)" }]}
          />
        </Section>
      </div>

      <Section title="What went wrong" meta="confirmed by the audit" action={<button className="btn ghost" onClick={() => go("signals")}>All signals</button>}>
        {confirmed.length ? (
          <ul className="feed">
            {confirmed.map((s, i) => (
              <li key={i}>
                <div className="feed-meta"><KindTag kind={s.kind} /><span className="num">{shortDay(s.date)}</span><span>{s.project}</span><ThreadLink id={s.threadId} title="open thread" /></div>
                <q>{s.quote}</q>
                {s.context && <p className="muted">{s.context}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <Empty title="No confirmed signals yet">The audit confirms signals by reading each thread. Until then, Signals shows the collector's unconfirmed matches.</Empty>
        )}
      </Section>
    </>
  );
}
