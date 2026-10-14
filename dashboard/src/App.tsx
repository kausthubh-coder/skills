import { useCallback, useEffect, useState } from "react";
import { api, type Audit, type Data, type Decisions, type Trigger } from "./api";
import { views, type ViewProps } from "./views";

const viewFromHash = () => (views.some((v) => v.id === location.hash.slice(1)) ? location.hash.slice(1) : "overview");

export function App() {
  const [data, setData] = useState<Data | null>(null);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [decisions, setDecisions] = useState<Decisions>({});
  const [view, setView] = useState(viewFromHash);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.data(), api.audits(), api.triggers(), api.decisions()])
      .then(([d, a, t, dec]) => { setData(d); setAudits(a); setTriggers(t); setDecisions(dec); })
      .catch((e) => setError(String(e)));
    const onHash = () => setView(viewFromHash());
    addEventListener("hashchange", onHash);
    return () => removeEventListener("hashchange", onHash);
  }, []);

  const go = useCallback((id: string) => { location.hash = id; }, []);
  const decide = useCallback((id: string, status: "accepted" | "skipped" | "open") => {
    setDecisions((d) => { const next = { ...d }; if (status === "open") delete next[id]; else next[id] = { status, at: new Date().toISOString() }; return next; });
    api.decide(id, status).then(setDecisions);
  }, []);
  const recollect = async () => { setBusy(true); try { setData(await api.collect()); } finally { setBusy(false); } };

  if (error) return <main className="main"><div className="empty"><b>Couldn't load the data.</b>Is the server running? <code>bun dashboard/server.ts</code></div></main>;
  if (!data) return <main className="main" aria-busy="true"><div className="skeleton" /><div className="skeleton short" /></main>;

  const props: ViewProps = { data, audits, triggers, decisions, decide, go };
  const Current = views.find((v) => v.id === view)!.View;
  const updated = new Date(data.generatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return (
    <div className="shell">
      <aside className="side">
        <div className="brand"><b>●</b> Skills</div>
        <nav aria-label="Views">
          {views.map((v) => {
            const n = v.count?.(props);
            return (
              <a key={v.id} href={`#${v.id}`} aria-current={view === v.id ? "page" : undefined}>
                <span>{v.label}</span>{n ? <span className="count num">{n}</span> : null}
              </a>
            );
          })}
        </nav>
        <div className="side-foot">
          <span className="label">Data {updated}</span>
          <button className="btn" onClick={recollect} disabled={busy}>{busy ? "Collecting…" : "Recollect"}</button>
        </div>
      </aside>
      <main className="main" key={view}><Current {...props} /></main>
    </div>
  );
}
