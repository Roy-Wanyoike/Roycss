# RoyCSS Inspector — Architecture Decision Records

- **Status:** Accepted
- **Date:** 2026-07-30
- **Owner:** Inspector Extension domain
- **Scope:** v2 (DevTools-panel rebuild). Supersedes `legacy-sidepanel/` v1.

---

## ADR-1 — Manifest V3 vs Manifest V2

**Status:** Accepted
**Date:** 2026-07-30

### Context

Chrome began disabling MV2 extensions in June 2024 and removed MV2 from the
Web Store in 2025. MV3 is the only forward-compatible manifest version. The
v1 inspector was already MV3; v2 stays MV3.

### Decision

Ship MV3. Use a service worker (`background.js`, `"type": "module"`) for the
background. No persistent background page. No `tabs.executeScript` (use
`chrome.scripting.executeScript` instead).

### Alternatives considered

- **MV2 with a persistent background page.** Rejected — Chrome removes MV2
  extensions from the Web Store in 2025; the inspector must be installable
  by users on current Chrome.
- **MV3 with a non-module service worker.** Rejected — `"type": "module"`
  lets us use ES module `import` / `export`, which keeps the code clean and
  avoids the global-pollution problems of classic service workers. The
  trade-off (Chrome 92+ for module service workers) is acceptable given the
  `minimum_chrome_version: "114"` floor we already need for DevTools panel
  features.

### Consequences

- The service worker can be evicted after 30 s of inactivity. All state
  must be re-derivable from `chrome.storage.local` or from the inspected
  page. The panel re-opens by re-issuing a `scan-request`.
- `chrome.scripting.executeScript` requires the `scripting` permission and
  host permission for the target URL. Both are declared in the manifest.

---

## ADR-2 — Content script vs DevTools `inspectedWindow.eval`

**Status:** Accepted
**Date:** 2026-07-30

### Context

The inspector needs to scan the inspected page's DOM. There are two MV3
APIs:

1. `chrome.scripting.executeScript({ target: { tabId }, files:
   ["content-script.js"] })` — injects a long-lived content script that
   can keep state (MutationObserver, overlay) across messages.
2. `chrome.devtools.inspectedWindow.eval(expr)` — evaluates a string in
   the inspected page's context. Ephemeral; no persistent state. Only
   available from a DevTools page / panel.

### Decision

Use **both**, with the content script as the primary mechanism and
`inspectedWindow.eval` as a one-shot fallback when the content script is
not yet injected (e.g. the user opened DevTools before clicking the
toolbar icon, so the content script was never injected).

The content script is the source of truth for:
- DOM scanning,
- highlight overlay lifecycle,
- MutationObserver-driven updates.

`inspectedWindow.eval` is used only for:
- the initial "is the page scannable?" check before injecting the content
  script (cheap — `document.querySelectorAll('[class*="roycss-"]').length`),
- the popup's quick-stats query (when the popup is opened and no content
  script is present yet).

### Alternatives considered

- **`inspectedWindow.eval` only.** Rejected — eval'd strings cannot keep
  state across calls, so we'd have to re-inject the MutationObserver and
  overlay on every interaction. Worse, the highlight overlay would be
  removed when the eval'd function returns (its closures die).
- **Content script declared in `manifest.json` `content_scripts`.**
  Rejected — that would inject the script on every page navigation on
  every site, which (a) burns CPU on pages that don't use RoyCSS, (b)
  requires `host_permissions: <all_urls>` *and* a `content_scripts`
  declaration, which produces an even scarier install warning, and (c)
  breaks the "activeTab" mental model where the user explicitly opts in
  per tab.

### Consequences

- The user must open DevTools or click the toolbar icon to trigger
  scanning. There is no ambient "scan every page" mode. This is a feature,
  not a bug — privacy-preserving by default.
- The content script must be re-injected after navigation (Chrome
  discards content scripts on navigation). The background service worker
  tracks this via a `Set<tabId>` of injected tabs and re-injects when a
  `scan-request` comes in for an unknown tab.

---

## ADR-3 — Bundled `effects.json` vs remote fetch

**Status:** Accepted
**Date:** 2026-07-30

### Context

The panel needs effect metadata (name, category, description, tags) and
CSS source for all 1,569 RoyCSS effects. Two options:

1. **Bundle** a full `effects.json` in the extension. ~1.5 MB unpacked,
   ~534 KB if metadata-only (no cssCode).
2. **Fetch** from a CDN (e.g. `https://roycss.dev/dist/effects.json`) on
   first panel open. Requires `host_permissions` for the CDN; requires
   network at runtime.

### Decision

**Bundle.** Generate `inspector/effects.json` from
`src/lib/roycss-effects.ts` at build time. Include `cssCode` for every
effect (the public `dist/effects.json` does not include `cssCode`, so we
generate our own).

Rationale:
- The inspector's value proposition is "works offline, on staging
  environments behind VPNs, on customer sites with no internet egress".
  A remote fetch breaks all three.
- A remote fetch introduces a network surface that the threat model
  explicitly forbids (no runtime `fetch` / `XMLHttpRequest`).
- 1.5 MB is acceptable: it loads once on first panel open and is cached
  for the lifetime of the extension. The Map build is ~35 ms.
- The `dist/effects.json` (534 KB, metadata-only) does not include
  `cssCode`, so it would force the panel to show "CSS source not
  available" for every effect — defeating half the purpose of the
  inspector.

### Alternatives considered

- **Bundle metadata-only + extract CSS from the page's computed styles.**
  Rejected — computed styles don't include `@keyframes` definitions or
  the original selector text; the inspector would show
  `animation: roycss-pulse-glow 2s ease infinite` but not the keyframes
  that define it.
- **Bundle top-100 (like v1) + remote-fetch the rest.** Rejected —
  introduces a network surface and a "this effect is not available
  offline" UX cliff.
- **Native messaging host with the full library.** Rejected (per v1 ADR
  §E) — requires per-user native binary install, kills the
  "load-unpacked" zero-friction path.

### Consequences

- `inspector/effects.json` is the largest file in the extension. The
  `build.sh` script regenerates it from `src/lib/roycss-effects.ts` so
  it stays in sync with the library.
- New RoyCSS releases require rebuilding and re-zipping the extension.
- The panel loads `effects.json` via
  `fetch(chrome.runtime.getURL("effects.json"))` — this is a
  same-extension resource fetch, not a network fetch, so it does not
  violate the "no network requests at runtime" rule.

---

## ADR-4 — DevTools panel vs popup vs side panel

**Status:** Accepted
**Date:** 2026-07-30

### Context

The inspector needs a primary UI surface. Three candidates:

1. **DevTools panel** (`chrome.devtools.panels.create`). Visible inside
   DevTools. Direct access to `chrome.devtools.inspectedWindow`.
2. **Popup** (`chrome.action.default_popup`). Visible on toolbar icon
   click. Small (≤ 800×600). Closes when the user clicks away.
3. **Side panel** (`chrome.sidePanel`, Chrome 114+). Persistent, docked
   to the right of the viewport. The v1 inspector's primary surface.

### Decision

**DevTools panel is the primary surface.** The popup is a secondary
"quick stats" surface. The side panel is dropped (its v1 implementation
is preserved under `legacy-sidepanel/` but is not loaded by the v2
manifest).

### Rationale

- The v1 inspector used the side panel as its primary surface. The
  feedback: "I have to click the toolbar icon every time I navigate; the
  side panel fights with my browser's sidebar; I'd rather have it
  inside DevTools where I'm already debugging."
- DevTools panels:
  - open automatically when DevTools is open,
  - have a stable location (next to Elements / Network / Sources),
  - survive page navigation (the panel stays open across navigations;
    only its content refreshes),
  - have direct access to `inspectedWindow.eval` as a fallback when the
    content script is not yet injected.
- The popup remains because it's the right surface for "is this page
  using RoyCSS at all?" without opening DevTools.
- The side panel is dropped because keeping three surfaces doubles the
  message-routing complexity for marginal UX benefit.

### Alternatives considered

- **Side panel as primary, popup as fallback.** This is what v1 did. The
  v2 task spec explicitly asks for a DevTools panel, and the trade-off
  (panel requires DevTools open) is acceptable for the v2 audience
  (developers actively debugging).
- **All three surfaces.** Rejected — message routing across three
  surfaces is complex; the side panel adds no capability the panel
  doesn't already have.

### Consequences

- The inspector only works when DevTools is open. The popup compensates
  for the "is this page using RoyCSS?" question without DevTools.
- `chrome.devtools.panels.create` is only available from a DevTools page
  (`devtools.html`); it cannot be called from the service worker or
  popup. This is why `devtools.html` exists as a thin shim.
- DevTools panels and the inspected page share a tab id
  (`chrome.devtools.inspectedWindow.tabId`), so the panel knows exactly
  which tab to inject the content script into.

---

## ADR-5 — Highlighting approach

**Status:** Accepted
**Date:** 2026-07-30

### Context

When the user clicks an effect in the panel, the inspector must highlight
every element on the inspected page that carries the matching
`roycss-<id>` class. Options:

1. **Inline style mutation** — set `element.style.outline` on each match.
   Simple, but mutates the page's inline styles (breaks `style` attribute
   selectors, can be observed by page scripts).
2. **Injected `<style>` tag** — append a `<style>` rule like
   `.roycss-pulse-glow { outline: 2px solid red !important; }`. Simple,
   no per-element mutation, but the page can override `outline` with
   higher specificity.
3. **Overlay divs in a Shadow DOM root** — append a single
   `<div id="roycss-inspector-root">` with a closed Shadow DOM; inside,
   render one absolutely-positioned highlight div per matched element.
   The host page cannot reach into the Shadow DOM, cannot override the
   styles, and cannot remove the root div without breaking its own
   layout.

### Decision

**Option 3 — Shadow DOM overlay.** This is the same approach v1 used;
v2 keeps it because the trade-offs haven't changed.

Implementation:
1. The content script appends `<div id="roycss-inspector-root">` to
   `document.documentElement` and attaches `attachShadow({ mode: "closed" })`.
2. Inside the shadow root, a `<style>` defines `.roycss-inspector-highlight`
   (outline + label badge styles) using `position: fixed` and `pointer-events:
   none` so the overlay does not interfere with page interaction.
3. For each matched element, the content script computes
   `getBoundingClientRect()` and creates a highlight div sized to that rect.
4. A single `scroll` / `resize` listener (debounced 50 ms) recomputes
   positions for all highlights.
5. On `clear-highlight`, all highlight divs are removed (the root and
   shadow root stay for the next highlight request).

### Alternatives considered

- **Inline `style.outline`.** Rejected — mutates page state; page scripts
  reading `style.cssText` would observe the change.
- **Injected `<style>` with `!important`.** Rejected — fragile against
  pages that use `outline: none !important` in their own CSS (common for
  accessibility resets that get re-toggled). Also, the page can read the
  injected `<style>` text via `document.styleSheets` and detect that the
  inspector is active.
- **SVG overlay.** Rejected — same isolation properties as Shadow DOM
  but more code; no benefit.

### Consequences

- The overlay is invisible to page scripts (closed Shadow DOM). Page CSS
  cannot leak in. Page JS cannot reach the highlight divs.
- The overlay must be repositioned on scroll/resize. The debounced
  listener is cheap (one `getBoundingClientRect()` per highlight per
  debounced event).
- The overlay is removed on `pagehide` and on `clear-highlight`. If the
  user navigates away, the content-script context dies and Chrome
  cleans up the root div automatically.
- `position: fixed` is used (not `absolute`) so the overlay tracks the
  viewport during scroll without requiring the debounced listener to
  fire on every scroll frame. The listener only fires on `resize` and
  on DOM mutations that change element rects.
