# Implementation Plan — RoyCSS Inspector Chrome Extension

- **Document owner:** Principal Engineer — Browser Inspector domain
- **Scope:** File-by-file breakdown of `/home/z/my-project/inspector/`.
- **Status:** v1.0 — build in progress.

---

## 1. Directory layout (final)

```
inspector/
├── manifest.json                  # Manifest V3 (Chrome 114+)
├── package.json                   # Build config (Bun + Node compatible)
├── tsconfig.json                  # TypeScript config (strict, ES2022)
├── README.md                      # Setup + install + architecture summary
├── scripts/
│   └── extract-top-effects.ts     # Pulls top 100 effects from src/lib/roycss-effects.ts
├── src/
│   ├── background.ts              # MV3 service worker
│   ├── content.ts                 # Content script (scans + annotates)
│   ├── popup.html                 # Popup UI shell
│   ├── popup.ts                   # Popup logic
│   ├── popup.css                  # Popup styles (OKLCH, matches RoyCSS)
│   ├── sidepanel.html             # Chrome side panel shell
│   ├── sidepanel.ts               # Side panel logic (live inspector)
│   ├── sidepanel.css              # Side panel styles
│   ├── inspector-overlay.ts       # Shadow-DOM overlay (badges + tooltips)
│   ├── effects-data.ts            # Re-exports effects-data.json as typed Map
│   └── effects-data.json          # Top 100 RoyCSS effects (generated, <50KB)
├── icons/
│   ├── icon16.png                 # 16×16 toolbar icon
│   ├── icon48.png                 # 48×48 extensions page icon
│   └── icon128.png                # 128×128 store icon
└── tests/
    └── content.test.ts            # Class detection unit test (bun:test)
```

The `dist/` directory is produced at build time and is what Chrome loads:

```
dist/                              # Build output — loaded by Chrome
├── manifest.json                  # Copied from inspector/manifest.json
├── background.js                  # Compiled from src/background.ts
├── content.js                     # Compiled from src/content.ts
├── popup.html                     # Copied from src/popup.html
├── popup.js                       # Compiled from src/popup.ts
├── popup.css                      # Copied from src/popup.css
├── sidepanel.html                 # Copied from src/sidepanel.html
├── sidepanel.js                   # Compiled from src/sidepanel.ts
├── sidepanel.css                  # Copied from src/sidepanel.css
├── inspector-overlay.js           # Compiled from src/inspector-overlay.ts
├── effects-data.js                # Compiled from src/effects-data.ts
├── effects-data.json              # Copied from src/effects-data.json
└── icons/                         # Copied from inspector/icons/
```

---

## 2. File-by-file breakdown

### 2.1 `manifest.json`

- `manifest_version: 3`
- `name: "RoyCSS Inspector"`, `version: "1.0.0"`, `description: "Inspect any website for RoyCSS classes — Manifest V3, read-only, no analytics."`
- `permissions: ["activeTab", "sidePanel", "scripting", "storage"]`
- `host_permissions: ["<all_urls>"]` — justified in threat model §7.
- `action.default_popup: "src/popup.html"` (note: the manifest path is relative to the loaded root; when loaded from `dist/` it becomes `popup.html`)
- `action.default_icon: { 16, 48, 128 }`
- `side_panel.default_path: "src/sidepanel.html"`
- `background.service_worker: "src/background.js"` (compiled from `background.ts`)
- `content_security_policy.extension: "default-src 'self'; script-src 'self'; object-src 'none'"`
- `icons: { 16, 48, 128 }`
- `minimum_chrome_version: "114"` (side panel API requirement)
- No `content_scripts` field — the script is injected on demand via `chrome.scripting.executeScript` from `background.ts`. This keeps the Inspector off the page until the user explicitly invokes it (matches `activeTab` semantics).

### 2.2 `package.json`

- `name: "roycss-inspector"`, `version: "1.0.0"`, `private: true`
- `type: "module"`
- `scripts`:
  - `build:data` — `bun run scripts/extract-top-effects.ts` (regenerates `src/effects-data.json`)
  - `build:ts` — `bun build src/background.ts src/content.ts src/popup.ts src/sidepanel.ts src/inspector-overlay.ts src/effects-data.ts --outdir dist`
  - `build:assets` — `cp manifest.json src/*.html src/*.css src/effects-data.json icons dist/` (shell-friendly via a small node script)
  - `build` — `bun run build:data && bun run build:ts && bun run build:assets`
  - `test` — `bun test`
- `devDependencies`: `typescript`, `@types/chrome`

### 2.3 `tsconfig.json`

- `strict: true`
- `target: "ES2022"`
- `module: "ESNext"`
- `moduleResolution: "bundler"`
- `lib: ["ES2022", "DOM", "DOM.Iterable"]`
- `types: ["chrome"]`
- `outDir: "dist"` (informational; actual emit via `bun build`)

### 2.4 `src/background.ts` (service worker)

Responsibilities:
1. Listen for `chrome.action.onClicked`. When the user clicks the toolbar icon:
   - If `chrome.sidePanel` is available (Chrome 114+), open the side panel via `chrome.sidePanel.open({ windowId })`.
   - Otherwise, the popup is shown automatically (because `action.default_popup` is set, the click does not bubble to `onClicked`). The side panel path is preferred when available.
2. Set `chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })` on install so the side panel opens automatically when the user clicks the toolbar icon.
3. Listen for `chrome.runtime.onMessage` from the content script and route:
   - `scan-complete` → forward to popup + side panel.
   - `effect-selected` → forward to side panel (open panel + show effect detail).
4. Listen for `chrome.runtime.onInstalled` — set default `inspectorEnabled: true` in `chrome.storage.local`.

Type definitions for the message schema are exported in a shared `types` block at the top of the file (no separate `types.ts` file to keep the surface small).

### 2.5 `src/content.ts`

Responsibilities:
1. Read `chrome.storage.local.inspectorEnabled`. If false, exit (do nothing). The user has turned the Inspector off from the popup.
2. Call `injectOverlay()` from `inspector-overlay.ts` to attach the Shadow DOM root.
3. Call `scanForRoyCssClasses()` (defined inline) → returns `Array<{ element: HTMLElement; classToken: string; effectId: string }>` where `effectId` is the `roycss-<id>` minus the prefix.
4. For each match (capped at 200), call `overlay.attachBadge(element, effectId)`.
5. Post `scan-complete` message to the service worker with `count` + `durationMs`.
6. Attach a `MutationObserver` on `document.body` with `{ subtree: true, attributes: true, attributeFilter: ["class"] }`. Debounce callbacks by 50 ms. On each callback, re-run steps 3–5 incrementally (skip elements already badged — tracked via a `WeakSet`).

Detection logic (single source of truth, exported for the unit test):

```typescript
const ROYCSS_CLASS_RE = /\broycss-([\w-]+)/g;

export function detectRoyCssClasses(root: ParentNode = document): Array<{ element: Element; effectId: string }> {
  const out: Array<{ element: Element; effectId: string }> = [];
  // querySelectorAll with the [class*="roycss-"] selector narrows the iteration
  // to elements that have a class containing "roycss-". We then re-match the
  // regex to extract every roycss-* token on each matched element.
  const candidates = root.querySelectorAll('[class*="roycss-"]');
  for (const el of candidates) {
    const cls = el.getAttribute("class") ?? "";
    for (const m of cls.matchAll(ROYCSS_CLASS_RE)) {
      out.push({ element: el, effectId: m[1] });
    }
  }
  return out;
}
```

### 2.6 `src/inspector-overlay.ts`

Responsibilities:
1. `injectOverlay()` — creates `<div data-roycss-inspector-root>` as the last child of `document.documentElement`. Attaches a **closed** Shadow DOM. Injects a `<style>` block inside the shadow root with all badge / tooltip CSS (scoped — no leakage to or from the page).
2. `attachBadge(element, effectId)` — creates a badge element inside the shadow root, positions it absolutely at the element's top-right corner (updated on `scroll` / `resize`), and shows the effect name + category.
3. On `mouseenter` of a badge, show a tooltip with: effect name, category, description (truncated to 80 chars), "View on RoyCSS" link (opens `https://roycss.dev/effects/<id>` in a new tab with `rel="noopener noreferrer"`), and a "Show in side panel" button.
4. On badge click, send `effect-selected` message via `chrome.runtime.sendMessage`.
5. Position updates use `requestAnimationFrame` (not `setInterval`).

Badge style is OKLCH-aligned with RoyCSS:

```css
.roycss-badge {
  position: absolute;
  background: oklch(0.35 0.06 162);
  color: oklch(0.96 0.02 150);
  border: 1px solid oklch(0.7 0.12 162 / 0.4);
  border-radius: 4px;
  padding: 2px 6px;
  font: 11px/1.3 system-ui, sans-serif;
  pointer-events: auto;
  cursor: pointer;
  z-index: 2147483647;
  box-shadow: 0 2px 8px oklch(0 0 0 / 0.25);
}
```

### 2.7 `src/popup.html`

A minimal HTML shell:
- `<link rel="stylesheet" href="popup.css">`
- Header: RoyCSS logo mark + "RoyCSS Inspector" + version
- Scan count card: "N RoyCSS classes detected on this page"
- Top-10 list (`<ul id="effect-list">`)
- Toggle: `<input type="checkbox" id="inspector-toggle">` — "Inspector active"
- Buttons: "Rescan page", "Open inspector panel"
- Footer: "v1.0.0 · Manifest V3 · No analytics"
- `<script src="popup.js" type="module"></script>`

### 2.8 `src/popup.ts`

Responsibilities:
1. On `DOMContentLoaded`:
   - Read `inspectorEnabled` from `chrome.storage.local`. Set the toggle.
   - Send `get-scan` message to the active tab's content script. On response, render count + top 10 effects.
2. On toggle change:
   - `chrome.storage.local.set({ inspectorEnabled: checked })`.
   - Send `toggle` message to the active tab's content script.
3. On "Rescan page" click:
   - Send `rescan` message to the active tab's content script.
4. On "Open inspector panel" click:
   - `chrome.runtime.sendMessage({ type: "open-side-panel" })`.

### 2.9 `src/popup.css`

- OKLCH color palette (matches RoyCSS marketing site).
- Dark-mode by default (the popup is a small floating window — dark mode reads better).
- Compact spacing (popup is ~320 px wide × 400 px tall).
- No external fonts (use `system-ui`).

### 2.10 `src/sidepanel.html`

Richer than the popup:
- Header: logo + title + "Live inspector" subtitle
- Effect detail card:
  - `<h2 id="effect-name">`
  - `<span id="effect-category">` (badge)
  - `<p id="effect-description">`
  - `<ul id="effect-tags">` (tag chips)
- CSS code block:
  - `<pre><code id="effect-css">` (syntax-highlighted via a tiny inline highlighter that wraps selectors, properties, and values in `<span class="…">` — no external library)
  - Copy button
- Framework tabs:
  - `<div role="tablist">` with 6 tabs: Vanilla / React / Vue / Angular / Svelte / Next.js
  - `<div role="tabpanel">` showing install / import / usage snippets for the active framework
- Footer: "RoyCSS Inspector · v1.0.0"

### 2.11 `src/sidepanel.ts`

Responsibilities:
1. On `DOMContentLoaded`:
   - Build the framework tablist (Vanilla / React / Vue / Angular / Svelte / Next.js).
   - Render the active effect (from the embedded dataset; default to first effect).
2. On `chrome.runtime.onMessage`:
   - `effect-selected` → look up effect in `effectsData` Map. If found, render detail card + CSS + framework tabs. If not found (effect not in top 100), show "Effect not in embedded dataset — view on RoyCSS" with link.
   - `scan-complete` → update a small "page has N matches" indicator at the top of the panel.
3. On framework tab click: switch the active panel.
4. On copy-CSS click: `navigator.clipboard.writeText(cssCode)`.

### 2.12 `src/sidepanel.css`

- OKLCH palette, same as popup.
- Code block: monospace, syntax-highlight colors via `oklch()` (selectors: amber, properties: emerald, values: sky).
- Tabs: pill style with active state.
- Responsive: side panel can be 280–500 px wide; layout adapts.

### 2.13 `src/effects-data.ts`

```typescript
import data from "./effects-data.json";
import type { EffectCategory } from "../../../src/lib/roycss-types";

export interface InspectorEffect {
  id: string;
  name: string;
  category: EffectCategory;
  description: string;
  tags: string[];
  cssCode: string;
}

export const effectsData: Map<string, InspectorEffect> = new Map(
  (data as InspectorEffect[]).map((e) => [e.id, e]),
);

export const effectsList: InspectorEffect[] = data as InspectorEffect[];
```

Note: when bundled via `bun build`, the JSON import is inlined into the JS file as a string literal. The Map is constructed at module load — O(100) once, then `Map.get(id)` is O(1).

### 2.14 `src/effects-data.json`

Generated by `scripts/extract-top-effects.ts`. 100 entries, 49.99 KB. Do not edit by hand.

### 2.15 `icons/`

Three PNGs: 16×16, 48×48, 128×128. Generated programmatically (see `scripts/make-icons.ts` if added; for v1.0 they are committed binary files). The icon is a stylized microscope + RoyCSS emerald "R" mark.

### 2.16 `tests/content.test.ts`

Uses `bun:test`. Sets up a minimal fake DOM via `linkedom` (or a hand-rolled stub) and asserts:
1. A single `<div class="roycss-pulse-glow">` is detected → 1 match, `effectId === "pulse-glow"`.
2. Multiple classes on one element → all are detected.
3. Non-`roycss-` classes are ignored.
4. Elements without a class attribute are skipped.

The test imports `detectRoyCssClasses` from `src/content.ts`. Because the content script also calls `chrome.runtime.*` at the top level, the test isolates the pure function via a `detectRoyCssClasses` export that does not depend on Chrome APIs.

To avoid pulling in `linkedom` (a dependency), v1.0 uses a hand-rolled DOM stub: a `querySelectorAll` function that returns a list of fake elements with `getAttribute("class")`. This keeps the test dependency-free and the test fast (< 10 ms).

### 2.17 `README.md`

Sections:
1. **What it is** — one paragraph.
2. **Install** — `bun install` → `bun run build` → `chrome://extensions` → Developer mode → Load unpacked → select `inspector/dist/`.
3. **Usage** — click toolbar icon to open side panel; hover badges to inspect; click badge to pin in side panel.
4. **Architecture** — 1-page summary referencing the ADR.
5. **Security** — 1-page summary referencing the threat model.
6. **Development** — `bun run build:data` to refresh effect data; `bun test` to run tests.
7. **Roadmap** — v1.1: Web Store listing, automated benchmarks; v2.0: DevTools panel mirror.

---

## 3. Build pipeline

```bash
# One-time:
cd /home/z/my-project/inspector
bun install           # installs @types/chrome, typescript

# Iterate:
bun run build:data    # regenerates effects-data.json
bun run build:ts      # compiles .ts → dist/*.js
bun run build:assets  # copies manifest, html, css, json, icons → dist/
# or all-in-one:
bun run build

# Test:
bun test
```

The build is **reproducible**: same input → same `dist/` byte-for-byte (modulo build timestamps in the JS, which Bun does not emit by default).

---

## 4. Release checklist (per release)

1. Bump `version` in `manifest.json` and `package.json`.
2. Re-run `bun run build:data` to pick up any new top-100 effects from upstream RoyCSS.
3. `bun run build` — verify clean.
4. `bun test` — verify all tests pass.
5. Load `dist/` in Chrome — verify popup + side panel + content script work on a test page.
6. Manually verify benchmarks per `docs/benchmarks/`.
7. Git tag `v1.x.0`.
8. Update worklog with the release entry.

---

## 5. Out of scope for v1.0

- Web Store listing (requires $5 dev fee + review cycle).
- Automated Puppeteer-based benchmark regression (see benchmarks doc §5).
- DevTools panel mirror (alternative B from ADR).
- Per-origin runtime permission grant (alternative considered in ADR §7).
- Effect search across the full 1,569-effect catalog (only top 100 embedded; the rest link to the marketing site).
- Page export to RoyCSS (the original concept card's "premium" feature — deferred to v2.0).

---

## 6. References

- ADR: `docs/adr/01-inspector-extension.md`
- Threat model: `docs/threat-models/01-inspector-extension.md`
- Benchmarks: `docs/benchmarks/01-inspector-extension.md`
- Review checklist: `docs/checklists/01-inspector-extension.md`
- RoyCSS types: `src/lib/roycss-types.ts`
- RoyCSS effects source: `src/lib/roycss-effects.ts` (34 batch files)
