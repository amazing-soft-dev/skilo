---
name: senior-design-review
description: Review a website you built (UI + code, any framework) like a senior designer, judged for its industry and audience: color, hierarchy, sizing, text vs image, many resolutions. Scored fixes.
---

# Senior Design Review

Review a website the user built the way a senior designer or design lead runs a design crit: understand **who the site is for and what business it is in**, look at the rendered pages at many resolutions, read the code that produces them, judge what works and what doesn't **for that audience**, and return prioritized findings with **exact fixes written in the project's own framework and styling system**. Because this is the user's own project, every visual finding points to the `file:line` that causes it.

This skill works for any web stack: React/Next, Vue/Nuxt, Svelte, Angular, Astro, server-rendered templates (Django, Rails, Laravel, PHP, WordPress), static sites (Hugo, Jekyll, Eleventy, plain HTML) and commerce themes (Shopify). It never assumes Tailwind or React.

This skill **judges**. It is not:
- a performance, SEO, security or deep accessibility audit → `/optimize-app`
- a teardown or clone of someone else's site → `/website-audit-and-clone`

## Defaults (don't ask; write them in an Assumptions block)

| Decision | Default |
|---|---|
| Mode | **Review only**; no source changes. Fix mode only when the user says fix / apply / polish |
| Audience & industry | Inferred from the content, copy and brief (Step 1). One question allowed only if it can't be inferred |
| Pages | Key pages: home, main landing pages, pricing, signup/login, main app screen, one page per dynamic template, 404. Every route if the site has 10 or fewer |
| Resolutions | Core set on every page; extended set on key pages; plus project breakpoints ±1px (Step 3) |
| Themes | Light, and dark if supported |
| Output | `.design-review/` at the repo root (see "Where files go") |
| Git | **Always** make sure `.design-review/runs/` is in `.gitignore` before writing any output |

## Step 0: Intake

1. Read `.design-review/PROFILE.md` if it exists. Apply its audience lens, accepted exceptions and threshold overrides; compare with the last score.
2. **Detect the framework** (from `package.json`, `composer.json`, `Gemfile`, `requirements.txt`/`pyproject.toml`, `go.mod`, config files, folder layout):

| Family | Examples | Routes live in |
|---|---|---|
| React meta-frameworks | Next.js, Remix/React Router, Gatsby | `app/**/page.*`, `pages/**`, `app/routes/**`, `src/pages/**` |
| Vue | Nuxt, Vite + Vue, Vue 2 | `pages/**`, `src/router/**` |
| Svelte | SvelteKit | `src/routes/**/+page.svelte` |
| Angular | Angular CLI | `*-routing.module.ts`, `app.routes.ts` |
| Islands / static | Astro, Eleventy, Hugo, Jekyll, plain HTML | `src/pages/**`, `content/**`, `_layouts`, `*.html` |
| Server-rendered | Django/Jinja, Flask, Rails ERB, Laravel Blade, PHP, ASP.NET Razor, Phoenix | `urls.py`, `routes.rb`, `routes/web.php`, controllers + templates |
| CMS / commerce | WordPress (classic or block theme), Shopify Liquid | Template hierarchy, `theme.json`, `templates/*.json`, `sections/` |

3. **Detect the styling system** and every UI library in use. Fixes must be written in this system (see "Speak the project's language"):
   Tailwind (v3 `tailwind.config.*` / v4 `@theme`), Bootstrap (Sass `$variables`, `--bs-*`), MUI, Chakra, Mantine, Ant Design, Vuetify, Quasar, PrimeVue/PrimeNG/PrimeReact, Angular Material, shadcn, Bulma, Foundation, UnoCSS, styled-components, Emotion, CSS Modules, Sass/Less, vanilla CSS custom properties, WordPress `theme.json`, Shopify theme settings. If several coexist, note which dominates where.
4. Inventory the **intended** design system from code: color tokens, type scale, spacing scale, radii, shadows, breakpoints, container widths, fonts. Rendered pages are measured against this.
5. Map routes and note which need data or auth.
6. **Set up the output folder and `.gitignore`** exactly as described in "Where files go", before writing anything else.
7. Create a task list and `.design-review/runs/<date>/progress.md` so a long run can resume.

## Step 1: Audience & industry lens

The same design can be right for gamers and wrong for seniors. Before judging anything, write a short **Audience profile** (in the report and in PROFILE.md):
- **Industry / business:** what it sells or does, and its main business goal (leads, sales, signups, applications, bookings, donations, downloads).
- **Audiences:** primary and secondary groups. Many sites have two (staffing: candidates and employers; marketplaces: buyers and sellers). Review each audience's main path.
- **Context of use:** likely devices, environment (desk, on the move, outdoors), frequency (one visit vs daily tool), expertise, age range, motivation, trust or regulatory needs.

Sources, in order: the user's words, PROFILE.md, DESIGN.md/CLAUDE.md/README, the site's own copy, meta tags and pricing, analytics the user shares (top devices and resolutions). If the audience still can't be inferred, ask one short question; otherwise state the inference and continue.

Then pick and combine lenses. A lens **changes thresholds, weights and red flags** but never lowers WCAG minimums. Record the chosen lens; when the user corrects it, update PROFILE.md.

### Audience lenses (who)

| Audience | Raise the bar on | Acceptable / relax | Red flags |
|---|---|---|---|
| Older adults / seniors | Body text ≥ 18px; body contrast aim 7:1; targets ≥ 44–48px on all devices; labels on every icon; underlined links; one clear path per page; 200% zoom; phone/contact visible | Lower density, fewer novel patterns | Thin or light grey text, hover-only menus, timed or auto-advancing carousels, jargon, small close buttons |
| Gamers | Media quality and sharpness at 1920/2560/ultrawide; text readable over key art; contrast on dark themes; CTA (play, buy, wishlist, join) visible over busy art | Dark themes, bold type, expressive motion, high energy (raise motion weight) | Neon text failing contrast on dark, text over busy art, autoplay with sound, heavy media delaying the CTA |
| Engineers / developers | Scannability, information density done well, code blocks (contrast of syntax theme, copy button, horizontal scroll), docs navigation (sidebar, search, anchors), tables, dark mode | Dense layouts, little decoration, monospace accents | Vague marketing hero, stock photos, hidden pricing or docs, low-contrast code |
| General consumers | Mobile-first, fast path to the CTA, social proof, plain words | | Long intros before value, cluttered heroes |
| B2B buyers / decision makers | Credibility (logos, case studies, numbers), pricing clarity, comparison tables, demo/contact CTA; desktop widths 1366–1920 | Denser content | Unproven claims, no pricing signal, generic illustrations |
| Children / teens | Large targets, simple words, bright but controlled palette, clear parental/privacy cues | Playful type and color | Dark patterns, ads that look like content |
| Low literacy / non-native speakers | Plain language, short sentences, icons with labels, room for longer translations | | Idioms, dense paragraphs, icon-only UI |
| On-the-go / deskless workers | One-hand reach, thumb-zone CTAs, big buttons, outdoor (sunlight) contrast, light pages for weak networks | | Small targets, hover-dependent UI, heavy hero media |

### Industry lenses (what)

| Industry | What a design lead checks first |
|---|---|
| Staffing / recruiting | Two paths (candidates mostly on phones, employers mostly on desktop) each with a clear CTA; job search and filters; job cards scannable (title, location, pay, type, date); short mobile apply; trust signals for employers |
| Gaming | Key art that shows the actual game; trailer placement; platforms and age rating; primary CTA over the art; community links |
| Insurance | Trust and clarity: plain-language coverage, quote CTA, comparison tables, readable disclaimers (size and contrast), calm palette, agent/phone contact, progress indicators on long forms; older audience likely |
| Finance / banking / fintech | Security and trust cues, numbers formatted for scanning (tabular figures, right-aligned), accessible charts, restrained motion |
| Healthcare | Calm, accessible (aim for AAA), plain language, appointment / find-a-provider CTA, urgent info easy to find, privacy cues |
| E-commerce | Product images are informational: large, consistent ratio, zoom; price and add-to-cart hierarchy; filters; reviews, shipping and returns visible |
| SaaS / developer tools | Real product screenshots over illustrations; pricing table; docs and changelog reachable; demo or signup CTA |
| Education | Long-form readability, progress cues, accessibility for students with disabilities, age-appropriate tone |
| Government / public / nonprofit | Legal accessibility duties (e.g. Section 508, EN 301 549), plain language, findability; donate CTA for nonprofits |
| Restaurant / hospitality / local | Hours, location, booking CTA; menu as HTML text (not a PDF or image); food photos informational |
| Real estate | Listing cards (photo, price, beds/baths, area), map + list views, filters |
| News / media / blog | Reading typography, ad placement not breaking reading, article and index layouts |
| Portfolio / creative / agency | Work shown large; distinct identity; novelty acceptable if navigation stays clear |

These are starting lenses; combine an audience with an industry (e.g. insurance × seniors) and adjust to the brief.

## Step 2: Preflight (what evidence is possible)

Pick the evidence level and state it:
- **Rendered + code** (best): the site runs and a browser tool can open it.
- **Code + screenshots**: the user attached screenshots or design comps.
- **Code only**: nothing renders. Review code, mark every visual finding **Inferred**, and say what couldn't be judged.

Getting it running (read README, `package.json` scripts, `Makefile`, `Procfile`, `docker-compose.yml` first):

| Stack | Typical command |
|---|---|
| Node-based (Next, Nuxt, SvelteKit, Astro, Vite, Remix, Angular) | The `dev` script (`npm/pnpm/yarn/bun run dev`, `ng serve`); for final scores `build` + `start`/`preview` |
| Django / Flask | `python manage.py runserver` / `flask run` |
| Rails | `bin/dev` or `bin/rails server` |
| Laravel / PHP | `php artisan serve` / `php -S localhost:8000` |
| Hugo / Jekyll / Eleventy | `hugo server` / `bundle exec jekyll serve` / `npx @11ty/eleventy --serve` |
| Plain HTML | any static server (`python -m http.server`) |
| WordPress / Shopify | usually a staging or preview URL (`wp-env`, Docker, `shopify theme dev` if set up) |

- Prefer a URL the user gives: their localhost, staging or production. Browser tools on the user's computer can open their localhost.
- Dev vs production: fonts, image optimization and layout shift differ; prefer a production build or staging URL for scores and say which was used.
- Env vars: names from `.env.example`; never invent secrets. Use the project's mocks or seeds if they exist; otherwise list pages that couldn't render.
- Auth pages: test account or dev bypass the user provides; never real users' credentials; never create accounts on production.
- Empty dev database: review it as the empty state; seed to see the populated state if supported.

Browser: whichever the session has (built-in browser, Claude in Chrome, Playwright MCP, or a Playwright script with a server helper like Anthropic's `webapp-testing`). Load that browser's skill first.

## Step 3: Capture at many resolutions

Review is never done at one width. Viewports (CSS px, width × height):

| Tier | Viewports | Use on |
|---|---|---|
| **Core** | 360×800, 390×844, 768×1024, 1024×768, 1280×800, 1440×900, 1920×1080 | Every page in scope |
| **Extended** | 320×568 (smallest), 430×932 (large phone), 844×390 (phone landscape), 820×1180 (tablet portrait), 1366×768 (short laptop: fold check), 1536×864, 2560×1440, 3440×1440 (ultrawide) | Home, main landing page, main app screen, plus anything the lens points to |
| **Breakpoint edges** | Each project breakpoint − 1px and + 1px | Key pages |
| **Zoom & density** | Browser zoom 200% (and 400% at 1280 = 320px reflow); device pixel ratio 1 and 2 (3 on a phone if possible) for image sharpness | Home + one content page |

Find the project's breakpoints in its config; common framework defaults (projects often customize them, so confirm): Tailwind 640/768/1024/1280/1536 · Bootstrap 576/768/992/1200/1400 · MUI 600/900/1200/1536 · Chakra 480/768/992/1280/1536 · Ant Design 576/768/992/1200/1600 · Vuetify 600/960/1280/1920/2560 · Bulma 769/1024/1216/1408 · Foundation 640/1024/1200/1440.

Lens additions: seniors → tablets and 200% zoom on every key page; gamers → 1920, 2560 and ultrawide on every key page; engineers → 1280–2560 plus docs at 1024; staffing/consumer → all phone sizes on every key page. If the user shares analytics, add their top 5 resolutions.

For each capture:
- Wait for fonts (`document.fonts.ready`), images and entrance animations; scroll once top to bottom so lazy content loads, then return to the top.
- Above-the-fold screenshot (the 2-second judgment) and full-page screenshot.
- Cookie banners and chat widgets: capture once as components, then dismiss.
- States (at one phone and one desktop width, not every width): hover and keyboard focus on each interactive type; active, disabled; menus, modals, accordions, tabs, toasts; forms empty / filled / error / success (never submit to real endpoints); loading, error, 404, empty lists.
- Stress: titles 2–3× typical length, missing image, 1 item vs many, longest locale and RTL if i18n exists, `prefers-reduced-motion`.

Save as `.design-review/runs/<date>/screenshots/<page>/<width>x<height>-<theme>[-<state>].png`.

## Step 4: Measure

Numbers beat impressions: every color, size and spacing finding quotes a measured value. The script below only reads the DOM, so it works for any framework. Run it per page, viewport and theme; save to `runs/<date>/measure/<page>-<width>-<theme>.json`. It converts any CSS color (rgb, hsl, oklch, color-mix) to sRGB via canvas; ancestor `opacity` is not composited, and text over images, gradients or blur is flagged for a visual check.

```js
(() => {
  scrollTo(0, 0);
  const cv = document.createElement('canvas'); cv.width = cv.height = 1;
  const cx = cv.getContext('2d', { willReadFrequently: true });
  const rgba = c => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = 'rgba(0,0,0,0)'; cx.fillStyle = c; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255]; };
  const over = (t, b) => { const a = t[3] + b[3] * (1 - t[3]); if (!a) return [255, 255, 255, 0]; return [0, 1, 2].map(i => (t[i] * t[3] + b[i] * b[3] * (1 - t[3])) / a).concat(a); };
  const lum = ([r, g, b]) => { const f = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const ratio = (a, b) => { const [h, l] = [lum(a), lum(b)].sort((x, y) => y - x); return Math.floor(((h + 0.05) / (l + 0.05)) * 100) / 100; };
  const bgOf = el => { const layers = []; let img = false; for (let e = el; e; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.backgroundImage !== 'none') img = true; const c = rgba(cs.backgroundColor); if (c[3] > 0) { layers.push(c); if (c[3] >= 1) break; } } let out = [255, 255, 255, 1]; for (let i = layers.length - 1; i >= 0; i--) out = over(layers[i], out); return { color: out, overImage: img }; };
  const vis = el => { const r = el.getBoundingClientRect(), cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity > 0; };
  const sel = el => el.id ? '#' + el.id : el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.') : '');
  const lhOf = cs => cs.lineHeight === 'normal' ? parseFloat(cs.fontSize) * 1.2 : parseFloat(cs.lineHeight);
  const all = [...document.body.querySelectorAll('*')].filter(e => !['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE'].includes(e.tagName) && vis(e));

  const contrast = [], sizes = {}, odd = new Set(), lines = [], groups = new Map(), media = [];
  for (const el of all) {
    const cs = getComputedStyle(el), r = el.getBoundingClientRect();
    ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'marginTop', 'marginBottom', 'rowGap', 'columnGap'].forEach(k => { const v = parseFloat(cs[k]); if (v > 0 && v % 2) odd.add(Math.round(v * 10) / 10 + 'px'); });
    if (cs.backgroundImage.includes('url(') && r.width * r.height > 2500) media.push({ sel: sel(el), src: 'css-background', w: Math.round(r.width), h: Math.round(r.height), aboveFold: r.top + scrollY < innerHeight });
    if (el.children.length && r.width >= 120 && r.height >= 80 && parseFloat(cs.borderTopLeftRadius) > 0 && el.parentElement &&
        (cs.boxShadow !== 'none' || parseFloat(cs.borderTopWidth) > 0 || rgba(cs.backgroundColor)[3] > 0)) {
      const p = el.parentElement; if (!groups.has(p)) groups.set(p, []); groups.get(p).push(el);
    }
    const own = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join(' ').trim();
    if (!own) continue;
    const fs = parseFloat(cs.fontSize), fw = +cs.fontWeight;
    sizes[cs.fontSize] = (sizes[cs.fontSize] || 0) + 1;
    const bg = bgOf(el), fg = over(rgba(cs.color), bg.color), cr = ratio(fg, bg.color);
    const large = fs >= 24 || (fs >= 18.66 && fw >= 700), need = large ? 3 : 4.5;
    if (cr < need || bg.overImage) contrast.push({ sel: sel(el), text: own.slice(0, 60), fontSize: cs.fontSize, ratio: cr, need, overImage: bg.overImage });
    const len = el.textContent.trim().length;
    if (len > 120) { const n = Math.max(1, Math.round(r.height / lhOf(cs))); lines.push({ sel: sel(el), charsPerLine: Math.round(len / n), fontSize: cs.fontSize, lineHeight: +(lhOf(cs) / fs).toFixed(2) }); }
  }

  const cardSets = [...groups].filter(([, els]) => els.length >= 2).map(([p, els]) => {
    const rs = els.map(e => e.getBoundingClientRect()), cs = getComputedStyle(els[0]);
    const rows = {}; rs.forEach(r => { const t = Math.round(r.top); rows[t] = (rows[t] || 0) + 1; });
    const ratios = els.flatMap(e => [...e.querySelectorAll('img,video')]).map(m => { const b = m.getBoundingClientRect(); return b.height ? +(b.width / b.height).toFixed(2) : null; }).filter(Boolean);
    const cpl = els.map(e => { let best = 0; e.querySelectorAll('*').forEach(t => { const s = t.textContent.trim(); if (!t.children.length && s.length > 40) { const st = getComputedStyle(t); best = Math.max(best, Math.round(s.length / Math.max(1, Math.round(t.getBoundingClientRect().height / lhOf(st))))); } }); return best; });
    return { parent: sel(p), count: els.length, perRow: Math.max(...Object.values(rows)), widths: [...new Set(rs.map(r => Math.round(r.width)))], heights: [...new Set(rs.map(r => Math.round(r.height)))], padding: cs.padding, radius: cs.borderRadius, shadow: cs.boxShadow, mediaRatios: [...new Set(ratios)], maxCharsPerLine: Math.max(...cpl), elementsInFirstCard: els[0].querySelectorAll('*').length };
  });

  const minT = innerWidth < 768 ? 44 : 24;
  const smallTargets = [...document.querySelectorAll('a,button,[role=button],input,select,textarea,summary')].filter(vis)
    .map(e => ({ e, r: e.getBoundingClientRect(), inline: e.tagName === 'A' && getComputedStyle(e).display === 'inline' }))
    .filter(({ r, inline }) => !inline && (r.width < minT || r.height < minT)).slice(0, 40)
    .map(({ e, r }) => ({ sel: sel(e), w: Math.round(r.width), h: Math.round(r.height) }));

  for (const m of document.querySelectorAll('img,video,picture > img,svg,canvas')) {
    if (!vis(m)) continue;
    const r = m.getBoundingClientRect(); if (r.width * r.height < 2500) continue;
    const top = r.top + scrollY, shown = Math.max(0, Math.min(top + r.height, innerHeight) - Math.max(top, 0));
    media.push({ sel: sel(m), src: String(m.currentSrc || m.src || '').split('/').pop().slice(0, 60), alt: m.getAttribute('alt'), w: Math.round(r.width), h: Math.round(r.height), aboveFold: top < innerHeight, foldShare: +((shown * r.width) / (innerWidth * innerHeight)).toFixed(2), blurry: m.naturalWidth ? m.naturalWidth < r.width * devicePixelRatio * 0.9 : null });
  }

  return {
    viewport: innerWidth + 'x' + innerHeight,
    theme: document.documentElement.classList.contains('dark') || matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
    horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
    fontSizes: sizes, oddSpacing: [...odd],
    contrastIssues: contrast.slice(0, 80),
    lineLengthIssues: lines.filter(l => l.charsPerLine > 80 || l.charsPerLine < 35).slice(0, 40),
    cardSets, smallTargets, media
  };
})()
```

**Map rendered elements to source.** In dev builds this reads React, Vue 2/3, Svelte, Angular and Astro metadata (Vue and Svelte often give the file path directly). Replace `SELECTOR`:

```js
(s => {
  const el = document.querySelector(s); if (!el) return 'selector not found';
  const out = [], add = v => { if (v && !out.includes(v)) out.push(v); };
  for (let e = el; e && out.length < 6; e = e.parentElement) {
    const fk = Object.keys(e).find(k => k.startsWith('__reactFiber$'));
    if (fk) { for (let f = e[fk]; f && out.length < 6; f = f.return) { const t = f.type; const n = typeof t === 'function' ? (t.displayName || t.name) : t?.displayName || t?.render?.name; if (n) add('react:' + n); } break; }
    if (e.__vueParentComponent) { for (let c = e.__vueParentComponent; c && out.length < 6; c = c.parent) add('vue:' + (c.type.__file || c.type.__name || c.type.name || '')); break; }
    if (e.__vue__) { add('vue2:' + (e.__vue__.$options.__file || e.__vue__.$options.name)); break; }
    if (e.__svelte_meta) { add('svelte:' + e.__svelte_meta.loc.file + ':' + e.__svelte_meta.loc.line); break; }
    if (window.ng?.getComponent) { const c = window.ng.getComponent(e); if (c) { add('angular:' + c.constructor.name); break; } }
    const island = e.closest?.('astro-island'); if (island) { add('astro:' + island.getAttribute('component-url')); break; }
  }
  return out.length ? out : 'no framework metadata: grep the visible text, ids or class names';
})('SELECTOR')
```

For server-rendered, static and CMS sites, grep the templates for the visible text, ids or class names (WordPress: the `body` classes such as `page-template-*` name the template). Label any guessed mapping Inferred.

## Step 5: Code review (design-facing, in the project's system)

Look for code patterns that cause visual problems or drift, translated to the stack:
- **Raw values instead of the system:** hex/rgb literals in components; Tailwind arbitrary values (`text-[13px]`, `bg-[#1e40af]`) or palette colors where semantic tokens exist; Bootstrap inline styles, `!important` overrides or hex instead of `$variables`/`--bs-*`; MUI `sx` or `style` hex instead of `theme.palette`; styled-components/Emotion literals instead of `theme`; Sass/Less literals instead of variables; WordPress values outside `theme.json` presets.
- **Variant sprawl:** distinct radii, shadows, font sizes and button styles; duplicate components (two Card implementations, Bootstrap `.card` plus a custom card).
- **Focus removed:** `outline: none` / `outline-none` / `shadow-none` on focus without a visible replacement.
- **Theme gaps:** light-only colors where dark mode exists.
- **Images:** the framework's image component where one exists (`next/image`, `<NuxtImg>`, Astro `<Image>`, `gatsby-plugin-image`, WordPress `wp_get_attachment_image`, Shopify `image_url` + `image_tag`) with sizes/srcset; plain `<img>` with `width`/`height`, `srcset`/`sizes`, `loading="lazy"` below the fold; alt text matching the image's role; text baked into images.
- **Fonts:** `font-display` set; at most 2 families and 3 weights per family unless the brand requires more.
- **Motion:** animations without a `prefers-reduced-motion` guard; an entrance animation on every card.
- **Fragile layout:** fixed px heights on text containers; truncation hiding important content; grids with no responsive variants (Tailwind `grid-cols-3` with no breakpoint prefix, Bootstrap `col-4` with no `col-md-*`, MUI Grid with only `xs`, CSS grids with fixed column counts).
- **Missing states:** no hover/focus/disabled styles; lists without empty states; data views without loading or error UI.

## Speak the project's language

Every fix uses the project's existing framework, library and tokens. Never introduce a new styling system or library to fix a finding. Put systemic changes in the token/theme source; put one-off changes in the component. If a new value is genuinely needed, add it to the theme instead of a literal. Examples of the same fix in different systems:

| System | Muted text too light | Cards too narrow at desktop |
|---|---|---|
| Tailwind | `text-gray-400` → `text-gray-600`, or change `--muted-foreground` | `lg:grid-cols-4` → `md:grid-cols-2 xl:grid-cols-3` |
| Bootstrap | `$text-muted` / `--bs-secondary-color` to a darker value | `row-cols-lg-4` → `row-cols-md-2 row-cols-xl-3` |
| MUI | `theme.palette.text.secondary` | Grid item breakpoints from `lg: 3` to `md: 6, xl: 4` |
| styled-components / Emotion | `theme.colors.muted` in the theme object | `grid-template-columns: repeat(auto-fill, minmax(300px, 1fr))` |
| Vanilla CSS / Sass | `--color-muted` or `$color-muted` | same `minmax()` grid, or a media query at the project breakpoint |
| WordPress block theme | the color preset in `theme.json` | column count in the block/pattern, or `theme.json` layout settings |

## Step 6: Judge

Score each category 0–4 (0 broken, 1 poor, 2 acceptable, 3 good, 4 excellent). Rules marked **(house)** are starting thresholds, not published standards. The audience lens and PROFILE.md may override house rules and shift category weights by up to ±4 points each (the total stays 100); WCAG minimums always apply. The report lists the weights used.

### 1. Audience & industry fit (default weight 10)
- Does the page speak to the audience in the profile: tone, imagery, density, type size, motion level?
- Does each audience's main path have a clear entry and CTA (e.g. candidates and employers)?
- Industry expectations from the lens met (trust cues for insurance, product art for games, docs for dev tools)?
- Lens red flags present?

### 2. Hierarchy & CTA (12)
- **2-second test** on the above-the-fold screenshot at 1440 and 390: what is seen first, second, third, and does that match the page's one job?
- **Content priority:** the largest, highest element carries the most important message, not a decorative image or vague slogan.
- One primary action per view; secondary actions visibly quieter.
- Emphasis through weight and color before size.

### 3. Typography (10)
- Body text ≥ 16px (≥ 18px for seniors lens); inputs ≥ 16px on mobile.
- Body line height 1.5–1.7; headings 1.1–1.3.
- Body line length 45–75 characters; flag paragraphs above 85 or below 35.
- **(house)** At most ~7 distinct font sizes per page, 3 weights per family, 2 families; scale steps ~1.2–1.333.
- Distinct heading levels; no widows in headings; no long centered paragraphs; no all-caps blocks.

### 4. Color, contrast & harmony (10)
- **WCAG:** normal text ≥ 4.5:1; large text (≥ 24px, or ≥ 18.66px bold) ≥ 3:1; UI boundaries, icons, focus rings ≥ 3:1. No rounding up (4.47:1 fails). Seniors and healthcare lenses: aim 7:1 for body.
- Check every CTA and accent against every surface it appears on, in both themes. Text over images or gradients: sample the lightest and darkest points behind it.
- **Harmony (house):** 1 primary hue + at most 1 accent + neutrals tinted toward the primary; brand/accent fill about 10% or less of a screen (gaming and creative lenses may go higher); saturated colors reserved for actions and status. Flag two saturated hues competing, muddy palettes, grey text on colored backgrounds.
- Palette fits the industry and audience (calm and trustworthy for insurance/finance/health; high energy acceptable for gaming).
- Consistent meaning: one color = one role; status colors not decorative; color never the only cue.
- Fixes give the token change and new ratio, e.g. "muted text #8A8A8A on #FFFFFF (3.45:1) → #6B6B6B (5.32:1)".

### 5. Spacing, alignment & grid (8)
- Values from the project's spacing scale; the script lists odd values (13px, 17px) as suspects.
- **(house)** Space between groups at least 1.5–2× the space inside a group.
- Shared edges and grid columns; flag 1–8px misalignments.
- Consistent section rhythm and container max-width.

### 6. Component sizing & proportion (10), cards especially
- **Too small:** text in a card wraps under ~35 characters per line; titles truncate or wrap to 3+ lines; padding under 16px; content touches edges; **(house)** more than ~6–8 elements in a card under ~320px wide.
- **Too big:** lines over 75 characters; content fills less than about half the card; a single item stretched full width.
- **Consistency:** shared width, padding, radius, media ratio within a set; equal heights per row; aligned bottom CTAs.
- **Importance:** featured items visibly emphasized; flag equal boxes for unequal content.
- **(house)** Content cards need ~280–320px minimum: 1 column on phones, 2 on tablets, 3 on laptops, 4 only for small items. Check in-between widths where cards get squeezed. Seniors lens: larger cards, fewer per row.
- **Should they be cards?** Homogeneous scannable data often reads better as a list or table (engineers and B2B lenses especially).
- **Targets:** ≥ 24px, 44px on touch (seniors: 44–48px everywhere); inline text links exempt.

### 7. Content type: text vs image (8)
Classify every image, illustration and video as **informational** (shows the product, real people, a diagram, data, a result, a real place) or **decorative** (stock, abstract shapes, generic illustration).
- Decorative image in prime space (above the fold or **(house)** ~25%+ of a section) → replace with text that does the job (headline + proof points, short list, sourced stat) or an informational image.
- Long prose describing something visual (a UI, process, comparison, numbers) → screenshot, diagram, steps or table.
- Text baked into images → real text. Menus, prices and job details must be text, never images or PDFs.
- Text over images must meet contrast everywhere → scrim, overlay or move the text.
- The lens decides how much imagery is right: gaming, e-commerce, hospitality and portfolios need strong informational imagery; dev tools, insurance and B2B usually need less, and it must be real.
- Icons consistent in set, stroke and size; icon-only buttons labeled. Image quality: not blurry at DPR 2, not stretched, consistent crops.

### 8. Responsive across resolutions (10)
- No horizontal scroll or clipping at any tested viewport, including breakpoint edges and 320px.
- Phones: usable navigation, CTA reachable early, no hover-only information, landscape still usable.
- Short laptops (1366×768): the primary CTA and value statement visible without scrolling.
- Large screens (1920+, ultrawide): content constrained by max-width, no stretched lines or giant empty heroes; media sharp.
- Zoom 200% and 320px reflow: content readable without two-direction scrolling.

### 9. Interaction states (8)
Hover, clear focus-visible (≥ 3:1), active, disabled, loading on every interactive element; empty, loading (skeleton matches final layout), error and long-list states for data; inline form validation tied to fields.

### 10. Accessibility, design-facing (6)
Contrast, visible focus, target size, headings in order, alt-text roles, never color-only, reduced motion, reflow. Deep audits go to `/optimize-app`.

### 11. Consistency & design system (4)
Same component looks and behaves the same everywhere; few variants; the system's tokens used instead of literals.

### 12. Copy & microcopy (3)
Headline says what it is and for whom in the audience's words (plain for seniors and consumers, specific and technical for engineers); CTA verbs say what happens; consistent terms; no placeholders.

### 13. Motion (1; gaming and creative lenses may raise it)
Purposeful, UI transitions about 300ms or less, not on every element, reduced motion respected.

Also flag generic template tells (identical rounded cards with the same soft shadow everywhere, gradient washes, an all-caps eyebrow on every heading, a generic stock hero) unless the brief or PROFILE.md says the look is intentional.

### Scoring
Points per category = score / 4 × weight; total out of 100. A ≥ 90, B ≥ 80, C ≥ 70, D ≥ 60, F below 60. **Any open Blocker caps the grade at C.** Show per-category scores and the weights used so the next review can compare.

## Step 7: Findings

Each finding has:
- **ID** by category: AF (audience fit), H, T, C, S, Z (sizing), I (image/content), R (responsive), ST (states), A, D (design system), W (copy), M.
- **Severity:**
  - **Blocker:** primary content or CTA unreadable or unusable for the target audience: contrast failure on body or CTA, content hidden at a common viewport, invisible focus, a core audience path with no way forward.
  - **High:** clearly hurts understanding, trust or conversion for most of the audience: wrong hierarchy, decorative image pushing key info below the fold, cramped cards, design that contradicts the audience (tiny grey text on a seniors' site).
  - **Medium:** inconsistency or polish a design lead would want fixed before the next release.
  - **Nit:** taste; optional.
- **Evidence:** Confirmed (seen or measured in render) or Inferred (from code or reasoning), with the screenshot path, viewport and measured value.
- **Where:** page, viewport, theme, selector, `file:line`.
- **Who it affects:** which audience or path.
- **Rule and source:** WCAG, NN/g, Refactoring UI, Vercel Web Interface Guidelines, the audience/industry lens, a house rule, or the project's DESIGN.md.
- **Fix, exact, in the project's system:** "Change X to Y because Z" with the class, token, theme or template change and the new measured value. Never "consider improving".
- **Effort:** S / M / L.

Group repeats into one finding with a list of locations. If a category is fine, say so in one line. Name specific strengths in "What works well".

## Step 8: Report

Write `.design-review/runs/<date>/report.md`:

```
# Design review: <site> (<date>)
Grade: B (82/100) · Evidence: rendered + code (staging) · Stack: <framework> + <styling>
Audience: <primary> + <secondary> · Industry: <industry> · Lens: <lens names>
Pages: 6 · Viewports: 7 core + 8 extended + breakpoint edges · Themes: light/dark
Blockers 1 · High 4 · Medium 9 · Nits 6 · Accepted exceptions skipped: 2
.gitignore: `.design-review/runs/` already ignored | added

## Assumptions
## Audience profile
## Top 5 changes (highest impact first)
## Scores by category (weights used, vs last review)
## Findings
| ID | Sev | Category | Audience | Where (page @ viewport, file:line) | Evidence | Rule | Fix | Effort |
## Resolution matrix (page × viewport: pass / issue IDs)
## What works well
## Not checked (and why)
## Before/after (fix mode)
```

In chat: the grade, the audience profile in one line, the top 5 changes, where the report is, whether `.gitignore` was updated, and an offer of fix mode. Don't paste the whole report.

## Fix mode

When the user says fix, apply or polish (all, by severity, or by IDs):
1. Order: Blockers → High → Medium. Nits only if asked.
2. One finding per change; the smallest change that resolves it, in the project's framework and conventions. If the repo uses git and the user wants commits, one commit per finding with its ID. Never push.
3. **Ask first** before changing brand colors, fonts or logo; rewriting the meaning of copy; removing images, sections or content; restructuring navigation or layouts across many pages; adding dependencies or a new UI library.
4. Re-capture the same pages, viewports and themes into `runs/<date>/after/`, re-measure, re-score, note regressions.
5. Run the project's lint, typecheck and tests if they exist.

## Scoped modes

- **PR / "review my changes":** `git diff` against the base branch; map changed components/templates to the routes that use them; review those pages, plus global effects (token or theme changes affect everything).
- **One page or component:** same rules for that scope; check the component wherever it's used.
- **Storybook / Histoire / Ladle present:** also review components in isolation (all variants and states).
- **Design comp provided:** compare the build with the comp; differences are findings unless the build is better, and say why.

## Where files go

Keep the skill and its outputs apart. The skill lives in the user's skills folder (`~/.claude/skills/` for personal use across projects, or a repo's `.claude/skills/` when a team shares it). Never write reports, screenshots or profiles into any skills folder.

Outputs live in a hidden folder in each project:

```
.design-review/
  PROFILE.md          # committed: audience lens, brand decisions, overrides, score history
  runs/               # NOT committed: reports, screenshots, measurements
    <YYYY-MM-DD>/
      report.md
      progress.md
      screenshots/
      measure/
      after/
```

### .gitignore (required, every run)

Before writing anything into `runs/`, at the **git repository root** (`git rev-parse --show-toplevel`; in a monorepo this is the repo root, not the app folder):
1. If `.gitignore` doesn't exist, create it.
2. If no existing rule already ignores `.design-review/runs/` (check with `git check-ignore -q .design-review/runs/x.png`), append:
   ```
   # senior-design-review outputs (screenshots, reports)
   .design-review/runs/
   ```
   Leave every other line untouched. Don't ignore `.design-review/` as a whole: `PROFILE.md` stays committed.
3. If files under `.design-review/runs/` are already tracked from an earlier run, tell the user and give them `git rm -r --cached .design-review/runs`; don't run it unless asked.
4. State in the report and in chat whether the line was already there or was added.

This is the only file outside `.design-review/` that review mode changes. If the project isn't a git repo, skip the `.gitignore` step and say so; if the user doesn't want files in the project, write to `~/.design-review/<project-name>/` instead and say where.

### PROFILE.md
Create on the first run, read every run: audience profile and lens; stack and how to run it (commands, env var names, how to reach auth pages; never secrets); pages in scope with each page's goal and primary CTA; design system summary and intentional brand choices; threshold and weight overrides; accepted exceptions and known false positives (pattern, reason, date); score history (date, grade, per-category). Accepted exceptions are not re-reported. If the user wants a report shared with a team, they can commit that specific `report.md`; screenshots stay ignored.

## Edge cases

- **No browser or the app won't run:** code-only review, visual findings Inferred, list what couldn't be checked, offer to review screenshots.
- **Several audiences with conflicting needs** (e.g. gamers and parents): judge each page by the audience it serves; for shared pages, flag where one audience is blocked.
- **Audience unknown and site generic:** ask once; otherwise use the general consumer lens and say so.
- **Mixed styling systems** (Bootstrap plus custom CSS, MUI plus Tailwind): write each fix in the system that file already uses; flag the mix as a consistency finding only if it causes visible inconsistency.
- **No-code or hosted builders without source** (Wix, Squarespace, Webflow without export): rendered review only; fixes described as builder settings; no `.gitignore` step.
- **Font swap or hydration flash:** capture after fonts load, but note any visible flash on first load.
- **Feature flags or A/B tests:** note the variant reviewed.
- **Third-party embeds** (maps, video, chat, payments, booking widgets): review placement and size, not their internals.
- **Very large site:** key pages plus one per template; list routes not reviewed.
- **Monorepo:** review the app that serves the website; ask only if several apps qualify. `.gitignore` goes at the repo root.
- **RTL / i18n:** mirroring and the longest locale.
- **No dark mode:** not a finding unless the brief or lens expects it (dev tools, gaming); mention once.
- **Gradients, video, glass behind text:** sample several points; mark Inferred when it can't be measured.
- **Wide-gamut colors (oklch, P3):** the script measures in sRGB; note possible clipping.
- **Out of scope:** email templates, PDFs, native mobile apps. Say so.

## Common mistakes

- Judging without an audience profile, or applying one audience's taste to another (gamer aesthetics on an insurance site, or the reverse).
- Opinions without a measured value or an exact fix.
- Writing fixes in Tailwind or React for a project that uses something else.
- Reviewing only one or two resolutions.
- Burying Blockers under Nits.
- "Fixing" deliberate brand choices into generic defaults.
- Calling code-only judgments Confirmed.
- Skipping the `.gitignore` step, ignoring all of `.design-review/`, or committing screenshots.
- Writing outputs into a skills folder.
- Re-reporting accepted exceptions.
