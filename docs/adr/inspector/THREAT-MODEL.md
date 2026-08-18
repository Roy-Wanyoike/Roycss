# RoyCSS Inspector — Threat Model

- **Status:** Accepted
- **Date:** 2026-07-30
- **Owner:** Inspector Extension domain
- **Methodology:** STRIDE + extension-specific threat catalog
- **Scope:** v2 (DevTools-panel rebuild). Supersedes
  `docs/threat-models/01-inspector-extension.md` for the v2 design.

---

## 1. Assets

| Asset | Sensitivity | Where it lives |
|---|---|---|
| Inspected page DOM | High — may contain PII, auth tokens, customer data | The inspected tab's renderer process |
| RoyCSS effect metadata + CSS source | Public (RoyCSS is open source, MIT) | Bundled in `inspector/effects.json` |
| User's UI state (last selected effect, search query) | Low — no PII | `chrome.storage.local` |
| Extension's bundled JS / HTML | Public | Extension package |
| Chrome service worker context | High — privileged (has `scripting`, `storage`, host perms) | Chrome extension process |

---

## 2. Trust boundaries

```
┌──────────────────────────────────────────────────────────────────┐
│  Untrusted: inspected page (any origin, arbitrary JS)            │
│  · page DOM                                                     │
│  · page scripts (main world)                                    │
│  · page CSS                                                     │
│  · page network requests                                        │
│                                                                 │
│  ──────── Isolated world boundary (Chrome-enforced) ──────────  │
│                                                                 │
│  Trusted: content-script.js (isolated world, same DOM)          │
│  · reads class attributes                                       │
│  · writes only to its own Shadow DOM root                       │
│                                                                 │
│  ──────── chrome.runtime.sendMessage boundary ────────────────  │
│                                                                 │
│  Trusted: background.js (service worker, MV3)                   │
│  · has scripting + storage + host perms                         │
│  · routes messages, injects content scripts                     │
│                                                                 │
│  ──────── chrome.runtime boundary (extension pages) ──────────  │
│                                                                 │
│  Trusted: panel.html, popup.html, devtools.html (extension pages)│
│  · subject to extension CSP                                     │
│  · cannot be reached by page scripts                            │
└──────────────────────────────────────────────────────────────────┘
```

---

## 3. STRIDE analysis

### 3.1 Spoofing

| Threat | Mitigation |
|---|---|
| Page script pretends to be the content script and sends `scan-result` messages to the background worker. | Content scripts and page scripts share the `chrome.runtime` API surface *only* if the page is itself an extension page. Page scripts cannot call `chrome.runtime.sendMessage` (Chrome enforces). The service worker validates every message: `if (!message \|\| typeof message.type !== "string") return;`. Messages from `chrome.tabs.sendMessage` carry a `sender.tab` property the worker can audit. |
| Page script forges the inspector's Shadow DOM root to make the user think an element is highlighted. | The Shadow DOM root is `mode: "closed"` — the page cannot get a reference to it. Even if the page appends its own `<div id="roycss-inspector-root">`, the content script always queries the *real* root it created (held in a closure variable, not re-queried from the DOM). |

### 3.2 Tampering

| Threat | Mitigation |
|---|---|
| Page script mutates the `class` attribute on inspected elements between scan and highlight, causing the inspector to highlight the wrong element. | This is by-design — the inspector reports the live DOM state. The MutationObserver re-scans within 50 ms of any class mutation, so the panel always reflects current state. Highlight calls re-query `querySelectorAll('.roycss-<id>')` at highlight time, not at scan time. |
| Page script removes the inspector's overlay. | The overlay root is a direct child of `document.documentElement`. Page scripts can call `document.documentElement.removeChild(...)`, but the content script re-creates the root on the next highlight call. The closure variable `shadowRoot` is not invalidated by DOM removal — we check `shadowRoot.isConnected` before each use and rebuild if needed. |
| Page script injects its own CSS that overrides the highlight styles. | The overlay lives inside a closed Shadow DOM. Page CSS does not apply to shadow trees unless explicitly inherited via `inherit` keywords. The overlay's `<style>` uses high specificity and `!important` for `outline` and `background` — defense in depth. |
| Page script tampers with `effects.json` at runtime. | `effects.json` is a bundled extension resource fetched via `chrome.runtime.getURL("effects.json")`. Page scripts cannot read extension resources (CORS-blocked). The content script and panel re-validate the JSON shape on load: `Array.isArray(data) && data.every(e => typeof e.id === "string")`. |

### 3.3 Repudiation

| Threat | Mitigation |
|---|---|
| User claims the inspector leaked data; we have no logs. | The inspector deliberately collects no telemetry, so there are no logs to audit. The threat model is "we cannot repudiate because we cannot exfiltrate" — verified by code review (no `fetch`, no `XMLHttpRequest`, no `navigator.sendBeacon` anywhere in the bundle). |

### 3.4 Information disclosure

| Threat | Mitigation |
|---|---|
| Content script reads page content beyond `class` attributes. | The content script reads **only** `element.getAttribute("class")`. It does not read `innerText`, `outerHTML`, `value`, `href`, or any other attribute. Code review enforces this. The scan result contains only `id`, `className`, `count`, `samplePath` (a DOM path built from `tagName + index`, not from text content). |
| Inspector exfiltrates page data to a remote server. | **No `fetch`, no `XMLHttpRequest`, no `sendBeacon`, no `WebSocket`** anywhere in the bundle. The only `fetch` call is `fetch(chrome.runtime.getURL("effects.json"))`, which is a same-extension resource fetch and never touches the network. Code-grep enforces this in the review checklist. |
| Inspector leaks page data via `chrome.storage.local` (which syncs to other devices if the user has Chrome Sync). | The inspector stores only UI state (last selected effect id, search query, panel collapse state). No page content is stored. `chrome.storage.local` (not `sync`) is used explicitly. |
| Inspector leaks data via DevTools console. | The content script and service worker log only `[RoyCSS Inspector]`-prefixed messages with no page content. The panel logs only effect ids and counts. No `console.log` of page DOM. |
| `effects.json` is huge (1.5 MB) and slows down the page. | `effects.json` is loaded only by the panel (extension page), not by the content script. The content script never loads `effects.json` — it only reports raw class names. The panel builds a `Map<id, Effect>` once on first open. |

### 3.5 Denial of service

| Threat | Mitigation |
|---|---|
| Page has 100,000+ `roycss-*` elements; scan blocks the renderer. | The content script caps highlights at 200 elements (`MAX_HIGHLIGHTS = 200`). The scan result is uncapped but is just a count + per-effect tally — no per-element data is sent for more than the first 5 matches per effect. `querySelectorAll` is native C++ and handles 100k elements in < 50 ms. |
| Page mutates the DOM in a tight loop; MutationObserver fires forever. | The MutationObserver is debounced by 50 ms (`MUTATION_DEBOUNCE_MS`). If mutations keep firing, the scan runs at most once per 50 ms. A re-entrancy guard prevents overlapping scans. |
| Page sets `class="roycss-<very-long-string>"` to bloat the scan result. | The content script truncates effect ids to 64 characters (`if (id.length > 64) return;`). Class names longer than 64 chars are not real RoyCSS ids (the longest real id is 22 chars). |
| Page sets `class="roycss-"` (empty id) on every element. | The regex `\broycss-([a-z0-9][a-z0-9-]*)\b` requires at least one alphanumeric character after `roycss-`. Empty ids are not matched. |

### 3.6 Elevation of privilege

| Threat | Mitigation |
|---|---|
| Page script exploits a content-script bug to execute code in the service worker context. | The content script never `eval`s page strings. All messages are validated: `typeof message.type === "string"`, `typeof message.effectId === "string"`, `message.effectId.length <= 64`. Unknown message types are dropped. The service worker never `eval`s message payloads. |
| Page script exploits the inspector's `inspectedWindow.eval` fallback. | `inspectedWindow.eval` is only called from `panel.js` (an extension page). The page cannot trigger `inspectedWindow.eval` — only the panel can. The eval'd expressions are static strings (`"document.querySelectorAll('[class*=\"roycss-\"]').length"`); no page-provided data is interpolated. |
| Page script exploits a prototype pollution in `effects.json` parsing. | `effects.json` is parsed via `JSON.parse`, which does not execute `__proto__` assignments. The parsed object is then iterated into a `new Map(...)`, which does not inherit prototype pollution. |

---

## 4. Permissions scope

### 4.1 `<all_urls>` host permission

**Justification:** The inspector must scan any page the developer is
debugging. Restricting to a curated allowlist (e.g. `https://localhost:*/*`,
`https://roycss.dev/*`) would prevent the inspector from running on the
pages where it's most valuable (customer staging environments, third-party
dashboards, competitor teardowns).

**Mitigation:**
- The inspector does **not** declare `content_scripts` in the manifest
  (which would inject on every page navigation). Instead, the content
  script is injected on demand via `chrome.scripting.executeScript`,
  triggered only when the user opens the panel or popup.
- The content script reads only `class` attributes.
- The `activeTab` permission further scopes injection to the tab the user
  explicitly invoked the extension on (when triggered via the popup).

**Install warning trade-off:** Users see "Read and change all your data
on all websites". The inspector never *changes* anything (other than its
own overlay) and never *reads* anything other than class attributes. The
warning is the cost of doing business for any inspector-class extension
(Lighthouse, React DevTools, etc. all carry the same warning).

### 4.2 `scripting` permission

**Justification:** Required for `chrome.scripting.executeScript` (the MV3
successor to `tabs.executeScript`). The inspector uses it to inject
`content-script.js` into the active tab on demand.

**Mitigation:** Only the background service worker can call
`chrome.scripting.executeScript`. The content script and panel cannot.
The injected file is a static bundled file (`content-script.js`), not a
dynamic string — there is no `func` argument, so no page-provided code is
ever executed.

### 4.3 `storage` permission

**Justification:** Persist UI state (last selected effect, search query,
panel collapse state) in `chrome.storage.local`.

**Mitigation:** Only UI state is stored — no page content. `storage.local`
(not `storage.sync`) is used so data does not sync to other devices.

### 4.4 `activeTab` permission

**Justification:** Lets the popup ask for temporary access to the active
tab when the user clicks the toolbar icon. Avoids needing `<all_urls>` for
the popup-only flow.

**Mitigation:** `activeTab` grants access only for the duration of the
user's explicit invocation. The grant is per-tab and per-invocation.

### 4.5 `devtools_page`

**Justification:** Required to register the RoyCSS DevTools panel.

**Mitigation:** `devtools.html` is a thin shim that calls
`chrome.devtools.panels.create("RoyCSS", "icons/icon16.png",
"panel.html")`. No logic. No network. No DOM access. The panel itself
is an extension page subject to the extension CSP.

---

## 5. CSP

### 5.1 Extension pages CSP

```jsonc
"content_security_policy": {
  "extension_pages": "default-src 'self'; script-src 'self'; object-src 'none'; style-src 'self' 'unsafe-inline'"
}
```

- `default-src 'self'` — all resources must come from the extension bundle.
- `script-src 'self'` — only extension-bundled scripts. No `unsafe-inline`,
  no `unsafe-eval`, no remote scripts.
- `object-src 'none'` — no Flash, no Java, no plugins.
- `style-src 'self' 'unsafe-inline'` — inline `<style>` tags are required
  for the panel and popup (DevTools panel documents don't support nonces).
  `'unsafe-inline'` for `style-src` is acceptable: it allows inline
  styles but not inline scripts (which are blocked by `script-src 'self'`).

### 5.2 Content script CSP

Content scripts run in the isolated world and are not subject to the
page's CSP. They are subject to the extension's CSP for any
`chrome.runtime`-mediated resource loads. The content script loads no
resources at runtime.

### 5.3 No remote code

The inspector loads **zero** remote scripts. The only `fetch` is
`fetch(chrome.runtime.getURL("effects.json"))`, which resolves to a
bundled file. There is no `eval`, no `new Function()`, no `setTimeout`
with a string argument, no `setInterval` with a string argument.

---

## 6. Malicious-page threat catalog

### 6.1 Page tries to detect the inspector

**Threat:** A page wants to know whether the user has the RoyCSS inspector
installed (e.g. to deny service or to fingerprint).

**Mitigation:**
- The inspector does not inject any global variables into the page's main
  world. The content script runs in the isolated world.
- The inspector does not add any `<meta>` tags, `<link>` tags, or
  attributes to the page DOM. The only DOM mutation is the
  `<div id="roycss-inspector-root">` child of `document.documentElement`,
  which is created only when the user explicitly highlights an effect.
- The page can detect the inspector by polling
  `document.documentElement.querySelector("#roycss-inspector-root")`. This
  is acceptable — it only reveals that the user *used* the inspector, not
  that the inspector is installed.

### 6.2 Page tries to crash the inspector

**Threat:** A page deliberately constructs a pathological DOM (e.g.
10 million elements with `class*="roycss-"`) to crash the content script
or service worker.

**Mitigation:**
- `MAX_HIGHLIGHTS = 200` caps the overlay render.
- Scan results cap at 5 sample elements per effect.
- The MutationObserver is debounced 50 ms with a re-entrancy guard.
- `querySelectorAll` is native C++ and cannot be crashed by DOM size
  (Chrome's renderer has its own OOM protection).
- The service worker is event-driven and stateless — if it crashes,
  Chrome restarts it on the next event.

### 6.3 Page tries to inject script via the inspector

**Threat:** A page sets `class="roycss-<script>alert(1)</script>"` and
hopes the inspector will render it as HTML.

**Mitigation:**
- The content script never uses `innerHTML`. All dynamic DOM is built via
  `document.createElement` + `textContent`.
- The panel uses `textContent` for all effect data (id, name, description,
  tags, cssCode). The CSS code viewer is a `<pre><code>` with
  `textContent` assignment — no HTML parsing.
- The Shadow DOM overlay uses `textContent` for the label badge.

### 6.4 Page tries to overflow the message channel

**Threat:** A page mutates the DOM rapidly to trigger many
MutationObserver events, each sending a `scan-update` message to the
service worker, flooding the channel.

**Mitigation:**
- The MutationObserver is debounced 50 ms.
- The content script only sends `scan-update` when the unique effect
  count actually changes (compared against the last scan's set of ids).
  If the page just adds and removes the same `roycss-` class repeatedly,
  no message is sent.

---

## 7. CSP conflicts

### 7.1 Page CSP blocks inline styles

**Threat:** The inspected page has a strict CSP
(`style-src 'self' 'none'`) that blocks inline styles. The inspector's
overlay uses inline styles (via `element.style.outline = ...`).

**Mitigation:** The overlay lives inside a Shadow DOM root with its own
`<style>` element. Shadow DOM styles are *not* subject to the page's CSP
— they are subject to the extension's CSP. The extension's CSP allows
`style-src 'self' 'unsafe-inline'`, so the overlay styles work.

### 7.2 Page CSP blocks `querySelectorAll`

**Threat:** None. `querySelectorAll` is a DOM API, not a network request.
Page CSP cannot block it.

### 7.3 Page CSP blocks content script injection

**Threat:** A page with `Content-Security-Policy: script-src 'self'`
tries to block the content script.

**Mitigation:** Content scripts run in the isolated world, which is not
subject to the page's CSP. Chrome injects them regardless of page CSP.
This is by design — Chrome controls the isolated world, not the page.

---

## 8. Residual risk

- **The inspector must trust Chrome's MV3 enforcement.** If Chrome has a
  bug that lets page scripts escape the isolated world, the inspector's
  content script could be attacked. This is a Chrome bug, not an
  inspector bug.
- **The inspector must trust `effects.json`.** If a build pipeline bug
  corrupts `effects.json` (e.g. a malicious PR adds an effect with
  `<script>` in the description), the panel renders it via
  `textContent` so it cannot execute. The CSS code viewer also uses
  `textContent`, so even a CSS injection (`expression(...)`) cannot
  execute (CSS expressions are IE-only and Chrome ignores them).
- **The inspector's `<all_urls>` permission is broad.** Mitigated by
  on-demand injection and read-only content-script behavior. The install
  warning is unavoidable for inspector-class extensions.

---

## 9. Verification

The threat model is verified by:

1. **Code review** — every PR that touches `content-script.js`,
   `background.js`, `panel.js`, `popup.js` must be reviewed against this
   document.
2. **Automated checks** — `REVIEW-CHECKLIST.md` includes items for "no
   `fetch` of remote URLs", "no `eval`", "no `innerHTML` of untrusted
   strings", "content script reads only `class` attributes".
3. **Manual testing** — open the inspector against a known-malicious test
   page (the RoyCSS test suite includes a `tests/malicious-page.html` that
   sets `class="roycss-<script>"` etc.) and verify no script executes.

---

## 10. Changes from v1 threat model

- v1 stored `inspectorEnabled` (boolean) in `chrome.storage.local`. v2
  stores UI state (last selected effect, search query). The data
  classification is unchanged (Low sensitivity, no PII).
- v1 used the side panel API; v2 uses the DevTools panel API. The trust
  boundary is unchanged (both are extension pages subject to extension
  CSP).
- v1 embedded top-100 effects (50 KB); v2 embeds all 1,569 effects
  (1.5 MB). The data classification is unchanged (Public, MIT-licensed).
  The risk surface increases only in bundle size, not in exfiltration
  surface (the bundled data is never sent anywhere).
- v1 added a `MutationObserver` to the content script; v2 keeps it.
- v2 adds `inspectedWindow.eval` as a fallback. The eval'd strings are
  static and contain no page-provided data — see §3.6.
