/**
 * RoyCSS Inspector — DevTools page.
 *
 * Runs in the DevTools page context (loaded from devtools.html). Has
 * access to chrome.devtools.panels.create. Creates the "RoyCSS" panel
 * that lives next to Elements / Network / Sources.
 *
 * This file does NOT do any scanning or DOM access — it just registers
 * the panel. All panel logic lives in panel.html + panel.js.
 */

chrome.devtools.panels.create(
  "RoyCSS",
  "icons/icon16.png",
  "panel.html",
  (panel) => {
    // `panel` is a chrome.devtools.panels.ExtensionPanel. We could
    // subscribe to panel.onShown / onHidden here to defer work, but the
    // panel.js script handles its own lifecycle via DOMContentLoaded,
    // so we don't need to.
    console.debug("[RoyCSS Inspector] DevTools panel registered", panel);
  },
);
