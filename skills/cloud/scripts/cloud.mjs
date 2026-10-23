#!/usr/bin/env node
// Starts, steers and reads T3 threads on my InstaBox machines from my laptop. Each command pipes box.mjs into
// `instabox ssh <machine>`, where it talks to that machine's T3 server.
//
//   node cloud.mjs move --repo krida --branch t3/x --title "Krida: ..." --brief brief.md [--machine t3] [--model claude-opus-5-5] [--instance claudeAgent]
//   node cloud.mjs send --machine t3 --thread <id> --text message.md
//   node cloud.mjs peek --machine t3 [--thread <id>] [--n 12]
//   node cloud.mjs resume [--machine t3]   # restart threads the usage limit stopped
//   node cloud.mjs handoff [--dry-run] [--log <file>]   # laptop device-hub checks the cloud threads asked for (see below)
//   node cloud.mjs delete --machine t3|t3-2|laptop --thread <id>   # e.g. eval and test threads
import { spawnSync } from "node:child_process";
import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const MACHINES = ["t3", "t3-2"];
const INSTABOX = process.env.INSTABOX
  ?? (process.platform === "win32" ? join(homedir(), "AppData/Local/Programs/instabox/instabox.exe") : "instabox");
const BOX_SCRIPT = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "box.mjs"), "utf8");

const [cmd, ...rest] = process.argv.slice(2);
const opt = {};
for (let i = 0; i < rest.length; i++) {
  const key = rest[i].replace(/^--/, "");
  opt[key] = rest[i + 1] === undefined || rest[i + 1].startsWith("--") ? true : rest[++i];
}

function runJob(argv, job, where) {
  // instabox reads its login from $HOME/.config/instabox; Task Scheduler sets no HOME, and instabox then waits for one.
  const r = spawnSync(argv[0], argv.slice(1), {
    input: `const JOB = ${JSON.stringify(job)};\n${BOX_SCRIPT}`, encoding: "utf8", maxBuffer: 1 << 24,
    env: { ...process.env, HOME: process.env.HOME ?? homedir() }, timeout: 180_000,
  });
  if (r.status !== 0) throw new Error(`cloud: ${job.cmd} on ${where} failed\n${(r.stderr || r.error?.message || "").trim()}`);
  return r.stdout.trim();
}
const NODE = ["node", "--no-warnings", "--input-type=module", "-"];
const onBox = (machine, job) => runJob([INSTABOX, "ssh", machine, "--", ...NODE], job, machine);
const onLaptop = (job) => runJob([process.execPath, ...NODE.slice(1)], job, "this laptop");

// Cloud threads can't reach my laptop's T3 device hub, so my laptop pulls: a cloud thread that ends with a
// "## Laptop device check" brief gets a laptop thread on its branch, and that thread's final report goes back to
// it as a new message. State lives in ~/.t3/cloud-handoffs.json, keyed by the brief's message id.
const MAX_ROUNDS = 3;
function handoff(dryRun) {
  const file = join(homedir(), ".t3", "cloud-handoffs.json");
  const state = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : {};
  const save = () => { if (!dryRun) writeFileSync(file, JSON.stringify(state, null, 2)); };
  const log = (s) => {
    const line = `${new Date().toISOString().slice(0, 16)} ${s}`;
    if (opt.log) appendFileSync(opt.log, line + "\n"); else console.log(line);
  };
  state.lastRun = new Date().toISOString(); save();

  for (const machine of MACHINES) {
    let asks;
    try { asks = JSON.parse(onBox(machine, { cmd: "handoffs" })); } catch (e) { log(`${machine} unreachable: ${e.message.split("\n").pop()}`); continue; }
    for (const a of asks) {
      if (state[a.messageId]) continue;
      const rounds = Object.values(state).filter((s) => s?.cloudThread === a.threadId).length;
      if (rounds >= MAX_ROUNDS) {
        if (!dryRun) onBox(machine, { cmd: "send", threadId: a.threadId, text: `My laptop already ran ${MAX_ROUNDS} device checks for this thread, so it won't start another. Put what's left on my list.` });
        state[a.messageId] = { machine, cloudThread: a.threadId, status: "refused" }; save();
        log(`refused a round ${rounds + 1} for ${machine} "${a.title}"`);
        continue;
      }
      if (dryRun) { log(`would start a laptop check for ${machine} "${a.title}" (${a.project}, ${a.branch})`); continue; }
      const text = `${a.brief}\n\n---\nYou're the laptop half of cloud thread "${a.title}" on my InstaBox machine ${machine}, which can't reach this laptop's device hub. Do the checks above with T3's device tools (the Android emulator or my Pixel). Don't push or merge. Your last message goes back to that thread as is, so end with the verdict, the evidence and what you couldn't check.`;
      try {
        const { threadId } = JSON.parse(onLaptop({ cmd: "launchHere", project: a.project, repo: a.repo, branch: a.branch,
          title: `${a.title.slice(0, 60)}: device check`, text, instance: "claudeAgent", model: "claude-opus-5-5" }));
        state[a.messageId] = { machine, cloudThread: a.threadId, laptopThread: threadId, status: "running", started: new Date().toISOString() };
        log(`started laptop thread ${threadId} for ${machine} "${a.title}"`);
      } catch (e) {
        state[a.messageId] = { machine, cloudThread: a.threadId, status: "failed", error: e.message };
        onBox(machine, { cmd: "send", threadId: a.threadId, text: `My laptop couldn't start the device check: ${e.message.split("\n").pop()}. Put it on my list.` });
        log(`couldn't start a laptop check for ${machine} "${a.title}": ${e.message}`);
      }
      save();
    }
  }

  // Send finished laptop checks back. A run stopped by the usage limit resumes on its own here, so wait for completed.
  for (const s of Object.values(state).filter((x) => x?.status === "running")) {
    const r = JSON.parse(onLaptop({ cmd: "result", threadId: s.laptopThread }));
    if (r.active || r.runStatus !== "completed") continue;
    if (dryRun) { log(`would send laptop thread ${s.laptopThread}'s result to ${s.machine}`); continue; }
    try {
      onBox(s.machine, { cmd: "send", threadId: s.cloudThread, text: `The laptop device check finished. Its report:\n\n${r.text ?? "(no report)"}` });
      s.status = "returned"; s.returned = new Date().toISOString(); save();
      log(`sent laptop thread ${s.laptopThread}'s result to ${s.machine}`);
    } catch (e) { log(`${s.machine} unreachable, will retry: ${e.message.split("\n").pop()}`); }
  }
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

try {
if (cmd === "handoff") {
  handoff(Boolean(opt["dry-run"]));
} else if (cmd === "move") {
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
} else if (cmd === "delete") {
  need("machine", "thread");
  const job = { cmd: "delete", threadId: opt.thread };
  console.log(opt.machine === "laptop" ? onLaptop(job) : onBox(opt.machine, job));
} else if (cmd === "resume") {
  for (const m of opt.machine ? [opt.machine] : MACHINES) {
    console.log(`${m}: ${onBox(m, { cmd: "resume", text: "The usage limit has reset. Check what your background jobs and helpers finished or lost, then carry on." })}`);
  }
} else if (cmd === "peek") {
  need("machine");
  console.log(onBox(opt.machine, { cmd: "peek", threadId: opt.thread, n: Number(opt.n ?? (opt.thread ? 12 : 15)) }));
} else {
  console.error("usage: cloud.mjs move|send|peek|resume|handoff (see the top of this file)");
  process.exit(2);
}
} catch (e) {
  if (opt.log) appendFileSync(opt.log, `${new Date().toISOString().slice(0, 16)} ${e.message}\n`);
  console.error(e.message);
  process.exit(1);
}
