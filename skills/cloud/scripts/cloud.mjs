#!/usr/bin/env node
// Starts, steers and reads T3 threads on my InstaBox machines from my laptop. Each command pipes box.mjs into
// `instabox ssh <machine>`, where it talks to that machine's T3 server.
//
//   node cloud.mjs move --repo krida --branch t3/x --title "Krida: ..." --brief brief.md [--machine t3] [--model claude-opus-5-5] [--instance claudeAgent]
//   node cloud.mjs send --machine t3 --thread <id> --text message.md
//   node cloud.mjs peek --machine t3 [--thread <id>] [--n 12]
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const MACHINES = ["t3", "t3-2"];
const INSTABOX = process.env.INSTABOX
  ?? (process.platform === "win32" ? join(homedir(), "AppData/Local/Programs/instabox/instabox.exe") : "instabox");
const BOX_SCRIPT = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "box.mjs"), "utf8");

const [cmd, ...rest] = process.argv.slice(2);
const opt = {};
for (let i = 0; i < rest.length; i += 2) opt[rest[i].replace(/^--/, "")] = rest[i + 1];

function onBox(machine, job) {
  const r = spawnSync(INSTABOX, ["ssh", machine, "--", "node", "--no-warnings", "--input-type=module", "-"], {
    input: `const JOB = ${JSON.stringify(job)};\n${BOX_SCRIPT}`, encoding: "utf8", maxBuffer: 1 << 24,
  });
  if (r.status !== 0) {
    console.error(`cloud: ${job.cmd} on ${machine} failed\n${(r.stderr || r.error?.message || "").trim()}`);
    process.exit(1);
  }
  return r.stdout.trim();
}

// The machine with the most free memory; each one shares its 8 GB between all its threads.
function pickMachine() {
  const free = MACHINES.map((m) => ({ m, mb: Number(onBox(m, { cmd: "mem" })) }));
  console.error(`cloud: free memory ${free.map((f) => `${f.m} ${f.mb} MB`).join(", ")}`);
  return free.sort((a, b) => b.mb - a.mb)[0].m;
}

const need = (...keys) => {
  const missing = keys.filter((k) => !opt[k]);
  if (missing.length) { console.error(`cloud: ${cmd} needs --${missing.join(", --")}`); process.exit(2); }
};

if (cmd === "move") {
  need("repo", "branch", "title", "brief");
  const machine = opt.machine ?? pickMachine();
  const out = JSON.parse(onBox(machine, {
    cmd: "move", repo: opt.repo, branch: opt.branch, title: opt.title, brief: readFileSync(opt.brief, "utf8"),
    instance: opt.instance ?? "claudeAgent", model: opt.model ?? "claude-opus-5-5",
  }));
  console.log(JSON.stringify({ machine, ...out }));
} else if (cmd === "send") {
  need("machine", "thread", "text");
  console.log(onBox(opt.machine, { cmd: "send", threadId: opt.thread, text: readFileSync(opt.text, "utf8") }));
} else if (cmd === "peek") {
  need("machine");
  console.log(onBox(opt.machine, { cmd: "peek", threadId: opt.thread, n: Number(opt.n ?? (opt.thread ? 12 : 15)) }));
} else {
  console.error("usage: cloud.mjs move|send|peek (see the top of this file)");
  process.exit(2);
}
