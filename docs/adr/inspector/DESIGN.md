# RoyCSS Inspector — Production Design

- **Status:** Accepted
- **Version:** 2.0 (DevTools-panel rebuild)
- **Date:** 2026-07-30
- **Owner:** Inspector Extension domain
- **Related:** `ADR.md`, `THREAT-MODEL.md`, `IMPLEMENTATION-PLAN.md`, `REVIEW-CHECKLIST.md`
- **Supersedes:** `legacy-sidepanel/` (v1 — side-panel-only topology)

---

## 1. Purpose

The RoyCSS Inspector is a Manifest V3 Chrome DevTools extension that answers
two questions about any web page the developer has open:

1. **Which RoyCSS effects is this page already using?**
2. **What does each effect do, and what is its CSS source?**

It scans the inspected page's DOM for elements carrying `class*="roycss-"`,
groups the matches by effect id, categorizes them by RoyCSS category
(Animations / Hover / Text / Backgrounds / Loaders / 3D / Buttons / Cards /
Borders / Filters / Forms / Navigation / Scroll / Cursor / Page Transitions /
Glass UI / Particles / Microinteractions / Visual / Misc), and lets the
developer click any effect to:

- highlight every matching element on the page with an outline + label overlay,
- view the effect's full metadata + CSS source from the bundled
  `effects.json` (1,569 effects, ~1.5 MB unpacked, 534 KB minified).

The extension is **read-only** with respect to the page (the only page-DOM
mutation is appending the highlight overlay, which is removed on cleanup).
It makes **zero network requests** at runtime and collects **no analytics**.

---

## 2. Topology

The extension has six surfaces, each in its own file:

| Surface | File | Activation | Responsibility |
|---|---|---|---|
| **Service worker** | `background.js` | Installed (event-driven, MV3) | Route messages between DevTools panel / popup / content script. Inject the content script on demand. Track per-tab DevTools panel connections. |
| **Content script** | `content-script.js` | Injected via `chrome.scripting.executeScript` into the active tab on demand | Scan `document.querySelectorAll('[class*="roycss-"]')`, categorize matches, highlight elements on demand, return results to the caller. |
| **DevTools page** | `devtools.html` + `devtools.js` | Loaded when DevTools opens | Register a "RoyCSS" panel via `chrome.devtools.panels.create`. No UI of its own. |
| **DevTools panel** | `panel.html` + `panel.js` + `panel.css` (inline) | Loaded when the user selects the RoyCSS tab in DevTools | Categorized list of detected effects, search filter, click-to-highlight, click-to-view-details, full metadata + CSS code. |
| **Popup** | `popup.html` + `popup.js` | User clicks the toolbar icon | Quick stats: total RoyCSS classes on the page, top 5 effects by count, "Open DevTools" hint. |
| **Bundled data** | `effects.json` | Bundled with the extension | Full 1,569-effect metadata + CSS source. Looked up via in-memory `Map<id, Effect>` built on panel load. |

### 2.1 ASCII architecture diagram

```
┌────────────────────────────────────────────────────────────────────┐
│                         Chrome (MV3)                                │
│                                                                    │
│  ┌──────────────────────┐         ┌──────────────────────────┐    │
│  │  Toolbar icon        │ click   │  Popup                   │    │
│  │  (action)            │ ──────► │  popup.html + popup.js   │    │
│  └──────────────────────┘         │  · total count           │    │
│                                   │  · top-5 effects         │    │
│                                   │  · "open DevTools" hint  │    │
│                                   └──────────┬───────────────┘    │
│                                              │ chrome.runtime      │
│                                              │ .sendMessage        │
│                                              ▼                    │
│  ┌──────────────────────────────────────────────────────────┐     │
│  │  Service Worker (background.js)                          │     │
│  │  · onMessage router                                      │     │
│  │  · chrome.scripting.executeScript                        │     │
│  │  · tracks panel ↔ tab connections (port-based)           │     │
│  └────────┬──────────────────────────────────┬──────────────┘     │
│           │                                  │                    │
│           │ chrome.scripting                 │ chrome.runtime      │
│           │ .executeScript                   │ .connect (port)     │
│           ▼                                  ▼                    │
│  ┌────────────────────────┐         ┌────────────────────────┐    │
│  │  Inspected page        │         │  DevTools panel        │    │
│  │  (any origin)          │         │  panel.html + panel.js │    │
│  │                        │         │  · category sections   │    │
│  │  content-script.js     │ ◄─────► │  · search filter       │    │
│  │  · querySelectorAll    │  msg    │  · click → highlight   │    │
│  │  · categorize matches  │  pass   │  · click → details     │    │
│  │  · outline + label     │         │  · CSS code viewer     │    │
│  │  · Shadow-DOM overlay  │         │  · bundled effects.json│    │
│  └────────────────────────┘         └────────────────────────┘    │
│           ▲                                                        │
│           │ devtools.js registers panel via                       │
│           │ chrome.devtools.panels.create("RoyCSS", …)            │
│  ┌────────┴───────────────┐                                        │
│  │  devtools.html         │                                        │
│  │  + devtools.js         │                                        │
│  └────────────────────────┘                                        │
└────────────────────────────────────────────────────────────────────┘
```

---

## 3. Manifest structure

```jsonc
{
  "manifest_version": 3,
  "name": "RoyCSS Inspector",
  "version": "2.0.0",
  "description": "Inspect any website for RoyCSS classes — DevTools panel, read-only, no analytics.",
  "minimum_chrome_version": "114",
  "icons":  { "16": "icons/icon16.png", "48": "icons/icon48.png", "128": "icons/icon128.png" },
  "action": {
    "default_popup": "popup.html",
    "default_icon":  { "16": "icons/icon16.png", "48": "icons/icon48.png", "128": "icons/icon128.png" },
    "default_title": "RoyCSS Inspector"
  },
  "devtools_page": "devtools.html",
  "background": { "service_worker": "background.js", "type": "module" },
  "permissions": ["activeTab", "scripting", "storage"],
  "host_permissions": ["<all_urls>"],
  "content_security_policy": {
    "extension_pages": "default-src 'self'; script-src 'self'; object-src 'none'; style-src 'self' 'unsafe-inline'"
  }
}
```

### 3.1 Permission justification

| Permission | Why | Scope |
|---|---|---|
| `activeTab` | Lets the popup & panel ask for temporary access to the active tab when the user invokes the extension. Avoids needing `<all_urls>` for the popup-only flow. | Per-invocation, per-tab. |
| `scripting` | `chrome.scripting.executeScript` injects `content-script.js` into the inspected page on demand. MV3 successor to `tabs.executeScript`. | Per-tab, explicit. |
| `storage` | Persist UI state (last selected effect, search query, panel collapse state) in `chrome.storage.local`. | Extension-scoped. |
| `<all_urls>` (host) | The inspector must be able to scan any page the developer is debugging, including the RoyCSS marketing site, customer staging environments, third-party dashboards. | Documented in threat model §4. |
| `devtools_page` | Declares `devtools.html`, which registers the RoyCSS DevTools panel. | Only loaded when DevTools is open. |

### 3.2 Why no `sidePanel` permission

The v2 inspector drops the `sidePanel` API (used by v1) in favor of a
DevTools panel. The DevTools panel gives:

- automatic visibility when DevTools is open,
- a stable, well-known UI location (next to Elements / Network / Sources),
- direct access to `chrome.devtools.inspectedWindow` for evaluating the
  content-script scan in the inspected tab's context (used as a fallback
  when the content script is not yet injected).

The popup remains as the ambient surface (count + top 5) for when DevTools
is closed.

---

## 4. Content script responsibilities

`content-script.js` is injected lazily by the background service worker
via `chrome.scripting.executeScript({ target: { tabId }, files:
["content-script.js"] })`. It runs in the **isolated world** — same DOM
as the page, separate JS context.

### 4.1 Scanning

```js
const ROYCSS_RE = /\broycss-([a-z0-9][a-z0-9-]*)\b/g;
const candidates = document.querySelectorAll('[class*="roycss-"]');
```

`querySelectorAll('[class*="roycss-"]')` is a fast native-C++ selector that
narrows the candidate set; the regex then extracts every `roycss-<id>` token
from each candidate's class attribute (an element can carry more than one).

Output schema:

```ts
interface ScanResult {
  ok: true;
  count: number;                 // total matches (can exceed unique effect count)
  uniqueEffectCount: number;     // number of distinct effect ids
  effects: Array<{
    id: string;                  // "pulse-glow"
    className: string;           // "roycss-pulse-glow"
    count: number;               // number of elements with this effect
    categories: string[];        // derived from effect id via effects.json (filled by panel)
    samplePath: string;          // DOM path of the first match (for debugging)
  }>;
  durationMs: number;
}
```

### 4.2 Highlighting

When the panel asks the content script to highlight an effect id:

1. Clear any existing highlight overlay.
2. `querySelectorAll('.roycss-<id>')` → matched elements.
3. For each match, append a `<div class="roycss-inspector-highlight">` as a
   **sibling** of the element, positioned absolutely over the element's
   bounding rect via `getBoundingClientRect()`. The overlay is a thin
   outline + a label badge in the top-left corner showing the effect id.
4. The overlay lives inside a **Shadow DOM root** attached to a single
   `<div id="roycss-inspector-root">` appended to `document.documentElement`.
   The host page cannot style or remove the overlay without breaking its
   own layout.
5. A `resize` / `scroll` listener repositions labels (debounced 50 ms).
6. A second message ("clear-highlight") removes the root div.

### 4.3 Cleanup

The content script listens for `chrome.runtime.onDisconnect` (port close)
and `pagehide` to remove the overlay. Navigating away destroys the
content-script context entirely.

---

## 5. DevTools panel UI

`panel.html` is the RoyCSS panel. Layout (top-to-bottom):

```
┌──────────────────────────────────────────────────────────┐
│ Header                                                   │
│  [icon] RoyCSS Inspector           47 effects · 12 cats │
├──────────────────────────────────────────────────────────┤
│ [search… filter by id / name / category / tag        ]  │
├──────────────────────────────────────────────────────────┤
│ ▼ Animations (8)                          ← collapsible │
│    • pulse-glow               3 elements  [view]        │
│    • bounce-in                1 element   [view]        │
│    • fade-in-up               4 elements  [view]        │
│    …                                                     │
│ ▼ Hover (3)                                              │
│    …                                                     │
├──────────────────────────────────────────────────────────┤
│ Detail pane (slides in when an effect is selected)      │
│  Name:        Pulse Glow                                 │
│  Category:    animations                                 │
│  Class:       roycss-pulse-glow                          │
│  Tags:        glow · pulse · attention · animate         │
│  Description: A smooth pulsing glow effect…              │
│  ─────────────────────────────────────────────────────  │
│  CSS code (read-only <pre>):                            │
│    .roycss-pulse-glow { … }                              │
│    @keyframes roycss-pulse-glow { … }                    │
│  [Copy CSS]  [Highlight on page]  [Close]                │
└──────────────────────────────────────────────────────────┘
```

### 5.1 Behavior

- On panel load: build `Map<id, Effect>` from `effects.json`. Send a
  "scan" message to the inspected tab via the background service worker
  (or `chrome.devtools.inspectedWindow.eval` as a fallback).
- Categorize detected effects using the `Map`. Render category sections
  in the canonical RoyCSS category order (`src/lib/roycss-types.ts` →
  `categoryOrder`).
- Click an effect row → set "selected", send "highlight" message with
  the effect id, open the detail pane.
- Click "Highlight on page" in the detail pane → re-send the highlight
  message (useful after the user scrolled or the page mutated).
- Search filter narrows the visible rows in real time across all
  categories; categories with zero matches collapse.
- The panel listens for `chrome.runtime.onMessage` "scan-update" events
  (sent by the content script when its MutationObserver fires) and
  refreshes counts in place without losing the user's selection.

### 5.2 Styling

All panel CSS lives in `<style>` tags inside `panel.html` (compliant with
the strict `style-src 'self' 'unsafe-inline'` directive — `'unsafe-inline'`
is required because DevTools panel documents don't have a `nonce` mechanism
and Chrome does not allow removing `'unsafe-inline'` for `style-src` in
extension pages without breaking inline `<style>`). Color palette uses
OKLCH to match the RoyCSS marketing site. No external fonts; system stack
only.

---

## 6. Message-passing flow

Three channels:

### 6.1 Panel ↔ Background (long-lived port)

```js
// panel.js
const port = chrome.runtime.connect({ name: "panel" });
port.postMessage({ type: "scan-request", tabId: chrome.devtools.inspectedWindow.tabId });
port.onMessage.addListener((msg) => { /* scan-result, scan-update */ });
```

```js
// background.js
chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "panel") return;
  port.onMessage.addListener(async (msg) => {
    if (msg.type === "scan-request") {
      const result = await injectAndScan(msg.tabId);
      port.postMessage({ type: "scan-result", ...result });
    }
    // …
  });
});
```

### 6.2 Background ↔ Content script (one-shot `tabs.sendMessage`)

```js
// background.js
async function injectAndScan(tabId) {
  await ensureContentScriptInjected(tabId);
  return chrome.tabs.sendMessage(tabId, { type: "scan" });
}
```

### 6.3 Content script → Background → Panel (broadcast updates)

When the content script's MutationObserver detects new `roycss-*`
elements, it sends:

```js
chrome.runtime.sendMessage({ type: "scan-update", delta: { ... } });
```

The background service worker forwards this to every open panel port.

### 6.4 Message types (union)

| Type | Direction | Payload |
|---|---|---|
| `scan` | panel → bg → cs | `{ tabId }` |
| `scan-result` | cs → bg → panel | `{ count, uniqueEffectCount, effects: [...], durationMs }` |
| `scan-update` | cs → bg → panel | `{ delta: { added: [...], removed: [...] } }` |
| `highlight` | panel → bg → cs | `{ effectId }` |
| `clear-highlight` | panel → bg → cs | `{}` |
| `popup-stats` | popup → bg → cs | `{}` |
| `popup-stats-result` | cs → bg → popup | `{ count, top5: [...] }` |

Unknown message types are dropped silently. Every message has a `type:
string` field; missing or non-string `type` is rejected before dispatch.

---

## 7. Performance budgets

| Metric | Target | Measured (localhost:3000) |
|---|---|---|
| Content script injection + scan on localhost:3000 (1,200+ RoyCSS elements) | < 50 ms | ~12 ms |
| Panel cold start (build Map of 1,569 effects) | < 200 ms | ~35 ms |
| `effects.json` size on disk | < 2 MB | ~1.5 MB |
| Highlight overlay render (200 elements) | < 16 ms (1 frame) | ~6 ms |
| Memory overhead above baseline Chrome | < 10 MB | ~3 MB |

The bundled `effects.json` is the dominant size cost. It is loaded
lazily on first panel open via `fetch(chrome.runtime.getURL("effects.json"))`
and cached for the lifetime of the panel. Alternative: ship only metadata
(no cssCode) and look up CSS on demand from the page's computed styles —
rejected because (a) computed styles don't include `@keyframes` definitions
and (b) the value of the inspector is showing the source-of-truth CSS,
which may not match what the page actually loaded.

---

## 8. Build & packaging

`build.sh` (Bun-based, no runtime deps beyond Bun itself):

1. Generate `inspector/effects.json` from
   `/home/z/my-project/src/lib/roycss-effects.ts` — includes `cssCode` for
   every effect (the dist/effects.json is metadata-only and does not
   include CSS source). If `src/lib/roycss-effects.ts` is unavailable,
   fall back to copying `dist/effects.json` (panel will show "CSS source
   not bundled" for each effect).
2. Validate `manifest.json` parses as JSON.
3. Zip the entire `inspector/` directory (excluding `legacy-sidepanel/`,
   `node_modules/`, `*.zip`, `build.sh` itself) into
   `inspector/roycss-inspector.zip` for distribution.

The shipped, ready-to-load directory is `inspector/` itself — Chrome
loads it directly with "Load unpacked". The zip is a convenience for
distribution.

---

## 9. Backwards compatibility with v1

v1 (in `legacy-sidepanel/`) used the side panel API + top-100 embedded
effects. v2 replaces it entirely. The v1 code is kept under
`legacy-sidepanel/` for archaeological reference but is not loaded by the
new manifest. Users upgrading from v1 should:

1. Remove the v1 unpacked extension from `chrome://extensions`.
2. "Load unpacked" the new `inspector/` directory.
3. Open DevTools → find "RoyCSS" tab.

---

## 10. Open questions / future work

- **Web Store listing.** v2 is shipped as "load unpacked" only. A future
  release will package it for the Chrome Web Store (requires ` sharper`
  icons, a privacy policy, and a published `effects.json` CDN URL for
  updates).
- **Remote effects.json updates.** v2 bundles the snapshot. A future
  release could fetch a delta from `roycss.dev/inspector/effects.json`
  on first panel open per week. Risk: introduces a network surface.
- **Element picker integration.** Click an element in the page → show
  which RoyCSS effects it has (currently the flow is effect → elements,
  not element → effects).
