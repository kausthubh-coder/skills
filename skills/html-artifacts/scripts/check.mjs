#!/usr/bin/env node
// Static checks for an HTML artifact. Catches what a screenshot hides: leftover template text,
// missing structure, unpinned remote scripts, images without alt text, and pages with too many words.
//
//   node check.mjs page.html [more.html ...]
//
// Exit 1 when any file has an error. Warnings are judgement calls: fix them or know why not.
import fs from "node:fs";

const files = process.argv.slice(2);
if (!files.length) {
  console.error("usage: node check.mjs page.html [more.html ...]");
  process.exit(2);
}

// The text budget: words a reader sees without opening anything (outside <details>, summaries included).
// Teach pages (<main data-type="teach">) may run longer.
const BUDGET = { warn: 350, error: 700 };
const H1_WORDS = 8;
const H2_WORDS = 6;
const P_SENTENCES = 2;

const strip = (s) => s.replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").replace(/\s+/g, " ").trim();
const countWords = (s) => strip(s).split(" ").filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
// A sentence ends at . ! or ? followed by a space and a capital, digit or quote. Code is removed first,
// so file names and versions don't count.
const countSentences = (s) => {
  const text = strip(s.replace(/<code[\s\S]*?<\/code>/gi, "x")).replace(/\b(e\.g|i\.e|vs|etc|cf|approx)\./gi, "$1");
  return text ? (text.match(/[.!?]["')\]]?\s+(?=["'(\[]?[\p{Lu}\p{N}])/gu) ?? []).length + 1 : 0;
};
// What shows with every fold closed: each <details> becomes its <summary>, innermost first.
const foldsClosed = (s) => {
  let prev;
  do {
    prev = s;
    s = s.replace(/<details\b[^>]*>((?:(?!<details\b)[\s\S])*?)<\/details>/gi, (_, inner) => ` ${inner.match(/<summary\b[\s\S]*?<\/summary>/i)?.[0] ?? ""} `);
  } while (s !== prev);
  return s;
};
const emoji = /\p{Extended_Pictographic}/u;
let failed = false;

for (const file of files) {
  const html = fs.readFileSync(file, "utf8");
  const errors = [];
  const warnings = [];

  // Structure
  if (!/<html[^>]*\slang=/i.test(html)) errors.push("<html> has no lang attribute");
  if (!/<meta[^>]+name=["']?viewport/i.test(html)) errors.push("no viewport meta tag: the page will be tiny on phones");
  if (!/<title>[^<]*\S[^<]*<\/title>/i.test(html)) errors.push("no <title>");
  const h1s = html.match(/<h1[\s>]/gi) ?? [];
  if (h1s.length !== 1) errors.push(`${h1s.length} <h1> elements; use exactly one, and make it the answer`);

  // The saved file must carry its own colors in both schemes
  const css = (html.match(/<style[\s\S]*?<\/style>/gi) ?? []).join("\n");
  const hostVars = [...new Set((css.match(/var\(--(?:foreground|muted-foreground|card|card-foreground|primary|border|font-sans)\b/g) ?? []).map((v) => v.slice(4)))];
  if (hostVars.length)
    errors.push(`uses a host app's theme variables (${hostVars.join(", ")}), which exist only inside T3's html_render; define the page's own colors (start from the template)`);
  for (const m of css.matchAll(/(--[\w-]+)\s*:\s*var\(\1\b/g)) errors.push(`${m[1]} refers to itself, so it is invalid`);
  // Either scheme can be the default as long as the other one has its own colors.
  if (/color-scheme\s*:[^;]*dark/.test(css) && !/prefers-color-scheme\s*:\s*(?:dark|light)|light-dark\(/.test(css))
    errors.push("declares dark mode support but defines colors for one scheme only: text will be unreadable in the other");

  if (!/--fs-body/.test(css)) warnings.push("not built from assets/template.html: fine if the repo has its own format, otherwise start from the template");

  // Leftover template text
  // Blank out styles and comments but keep their newlines, so line numbers still match the file.
  const blank = (s) => s.replace(/[^\n]/g, " ");
  const source = html.replace(/<style[\s\S]*?<\/style>/gi, blank).replace(/<!--[\s\S]*?-->/g, blank);
  for (const m of source.matchAll(/TODO|\{\{[^}]*\}\}|lorem ipsum/gi)) {
    const line = source.slice(0, m.index).split("\n").length;
    errors.push(`leftover placeholder "${m[0]}" near line ${line}`);
    if (errors.length > 12) break;
  }

  // Headings: no skipped levels, no emoji, short, and they should say something
  let prev = 1;
  for (const m of html.matchAll(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi)) {
    const level = Number(m[1]);
    const text = strip(m[2]);
    const words = countWords(m[2]);
    if (level > prev + 1) warnings.push(`heading level jumps from h${prev} to h${level}: "${text}"`);
    if (emoji.test(text)) warnings.push(`emoji in heading: "${text}"`);
    if (level === 1 && words > H1_WORDS) warnings.push(`h1 has ${words} words; keep it to ${H1_WORDS} and move the rest to the line under it: "${text}"`);
    if (level === 2 && words > H2_WORDS) warnings.push(`h2 has ${words} words; state the point in ${H2_WORDS}: "${text}"`);
    if (level === 2 && /^(overview|introduction|summary|details|background|conclusion|misc(ellaneous)?)$/i.test(text))
      warnings.push(`generic heading "${text}": say the section's point instead`);
    prev = level;
  }

  // Images and figures
  for (const m of html.matchAll(/<img\b[^>]*>/gi)) if (!/\salt=/i.test(m[0])) errors.push(`image without alt: ${m[0].slice(0, 80)}`);
  for (const m of html.matchAll(/<svg\b[^>]*>/gi))
    if (!/aria-label|aria-labelledby|aria-hidden|role=["']?img/i.test(m[0]) && !/<title>/i.test(html.slice(m.index, m.index + 400)))
      warnings.push("inline <svg> without a <title>, aria-label or aria-hidden");

  // Remote resources must be pinned so the page renders the same next month. Embedded (data:) fonts are fine.
  for (const m of html.matchAll(/<(?:script|link)\b[^>]*(?:src|href)=["'](https?:\/\/[^"']+)["'][^>]*>/gi)) {
    const url = m[1];
    if (/fonts\.googleapis|fonts\.gstatic|use\.typekit|fonts\.bunny/.test(url)) warnings.push(`remote font ${url}: embed it as a data: URL (the template does) so it works offline`);
    else if (!/@\d+(\.\d+)*/.test(url)) errors.push(`unpinned remote resource ${url}: pin an exact version (pkg@1.2.3)`);
    else warnings.push(`remote resource ${url}: the page needs a network connection to render it`);
  }
  for (const m of css.matchAll(/(?:@import\s+(?:url\()?|url\()\s*["']?(https?:\/\/[^"')\s]+)/gi))
    warnings.push(`remote file in CSS ${m[1].slice(0, 80)}: embed it as a data: URL so the page works offline`);

  // Length: the budget counts what the reader sees on the page without opening a fold.
  const body = source.replace(/<head[\s\S]*?<\/head>/i, " ").replace(/<script[\s\S]*?<\/script>/gi, " ");
  const teach = /<main\b[^>]*data-type=["']?teach/i.test(html);
  const visible = foldsClosed(body);
  const words = countWords(body);
  const shown = countWords(visible);
  if (!teach && shown > BUDGET.error)
    errors.push(`${shown} visible words (budget ${BUDGET.warn}): cut to the claims and fold the explanation into <details>`);
  else if (!teach && shown > BUDGET.warn)
    warnings.push(`${shown} visible words (budget ${BUDGET.warn}): prefer a number, a table row or a visual, and fold the rest`);
  if (teach && words > 4000) warnings.push(`${words} words: split it, or move depth into <details>`);
  for (const m of visible.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)) {
    const n = countSentences(m[1]);
    if (n > P_SENTENCES) warnings.push(`paragraph with ${n} sentences (max ${P_SENTENCES}): "${strip(m[1]).slice(0, 70)}…"`);
  }
  const kb = Math.round(Buffer.byteLength(html) / 1024);
  if (kb > 500) warnings.push(`${kb} KB: inline images are probably too large`);

  const status = errors.length ? "FAIL" : "ok";
  const seconds = Math.round((shown / 230) * 60);
  console.log(`${status}  ${file}  (${shown} visible words, ~${seconds}s to read; ${words} with folds; ${kb} KB${teach ? "; teach page" : ""})`);
  for (const e of errors) console.log(`  error: ${e}`);
  for (const w of warnings) console.log(`  warn:  ${w}`);
  if (errors.length) failed = true;
}

process.exit(failed ? 1 : 0);
