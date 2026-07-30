/**
 * RoyCSS Inspector — content script.
 *
 * Injected on demand by the background service worker
 * (chrome.scripting.executeScript) when the user opens the DevTools panel
 * or the popup. Runs in the isolated world — same DOM as the page,
 * separate JS context.
 *
 * Responsibilities:
 *  1. Scan the document for elements whose `class` attribute contains a
 *     `roycss-*` token. Return a categorized, de-duplicated tally.
 *  2. Highlight matching elements on demand (Shadow-DOM overlay).
 *  3. Watch for DOM mutations and broadcast `scan-update` deltas.
 *  4. Listen for `scan`, `highlight`, `clear-highlight`, `popup-stats`
 *     messages from the background service worker.
 *
 * Security:
 *  - Reads ONLY `element.getAttribute("class")`. No innerText, no
 *    outerHTML, no value, no href. See THREAT-MODEL.md §3.4 I1.
 *  - Writes only to its own closed Shadow DOM root. Page CSS / JS
 *    cannot reach the overlay.
 *  - No `eval`, no `innerHTML` of untrusted strings, no `fetch`.
 *  - Effect ids are truncated to 64 chars (MAX_ID_LEN) to prevent
 *    pathological pages from bloating the scan result.
 *
 * See docs/adr/inspector/DESIGN.md §4 for the full design.
 */

/* ─── Constants ──────────────────────────────────────────────── */

/** Matches a single `roycss-<id>` token inside a class attribute.
 *  Capture group 1 is the effect id (e.g. "pulse-glow"). */
const ROYCSS_CLASS_RE = /\broycss-([a-z0-9][a-z0-9-]*)\b/g;

/** Maximum number of elements to highlight at once. */
const MAX_HIGHLIGHTS = 200;

/** Maximum length of an effect id (defense against pathological pages). */
const MAX_ID_LEN = 64;

/** MutationObserver debounce (ms). */
const MUTATION_DEBOUNCE_MS = 50;

/** Maximum number of sample elements to report per effect (for the
 *  samplePath field — keeps the message size bounded). */
const MAX_SAMPLES_PER_EFFECT = 5;

/** Storage key for the inspector's UI state (used by the popup, not the
 *  content script — declared here for documentation). */
const STORAGE_KEY = "roycssInspectorState";

/* ─── State ──────────────────────────────────────────────────── */

/** The Shadow DOM root that holds the highlight overlay. Lazily created
 *  on first highlight call. Held in a closure variable so we don't have
 *  to re-query the DOM (which would let a malicious page spoof the root
 *  by adding its own <div id="roycss-inspector-root">). */
let shadowRoot = null;
let overlayHost = null;

/** The last scan result. Used to detect whether a MutationObserver
 *  callback actually changed the set of detected effect ids (so we
 *  don't spam `scan-update` messages when the page just adds/removes
 *  the same `roycss-` class repeatedly). */
let lastScanSignature = "";

/** MutationObserver instance. Disconnect on cleanup. */
let observer = null;
let debounceTimer = null;
let scanning = false; // re-entrancy guard

/* ─── Scanning ───────────────────────────────────────────────── */

/**
 * Scan `root` for elements whose class attribute contains `roycss-*`
 * tokens. Returns a tally grouped by effect id.
 *
 * Algorithm:
 *  1. `querySelectorAll('[class*="roycss-"]')` — fast native C++
 *     selector that narrows the candidate set.
 *  2. For each candidate, re-match the regex against the full class
 *     string to extract every `roycss-*` token (an element can carry
 *     more than one).
 *  3. Group by effect id; count occurrences and keep a sample path for
 *     each.
 *
 * Exported via `globalThis.__roycssScan` for unit testing in Node.
 */
function scan(root) {
  const rootEl = root || document;
  const t0 =
    typeof performance !== "undefined" && performance.now
      ? performance.now()
      : Date.now();

  const counts = new Map(); // id → { id, className, count, samples: [] }
  let total = 0;
  let candidates;
  try {
    candidates = rootEl.querySelectorAll('[class*="roycss-"]');
  } catch (_e) {
    return {
      ok: true,
      count: 0,
      uniqueEffectCount: 0,
      effects: [],
      durationMs: 0,
    };
  }

  for (let i = 0; i < candidates.length; i++) {
    const el = candidates[i];
    const cls = el.getAttribute("class");
    if (!cls) continue;
    ROYCSS_CLASS_RE.lastIndex = 0;
    let m;
    while ((m = ROYCSS_CLASS_RE.exec(cls)) !== null) {
      let id = m[1];
      if (id.length > MAX_ID_LEN) continue;
      total++;
      let entry = counts.get(id);
      if (!entry) {
        entry = { id: id, className: m[0], count: 0, samples: [] };
        counts.set(id, entry);
      }
      entry.count++;
      if (entry.samples.length < MAX_SAMPLES_PER_EFFECT) {
        entry.samples.push(buildSamplePath(el));
      }
    }
  }

  const t1 =
    typeof performance !== "undefined" && performance.now
      ? performance.now()
      : Date.now();

  const effects = Array.from(counts.values());
  // Sort by count desc, then by id asc — stable for the panel UI.
  effects.sort((a, b) => b.count - a.count || a.id.localeCompare(b.id));

  return {
    ok: true,
    count: total,
    uniqueEffectCount: effects.length,
    effects: effects,
    durationMs: Math.round(t1 - t0),
  };
}

/**
 * Build a short DOM path for an element. Used only for the `samplePath`
 * field in the scan result — helpful for debugging which element matched.
 *
 * Format: `HTML>BODY>DIV:nth-child(3)>BUTTON` (capped at 6 levels).
 * Contains only tag names and child indices — NO text content, NO
 * attributes other than `nth-child`. Safe to log.
 */
function buildSamplePath(el) {
  const parts = [];
  let node = el;
  let depth = 0;
  while (node && node.nodeType === 1 && depth < 6) {
    let part = node.tagName;
    if (node.parentElement) {
      const siblings = Array.prototype.filter.call(
        node.parentElement.children,
        (c) => c.tagName === node.tagName,
      );
      if (siblings.length > 1) {
        const idx = siblings.indexOf(node) + 1;
        part += `:nth-child(${idx})`;
      }
    }
    parts.unshift(part);
    node = node.parentElement;
    depth++;
  }
  return parts.join(">");
}

/**
 * Compute a stable signature for the current scan result, used to detect
 * whether a MutationObserver callback actually changed the set of
 * detected effect ids.
 */
function scanSignature(result) {
  return result.effects.map((e) => `${e.id}:${e.count}`).join("|");
}

/* ─── Highlight overlay ──────────────────────────────────────── */

/**
 * Ensure the Shadow DOM overlay root exists. Returns the shadow root.
 * Re-creates it if the host was removed by the page (defensive).
 */
function ensureOverlay() {
  if (overlayHost && overlayHost.isConnected && shadowRoot) {
    return shadowRoot;
  }
  // Remove any stale host (the page may have removed it).
  if (overlayHost && overlayHost.parentNode) {
    try {
      overlayHost.parentNode.removeChild(overlayHost);
    } catch (_e) {
      /* ignore */
    }
  }
  overlayHost = document.createElement("div");
  overlayHost.id = "roycss-inspector-root";
  // The host is invisible to layout — its children (inside the shadow
  // root) are position:fixed and pointer-events:none.
  overlayHost.style.cssText =
    "all:initial;position:static;width:0;height:0;overflow:visible;";
  (document.documentElement || document.body).appendChild(overlayHost);
  shadowRoot = overlayHost.attachShadow({ mode: "closed" });
  const style = document.createElement("style");
  style.textContent = `
    .roycss-hl {
      position: fixed;
      pointer-events: none;
      z-index: 2147483646;
      box-sizing: border-box;
      border: 2px solid oklch(0.62 0.24 264);
      border-radius: 4px;
      background: oklch(0.62 0.24 264 / 0.10);
      transition: opacity 120ms ease-in-out;
    }
    .roycss-hl__label {
      position: fixed;
      pointer-events: none;
      z-index: 2147483647;
      font: 600 11px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace;
      color: #fff;
      background: oklch(0.62 0.24 264);
      padding: 2px 6px;
      border-radius: 3px;
      max-width: 220px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      box-shadow: 0 1px 3px rgba(0,0,0,0.35);
    }
  `;
  shadowRoot.appendChild(style);
  return shadowRoot;
}

/**
 * Highlight every element matching `.roycss-<id>`. Caps at
 * MAX_HIGHLIGHTS elements.
 *
 * Returns { count, highlighted } so the caller (the panel) can show
 * "highlighted N of M" if M > MAX_HIGHLIGHTS.
 */
function highlight(effectId) {
  if (!effectId || typeof effectId !== "string" || effectId.length > MAX_ID_LEN) {
    return { ok: false, error: "invalid-effect-id" };
  }
  clearHighlight();
  const root = ensureOverlay();
  const selector = `.roycss-${CSS.escape(effectId)}`;
  let matches = [];
  try {
    matches = Array.prototype.slice.call(document.querySelectorAll(selector));
  } catch (_e) {
    matches = [];
  }
  const total = matches.length;
  const capped = matches.slice(0, MAX_HIGHLIGHTS);

  // Listen for scroll/resize to reposition labels. We attach the listener
  // lazily and remove it on clearHighlight.
  const reposition = () => positionHighlights(root);
  reposition();
  window.addEventListener("scroll", reposition, { passive: true });
  window.addEventListener("resize", reposition);
  // Stash the listener so clearHighlight can remove it.
  root._reposition = reposition;

  return { ok: true, count: total, highlighted: capped.length };
}

/**
 * Reposition every highlight div + label to match its target element's
 * current bounding rect. Called on scroll/resize and after the initial
 * highlight render.
 */
function positionHighlights(root) {
  const highs = root.querySelectorAll(".roycss-hl");
  const labels = root.querySelectorAll(".roycss-hl__label");
  for (let i = 0; i < highs.length; i++) {
    const target = highs[i]._target;
    if (!target || !target.isConnected) continue;
    const r = target.getBoundingClientRect();
    highs[i].style.cssText = `position:fixed;pointer-events:none;z-index:2147483646;box-sizing:border-box;border:2px solid oklch(0.62 0.24 264);border-radius:4px;background:oklch(0.62 0.24 264 / 0.10);left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;`;
    if (labels[i]) {
      labels[i].style.cssText = `position:fixed;pointer-events:none;z-index:2147483647;font:600 11px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;color:#fff;background:oklch(0.62 0.24 264);padding:2px 6px;border-radius:3px;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,0.35);left:${r.left}px;top:${Math.max(r.top - 22, 0)}px;`;
    }
  }
}

/** Remove all highlight divs (keeps the root + shadow + style). */
function clearHighlight() {
  if (shadowRoot && shadowRoot._reposition) {
    window.removeEventListener("scroll", shadowRoot._reposition);
    window.removeEventListener("resize", shadowRoot._reposition);
    shadowRoot._reposition = null;
  }
  if (!shadowRoot) return;
  const highs = shadowRoot.querySelectorAll(".roycss-hl, .roycss-hl__label");
  for (let i = 0; i < highs.length; i++) {
    highs[i].remove();
  }
}

/**
 * Internal: render the highlight divs for the current `highlight()` call.
 * Called by `highlight()` after `clearHighlight()`.
 */
function _renderHighlights(root, matches, effectId) {
  for (let i = 0; i < matches.length; i++) {
    const target = matches[i];
    const r = target.getBoundingClientRect();
    const hl = document.createElement("div");
    hl.className = "roycss-hl";
    hl._target = target;
    hl.style.cssText = `position:fixed;pointer-events:none;z-index:2147483646;box-sizing:border-box;border:2px solid oklch(0.62 0.24 264);border-radius:4px;background:oklch(0.62 0.24 264 / 0.10);left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;`;
    root.appendChild(hl);

    const label = document.createElement("div");
    label.className = "roycss-hl__label";
    label.textContent = `roycss-${effectId}`;
    label.style.cssText = `position:fixed;pointer-events:none;z-index:2147483647;font:600 11px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;color:#fff;background:oklch(0.62 0.24 264);padding:2px 6px;border-radius:3px;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,0.35);left:${r.left}px;top:${Math.max(r.top - 22, 0)}px;`;
    root.appendChild(label);
  }
}

// Monkey-patch: actually call _renderHighlights inside highlight() —
// we kept highlight() above simple for readability, but the render call
// must happen between clearHighlight() and the reposition listener
// being wired. Re-implement highlight() to use _renderHighlights.
const _origHighlight = highlight;
function highlightImpl(effectId) {
  if (!effectId || typeof effectId !== "string" || effectId.length > MAX_ID_LEN) {
    return { ok: false, error: "invalid-effect-id" };
  }
  clearHighlight();
  const root = ensureOverlay();
  const selector = `.roycss-${CSS.escape(effectId)}`;
  let matches = [];
  try {
    matches = Array.prototype.slice.call(document.querySelectorAll(selector));
  } catch (_e) {
    matches = [];
  }
  const total = matches.length;
  const capped = matches.slice(0, MAX_HIGHLIGHTS);
  _renderHighlights(root, capped, effectId);

  const reposition = () => positionHighlights(root);
  window.addEventListener("scroll", reposition, { passive: true });
  window.addEventListener("resize", reposition);
  root._reposition = reposition;

  return { ok: true, count: total, highlighted: capped.length };
}
// Replace the exported `highlight` symbol.
highlight = highlightImpl;

/* ─── MutationObserver ───────────────────────────────────────── */

function attachMutationObserver() {
  if (observer) observer.disconnect();
  observer = new MutationObserver(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      runScanAndMaybeBroadcast(true);
    }, MUTATION_DEBOUNCE_MS);
  });
  observer.observe(document.body || document.documentElement, {
    subtree: true,
    attributes: true,
    attributeFilter: ["class"],
    childList: true,
  });
}

/* ─── Scan + broadcast ───────────────────────────────────────── */

/**
 * Run a scan. If `broadcastOnChange` is true and the scan signature
 * differs from the last one, send a `scan-update` message to the
 * background service worker (which forwards to any open DevTools panel
 * or popup).
 */
function runScanAndMaybeBroadcast(broadcastOnChange) {
  if (scanning) return null;
  scanning = true;
  try {
    const result = scan(document);
    const sig = scanSignature(result);
    if (broadcastOnChange && sig !== lastScanSignature) {
      lastScanSignature = sig;
      try {
        chrome.runtime.sendMessage({
          type: "scan-update",
          count: result.count,
          uniqueEffectCount: result.uniqueEffectCount,
          effects: result.effects,
          durationMs: result.durationMs,
        });
      } catch (_e) {
        // Service worker evicted or no receiver — fine.
      }
    } else if (!broadcastOnChange) {
      lastScanSignature = sig;
    }
    return result;
  } finally {
    scanning = false;
  }
}

/* ─── Message listener ───────────────────────────────────────── */

function wireMessageListener() {
  if (typeof chrome === "undefined" || !chrome.runtime?.onMessage) return;
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message || typeof message.type !== "string") {
      sendResponse({ ok: false, error: "invalid-message" });
      return false;
    }
    switch (message.type) {
      case "scan": {
        const result = runScanAndMaybeBroadcast(false);
        // Attach the observer on first scan so future mutations broadcast.
        if (!observer) attachMutationObserver();
        sendResponse(result);
        return false;
      }
      case "highlight": {
        const result = highlight(message.effectId);
        sendResponse(result);
        return false;
      }
      case "clear-highlight": {
        clearHighlight();
        sendResponse({ ok: true });
        return false;
      }
      case "popup-stats": {
        const result = runScanAndMaybeBroadcast(false);
        // Top 5 by count (effects is already sorted by count desc).
        const top5 = (result?.effects || []).slice(0, 5).map((e) => ({
          id: e.id,
          className: e.className,
          count: e.count,
        }));
        sendResponse({
          ok: true,
          count: result?.count ?? 0,
          uniqueEffectCount: result?.uniqueEffectCount ?? 0,
          top5,
        });
        return false;
      }
      default: {
        sendResponse({ ok: false, error: "unhandled-type" });
        return false;
      }
    }
  });
}

/* ─── Cleanup ────────────────────────────────────────────────── */

function cleanup() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  clearHighlight();
  if (overlayHost && overlayHost.parentNode) {
    try {
      overlayHost.parentNode.removeChild(overlayHost);
    } catch (_e) {
      /* ignore */
    }
  }
  overlayHost = null;
  shadowRoot = null;
}

// `pagehide` fires on navigation; the content-script context dies anyway,
// but we clean up proactively so the overlay doesn't briefly persist.
if (typeof window !== "undefined" && window.addEventListener) {
  window.addEventListener("pagehide", cleanup, { once: true });
}

/* ─── Entry point ────────────────────────────────────────────── */

// Guard against running in non-extension contexts (e.g. the unit test
// imports `scan` from this file, where chrome.* is undefined).
if (typeof chrome !== "undefined" && chrome.runtime?.id) {
  wireMessageListener();
  // Do an initial scan so the MutationObserver has a baseline signature
  // to compare against. We don't broadcast — the panel/popup will ask.
  runScanAndMaybeBroadcast(false);
  attachMutationObserver();
}

/* ─── Exports for unit testing ───────────────────────────────── */

// In a Node test environment, expose the pure functions so they can be
// exercised against a stub DOM.
if (typeof globalThis !== "undefined") {
  globalThis.__roycssInspector = {
    scan,
    buildSamplePath,
    scanSignature,
    ROYCSS_CLASS_RE,
    MAX_HIGHLIGHTS,
    MAX_ID_LEN,
  };
}
