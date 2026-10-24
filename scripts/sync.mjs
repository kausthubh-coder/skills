#!/usr/bin/env node
// Keeps this machine's skills in step with GitHub: fast-forwards this library and the local repos
// under "local" in sources.json (Critly), then reruns link.mjs if anything moved. A scheduler runs
// it every 5 minutes on the laptop (Task Scheduler "Skills sync", scripts/sync-task.ps1) and the
// Mac mini (LaunchAgent box.skills-sync). It never merges, rebases or pushes: a checkout with
// diverged or conflicting work is left alone and reported.
//
//   node scripts/sync.mjs              print what moved
//   node scripts/sync.mjs --log <file> append it to <file> instead (Task Scheduler can't redirect)
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const local = JSON.parse(fs.readFileSync(path.join(root, "sources.json"), "utf8")).local ?? {};
const repos = [root, ...Object.values(local).map(({ path: rel }) => path.resolve(root, rel, ".."))];
const logAt = process.argv.indexOf("--log");
const logFile = logAt > 0 ? process.argv[logAt + 1] : null;

const out = [];
const git = (cwd, ...args) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
const stamp = new Date().toISOString();
let moved = false;

for (const repo of new Set(repos)) {
  if (!fs.existsSync(path.join(repo, ".git"))) continue;
  try {
    const before = git(repo, "rev-parse", "HEAD");
    git(repo, "pull", "--ff-only", "-q");
    const after = git(repo, "rev-parse", "HEAD");
    if (before !== after) {
      moved = true;
      out.push(`${stamp} ${path.basename(repo)}: ${before.slice(0, 7)} -> ${after.slice(0, 7)}`);
    }
  } catch (e) {
    out.push(`${stamp} ${path.basename(repo)}: not synced: ${String(e.stderr || e.message).trim().split("\n")[0]}`);
  }
}

if (moved) out.push(execFileSync(process.execPath, [path.join(root, "scripts", "link.mjs")], { encoding: "utf8" }).trim());
if (out.length) logFile ? fs.appendFileSync(logFile, out.join("\n") + "\n") : console.log(out.join("\n"));
