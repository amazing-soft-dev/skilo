# Frameworks, running the site, and viewports

Read in the `intake` and `capture` passes. Only the parts for the detected stack matter. This file records what the review needs; it is not a framework tutorial. For anything not listed, apply the general rule: read the project's config and README, follow its conventions, and say what you assumed.

## Contents
- Detect the stack
- Run the site
- Viewports and breakpoints
- Element → source mapping

## Detect the stack

Look at `package.json`, `composer.json`, `Gemfile`, `requirements.txt`/`pyproject.toml`, `go.mod`, config files and folder layout.

| Family | Examples | Routes live in |
|---|---|---|
| React meta-frameworks | Next.js, Remix/React Router, Gatsby | `app/**/page.*`, `pages/**`, `app/routes/**`, `src/pages/**` |
| Vue | Nuxt, Vite + Vue, Vue 2 | `pages/**`, `src/router/**` |
| Svelte | SvelteKit | `src/routes/**/+page.svelte` |
| Angular | Angular CLI | `*-routing.module.ts`, `app.routes.ts` |
| Islands / static | Astro, Eleventy, Hugo, Jekyll, plain HTML | `src/pages/**`, `content/**`, `_layouts`, `*.html` |
| Server-rendered | Django/Jinja, Flask, Rails ERB, Laravel Blade, PHP, ASP.NET Razor, Phoenix | `urls.py`, `routes.rb`, `routes/web.php`, controllers + templates |
| CMS / commerce | WordPress (classic or block theme), Shopify Liquid | Template hierarchy, `theme.json`, `templates/*.json`, `sections/` |
| No source | Wix, Squarespace, Webflow without export | Rendered review only; fixes as builder settings |

Then detect the styling system and UI libraries (see `styling.md`).

## Run the site

Read README, `package.json` scripts, `Makefile`, `Procfile`, `docker-compose.yml` first; they override this table.

| Stack | Typical command |
|---|---|
| Node-based (Next, Nuxt, SvelteKit, Astro, Vite, Remix, Angular) | the `dev` script (`npm/pnpm/yarn/bun run dev`, `ng serve`); for final scores `build` + `start`/`preview` |
| Django / Flask | `python manage.py runserver` / `flask run` |
| Rails | `bin/dev` or `bin/rails server` |
| Laravel / PHP | `php artisan serve` / `php -S localhost:8000` |
| Hugo / Jekyll / Eleventy | `hugo server` / `bundle exec jekyll serve` / `npx @11ty/eleventy --serve` |
| Plain HTML | any static server (`python -m http.server`) |
| WordPress / Shopify | usually a staging or preview URL (`wp-env`, Docker, `shopify theme dev` if set up) |

- Prefer a URL the user gives (their localhost, staging, production). Browser tools on the user's computer can open their localhost.
- Dev vs production: fonts, image optimization and layout shift differ. Prefer a production build or staging for scores; say which was used.
- Env vars: names from `.env.example`; never invent secrets. Use the project's mocks/seeds if present; otherwise list pages that couldn't render.
- Auth pages: test account or dev bypass from the user; never real users' credentials; never create accounts on production.
- Empty dev database: review it as the empty state; seed if supported to see the populated state.

## Viewports and breakpoints

CSS px, width × height. `scripts/capture.mjs` and `capture-cdp.mjs` have these built in (`--viewports core|fold|extended|all`); browser-tool runs pass them to `__SDR_BATCH.viewports`.

| Tier | Viewports | Use on |
|---|---|---|
| Core | 360×800, 390×844, 768×1024, 1024×768, 1280×800, 1440×900, 1920×1080 | Every page in scope |
| Short screens (`fold`) | 1280×620, 1366×650, 1440×700, 1536×730 (laptops after browser bars and 125% Windows scaling), 390×664, 360×640 (phones with browser bars) | Key pages, and every landing or tool page: this is where heroes overflow and main actions drop below the fold |
| Extended | 320×568, 430×932, 844×390 (phone landscape), 820×1180, 1366×768 (short laptop fold), 1536×864, 2560×1440, 3440×1440 (ultrawide) | Home, main landing page, main app screen, plus what the lens points to |
| Breakpoint edges | each project breakpoint −1px and +1px (`--breakpoints`) | Key pages |
| Zoom & density | browser zoom 200% (and 400% at 1280 = 320px reflow); device pixel ratio 1 and 2 | Home + one content page (browser tool) |

Lens additions: seniors → tablets and 200% zoom on every key page; gamers → 1920, 2560, ultrawide; engineers → 1280–2560 plus docs at 1024; staffing / consumer → all phone sizes. Add the user's top 5 analytics resolutions if shared.

Find breakpoints in the project's config. Framework defaults, to confirm (projects often customize): Tailwind 640/768/1024/1280/1536 · Bootstrap 576/768/992/1200/1400 · MUI 600/900/1200/1536 · Chakra 480/768/992/1280/1536 · Ant Design 576/768/992/1200/1600 · Vuetify 600/960/1280/1920/2560 · Bulma 769/1024/1216/1408 · Foundation 640/1024/1200/1440.

## Element → source mapping

- **React, Vue 2/3, Svelte, Angular, Astro (dev builds):** evaluate `scripts/locate.js` once in the page, then `__sdrLocate('selector')`. Vue and Svelte usually return the file path; React and Angular return component names to grep for.
- **Production builds:** names are minified; grep the source for the visible text, ids or class names.
- **Server-rendered and static:** grep templates for the visible text, ids or class names.
- **WordPress:** `body` classes (`page-template-*`, `single-*`) name the template; block themes keep layout in `templates/` and `parts/`.
- **Shopify:** `data-section-type` / section ids map to `sections/*.liquid`.

Label any guessed mapping Inferred.
