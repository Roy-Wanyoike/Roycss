# Review Checklist — RoyCSS Inspector Chrome Extension

- **Document owner:** Principal Engineer — Browser Inspector domain
- **Purpose:** Merge-gate checklist. Every item must be ✅ before a PR that touches `inspector/` is merged.
- **Status:** v1.0 — locked.

---

## How to use this checklist

Every PR that modifies files under `inspector/` must include a copy of this checklist in the PR description with each item ticked off. Items that do not apply must be marked **N/A** with a one-line justification.

The checklist is grouped into six sections:
1. Manifest & permissions
2. Source code security
3. Build & test
4. Performance
5. Documentation
6. Ship readiness

---

## 1. Manifest & permissions

- [ ] `manifest_version` is `3`. No MV2 fields (`browser_action`, `background.scripts`, `persistent: true`).
- [ ] `permissions` array contains only: `activeTab`, `sidePanel`, `scripting`, `storage`. No new permission added without an ADR update.
- [ ] `host_permissions` is exactly `["<all_urls>"]`. Justification present in threat model §7.
- [ ] `content_security_policy.extension` is exactly `"default-src 'self'; script-src 'self'; object-src 'none'"`. No `unsafe-inline`, no `unsafe-eval`, no remote hosts.
- [ ] `action.default_popup` points to the compiled `popup.html` (in `dist/`).
- [ ] `side_panel.default_path` points to the compiled `sidepanel.html`.
- [ ] `background.service_worker` points to the compiled `background.js` (no `"type": "module"` unless `background.type` is explicitly `"module"` and the file uses ES module syntax — verify Chrome supports it for the target version).
- [ ] `minimum_chrome_version` is `"114"` or higher (side panel API gate).
- [ ] `icons` field includes 16, 48, 128 entries; files exist in `icons/`.
- [ ] `version` is bumped from the previous release (semver).
- [ ] No `externally_connectable` field (cross-extension messaging is disabled by design).
- [ ] No `content_scripts` field (content script is injected on demand via `chrome.scripting.executeScript`).
- [ ] No `web_accessible_resources` field (extension resources are not exposed to the page).
- [ ] No `key` field (only present in published Web Store builds; for "load unpacked" it must be absent).

---

## 2. Source code security

### 2.1 Forbidden patterns

For each of the following, run `rg -n "<pattern>" inspector/src/` and confirm zero matches:

- [ ] No `eval(` anywhere.
- [ ] No `new Function(` anywhere.
- [ ] No `setTimeout(string` or `setInterval(string` (string-as-callback form).
- [ ] No `innerHTML =` with a non-literal string. Literal strings (e.g. `el.innerHTML = "<span></span>"`) are allowed only if they contain no interpolated values; if interpolation is needed, switch to `createElement` + `textContent`.
- [ ] No `outerHTML =` with a non-literal string.
- [ ] No `insertAdjacentHTML` with a non-literal string.
- [ ] No `document.write(`.
- [ ] No `fetch(` in the content script (`src/content.ts`, `src/inspector-overlay.ts`). The popup and side panel may use `fetch` only against `'self'` (the extension bundle) — but v1.0 has no fetches anywhere.
- [ ] No `XMLHttpRequest` anywhere.
- [ ] No `<script src="http">` or `<script src="https">` in HTML files (only relative `src`).
- [ ] No inline event handlers in HTML (`onclick=`, `onload=`, etc.).
- [ ] No inline `<script>` blocks in HTML files (all JS is external and loaded via `<script src="…">`).
- [ ] No `chrome.tabs.executeScript` (MV2 API).
- [ ] No `chrome.extension.*` APIs (deprecated MV2 namespace).
- [ ] No `console.log` in production code paths (`console.debug` is allowed; it is stripped by the build via Bun's `--drop=console.debug` flag — verify in `package.json`).

### 2.2 Required patterns

- [ ] Content script reads only `element.classList` and `element.getAttribute("class")`. No other attribute reads. (Threat model §3.4 I1.)
- [ ] Overlay renders inside a **closed** Shadow DOM (`shadowRoot = host.attachShadow({ mode: "closed" })`).
- [ ] All "View on RoyCSS" links open in `_blank` with `rel="noopener noreferrer"`. No referrer leaked.
- [ ] All message handlers validate `message.type` against a known string-literal union; unknown types are dropped silently (no throw).
- [ ] All DOM construction uses `document.createElement` + `textContent` for any value sourced from the page (e.g. the class name on a badge).
- [ ] Badge count is capped at 200 (constant `MAX_BADGES` in `content.ts`).
- [ ] MutationObserver is debounced (≥ 50 ms trailing).
- [ ] `chrome.storage.local` keys are documented in `README.md` and the threat model. v1.0 has exactly one key: `inspectorEnabled`.

### 2.3 Type safety

- [ ] `tsconfig.json` has `strict: true`.
- [ ] No `any` casts in production code (`as any`, `<any>`, `// @ts-ignore`). Exceptions require a code comment justifying why.
- [ ] All `chrome.*` API calls use types from `@types/chrome`.
- [ ] Message payloads are typed via a shared `Message` union type exported from `background.ts`.

---

## 3. Build & test

- [ ] `bun install` completes with no errors.
- [ ] `bun run build:data` regenerates `src/effects-data.json`; the file is committed.
- [ ] `src/effects-data.json` size is `< 50,000 bytes` (`wc -c src/effects-data.json`).
- [ ] `bun run build:ts` produces `dist/*.js` for every entry in `src/*.ts`. No TypeScript errors.
- [ ] `bun run build:assets` copies `manifest.json`, all `src/*.html`, all `src/*.css`, `src/effects-data.json`, and `icons/*` into `dist/`.
- [ ] `manifest.json` validates as JSON: `node -e "JSON.parse(require('fs').readFileSync('inspector/manifest.json'))"`.
- [ ] `bun test` passes all tests.
- [ ] The content-script unit test (`tests/content.test.ts`) covers:
  - [ ] Single `roycss-pulse-glow` class → 1 match, `effectId === "pulse-glow"`.
  - [ ] Multiple `roycss-*` classes on one element → all detected.
  - [ ] Non-`roycss-` classes ignored.
  - [ ] Element with no `class` attribute skipped.
- [ ] Loading `dist/` in Chrome via `chrome://extensions` → Developer mode → Load unpacked produces **zero** errors in the extensions page.
- [ ] Clicking the toolbar icon opens the popup (and on Chrome 114+, opens the side panel via `setPanelBehavior`).
- [ ] Navigating to a page with `roycss-*` classes and invoking the Inspector shows badges + scan count.

---

## 4. Performance

- [ ] `dist/` total size (excluding icons) is `< 100 KB` zipped.
- [ ] `dist/content.js` is `< 30 KB`.
- [ ] `dist/background.js` is `< 10 KB`.
- [ ] `dist/popup.js` is `< 20 KB`.
- [ ] `dist/sidepanel.js` is `< 30 KB` (includes embedded effects data).
- [ ] Manual benchmark on the three reference pages (lightweight / medium / heavy SPA) recorded in the PR description:
  - [ ] Memory overhead < 5 MB.
  - [ ] Injection time < 50 ms on the heavy SPA.
  - [ ] Popup cold start < 200 ms.
  - [ ] Scan time < 100 ms on the heavy SPA.
- [ ] No `requestAnimationFrame` loops that run when the side panel is closed.
- [ ] No `setInterval` with a period < 1000 ms in the service worker (MV3 SW eviction makes short intervals unreliable).

---

## 5. Documentation

- [ ] `inspector/README.md` covers: install, usage, architecture summary, security summary, development workflow.
- [ ] `docs/adr/01-inspector-extension.md` reflects the shipped architecture (Manifest V3, side panel, popup fallback).
- [ ] `docs/threat-models/01-inspector-extension.md` reflects the shipped permissions and CSP.
- [ ] `docs/benchmarks/01-inspector-extension.md` records the v1.0 measured numbers.
- [ ] `docs/plans/01-inspector-extension.md` matches the shipped file layout.
- [ ] `docs/checklists/01-inspector-extension.md` (this file) is up to date.
- [ ] `src/components/roycss/platform-ecosystem.tsx` Inspector card updated from "concept" to "v1.0 ready" with a `/inspector/` View Source link.
- [ ] Worklog entry appended with: Task ID, agent, work log bullets, stage summary.

---

## 6. Ship readiness

- [ ] All checklist items above are ✅ or N/A with justification.
- [ ] `git status` shows a clean working tree (everything committed).
- [ ] `bun run lint` (in the parent project) passes with 0 errors and 0 warnings.
- [ ] No `console.log` / `debugger` / TODO / FIXME comments left in `src/` (use `rg -n "TODO|FIXME|debugger" inspector/src/`).
- [ ] `manifest.json` `version` field matches `package.json` `version` field.
- [ ] PR description includes the manual benchmark numbers from §4.
- [ ] PR description includes a screenshot of the popup + side panel on the RoyCSS marketing site.
- [ ] PR description includes a screenshot of the side panel showing one effect's CSS code + framework tabs.
- [ ] At least one reviewer has signed off.
- [ ] Git tag `v1.x.0` is created on the merge commit (not before — tags move only forward).

---

## 7. Post-merge verification

Within 24 hours of merge:

- [ ] Pull `main`, run `bun run build` from a clean checkout, load `dist/` in Chrome, verify the extension works.
- [ ] Run `bun test` from the clean checkout — all tests pass.
- [ ] Update the worklog with the merge commit SHA.
- [ ] If the merge introduces a new permission, file an issue to update the threat model within 7 days.

---

## 8. Known issues & waivers

Any item that is waived must be recorded here with:
- The waived item.
- The reason.
- The expiry date (when the waiver must be revisited).
- The approver.

| Waived item | Reason | Expiry | Approver |
|---|---|---|---|
| (none in v1.0) | | | |

---

## 9. References

- ADR: `docs/adr/01-inspector-extension.md`
- Threat model: `docs/threat-models/01-inspector-extension.md`
- Benchmarks: `docs/benchmarks/01-inspector-extension.md`
- Implementation plan: `docs/plans/01-inspector-extension.md`
