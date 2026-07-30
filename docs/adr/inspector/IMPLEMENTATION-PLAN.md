# RoyCSS Inspector — Implementation Plan

- **Status:** Accepted
- **Date:** 2026-07-30
- **Owner:** Inspector Extension domain
- **Scope:** v2 (DevTools-panel rebuild). Step-by-step plan to take the
  inspector from empty directory to "load unpacked"-ready.

---

## Phase 0 — Setup (5 min)

1. Archive the v1 inspector (side-panel implementation) under
   `inspector/legacy-sidepanel/`. The v2 manifest will not load it; it
   is kept for archaeological reference.
2. Create the design docs directory: `docs/adr/inspector/` with
   `DESIGN.md`, `ADR.md`, `THREAT-MODEL.md`, `IMPLEMENTATION-PLAN.md`,
   `REVIEW-CHECKLIST.md`.
3. Confirm the existing `inspector/icons/` (16/48/128 PNGs from v1) are
   still valid for v2 — they are. No regeneration needed.

**Exit criteria:** `inspector/` contains only `icons/` and
`legacy-sidepanel/`. `docs/adr/inspector/` contains five markdown files.

---

## Phase 1 — Manifest + skeleton (10 min)

1. Write `inspector/manifest.json` with:
   - `manifest_version: 3`
   - `permissions: ["activeTab", "scripting", "storage"]`
   - `host_permissions: ["<all_urls>"]`
   - `background: { service_worker: "background.js", type: "module" }`
   - `devtools_page: "devtools.html"`
   - `action: { default_popup: "popup.html", ... }`
   - `content_security_policy.extension_pages` per DESIGN §3.
2. Validate `manifest.json` parses as JSON:
   `node -e "JSON.parse(require('fs').readFileSync('inspector/manifest.json','utf8'))"`.
3. Create empty stub files: `background.js`, `content-script.js`,
   `devtools.html`, `devtools.js`, `panel.html`, `panel.js`, `popup.html`,
   `popup.js`.

**Exit criteria:** `manifest.json` validates. All eight stub files
exist. Loading `inspector/` as unpacked in Chrome produces no manifest
errors (verified by `chrome://extensions` → "Load unpacked" → no red
error boxes).

---

## Phase 2 — Bundled `effects.json` (10 min)

1. Write `inspector/build.sh` (Bun-based, no runtime deps):
   - Step 1: Generate `inspector/effects.json` from
     `/home/z/my-project/src/lib/roycss-effects.ts` by importing the
     `effects` array and serializing it as JSON. Include `cssCode`.
   - Step 2 (fallback): if `src/lib/roycss-effects.ts` is unavailable,
     copy `/home/z/my-project/dist/effects.json` (metadata-only) and
     note the limitation in the build output.
   - Step 3: Validate `manifest.json` is valid JSON.
   - Step 4: Zip `inspector/` (excluding `legacy-sidepanel/`,
     `node_modules/`, `*.zip`, `build.sh`) into
     `inspector/roycss-inspector.zip`.
2. Run `bash inspector/build.sh` to generate `inspector/effects.json`.
3. Verify the file size is between 1 MB and 2 MB (full data with cssCode)
   or 500–600 KB (metadata-only fallback).

**Exit criteria:** `inspector/effects.json` exists, parses as JSON, and
contains 1,569 effects with `id`, `name`, `category`, `description`,
`tags`, `cssCode` fields.

---

## Phase 3 — Content script (20 min)

1. Write `content-script.js` with:
   - `ROYCSS_RE = /\broycss-([a-z0-9][a-z0-9-]*)\b/g`
   - `scan()` function: `querySelectorAll('[class*="roycss-"]')`, iterate,
     extract ids, build a `Map<id, count>`, return `{ count,
     uniqueEffectCount, effects: [...], durationMs }`.
   - `highlight(effectId)` function: clear existing overlay, build
     Shadow DOM root, append highlight divs for each match.
   - `clearHighlight()` function: remove highlight divs (keep root).
   - `MutationObserver` with 50 ms debounce + re-entrancy guard.
   - `chrome.runtime.onMessage` listener for `scan`, `highlight`,
     `clear-highlight`, `popup-stats` messages.
   - Guard against running outside an extension context (for unit
     testing).
2. Write `inspector/tests/content.test.ts` (or `.js`): a tiny Node test
   that stubs a fake DOM (no JSDOM) and verifies `scan()` correctly
   extracts ids from a class attribute.

**Exit criteria:** `content-script.js` is ~250 lines, well-commented,
and the unit test passes.

---

## Phase 4 — Background service worker (15 min)

1. Write `background.js` with:
   - `chrome.runtime.onInstalled` listener: initialize default UI state
     in `chrome.storage.local`.
   - `chrome.runtime.onConnect` listener for panel ports (`name ===
     "panel"`): handle `scan-request`, `highlight`, `clear-highlight`
     messages by forwarding to the content script via
     `chrome.tabs.sendMessage`.
   - `chrome.runtime.onMessage` listener for popup messages:
     `popup-stats` → forward to active tab's content script.
   - `ensureContentScriptInjected(tabId)`: tracks injected tabs in a
     `Set`, calls `chrome.scripting.executeScript` on first request.
   - `chrome.tabs.onRemoved` listener: clean up the injected-tabs set.
2. Validate the message routing logic by tracing through the ASCII
   diagram in DESIGN §2.1.

**Exit criteria:** `background.js` is ~150 lines, well-commented, no
`eval`, no `Function()` constructor, no remote `fetch`.

---

## Phase 5 — DevTools page + panel (30 min)

1. Write `devtools.html` + `devtools.js`:
   - `devtools.html` is a minimal HTML5 document that loads
     `devtools.js`.
   - `devtools.js` calls `chrome.devtools.panels.create("RoyCSS",
     "icons/icon16.png", "panel.html")` and logs success.
2. Write `panel.html`:
   - Header: RoyCSS logo (icon128 PNG) + "RoyCSS Inspector" + total
     effect count badge.
   - Search input (`#search`).
   - Category sections container (`#categories`).
   - Detail pane (`#detail`, hidden by default).
   - All CSS inline in a `<style>` tag (OKLCH palette, system font
     stack).
3. Write `panel.js`:
   - On `DOMContentLoaded`: `fetch(chrome.runtime.getURL("effects.json"))`,
     parse, build `Map<id, Effect>`, connect to background via
     `chrome.runtime.connect({ name: "panel" })`, send `scan-request`
     with `chrome.devtools.inspectedWindow.tabId`.
   - On `scan-result`: render category sections (canonical RoyCSS
     category order), each with effect rows showing name, count, and a
     "view" button.
   - On effect row click: send `highlight` message, open detail pane,
     populate with effect metadata + CSS code.
   - On search input: filter visible effect rows across all categories;
     collapse empty categories.
   - On detail pane "Copy CSS" button: `navigator.clipboard.writeText`.
   - On detail pane "Close" button: hide detail pane, send
     `clear-highlight`.
4. Validate the panel renders correctly by loading the extension,
   opening DevTools on `https://localhost:3000/`, and clicking the
   RoyCSS tab.

**Exit criteria:** Panel shows categorized list of detected effects
within 1 second of opening. Clicking an effect highlights matches on the
page. Detail pane shows metadata + CSS code.

---

## Phase 6 — Popup (10 min)

1. Write `popup.html`:
   - Header: icon + "RoyCSS Inspector".
   - Total count: "X RoyCSS classes on this page".
   - Top 5 effects list (each row: effect name + count).
   - Footer: "Open DevTools → RoyCSS tab for full inspector".
   - All CSS inline.
2. Write `popup.js`:
   - On `DOMContentLoaded`: query the active tab via
     `chrome.tabs.query({ active: true, currentWindow: true })`.
   - Send `popup-stats` message to background, which forwards to the
     content script.
   - On `popup-stats-result`: render the total count + top 5 list.
   - If no content script is injected yet (first popup open on this
     tab), fall back to `chrome.scripting.executeScript` with a tiny
     inline function that returns `document.querySelectorAll('[class*="roycss-"]').length`.
     Actually, MV3 disallows inline functions in `executeScript` from
     extension pages without `func` arg; use `func` arg with no
     parameters instead.
   - If the active tab is a `chrome://` URL or Web Store page, show
     "Inspector cannot run on this page".

**Exit criteria:** Popup opens in < 200 ms, shows count + top 5.

---

## Phase 7 — README + final wiring (10 min)

1. Write `inspector/README.md`:
   - What it is (one paragraph).
   - Install instructions (load unpacked).
   - Usage (open DevTools → RoyCSS tab).
   - Architecture summary (one paragraph + link to design docs).
   - Security summary (one paragraph + link to threat model).
   - File layout.
   - License (MIT).
2. Confirm `build.sh` runs end-to-end and produces
   `inspector/roycss-inspector.zip`.
3. Confirm `inspector/effects.json` is bundled (not gitignored).

**Exit criteria:** README is complete, build.sh produces a zip, all
files are in place.

---

## Phase 8 — Verification (15 min)

1. Run `cd /home/z/my-project && bun run lint` — must be 0 errors. The
   inspector JS files are not in the eslint scope (they're in a
   subdirectory without eslint config), so this is a sanity check that
   the inspector files don't break the root lint.
2. Validate `manifest.json` parses as JSON (already done in Phase 1, but
   re-run after all edits).
3. Validate `effects.json` is bundled: `ls -la inspector/effects.json`.
4. Manually verify the content-script scanning logic by writing a tiny
   Node test script that stubs a DOM and runs `scan()`. (Optional but
   recommended.)
5. Use `agent-browser` to verify the content-script logic against
   `http://localhost:3000/`:
   - `agent-browser open http://localhost:3000/`
   - `agent-browser eval "document.querySelectorAll('[class*=\"roycss-\"]').length"`
   - Confirm the count is > 0 (expected: ~1,200+ based on the marketing
     site's effect grid).
6. Manual smoke test (if Chrome is available): load unpacked, open
   DevTools on localhost:3000, click RoyCSS tab, verify categorized
   list, click an effect, verify highlight, verify detail pane.

**Exit criteria:** Lint clean. Manifest valid. effects.json bundled.
agent-browser count > 0. (Manual smoke test optional if Chrome is not
available in the sandbox.)

---

## Phase 9 — Worklog entry (5 min)

1. Append a `---`-delimited section to `/home/z/my-project/worklog.md`
   with:
   - Task ID: `inspector-extension`
   - Agent: Inspector Chrome Extension (MV3)
   - Task: (one-paragraph summary)
   - Work Log: (bullet list of every file created/modified, every
     validation run, every measurement taken)
   - Stage Summary: (final state, what's verified, what's not)

**Exit criteria:** worklog entry appended, all numbers and paths are
real measurements from this run.
