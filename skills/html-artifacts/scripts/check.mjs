#!/usr/bin/env node
// Static checks for an HTML artifact. Catches what a screenshot hides: leftover template text,
// missing structure, unpinned remote scripts, images without alt text, and pages too long to read.
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

const strip = (s) => s.replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").replace(/\s+/g, " ").trim();
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
  if (/color-scheme\s*:[^;]*dark/.test(css) && !/prefers-color-scheme\s*:\s*dark|light-dark\(/.test(css))
    errors.push("declares dark mode support but defines no dark colors: text will be unreadable in dark mode");

  // Leftover template text
  // Blank out styles and comments but keep their newlines, so line numbers still match the file.
  const blank = (s) => s.replace(/[^\n]/g, " ");
  const body = html.replace(/<style[\s\S]*?<\/style>/gi, blank).replace(/<!--[\s\S]*?-->/g, blank);
  for (const m of body.matchAll(/TODO|\{\{[^}]*\}\}|lorem ipsum/gi)) {
    const line = body.slice(0, m.index).split("\n").length;
    errors.push(`leftover placeholder "${m[0]}" near line ${line}`);
    if (errors.length > 12) break;
  }

  // Headings: no skipped levels, no emoji, and they should say something
  let prev = 1;
  for (const m of html.matchAll(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi)) {
    const level = Number(m[1]);
    const text = strip(m[2]);
    if (level > prev + 1) warnings.push(`heading level jumps from h${prev} to h${level}: "${text}"`);
    if (emoji.test(text)) warnings.push(`emoji in heading: "${text}"`);
    if (level === 2 && /^(overview|introduction|summary|details|background|conclusion|misc(ellaneous)?)$/i.test(text))
      warnings.push(`generic heading "${text}": say the section's point instead`);
    prev = level;
  }

  // Images and figures
  for (const m of html.matchAll(/<img\b[^>]*>/gi)) if (!/\salt=/i.test(m[0])) errors.push(`image without alt: ${m[0].slice(0, 80)}`);
  for (const m of html.matchAll(/<svg\b[^>]*>/gi))
    if (!/aria-label|aria-labelledby|aria-hidden|role=["']?img/i.test(m[0]) && !/<title>/i.test(html.slice(m.index, m.index + 400)))
      warnings.push("inline <svg> without a <title>, aria-label or aria-hidden");

  // Remote resources must be pinned so the page renders the same next month
  for (const m of html.matchAll(/<(?:script|link)\b[^>]*(?:src|href)=["'](https?:\/\/[^"']+)["'][^>]*>/gi)) {
    const url = m[1];
    if (/fonts\.googleapis|fonts\.gstatic/.test(url)) warnings.push(`remote font ${url}: system fonts work offline and render instantly`);
    else if (!/@\d+(\.\d+)*/.test(url)) errors.push(`unpinned remote resource ${url}: pin an exact version (pkg@1.2.3)`);
    else warnings.push(`remote resource ${url}: the page needs a network connection to render it`);
  }

  // Length
  const words = strip(body.replace(/<script[\s\S]*?<\/script>/gi, "")).split(" ").filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 230));
  if (words > 4000) warnings.push(`${words} words (~${minutes} min): split it, or move depth into <details>`);
  const kb = Math.round(Buffer.byteLength(html) / 1024);
  if (kb > 500) warnings.push(`${kb} KB: inline images are probably too large`);

  const status = errors.length ? "FAIL" : "ok";
  console.log(`${status}  ${file}  (${words} words, ~${minutes} min read, ${kb} KB)`);
  for (const e of errors) console.log(`  error: ${e}`);
  for (const w of warnings) console.log(`  warn:  ${w}`);
  if (errors.length) failed = true;
}

process.exit(failed ? 1 : 0);
