/**
 * RoyCSS Inspector — popup logic.
 *
 * Opens when the user clicks the toolbar icon. Shows quick stats:
 *  - total RoyCSS classes on the active tab
 *  - top 5 effects by count
 *  - a hint to open DevTools → RoyCSS tab for the full inspector
 *
 * The popup is intentionally minimal — the DevTools panel is the primary
 * surface. The popup exists for the "is this page using RoyCSS at all?"
 * question without requiring DevTools to be open.
 *
 * Lifecycle:
 *  1. DOMContentLoaded → query the active tab.
 *  2. Send `popup-stats` message via chrome.runtime.sendMessage. The
 *     background service worker forwards it to the content script.
 *  3. If the content script is not yet injected, the background injects
 *     it on demand and re-sends.
 *  4. Render the count + top 5 list.
 *
 * Security: no eval, no innerHTML of untrusted strings, no fetch.
 */

document.addEventListener("DOMContentLoaded", init);

async function init() {
  // Query the active tab.
  let tab;
  try {
    [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  } catch (err) {
    renderError("Could not query active tab: " + String(err?.message || err));
    return;
  }
  if (!tab || tab.id == null) {
    renderError("No active tab.");
    return;
  }

  // Reject chrome:// pages, the Web Store, and the new-tab page — content
  // scripts cannot run there.
  const url = tab.url || "";
  if (
    !url ||
    url.startsWith("chrome://") ||
    url.startsWith("chrome-extension://") ||
    url.startsWith("https://chrome.google.com/webstore") ||
    url.startsWith("edge://") ||
    url.startsWith("about:")
  ) {
    renderEmpty("The Inspector cannot run on this page.", "Chrome internal pages and the Web Store block content scripts. Navigate to a normal http(s) page.");
    return;
  }

  // Ask the background to forward `popup-stats` to the content script.
  let result;
  try {
    result = await chrome.runtime.sendMessage({ type: "popup-stats" });
  } catch (err) {
    renderError("Could not reach the Inspector background worker: " + String(err?.message || err));
    return;
  }

  if (!result || result.ok === false) {
    renderError(result?.error || "popup-stats failed");
    return;
  }

  renderStats(result);
}

function renderStats(result) {
  const num = document.getElementById("num");
  const label = document.getElementById("label");
  const sub = document.getElementById("sub");
  const topTitle = document.getElementById("top-title");
  const topList = document.getElementById("top-list");

  const count = result.count || 0;
  const unique = result.uniqueEffectCount || 0;

  num.textContent = String(count);
  label.textContent =
    count === 1 ? "RoyCSS class" : "RoyCSS classes";
  sub.textContent =
    count === 0
      ? "No RoyCSS found"
      : `${unique} effect${unique === 1 ? "" : "s"}`;

  const top5 = result.top5 || [];
  if (top5.length === 0) {
    topTitle.style.display = "none";
    renderEmpty(
      "No RoyCSS classes on this page.",
      "Navigate to a page that uses RoyCSS effects (e.g. https://roycss.dev) and reopen this popup.",
    );
    return;
  }

  topTitle.style.display = "block";
  topList.innerHTML = "";
  for (const e of top5) {
    const li = document.createElement("li");
    const name = document.createElement("span");
    name.className = "roycss-popup-list__name";
    name.textContent = e.id;
    const id = document.createElement("span");
    id.className = "roycss-popup-list__id";
    id.textContent = `roycss-`;
    const idCode = document.createElement("code");
    idCode.textContent = e.id;
    idCode.style.font = "inherit";
    idCode.style.color = "inherit";
    // Replace id text node with the code element for monospace styling.
    id.textContent = "";
    id.appendChild(document.createTextNode("roycss-"));
    id.appendChild(idCode);

    const countSpan = document.createElement("span");
    countSpan.className = "roycss-popup-list__count";
    countSpan.textContent = String(e.count);

    li.appendChild(name);
    li.appendChild(id);
    li.appendChild(countSpan);
    topList.appendChild(li);
  }
}

function renderEmpty(title, body) {
  const num = document.getElementById("num");
  const label = document.getElementById("label");
  const sub = document.getElementById("sub");
  num.textContent = "0";
  label.textContent = "RoyCSS classes";
  sub.textContent = "No RoyCSS found";

  const topList = document.getElementById("top-list");
  topList.innerHTML = "";
  const topTitle = document.getElementById("top-title");
  topTitle.style.display = "none";

  // Append an empty-state hint below the stats.
  const empty = document.createElement("div");
  empty.className = "roycss-popup-empty";
  const strong = document.createElement("div");
  strong.style.fontWeight = "600";
  strong.style.color = "oklch(0.30 0.05 240)";
  strong.textContent = title;
  const sub2 = document.createElement("div");
  sub2.style.marginTop = "4px";
  sub2.textContent = body;
  empty.appendChild(strong);
  empty.appendChild(sub2);

  const bodyEl = document.querySelector(".roycss-popup-body");
  bodyEl.appendChild(empty);
}

function renderError(msg) {
  const body = document.querySelector(".roycss-popup-body");
  body.innerHTML = "";
  const err = document.createElement("div");
  err.className = "roycss-popup-error";
  err.textContent = msg;
  body.appendChild(err);
}
