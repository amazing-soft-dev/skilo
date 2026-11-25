# Pass: capture (every page × viewport)

Goal: a settled screenshot and a measurement for every ledger cell. Every later page × viewport pass refuses `done` for a cell whose capture isn't done.

Get the site running or use the user's URL (`frameworks.md` → Run the site). Never invent secrets or use real users' credentials. Production builds can take minutes: start the build in the background and do the intake code reading while it runs. If serving it needs a local run config (for example a `.claude/launch.json` entry), add it and say so in Assumptions.

All three paths run `settle.js` first (scroll through, jump animations to their end, reveal content held at opacity 0), so scroll-reveal content isn't measured as empty space. Each measurement's `settle.forced` lists what had to be forced: content that only appears through scripts is a `states` finding to look at (motion, slow devices, failed scripts).

## Path A: Playwright (in the project or globally)
`node <skill>/scripts/capture.mjs --url <base> --pages /,/pricing --viewports core --themes light,dark --breakpoints <project breakpoints> --opts <run>/lens.json --out <run>`, then again with `--viewports fold` and `--viewports extended` for key pages. `--dark-class` for class-based dark mode. Then `node <skill>/scripts/ledger.mjs sync --run <run>` marks the capture cells.

## Path B: no Playwright, Chrome or Edge installed
`scripts/capture-cdp.mjs` with the same arguments (`--chrome <path>` if it isn't found). Then `ledger.mjs sync`.

## Path C: only a browser tool (e.g. the browser pane of a desktop app)
1. Open a **dedicated measuring tab** (`tabs_create`, then navigate) and never navigate it again: results live in that page, and opening a URL in it (including a "preview" or "open" call that reuses the active tab) wipes them and kills a running batch. Take screenshots in a second tab. Resize the measuring tab to the largest viewport you test (a hidden or 0×0 tab never triggers lazy images or scroll-reveal), open any page of the site.
2. Paste `scripts/bundle.js` once into the page (javascript tool). Verify the paste: its last line returns `sdr ready … lengths`; compare with the lengths `node scripts/bundle.mjs` printed. Different lengths = a transcription slip: paste again. To change one function later, patch it in the tab with string replaces on `__sdr.<name>.toString()` and `eval`, then compare the length again (cheaper than re-pasting).
3. `window.__SDR_BATCH = { pages: [...], viewports: [...], opts: <lens.json>, wait: 400 }; __sdr.start()`. It returns at once (browser tools give up on a call after ~45s, and a hidden pane runs timers slower); poll `__sdr.status()` every 30s or so until `running` is false. Results accumulate in `window.__sdrAll`.
4. Mark capture cells from the status summary: `ledger.mjs mark --pass capture --status done --page <p> --viewport <vp>-light` (lists allowed), `skipped` for FAIL lines with the error as reason. `HTTP404`-style lines are captured (the 404 page is part of the review).
5. **Limit of iframes: they inherit the measuring tab's device profile** (desktop user agent, fine pointer, no touch), so phone widths render as a narrow desktop window. Sites that change header, navigation or bottom bars for touch devices measure differently. Confirm phone first-screen and target findings in true mobile emulation (resize the screenshot tab below 768px, which emulates a phone) before reporting them; let a frozen entrance animation finish or take a screenshot rather than trusting numbers from a hidden pane.
6. Screenshots are not saved in this path: take them per pass where the pass file asks (resize, open, scroll to the region, screenshot or zoom), and cite measurements in the report instead of image paths.
7. Reset the tab size when the review is done.

## Retry rules
A capture that failed (timeout, server error, auth wall) is `skipped` with the error. Retry once with a longer `--wait`/`wait` and after checking the server is up. Block (`--permanent`) only for things a retry can't change (needs credentials you don't have, route needs data that doesn't exist), and say so in "Not checked".

In a browser tool, also capture what a batch run can't, at one phone and one desktop width: hover and keyboard focus, menus, modals, accordions, form states (never submit to real endpoints), loading, error, 404, empty lists, 200% zoom, stress content. The `states` pass says how.

Windows Git Bash: prefix commands with `MSYS_NO_PATHCONV=1`, or `--pages /` becomes `C:/Program Files/Git/`.
