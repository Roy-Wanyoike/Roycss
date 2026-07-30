/**
 * RoyCSS Inspector — content script.
 *
 * Injected on demand by the background service worker (chrome.scripting.
 * executeScript) when the user clicks the toolbar icon. Runs in the
 * isolated world — same DOM as the page, separate JS context.
 *
 * Responsibilities:
 *  1. Check the persisted `inspectorEnabled` toggle. Exit if disabled.
 *  2. Inject the Shadow-DOM overlay (inspector-overlay.ts).
 *  3. Scan the document for elements whose `class` attribute contains a
 *     `roycss-*` token.
 *  4. Attach a badge to each matched element (capped at MAX_BADGES).
 *  5. Wire up a MutationObserver to catch dynamically-added matches.
 *  6. Listen for messages from the popup (rescan, toggle, get-scan).
 *
 * Security: this script reads ONLY `element.getAttribute("class")`. No other
 * attribute, no innerText, no outerHTML. See docs/threat-models §3.4 I1.
 */

/// <reference types="chrome" />

import { injectOverlay, attachBadge, clearBadges } from "./inspector-overlay";
import type {
  GetScanMessage,
  RescanMessage,
  ScanCompleteMessage,
  ToggleMessage,
} from "./messages";

const STORAGE_KEY = "inspectorEnabled";
const MAX_BADGES = 200;
const MUTATION_DEBOUNCE_MS = 50;

/** Matches a single `roycss-<id>` token inside a class attribute. Capture
 *  group 1 is the effect id (e.g. "pulse-glow"). */
const ROYCSS_CLASS_RE = /\broycss-([a-z0-9][a-z0-9-]*)\b/g;

export interface DetectedEffect {
  element: Element;
  effectId: string;
  /** Literal class token (e.g. "roycss-pulse-glow") — shown verbatim on badge. */
  className: string;
}

/**
 * Scan `root` for elements whose class attribute contains `roycss-*` tokens.
 *
 * Exported (and pure — no chrome.* calls) so the unit test can exercise it
 * against a fake DOM without booting the rest of the content script.
 *
 * Algorithm:
 *  1. `querySelectorAll('[class*="roycss-"]')` — a fast C++ selector that
 *     narrows the candidate set to elements whose class attribute literally
 *     contains the substring "roycss-".
 *  2. For each candidate, re-match the regex against the full class string
 *     to extract every `roycss-*` token (an element can carry more than one).
 */
export function detectRoyCssClasses(root: ParentNode = document): DetectedEffect[] {
  const out: DetectedEffect[] = [];
  // The selector is the perf bottleneck on huge DOMs; querySelectorAll is
  // native C++ and returns a static NodeList (no live re-query cost).
  let candidates: NodeListOf<Element>;
  try {
    candidates = root.querySelectorAll('[class*="roycss-"]');
  } catch {
    return out;
  }

  for (let i = 0; i < candidates.length; i++) {
    const el = candidates[i];
    const cls = el.getAttribute("class");
    if (!cls) continue;
    ROYCSS_CLASS_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = ROYCSS_CLASS_RE.exec(cls)) !== null) {
      const effectId = m[1];
      out.push({
        element: el,
        effectId,
        className: m[0],
      });
    }
  }
  return out;
}

/* ─── State ──────────────────────────────────────────────────── */

let overlayReady = false;
let enabled = true;
let observer: MutationObserver | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
/** Tracks elements we've already badged so we don't double-badge on
 *  MutationObserver callbacks. WeakSet → no leak when elements are GC'd.
 *  Reassigned (not mutated) on each scan so a fresh WeakSet starts tracking
 *  from scratch after clearBadges() wipes the overlay. */
let badgedElements = new WeakSet<Element>();

/* ─── Main entry ─────────────────────────────────────────────── */

// Guard against running in non-extension contexts (e.g. the unit test
// imports detectRoyCssClasses from this file, where chrome.* is undefined).
// The IIFE only fires when chrome.runtime is present — i.e. when this file
// is actually loaded as a content script by Chrome.
if (typeof chrome !== "undefined" && chrome.runtime?.id) {
  (async function main(): Promise<void> {
    const stored = await chrome.storage.local.get(STORAGE_KEY);
    enabled = stored[STORAGE_KEY] !== false; // default true
    if (!enabled) {
      // Even when disabled, we listen for a `toggle` message so the popup
      // can wake us up without a page reload.
      wireMessageListener();
      return;
    }

    await startInspector();
    wireMessageListener();
  })();
}

async function startInspector(): Promise<void> {
  if (!overlayReady) {
    injectOverlay();
    overlayReady = true;
  }
  runScan();
  attachMutationObserver();
}

function runScan(): void {
  const t0 = (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
  clearBadges();
  badgedElements = new WeakSet(); // reset tracking (clearBadges wiped the badges)

  const detected = detectRoyCssClasses(document);
  const capped = detected.slice(0, MAX_BADGES);
  for (const { element, effectId, className } of capped) {
    if (badgedElements.has(element)) {
      // We've already attached a badge to this element for a different
      // effect token. Skip — one badge per element keeps the UI clean.
      continue;
    }
    attachBadge(element, effectId, className);
    badgedElements.add(element);
  }

  const t1 = (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
  const durationMs = Math.round(t1 - t0);

  // Build a top-10 list for the popup. We pick the first 10 distinct effect
  // ids in document order — simple and deterministic.
  const seen = new Set<string>();
  const topEffects: Array<{ effectId: string; className: string }> = [];
  for (const { effectId, className } of detected) {
    if (seen.has(effectId)) continue;
    seen.add(effectId);
    topEffects.push({ effectId, className });
    if (topEffects.length >= 10) break;
  }

  const message: ScanCompleteMessage = {
    type: "scan-complete",
    count: detected.length,
    durationMs,
    topEffects,
  };

  // Send to the background worker, which broadcasts to popup + side panel.
  try {
    void chrome.runtime.sendMessage(message).catch(() => {
      // No receiver — popup and side panel both closed. That's fine; the
      // scan still ran and the badges are visible on the page.
    });
  } catch {
    // Service worker evicted — also fine.
  }
}

/* ─── MutationObserver ───────────────────────────────────────── */

function attachMutationObserver(): void {
  if (observer) observer.disconnect();
  observer = new MutationObserver(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      runScan();
    }, MUTATION_DEBOUNCE_MS);
  });
  observer.observe(document.body ?? document.documentElement, {
    subtree: true,
    attributes: true,
    attributeFilter: ["class"],
  });
}

/* ─── Message listener ───────────────────────────────────────── */

function wireMessageListener(): void {
  chrome.runtime.onMessage.addListener(
    (
      message: GetScanMessage | RescanMessage | ToggleMessage,
      _sender,
      sendResponse,
    ) => {
      if (!message || typeof message.type !== "string") {
        sendResponse({ ok: false });
        return false;
      }
      switch (message.type) {
        case "get-scan": {
          // The popup is asking for current state. Trigger a fresh scan
          // (cheap — usually <100ms) so the popup shows live data.
          runScan();
          sendResponse({ ok: true, enabled });
          return false;
        }
        case "rescan": {
          runScan();
          sendResponse({ ok: true });
          return false;
        }
        case "toggle": {
          enabled = message.enabled;
          void chrome.storage.local.set({ [STORAGE_KEY]: enabled });
          if (enabled) {
            void startInspector();
          } else {
            if (observer) {
              observer.disconnect();
              observer = null;
            }
            clearBadges();
          }
          sendResponse({ ok: true });
          return false;
        }
        default: {
          sendResponse({ ok: false });
          return false;
        }
      }
    },
  );
}
