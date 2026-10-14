import type { ViewProps } from "./index";
import { Empty, Head, Tag } from "../ui";

// Columns worth comparing; other variants are experiments.
const COLUMNS = [
  { agent: "claude", variant: "global", label: "Claude before" },
  { agent: "claude", variant: "final", label: "Claude now" },
  { agent: "codex", variant: "global", label: "Codex" },
];

export function Triggers({ triggers }: ViewProps) {
  if (!triggers.length) return <><Head eyebrow="Trigger tests" title="No runs yet." /><Empty title="node evals/trigger/run.mjs claude final 3" /></>;
  const cases = [...new Set(triggers.map((t) => t.id))];
  const cell = (agent: string, variant: string, id: string) => triggers.find((t) => t.agent === agent && t.variant === variant && t.id === id);
  return (
    <>
      <Head eyebrow="Trigger tests" title="Does the right skill load?" />
      <div className="table-wrap" style={{ marginTop: 24 }}><table>
        <thead><tr><th>Prompt</th><th>Expects</th>{COLUMNS.map((c) => <th key={c.label} className="n">{c.label}</th>)}</tr></thead>
        <tbody>
          {cases.map((id) => {
            const expect = triggers.find((t) => t.id === id)!.expect;
            return (
              <tr key={id}>
                <td>{id.replace(/-/g, " ")}</td>
                <td className="mono muted">{expect.replace("|", " / ")}</td>
                {COLUMNS.map((c) => {
                  const t = cell(c.agent, c.variant, id);
                  if (!t) return <td key={c.label} className="n zero">—</td>;
                  return <td key={c.label} className="n"><Tag tone={t.hits === t.runs ? "ok" : t.hits === 0 ? "bad" : "warn"}>{t.hits}/{t.runs}</Tag></td>;
                })}
              </tr>
            );
          })}
        </tbody>
      </table></div>
    </>
  );
}
