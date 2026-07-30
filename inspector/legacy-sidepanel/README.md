# RoyCSS Inspector

> **Manifest V3 Chrome extension** that inspects any website for RoyCSS classes — detects `roycss-*` classes, annotates them with floating badges, and shows full effect metadata + framework examples in a Chrome side panel.

**Version:** 1.0.0 · **License:** MIT · **Author:** Royford Wanyoike Wamaitha

---

## What it is

The RoyCSS Inspector is the **browser companion** to the RoyCSS CSS-effects library (1,569 effects across 20 categories). It runs as a Manifest V3 Chrome extension and answers two questions about any page you visit:

1. **Which RoyCSS classes is this page already using?**
2. **What does each class do, and how do I use it in my own code?**

The Inspector is **read-only** — it never modifies the page (other than appending its own isolated overlay), **never makes network requests**, and **collects no analytics**. Privacy is a feature.

### Surfaces

| Surface | Purpose | Chrome version |
|---|---|---|
| **Toolbar icon** | Click to open the side panel (Chrome 114+) or the popup (older Chrome). | 88+ |
| **Popup** | Quick status — scan count, top 10 detected effects, on/off toggle, "Rescan page" button. | All |
| **Side panel** | Deep inspector — full effect details, syntax-highlighted CSS, framework tabs (Vanilla / React / Vue / Angular / Svelte / Next.js), copy-CSS button. | 114+ |
| **Floating badges** | Small chip on every `roycss-*` element showing the effect name + category. Hover → tooltip. Click → pin in side panel. | All |

---

## Install (from source)

The Inspector ships as source. To install:

### Prerequisites

- [Bun](https://bun.sh) ≥ 1.1.0
- Chrome / Edge / Brave / Arc ≥ 114 (for the side panel; older Chrome falls back to the popup only)

### Steps

```bash
# 1. Clone the RoyCSS repo and enter the inspector directory.
git clone https://github.com/Roy-Wanyoike/roycss.git
cd roycss/inspector

# 2. Install dev dependencies.
bun install

# 3. Build the extension.
bun run build
# This runs three sub-scripts:
#   - build:data    → regenerates src/effects-data.json (top 100 RoyCSS effects)
#   - build:ts      → compiles src/*.ts → dist/src/*.js
#   - build:assets  → copies manifest, html, css, json, icons → dist/

# 4. Load in Chrome.
#    - Open chrome://extensions
#    - Toggle "Developer mode" (top right)
#    - Click "Load unpacked"
#    - Select the inspector/dist/ directory

# 5. Pin the toolbar icon for easy access.
```

After install, navigate to any page that uses RoyCSS (e.g. the RoyCSS marketing site itself), click the Inspector toolbar icon, and the side panel opens with live scan results.

---

## Usage

### Basic flow

1. **Navigate** to a page you want to inspect.
2. **Click** the RoyCSS Inspector toolbar icon. The side panel opens.
3. The content script scans the page for `[class*="roycss-"]` and attaches a small floating badge to every match (max 200 badges per page).
4. **Hover** a badge to see a tooltip with: effect name, category, description, tags, the literal class name, a "View on RoyCSS" link, and a "Pin in side panel" button.
5. **Click** a badge to pin the effect in the side panel — the panel shows the full CSS source with syntax highlighting and six framework tabs (install / import / usage for Vanilla, React, Vue, Angular, Svelte, Next.js).
6. **Copy** the CSS to your clipboard with one click.

### Toggle the Inspector off

The popup has an "Active" toggle. When off:
- The content script does not scan.
- Existing badges are removed.
- The toggle state persists in `chrome.storage.local` across sessions and tabs.

You can re-enable from the popup at any time without a page reload.

### Rescan page

The content script attaches a `MutationObserver` to the document body, so dynamically-added `roycss-*` elements are picked up automatically (debounced by 50ms). If you ever need to force a fresh scan, click "Rescan page" in the popup.

---

## Architecture

See [`docs/adr/01-inspector-extension.md`](../docs/adr/01-inspector-extension.md) for the full Architecture Decision Record. Summary:

- **Manifest V3** service worker + content script + popup + side panel.
- **Permissions:** `activeTab`, `sidePanel`, `scripting`, `storage`. Host permission `<all_urls>` is justified in the [threat model](../docs/threat-models/01-inspector-extension.md) §7.
- **CSP:** `default-src 'self'; script-src 'self'; object-src 'none'`. No `unsafe-inline`, no `unsafe-eval`, no remote scripts.
- **Overlay isolation:** badges render inside a closed Shadow DOM. The host page cannot reach the badges, cannot style them, and cannot remove the host div without breaking its own layout.
- **Embedded data:** the top 100 RoyCSS effects (id / name / category / description / tags / cssCode) are baked into the bundle as a ~50KB JSON file. Effect lookups are O(1) via a `Map`. Effects outside the top 100 fall back to a "View on RoyCSS" link.

### File layout

```
inspector/
├── manifest.json              # Manifest V3
├── package.json               # Build config (Bun)
├── tsconfig.json              # Strict TypeScript
├── src/
│   ├── background.ts          # Service worker
│   ├── content.ts             # Content script (scanner + MutationObserver)
│   ├── inspector-overlay.ts   # Shadow-DOM overlay (badges + tooltips)
│   ├── popup.html             # Popup UI
│   ├── popup.ts               # Popup logic
│   ├── popup.css              # Popup styles (OKLCH)
│   ├── sidepanel.html         # Side panel UI
│   ├── sidepanel.ts           # Side panel logic (live inspector)
│   ├── sidepanel.css          # Side panel styles
│   ├── effects-data.ts        # Re-exports effects-data.json as Map
│   ├── effects-data.json      # Top 100 RoyCSS effects (generated, <50KB)
│   └── messages.ts            # Shared message types
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── scripts/
│   ├── extract-top-effects.ts # Pulls top 100 effects from src/lib/roycss-effects.ts
│   ├── make-icons.ts          # Generates PNG icons via sharp
│   └── copy-assets.mjs        # Copies non-TS assets to dist/
└── tests/
    └── content.test.ts        # Class detection unit test
```

---

## Security

See [`docs/threat-models/01-inspector-extension.md`](../docs/threat-models/01-inspector-extension.md) for the full STRIDE analysis. Headline mitigations:

- **No `eval`, no `new Function()`, no remote scripts.** Enforced by the extension CSP and by code review.
- **No `innerHTML` of untrusted strings.** All dynamic DOM is built via `document.createElement` + `textContent`.
- **No `fetch`, no `XMLHttpRequest` anywhere in the bundle.** Zero network exfiltration surface.
- **No analytics, no telemetry.** The extension never phones home.
- **Read-only.** The Inspector never writes to the page DOM (other than its own isolated overlay).
- **Content script reads only `element.classList`.** No other attribute, no `innerText`, no `outerHTML`.

The Inspector stores exactly one key in `chrome.storage.local`: `inspectorEnabled` (boolean). No PII, no page URLs, no class lists.

---

## Development

### Refresh embedded effect data

When the upstream RoyCSS library adds new effects (or reorders existing ones), regenerate the top-100 dataset:

```bash
bun run build:data
```

This re-pulls from `/home/z/my-project/src/lib/roycss-effects.ts`, minifies the CSS, trims descriptions, and writes `src/effects-data.json`. Size budget: <50KB.

### Run tests

```bash
bun test
```

Tests live in `tests/`. The content-script test uses a hand-rolled DOM stub (no JSDOM dependency) and runs in <10ms.

### Build

```bash
bun run build       # full build
bun run build:ts    # just TypeScript
bun run build:assets  # just copy assets
bun run clean       # remove dist/
```

### Regenerate icons

```bash
bun run inspector/scripts/make-icons.ts
```

This uses `sharp` to rasterize the SVG icon definition into 16×16, 48×48, and 128×128 PNGs. Requires `sharp` to be installed in the parent project (`bun add sharp`).

---

## Performance budgets

See [`docs/benchmarks/01-inspector-extension.md`](../docs/benchmarks/01-inspector-extension.md). Targets:

| Metric | Target |
|---|---|
| Memory overhead | < 5 MB |
| Content script injection on 10,000-element page | < 50 ms |
| Popup cold start | < 200 ms |
| Class detection on complex SPA | < 100 ms |
| Embedded effect data size | < 50 KB |

---

## Roadmap

### v1.0 (this release)

- Manifest V3, content script, popup, side panel.
- Top 100 RoyCSS effects embedded.
- Six framework tabs.
- Read-only, no analytics.

### v1.1 (next)

- Chrome Web Store listing (signed build).
- Automated Puppeteer-based benchmark regression in CI.
- Per-origin runtime permission grant (no more scary `<all_urls>` install warning).
- Search across the full 1,569-effect catalog (with a larger embedded dataset or a fetch to the RoyCSS site).

### v2.0

- DevTools panel mirror (alternative B from the ADR).
- Page-export-to-RoyCSS (the original "premium" concept).
- LSP-style hover provider inside the side panel (reuse the VS Code extension's language server).

---

## License

MIT © Royford Wanyoike Wamaitha

The embedded effect data (`src/effects-data.json`) is sourced from the RoyCSS library, which is also MIT-licensed.

---

## References

- [ADR](../docs/adr/01-inspector-extension.md)
- [Threat model](../docs/threat-models/01-inspector-extension.md)
- [Benchmarks](../docs/benchmarks/01-inspector-extension.md)
- [Implementation plan](../docs/plans/01-inspector-extension.md)
- [Review checklist](../docs/checklists/01-inspector-extension.md)
- [RoyCSS main site](https://roycss.dev) (placeholder URL)
- [RoyCSS source](../src/lib/roycss-effects.ts) — 1,569 effects across 34 batch files
