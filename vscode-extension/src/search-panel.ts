/**
 * RoyCSS Playground Webview Panel
 *
 * Mirrors the animation playground UI from `src/components/roycss/playground-panel.tsx`
 * on the RoyCSS site, but in a VSCode WebviewPanel. Lets the user pick an
 * effect, tune duration / delay / repeat / easing, see a live preview, and
 * copy the generated CSS.
 *
 * SECURITY:
 *   - Strict Content-Security-Policy: `default-src 'none'` plus narrowly-scoped
 *     `img-src`, `style-src`, and `script-src` with a per-load nonce.
 *   - No external resources loaded (no fonts, no remote CSS, no remote JS).
 *   - The webview `postMessage`s back to the host only on "copy" gestures;
 *     the host validates the message shape before acting.
 *   - All effect CSS injected into the webview is sourced from
 *     `data/css-data.json` (already public — published in `dist/roycss.css`).
 *     No user-controlled strings are interpolated into HTML or JS.
 */

import * as vscode from "vscode";
import * as nodeCrypto from "crypto";
import { effects, getCssCode } from "./effects-data";

let currentPanel: vscode.WebviewPanel | undefined;

const EASING_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "ease", label: "ease" },
  { value: "ease-in", label: "ease-in" },
  { value: "ease-out", label: "ease-out" },
  { value: "ease-in-out", label: "ease-in-out" },
  { value: "linear", label: "linear" },
  { value: "cubic-bezier(0.68,-0.55,0.27,1.55)", label: "bounce" },
  { value: "cubic-bezier(0.34,1.56,0.64,1)", label: "spring" },
  { value: "cubic-bezier(0.22,1,0.36,1)", label: "smooth" },
];

const REPEAT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "1", label: "1x" },
  { value: "3", label: "3x" },
  { value: "infinite", label: "Infinite" },
];

/**
 * Opens (or focuses) the playground webview panel.
 */
export function openPlayground(): void {
  if (currentPanel) {
    currentPanel.reveal(vscode.ViewColumn.Active);
    return;
  }

  const column = vscode.window.activeTextEditor
    ? vscode.window.activeTextEditor.viewColumn
    : vscode.ViewColumn.Active;

  currentPanel = vscode.window.createWebviewPanel(
    "roycss.playground",
    "RoyCSS Playground",
    column || vscode.ViewColumn.Active,
    {
      enableScripts: true,
      retainContextWhenHidden: false,
      localResourceRoots: [],
    },
  );

  currentPanel.webview.html = buildHtml(currentPanel.webview);

  currentPanel.webview.onDidReceiveMessage(
    (msg: unknown) => handleWebviewMessage(msg),
  );

  currentPanel.onDidDispose(() => {
    currentPanel = undefined;
  });
}

// ───────────────────────────────────────────────────────────────────────
// Message handler — validates the shape of incoming postMessages
// ───────────────────────────────────────────────────────────────────────

interface CopyMessage {
  readonly type: "copy";
  readonly text: string;
}

interface InsertMessage {
  readonly type: "insert";
  readonly className: string;
}

type WebviewMessage = CopyMessage | InsertMessage;

function isWebviewMessage(msg: unknown): msg is WebviewMessage {
  if (typeof msg !== "object" || msg === null) return false;
  const m = msg as { type?: unknown };
  if (m.type === "copy") {
    return typeof (msg as { text?: unknown }).text === "string";
  }
  if (m.type === "insert") {
    const cls = (msg as { className?: unknown }).className;
    return typeof cls === "string" && /^roycss-[a-z0-9-]+$/.test(cls);
  }
  return false;
}

async function handleWebviewMessage(msg: unknown): Promise<void> {
  if (!isWebviewMessage(msg)) return;

  if (msg.type === "copy") {
    try {
      await vscode.env.clipboard.writeText(msg.text);
      vscode.window.showInformationMessage("[RoyCSS] Copied CSS to clipboard");
    } catch (err) {
      vscode.window.showErrorMessage(`[RoyCSS] Copy failed: ${String(err)}`);
    }
    return;
  }

  if (msg.type === "insert") {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage(
        "[RoyCSS] No active editor — open a file first.",
      );
      return;
    }
    try {
      await editor.edit((builder) => {
        const sel = editor.selection;
        if (sel.isEmpty) builder.insert(sel.active, msg.className);
        else builder.replace(sel, msg.className);
      });
    } catch (err) {
      vscode.window.showErrorMessage(
        `[RoyCSS] Insert failed: ${String(err)}`,
      );
    }
  }
}

// ───────────────────────────────────────────────────────────────────────
// HTML builder
// ───────────────────────────────────────────────────────────────────────

function buildHtml(webview: vscode.Webview): string {
  const nonce = generateNonce();
  const csp = [
    `default-src 'none'`,
    `img-src ${webview.cspSource} data:`,
    `style-src ${webview.cspSource} 'unsafe-inline'`,
    `script-src 'nonce-${nonce}'`,
  ].join("; ");

  // ─── Effect data injected as a JSON literal (no remote fetch) ───
  const animatedEffects = effects
    .filter((e) => {
      const css = getCssCode(e.id);
      return css && /animation\s*:/.test(css);
    })
    .map((e) => ({
      id: e.id,
      name: e.name,
      className: "roycss-" + e.id,
      css: getCssCode(e.id) || "",
    }));

  // We deliberately keep the inline JSON small enough to fit in a single
  // string literal (~500 KB for the ~1100 animated effects).
  const effectsJson = JSON.stringify(animatedEffects);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Content-Security-Policy" content="${csp}" />
  <title>RoyCSS Playground</title>
  <style>${BASE_STYLES}</style>
</head>
<body>
  <header>
    <h1>RoyCSS Playground</h1>
    <p>Tune animation properties with live preview. Copy the generated CSS.</p>
  </header>

  <main>
    <section class="control-row">
      <label for="effect">Effect</label>
      <select id="effect"></select>
    </section>

    <section class="preview-box">
      <div class="preview-header">
        <span>Live Preview</span>
        <button id="replay" type="button">Replay</button>
      </div>
      <div class="preview-stage">
        <div id="preview-target" class="preview-target">RoyCSS</div>
      </div>
    </section>

    <section class="control-row">
      <label for="duration">Duration (<span id="duration-val">2</span>s)</label>
      <input id="duration" type="range" min="0.1" max="10" step="0.1" value="2" />
    </section>

    <section class="control-row">
      <label for="delay">Delay (<span id="delay-val">0</span>s)</label>
      <input id="delay" type="range" min="0" max="5" step="0.1" value="0" />
    </section>

    <section class="control-row">
      <label for="repeat">Repeat</label>
      <select id="repeat">
        ${REPEAT_OPTIONS.map((o) => `<option value="${o.value}">${o.label}</option>`).join("")}
      </select>
    </section>

    <section class="control-row">
      <label for="easing">Easing</label>
      <select id="easing">
        ${EASING_OPTIONS.map((o) => `<option value="${o.value}">${o.label}</option>`).join("")}
      </select>
    </section>

    <section class="control-row">
      <button id="reset" type="button">Reset to defaults</button>
    </section>

    <section class="generated">
      <div class="generated-header">
        <span>Generated CSS</span>
        <button id="copy" type="button">Copy CSS</button>
        <button id="insert" type="button">Insert class at cursor</button>
      </div>
      <pre><code id="generated-css"></code></pre>
    </section>
  </main>

  <script nonce="${nonce}">
    (function () {
      var vscode = acquireVsCodeApi();
      var effects = ${effectsJson};
      var state = { effectId: effects[0] ? effects[0].id : null, duration: 2, delay: 0, repeat: "infinite", easing: "ease-in-out" };

      // ─── Build effect <option>s ───
      var select = document.getElementById("effect");
      effects.forEach(function (e) {
        var opt = document.createElement("option");
        opt.value = e.id;
        opt.textContent = e.name + " (roycss-" + e.id + ")";
        select.appendChild(opt);
      });

      // ─── Inject all effect CSS into a <style> tag ───
      var styleTag = document.createElement("style");
      styleTag.textContent = effects.map(function (e) { return e.css; }).join("\\n\\n");
      document.head.appendChild(styleTag);

      // ─── Cache DOM ───
      var durationEl = document.getElementById("duration");
      var delayEl = document.getElementById("delay");
      var repeatEl = document.getElementById("repeat");
      var easingEl = document.getElementById("easing");
      var durationVal = document.getElementById("duration-val");
      var delayVal = document.getElementById("delay-val");
      var generatedCss = document.getElementById("generated-css");
      var previewTarget = document.getElementById("preview-target");

      function findEffect(id) {
        for (var i = 0; i < effects.length; i++) {
          if (effects[i].id === id) return effects[i];
        }
        return null;
      }

      function render() {
        var e = findEffect(state.effectId);
        if (!e) return;
        durationVal.textContent = state.duration;
        delayVal.textContent = state.delay;

        // Reset preview by toggling a child class
        previewTarget.className = "preview-target roycss-" + e.id;
        previewTarget.style.animationDuration = state.duration + "s";
        previewTarget.style.animationDelay = state.delay + "s";
        previewTarget.style.animationIterationCount = state.repeat === "infinite" ? "infinite" : state.repeat;
        previewTarget.style.animationTimingFunction = state.easing;

        // Extract animation name from the effect's CSS for the generated CSS
        var animLine = e.css.match(/animation:\\s*([^;]+)/i);
        var animName = animLine ? animLine[1].trim().split(/\\s+/)[0] : ("roy-" + e.id);
        var generated = "/* " + e.name + " — customized */\\n.roycss-" + e.id + " {\\n  animation: " + animName + " " + state.duration + "s " + state.easing + " " + state.delay + "s " + state.repeat + ";\\n}";
        generatedCss.textContent = generated;
        state._generated = generated;
        state._className = "roycss-" + e.id;
      }

      // ─── Wire up events ───
      select.addEventListener("change", function () { state.effectId = select.value; render(); });
      durationEl.addEventListener("input", function () { state.duration = parseFloat(durationEl.value); render(); });
      delayEl.addEventListener("input", function () { state.delay = parseFloat(delayEl.value); render(); });
      repeatEl.addEventListener("change", function () { state.repeat = repeatEl.value; render(); });
      easingEl.addEventListener("change", function () { state.easing = easingEl.value; render(); });

      document.getElementById("replay").addEventListener("click", function () {
        var old = previewTarget.className;
        previewTarget.className = "preview-target";
        // Force reflow
        void previewTarget.offsetWidth;
        previewTarget.className = old;
      });

      document.getElementById("reset").addEventListener("click", function () {
        state.duration = 2; state.delay = 0; state.repeat = "infinite"; state.easing = "ease-in-out";
        durationEl.value = "2"; delayEl.value = "0"; repeatEl.value = "infinite"; easingEl.value = "ease-in-out";
        render();
      });

      document.getElementById("copy").addEventListener("click", function () {
        vscode.postMessage({ type: "copy", text: state._generated || "" });
      });

      document.getElementById("insert").addEventListener("click", function () {
        vscode.postMessage({ type: "insert", className: state._className || "" });
      });

      // ─── Initial render ───
      render();
    })();
  </script>
</body>
</html>`;
}

// ───────────────────────────────────────────────────────────────────────
// Inline styles for the webview (no external CSS)
// ───────────────────────────────────────────────────────────────────────

const BASE_STYLES = `
  :root {
    color-scheme: light dark;
    --bg: var(--vscode-editor-background);
    --fg: var(--vscode-editor-foreground);
    --muted: var(--vscode-descriptionForeground);
    --border: var(--vscode-panel-border);
    --accent: var(--vscode-button-background);
    --accent-fg: var(--vscode-button-foreground);
    --input-bg: var(--vscode-input-background);
    --input-fg: var(--vscode-input-foreground);
    --input-border: var(--vscode-input-border);
    --font: var(--vscode-font-family);
    --font-mono: var(--vscode-editor-font-family);
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: var(--bg); color: var(--fg); font-family: var(--font); }
  body { padding: 20px; max-width: 720px; margin: 0 auto; }
  header h1 { font-size: 1.5rem; margin: 0 0 4px; }
  header p { margin: 0 0 20px; color: var(--muted); font-size: 0.875rem; }
  main { display: flex; flex-direction: column; gap: 16px; }
  .control-row { display: flex; flex-direction: column; gap: 6px; }
  .control-row label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: var(--muted); }
  select, input[type="range"] {
    background: var(--input-bg); color: var(--input-fg);
    border: 1px solid var(--input-border, transparent);
    padding: 8px 10px; border-radius: 6px; font-family: var(--font); font-size: 0.875rem;
  }
  button {
    background: var(--accent); color: var(--accent-fg);
    border: none; padding: 8px 14px; border-radius: 6px;
    font-family: var(--font); font-size: 0.875rem; cursor: pointer;
  }
  button:hover { opacity: 0.9; }
  .preview-box {
    border: 1px solid var(--border); border-radius: 8px; overflow: hidden;
  }
  .preview-header {
    display: flex; justify-content: space-between; align-items: center;
    padding: 6px 12px; background: var(--input-bg); border-bottom: 1px solid var(--border);
    font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: var(--muted);
  }
  .preview-stage {
    height: 200px; display: flex; align-items: center; justify-content: center;
    background: linear-gradient(135deg, var(--input-bg), transparent);
  }
  .preview-target {
    padding: 24px 32px; border-radius: 8px; background: var(--accent); color: var(--accent-fg);
    font-weight: 600; font-size: 1rem;
  }
  .generated { border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
  .generated-header {
    display: flex; justify-content: space-between; align-items: center; gap: 8px;
    padding: 6px 12px; background: var(--input-bg); border-bottom: 1px solid var(--border);
    font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: var(--muted);
  }
  .generated-header button { padding: 4px 10px; font-size: 0.75rem; }
  .generated pre { margin: 0; padding: 12px; overflow-x: auto; }
  .generated code { font-family: var(--font-mono); font-size: 0.8rem; color: var(--fg); white-space: pre; }
`;

// ───────────────────────────────────────────────────────────────────────
// Nonce generator (RFC 6265 §4.1.1 — base64url of 16 random bytes)
// ───────────────────────────────────────────────────────────────────────

function generateNonce(): string {
  // Node 18+ (the runtime VSCode 1.85 ships with) has crypto.randomBytes.
  // We use 16 random bytes → base64url → ~22 chars. The nonce is per-page-load
  // and only used to tag inline scripts; the CSP still blocks all remote
  // sources regardless of nonce strength.
  const bytes = nodeCrypto.randomBytes(16);
  return bytes
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
