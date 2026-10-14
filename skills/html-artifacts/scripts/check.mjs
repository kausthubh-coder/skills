#!/usr/bin/env node
// Static checks for an HTML artifact. Catches what a rendered check can't see: too many words, headings that
// say nothing, AI-slop phrasing and decoration, placeholders, colors borrowed from a host app, unpinned scripts.
// Contrast, overflow and line length need a browser: run `critly check` on the file for those.
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

// Phrases that mark text as machine-written. Each costs the reader's trust more than it adds.
const SLOP_PHRASES = [
  "delve", "seamless", "leverag", "comprehensive", "robust", "streamline", "cutting-edge", "game-chang", "unlock",
  "elevate", "empower", "harness the", "dive into", "deep dive", "in today's", "it's worth noting", "it is worth noting",
  "it's important to note", "in conclusion", "in summary", "to summarize", "a testament", "tapestry", "landscape of",
  "navigate the", "plays a crucial role", "pivotal", "not just .{1,30}, but", "let's explore", "whether you're",
  "at the end of the day", "rest assured", "best practices", "key takeaways", "the power of",
];
// Default AI palettes (Tailwind indigo/violet/purple, the #667eea→#764ba2 gradient): the look of every generated page.
const SLOP_COLORS = /#(?:6366f1|4f46e5|818cf8|8b5cf6|7c3aed|a78bfa|a855f7|9333ea|c084fc|667eea|764ba2|6d28d9)\b/gi;

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
const emoji = /\p{Extended_Pictographic}/gu;
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
  const hostVars = [...new Set((css.match(/var\(--(?:foreground|muted-foreground|card|card-foreground|primary|border|font-sans|background)\b/g) ?? []).map((v) => v.slice(4)))];
  if (hostVars.length)
    errors.push(`uses a host app's theme variables (${hostVars.join(", ")}), which exist only inside T3's html_render; define the page's own colors`);
  for (const m of css.matchAll(/(--[\w-]+)\s*:\s*var\(\1\b/g)) errors.push(`${m[1]} refers to itself, so it is invalid`);
  // Either scheme can be the default as long as the other one has its own colors.
  const bothSchemes = /prefers-color-scheme\s*:\s*(?:dark|light)|light-dark\(/.test(css);
  if (/color-scheme\s*:[^;]*dark/.test(css) && !bothSchemes)
    errors.push("declares dark mode support but defines colors for one scheme only: text will be unreadable in the other");
  else if (!bothSchemes) warnings.push("one color scheme only: add a prefers-color-scheme block (or light-dark()) so it reads in light and dark");
  if (/<details\b/i.test(html) && !/beforeprint|@media\s+print/i.test(html))
    warnings.push("folds but no print handling: printed, every closed <details> loses its content (open them on beforeprint)");

  // Leftover placeholders
  // Blank out styles and comments but keep their newlines, so line numbers still match the file.
  const blank = (s) => s.replace(/[^\n]/g, " ");
  const source = html.replace(/<style[\s\S]*?<\/style>/gi, blank).replace(/<!--[\s\S]*?-->/g, blank);
  for (const m of source.matchAll(/TODO|\{\{[^}]*\}\}|lorem ipsum|\[object Object\]/gi)) {
    const line = source.slice(0, m.index).split("\n").length;
    errors.push(`leftover placeholder "${m[0]}" near line ${line}`);
    if (errors.length > 12) break;
  }

  // Headings: no skipped levels, short, and they should say something
  let prev = 1;
  for (const m of html.matchAll(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi)) {
    const level = Number(m[1]);
    const text = strip(m[2]);
    const words = countWords(m[2]);
    if (level > prev + 1) warnings.push(`heading level jumps from h${prev} to h${level}: "${text}"`);
    if (level === 1 && words > H1_WORDS) warnings.push(`h1 has ${words} words; keep it to ${H1_WORDS} and move the rest to the line under it: "${text}"`);
    if (level === 2 && words > H2_WORDS) warnings.push(`h2 has ${words} words; state the point in ${H2_WORDS}: "${text}"`);
    if (/^(overview|introduction|summary|details|background|conclusion|key (findings|takeaways)|next steps|misc(ellaneous)?|report|results)$/i.test(text))
      warnings.push(`label heading "${text}": state the section's point instead ("Imports no longer duplicate rows")`);
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
    if (/fonts\.googleapis|fonts\.gstatic|use\.typekit|fonts\.bunny/.test(url)) warnings.push(`remote font ${url}: use a system font stack, or embed the font, so it works offline`);
    else if (!/@\d+(\.\d+)*/.test(url)) errors.push(`unpinned remote resource ${url}: pin an exact version (pkg@1.2.3)`);
    else warnings.push(`remote resource ${url}: the page needs a network connection to render it`);
  }
  for (const m of css.matchAll(/(?:@import\s+(?:url\()?|url\()\s*["']?(https?:\/\/[^"')\s]+)/gi))
    warnings.push(`remote file in CSS ${m[1].slice(0, 80)}: embed it as a data: URL so the page works offline`);

  // Decoration that marks a page as generated. Each is fine with a reason; most pages have none.
  const slop = [];
  const slopColors = [...new Set((css.match(SLOP_COLORS) ?? []).map((c) => c.toLowerCase()))];
  if (slopColors.length) slop.push(`default AI purple/indigo (${slopColors.join(", ")}): pick colors from what the page means`);
  if (/background-clip\s*:\s*text/i.test(css)) slop.push("gradient text");
  const gradients = (css.match(/(?:linear|radial|conic)-gradient\(/gi) ?? []).length;
  if (gradients) slop.push(`${gradients} gradient(s): flat surfaces, unless the gradient encodes data`);
  const shadows = (css.match(/box-shadow\s*:\s*(?!none|inset)/gi) ?? []).length;
  if (shadows > 1) slop.push(`${shadows} box-shadow rules: floating cards; group with space and hairlines`);
  if (/backdrop-filter/i.test(css)) slop.push("backdrop-filter glass");
  const radii = [...css.matchAll(/border-radius\s*:\s*(\d+)px/gi)].map((m) => Number(m[1])).filter((r) => r >= 12 && r < 999);
  if (radii.length > 1) slop.push(`${radii.length} rules with ${Math.max(...radii)}px-style rounded corners: soft cards everywhere`);
  if (/border-left\s*:\s*[3-9]px/i.test(css)) slop.push("thick left-border callouts");
  const sizes = new Set([...css.matchAll(/font-size\s*:\s*([\d.]+(?:px|rem|em))/gi)].map((m) => m[1]));
  if (sizes.size > 7) slop.push(`${sizes.size} font sizes: pick about 5, each with one job`);
  const tiny = [
    ...[...css.matchAll(/font-size\s*:\s*([\d.]+)px/gi)].map((m) => Number(m[1])),
    ...[...css.matchAll(/font-size\s*:\s*([\d.]+)rem/gi)].map((m) => Number(m[1]) * 16),
  ].filter((n) => n < 13);
  if (tiny.length) slop.push(`text below 13px (${[...new Set(tiny)].join(", ")}px): reading slows below about 16px body, 13px at the smallest`);
  const caps = (css.match(/text-transform\s*:\s*uppercase/gi) ?? []).length;
  if (caps > 1) slop.push(`${caps} uppercase rules: tracked caps labels above headings are a generated-page signature`);
  if (/>\s*0[1-9]\s*</.test(source)) slop.push("01/02-style section numbers: only number things whose order matters");
  if (/<h1\b[^>]*>[^<]*<(em|i|span|mark|strong)\b/i.test(source)) slop.push("one word of the h1 styled differently");
  if (/IntersectionObserver/.test(html) && /opacity\s*:\s*0/.test(css)) slop.push("content hidden until it scrolls in: the page must be complete at rest");
  for (const s of slop) warnings.push(`decoration: ${s}`);

  // Text the reader sees: the budget, paragraph length, and slop phrasing
  const body = source.replace(/<head[\s\S]*?<\/head>/i, " ").replace(/<script[\s\S]*?<\/script>/gi, " ");
  const plain = strip(body.replace(/<(code|pre)\b[\s\S]*?<\/\1>/gi, " "));
  const emojis = plain.match(emoji) ?? [];
  if (emojis.length) warnings.push(`${emojis.length} emoji (${[...new Set(emojis)].slice(0, 6).join(" ")}): use words, or a colored dot next to a word`);
  const dashes = (plain.match(/—/g) ?? []).length;
  if (dashes) warnings.push(`${dashes} em dash(es): use a comma, colon or period`);
  const bangs = (plain.match(/\w!(\s|$)/g) ?? []).length;
  if (bangs) warnings.push(`${bangs} exclamation mark(s)`);
  const arrows = (plain.match(/→/g) ?? []).length;
  if (arrows > 3) warnings.push(`${arrows} "→": fine inside a flow, a tell when it decorates links and labels`);
  const dots = (plain.match(/ · /g) ?? []).length;
  if (dots > 3) warnings.push(`${dots} middle-dot separators: write the meta line as words`);
  const phrases = SLOP_PHRASES.flatMap((p) => plain.match(new RegExp(`\\b${p}`, "gi")) ?? []);
  if (phrases.length) warnings.push(`slop phrasing: ${[...new Set(phrases.map((p) => p.toLowerCase()))].join(", ")}. Say the specific thing`);

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
