#!/usr/bin/env node
// Links every folder in skills/ into each agent's global skills folder, so editing the library
// updates every agent at once. Uses junctions on Windows (no admin needed), symlinks elsewhere.
//
//   node scripts/link.mjs            link new skills, prune links to skills that no longer exist
//   node scripts/link.mjs --dry-run  show what would change
//   node scripts/link.mjs --unlink   remove every link that points into this library
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const skillsDir = path.join(root, "skills");
const home = os.homedir();

// Global skill folders. Codex (CLI and app) reads ~/.agents/skills; Claude Code reads ~/.claude/skills.
// T3 Code runs both, so it picks up whatever these two folders hold.
const targets = [
  { agent: "codex", dir: path.join(home, ".agents", "skills") },
  { agent: "claude code", dir: path.join(home, ".claude", "skills") },
];

const dryRun = process.argv.includes("--dry-run");
const unlinkAll = process.argv.includes("--unlink");

const norm = (p) => {
  const clean = path.resolve(p.replace(/^\\\\\?\\/, ""));
  return process.platform === "win32" ? clean.toLowerCase() : clean;
};
const libraryPrefix = norm(skillsDir) + path.sep;

const skills = fs
  .readdirSync(skillsDir, { withFileTypes: true })
  .filter((e) => e.isDirectory() && fs.existsSync(path.join(skillsDir, e.name, "SKILL.md")))
  .map((e) => e.name);

// Where a link points, or null if the entry is not a link.
function linkTarget(p) {
  try {
    if (!fs.lstatSync(p).isSymbolicLink()) return null;
    return norm(path.resolve(path.dirname(p), fs.readlinkSync(p)));
  } catch {
    return null;
  }
}

// Removes the link only. Never recursive: a recursive delete through a junction would delete the library.
function removeLink(p) {
  if (dryRun) return;
  try {
    fs.unlinkSync(p);
  } catch {
    fs.rmdirSync(p);
  }
}

const tag = dryRun ? "[dry-run] " : "";
let conflicts = 0;

for (const { agent, dir } of targets) {
  if (!fs.existsSync(dir)) {
    console.log(`- ${agent}: ${dir} does not exist, skipped`);
    continue;
  }
  const changes = [];

  for (const entry of fs.readdirSync(dir)) {
    const p = path.join(dir, entry);
    const t = linkTarget(p);
    if (!t || !t.startsWith(libraryPrefix)) continue;
    if (unlinkAll || !skills.includes(entry)) {
      removeLink(p);
      changes.push(`${tag}removed ${entry}`);
    }
  }

  if (!unlinkAll) {
    for (const name of skills) {
      const src = path.join(skillsDir, name);
      const dest = path.join(dir, name);
      const t = linkTarget(dest);
      if (t === norm(src)) continue;
      if (fs.existsSync(dest) || t) {
        conflicts++;
        changes.push(`CONFLICT ${name}: ${dest} already exists and is not this library's, left alone`);
        continue;
      }
      if (!dryRun) fs.symlinkSync(src, dest, process.platform === "win32" ? "junction" : "dir");
      changes.push(`${tag}linked ${name}`);
    }
  }

  console.log(`- ${agent}: ${dir}`);
  for (const c of changes) console.log(`    ${c}`);
  if (!changes.length) console.log("    up to date");
}

if (conflicts) {
  console.log(`\n${conflicts} conflict(s). Remove or rename the existing folder, then run again.`);
  process.exitCode = 1;
}
