/**
 * RoyCSS Inspector — background service worker (Manifest V3).
 *
 * Responsibilities:
 *  1. On install, set default state (inspectorEnabled = true) and configure
 *     the side panel to open on action click.
 *  2. On action click: open the side panel (Chrome 114+). The popup is the
 *     fallback surface — when `setPanelBehavior({ openPanelOnActionClick })`
 *     is true, the popup is *not* shown; instead the side panel opens. Users
 *     can still right-click the toolbar icon to open the popup if they prefer.
 *  3. Inject the content script into the active tab on the first action click
 *     per tab. `activeTab` permission scopes this to the tab the user invoked
 *     the extension on.
 *  4. Route messages between content script ↔ popup ↔ side panel.
 *
 * No long-lived state. The service worker may be evicted by Chrome after 30s
 * of inactivity; the content script is the source of truth for scan state.
 */

// `@types/chrome` is not installed at the project root (only in the
// inspector/legacy-sidepanel/package.json devDependencies, which has no
// node_modules of its own). Declare `chrome` as `any` so type-checking
// passes under the root tsconfig.json; runtime behavior is unchanged
// because Chrome injects the real `chrome.*` globals into the extension
// service worker.
declare const chrome: any;

import type { InspectorMessage } from "./messages";

const STORAGE_KEY = "inspectorEnabled";
const DEFAULT_ENABLED = true;

/** List of tab ids that already have the content script injected. */
const injectedTabs = new Set<number>();

/* ─── Lifecycle ──────────────────────────────────────────────── */

chrome.runtime.onInstalled.addListener(async () => {
  // Initialize default state if not already set.
  const current = await chrome.storage.local.get(STORAGE_KEY);
  if (current[STORAGE_KEY] === undefined) {
    await chrome.storage.local.set({ [STORAGE_KEY]: DEFAULT_ENABLED });
  }

  // Configure side panel to open on action click.
  if (chrome.sidePanel?.setPanelBehavior) {
    try {
      await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
    } catch (err) {
      // setPanelBehavior can throw on Chrome <114 or in contexts without a
      // window. Fail silently — the popup fallback still works.
      console.debug("[Inspector] sidePanel.setPanelBehavior failed:", err);
    }
  }
});

/* ─── Action click → inject content script ──────────────────── */

chrome.action.onClicked.addListener(async (tab) => {
  if (tab.id == null) return;
  await ensureContentScriptInjected(tab.id);
});

async function ensureContentScriptInjected(tabId: number): Promise<void> {
  if (injectedTabs.has(tabId)) return;
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["src/content.js"],
    });
    injectedTabs.add(tabId);
  } catch (err) {
    // Common cause: the tab is on a chrome:// URL or a Web Store page where
    // content scripts are not allowed. Fail silently — the popup will show
    // a friendly "Inspector cannot run on this page" message.
    console.debug("[Inspector] content script injection failed:", err);
  }
}

// Clean up the injected-tabs set when a tab is closed.
chrome.tabs.onRemoved.addListener((tabId) => {
  injectedTabs.delete(tabId);
});

/* ─── Message routing ───────────────────────────────────────── */

chrome.runtime.onMessage.addListener(
  (message: InspectorMessage, _sender, sendResponse) => {
    // Validate the message type against the known union. Unknown types are
    // dropped silently — a malicious sender cannot crash the worker.
    if (!message || typeof message.type !== "string") {
      sendResponse({ ok: false, error: "invalid-message" });
      return false;
    }

    switch (message.type) {
      case "scan-complete": {
        // Forward to any open popup / side panel. Both listen on
        // chrome.runtime.onMessage and filter by type.
        broadcast(message, "scan-complete");
        sendResponse({ ok: true });
        return false;
      }
      case "effect-selected": {
        // The content script selected an effect via badge click.
        // Open the side panel (if not already open) and broadcast.
        void openSidePanel();
        broadcast(message, "effect-selected");
        sendResponse({ ok: true });
        return false;
      }
      case "open-side-panel": {
        void openSidePanel();
        sendResponse({ ok: true });
        return false;
      }
      case "get-scan": {
        // The popup is asking the content script for current scan state.
        // Forward to the active tab's content script.
        forwardToActiveTab(message).then((result) => {
          sendResponse(result ?? { ok: false, error: "no-active-tab" });
        });
        return true; // keep the sendResponse channel open for the async forward
      }
      case "rescan":
      case "toggle": {
        forwardToActiveTab(message).then((result) => {
          sendResponse(result ?? { ok: false, error: "no-active-tab" });
        });
        return true;
      }
      default: {
        // Exhaustiveness check — if the union grows, TypeScript will complain
        // that this default branch is unreachable for the unhandled type.
        const _exhaustive: never = message;
        void _exhaustive;
        sendResponse({ ok: false, error: "unhandled-type" });
        return false;
      }
    }
  },
);

/** Broadcast a message to all extension contexts (popup + side panel). */
function broadcast(message: InspectorMessage, _tag: string): void {
  // chrome.runtime.sendMessage delivers to every listener in the extension
  // *except* the sender. The popup and side panel each register a listener.
  try {
    void chrome.runtime.sendMessage(message).catch(() => {
      // No receiver — popup and side panel both closed. That's fine.
    });
  } catch (err) {
    console.debug("[Inspector] broadcast failed:", err);
  }
}

/** Forward a message to the active tab's content script. */
async function forwardToActiveTab(
  message: InspectorMessage,
): Promise<unknown> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return undefined;
  try {
    return await chrome.tabs.sendMessage(tab.id, message);
  } catch (err) {
    // Content script not yet injected — try injecting then re-sending.
    console.debug("[Inspector] forward failed, injecting:", err);
    await ensureContentScriptInjected(tab.id);
    return await chrome.tabs.sendMessage(tab.id, message);
  }
}

/** Open the side panel for the current window. */
async function openSidePanel(): Promise<void> {
  if (!chrome.sidePanel?.open) return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.windowId) return;
  try {
    await chrome.sidePanel.open({ windowId: tab.windowId });
  } catch (err) {
    console.debug("[Inspector] sidePanel.open failed:", err);
  }
}
