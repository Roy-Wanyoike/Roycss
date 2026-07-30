/**
 * RoyCSS Inspector — background service worker (Manifest V3).
 *
 * Responsibilities:
 *  1. On install, initialize default UI state in chrome.storage.local.
 *  2. On panel connect (chrome.runtime.connect({ name: "panel" })),
 *     route scan / highlight / clear-highlight requests to the inspected
 *     tab's content script.
 *  3. On popup message (popup-stats), forward to the active tab's
 *     content script.
 *  4. Inject content-script.js on demand via chrome.scripting.executeScript.
 *  5. Forward scan-update broadcasts from content scripts to any open
 *     panel ports.
 *
 * Security:
 *  - No `eval`, no `new Function()`, no remote `fetch`.
 *  - Validates every message: `typeof message.type === "string"`.
 *  - Never passes user/page-provided strings to executeScript's `func`
 *    arg — only the static file `content-script.js` is injected.
 *
 * Lifecycle:
 *  - MV3 service workers can be evicted after 30s of inactivity. All
 *    state is re-derivable from chrome.storage.local or from the
 *    inspected page. No long-lived state in this file.
 */

/* ─── State ──────────────────────────────────────────────────── */

/** Set of tab ids that have the content script injected. Re-built on
 *  every service-worker cold start (Chrome evicts the worker after 30s
 *  of inactivity, so this set is naturally lossy — that's fine, we
 *  re-inject on demand). */
const injectedTabs = new Set();

/** Active panel ports, keyed by tab id. Each DevTools panel opens one
 *  port. We use this to broadcast scan-update messages from content
 *  scripts to the right panel(s). */
const panelPorts = new Map(); // tabId → Set<chrome.runtime.Port>

const DEFAULT_STORAGE = {
  // Empty default — the panel will populate this on first use. Kept
  // here so the storage schema is documented in one place.
  lastSelectedEffectId: "",
  searchQuery: "",
  collapsedCategories: [],
};

/* ─── Lifecycle ──────────────────────────────────────────────── */

chrome.runtime.onInstalled.addListener(async () => {
  // Initialize default UI state if not already set.
  const current = await chrome.storage.local.get(Object.keys(DEFAULT_STORAGE));
  const patch = {};
  for (const [k, v] of Object.entries(DEFAULT_STORAGE)) {
    if (current[k] === undefined) patch[k] = v;
  }
  if (Object.keys(patch).length > 0) {
    await chrome.storage.local.set(patch);
  }
});

/* ─── Panel port management ──────────────────────────────────── */

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "panel") return;

  // The panel sends its tab id in the first message after connecting.
  // We register the port once we know the tab id.
  let tabId = null;

  port.onMessage.addListener(async (message) => {
    if (!message || typeof message.type !== "string") {
      port.postMessage({ ok: false, error: "invalid-message" });
      return;
    }

    // First message must be `register` with the tab id.
    if (message.type === "register") {
      tabId = message.tabId;
      if (typeof tabId !== "number") {
        port.postMessage({ ok: false, error: "invalid-tab-id" });
        return;
      }
      if (!panelPorts.has(tabId)) panelPorts.set(tabId, new Set());
      panelPorts.get(tabId).add(port);
      port.postMessage({ ok: true });
      return;
    }

    // All other messages require the port to be registered first.
    if (tabId === null) {
      port.postMessage({ ok: false, error: "not-registered" });
      return;
    }

    switch (message.type) {
      case "scan-request": {
        try {
          await ensureContentScriptInjected(tabId);
          const result = await chrome.tabs.sendMessage(tabId, { type: "scan" });
          port.postMessage({ type: "scan-result", ...result });
        } catch (err) {
          port.postMessage({
            type: "scan-result",
            ok: false,
            error: "scan-failed",
            detail: String(err?.message || err),
          });
        }
        return;
      }
      case "highlight": {
        try {
          await ensureContentScriptInjected(tabId);
          const result = await chrome.tabs.sendMessage(tabId, {
            type: "highlight",
            effectId: message.effectId,
          });
          port.postMessage({ type: "highlight-result", ...result });
        } catch (err) {
          port.postMessage({
            type: "highlight-result",
            ok: false,
            error: "highlight-failed",
            detail: String(err?.message || err),
          });
        }
        return;
      }
      case "clear-highlight": {
        try {
          await chrome.tabs.sendMessage(tabId, { type: "clear-highlight" });
          port.postMessage({ type: "clear-highlight-result", ok: true });
        } catch (_err) {
          port.postMessage({ type: "clear-highlight-result", ok: true });
        }
        return;
      }
      default: {
        port.postMessage({ ok: false, error: "unhandled-type" });
      }
    }
  });

  port.onDisconnect.addListener(() => {
    if (tabId !== null && panelPorts.has(tabId)) {
      panelPorts.get(tabId).delete(port);
      if (panelPorts.get(tabId).size === 0) panelPorts.delete(tabId);
    }
  });
});

/* ─── Popup → content script (one-shot messages) ────────────── */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || typeof message.type !== "string") {
    sendResponse({ ok: false, error: "invalid-message" });
    return false;
  }

  if (message.type === "popup-stats") {
    // The popup is asking for quick stats from the active tab.
    forwardToActiveTab({ type: "popup-stats" })
      .then((result) => sendResponse(result ?? { ok: false, error: "no-active-tab" }))
      .catch(() => sendResponse({ ok: false, error: "forward-failed" }));
    return true; // keep sendResponse channel open for async
  }

  if (message.type === "scan-update") {
    // A content script detected a DOM change. Forward to the panel port
    // for that tab (if any). `sender.tab.id` is the tab the content
    // script runs in.
    const tabId = sender.tab?.id;
    if (tabId !== undefined && panelPorts.has(tabId)) {
      for (const port of panelPorts.get(tabId)) {
        try {
          port.postMessage({
            type: "scan-update",
            count: message.count,
            uniqueEffectCount: message.uniqueEffectCount,
            effects: message.effects,
            durationMs: message.durationMs,
          });
        } catch (_e) {
          // Port is dead — it will be cleaned up on disconnect.
        }
      }
    }
    return false;
  }

  // Unknown message types are dropped silently.
  return false;
});

/* ─── Content script injection ───────────────────────────────── */

async function ensureContentScriptInjected(tabId) {
  if (injectedTabs.has(tabId)) {
    // Even if we think we injected, the tab may have navigated since.
    // Verify with a ping; if it fails, re-inject.
    try {
      await chrome.tabs.sendMessage(tabId, { type: "ping" });
      return;
    } catch (_e) {
      // Fall through and re-inject.
      injectedTabs.delete(tabId);
    }
  }
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content-script.js"],
    });
    injectedTabs.add(tabId);
  } catch (err) {
    // Common cause: the tab is on a chrome:// URL or a Web Store page
    // where content scripts are not allowed. Re-throw so the caller can
    // show a friendly error.
    throw new Error(
      `cannot-inject: ${err?.message || "unknown error"}`,
    );
  }
}

async function forwardToActiveTab(message) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return undefined;
  try {
    return await chrome.tabs.sendMessage(tab.id, message);
  } catch (_err) {
    // Content script not yet injected — inject then re-send.
    await ensureContentScriptInjected(tab.id);
    return await chrome.tabs.sendMessage(tab.id, message);
  }
}

/* ─── Tab lifecycle ──────────────────────────────────────────── */

chrome.tabs.onRemoved.addListener((tabId) => {
  injectedTabs.delete(tabId);
  panelPorts.delete(tabId);
});

// If a tab navigates, the content script is gone — forget the cached
// injection state so the next scan re-injects.
chrome.tabs.onUpdated.addListener((tabId, change) => {
  if (change.status === "loading") {
    injectedTabs.delete(tabId);
  }
});

/* ─── Logging ────────────────────────────────────────────────── */

// Service workers don't have a long-lived console, but Chrome captures
// these in chrome://extensions → "Inspect views: service worker".
console.debug("[RoyCSS Inspector] background service worker ready");
