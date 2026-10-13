// The views, in nav order. To add one: write src/views/<Name>.tsx taking ViewProps, then add a line here.
// The audit agent may add or remove a view; see dashboard/AGENTS.md for the rules.
import type { Audit, Data, Decisions, Trigger } from "../api";
import { Audits } from "./Audits";
import { Overview } from "./Overview";
import { Projects } from "./Projects";
import { Signals } from "./Signals";
import { Skills } from "./Skills";
import { Suggestions, openSuggestions } from "./Suggestions";
import { Triggers } from "./Triggers";

export type ViewProps = {
  data: Data; audits: Audit[]; triggers: Trigger[]; decisions: Decisions;
  decide: (id: string, status: "accepted" | "skipped" | "open") => void;
  go: (view: string) => void;
};

export const views: { id: string; label: string; View: (p: ViewProps) => React.ReactNode; count?: (p: ViewProps) => number }[] = [
  { id: "overview", label: "Overview", View: Overview },
  { id: "suggestions", label: "Suggestions", View: Suggestions, count: (p) => openSuggestions(p.audits, p.decisions).length },
  { id: "skills", label: "Skills", View: Skills },
  { id: "signals", label: "Signals", View: Signals, count: (p) => p.audits[0]?.signals.length ?? 0 },
  { id: "projects", label: "Projects", View: Projects },
  { id: "audits", label: "Audits", View: Audits },
  { id: "triggers", label: "Trigger tests", View: Triggers },
];
