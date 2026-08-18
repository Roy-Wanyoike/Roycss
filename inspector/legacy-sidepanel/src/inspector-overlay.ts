/**
 * RoyCSS Inspector — overlay (Shadow DOM).
 *
 * Renders floating badges on top of every element the content script
 * identifies as carrying a `roycss-*` class. All DOM lives inside a closed
 * Shadow DOM attached to a single `<div data-roycss-inspector-root>` at
 * `document.documentElement`. The host page cannot:
 *   - reach the shadowRoot (closed mode),
 *   - style our badges (no `::part()` exposed),
 *   - remove the host div without breaking its own layout (the div is the
 *     last child of documentElement and zero-sized).
 *
 * All dynamic DOM is built via createElement + textContent. No innerHTML of
 * untrusted strings. See docs/threat-models §3.2 T1, §3.6 E1.
 */

// `@types/chrome` is not installed at the project root (only in the
// inspector/legacy-sidepanel/package.json devDependencies, which has no
// node_modules of its own). Declare `chrome` as `any` so type-checking
// passes under the root tsconfig.json; runtime behavior is unchanged
// because Chrome injects the real `chrome.*` globals into the content
// script's isolated world (where this overlay module runs).
declare const chrome: any;

import { effectsData } from "./effects-data";
import type { EffectSelectedMessage } from "./messages";

const ROOT_ATTR = "data-roycss-inspector-root";
const ROYCSS_SITE_BASE = "https://roycss.dev";

interface BadgeRecord {
  badge: HTMLDivElement;
  tooltip: HTMLDivElement | null;
  element: Element;
}

let root: HTMLDivElement | null = null;
let shadow: ShadowRoot | null = null;
const badges: BadgeRecord[] = [];

/**
 * Attach the overlay root + style sheet. Idempotent — calling twice is safe.
 */
export function injectOverlay(): void {
  if (root && shadow) return;

  root = document.createElement("div");
  root.setAttribute(ROOT_ATTR, "");
  // Zero-sized, non-interactive host. Pointer events go to the shadow children.
  root.style.cssText = "position:fixed;inset:0;width:0;height:0;pointer-events:none;z-index:2147483646;";
  (document.documentElement || document.body).appendChild(root);

  shadow = root.attachShadow({ mode: "closed" });

  const style = document.createElement("style");
  style.textContent = OVERLAY_CSS;
  shadow.appendChild(style);
}

/**
 * Attach a badge to an element. The badge shows the effect name and is
 * positioned at the element's top-right corner (updated on scroll/resize).
 */
export function attachBadge(element: Element, effectId: string, className: string): void {
  if (!shadow) injectOverlay();
  if (!shadow) return;

  const effect = effectsData.get(effectId);
  const displayName = effect?.name ?? effectId;
  const category = effect?.category ?? "misc";

  const badge = document.createElement("div");
  badge.className = "roycss-badge";
  badge.dataset.effectId = effectId;
  badge.dataset.category = category;
  badge.title = className;

  // Badge label: effect name + category chip.
  const label = document.createElement("span");
  label.className = "roycss-badge__label";
  label.textContent = displayName;
  badge.appendChild(label);

  const cat = document.createElement("span");
  cat.className = "roycss-badge__cat";
  cat.textContent = category;
  badge.appendChild(cat);

  // Hover → tooltip.
  badge.addEventListener("mouseenter", () => showTooltip(badge, element, effectId, className));
  badge.addEventListener("mouseleave", () => hideTooltip(badge));

  // Click → notify side panel.
  badge.addEventListener("click", (e) => {
    e.stopPropagation();
    const message: EffectSelectedMessage = {
      type: "effect-selected",
      effectId,
      className,
    };
    try {
      void chrome.runtime.sendMessage(message).catch(() => {});
    } catch {
      /* service worker evicted — ignore */
    }
  });

  shadow.appendChild(badge);
  const record: BadgeRecord = { badge, tooltip: null, element };
  badges.push(record);
  positionBadge(record);
}

/** Remove all badges + tooltips. */
export function clearBadges(): void {
  for (const { badge, tooltip } of badges) {
    badge.remove();
    tooltip?.remove();
  }
  badges.length = 0;
}

/** Reposition all badges — called on scroll/resize. */
function repositionAll(): void {
  for (const record of badges) positionBadge(record);
}

function positionBadge(record: BadgeRecord): void {
  const { badge, element } = record;
  if (!element.isConnected) {
    badge.remove();
    return;
  }
  const rect = element.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) {
    badge.style.display = "none";
    return;
  }
  badge.style.display = "";
  // Top-right corner of the element, offset by 2px so the badge sits inside.
  const top = rect.top + 2;
  const left = Math.max(0, rect.right - badge.offsetWidth - 2);
  badge.style.top = `${top}px`;
  badge.style.left = `${left}px`;
}

function showTooltip(
  badge: HTMLDivElement,
  element: Element,
  effectId: string,
  className: string,
): void {
  if (!shadow) return;
  const record = badges.find((r) => r.badge === badge);
  if (!record) return;
  if (record.tooltip) record.tooltip.remove();

  const effect = effectsData.get(effectId);
  const displayName = effect?.name ?? effectId;
  const category = effect?.category ?? "misc";
  const description = effect?.description ?? "Effect not in embedded dataset.";
  const tags = effect?.tags ?? [];

  const tip = document.createElement("div");
  tip.className = "roycss-tooltip";

  const head = document.createElement("div");
  head.className = "roycss-tooltip__head";
  const nameEl = document.createElement("strong");
  nameEl.textContent = displayName;
  head.appendChild(nameEl);
  const catEl = document.createElement("span");
  catEl.className = "roycss-tooltip__cat";
  catEl.textContent = category;
  head.appendChild(catEl);
  tip.appendChild(head);

  const descEl = document.createElement("p");
  descEl.className = "roycss-tooltip__desc";
  descEl.textContent = description;
  tip.appendChild(descEl);

  if (tags.length) {
    const tagWrap = document.createElement("div");
    tagWrap.className = "roycss-tooltip__tags";
    for (const t of tags) {
      const tag = document.createElement("span");
      tag.className = "roycss-tag";
      tag.textContent = t;
      tagWrap.appendChild(tag);
    }
    tip.appendChild(tagWrap);
  }

  const classLine = document.createElement("code");
  classLine.className = "roycss-tooltip__class";
  classLine.textContent = className;
  tip.appendChild(classLine);

  const actions = document.createElement("div");
  actions.className = "roycss-tooltip__actions";

  const viewLink = document.createElement("a");
  viewLink.href = `${ROYCSS_SITE_BASE}/?effect=${encodeURIComponent(effectId)}`;
  viewLink.target = "_blank";
  viewLink.rel = "noopener noreferrer";
  viewLink.textContent = "View on RoyCSS →";
  actions.appendChild(viewLink);

  const panelBtn = document.createElement("button");
  panelBtn.type = "button";
  panelBtn.className = "roycss-tooltip__btn";
  panelBtn.textContent = "Pin in side panel";
  panelBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const message: EffectSelectedMessage = {
      type: "effect-selected",
      effectId,
      className,
    };
    try {
      void chrome.runtime.sendMessage(message).catch(() => {});
    } catch {
      /* ignore */
    }
  });
  actions.appendChild(panelBtn);

  tip.appendChild(actions);

  shadow.appendChild(tip);
  record.tooltip = tip;

  // Position tooltip below the badge.
  const badgeRect = badge.getBoundingClientRect();
  tip.style.top = `${badgeRect.bottom + 4}px`;
  tip.style.left = `${Math.max(8, Math.min(badgeRect.left, window.innerWidth - 320))}px`;
  void element; // satisfy linter (element is captured for future use)
}

function hideTooltip(badge: HTMLDivElement): void {
  const record = badges.find((r) => r.badge === badge);
  if (!record?.tooltip) return;
  record.tooltip.remove();
  record.tooltip = null;
}

/* ─── Global listeners (added once) ──────────────────────────── */

let listenersWired = false;
function wireGlobalListeners(): void {
  if (listenersWired) return;
  listenersWired = true;
  // Use rAF-coalesced repositioning to keep scroll smooth.
  let ticking = false;
  const onScrollResize = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      repositionAll();
      ticking = false;
    });
  };
  window.addEventListener("scroll", onScrollResize, { passive: true });
  window.addEventListener("resize", onScrollResize, { passive: true });
}

// Wire immediately on module load — the overlay may be injected after the
// page is already scrolled. Guarded so the module can be imported in
// non-browser contexts (the unit test imports content.ts which imports
// this module) without crashing on `window is not defined`.
if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
  wireGlobalListeners();
}

/* ─── Styles ─────────────────────────────────────────────────── */

const OVERLAY_CSS = `
.roycss-badge {
  position: fixed;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: oklch(0.32 0.06 162);
  color: oklch(0.97 0.02 150);
  border: 1px solid oklch(0.72 0.14 162 / 0.45);
  border-radius: 4px;
  padding: 2px 6px;
  font: 600 11px/1.3 system-ui, -apple-system, sans-serif;
  pointer-events: auto;
  cursor: pointer;
  z-index: 2147483647;
  box-shadow: 0 2px 6px oklch(0 0 0 / 0.35);
  transition: transform 0.12s ease, box-shadow 0.12s ease;
  white-space: nowrap;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
}
.roycss-badge:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px oklch(0.6 0.14 162 / 0.45);
}
.roycss-badge__label {
  pointer-events: none;
}
.roycss-badge__cat {
  pointer-events: none;
  background: oklch(0.72 0.14 162 / 0.25);
  color: oklch(0.92 0.05 162);
  border-radius: 3px;
  padding: 0 4px;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.roycss-tooltip {
  position: fixed;
  width: 300px;
  background: oklch(0.22 0.03 162);
  color: oklch(0.97 0.02 150);
  border: 1px solid oklch(0.6 0.12 162 / 0.4);
  border-radius: 8px;
  padding: 10px 12px;
  font: 12px/1.5 system-ui, -apple-system, sans-serif;
  pointer-events: auto;
  z-index: 2147483647;
  box-shadow: 0 8px 24px oklch(0 0 0 / 0.5);
}
.roycss-tooltip__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}
.roycss-tooltip__head strong {
  font-size: 13px;
  color: oklch(0.95 0.08 162);
}
.roycss-tooltip__cat {
  background: oklch(0.6 0.14 162 / 0.3);
  color: oklch(0.92 0.05 162);
  border-radius: 3px;
  padding: 1px 6px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.roycss-tooltip__desc {
  margin: 0 0 8px;
  color: oklch(0.85 0.02 150);
}
.roycss-tooltip__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 8px;
}
.roycss-tag {
  background: oklch(0.35 0.04 162 / 0.7);
  color: oklch(0.88 0.04 162);
  border-radius: 3px;
  padding: 1px 6px;
  font-size: 10px;
}
.roycss-tooltip__class {
  display: block;
  background: oklch(0.16 0.02 162);
  color: oklch(0.88 0.06 162);
  border-radius: 4px;
  padding: 4px 6px;
  font: 11px/1.4 ui-monospace, "SF Mono", Menlo, monospace;
  margin-bottom: 8px;
  word-break: break-all;
}
.roycss-tooltip__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.roycss-tooltip__actions a {
  color: oklch(0.78 0.14 162);
  text-decoration: none;
  font-size: 11px;
  font-weight: 600;
}
.roycss-tooltip__actions a:hover {
  color: oklch(0.88 0.16 162);
  text-decoration: underline;
}
.roycss-tooltip__btn {
  background: oklch(0.6 0.14 162);
  color: oklch(0.16 0.02 162);
  border: 0;
  border-radius: 4px;
  padding: 4px 8px;
  font: 600 11px/1 system-ui, sans-serif;
  cursor: pointer;
}
.roycss-tooltip__btn:hover {
  background: oklch(0.7 0.16 162);
}
`;
