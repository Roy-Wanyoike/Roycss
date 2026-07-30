# RoyCSS Inspector

> **Manifest V3 Chrome DevTools extension** that inspects any website for
> RoyCSS classes — detects `roycss-*` classes, displays a categorized list
> with effect counts, lets you click an effect to highlight matching
> elements on the page, and shows the effect's metadata + full CSS source
> from the bundled 1,569-effect dataset.

**Version:** 2.0.0 · **License:** MIT · **Author:** Royford Wanyoike Wamaitha

---

## What it is

The RoyCSS Inspector is the **browser companion** to the RoyCSS CSS-effects
library (1,569 effects across 20 categories). It runs as a Manifest V3
Chrome extension and answers two questions about any page you have open in
DevTools:

1. **Which RoyCSS classes is this page already using?**
2. **What does each class do, and what is its CSS source?**

The Inspector is **read-only** — it never modifies the page (other than
appending its own isolated Shadow-DOM highlight overlay, which is removed
on cleanup), **never makes network requests**, and **collects no
analytics**. Privacy is a feature.

### Surfaces

| Surface | Purpose | When it appears |
|---|---|---|
| **DevTools panel** | Full inspector — categorized list, search, click-to-highlight, click-to-view-details, full CSS source. | Open DevTools on any page → click the "RoyCSS" tab. |
| **Toolbar popup** | Quick stats — total RoyCSS classes on the page, top 5 effects by count, hint to open DevTools. | Click the RoyCSS toolbar icon. |
| **Highlight overlay** | Outlines every element matching the selected effect on the page. Closed Shadow DOM — page CSS / JS cannot reach it. | Click an effect row in the panel. |

---

## Install (from source)

### Prerequisites

- [Bun](https://bun.sh) ≥ 1.1.0 (only for the `build.sh` data-generator step; the extension itself runs in Chrome and has no runtime deps)
- Chrome / Edge / Brave / Arc ≥ 114 (for the DevTools panel + service worker module support)

### Steps

```bash
# 1. Clone the RoyCSS repo.
git clone https://github.com/Roy-Wanyoike/roycss.git
cd roycss

# 2. (Optional) Regenerate the bundled effects.json from the source
#    library. This pulls all 1,569 effects with their full CSS source
#    from src/lib/roycss-effects.ts. If you skip this step, the
#    pre-built effects.json (committed) is used.
bash inspector/build.sh

# 3. Load in Chrome.
#    - Open chrome://extensions
#    - Toggle "Developer mode" (top right)
#    - Click "Load unpacked"
#    - Select the inspector/ directory
#    - Pin the toolbar icon for easy access

# 4. Open any page that uses RoyCSS (e.g. http://localhost:3000/ if you
#    run the RoyCSS dev server, or https://roycss.dev when published).
#    Open DevTools (Cmd+Opt+I / F12) → click the "RoyCSS" tab.
```

---

## Usage

### Basic flow

1. **Navigate** to a page you want to inspect.
2. **Open DevTools** (Cmd+Opt+I on macOS, F12 elsewhere).
3. **Click the "RoyCSS" tab** in the DevTools toolbar (next to Elements,
   Network, Sources, etc.).
4. The Inspector scans the page for `[class*="roycss-"]` and renders a
   categorized list:
   - Effects grouped by category (Animations, Hover, Text, Backgrounds,
     Loaders, 3D & Transforms, Button Effects, Card Effects, Borders,
     Filters, Forms & Inputs, Navigation, Scroll Effects, Cursor
     Effects, Page Transitions, Glass & Modern UI, Particles,
     Microinteractions, Visual Effects, Miscellaneous).
   - Each effect row shows: name, `roycss-<id>` class, and the number
     of matching elements on the page.
   - Click a category header to collapse/expand it.
5. **Click an effect row**:
   - All matching elements on the page are highlighted with an outline
     + a label badge showing the class name.
   - The detail pane slides in from the right with: name, category,
     class, tags, description, count-on-this-page, full CSS source,
     "Copy CSS" button, "Highlight on page" button.
6. **Click "Copy CSS"** to copy the effect's CSS source to your clipboard.
7. **Click the × button** on the detail pane (or press Escape) to close
   the detail pane and clear the highlights.

### Search filter

The search input at the top filters visible effects across all categories
in real time. Matching is case-insensitive against: effect id, effect
name, category label, description, and tags. Categories with zero matches
are hidden.

### Popup (toolbar icon click)

The popup shows a quick summary without opening DevTools:
- Total RoyCSS classes on the page.
- Number of unique effects.
- Top 5 effects by count.

The popup is useful for the "is this page using RoyCSS at all?" question.
For the full inspector (categorized list, highlight, CSS source), open
DevTools → RoyCSS tab.

### Live updates

The content script attaches a `MutationObserver` to the page. When the
page's DOM mutates (e.g. an SPA route change adds new `roycss-*`
elements), the Inspector re-scans (debounced 50 ms) and updates the
categorized list in place — without losing your selection or search
filter.

---

## Architecture

See [`docs/adr/inspector/DESIGN.md`](../docs/adr/inspector/DESIGN.md)
for the full design document with ASCII architecture diagram. Summary:

- **Manifest V3** service worker + content script + DevTools panel + popup.
- **Permissions:** `activeTab`, `scripting`, `storage`. Host permission
  `<all_urls>` is justified in the
  [threat model](../docs/adr/inspector/THREAT-MODEL.md) §4.1.
- **CSP:** `default-src 'self'; script-src 'self'; object-src 'none';
  style-src 'self' 'unsafe-inline'`. No `unsafe-eval`, no remote scripts.
- **Overlay isolation:** the highlight overlay renders inside a closed
  Shadow DOM. The host page cannot reach the overlay, cannot style it,
  and cannot remove it without breaking its own layout.
- **Bundled data:** all 1,569 RoyCSS effects (id, name, category,
  description, tags, cssCode) are bundled as `effects.json` (~1.5 MB).
  Effect lookups are O(1) via a `Map` built on first panel open.

### File layout

```
inspector/
├── manifest.json              # Manifest V3
├── background.js              # Service worker (message router)
├── content-script.js          # DOM scanner + highlight overlay
├── devtools.html              # DevTools page shim
├── devtools.js                # Registers the RoyCSS panel
├── panel.html                 # DevTools panel UI
├── panel.js                   # Panel logic
├── popup.html                 # Toolbar popup UI
├── popup.js                   # Popup logic
├── effects.json               # 1,569 RoyCSS effects (full data, ~1.5 MB)
├── build.sh                   # Regenerates effects.json + zips the extension
├── README.md                  # This file
├── icons/
│   ├── icon16.png             # 16×16
│   ├── icon48.png             # 48×48
│   └── icon128.png            # 128×128
└── legacy-sidepanel/          # v1 (side-panel implementation, archived)
```

---

## Security

See [`docs/adr/inspector/THREAT-MODEL.md`](../docs/adr/inspector/THREAT-MODEL.md)
for the full STRIDE analysis. Headline mitigations:

- **No `eval`, no `new Function()`, no remote scripts.** Enforced by the
  extension CSP and by code review.
- **No `innerHTML` of untrusted strings.** All dynamic DOM is built via
  `document.createElement` + `textContent`.
- **No remote `fetch` / `XMLHttpRequest` / `WebSocket` / `sendBeacon`
  anywhere in the bundle.** The only `fetch` call is
  `fetch(chrome.runtime.getURL("effects.json"))` — a same-extension
  resource fetch.
- **No analytics, no telemetry.** The extension never phones home.
- **Read-only.** The Inspector never writes to the page DOM (other than
  its own isolated Shadow-DOM highlight overlay, which is removed on
  cleanup).
- **Content script reads only `element.getAttribute("class")`.** No
  other attribute, no `innerText`, no `outerHTML`, no `value`.

The Inspector stores exactly three keys in `chrome.storage.local`:
`lastSelectedEffectId`, `searchQuery`, `collapsedCategories`. No PII, no
page URLs, no class lists.

---

## Development

### Refresh bundled effect data

When the upstream RoyCSS library adds new effects (or modifies CSS source),
regenerate the bundled `effects.json`:

```bash
bash inspector/build.sh
```

This re-pulls from `src/lib/roycss-effects.ts`, includes `cssCode` for
every effect, validates `manifest.json`, and zips the extension into
`inspector/roycss-inspector.zip`.

If `bun` or `src/lib/roycss-effects.ts` is unavailable, `build.sh` falls
back to copying `dist/effects.json` (metadata-only — the panel will show
"CSS source not bundled" for each effect, but scanning and highlighting
still work).

### Build the zip

`build.sh` always produces `inspector/roycss-inspector.zip`. The zip
excludes `legacy-sidepanel/`, `node_modules/`, `*.zip`, and `build.sh`
itself.

### Run the RoyCSS dev server (for testing)

```bash
bun run dev   # from the repo root, starts on http://localhost:3000/
```

Then open `http://localhost:3000/` in Chrome, open DevTools, click the
RoyCSS tab — you should see ~1,200+ RoyCSS classes detected (the
marketing site's effect grid uses RoyCSS classes for each card preview).

---

## Performance

See [`docs/adr/inspector/DESIGN.md`](../docs/adr/inspector/DESIGN.md) §7.
Measured on `http://localhost:3000/` (the RoyCSS marketing site):

| Metric | Target | Measured |
|---|---|---|
| Content script injection + scan (1,200+ RoyCSS elements) | < 100 ms | ~12 ms (`querySelectorAll` only) |
| Panel cold start (build Map of 1,569 effects) | < 200 ms | ~35 ms |
| `effects.json` size on disk | < 2 MB | ~1.5 MB |
| Highlight overlay render (200 elements) | < 16 ms (1 frame) | ~6 ms |
| Memory overhead above baseline Chrome | < 10 MB | ~3 MB |

---

## Roadmap

### v2.0 (this release)

- Manifest V3, content script, DevTools panel, popup.
- All 1,569 RoyCSS effects bundled with full CSS source.
- Categorized list, search filter, click-to-highlight, detail pane.
- Read-only, no analytics.

### v2.1 (next)

- Chrome Web Store listing (signed build).
- Element picker integration (click an element in the page → show which
  RoyCSS effects it has).
- "Copy as React/Vue/Svelte" buttons in the detail pane (reuse the
  framework-tab snippets from v1's side panel).

### v3.0

- Per-origin runtime permission grant (no more scary `<all_urls>` install
  warning).
- Optional remote effects.json delta fetch (weekly, opt-in).

---

## License

MIT © Royford Wanyoike Wamaitha

The bundled effect data (`effects.json`) is sourced from the RoyCSS
library, which is also MIT-licensed.

---

## References

- [Design document](../docs/adr/inspector/DESIGN.md)
- [Architecture Decision Records](../docs/adr/inspector/ADR.md)
- [Threat model](../docs/adr/inspector/THREAT-MODEL.md)
- [Implementation plan](../docs/adr/inspector/IMPLEMENTATION-PLAN.md)
- [Review checklist](../docs/adr/inspector/REVIEW-CHECKLIST.md)
- [RoyCSS source library](../src/lib/roycss-effects.ts) — 1,569 effects across 34 batch files
