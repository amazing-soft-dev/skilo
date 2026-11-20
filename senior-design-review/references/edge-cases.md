# Edge cases

Read when one of these situations comes up.

- **No browser and no Playwright, or the app won't run:** code-only review; every visual finding Inferred; list what couldn't be checked; offer to review screenshots.
- **Several audiences with conflicting needs** (e.g. gamers and parents): judge each page by the audience it serves; on shared pages, flag where one audience is blocked.
- **Audience unknown and site generic:** ask once; otherwise use the general consumer lens and say so.
- **Mixed styling systems:** write each fix in the system that file already uses; flag the mix only if it causes visible inconsistency.
- **No-code or hosted builders without source** (Wix, Squarespace, Webflow without export): rendered review only; fixes as builder settings; no `.gitignore` step.
- **Class-based dark mode** (e.g. `next-themes`, a `.dark` class): run capture with `--dark-class dark` (or the project's class), or toggle the site's theme switch in a browser tool.
- **Font swap or hydration flash:** capture after fonts load, but note any visible flash on first load.
- **Feature flags or A/B tests:** note the variant reviewed.
- **Third-party embeds** (maps, video, chat, payments, booking widgets): review placement and size, not internals.
- **The product inside a frame** (the site's own games, editors, players, previews in an iframe or canvas): this is content, not a widget. Review it at phone width like any page: text and control size inside it, and whether full screen or landscape is offered. `measure.js` cannot see inside canvas or cross-origin frames, so findings are from screenshots (Inferred unless measured another way).
- **Cookie banners, chat widgets, modals covering content:** capture once as components, then dismiss before other captures.
- **Very large site:** key pages plus one per template; list routes not reviewed.
- **Monorepo:** review the app that serves the website; ask only if several apps qualify. `.gitignore` goes at the repo root.
- **RTL / i18n:** mirroring and the longest locale.
- **No dark mode:** not a finding unless the brief or lens expects it (dev tools, gaming); mention once.
- **Gradients, video, glass or backdrop-blur behind text:** sample several points; mark Inferred when it can't be measured.
- **Wide-gamut colors (oklch, P3):** `measure.js` measures in sRGB; note possible clipping.
- **Ancestor opacity:** `measure.js` doesn't composite parent `opacity`; check faded sections visually.
- **Out of scope:** email templates, PDFs, native mobile apps. Say so.
