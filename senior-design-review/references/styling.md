# Styling systems: code review and writing fixes

Read in the `code` pass and whenever writing a fix. Use only the rows for the systems the project uses.

## Contents
- Rules for every system
- Where the design tokens live
- Design-facing code smells
- The same fix in different systems

## Rules for every system

- Write every fix in the project's existing framework, library and tokens. Never introduce a new styling system or UI library to fix a finding.
- Systemic changes go in the token/theme source; one-off changes go in the component or template.
- If a new value is genuinely needed, add it to the theme instead of a literal.
- Mixed systems (Bootstrap plus custom CSS, MUI plus Tailwind): write each fix in the system that file already uses.

## Where the design tokens live

| System | Tokens / theme |
|---|---|
| Tailwind v3 / v4 | `tailwind.config.*` theme / `@theme` block and CSS variables in the main CSS |
| shadcn | CSS variables (`--primary`, `--muted-foreground`, …) in the global CSS; `components.json` |
| Bootstrap | Sass `$variables` (`_variables.scss` overrides) and `--bs-*` CSS variables |
| MUI | `createTheme({ palette, typography, spacing, breakpoints })` |
| Chakra / Mantine | `extendTheme` / `createTheme` theme objects |
| Ant Design | `ConfigProvider` theme tokens |
| Vuetify / Quasar | `createVuetify({ theme })` / Quasar Sass variables |
| Angular Material | Sass theme (`mat.define-theme`) |
| PrimeVue / PrimeNG / PrimeReact | preset / design tokens |
| Bulma / Foundation | Sass variables |
| styled-components / Emotion | `ThemeProvider` theme object |
| CSS Modules / Sass / Less / vanilla | CSS custom properties or Sass/Less variables in a shared file |
| WordPress block theme | `theme.json` (`settings.color.palette`, `typography.fontSizes`, `spacing`) |
| Shopify | `config/settings_schema.json` and theme settings |

## Design-facing code smells

- **Raw values instead of the system:** hex/rgb literals in components; Tailwind arbitrary values (`text-[13px]`, `bg-[#1e40af]`) or palette colors where semantic tokens exist; Bootstrap inline styles, `!important` overrides or hex instead of `$variables`/`--bs-*`; MUI `sx`/`style` hex instead of `theme.palette`; styled-components/Emotion literals instead of `theme`; Sass/Less literals instead of variables; WordPress values outside `theme.json` presets.
- **Variant sprawl:** many distinct radii, shadows, font sizes or button styles; duplicate components (two Card implementations, Bootstrap `.card` plus a custom card).
- **Focus removed:** `outline: none` / `outline-none` / `shadow-none` on focus with no visible replacement.
- **Theme gaps:** light-only colors where dark mode exists.
- **Images:** the framework's image component where one exists (`next/image`, `<NuxtImg>`, Astro `<Image>`, `gatsby-plugin-image`, WordPress `wp_get_attachment_image`, Shopify `image_url` + `image_tag`) with sizes/srcset; plain `<img>` with `width`/`height`, `srcset`/`sizes`, `loading="lazy"` below the fold; alt text matching the image's role; text baked into images.
- **Fonts:** `font-display` set; at most 2 families and 3 weights per family unless the brand requires more.
- **Motion:** animations without a `prefers-reduced-motion` guard; an entrance animation on every card.
- **Fragile layout:** fixed px heights on text containers; truncation hiding important content; grids with no responsive variants (Tailwind `grid-cols-3` with no breakpoint prefix, Bootstrap `col-4` with no `col-md-*`, MUI Grid with only `xs`, CSS grids with fixed column counts).
- **Missing states:** no hover/focus/disabled styles; lists without empty states; data views without loading or error UI.
- **Doubled section spacing:** every section pads top *and* bottom (`py-32`, `padding: 8rem 0`) so neighbors add up to twice the rhythm; wrappers adding margins on top. One owner: sections pad one side, or the parent uses `gap`.
- **Space that scales with the screen:** `vh` paddings, `min-height: 100vh` heroes, `h-screen` with `overflow: hidden` (clips content on short laptops).
- **Margin collapse through bands:** a child's `margin-top`/`margin-bottom` inside a colored section with no padding, border or `display: flow-root` lands outside the band and the child touches the band edge.
- **Height locks:** `min-height`/`height` on cards and text boxes; grids stretching every card to the tallest.
- **Centering against tall neighbors:** `items-center` / `align-items: center` on a row whose other column is taller than the screen (use sticky or `items-start`).
- **Hover not guarded for touch:** `:hover` rules outside `@media (hover: hover)` (Tailwind v3 `hover:` utilities aren't guarded; v4's are); hover that changes border width, padding or font weight; `transition: all`.

## The same fix in different systems

| System | Doubled section gap | Short column beside a tall one |
|---|---|---|
| Tailwind | `py-32` on each section → `pt-24` on each, `pb-24` on the last (or `space-y-*` / `gap-*` on the parent) | `lg:items-start` on the row; `lg:sticky lg:top-28 self-start` on the short column |
| Bootstrap | `py-5` on each → `pt-5` + `pb-5` only on the last; `$spacer` multiples | `align-items-start`; `position-sticky` with `style="top: …"` |
| MUI | `sx={{ py: 16 }}` → `sx={{ pt: 12 }}`; or a `Stack spacing` parent | `alignItems="flex-start"`; `sx={{ position: { lg: 'sticky' }, top: 112 }}` |
| Vanilla CSS / Sass | `section + section { padding-top: 0 }` or one `--section-gap` used as parent `gap` | `.row { align-items: start } .intro { position: sticky; top: calc(var(--header-h) + 24px) }` |
| WordPress block theme | `blockGap` / spacing presets in `theme.json` instead of per-block padding | Columns block `verticalAlignment: top`; sticky via a custom class |

| System | Muted text too light | Cards too narrow at desktop |
|---|---|---|
| Tailwind | `text-gray-400` → `text-gray-600`, or change `--muted-foreground` | `lg:grid-cols-4` → `md:grid-cols-2 xl:grid-cols-3` |
| Bootstrap | `$text-muted` / `--bs-secondary-color` to a darker value | `row-cols-lg-4` → `row-cols-md-2 row-cols-xl-3` |
| MUI | `theme.palette.text.secondary` | Grid item breakpoints from `lg: 3` to `md: 6, xl: 4` |
| styled-components / Emotion | `theme.colors.muted` in the theme object | `grid-template-columns: repeat(auto-fill, minmax(300px, 1fr))` |
| Vanilla CSS / Sass | `--color-muted` or `$color-muted` | same `minmax()` grid, or a media query at the project breakpoint |
| WordPress block theme | the color preset in `theme.json` | column count in the block/pattern, or `theme.json` layout settings |
