#!/usr/bin/env node
// Checks the upstream repos in sources.json for changes to skills we adopted.
//
//   node scripts/upstream.mjs           pull _sources/ and list skills whose upstream changed
//   node scripts/upstream.mjs --record  record the current upstream commit and hash for every skill
//                                       (run after adopting a skill or accepting an update)
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcesDir = path.join(root, "_sources");
const sourcesFile = path.join(root, "sources.json");
const record = process.argv.includes("--record");
const sources = JSON.parse(fs.readFileSync(sourcesFile, "utf8"));

const git = (cwd, ...args) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
const cloneDir = (repo) => path.join(sourcesDir, repo.replace("/", "_"));

// Hash of every file in a folder, so a change anywhere in the skill shows up.
function hashDir(dir) {
  const h = crypto.createHash("sha256");
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else {
        h.update(path.relative(dir, p).split(path.sep).join("/"));
        h.update(fs.readFileSync(p, "utf8").replace(/\r\n/g, "\n"));
      }
    }
  };
  walk(dir);
  return h.digest("hex").slice(0, 16);
}

fs.mkdirSync(sourcesDir, { recursive: true });
const repos = [...new Set(Object.values(sources.skills).map((s) => s.repo))];
const heads = {};
for (const repo of repos) {
  const dir = cloneDir(repo);
  if (!fs.existsSync(dir)) {
    execFileSync("git", ["clone", "--depth", "1", `https://github.com/${repo}`, dir], { stdio: "inherit" });
  } else if (!record) {
    git(dir, "fetch", "--depth", "1", "origin", "HEAD");
    git(dir, "reset", "--hard", "FETCH_HEAD");
  }
  heads[repo] = git(dir, "rev-parse", "--short", "HEAD");
}

let changed = 0;
for (const [name, s] of Object.entries(sources.skills)) {
  const upstreamPath = path.join(cloneDir(s.repo), s.path);
  if (!fs.existsSync(upstreamPath)) {
    console.log(`? ${name}: ${s.path} no longer exists upstream in ${s.repo}`);
    continue;
  }
  const hash = hashDir(upstreamPath);
  if (record) {
    s.commit = heads[s.repo];
    s.upstreamHash = hash;
    continue;
  }
  if (hash === s.upstreamHash) continue;
  changed++;
  console.log(`\n* ${name}: changed upstream (${s.repo} ${s.commit} -> ${heads[s.repo]})`);
  if (s.changes?.length) console.log(`  our changes to reapply: ${s.changes.join("; ")}`);
  try {
    execFileSync("git", ["diff", "--no-index", "--stat", path.join(root, "skills", name), upstreamPath], {
      stdio: "inherit",
    });
  } catch {
    // git diff exits 1 when the folders differ
  }
}

if (record) {
  fs.writeFileSync(sourcesFile, JSON.stringify(sources, null, 2) + "\n");
  console.log(`recorded ${Object.keys(sources.skills).length} skills`);
} else {
  console.log(changed ? `\n${changed} skill(s) changed upstream.` : "All adopted skills match upstream.");
}
