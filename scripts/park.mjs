#!/usr/bin/env node
// Copies vendor skills listed under "parked" in sources.json into ~/.skills-parked/.
// Parked skills are not in any agent's skill list; global/skills.md routes agents to them.
//
//   node scripts/park.mjs            pull each repo into _sources/, copy its skills, record the commit
//   node scripts/park.mjs --dry-run  show what would be copied
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcesDir = path.join(root, "_sources");
const sourcesFile = path.join(root, "sources.json");
const parkedDir = path.join(os.homedir(), ".skills-parked");
const dryRun = process.argv.includes("--dry-run");
const sources = JSON.parse(fs.readFileSync(sourcesFile, "utf8"));

const git = (cwd, ...args) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
const cloneDir = (repo) => path.join(sourcesDir, repo.replace("/", "_"));

fs.mkdirSync(sourcesDir, { recursive: true });
const owner = {};
for (const [repo, entry] of Object.entries(sources.parked)) {
  const dir = cloneDir(repo);
  if (!fs.existsSync(dir)) {
    execFileSync("git", ["clone", "--depth", "1", `https://github.com/${repo}`, dir], { stdio: "inherit" });
  } else {
    git(dir, "fetch", "--depth", "1", "origin", "HEAD");
    git(dir, "reset", "--hard", "FETCH_HEAD");
  }
  const commit = git(dir, "rev-parse", "--short", "HEAD");
  const skip = new Set(Object.keys(entry.skip ?? {}));
  const names = fs
    .readdirSync(path.join(dir, entry.path), { withFileTypes: true })
    .filter((e) => e.isDirectory() && !skip.has(e.name) && fs.existsSync(path.join(dir, entry.path, e.name, "SKILL.md")))
    .map((e) => e.name);

  for (const name of names) {
    if (owner[name]) throw new Error(`${name} is in both ${owner[name]} and ${repo}; add it to one repo's skip`);
    owner[name] = repo;
    if (dryRun) continue;
    const dest = path.join(parkedDir, name);
    fs.rmSync(dest, { recursive: true, force: true });
    fs.cpSync(path.join(dir, entry.path, name), dest, { recursive: true });
  }
  const was = entry.commit;
  if (!dryRun) entry.commit = commit;
  console.log(`${repo} @ ${commit}${was && was !== commit ? ` (was ${was})` : ""}: ${names.length} skills${dryRun ? "" : " parked"}`);
  console.log(`  ${names.join(" ")}`);
}

if (!dryRun) fs.writeFileSync(sourcesFile, JSON.stringify(sources, null, 2) + "\n");
