# Audience & industry lenses

Read in the `lens` pass. Pick one or more audience lenses and one industry lens, combine them (e.g. insurance × seniors), and record the result in PROFILE.md. A lens changes thresholds, weights and red flags; it never lowers WCAG minimums. These are starting points: adjust to the brief and to what the user says.

## Contents
- Audience profile template
- Audience lenses (who)
- Industry lenses (what)
- Space thresholds per lens (lens.json)
- Weight shifts

## Audience profile template

```
Industry / business: <what it sells or does> · Goal: <leads | sales | signups | applications | bookings | donations | downloads>
Primary audience: <who> · Secondary: <who, if any>
Context: <devices> · <environment: desk / on the move / outdoors> · <frequency: one visit / daily tool> · <expertise> · <age range> · <trust or regulatory needs>
Main path per audience: <audience → page → CTA>
Lens: <audience lens(es)> × <industry lens>
Source: user | PROFILE.md | DESIGN.md/README | site copy (inferred)
```

## Audience lenses (who)

| Audience | Raise the bar on | Acceptable / relax | Red flags |
|---|---|---|---|
| Older adults / seniors | Body text ≥ 18px; body contrast aim 7:1; targets ≥ 44–48px on all devices; labels on every icon; underlined links; one clear path per page; 200% zoom; phone/contact visible | Lower density, fewer novel patterns | Thin or light grey text, hover-only menus, timed or auto-advancing carousels, jargon, small close buttons |
| Gamers | Media sharpness at 1920/2560/ultrawide; text readable over key art; contrast on dark themes; CTA (play, buy, wishlist, join) visible over busy art | Dark themes, bold type, expressive motion, high energy | Neon text failing contrast on dark, text over busy art, autoplay with sound, heavy media delaying the CTA |
| Engineers / developers | Scannability, density done well, code blocks (syntax-theme contrast, copy button, horizontal scroll), docs navigation (sidebar, search, anchors), tables, dark mode | Dense layouts, little decoration, monospace accents | Vague marketing hero, stock photos, hidden pricing or docs, low-contrast code |
| General consumers | Mobile-first, fast path to the CTA, social proof, plain words | | Long intros before value, cluttered heroes |
| B2B buyers / decision makers | Credibility (logos, case studies, numbers), pricing clarity, comparison tables, demo/contact CTA; desktop 1366–1920 | Denser content | Unproven claims, no pricing signal, generic illustrations |
| Children / teens | Large targets, simple words, bright but controlled palette, clear parental/privacy cues, body text that is not light weight | Playful type and color | Dark patterns, ads that look like content, real-looking faces beside user names or handles, small thin text |
| Low literacy / non-native speakers | Plain language, short sentences, icons with labels, room for longer translations | | Idioms, dense paragraphs, icon-only UI |
| On-the-go / deskless workers | One-hand reach, thumb-zone CTAs, big buttons, outdoor (sunlight) contrast, light pages for weak networks | | Small targets, hover-dependent UI, heavy hero media |

## Industry lenses (what)

| Industry | What a design lead checks first |
|---|---|
| Staffing / recruiting | Two paths (candidates mostly on phones, employers mostly on desktop), each with a clear CTA; job search and filters; job cards scannable (title, location, pay, type, date); short mobile apply; trust signals for employers |
| Gaming | Key art that shows the actual game; trailer placement; platforms and age rating; primary CTA over the art; community links |
| Insurance | Plain-language coverage, quote CTA, comparison tables, readable disclaimers (size and contrast), calm palette, agent/phone contact, progress indicators on long forms; older audience likely |
| Finance / banking / fintech | Security and trust cues, numbers formatted for scanning (tabular figures, right-aligned), accessible charts, restrained motion |
| Healthcare | Calm, accessible (aim for AAA), plain language, appointment / find-a-provider CTA, urgent info easy to find, privacy cues |
| E-commerce | Product images informational: large, consistent ratio, zoom; price and add-to-cart hierarchy; filters; reviews, shipping and returns visible |
| SaaS / developer tools | Real product screenshots over illustrations; pricing table; docs and changelog reachable; demo or signup CTA |
| Education | Long-form readability, progress cues, accessibility for students with disabilities, age-appropriate tone |
| Government / public / nonprofit | Legal accessibility duties (e.g. Section 508, EN 301 549), plain language, findability; donate CTA for nonprofits |
| Restaurant / hospitality / local | Hours, location, booking CTA; menu as HTML text (not a PDF or image); food photos informational |
| Real estate | Listing cards (photo, price, beds/baths, area), map + list views, filters |
| News / media / blog | Reading typography, ad placement not breaking reading, article and index layouts |
| Portfolio / creative / agency | Work shown large; distinct identity; novelty acceptable if navigation stays clear |

## Space thresholds per lens (lens.json)

`space.js` reads these (capture `--opts lens.json`, or `__SDR_BATCH.opts`). Start from the defaults and apply each chosen lens's row. When lenses disagree, take the value that is kinder to reading (larger `edgeMin`, `paraMinEm`) and the one that is stricter about dead space (smaller `bandShare`).

| Lens | gapMultiplier | gapFloor | bandShare | edgeMin / phone | paraMinEm | fillMin | Why |
|---|---|---|---|---|---|---|---|
| Defaults | 1.5 | 96 | 0.25 | 16 / 12 | 0.5 | 0.55 | |
| Older adults / low vision / healthcare / government | 1.5 | 120 | 0.25 | 24 / 16 | 0.75 | 0.55 | Roomier inside groups and around edges; empty bands stay strict: at 200% zoom and on short laptops they read as the end of the page and cost extra scrolling |
| Engineers / B2B / dashboards / e-commerce listings | 1.5 | 80 | 0.2 | 12 / 12 | 0.5 | 0.6 | Dense and scannable; dead space costs comparisons |
| Luxury / portfolio / editorial / creative | 2 | 160 | 0.35 | 24 / 16 | 0.6 | 0.45 | Breathing room is part of the brand; still no empty band at the bottom of the first screen |
| Children / teens, gaming, general consumers | 1.5 | 96 | 0.25 | 16 / 12 | 0.5 | 0.55 | Defaults |

Other options keep their defaults unless the brief says otherwise: `bandHard` 0.4, `orphanGap` 96, `columnDiffPx` 160, `columnDiff` 0.3, `farShare` 0.3, `wideShare` 0.5.

"More space" for an audience means larger type, line height, targets and padding inside components. It never means empty bands between sections.

## Weight shifts

Default weights are in `rubric.md`. A lens may move any category by up to ±4 points (total stays 100). Typical shifts:
- Seniors, healthcare, government: Accessibility +4, Typography +2, Space use +1, Motion −1, Audience fit +1 (take from Consistency, Spacing & text rhythm, Content type, Component sizing).
- Gaming, portfolio/creative: Content & imagery +3, Motion +3 (take from Copy, Consistency and Space use).
- Engineers / dev tools, B2B: Copy +2, Hierarchy +2, Space use +1 (take from Content & imagery, Motion and Interaction & detail craft).
- Staffing, e-commerce, consumer: Responsive +3, Hierarchy & main action +2 (take from Motion, Consistency and Copy).

Lens-driven extra viewports are listed in `frameworks.md` → Viewports.
