/**
 * RoyCSS Inspector — DevTools panel logic.
 *
 * Lifecycle:
 *  1. DOMContentLoaded → fetch effects.json (bundled), build Map<id, Effect>.
 *  2. Open a long-lived port to the background service worker:
 *       chrome.runtime.connect({ name: "panel" })
 *     Send `register` with chrome.devtools.inspectedWindow.tabId.
 *  3. Send `scan-request`. Background injects content-script.js into the
 *     inspected tab and forwards the scan result back.
 *  4. Render category sections in canonical RoyCSS category order.
 *  5. On effect row click → send `highlight`, open detail pane.
 *  6. On search input → filter visible rows.
 *  7. On `scan-update` (MutationObserver) → re-render counts in place.
 *  8. On detail "Copy CSS" button → navigator.clipboard.writeText.
 *  9. On detail "Close" button → hide pane, send clear-highlight.
 *
 * Security:
 *  - All effect metadata is rendered via textContent (no innerHTML of
 *    untrusted strings).
 *  - The only fetch is chrome.runtime.getURL("effects.json") — a
 *    same-extension resource.
 *  - No eval, no Function() constructor, no remote URLs.
 */

/* ─── Constants ──────────────────────────────────────────────── */

/** Canonical RoyCSS category order (mirrors src/lib/roycss-types.ts
 *  categoryOrder). Effects whose category is not in this list sort to
 *  the bottom under "Misc". */
const CATEGORY_ORDER = [
  "animations",
  "hover",
  "text",
  "backgrounds",
  "loaders",
  "3d-transforms",
  "buttons",
  "cards",
  "borders",
  "filters",
  "forms",
  "navigation",
  "scroll",
  "cursor",
  "page-transitions",
  "glass-ui",
  "particles",
  "microinteractions",
  "visual",
  "misc",
];

/** Human-readable labels for each category. Mirrors
 *  src/lib/roycss-types.ts categoryMeta. */
const CATEGORY_LABELS = {
  animations: "Animations",
  hover: "Hover Effects",
  text: "Text Effects",
  backgrounds: "Backgrounds",
  loaders: "Loaders",
  "3d-transforms": "3D & Transforms",
  buttons: "Button Effects",
  cards: "Card Effects",
  borders: "Borders",
  filters: "Filters",
  forms: "Forms & Inputs",
  navigation: "Navigation",
  scroll: "Scroll Effects",
  cursor: "Cursor Effects",
  "page-transitions": "Page Transitions",
  "glass-ui": "Glass & Modern UI",
  particles: "Particles",
  microinteractions: "Microinteractions",
  visual: "Visual Effects",
  misc: "Miscellaneous",
};

/* ─── State ──────────────────────────────────────────────────── */

/** Map<id, Effect> built from effects.json on first load. */
let effectsMap = new Map();

/** The last scan result. Used to re-render after filter changes. */
let lastScanResult = null;

/** The currently-selected effect id (for detail pane). */
let selectedEffectId = null;

/** The long-lived port to the background service worker. */
let port = null;

/* ─── Utilities ──────────────────────────────────────────────── */

const $ = (sel) => document.querySelector(sel);

function el(tag, opts = {}, children = []) {
  const node = document.createElement(tag);
  if (opts.cls) node.className = opts.cls;
  if (opts.text != null) node.textContent = opts.text;
  if (opts.attrs) {
    for (const [k, v] of Object.entries(opts.attrs)) {
      node.setAttribute(k, v);
    }
  }
  if (opts.dataset) {
    for (const [k, v] of Object.entries(opts.dataset)) {
      node.dataset[k] = v;
    }
  }
  for (const c of children) {
    if (c == null) continue;
    node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return node;
}

/* ─── Init ───────────────────────────────────────────────────── */

document.addEventListener("DOMContentLoaded", init);

async function init() {
  // Wire up static UI.
  $("#search").addEventListener("input", onSearchInput);
  $("#detail-close").addEventListener("click", onCloseDetail);

  // Load bundled effects.json (same-extension resource — not a network
  // fetch).
  try {
    const url = chrome.runtime.getURL("effects.json");
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error("effects.json is not an array");
    effectsMap = new Map(data.map((e) => [e.id, e]));
    console.debug(
      `[RoyCSS Inspector] panel ready · ${effectsMap.size} effects bundled`,
    );
  } catch (err) {
    renderFatalError("Failed to load bundled effects.json: " + String(err?.message || err));
    return;
  }

  // Open the long-lived port to the background service worker.
  port = chrome.runtime.connect({ name: "panel" });
  port.onMessage.addListener(onPortMessage);
  port.onDisconnect.addListener(() => {
    console.debug("[RoyCSS Inspector] port disconnected");
    port = null;
  });

  // Register with the background so it knows our tab id.
  const tabId = chrome.devtools.inspectedWindow.tabId;
  port.postMessage({ type: "register", tabId });

  // Request the first scan.
  port.postMessage({ type: "scan-request" });

  // Restore UI state (last search query, collapsed categories).
  try {
    const stored = await chrome.storage.local.get([
      "searchQuery",
      "collapsedCategories",
    ]);
    if (stored.searchQuery) {
      $("#search").value = stored.searchQuery;
    }
    if (Array.isArray(stored.collapsedCategories)) {
      // Applied during render via a closure variable.
      collapsedCategories = new Set(stored.collapsedCategories);
    }
  } catch (_e) {
    // storage may be unavailable in some contexts — non-fatal.
  }
}

let collapsedCategories = new Set();

/* ─── Port message handler ───────────────────────────────────── */

function onPortMessage(message) {
  if (!message || typeof message.type !== "string") return;
  switch (message.type) {
    case "scan-result":
    case "scan-update": {
      if (message.ok === false) {
        renderScanError(message.error || "scan-failed", message.detail);
        return;
      }
      lastScanResult = message;
      renderResults();
      break;
    }
    case "highlight-result": {
      if (message.ok === false) {
        console.debug("[RoyCSS Inspector] highlight failed:", message.error);
      }
      break;
    }
    case "clear-highlight-result":
      break;
    default:
      break;
  }
}

/* ─── Rendering ──────────────────────────────────────────────── */

function renderFatalError(msg) {
  const main = $("#main");
  main.innerHTML = "";
  main.appendChild(
    el("div", { cls: "roycss-empty" }, [
      el("div", { cls: "roycss-empty__icon", text: "⚠" }),
      el("div", { text: msg }),
    ]),
  );
}

function renderScanError(error, detail) {
  const main = $("#main");
  main.innerHTML = "";
  let hint = "";
  if (error === "scan-failed" && detail && detail.includes("cannot-inject")) {
    hint =
      "The Inspector cannot run on this page. Chrome:// pages, the Web Store, and the new-tab page block content scripts. Navigate to a normal http(s) page and try again.";
  } else if (error === "no-active-tab") {
    hint = "No active tab. Open a page and reopen DevTools.";
  }
  main.appendChild(
    el("div", { cls: "roycss-empty" }, [
      el("div", { cls: "roycss-empty__icon", text: "⚠" }),
      el("div", { text: `Scan failed: ${error}` }),
      hint ? el("div", { text: hint }) : null,
    ]),
  );
}

function renderResults() {
  const main = $("#main");
  main.innerHTML = "";

  const effects = lastScanResult?.effects || [];
  const total = lastScanResult?.count || 0;
  const unique = lastScanResult?.uniqueEffectCount || 0;

  // Header count badge.
  $("#header-count").textContent =
    total === 0
      ? "0 classes"
      : `${total} class${total === 1 ? "" : "es"} · ${unique} effect${unique === 1 ? "" : "s"}`;

  if (effects.length === 0) {
    main.appendChild(
      el("div", { cls: "roycss-empty" }, [
        el("div", { cls: "roycss-empty__icon", text: "✦" }),
        el("div", { text: "No RoyCSS classes found on this page." }),
        el("div", {
          text: "Navigate to a page that uses RoyCSS effects (e.g. https://roycss.dev) and the Inspector will list them here.",
        }),
      ]),
    );
    return;
  }

  // Group effects by category. Effects not in effectsMap (unknown to the
  // bundled dataset) are grouped under "misc".
  const byCategory = new Map();
  for (const det of effects) {
    const meta = effectsMap.get(det.id);
    const cat = meta?.category || "misc";
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat).push({ detected: det, meta });
  }

  // Render categories in canonical order. Categories with no detected
  // effects are skipped.
  const query = ($("#search").value || "").trim().toLowerCase();
  for (const cat of CATEGORY_ORDER) {
    const entries = byCategory.get(cat);
    if (!entries || entries.length === 0) continue;
    main.appendChild(renderCategory(cat, entries, query));
  }

  // Any categories not in CATEGORY_ORDER (shouldn't happen, but
  // defensive).
  for (const [cat, entries] of byCategory) {
    if (CATEGORY_ORDER.indexOf(cat) !== -1) continue;
    main.appendChild(renderCategory(cat, entries, query));
  }
}

function renderCategory(cat, entries, query) {
  // Filter entries by the search query.
  const filtered = entries.filter(({ detected, meta }) => {
    if (!query) return true;
    if (detected.id.toLowerCase().indexOf(query) !== -1) return true;
    if (meta?.name && meta.name.toLowerCase().indexOf(query) !== -1) return true;
    if (meta?.category && meta.category.toLowerCase().indexOf(query) !== -1) return true;
    if (meta?.description && meta.description.toLowerCase().indexOf(query) !== -1) return true;
    if (meta?.tags && meta.tags.some((t) => t.toLowerCase().indexOf(query) !== -1)) return true;
    return false;
  });

  const isCollapsed = collapsedCategories.has(cat) && !query;
  const section = el("div", {
    cls: "roycss-category" + (isCollapsed ? " roycss-category--collapsed" : ""),
  });

  const header = el("div", { cls: "roycss-category__header" }, [
    el("span", { cls: "roycss-category__chevron", text: "▼" }),
    el("span", { cls: "roycss-category__name", text: CATEGORY_LABELS[cat] || cat }),
    el("span", { cls: "roycss-category__count", text: String(filtered.length) }),
  ]);
  header.addEventListener("click", () => {
    if (collapsedCategories.has(cat)) collapsedCategories.delete(cat);
    else collapsedCategories.add(cat);
    section.classList.toggle("roycss-category--collapsed");
    void chrome.storage.local.set({
      collapsedCategories: Array.from(collapsedCategories),
    });
  });
  section.appendChild(header);

  const body = el("div", { cls: "roycss-category__body" });
  for (const { detected, meta } of filtered) {
    body.appendChild(renderEffectRow(detected, meta));
  }
  section.appendChild(body);

  // If filter wiped out all entries, hide the whole section.
  if (filtered.length === 0) {
    section.style.display = "none";
  }
  return section;
}

function renderEffectRow(detected, meta) {
  const isSelected = detected.id === selectedEffectId;
  const row = el(
    "div",
    {
      cls: "roycss-effect" + (isSelected ? " roycss-effect--selected" : ""),
      attrs: {
        role: "button",
        tabindex: "0",
        title: `roycss-${detected.id} — ${meta?.name || "Unknown effect"}`,
      },
      dataset: { id: detected.id },
    },
    [
      el("span", {
        cls: "roycss-effect__name",
        text: meta?.name || detected.id,
      }),
      el("span", {
        cls: "roycss-effect__class",
        text: `roycss-${detected.id}`,
      }),
      el("span", {
        cls: "roycss-effect__count",
        text: String(detected.count),
      }),
    ],
  );
  row.addEventListener("click", () => onSelectEffect(detected.id));
  row.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelectEffect(detected.id);
    }
  });
  return row;
}

/* ─── Detail pane ────────────────────────────────────────────── */

function onSelectEffect(effectId) {
  selectedEffectId = effectId;
  // Re-render to update the selected-row styling.
  renderResults();
  // Highlight on page.
  if (port) port.postMessage({ type: "highlight", effectId });
  // Open detail pane.
  renderDetail(effectId);
  $("#detail").classList.add("roycss-detail--open");
  $("#detail").setAttribute("aria-hidden", "false");
  // Persist selection.
  void chrome.storage.local.set({ lastSelectedEffectId: effectId });
}

function onCloseDetail() {
  $("#detail").classList.remove("roycss-detail--open");
  $("#detail").setAttribute("aria-hidden", "true");
  if (port) port.postMessage({ type: "clear-highlight" });
  // De-select the row on next render.
  selectedEffectId = null;
  renderResults();
}

function renderDetail(effectId) {
  const meta = effectsMap.get(effectId);
  const detected = (lastScanResult?.effects || []).find((e) => e.id === effectId);

  $("#detail-title").textContent = meta?.name || effectId;

  const body = $("#detail-body");
  body.innerHTML = "";

  if (!meta) {
    body.appendChild(
      el("div", { cls: "roycss-empty" }, [
        el("div", { text: `Effect "roycss-${effectId}" is not in the bundled effects.json.` }),
        el("div", {
          text: "This may be a custom or deprecated RoyCSS class. The Inspector can still highlight matching elements on the page, but cannot show metadata or CSS source.",
        }),
      ]),
    );
    if (detected) {
      body.appendChild(
        el("div", { cls: "roycss-detail__actions" }, [
          el(
            "button",
            {
              cls: "roycss-detail__btn roycss-detail__btn--primary",
              attrs: { type: "button" },
            },
            ["Highlight on page"],
          ),
        ]),
      ).firstElementChild.addEventListener("click", () => {
        if (port) port.postMessage({ type: "highlight", effectId });
      });
    }
    return;
  }

  // Name row.
  body.appendChild(detailRow("Name", meta.name));
  // Category row.
  body.appendChild(
    detailRow("Category", CATEGORY_LABELS[meta.category] || meta.category),
  );
  // Class row.
  body.appendChild(
    detailRow("Class", `roycss-${meta.id}`, { code: true }),
  );
  // Tags row.
  if (meta.tags && meta.tags.length > 0) {
    const tagsWrap = el("div", { cls: "roycss-detail__tags" });
    for (const t of meta.tags) {
      tagsWrap.appendChild(el("span", { cls: "roycss-detail__tag", text: t }));
    }
    body.appendChild(detailRow("Tags", null, { custom: tagsWrap }));
  }
  // Description row.
  if (meta.description) {
    body.appendChild(detailRow("Description", meta.description));
  }
  // Count on this page.
  if (detected) {
    body.appendChild(
      detailRow(
        "On this page",
        `${detected.count} element${detected.count === 1 ? "" : "s"}`,
      ),
    );
  }

  // CSS code section.
  if (meta.cssCode) {
    body.appendChild(el("div", { cls: "roycss-detail__section" }, [
      el("div", { cls: "roycss-detail__section-title", text: "CSS source" }),
      el("pre", { cls: "roycss-detail__code" }, [
        // textContent — never innerHTML. Defense against any future
        // CSS-injection attempt.
        document.createTextNode(meta.cssCode),
      ]),
      el("div", { cls: "roycss-detail__actions" }, [
        (() => {
          const btn = el(
            "button",
            {
              cls: "roycss-detail__btn roycss-detail__btn--primary",
              attrs: { type: "button" },
            },
            ["Copy CSS"],
          );
          btn.addEventListener("click", () => copyToClipboard(meta.cssCode, btn));
          return btn;
        })(),
        (() => {
          const btn = el(
            "button",
            { cls: "roycss-detail__btn", attrs: { type: "button" } },
            ["Highlight on page"],
          );
          btn.addEventListener("click", () => {
            if (port) port.postMessage({ type: "highlight", effectId });
          });
          return btn;
        })(),
      ]),
    ]));
  }
}

function detailRow(label, value, opts = {}) {
  const valueNode = opts.custom
    ? opts.custom
    : opts.code
      ? el("code", { text: value })
      : el("div", { text: value });
  return el("div", { cls: "roycss-detail__row" }, [
    el("div", { cls: "roycss-detail__label", text: label }),
    el("div", { cls: "roycss-detail__value" }, [valueNode]),
  ]);
}

async function copyToClipboard(text, btn) {
  try {
    await navigator.clipboard.writeText(text);
    const orig = btn.textContent;
    btn.textContent = "Copied!";
    setTimeout(() => {
      btn.textContent = orig;
    }, 1500);
  } catch (err) {
    console.debug("[RoyCSS Inspector] clipboard write failed:", err);
  }
}

/* ─── Search ─────────────────────────────────────────────────── */

let searchDebounce = null;
function onSearchInput() {
  if (searchDebounce) clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    const query = $("#search").value || "";
    void chrome.storage.local.set({ searchQuery: query });
    if (lastScanResult) renderResults();
  }, 80);
}
