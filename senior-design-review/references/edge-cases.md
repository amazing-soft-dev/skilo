# Edge cases

Read when one of these situations comes up.

- **No browser and no Playwright, or the app won't run:** code-only review; every visual finding Inferred; list what couldn't be checked; offer to review screenshots.
- **Several audiences with conflicting needs** (e.g. gamers and parents): judge each page by the audience it serves; on shared pages, flag where one audience is blocked.
- **Audience unknown and site generic:** ask once; otherwise use the general consumer lens and say so.
- **Mixed styling systems:** write each fix in the system that file already uses; flag the mix only if it causes visible inconsistency.
- **No-code or hosted builders without source** (Wix, Squarespace, Webflow without export): rendered review only; fixes as builder settings; no `.gitignore` step.
- **Class-based dark mode** (e.g. `next-themes`, a `.dark` class): run capture with `--dark-class dark` (or the project's class), or toggle the site's theme switch in a browser tool.
- **Font swap or hydration flash:** capture after fonts load, but note any visible flash on first load.
- **Scroll-reveal and entrance animations:** content waits at opacity 0 until scrolled into view (or hides again when scrolled away, or is driven by `animation-timeline: view()`). Always measure after `settle.js`; its `forced` list says what it had to reveal. Never report such space as empty without seeing it in a settled screenshot. JS animation libraries start from near-zero opacity (0.001) and a hidden or background tab pauses their frames, so "hidden" means opacity under 0.05; fade-in wrappers can hold only an image (no text) and still count.
- **Sticky and fixed chrome:** a zero-height sticky `<header>` wrapping the real bar, a sticky header that starts below a utility bar (not at the top at scroll 0), floating headers inset from the top, fixed bottom action bars on phones and cookie banners all eat the first screen; `space.js` measures `headerBottom` and `bottomBar` and treats only top-stuck sticky elements as chrome. Sticky elements further down (sticky columns, scroll-stacking cards) are content.
- **Classic scrollbars (Windows):** full-width sections end ~15px before `innerWidth`; scripts use `clientWidth`. Compare widths with `clientWidth` in hand checks too. Phones and tablets use overlay scrollbars: a desktop scrollbar inside a narrow iframe or window steals ~15px and adds wrapping, inflating phone heights (`batch.js` hides it below 1024px; in hand checks use the browser's mobile emulation).
- **Missing `<meta name="viewport">`:** phones render a ~980px layout and shrink it; every phone measurement is then meaningless until it's fixed (Blocker, `responsive`).
- **Browser-tool time limits:** a javascript call that runs longer than ~45s is abandoned by the tool but keeps running in the page; use `__sdr.start()` + `__sdr.status()` (never re-run a batch while one is running). A hidden browser pane runs timers slower and may report a 0×0 viewport: resize the tab first.
- **Lost in-page results:** navigating the measuring tab (or an "open URL" call that reuses it) erases `__sdrAll` and stops a running batch. Copy each pass's extract into `findings/` as you go (the ledger only remembers what was checked, not the numbers), keep screenshots in another tab, and re-run only the lost captures.
- **Device disconnects mid-run:** the ledger keeps what was done; on reconnect check `__sdr` still exists in the tab (re-paste the bundle if the page reloaded) and resume with `ledger next`.
- **Feature flags or A/B tests:** note the variant reviewed.
- **Third-party embeds** (maps, video, chat, payments, booking widgets): review placement and size, not internals.
- **The product inside a frame** (the site's own games, editors, players, previews in an iframe or canvas): this is content, not a widget. Review it at phone width like any page: text and control size inside it, and whether full screen or landscape is offered. `measure.js` cannot see inside canvas or cross-origin frames, so findings are from screenshots (Inferred unless measured another way).
- **Cookie banners, chat widgets, modals covering content:** capture once as components, then dismiss before other captures.
- **Very large site:** key pages plus one per template; list routes not reviewed.
- **No access to the source** (only a URL, or the folder can't be opened): rendered-only review, locations as selectors (Inferred), `code` pass blocked with the reason, outputs in the session's working folder.
- **Monorepo:** review the app that serves the website; ask only if several apps qualify. `.gitignore` goes at the repo root.
- **RTL / i18n:** mirroring and the longest locale.
- **No dark mode:** not a finding unless the brief or lens expects it (dev tools, gaming); mention once.
- **Gradients, video, glass or backdrop-blur behind text:** sample several points; mark Inferred when it can't be measured.
- **Wide-gamut colors (oklch, P3):** `measure.js` measures in sRGB; note possible clipping.
- **Ancestor opacity:** `measure.js` doesn't composite parent `opacity`; check faded sections visually.
- **Out of scope:** email templates, PDFs, native mobile apps. Say so.
