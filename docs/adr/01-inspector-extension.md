# ADR 01 — Browser Inspector Extension

- **Status:** Accepted
- **Date:** 2025-11-15
- **Owner:** Principal Engineer — Browser Inspector domain
- **Related:** `docs/threat-models/01-inspector-extension.md`, `docs/plans/01-inspector-extension.md`, `docs/benchmarks/01-inspector-extension.md`
- **Supersedes:** Concept card in `src/components/roycss/platform-ecosystem.tsx` that advertised the Inspector as a future product

---

## Context

RoyCSS ships **1,569 production-ready CSS effects** across 20 categories, distributed as a single CSS file plus per-effect metadata. The library is consumed in five distinct ways today:

1. Direct CSS import (`dist/roycss.min.css`) on vanilla and framework sites.
2. `RoyCSS CLI` (8 commands) for scaffolding and migration.
3. `RoyCSS MCP Server` (7 tools) for AI-assisted authoring in Claude / Cursor / Windsurf.
4. RoyCSS VS Code extension (LSP + snippets + hover providers).
5. The marketing site itself (`/`), which renders live previews.

A growing share of RoyCSS adoption happens **on sites the developer does not own** — third-party dashboards, customer staging environments, legacy apps, competitor teardowns. In all of those cases the developer cannot easily answer: *"which RoyCSS effects is this page already using, and which ones should it be using?"* without manually hunting through DevTools.

The Inspector Chrome extension closes that loop. It is a **read-only browser companion** that:

- Detects any element on the current page whose `class` attribute contains a `roycss-*` token.
- Annotates each match with a floating badge (effect name + category).
- Shows full effect metadata (description, CSS source, framework examples) in a Chrome side panel on hover / click.
- Surfaces the top 100 RoyCSS effects as a searchable, embedded dataset so the panel works offline.

The Inspector is the **sixth distribution surface** for RoyCSS and the only one that operates inside the user's browser rather than their editor or terminal.

---

## Decision

### Manifest V3, content scripts + popup + side panel

We will ship a **Manifest V3** Chrome extension with the following topology:

| Surface | File | Activation | Responsibility |
|---|---|---|---|
| Service worker | `src/background.ts` | Installed (persistent on event) | Handle `action.onClicked`, open the side panel, route messages between content script and panels. |
| Content script | `src/content.ts` | `chrome.scripting.executeScript` on `activeTab` (lazy) | Scan the live DOM for `[class*="roycss-"]`, attach floating badges, observe mutations, post counts to the popup / side panel. |
| Action popup | `src/popup.html` + `src/popup.ts` + `src/popup.css` | User clicks the toolbar icon | Show scan count, top 10 detected effects, on/off toggle (persisted to `chrome.storage.local`), "Rescan page" button. |
| Side panel | `src/sidepanel.html` + `src/sidepanel.ts` | `chrome.sidePanel.open()` (Chrome 114+) | Live inspector — full effect details, syntax-highlighted CSS, framework tabs (Vanilla / React / Vue / Angular / Svelte / Next.js), copy-CSS button. |
| Embedded data | `src/effects-data.ts` (re-exports `effects-data.json`) | Bundled at build time | Top 100 RoyCSS effects (id, name, category, description, tags, cssCode). Target <50KB total. |
| Overlay | `src/inspector-overlay.ts` | Imported by the content script | Renders floating badges + tooltip on hover. Pure DOM, Shadow DOM isolated. |

### Permissions (Manifest V3)

```jsonc
{
  "permissions": ["activeTab", "sidePanel", "scripting", "storage"],
  "host_permissions": ["<all_urls>"]
}
```

`<all_urls>` is justified in the threat model — the Inspector must be able to scan any page the user navigates to, not a curated allowlist. The `activeTab` permission scopes execution to the tab the user explicitly invoked the extension on, which limits passive scanning. `scripting` (over `tabs.executeScript` from MV2) is the MV3-native way to inject the content script on demand. `storage` persists the on/off toggle.

### Security posture

- **Strict extension CSP:** `default-src 'self'; script-src 'self'; object-src 'none'`. No `unsafe-inline`, no `unsafe-eval`, no remote scripts.
- **No remote code.** All JavaScript ships from the extension bundle. There is no fetch-to-eval pipeline.
- **No analytics, no telemetry.** The extension never phones home.
- **Content script isolation.** The overlay and badges render inside a Shadow DOM root attached to a `<div>` the content script owns. Page CSS / page JS cannot reach into the overlay.
- **Read-only.** The Inspector never writes to the page's DOM (other than appending its own isolated overlay). It never mutates `document.cookie`, `localStorage`, `sessionStorage`, or fetches on behalf of the page.

### Build

- Source in TypeScript (`src/*.ts`).
- Compiled to plain ES modules with `bun build` — no bundler runtime, no source maps in the shipped `.js`.
- The `dist/` directory is what Chrome loads. The repository ships the source; users run `bun run build` to produce `dist/`.
- Icons are 16/48/128 PNGs committed to `inspector/icons/`.

### Side panel vs. popup — when each fires

- **Popup** = quick status. Opens on `action.onClicked` when the side panel is closed or unsupported (Chrome <114). Shows counts + top-10 list + toggle.
- **Side panel** = deep inspector. Opens on badge click or on the popup's "Open inspector" button. Stays open while the user scrolls the page and hovers elements.
- The service worker decides which to open based on `chrome.sidePanel` availability — graceful fallback for older Chrome.

---

## Alternatives considered

### A. Bookmarklet

A bookmarklet that injects a script via `javascript:` URL.

**Pros:** Zero install, zero permissions, works in every browser.
**Cons:**
- Cannot persist UI across navigations — re-runs on every page load.
- Cannot use `chrome.storage` — toggle state must live in `localStorage` on each origin (CORS / SOP issues on `file://` and sandboxed iframes).
- No side panel; UI is a floating `position:fixed` div that fights with the host page's CSS.
- Same-origin restrictions prevent it from running on pages with strict CSP (e.g. GitHub, banking sites) — exactly the pages where Inspector would be most useful.
- Cannot ship icons, contextual menu items, or keyboard shortcuts.

**Verdict:** Rejected. CSP-conflict on high-value pages and lack of persistence are deal-breakers for a "ship" product.

### B. DevTools panel (chrome.devtools.panels)

A panel that appears inside Chrome DevTools next to Elements / Network / etc.

**Pros:**
- Opens automatically when DevTools opens.
- Has direct access to `chrome.devtools.inspectedWindow` — can eval in the page context, query the selected element, and integrate with the Elements panel.
- Familiar mental model for engineers ("RoyCSS is a devtools tab").

**Cons:**
- **Only works when DevTools is open.** The Inspector is most useful as an ambient tool — you scan a page you're reading, not a page you're debugging. Forcing DevTools open breaks the "lean-back browsing" use case.
- DevTools panels cannot use the side panel API, so the panel and the page can't be visible simultaneously on narrow viewports.
- Significantly heavier to build — the panel needs its own React-ish render loop and is slower to cold-start (200–600ms typical).
- Power users already have the Elements panel; the Inspector's value-add is the *ambient* badge + hover affordance, which DevTools panels cannot provide.

**Verdict:** Rejected as the primary surface. May revisit as a v2 enhancement (DevTools panel that mirrors the side panel state) if power users ask for it.

### C. Sidebar panel (Firefox-style) / Edge sidebar

Edge and Firefox ship a sidebar API; Chrome added `chrome.sidePanel` in 114.

**Pros:**
- Persistent across navigations.
- Visible alongside page content.
- Native Chrome UI affordances (close, dock, resize).

**Cons:**
- Chrome 114+ only — older Chrome and all Chromium forks (Brave, Vivaldi, Arc) need feature detection and fallback.

**Verdict:** Accepted — `chrome.sidePanel` is the primary deep-inspector surface, with the popup as a fallback when the side panel API is unavailable. This is exactly what the spec mandates.

### D. Manifest V2

**Rejected.** Chrome began disabling MV2 extensions in June 2024 and removed MV2 from the Web Store in 2025. Shipping MV2 today means shipping a product that cannot be installed by users on current Chrome. MV3 is the only forward-compatible choice.

### E. Native messaging host

A native binary the extension talks to over `chrome.runtime.connectNative`.

**Pros:** Could ship the full 1,569-effect library (1.17MB of CSS) without bundling.
**Cons:**
- Requires per-user native binary install — kills the "load unpacked" zero-friction path.
- Adds a second attack surface (the native host) for zero user-visible benefit.
- The Inspector only needs the top 100 effects for offline use; the other 1,469 are lookups against the marketing site.

**Verdict:** Rejected. Embedding 50KB of effect data in the bundle is simpler, safer, and faster.

---

## Consequences

### Positive

- **One install path.** `chrome://extensions` → "Load unpacked" → select `inspector/dist/`. No Web Store review cycle for v1.
- **Zero runtime dependencies.** The compiled bundle has no `node_modules`, no framework, no React. Cold-start is dominated only by Chrome's service-worker spin-up.
- **Read-only by design.** No mutation of the page means no risk of breaking the page the user is inspecting.
- **No analytics surface.** Privacy is a feature; the extension cannot leak browsing data because it never collects any.
- **Cross-browser future.** The MV3 service-worker model is also what Firefox and Edge support; the same code path will port with minimal changes.

### Negative

- **`<all_urls>` permission is broad.** Users see a scary install warning ("Read and change all your data on all websites"). Mitigated by the threat model — the extension never changes anything and never reads anything other than `class` attributes on visible elements. The install warning is the cost of doing business for any inspector-class extension.
- **Chrome 114+ required for the side panel.** Users on Chrome 113 or earlier get the popup-only experience. Documented in the README; the popup is fully functional for the basic scan + count + toggle flow.
- **Service worker lifecycle.** MV3 service workers can be evicted after 30s of inactivity. The Inspector re-establishes state on the next event. There is no long-lived background process — by design.
- **Effect data is a snapshot.** The top 100 embedded effects are baked in at build time. New RoyCSS releases require rebuilding and re-publishing the extension. Mitigated by a `bun run build:data` script that re-pulls from `src/lib/roycss-effects.ts`.

### Performance impact

- Content script injection: **target <50ms on a 10,000-element page** (measured in `docs/benchmarks/`).
- Popup cold start: **target <200ms**.
- Memory footprint: **target <5MB** above baseline Chrome.
- Class detection on a complex SPA: **target <100ms** for the initial scan.

### Security surface

Documented in `docs/threat-models/01-inspector-extension.md`. The headline mitigations:

1. **No `eval`, no `Function()` constructor, no remote scripts.**
2. **Strict CSP** — `default-src 'self'; script-src 'self'`.
3. **Shadow DOM isolation** for the overlay — page CSS cannot leak in, page JS cannot reach the badges.
4. **No `innerHTML` of untrusted strings.** All dynamic DOM is built via `document.createElement` + `textContent`.
5. **No network requests at runtime.** Zero exfiltration surface.

---

## Status

**Accepted.** This ADR is the binding architectural decision for the Inspector extension. Changes require a new ADR (e.g. `02-inspector-extension-devtools-panel.md`) that supersedes this one.

The Inspector is **v1.0 ready — Manifest V3, install from source** as advertised on the platform ecosystem card.
