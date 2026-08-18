/**
 * RoyCSS Inspector — popup logic.
 *
 * The popup is the lightweight status surface. It:
 *  1. Shows the current scan count (forwarded from the content script via
 *     the background service worker).
 *  2. Lists up to 10 detected effects with click-to-pin-in-side-panel.
 *  3. Toggles the Inspector on/off (persisted to chrome.storage.local).
 *  4. Triggers a manual rescan.
 *  5. Opens the side panel (deep inspector surface).
 *
 * The popup is destroyed by Chrome every time it closes; every open is a
 * cold start. Target: <200ms cold start (see docs/benchmarks).
 */

// `@types/chrome` is not installed at the project root (only in the
// inspector/legacy-sidepanel/package.json devDependencies, which has no
// node_modules of its own). Declare `chrome` as `any` so type-checking
// passes under the root tsconfig.json; runtime behavior is unchanged
// because Chrome injects the real `chrome.*` globals into the popup.
declare const chrome: any;

import { effectsData } from "./effects-data";
import type {
  EffectSelectedMessage,
  GetScanMessage,
  OpenSidePanelMessage,
  RescanMessage,
  ScanCompleteMessage,
  ToggleMessage,
} from "./messages";

const STORAGE_KEY = "inspectorEnabled";

const $ = <T extends HTMLElement = HTMLElement>(sel: string): T =>
  document.querySelector(sel) as T;

function init(): void {
  const toggle = $<HTMLInputElement>("#inspector-toggle");
  const rescanBtn = $<HTMLButtonElement>("#rescan-btn");
  const openPanelBtn = $<HTMLButtonElement>("#open-panel-btn");
  const list = $<HTMLUListElement>("#effect-list");
  const countEl = $<HTMLDivElement>("#scan-count");

  /* ─── Restore toggle state ──────────────────────────────────── */
  chrome.storage.local.get(STORAGE_KEY).then((stored) => {
    toggle.checked = stored[STORAGE_KEY] !== false;
  });

  toggle.addEventListener("change", () => {
    const message: ToggleMessage = {
      type: "toggle",
      enabled: toggle.checked,
    };
    void chrome.storage.local.set({ [STORAGE_KEY]: toggle.checked });
    // Forward to active tab's content script via the background worker.
    void chrome.runtime.sendMessage(message).catch(() => {
      // Tab might not have the content script yet — that's fine.
    });
  });

  rescanBtn.addEventListener("click", () => {
    const message: RescanMessage = { type: "rescan" };
    void chrome.runtime.sendMessage(message).catch(() => {});
    countEl.textContent = "…";
  });

  openPanelBtn.addEventListener("click", () => {
    const message: OpenSidePanelMessage = { type: "open-side-panel" };
    void chrome.runtime.sendMessage(message).catch(() => {});
  });

  /* ─── Listen for scan-complete broadcasts ───────────────────── */
  chrome.runtime.onMessage.addListener((message: ScanCompleteMessage) => {
    if (message?.type !== "scan-complete") return;
    renderScan(message);
  });

  /* ─── Request an initial scan ───────────────────────────────── */
  const getScan: GetScanMessage = { type: "get-scan" };
  void chrome.runtime.sendMessage(getScan).catch(() => {
    // The service worker may be evicted; the content script will broadcast
    // a scan-complete when it next runs.
  });

  function renderScan(scan: ScanCompleteMessage): void {
    countEl.textContent = String(scan.count);
    list.innerHTML = "";

    if (scan.topEffects.length === 0) {
      const li = document.createElement("li");
      li.className = "roycss-popup__empty";
      li.textContent = "No RoyCSS classes detected on this page.";
      list.appendChild(li);
      return;
    }

    for (const { effectId, className } of scan.topEffects) {
      const effect = effectsData.get(effectId);
      const li = document.createElement("li");
      li.className = "roycss-popup__item";
      li.tabIndex = 0;

      const name = document.createElement("span");
      name.className = "roycss-popup__item-name";
      name.textContent = effect?.name ?? effectId;
      li.appendChild(name);

      const cat = document.createElement("span");
      cat.className = "roycss-popup__item-cat";
      cat.textContent = effect?.category ?? "misc";
      li.appendChild(cat);

      const cls = document.createElement("code");
      cls.className = "roycss-popup__item-class";
      cls.textContent = className;
      li.appendChild(cls);

      const handleActivate = () => {
        const message: EffectSelectedMessage = {
          type: "effect-selected",
          effectId,
          className,
        };
        void chrome.runtime.sendMessage(message).catch(() => {});
      };
      li.addEventListener("click", handleActivate);
      li.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleActivate();
        }
      });

      list.appendChild(li);
    }
  }
}

document.addEventListener("DOMContentLoaded", init);
