# Build mechanics

The parts every page needs regardless of how it looks. Choose the colors, sizes and layout yourself (SKILL.md section 4); these snippets only make the file work everywhere.

## The shell

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>The answer, short</title>
<style>…</style>
</head>
<body><main>…</main></body>
</html>
```

One `<h1>`. `<main data-type="teach">` on teach pages (the checker allows them more words).

## Both color schemes

Name the page's colors once as custom properties and give each a light and a dark value. Either scheme can be the default as long as the other has its own block:

```css
:root { color-scheme: light dark; --bg: #fbfbfa; --text: #1b1b1d; /* … */ }
@media (prefers-color-scheme: dark) { :root { --bg: #141416; --text: #e9e9eb; /* … */ } }
html { background: var(--bg); color: var(--text); }
```

Dark mode is its own design, not an inversion: surfaces get lighter as they rise, pure black and pure white are too harsh, the accent needs more lightness and less saturation, and every color gets rechecked for contrast. `critly check` tests both.

## Type and numbers

```css
body { font: 1.0625rem/1.5 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
code, pre { font-family: ui-monospace, "Cascadia Code", "SF Mono", Menlo, Consolas, monospace; }
p, li { max-width: 55ch; text-wrap: pretty; }
h1, h2, h3 { text-wrap: balance; }
td.num, .num { font-variant-numeric: tabular-nums; text-align: end; }
```

Embedding a web font costs 50 to 150 KB of base64 and is rarely worth it for a report; never link Google Fonts (the page must work offline).

## Phones

- Wide tables scroll inside their own box: `<div style="overflow-x:auto"><table>…</table></div>`. The page itself never scrolls sideways at 390px.
- Use `<th scope="col">` and a `<caption>` or a heading that states what the table shows.
- Grids collapse to one column below about 40rem.
- SVG figures: `style="width:100%;height:auto"` with a `viewBox`; text in them never shrinks below the caption size.

## Folds

`<details><summary>Evidence: 4 quotes from 3 threads</summary>…</details>`. Find-in-page opens closed folds in current Chrome, Firefox and Safari, so folded text is still searchable.

Printed, a closed fold loses its content. Open them all for print:

```html
<script>
addEventListener("beforeprint", () => document.querySelectorAll("details").forEach((d) => {
  d.dataset.wasOpen = d.open; d.removeAttribute("name"); d.open = true;
}));
addEventListener("afterprint", () => document.querySelectorAll("details").forEach((d) => (d.open = d.dataset.wasOpen === "true")));
</script>
```

## Print

```css
@media print {
  :root { color-scheme: light; }   /* plus the light values, if dark is the default */
  nav { display: none; }
  figure, table, pre { break-inside: avoid; }
  h2, h3 { break-after: avoid; }
  a[href^="http"]::after { content: " (" attr(href) ")"; font-size: 0.85em; }
}
```

## Motion

None by default. If a step-through or a real process needs it, wrap it in `@media (prefers-reduced-motion: no-preference)`, and never leave content invisible waiting for an animation or a scroll observer.

## Finishing details

Curly quotes and apostrophes, a real ellipsis (…), `&nbsp;` between a number and its unit (`10&nbsp;MB`), dates as `<time datetime="2026-10-14">14 Oct 2026</time>`, key/value facts in a `<dl>`. Style `::selection` and focus rings in the page's own colors.
