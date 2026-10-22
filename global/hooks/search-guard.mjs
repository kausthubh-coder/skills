#!/usr/bin/env node
// PreToolUse hook: blocks a recursive grep (grep -r, -R, --recursive) and points the agent to rg.
// grep -r opens every file under the folder, node_modules and other ignored folders included: in
// critly (206k files on disk, 514 tracked) it took 126 s where rg took 0.29 s and git grep 0.14 s.
// Agents ran it in 5-8% of shell calls (reports/2026-10-21-tool-timing.html).
//
// Reads the hook payload on stdin. Exit 2 blocks the call and shows stderr to the agent.
// Installed into Claude Code and Codex by scripts/link.mjs.
//
//   node global/hooks/search-guard.mjs --test   run the built-in cases

const RECURSIVE = /(?:^|\s)(?:-[a-zA-Z]*[rR][a-zA-Z]*|--recursive|--dereference-recursive|-d\s*recurse|--directories=recurse)(?=\s|$)/;

// grep, egrep or fgrep as a command word: at the start, after a separator, or as xargs/sudo's command.
const GREP = /(?:^|[;&|(\n`{]|\$\(|\b(?:xargs|sudo|time|nice|command)(?:\s+-\S+)*\s)\s*(?:e|f)?grep(?=\s)([^;&|\n`)]*)/g;

export function isRecursiveGrep(command) {
  if (typeof command !== "string") return false;
  // -e takes the next word as the pattern, so `grep -e -r` searches for "-r"
  for (const m of command.matchAll(GREP)) if (RECURSIVE.test(m[1].replace(/(?:^|\s)-e\s+\S+/g, " "))) return true;
  return false;
}

const MESSAGE = `Blocked by search-guard: grep -r opens every file under the folder, node_modules and other ignored folders included. In critly it took 126 s; rg took 0.29 s.
Use one of these instead:
- rg <pattern> [path]   same flags (-n -i -l -w -C); skips gitignored files; -g '*.ts' replaces --include=*.ts
- git grep -n <pattern>  tracked files only
- the Grep tool
`;

function commandOf(payload) {
  const input = payload?.tool_input ?? payload?.input ?? {};
  if (typeof input === "string") return input;
  return input.command ?? input.cmd ?? input.code ?? (Array.isArray(input.argv) ? input.argv.join(" ") : "");
}

function test() {
  const block = [
    "grep -r foo .", "grep -rn foo src", "grep -ril glass --include=*.md .", "grep -R x", "grep --recursive x .",
    "cd /c/x && ls && grep -rIl --exclude-dir=node_modules foo .", "ls | xargs grep -rn foo", "egrep -r 'a|b' .",
    "echo hi; grep -nri foo .", "x=$(grep -rl foo .)", "grep -n -r foo .",
  ];
  const allow = [
    "git grep -n foo", "rg -n foo", "grep -n foo file.ts", "grep -c foo a.txt b.txt", "ps aux | grep -i node",
    "echo 'grep -r is slow'", "git log --grep=fix", "grep -e -r file", "rg --files | grep -i test",
    "node -e \"console.log('grep -r')\"", "grep -v '^#' .env", "",
  ];
  let fail = 0;
  for (const c of block) if (!isRecursiveGrep(c)) { fail++; console.log("should block:", c); }
  for (const c of allow) if (isRecursiveGrep(c)) { fail++; console.log("should allow:", c); }
  console.log(fail ? `${fail} failed` : `all ${block.length + allow.length} cases pass`);
  process.exit(fail ? 1 : 0);
}

if (process.argv.includes("--test")) test();
else {
  let raw = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (d) => (raw += d));
  process.stdin.on("end", () => {
    let payload;
    try { payload = JSON.parse(raw); } catch { process.exit(0); }
    if (isRecursiveGrep(commandOf(payload))) {
      process.stderr.write(MESSAGE);
      process.exit(2);
    }
    process.exit(0);
  });
}
