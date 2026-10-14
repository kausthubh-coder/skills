// The few shared pieces. A view that needs something special builds it itself.
import type { ReactNode } from "react";
import { shortDay, threadLink, type SignalKind } from "./api";

export type Tone = "ok" | "warn" | "bad" | "info" | undefined;

export const Tag = ({ tone, children }: { tone?: Tone; children: ReactNode }) => <span className={`tag ${tone ?? ""}`}>{children}</span>;
export const Dot = ({ tone }: { tone?: Tone | "accent" }) => <i className={`dot ${tone ?? ""}`} aria-hidden="true" />;

export const KIND: Record<SignalKind, { label: string; tone: Tone }> = {
  frustration: { label: "frustrated", tone: "warn" },
  praise: { label: "praise", tone: "ok" },
  repeat: { label: "repeated", tone: "warn" },
  done_then_broken: { label: "done → broken", tone: "bad" },
  missed_skill: { label: "missed skill", tone: "bad" },
  correction: { label: "correction", tone: undefined },
};

export function ThreadLink({ id, children }: { id?: string; children: ReactNode }) {
  return id ? <a href={threadLink(id)} title="Open in T3">{children}</a> : <span>{children}</span>;
}

export function Head({ eyebrow, right, title, dek }: { eyebrow: ReactNode; right?: ReactNode; title: string; dek?: string }) {
  return (
    <header>
      <div className="top label"><span>{eyebrow}</span>{right && <span className="hot">{right}</span>}</div>
      <h1>{title}</h1>
      {dek && <p className="dek">{dek}</p>}
    </header>
  );
}

export const Empty = ({ title, children }: { title: string; children?: ReactNode }) => <div className="empty"><b>{title}</b>{children}</div>;

// Bars per day, the last one lit.
export function Spark({ values, days, height = 40 }: { values: number[]; days: string[]; height?: number }) {
  const max = Math.max(1, ...values);
  return (
    <div className="spark" style={{ height }} role="img" aria-label={values.map((v, i) => `${shortDay(days[i])} ${v}`).join(", ")}>
      {values.map((v, i) => <i key={i} className={i === values.length - 1 ? "hot" : ""} style={{ height: `${Math.max(3, (v / max) * 100)}%` }} title={`${shortDay(days[i])}: ${v}`} />)}
    </div>
  );
}
