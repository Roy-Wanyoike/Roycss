# RoyCSS Inspector — Review Checklist

- **Status:** Accepted
- **Date:** 2026-07-30
- **Owner:** Inspector Extension domain
- **Scope:** v2 (DevTools-panel rebuild). 15 review items covering
  permissions, CSP, MV3 compliance, security, performance, and
  documentation.

> Every item must be **verified** before the inspector is shipped. Each
> item has a verification command or manual check.

---

## Manifest & permissions

### 1. `manifest.json` is valid JSON and matches the MV3 schema

**Verify:**
```bash
node -e "JSON.parse(require('fs').readFileSync('inspector/manifest.json','utf8'))"
```

Expected: exits 0. No output. Also: load `inspector/` as unpacked in
Chrome and confirm `chrome://extensions` shows no red error box.

### 2. Permissions are minimal

**Verify:** `manifest.json` contains exactly:
```json
"permissions": ["activeTab", "scripting", "storage"]
```

No `tabs`, no `webRequest`, no `webNavigation`, no `cookies`, no
`history`, no `bookmarks`. Each permission is justified in
`docs/adr/inspector/THREAT-MODEL.md` §4.

### 3. `host_permissions` is `<all_urls>` and justified

**Verify:** `manifest.json` contains:
```json
"host_permissions": ["<all_urls>"]
```

The justification is in `docs/adr/inspector/THREAT-MODEL.md` §4.1. The
inspector does **not** declare `content_scripts` in the manifest (which
would inject on every navigation). Content scripts are injected on
demand via `chrome.scripting.executeScript`.

### 4. `devtools_page` is declared

**Verify:** `manifest.json` contains:
```json
"devtools_page": "devtools.html"
```

`devtools.html` exists and loads `devtools.js`. `devtools.js` calls
`chrome.devtools.panels.create("RoyCSS", "icons/icon16.png",
"panel.html")`.

---

## CSP & MV3 compliance

### 5. Extension CSP is strict

**Verify:** `manifest.json` contains:
```json
"content_security_policy": {
  "extension_pages": "default-src 'self'; script-src 'self'; object-src 'none'; style-src 'self' 'unsafe-inline'"
}
```

No `unsafe-eval` in `script-src`. No `https://*` in any directive.
`'unsafe-inline'` appears only in `style-src` (required for inline
`<style>` tags in panel/popup HTML).

### 6. No `eval`, no `new Function()`, no string-arg `setTimeout`/`setInterval`

**Verify:**
```bash
rg -n '\beval\s*\(|new\s+Function\s*\(|setTimeout\s*\(\s*["\']|setInterval\s*\(\s*["\']' inspector/*.js inspector/*.html
```

Expected: no matches. (Inline `<script>` strings in HTML are also
forbidden — `script-src 'self'` blocks them at runtime, but the source
should not contain them either.)

### 7. No remote `fetch` / `XMLHttpRequest` / `WebSocket` / `sendBeacon`

**Verify:**
```bash
rg -n 'fetch\s*\(\s*["'\'']https?:|XMLHttpRequest|new\s+WebSocket|sendBeacon' inspector/*.js
```

Expected: no matches. The only `fetch` call allowed is
`fetch(chrome.runtime.getURL("effects.json"))` — verify it appears at
most once and the URL is `chrome.runtime.getURL(...)`, not a literal
`https://` URL.

### 8. Service worker is a module

**Verify:** `manifest.json` contains:
```json
"background": { "service_worker": "background.js", "type": "module" }
```

`background.js` uses `import` / `export` (or none, if it's a single
file). No `require()`, no `window`, no `document` (service workers have
no DOM).

### 9. No `content_scripts` declaration in manifest

**Verify:** `manifest.json` does **not** contain a `content_scripts`
key. Content scripts are injected on demand via
`chrome.scripting.executeScript` from `background.js`. This is the
privacy-preserving injection model — the inspector only runs on pages
where the user explicitly invoked it.

---

## Security

### 10. Content script reads only `class` attributes

**Verify:** Read `content-script.js`. The only attribute access is
`element.getAttribute("class")`. No `innerText`, no `outerHTML`, no
`value`, no `href`, no `textContent` of page elements. The scan result
contains only `id`, `className`, `count`, `samplePath` (DOM path built
from `tagName + index`, not from text content).

### 11. No `innerHTML` of untrusted strings

**Verify:**
```bash
rg -n 'innerHTML' inspector/*.js inspector/*.html
```

Expected: no matches in JS files. In HTML files, `innerHTML` may appear
only in static template strings (no interpolation of effect data, page
content, or user input). All dynamic DOM in the panel and popup is built
via `document.createElement` + `textContent`.

### 12. Shadow DOM overlay is `mode: "closed"`

**Verify:** Read `content-script.js`. The highlight overlay root is
created with `element.attachShadow({ mode: "closed" })`. The closed mode
prevents page scripts from reaching into the overlay via
`element.shadowRoot`.

### 13. All dynamic strings rendered via `textContent`

**Verify:** Read `panel.js` and `popup.js`. Effect ids, names,
descriptions, tags, CSS code, and sample paths are all assigned via
`element.textContent = ...`, never via `innerHTML`. This is the XSS
defense — even if a malicious page sets `class="roycss-<script>..."`,
the inspector renders it as inert text.

---

## Performance

### 14. `effects.json` size is within budget

**Verify:**
```bash
ls -la inspector/effects.json
```

Expected: between 500 KB (metadata-only fallback) and 2 MB (full data
with cssCode). The panel builds a `Map<id, Effect>` on first open in
< 100 ms (measured). The file is loaded via
`fetch(chrome.runtime.getURL("effects.json"))` — a same-extension
resource fetch, not a network fetch.

### 15. Content script scan completes in < 100 ms on a complex SPA

**Verify:**
- Use `agent-browser` to open `http://localhost:3000/` (the RoyCSS
  marketing site, which uses RoyCSS classes on the effect grid).
- Eval `const t0=performance.now();
  document.querySelectorAll('[class*="roycss-"]').length;
  performance.now()-t0` and confirm the duration is < 50 ms.
- The full content-script `scan()` (which also extracts ids and builds
  the per-effect tally) adds < 50 ms on top of `querySelectorAll`, so
  the total scan budget of < 100 ms is met.

---

## Documentation

### Bonus (not counted in the 15) — README + design docs are complete

**Verify:**
- `inspector/README.md` has install instructions, usage, architecture
  summary, security summary, file layout, and license.
- `docs/adr/inspector/DESIGN.md` has the manifest structure, content
  script responsibilities, DevTools panel UI, message-passing flow, and
  ASCII diagram.
- `docs/adr/inspector/ADR.md` has 5 ADRs (MV3 vs MV2, content script
  vs DevTools API, bundled vs remote effects.json, popup vs panel,
  highlighting approach).
- `docs/adr/inspector/THREAT-MODEL.md` has the STRIDE analysis,
  permissions scope, CSP conflicts, and malicious-page threat catalog.
- `docs/adr/inspector/IMPLEMENTATION-PLAN.md` has the step-by-step plan.
- `docs/adr/inspector/REVIEW-CHECKLIST.md` has this checklist (15
  items).

---

## Sign-off

Reviewer signs off by appending to `/home/z/my-project/worklog.md`:

```
Reviewer: <name>
Date: <YYYY-MM-DD>
Checklist items 1–15 verified.
Open issues: <list or "none">
```

If any item fails, the inspector is not shipped. Fix the issue and
re-verify before re-attempting sign-off.
