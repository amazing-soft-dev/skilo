# Pass: typography

Scope: every page (measurements from all its viewports; screenshots at 390 and 1440). Category: Typography.

## Evidence
- Capture runs: `node <skill>/scripts/ledger.mjs extract --run <run> --pass typography --all` (font sizes, long/short lines)
- Browser-tool runs: `__sdrAll.filter(r => r.ok && ['390x844','1440x900'].includes(r.viewport)).map(r => ({ p: r.page, vp: r.viewport, sizes: r.m.fontSizes, lines: r.m.lineLengthIssues }))`

## Rules
- Body text ≥ 16px (lens: seniors ≥ 18px); inputs ≥ 16px on mobile (iOS zooms otherwise).
- **Weight is part of readability:** light weights (300 and below) for running text read thinner than their size, especially light-on-dark and for young, older or low-vision readers. Judge size and weight together.
- **Count where the text is, not just the base size:** a 16px body token means little if most visible text (card descriptions, hints, captions, meta) uses a smaller "small" style. Report the share of visible text below 16px (below the lens minimum) from `fontSizes`.
- Body line height 1.5–1.7; headings 1.1–1.3.
- Body line length 45–75 characters; flag paragraphs above 85 or below 35 (`lineLengthIssues`).
- **(house)** At most ~7 distinct font sizes per page, 3 weights per family, 2 families; scale steps ~1.2–1.333.
- Distinct heading levels; no widows in headings (`text-wrap: balance`); no long centered paragraphs; no all-caps blocks; paragraph spacing (see `space-edges`).
- Typographic details: `…` not `...`, curly quotes, non-breaking spaces in `10 MB` / `⌘ K`, `tabular-nums` for prices, counters and tables.

Write `findings/typography.md`. Mark done.
