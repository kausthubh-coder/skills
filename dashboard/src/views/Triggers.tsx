import type { ViewProps } from "./index";
import { Empty, Section, Tag } from "../ui";

// Columns worth comparing; other variants are experiments.
const COLUMNS = [
  { agent: "claude", variant: "global", label: "Claude before" },
  { agent: "claude", variant: "final", label: "Claude now" },
  { agent: "codex", variant: "global", label: "Codex", note: "every run uses live settings" },
];

export function Triggers({ triggers }: ViewProps) {
  if (!triggers.length) return <Empty title="No trigger tests yet">Run <code>node evals/trigger/run.mjs claude final 3</code> in the library.</Empty>;
  const cases = [...new Set(triggers.map((t) => t.id))];
  const cell = (agent: string, variant: string, id: string) => triggers.find((t) => t.agent === agent && t.variant === variant && t.id === id);
  return (
    <>
      <header className="page-head">
        <h1>Trigger tests</h1>
        <p className="lede">Real prompts from your threads, run in a sample repo: did the agent load the right skill on its own? Rerun after changing any skill description or the routing block.</p>
      </header>
      <Section title={`${cases.length} prompts`}>
        <div className="table-wrap"><table>
          <thead><tr><th>Prompt</th><th>Expects</th>{COLUMNS.map((c) => <th key={c.label} className="n">{c.label}</th>)}</tr></thead>
          <tbody>
            {cases.map((id) => {
              const expect = triggers.find((t) => t.id === id)!.expect;
              return (
                <tr key={id}>
                  <td>{id.replace(/-/g, " ")}</td>
                  <td><code>{expect.replace("|", " or ")}</code></td>
                  {COLUMNS.map((c) => {
                    const t = cell(c.agent, c.variant, id);
                    if (!t) return <td key={c.label} className="n muted">—</td>;
                    const tone = t.hits === t.runs ? "ok" : t.hits === 0 ? "bad" : "warn";
                    return <td key={c.label} className="n"><Tag tone={tone}>{t.hits}/{t.runs}</Tag></td>;
                  })}
                </tr>
              );
            })}
          </tbody>
        </table></div>
        <p className="note">Codex has no separate "now" column: its runs read your live global files, so its later rows include the fix. Totals mix runs from before and after 13 Oct.</p>
      </Section>
    </>
  );
}
