import type { ViewProps } from "./index";
import { shortDay } from "../api";
import { Empty, Head, Spark } from "../ui";
import { FixRow, openSuggestions } from "./Suggestions";

const GRADES = [
  { grade: "missed", label: "Missed", tone: "bad" },
  { grade: "mixed", label: "Mixed", tone: "warn" },
  { grade: "working", label: "Working", tone: "ok" },
] as const;

export function Overview({ data, audits, decisions, decide, go }: ViewProps) {
  const audit = audits[0];
  const open = openSuggestions(audits, decisions);
  const days = data.daily.slice(-14);
  const v = { good: 0, mixed: 0, bad: 0 };
  for (const t of audit?.threads ?? []) v[t.verdict]++;
  const total = v.good + v.mixed + v.bad;
  const corrections = audit?.signals.filter((s) => s.kind === "correction" || s.kind === "frustration" || s.kind === "done_then_broken").length ?? 0;
  const skillNames = new Set(data.skills.map((s) => s.name));
  const graded = (audit?.skills ?? []).filter((s) => skillNames.has(s.name));

  return (
    <>
      <Head
        eyebrow={audit ? `Audit · ${shortDay(audit.window.from)}–${shortDay(audit.window.to)}` : "No audit yet"}
        right={open.length ? `${open.length} fixes waiting` : undefined}
        title={audit?.title ?? audit?.headline ?? "Run the first audit."}
        dek={audit?.dek}
      />

      <div className="stats">
        <div className="stat">
          <div className="label">Threads</div>
          <div className="v">{total || "—"}</div>
          {total > 0 && (
            <>
              <div className="split" role="img" aria-label={`${v.good} good, ${v.mixed} mixed, ${v.bad} bad`}>
                <i style={{ flex: v.good, background: "var(--ok)" }} /><i style={{ flex: v.mixed, background: "var(--warn)" }} /><i style={{ flex: v.bad, background: "var(--bad)" }} />
              </div>
              <div className="legend"><span><i style={{ background: "var(--ok)" }} />{v.good}</span><span><i style={{ background: "var(--warn)" }} />{v.mixed}</span><span><i style={{ background: "var(--bad)" }} />{v.bad}</span></div>
            </>
          )}
        </div>
        <div className="stat">
          <div className="label">Pushback</div>
          <div className="v">{corrections || "—"}</div>
          <div className="legend"><span>corrections, frustration, broken “done”</span></div>
        </div>
        <div className="stat">
          <div className="label">Skill loads / day</div>
          <Spark values={days.map((d) => d.claude + d.codex)} days={days.map((d) => d.day)} />
          <div className="legend num"><span>{shortDay(days[0]?.day ?? data.since)}</span><span style={{ marginLeft: "auto" }}>today {days.at(-1) ? days.at(-1)!.claude + days.at(-1)!.codex : 0}</span></div>
        </div>
      </div>

      <div className="cols">
        <section className="block">
          <h2>Fixes</h2>
          {open.length ? (
            <ul className="rows">{open.slice(0, 6).map((s) => <FixRow key={s.id} s={s} decisions={decisions} decide={decide} />)}</ul>
          ) : <Empty title={audit ? "Nothing waiting." : "No fixes yet."} />}
          {open.length > 6 && <button className="linkish label" style={{ marginTop: 8 }} onClick={() => go("suggestions")}>+{open.length - 6} more</button>}
        </section>
        <section className="block">
          {GRADES.map((g) => {
            const names = graded.filter((s) => s.grade === g.grade).map((s) => s.name);
            if (!names.length) return null;
            return (
              <div key={g.grade}>
                <h2 style={{ color: `var(--${g.tone})` }}>{g.label} <span className="count">{names.length}</span></h2>
                <div className="chips">{names.map((n) => <span key={n} className={`chip ${g.tone}`}>{n}</span>)}</div>
              </div>
            );
          })}
          {!graded.length && <Empty title="No grades yet." />}
        </section>
      </div>
    </>
  );
}
