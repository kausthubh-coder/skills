// Skill trigger test: does the agent pick the right skill on its own for a real prompt?
//
//   node evals/trigger/run.mjs snapshot <variant>          copy the SKILL.md of every skill Claude sees globally into variants/<variant>
//   node evals/trigger/run.mjs claude <variant> [reps] [ids] run each case in a fresh fixture repo whose only skills are variants/<variant>
//   node evals/trigger/run.mjs codex [reps] [ids]           run each case with Codex and its real global skills
//
// Claude runs use --setting-sources project, so the variant folder is the whole skill set (plus Claude's built-ins).
// Tools are limited to Skill, Read, Glob and Grep, so nothing can be changed. Results append to reports/evals/trigger.jsonl.
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"));
const repo = path.resolve(here, "../..");
const cases = JSON.parse(fs.readFileSync(path.join(here, "cases.json"), "utf8"));
const out = path.join(repo, "reports", "evals", "trigger.jsonl");
// global npm packages (scoop's nodejs-lts keeps them in <node dir>/bin/node_modules)
const bin = [path.join(path.dirname(process.execPath), "bin", "node_modules"), path.join(path.dirname(process.execPath), "node_modules")]
  .find((d) => fs.existsSync(path.join(d, "@anthropic-ai")));
const CLAUDE = path.join(bin, "@anthropic-ai/claude-code/bin/claude.exe");
const CODEX = path.join(bin, "@openai/codex/bin/codex.js");
const CONCURRENCY = 4;

const [cmd, ...rest] = process.argv.slice(2);

function copySkillMds(fromDir, toDir) {
  for (const name of fs.readdirSync(fromDir)) {
    const md = path.join(fromDir, name, "SKILL.md");
    if (!fs.existsSync(md)) continue;
    fs.mkdirSync(path.join(toDir, name), { recursive: true });
    fs.copyFileSync(md, path.join(toDir, name, "SKILL.md"));
  }
}

function makeFixture(variant) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "trigger-"));
  fs.cpSync(path.join(here, "fixture"), dir, { recursive: true });
  if (variant) copySkillMds(path.join(here, "variants", variant), path.join(dir, ".claude", "skills"));
  // a variant can carry always-loaded instructions, to compare against descriptions alone
  const memory = variant && path.join(here, "variants", variant, "_CLAUDE.md");
  if (memory && fs.existsSync(memory)) fs.copyFileSync(memory, path.join(dir, "CLAUDE.md"));
  spawnSync("git", ["init", "-q"], { cwd: dir });
  spawnSync("git", ["add", "-A"], { cwd: dir });
  spawnSync("git", ["-c", "user.email=t@t", "-c", "user.name=t", "commit", "-qm", "fixture"], { cwd: dir });
  return dir;
}

function run(file, args, cwd) {
  return new Promise((resolve) => {
    const p = spawn(file, args, { cwd, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    p.stdout.on("data", (d) => (stdout += d));
    const timer = setTimeout(() => p.kill(), 240_000);
    p.on("close", () => { clearTimeout(timer); resolve(stdout); });
  });
}

function skillsFrom(text, pattern) {
  return [...new Set([...text.matchAll(pattern)].map((m) => m[1].toLowerCase()))];
}

async function runClaude(c, dir) {
  const raw = await run(CLAUDE, [
    "-p", c.prompt, "--output-format", "stream-json", "--verbose", "--max-turns", "4",
    "--no-session-persistence", "--setting-sources", "project",
    "--allowedTools", "Skill", "Read", "Glob", "Grep", "--model", "claude-opus-5-5",
  ], dir);
  const used = [];
  for (const line of raw.split("\n")) {
    let j; try { j = JSON.parse(line); } catch { continue; }
    if (j.type === "system" && j.subtype === "init" && !(j.skills ?? []).includes("diagnosing-bugs")) used.push("!skills-not-loaded");
    for (const part of j.message?.content ?? []) {
      if (part.type !== "tool_use") continue;
      if (part.name === "Skill") used.push(String(part.input?.skill));
      // a skill read as a file, not invoked: the fixture keeps skills inside the repo, so Glob can find them
      if (part.name === "Read") used.push(...skillsFrom(String(part.input?.file_path), /skills(?:-parked)?[\\/]+([^\\/]+)[\\/]+SKILL\.md/gi).map((s) => `read:${s}`));
    }
  }
  return used;
}

async function runCodex(c, dir) {
  const raw = await run(process.execPath, [CODEX, "exec", "--json", "-s", "read-only", "--skip-git-repo-check", "-C", dir, c.prompt], dir);
  const used = [];
  for (const line of raw.split("\n")) {
    let j; try { j = JSON.parse(line); } catch { continue; }
    const item = j.item ?? j.msg ?? {};
    const command = [item.command, item.cmd].flat().filter(Boolean).join(" ");
    used.push(...skillsFrom(command, /skills(?:-parked)?[\\/]+([^\\/"' ]+)[\\/]+SKILL\.md/gi));
  }
  return [...new Set(used)];
}

async function pool(jobs) {
  const results = [];
  let i = 0;
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    while (i < jobs.length) { const job = jobs[i++]; results.push(await job()); }
  }));
  return results;
}

function hit(expect, used) {
  const want = expect.split("|");
  const skills = used.map((u) => u.replace(/^read:/, ""));
  return expect === "none" ? used.length === 0 : skills.some((u) => want.includes(u));
}

async function suite(agent, variant, reps, ids) {
  const picked = ids ? cases.filter((c) => ids.split(",").includes(c.id)) : cases;
  const fixture = makeFixture(agent === "claude" ? variant : null);
  const jobs = picked.flatMap((c) => Array.from({ length: reps }, () => async () => {
    const used = agent === "claude" ? await runClaude(c, fixture) : await runCodex(c, fixture);
    const row = { at: new Date().toISOString(), agent, variant, id: c.id, expect: c.expect, used, hit: hit(c.expect, used) };
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.appendFileSync(out, JSON.stringify(row) + "\n");
    process.stdout.write(`${row.hit ? "HIT " : "MISS"} ${c.id.padEnd(16)} ${used.join(",") || "-"}\n`);
    return row;
  }));
  const rows = await pool(jobs);
  console.log(`\n${agent}/${variant ?? "global"}`);
  for (const c of picked) {
    const r = rows.filter((x) => x.id === c.id);
    console.log(`${c.id.padEnd(16)} ${c.expect.padEnd(28)} ${r.filter((x) => x.hit).length}/${r.length}  ${r.map((x) => x.used.join("+") || "-").join(" | ")}`);
  }
  fs.rmSync(fixture, { recursive: true, force: true });
}

if (cmd === "snapshot") {
  const to = path.join(here, "variants", rest[0]);
  copySkillMds(path.join(os.homedir(), ".claude", "skills"), to);
  console.log(`copied into ${to}: ${fs.readdirSync(to).join(", ")}`);
} else if (cmd === "claude") {
  await suite("claude", rest[0], Number(rest[1] ?? 2), rest[2]);
} else if (cmd === "codex") {
  await suite("codex", null, Number(rest[0] ?? 2), rest[1]);
} else {
  console.log("usage: snapshot <variant> | claude <variant> [reps] [ids] | codex [reps] [ids]");
}
