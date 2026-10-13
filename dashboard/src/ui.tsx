// Small shared pieces. Keep this file short: a view that needs something special builds it itself.
import type { ReactNode } from "react";
import { shortDay, threadLink, type SignalKind } from "./api";

export function Tag({ tone, children }: { tone?: "ok" | "warn" | "bad" | "info"; children: ReactNode }) {
  return <span className={`tag ${tone ?? ""}`}>{children}</span>;
}

const KIND: Record<SignalKind, { label: string; tone: "ok" | "warn" | "bad" | "info" | undefined }> = {
  frustration: { label: "frustrated", tone: "warn" },
  praise: { label: "praise", tone: "ok" },
  repeat: { label: "repeated", tone: "warn" },
  done_then_broken: { label: "done, then broken", tone: "bad" },
  missed_skill: { label: "missed skill", tone: "bad" },
  correction: { label: "correction", tone: undefined },
};
export const KindTag = ({ kind }: { kind: SignalKind }) => <Tag tone={KIND[kind]?.tone}>{KIND[kind]?.label ?? kind}</Tag>;

export function ThreadLink({ id, title }: { id?: string; title?: string }) {
  if (!id) return <span className="muted">{title ?? "no thread"}</span>;
  return <a href={threadLink(id)} title="Open in T3">{title ?? "thread"}</a>;
}

export function Section({ title, meta, action, children }: { title: string; meta?: ReactNode; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="section">
      <div className="section-head">
        <h2>{title}{meta != null && <span className="meta">{meta}</span>}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Empty({ title, children }: { title: string; children: ReactNode }) {
  return <div className="empty"><b>{title}</b><p>{children}</p></div>;
}

// Bars per day. Each series is a value per day, stacked in the order given.
export function DayBars({ days, series, height = 140, mark }: {
  days: { day: string; values: number[] }[];
  series: { label: string; color: string }[];
  height?: number;
  mark?: { day: string; label: string };
}) {
  const max = Math.max(1, ...days.map((d) => d.values.reduce((a, b) => a + b, 0)));
  return (
    <figure className="daybars" aria-label={series.map((s, i) => `${s.label}: ${days.map((d) => d.values[i]).join(", ")}`).join(". ")}>
      <div className="plot" style={{ height }}>
        {days.map((d) => {
          const total = d.values.reduce((a, b) => a + b, 0);
          return (
            <div key={d.day} className={`col ${mark?.day === d.day ? "marked" : ""}`} title={`${shortDay(d.day)}: ${series.map((s, i) => `${d.values[i]} ${s.label}`).join(", ")}`}>
              <span className="v num">{total || ""}</span>
              <div className="stack" style={{ height: `${(total / max) * 100}%` }}>
                {d.values.map((v, i) => v > 0 && <div key={i} style={{ flexGrow: v, background: series[i].color }} />)}
              </div>
            </div>
          );
        })}
      </div>
      <div className="xlab num">{days.map((d, i) => <span key={d.day}>{i % 2 === days.length % 2 ? "" : shortDay(d.day)}</span>)}</div>
      <figcaption className="legend">
        {series.map((s) => <span key={s.label}><i style={{ background: s.color }} />{s.label}</span>)}
        {mark && <span><i className="markkey" />{mark.label}</span>}
      </figcaption>
    </figure>
  );
}
