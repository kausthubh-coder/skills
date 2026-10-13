# dashboard

A small React site (Bun's server, no framework) that shows how my skills are doing. The audit agent edits it; keep it small.

| File | What |
|---|---|
| `collect.ts` | Reads Claude Code and Codex sessions and T3's threads; writes `reports/dashboard/data.json`. Counts only |
| `merge-audit.ts` | Merges the audit readers' files into `reports/audits/<date>.json` |
| `server.ts` | Serves the page and `/api/data`, `/api/collect`, `/api/audits`, `/api/triggers`, `/api/decisions` |
| `src/api.ts` | Types for everything the server returns. Change a shape here first |
| `src/views/index.ts` | The views in nav order. One line per view |
| `src/views/*.tsx` | One file per view |
| `src/ui.tsx` | The few shared pieces (Tag, Section, Empty, DayBars) |
| `src/styles.css` | Tokens and all styles |

- Run: `bun server.ts` (port 4791). Check: `bun run typecheck`, then `bun run lint:ui` with the server running.
- Adding a view: a file in `src/views/`, a line in `index.ts`. At most one per audit run; remove one nobody needs first.
- Look: compact and quiet. Neutrals, one accent for the current view and the next action, green/amber/red only when they mean something, tabular numbers. Use the tokens in `styles.css`; don't add colors or sizes.
- Data and quotes never go in committed files. They live in `reports/`, which is gitignored.
