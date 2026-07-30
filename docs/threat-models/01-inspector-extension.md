# Threat Model — RoyCSS Inspector Chrome Extension

- **Document owner:** Principal Engineer — Browser Inspector domain
- **Methodology:** STRIDE (Spoofing / Tampering / Repudiation / Information disclosure / Denial of service / Elevation of privilege)
- **Scope:** All code shipped under `/home/z/my-project/inspector/` plus the user's interaction with Chrome's extension runtime.
- **Status:** Approved for v1.0 ship.

---

## 1. Assets

| Asset | Where it lives | Sensitivity | Why it matters |
|---|---|---|---|
| **User browsing data** — URLs, page titles, scroll position | In-memory in the content script; never persisted | High | The user may be on private staging environments, internal dashboards, banking sites. Disclosure = career / privacy damage. |
| **Page DOM** — element classes, text, structure | In the page; read by content script | Medium | The Inspector only reads `class` attributes, but a malicious page could try to trick the script into reading more. |
| **RoyCSS class data** — embedded top 100 effects | `src/effects-data.json` inside the extension bundle | Low | Public catalog data. Already shipped on the marketing site and in `dist/effects.json`. |
| **Extension toggle state** | `chrome.storage.local` | Low | Single boolean (`inspectorEnabled`). No PII. |
| **Extension source code** | `/inspector/dist/*.js` after build | Low | Public; MIT-licensed. Tampering with the shipped code is detected by Chrome's signature check on signed builds. |
| **Side panel UI state** — currently hovered effect, active framework tab | In-memory in the side panel document | Low | Ephemeral; cleared when the panel closes. |

---

## 2. Adversaries

| Adversary | Capability | Motivation |
|---|---|---|
| **Malicious page** | Runs arbitrary JS in the page's origin, controls page DOM, can register service workers in its own origin, can set CSP on its own responses | Steal data from the Inspector; make the Inspector execute on a poisoned DOM; trick the Inspector into displaying misleading effect metadata. |
| **Malicious Chrome extension** | Same as above plus can call `chrome.runtime.sendMessage` to other extensions if they expose handlers | Hijack the Inspector's UI, impersonate the Inspector to the user, exfiltrate the toggle state. |
| **MITM (network attacker)** | Intercept HTTPS traffic if cert chain is broken (e.g. corp proxy, malware CA). Cannot inject into Chrome's extension loading (extensions are signed / loaded locally). | Inject malicious updates — but the Inspector fetches no remote code, so there is nothing to MITM. |
| **Curious / malicious user on a shared machine** | Can `Load unpacked` a tampered copy of the Inspector | Trick another user into installing a backdoored copy. Mitigation: the README ships the official build instructions; users should only load from a trusted clone. |
| **Compromised build toolchain** | Bun / Node / npm supply chain | Slip malicious code into `dist/*.js`. Mitigation: the build is reproducible from a small, readable source tree; diffs are reviewable. |

---

## 3. STRIDE analysis

### 3.1 Spoofing

**S1 — Malicious page impersonates a RoyCSS effect to the Inspector.**
- *Scenario:* A page sets `class="roycss-pulse-glow"` on a phishing element. The Inspector displays "Pulse Glow — A smooth pulsing glow effect" next to it. The user thinks RoyCSS blessed the element.
- *Impact:* Low. The Inspector is descriptive, not prescriptive — it tells you what *class* is on the element, not what the element *is*. The badge clearly labels "RoyCSS class detected", which is factually accurate.
- *Mitigation:* Badge text always includes the literal class name (`roycss-pulse-glow`) sourced from the element's own `class` attribute. The effect metadata (name, description) is sourced from the **embedded** `effects-data.json` — never from the page — so a poisoned DOM cannot lie about what an effect does.

**S2 — Malicious extension impersonates the Inspector's UI.**
- *Scenario:* A second extension opens a side panel that looks identical to the Inspector and asks for credentials.
- *Mitigation:* The Inspector never asks for credentials. The README documents that the side panel is opened only via Chrome's native side-panel affordance (the Chrome toolbar "side panel" button or the extension's own `chrome.sidePanel.open()` call). No external extension can trigger our side panel.

**S3 — Service worker spoofing (between content script and panel).**
- *Scenario:* A malicious extension intercepts `chrome.runtime.sendMessage` between the content script and the side panel.
- *Mitigation:* All messages are scoped to `chrome.runtime` (same-extension only). Cross-extension messaging requires `externally_connectable`, which we do not declare. The message schema is tiny and well-typed (see `src/background.ts`); any unknown message type is dropped.

### 3.2 Tampering

**T1 — Page mutates the overlay DOM.**
- *Scenario:* A page sees the Inspector's floating badges and tries to delete them, restyle them, or move them.
- *Mitigation:* Badges render inside a **closed Shadow DOM** attached to a single `<div data-roycss-inspector-root>` at `document.documentElement`. The page cannot reach `shadowRoot` (closed mode), cannot style `::part(...)` (we expose no parts), and cannot remove the host div without also breaking their own page (the div is the last child of `documentElement`).

**T2 — Page poisons the `class` attribute mid-scan.**
- *Scenario:* A page sees the Inspector scanning and rapidly toggles `roycss-*` classes to drown the panel in noise.
- *Mitigation:* The content script **debounces** `MutationObserver` callbacks (50ms trailing) and caps the number of badges rendered concurrently (default 200). Beyond the cap, the script stops adding badges and surfaces a "page has N matches; showing first 200" notice in the popup. No crash, no unbounded memory.

**T3 — Tampered extension bundle.**
- *Scenario:* An attacker distributes a modified `dist/content.js` that exfiltrates `document.body.innerHTML` to a remote server.
- *Mitigation:*
  - The official distribution channel is "clone the repo, run `bun run build`, load unpacked". Users inspect the source.
  - The extension CSP blocks any `fetch()` to a non-`self` origin from the **extension** context. (Content scripts are not bound by the extension CSP, but they are bound by the **page's** CSP — and we deliberately do not call `fetch` from the content script at all.)
  - Code review checklist (`docs/checklists/01-inspector-extension.md`) explicitly forbids `fetch`, `XMLHttpRequest`, `eval`, `Function()`, and `innerHTML` of untrusted strings.

### 3.3 Repudiation

**R1 — User denies having enabled the Inspector.**
- *Scenario:* A user toggles the Inspector on, scans a confidential page, then claims they never used it.
- *Impact:* None. The Inspector is a personal tool. There is no audit log because there is no multi-user surface. The toggle state in `chrome.storage.local` is the only persisted signal, and it is local to the user's profile.

**R2 — Extension developer denies shipping a vulnerable version.**
- *Mitigation:* Every release is git-tagged. The `manifest.json` `version` field is bumped on every ship. The README documents which commit / tag corresponds to which version.

### 3.4 Information disclosure

**I1 — Content script reads more than `class` attributes.**
- *Scenario:* A bug in the content script causes it to read `innerText`, `value`, or `href` of matched elements and surface them in the side panel.
- *Mitigation:*
  - The detection logic is **single-purpose**: `document.querySelectorAll('[class*="roycss-"]')` then read `element.classList`. Nothing else.
  - The unit test in `tests/content.test.ts` asserts that the scan result contains only class names — never element text, never attributes other than `class`.
  - Code review checklist item: *"The content script reads only `element.classList`. If a future feature requires reading other attributes, that change requires an updated threat model."*

**I2 — Side panel exfiltrates data via the `View on RoyCSS` link.**
- *Scenario:* The "View on RoyCSS" link in the tooltip includes the current page URL as a query param, leaking the user's location.
- *Mitigation:* The link is hardcoded to `https://roycss.example.com/effects/<id>` — no query string, no referrer. The link opens in a new tab with `rel="noopener noreferrer"`. The page URL is **never** sent anywhere.

**I3 — Service worker logs sensitive data to `chrome.runtime` console.**
- *Mitigation:* The service worker has **zero `console.log` calls in production builds**. The build script strips `console.*` via Bun's `--drop` flag (configurable in `package.json`).

**I4 — `chrome.storage.local` is readable by other extensions.**
- *Scenario:* A malicious extension calls `chrome.storage.local.get` on the Inspector's storage key.
- *Mitigation:* By Chrome's design, `chrome.storage.local` is **not** readable by other extensions unless `manage` permission is granted. The Inspector stores only a boolean toggle — even if read, there is nothing sensitive. No PII, no page URLs, no class lists.

**I5 — Page reads the Inspector's badges via CSS `:has()`.**
- *Scenario:* A page uses CSS `:has([data-roycss-inspector-root])` to detect that the user has the Inspector installed.
- *Impact:* Low. Detecting the Inspector's presence is not a security breach; it is roughly equivalent to detecting that the user has any other extension. The page cannot read what the Inspector is showing.
- *Mitigation:* Acknowledged in the threat model; not mitigated because the cost (obfuscating the root element) exceeds the benefit. The data attribute is documented in the README.

### 3.5 Denial of service

**D1 — Page creates 100,000 elements with `roycss-*` classes.**
- *Scenario:* A hostile page attempts to freeze the Inspector by creating an unbounded number of matches.
- *Mitigation:*
  - The content script caps badge rendering at 200 elements.
  - The `MutationObserver` is debounced (50ms trailing).
  - The scan loop uses `requestIdleCallback` (with `setTimeout(…, 0)` fallback) so it never blocks the main thread for more than one frame.
  - The benchmarks doc specifies **<100ms scan time on a 10,000-element SPA**; the 200-badge cap keeps the worst case bounded.

**D2 — Page rapid-fires DOM mutations to starve the MutationObserver.**
- *Mitigation:* 50ms trailing debounce coalesces bursts. The observer is `subtree: true, attributes: true, attributeFilter: ["class"]` — only `class` attribute changes trigger a callback, narrowing the surface.

**D3 — Service worker eviction mid-session.**
- *Scenario:* MV3 evicts the service worker after 30s of inactivity; the next event has to re-spin it (50–150ms).
- *Mitigation:* The content script is the source of truth for scan state. The service worker is only a message router. Eviction is invisible to the user.

### 3.6 Elevation of privilege

**E1 — Content script executes in the page's origin context.**
- *Scenario:* A bug causes the content script to call `eval()` on a string sourced from the page, executing page-controlled code in the **extension** context (privileged).
- *Mitigation:*
  - **No `eval`, no `new Function()`, no `setTimeout(string)`, no `setInterval(string)`.** This is enforced by code review and by the CSP (`script-src 'self'`).
  - The content script's only "dynamic" DOM construction is via `document.createElement` + `textContent` — never `innerHTML` of untrusted strings.
  - `chrome.runtime.sendMessage` payloads are plain objects with typed fields; the receiver validates the `type` field against a known enum and ignores unknown types.

**E2 — Malicious page sends a message to the extension.**
- *Scenario:* A page calls `chrome.runtime.sendMessage(<extension-id>, …)` to trigger an extension action.
- *Mitigation:* The Inspector does **not** declare `externally_connectable`. Cross-extension messaging is disabled by default in MV3 for our extension. The page cannot reach our `chrome.runtime.onMessage` listener.

**E3 — Side panel opens privileged Chrome pages.**
- *Scenario:* A future feature opens `chrome://settings` from the side panel.
- *Mitigation:* All links in the side panel are to `https://` URLs only (RoyCSS site, framework docs). No `chrome://` navigation is possible from a side panel without the `tabs` permission, which the Inspector does not request.

---

## 4. Mitigations summary

| Threat | Mitigation | Where enforced |
|---|---|---|
| Remote code execution | No `eval`, no `Function()`, no remote scripts. Strict CSP `script-src 'self'`. | `manifest.json` `content_security_policy.extension`; code review checklist. |
| DOM injection (XSS) | All dynamic DOM built via `createElement` + `textContent`. No `innerHTML` of untrusted strings. | Code review checklist; unit test asserts no `innerHTML` mutation. |
| Overlay tampering | Closed Shadow DOM root. No `::part()` exposed. | `src/inspector-overlay.ts`. |
| Information disclosure (DOM) | Content script reads only `element.classList`. | Unit test; code review. |
| Information disclosure (network) | No `fetch`, no `XMLHttpRequest`, no WebRTC anywhere in the bundle. | Code review checklist; manifest CSP. |
| DoS via DOM flood | 200-badge cap, 50ms debounce, `requestIdleCallback` scheduling. | `src/content.ts`. |
| Cross-extension spoofing | No `externally_connectable`. | `manifest.json` (field absent). |
| Page CSP blocking content script | Content script is injected via `chrome.scripting.executeScript` (MV3) which bypasses page CSP for the script itself; the Inspector never injects `<script>` tags. | `src/background.ts`. |
| Analytics / telemetry leakage | No analytics SDK. No remote endpoints. | Code review; manifest has no `host_permissions` for analytics domains. |

---

## 5. Residual risk

| Risk | Likelihood | Impact | Notes |
|---|---|---|---|
| Page detects the Inspector via DOM probing. | High | Low | The `<div data-roycss-inspector-root>` is detectable. Acceptable: detecting an extension is not a breach. |
| Page spoofs effect class names to mislead the user. | Medium | Low | The Inspector reports the literal class name; the description is sourced from the embedded dataset. A user reading "the page declares `roycss-pulse-glow`" understands this is a class-name observation, not a RoyCSS endorsement. |
| Chrome changes MV3 API (e.g. service worker lifetime). | Medium | Medium | The Inspector is service-worker-light; the content script is the source of truth. A Chrome change would degrade, not break, the experience. |
| User installs a tampered copy. | Low | High | Mitigated by the README's "clone and build" install path. Signed Web Store release is a v1.1 goal. |

---

## 6. CSP justification

The extension's `content_security_policy.extension` field is:

```
default-src 'self'; script-src 'self'; object-src 'none'
```

- `default-src 'self'` — all resources (images, fonts, styles, frames) must come from the extension bundle.
- `script-src 'self'` — only scripts in the extension bundle may execute. No `unsafe-inline`, no `unsafe-eval`, no remote hosts.
- `object-src 'none'` — no Flash, no Java, no plugins. (Defense in depth; Chrome already blocks these but the explicit directive is best practice.)

This CSP is stricter than Chrome's MV3 default (which allows `connect-src` to any HTTPS host). We tighten it because the Inspector has no business making network requests at all.

---

## 7. `<all_urls>` host permission justification

The Inspector requests `host_permissions: ["<all_urls>"]`. This is the broadest possible host permission and triggers the scary install warning. Justification:

- **The Inspector's core function is to scan the page the user is currently viewing.** A curated allowlist (e.g. "only roycss.dev") defeats the purpose — the Inspector is most valuable on third-party sites.
- **`activeTab` scopes execution to the tab the user explicitly invoked the extension on.** The Inspector does not passively scan every page the user visits; it scans only when the user clicks the toolbar icon or opens the side panel.
- **The Inspector is read-only.** It never writes to the page (other than appending its own isolated overlay), never sends messages, never calls `fetch` in the content script.
- **No data leaves the browser.** There is no analytics, no telemetry, no error reporting.

Alternative considered: request `host_permissions: ["<all_urls>"]` only at runtime via `chrome.permissions.request()`. This would let users grant access per-origin. Rejected for v1 because (a) the per-origin prompt UX is clunky and (b) the Inspector's value is in ambient scanning, which requires upfront permission. May revisit in v1.1.

---

## 8. Review cadence

This threat model is reviewed:
- Before every major version bump (`v1.x.0`).
- When a new Chrome MV3 API is added to the bundle.
- When a new permission is requested.
- When a new feature reads from the page DOM (any new `document.querySelector` call requires an update to §3.4).

---

## 9. References

- ADR: `docs/adr/01-inspector-extension.md`
- Implementation plan: `docs/plans/01-inspector-extension.md`
- Benchmarks: `docs/benchmarks/01-inspector-extension.md`
- Review checklist: `docs/checklists/01-inspector-extension.md`
- Chrome MV3 security best practices: https://developer.chrome.com/docs/extensions/mv3/intro/mv3-overview/
- Content script isolation: https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts
