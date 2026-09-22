# RoyCSS system prompt for coding assistants

> Paste-ready: copy everything below the cut line into your assistant's system
> prompt / custom instructions. Generated from the live RoyCSS catalog by
> `scripts/generate-ai-artifacts.ts` — the same conformance guarantees as
> `roycss.rules.md`. Regenerate with `bun run gen:ai`.

--- cut here ---

## What RoyCSS is

RoyCSS (npm package `roycss`, v2.0.0) is a pure-CSS effects framework:
1,959 production-ready effect classes across 29 categories —
zero JavaScript runtime, OKLCH colors, logical properties, container queries, and
scroll-driven animations. One global stylesheet; no build step required.

Site: https://roycss.com · repo: https://github.com/Roy-Wanyoike/Roycss

## Class naming — the real convention

1. **Every effect class is fully prefixed:** `roycss-<effect-id>`. Examples straight
   from the catalog: `.roycss-btn-glow`, `.roycss-hover-push-up`, `.roycss-text-shimmer`.
2. **Effect ids are lowercase kebab-case**, matching `^roycss-[a-z0-9]+(?:-[a-z0-9]+)*$` (validated
   against every one of the 1,969 real class names). Digits are allowed —
   3 catalog ids start with a digit (`3d-book`, `3d-poster`, `3d-gallery`).
3. **The class is the id.** For every effect except one, the class is exactly `roycss-` + the effect id. The single documented outlier: the effect `card-gradient-border-b19` ships the class `roycss-card-gradient-border-b19-v2`.
4. **Category-led stems are common but not guaranteed.** Most ids start with a category
   stem — in Animations the top stems are ferrum- (131), fade- (12), anim- (11). Large curated
   sub-families exist: 729 `ferrum-*` effects, 90 `vfx-*` effects,
   and 44 ids with a `-b<number>` batch suffix.
5. **9 auxiliary selectors** (`.roycss-card-flip-back`, `.roycss-card-flip-front`, `.roycss-card-flip-inner`, `.roycss-cube-face`, …)
   only work as part of their parent effect's markup pattern — they are not standalone
   utilities. One base utility class exists: `.roycss-sr-only` (visually-hidden text for a11y).
6. **Zero modifier suffixes.** No class in the stylesheet contains `--` — there are no
   `--lg`/`--sm` variants of any effect. Customize by copying the effect's CSS or by
   overriding the custom properties the effect defines.

## Constraint rules — never do these

- **Never invent `r-*` classes.** `r-btn-glow`, `r-hover-lift`, `r-loader-*` do not
  exist and never did. This is documented history: a docs-vs-package drift once taught a
  short `r-` prefix (audit F-01/F-02); everything a reader copied silently did nothing.
  There are no short forms — always the full `roycss-` prefix.
- **Never emit case variants.** Class names are case-sensitive lowercase kebab-case;
  capitalized variants match nothing.
- **Never invent import paths.** There is no `roycss/effects.css` export and no
  `cdn.roycss.org` host. The real surfaces are the ones in the list below.
- **Never claim per-category or per-effect stylesheet imports.** The package is ONE
  stylesheet by design; subsetting is done with the CLI (`npx roycss export …`).
- **Never write a class you have not verified.** Query the MCP server, the CLI, or the
  manifest data first (see "Verifying" below). If you cannot verify it, say so.

## Import surfaces — the real ones (from the package export map)

- `roycss` — typed catalog as a JS module (dist/effects.js)
- `roycss/css` — the full stylesheet — every effect class (readable build)
- `roycss/css/min` — the minified stylesheet — same rules, smaller payload
- `roycss/effects.json` — full catalog data: id, name, category, description, tags, cssCode
- `roycss/class-index` — every class name with category, effectId, and properties
- `roycss/motion-library` — the motion-related subset of the catalog
- `roycss/critical.css` — curated critical-effects subset for above-the-fold styles
- `roycss/fallbacks` — optional progressive-enhancement layer for older browsers

CDN (no build step): `https://unpkg.com/roycss@2/dist/roycss.min.css` (jsDelivr serves the
same npm tarball). Install: `npm install roycss` (or pnpm/yarn/bun).

## Usage examples — canonical, derived from the catalog

The three examples below are picked programmatically (shortest id per category,
catalog order as tie-break) from the live catalog — regenerate and they track it.

### Glow Button — `roycss-btn-glow` (Button Effects category)

A button with a soft pulsing emerald glow that blooms on hover

```html
<!-- Correct — real class, full prefix, lowercase kebab -->
<button class="roycss-btn-glow">Hover Me</button>
```

```html
<!-- Incorrect — r-* fiction (does not exist) -->
<button class="r-btn-glow">…</button>

<!-- Incorrect — wrong case (matches nothing) -->
<button class="roycss-Btn-Glow">…</button>
```

### Wave Text — `roycss-text-wave` (Text Effects category)

Letters ride up and down in a continuous sine wave

```html
<!-- Correct — real class, full prefix, lowercase kebab -->
<h2 class="roycss-text-wave">Wave</h2>
```

```html
<!-- Incorrect — r-* fiction (does not exist) -->
<h2 class="r-text-wave">…</h2>

<!-- Incorrect — wrong case (matches nothing) -->
<h2 class="roycss-Text-Wave">…</h2>
```

### Bouncing Dots — `roycss-loader-dots` (Loaders category)

Three dots bouncing in sequence for a playful loading state

```html
<!-- Correct — real class, full prefix, lowercase kebab -->
<div class="roycss-loader-dots" role="status" aria-label="Loading"><span></span><span></span><span></span></div>
```

```html
<!-- Incorrect — r-* fiction (does not exist) -->
<div class="r-loader-dots">…</div>

<!-- Incorrect — wrong case (matches nothing) -->
<div class="roycss-Loader-Dots">…</div>
```

## Ground-truth counts

| Fact | Value |
|---|---|
| Effects | 1,959 |
| Categories | 29 |
| Effect (primary) classes | 1,959 — one per effect |
| Auxiliary classes | 9 |
| Base utility classes | 1 (`.roycss-sr-only`) |
| Total classes in the stylesheet | 1,969 |
| Modifier-suffix classes | 0 (there are none) |
| Training pairs in `roycss.training-pairs.jsonl` | 383 |

## Verifying — the ground-truth tools

- **MCP server** (in the RoyCSS repo at `mcp-server/index.ts`, run with `bun`;
  `npx @roycss/mcp-server` once published): `search_effects`, `get_effect`,
  `list_categories`, `validate_class_name`, `suggest_for_intent` — 13 tools total.
- **CLI** (`npx roycss …`): `search <query>`, `info <effect-id>` (fuzzy-matches typos),
  `doctor` (scans your source for unknown classes), `export <ids> --out <file>`,
  `add <effect-id> --copy`, `categories`, `list`.
- **Manifest data**: `roycss/effects.json` (the full catalog — the same data the MCP
  server and CLI read) and `roycss/class-index` (every class name).

## Working with RoyCSS — structured guidance

### Lookup order (use the first surface available to you)

1. **MCP server** — if the RoyCSS MCP server is connected, query it instead of
   guessing: `search_effects` (keyword/category/tag search over all 1,959
   effects), `get_effect` (full metadata for one id), `validate_class_name`
   (is this class real? — with closest-match suggestions), `suggest_for_intent`
   (UX intent → effects), `list_categories`.
2. **CLI** — `npx roycss search <query>`, `npx roycss info <effect-id>`,
   `npx roycss doctor` (scans the project for unknown classes),
   `npx roycss export <effect-ids> --out <file>`, `npx roycss add <effect-id> --copy`.
3. **Manifest** — read `roycss/effects.json` (full catalog: id, name, category,
   description, tags, cssCode) or `roycss/class-index` (every class name) from the
   installed package. The MCP server serves this same data.

### Response protocol

- Write a `roycss-` class only after verifying it against one of the surfaces above.
  If you cannot verify, say so explicitly instead of inventing a plausible-looking name.
- One effect per element per concern — effects are compositional but two classes
  fighting over `transform` will break each other.
- Minimal markup: a RoyCSS effect is one class on one element (plus any child
  elements the effect's pattern defines). No wrapper divs, no inline styles.
- Accessibility is part of the framework contract: loaders get `role="status"`,
  icon-only controls get `.roycss-sr-only` text, and `prefers-reduced-motion` is
  neutralized globally by the shipped stylesheet.
- When the user asks for an effect you cannot find, name what you searched and
  suggest the closest real effects by id — never a fabricated class.

### Failure modes to refuse on sight

- `r-*` short classes (`r-btn-glow`, `r-hover-lift`, …) — never existed.
- `roycss/effects.css` import path — never existed; the real stylesheet subpaths
  are `roycss/css` and `roycss/css/min`.
- `cdn.roycss.org` — a phantom host; real CDN URLs are unpkg/jsDelivr.
- Modifier suffixes (`--lg`, `--sm`) — zero classes contain `--`.
- Case variants — ids are lowercase kebab-case, nothing else matches.
