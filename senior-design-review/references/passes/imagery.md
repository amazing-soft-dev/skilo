# Pass: imagery (text vs image, what images say)

Scope: every page (screenshots at 390 and 1440, `media` from the measurements). Category: Content type: text vs image.

## Evidence
- Capture runs: `node <skill>/scripts/ledger.mjs extract --run <run> --pass imagery --all`
- Browser-tool runs: `__sdrAll.filter(r => r.ok && ['390x844','1440x900'].includes(r.viewport)).map(r => ({ p: r.page, vp: r.viewport, media: r.m.media.map(m => [m.sel, m.src, m.alt, m.w, m.h, m.aboveFold, m.foldShare, m.blurry]) }))`

Classify every item as **informational** (shows the product, real people, a diagram, data, a result, a real place) or **decorative** (stock, abstract shapes, generic illustration).

## Rules
- Decorative image in prime space (`aboveFold`, or **(house)** `foldShare` ≳ 0.25) → replace with text that does the job (headline + proof points, short list, sourced stat) or an informational image.
- Long prose describing something visual (a UI, process, comparison, numbers) → screenshot, diagram, steps or table.
- Text baked into images → real text. Menus, prices and job details must be text, never images or PDFs.
- Text over images must meet contrast everywhere → scrim, overlay or move the text.
- The lens decides how much imagery is right: gaming, e-commerce, hospitality and portfolios need strong informational imagery; dev tools, insurance and B2B usually need less, and it must be real.
- **Show the product when it can be shown:** screenshots or short captures of the real thing beat stock photos of the same theme. Name what to capture in the fix (which screen, which state, which ratio).
- **Faces next to names read as real people:** stock portraits beside user names, handles, testimonials or team cards imply those people exist and look like that. Flag it as a trust issue, and as a red flag wherever minors or privacy promises are involved; suggest the person's work, an avatar, or a real consented photo.
- **Generated or abstract placeholders** are honest but not informational; score them as decorative.
- Quality: not blurry (`blurry`), not stretched, consistent crops and ratios in a set; `width`/`height` set to avoid layout shift.
- Icons are judged in the `details` pass.

Write `findings/imagery.md`. Mark done.
