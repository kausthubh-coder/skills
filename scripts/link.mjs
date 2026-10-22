#!/usr/bin/env node
// Links every folder in skills/, plus the skill folders of the local repos listed under "local" in
// sources.json, into each agent's global skills folder, so editing the source updates every agent
// at once. Uses junctions on Windows (no admin needed), symlinks elsewhere.
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
// Folders whose subfolders are skills: this library, then local repos that own their skills (Critly).
const local = JSON.parse(fs.readFileSync(path.join(root, "sources.json"), "utf8")).local ?? {};
const skillDirs = [skillsDir];
for (const [name, { path: rel }] of Object.entries(local)) {
  const dir = path.resolve(root, rel);
  if (fs.existsSync(dir)) skillDirs.push(dir);
  else console.log(`- ${name}: ${dir} does not exist, its skills were not linked or pruned`);
}
const prefixes = skillDirs.map((d) => norm(d) + path.sep);

// Skill name -> source folder.
const skills = new Map();
for (const dir of skillDirs) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!e.isDirectory() || !fs.existsSync(path.join(dir, e.name, "SKILL.md"))) continue;
    if (skills.has(e.name)) throw new Error(`Two skills named ${e.name}: ${skills.get(e.name)} and ${dir}`);
    skills.set(e.name, path.join(dir, e.name));
  }
}

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
    if (!t || !prefixes.some((pre) => t.startsWith(pre))) continue;
    if (unlinkAll || t !== norm(skills.get(entry) ?? "")) {
      removeLink(p);
      changes.push(`${tag}removed ${entry}`);
    }
  }

  if (!unlinkAll) {
    for (const [name, src] of skills) {
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

// global/skills.md goes into each agent's always-loaded instructions, between markers, so the rest of
// those files (my own notes) is never touched. Agents skip skills they only see in the skill list;
// this block is what makes them load the ones that matter (reports/evals/2026-10-13-trigger.md).
const START = "<!-- skills library: start (edit global/skills.md, then run scripts/link.mjs) -->";
const END = "<!-- skills library: end -->";
const block = `${START}\n${fs.readFileSync(path.join(root, "global", "skills.md"), "utf8").trim()}\n${END}`;
for (const file of [path.join(home, ".claude", "CLAUDE.md"), path.join(home, ".codex", "AGENTS.md")]) {
  const before = fs.existsSync(file) ? fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n") : "";
  const at = before.indexOf(START);
  const end = before.indexOf(END);
  const after = at >= 0 && end > at
    ? before.slice(0, at) + block + before.slice(end + END.length)
    : `${block}\n\n${before}`.trimEnd() + "\n";
  if (unlinkAll || after === before) continue;
  if (!dryRun) fs.writeFileSync(file, after);
  console.log(`- ${tag}updated the skills block in ${file}`);
}

// Hooks in global/hooks/ go into each agent's hook settings as PreToolUse commands. An entry is ours
// when its command names a file in global/hooks/; everything else in those files is left alone.
const hooksDir = path.join(root, "global", "hooks");
const hookFiles = fs.existsSync(hooksDir) ? fs.readdirSync(hooksDir).filter((f) => f.endsWith(".mjs")) : [];
const hookCommand = (f) => `node "${path.join(hooksDir, f).replace(/\\/g, "/")}"`;
const isOurs = (h) => typeof h?.command === "string" && h.command.replace(/\\/g, "/").includes("/global/hooks/");
// Claude Code: only shell calls. Codex: every call, since its shell tool names differ by surface.
for (const { file, matcher } of [
  { file: path.join(home, ".claude", "settings.json"), matcher: "Bash|PowerShell" },
  { file: path.join(home, ".codex", "hooks.json"), matcher: undefined },
]) {
  if (!fs.existsSync(path.dirname(file))) continue;
  const raw = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "{}";
  const settings = JSON.parse(raw);
  const pre = (settings.hooks?.PreToolUse ?? [])
    .map((g) => ({ ...g, hooks: (g.hooks ?? []).filter((h) => !isOurs(h)) }))
    .filter((g) => g.hooks.length);
  if (!unlinkAll && hookFiles.length) {
    pre.push({ ...(matcher ? { matcher } : {}), hooks: hookFiles.map((f) => ({ type: "command", command: hookCommand(f), timeout: 10 })) });
  }
  settings.hooks = { ...settings.hooks, PreToolUse: pre };
  if (!pre.length) delete settings.hooks.PreToolUse;
  if (!Object.keys(settings.hooks).length) delete settings.hooks;
  const after = JSON.stringify(settings, null, 2) + "\n";
  if (JSON.stringify(JSON.parse(raw)) === JSON.stringify(settings)) continue;
  if (!dryRun) fs.writeFileSync(file, after);
  console.log(`- ${tag}updated PreToolUse hooks in ${file}`);
}

if (conflicts) {
  console.log(`\n${conflicts} conflict(s). Remove or rename the existing folder, then run again.`);
  process.exitCode = 1;
}
