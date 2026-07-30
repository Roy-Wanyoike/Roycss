/**
 * RoyCSS VSCode Extension — entry point.
 *
 * Architecture: see docs/adr/vscode-extension/DESIGN.md
 *
 * This file is the single entry point (CommonJS, plain Node.js — no TypeScript,
 * no bundler, no transpiler). It registers:
 *   - CompletionItemProvider for `roycss-*` class completions
 *   - HoverProvider showing effect metadata + CSS preview
 *   - DiagnosticCollection flagging unknown `roycss-*` classes
 *   - CodeActionProvider for quick-fix suggestions
 *   - Commands: roycss.browseEffects, roycss.searchEffect
 *
 * Zero runtime dependencies. Zero network calls. Zero child_process.
 * See docs/adr/vscode-extension/THREAT-MODEL.md for the security posture.
 */

"use strict";

const vscode = require("vscode");
const fs = require("fs");
const path = require("path");

// ────────────────────────────────────────────────────────────────────────────
// 1. Load + index class data
// ────────────────────────────────────────────────────────────────────────────

/**
 * Loaded once at activation. If the file is missing or malformed, we log and
 * degrade gracefully (all providers return empty results).
 *
 * @type {{ effects: EffectEntry[], version: string, generatedAt: string } | null}
 */
let classData = null;

/**
 * @typedef {Object} EffectEntry
 * @property {string} id
 * @property {string} className  e.g. "roycss-pulse-glow"
 * @property {string} name       e.g. "Pulse Glow"
 * @property {string} category   e.g. "animations"
 * @property {string} description
 * @property {string[]} tags
 * @property {string} previewType
 * @property {string|null} previewText
 * @property {number|null} childCount
 * @property {string} cssCode
 */

/** @type {Map<string, EffectEntry>} keyed by className (e.g. "roycss-pulse-glow") */
const byClass = new Map();

/** @type {Map<string, EffectEntry>} keyed by id (e.g. "pulse-glow") */
const byId = new Map();

/** @type {EffectEntry[]} the full list, for completion + browse */
let effectsList = /** @type {EffectEntry[]} */ ([]);

/** @type {string[]} all classNames, for diagnostic suggestions */
let classNames = /** @type {string[]} */ ([]);

/**
 * Load class-data.json from the extension root. Called once at activation.
 * @param {vscode.ExtensionContext} context
 */
function loadClassData(context) {
  const dataPath = path.join(context.extensionPath, "class-data.json");
  try {
    const raw = fs.readFileSync(dataPath, "utf-8");
    classData = JSON.parse(raw);
    if (!classData || !Array.isArray(classData.effects)) {
      throw new Error("class-data.json missing `effects` array");
    }
    effectsList = classData.effects;
    byClass.clear();
    byId.clear();
    classNames = [];
    for (const e of effectsList) {
      byClass.set(e.className, e);
      byId.set(e.id, e);
      classNames.push(e.className);
    }
    // Defensive lower bound — if the data file is corrupt or partial, log.
    if (effectsList.length < 1500) {
      throw new Error(
        `class-data.json has only ${effectsList.length} effects (expected ≥1500)`,
      );
    }
  } catch (err) {
    classData = null;
    effectsList = [];
    byClass.clear();
    byId.clear();
    classNames = [];
    // Best-effort log to the output channel (created in activate()).
    if (outputChannel) {
      outputChannel.appendLine(
        `[RoyCSS] ERROR loading class-data.json: ${err && err.message ? err.message : String(err)}`,
      );
      outputChannel.appendLine(
        `[RoyCSS] All providers will return empty results. Reinstall the extension.`,
      );
    }
  }
}

// ────────────────────────────────────────────────────────────────────────────
// 2. Output channel (created in activate)
// ────────────────────────────────────────────────────────────────────────────

/** @type {vscode.OutputChannel | null} */
let outputChannel = null;

// ────────────────────────────────────────────────────────────────────────────
// 3. Supported languages + selectors
// ────────────────────────────────────────────────────────────────────────────

const SUPPORTED_LANGUAGES = [
  "css",
  "html",
  "javascript",
  "typescript",
  "javascriptreact",
  "typescriptreact",
  "vue",
  "svelte",
];

const DOCUMENT_SELECTOR = SUPPORTED_LANGUAGES.map((language) => ({
  scheme: "file",
  language,
})).concat(
  SUPPORTED_LANGUAGES.map((language) => ({
    scheme: "untitled",
    language,
  })),
);

// Trigger characters that cause VSCode to call our completion provider eagerly.
// "-" is the primary trigger (so typing `roycss-` pops the list). `"`, `'`,
// `` ` `` trigger inside class attributes / template literals. Space triggers
// inside multi-class attributes.
const COMPLETION_TRIGGERS = ["-", '"', "'", "`", " "];

// ────────────────────────────────────────────────────────────────────────────
// 4. Helpers
// ────────────────────────────────────────────────────────────────────────────

/**
 * Maximum file size (bytes) for diagnostics scanning. Files larger than this
 * are skipped to avoid blocking the extension host on huge minified bundles.
 */
const DIAGNOSTICS_MAX_FILE_BYTES = 200 * 1024;

/**
 * Debounce window (ms) for re-running diagnostics after a document change.
 */
const DIAGNOSTICS_DEBOUNCE_MS = 300;

/**
 * Maximum number of completion items to return (clamped by configuration).
 */
function getMaxCompletionItems() {
  const cfg = vscode.workspace.getConfiguration("roycss");
  const n = typeof cfg.get === "function" ? cfg.get("maxCompletionItems", 1569) : 1569;
  return Math.max(50, Math.min(1569, Number(n) || 1569));
}

/**
 * Build the markdown documentation for an effect (used by completion + hover).
 * @param {EffectEntry} e
 * @returns {vscode.MarkdownString}
 */
function buildDocs(e) {
  const md = new vscode.MarkdownString();
  md.isTrusted = false; // strip any command: URIs in CSS source
  md.supportHtml = false;

  md.appendMarkdown(`**${e.name}** · \`${e.category}\`\n\n`);
  md.appendMarkdown(`${e.description}\n\n`);
  md.appendMarkdown(`\`${e.className}\`\n\n`);
  if (Array.isArray(e.tags) && e.tags.length) {
    md.appendMarkdown(
      "Tags: " + e.tags.map((t) => `\`${t}\``).join(" · ") + "\n\n",
    );
  }
  // CSS preview — fenced code block, truncated for readability.
  if (e.cssCode) {
    const cssPreview =
      e.cssCode.length > 1500
        ? e.cssCode.slice(0, 1500) + "\n/* … truncated … */"
        : e.cssCode;
    md.appendCodeblock(cssPreview, "css");
  }
  md.appendMarkdown(
    `[View on roycss.com](https://roycss.com) · [Source on GitHub](https://github.com/Roy-Wanyoike/roycss)\n`,
  );
  return md;
}

/**
 * Get the word range + text at a position, treating `-` as a word character
 * (so `roycss-pulse-glow` is one token, not three).
 * @param {vscode.TextDocument} doc
 * @param {vscode.Position} pos
 * @returns {{ range: vscode.Range, word: string } | null}
 */
function getRoyClassToken(doc, pos) {
  const line = doc.lineAt(pos.line).text;
  // Match `roycss-[\w-]*` containing the cursor.
  const re = /roycss-[A-Za-z0-9_-]*/g;
  let m;
  while ((m = re.exec(line)) !== null) {
    const start = m.index;
    const end = m.index + m[0].length;
    if (pos.character >= start && pos.character <= end) {
      return {
        range: new vscode.Range(
          pos.line,
          start,
          pos.line,
          end,
        ),
        word: m[0],
      };
    }
  }
  return null;
}

/**
 * Levenshtein distance, capped at `max`. Returns `max + 1` if the distance
 * exceeds `max` (so callers can use it as a hard cutoff).
 * @param {string} a
 * @param {string} b
 * @param {number} max
 * @returns {number}
 */
function levenshtein(a, b, max) {
  const al = a.length;
  const bl = b.length;
  if (Math.abs(al - bl) > max) return max + 1;
  // Iterative DP, single-row.
  /** @type {number[]} */
  const row = new Array(bl + 1);
  for (let j = 0; j <= bl; j++) row[j] = j;
  for (let i = 1; i <= al; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= bl; j++) {
      const tmp = row[j];
      row[j] = Math.min(
        row[j] + 1, // deletion
        row[j - 1] + 1, // insertion
        prev + (a[i - 1] === b[j - 1] ? 0 : 1), // substitution
      );
      prev = tmp;
    }
    // Early exit if every value in the row exceeds max.
    let allAboveMax = true;
    for (let j = 0; j <= bl; j++) {
      if (row[j] <= max) {
        allAboveMax = false;
        break;
      }
    }
    if (allAboveMax) return max + 1;
  }
  return row[bl];
}

/**
 * Suggest the closest known classNames to `input`. Returns up to `limit`
 * suggestions sorted by ascending distance.
 * @param {string} input
 * @param {number} limit
 * @param {number} maxDistance
 * @returns {string[]}
 */
function suggestClassNames(input, limit = 3, maxDistance = 3) {
  if (!input || !classNames.length) return [];
  /** @type {{name: string, d: number}[]} */
  const scored = [];
  for (const name of classNames) {
    const d = levenshtein(input, name, maxDistance);
    if (d <= maxDistance) scored.push({ name, d });
  }
  scored.sort((a, b) => a.d - b.d);
  return scored.slice(0, limit).map((s) => s.name);
}

// ────────────────────────────────────────────────────────────────────────────
// 5. CompletionItemProvider
// ────────────────────────────────────────────────────────────────────────────

/**
 * @type {vscode.CompletionItem[]}
 */
let completionItemsCache = null;

function buildCompletionItems() {
  if (completionItemsCache) return completionItemsCache;
  const max = getMaxCompletionItems();
  completionItemsCache = effectsList.slice(0, max).map((e) => {
    const item = new vscode.CompletionItem(
      e.className,
      vscode.CompletionItemKind.Class,
    );
    item.detail = `${e.name} · ${e.category}`;
    item.documentation = buildDocs(e);
    item.filterText = e.className;
    item.insertText = e.className;
    item.sortText = `0:${e.className}`; // recently-used items get `0:` prefix dynamically
    return item;
  });
  return completionItemsCache;
}

/**
 * @implements {vscode.CompletionItemProvider}
 */
class RoyCSSCompletionProvider {
  /**
   * @param {vscode.TextDocument} document
   * @param {vscode.Position} position
   * @param {vscode.CancellationToken} _token
   * @param {vscode.CompletionContext} _context
   * @returns {vscode.CompletionItem[] | undefined}
   */
  provideCompletionItems(document, position, _token, _context) {
    if (!effectsList.length) return undefined;
    const items = buildCompletionItems();
    // VSCode filters by `filterText` automatically. We can optionally
    // pre-filter by partial token to reduce the list further.
    const token = getRoyClassToken(document, position);
    if (token && token.word.length > 6) {
      // User has typed at least `roycss-` + 1 char — return all that start
      // with what they've typed. VSCode does this filtering for us, but
      // doing it here speeds up rendering for very large catalogs.
      const prefix = token.word.toLowerCase();
      return items.filter((it) =>
        it.filterText.toLowerCase().startsWith(prefix),
      );
    }
    return items;
  }
}

// ────────────────────────────────────────────────────────────────────────────
// 6. HoverProvider
// ────────────────────────────────────────────────────────────────────────────

/**
 * @implements {vscode.HoverProvider}
 */
class RoyCSSHoverProvider {
  /**
   * @param {vscode.TextDocument} document
   * @param {vscode.Position} position
   * @param {vscode.CancellationToken} _token
   * @returns {vscode.Hover | undefined}
   */
  provideHover(document, position, _token) {
    if (!effectsList.length) return undefined;
    const token = getRoyClassToken(document, position);
    if (!token) return undefined;
    const entry = byClass.get(token.word);
    if (!entry) return undefined;
    return new vscode.Hover(buildDocs(entry), token.range);
  }
}

// ────────────────────────────────────────────────────────────────────────────
// 7. DiagnosticCollection
// ────────────────────────────────────────────────────────────────────────────

/** @type {vscode.DiagnosticCollection | null} */
let diagnosticCollection = null;

/** @type {Map<string, NodeJS.Timeout>} debounce timers per document URI */
const diagnosticTimers = new Map();

/**
 * Severity mapping from configuration string to vscode.DiagnosticSeverity.
 * @param {string} s
 * @returns {vscode.DiagnosticSeverity | null}
 */
function severityFromString(s) {
  switch (s) {
    case "error":
      return vscode.DiagnosticSeverity.Error;
    case "warning":
      return vscode.DiagnosticSeverity.Warning;
    case "information":
      return vscode.DiagnosticSeverity.Information;
    case "hint":
      return vscode.DiagnosticSeverity.Hint;
    case "none":
      return null;
    default:
      return vscode.DiagnosticSeverity.Warning;
  }
}

/**
 * Scan a document for `roycss-*` tokens and emit diagnostics for unknown ones.
 * @param {vscode.TextDocument} doc
 */
function scanDocument(doc) {
  if (!diagnosticCollection) return;
  if (!SUPPORTED_LANGUAGES.includes(doc.languageId)) return;
  if (doc.uri.scheme !== "file" && doc.uri.scheme !== "untitled") return;
  if (doc.getText().length > DIAGNOSTICS_MAX_FILE_BYTES) {
    if (outputChannel) {
      outputChannel.appendLine(
        `[RoyCSS] Skipping diagnostics for ${doc.uri.fsPath} (>${DIAGNOSTICS_MAX_FILE_BYTES / 1024} KB)`,
      );
    }
    return;
  }

  const cfg = vscode.workspace.getConfiguration("roycss");
  const severity = severityFromString(
    /** @type {string} */ (cfg.get("diagnosticSeverity", "warning")),
  );
  if (severity === null) {
    diagnosticCollection.delete(doc.uri);
    return;
  }

  /** @type {vscode.Diagnostic[]} */
  const diags = [];
  const text = doc.getText();
  const re = /roycss-[A-Za-z0-9_-]+/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const token = m[0];
    if (byClass.has(token)) continue;
    // Unknown — emit a diagnostic.
    const start = doc.positionAt(m.index);
    const end = doc.positionAt(m.index + token.length);
    const range = new vscode.Range(start, end);
    const suggestions = suggestClassNames(token, 3, 3);
    const message = suggestions.length
      ? `Unknown RoyCSS class "${token}". Did you mean "${suggestions.join('", "')}"?`
      : `Unknown RoyCSS class "${token}".`;
    const d = new vscode.Diagnostic(range, message, severity);
    d.source = "roycss";
    d.code = "unknown-roycss-class";
    /** @type {any} */
    (d).roycssSuggestions = suggestions; // stash for the code-action provider
    diags.push(d);
  }
  diagnosticCollection.set(doc.uri, diags);
}

/**
 * Schedule a debounced scan for a document.
 * @param {vscode.TextDocument} doc
 */
function scheduleScan(doc) {
  const key = doc.uri.toString();
  const existing = diagnosticTimers.get(key);
  if (existing) clearTimeout(existing);
  const t = setTimeout(() => {
    diagnosticTimers.delete(key);
    try {
      scanDocument(doc);
    } catch (err) {
      if (outputChannel) {
        outputChannel.appendLine(
          `[RoyCSS] scanDocument error: ${err && err.message ? err.message : String(err)}`,
        );
      }
    }
  }, DIAGNOSTICS_DEBOUNCE_MS);
  diagnosticTimers.set(key, t);
}

// ────────────────────────────────────────────────────────────────────────────
// 8. CodeActionProvider
// ────────────────────────────────────────────────────────────────────────────

/**
 * @implements {vscode.CodeActionProvider}
 */
class RoyCSSCodeActionProvider {
  /**
   * @param {vscode.TextDocument} document
   * @param {vscode.Range | vscode.Selection} range
   * @param {vscode.CodeActionContext} context
   * @param {vscode.CancellationToken} _token
   * @returns {vscode.CodeAction[]}
   */
  provideCodeActions(document, range, context, _token) {
    /** @type {vscode.CodeAction[]} */
    const actions = [];
    // Find diagnostics in `range` that we own.
    const diags = (context.diagnostics || []).filter(
      (d) => d.source === "roycss",
    );
    for (const d of diags) {
      /** @type {string[]} */
      const suggestions = /** @type {any} */ (d).roycssSuggestions || [];
      for (const suggestion of suggestions) {
        const fix = new vscode.CodeAction(
          `Replace with "${suggestion}"`,
          vscode.CodeActionKind.QuickFix,
        );
        fix.diagnostics = [d];
        fix.edit = new vscode.WorkspaceEdit();
        fix.edit.replace(document.uri, d.range, suggestion);
        fix.isPreferred = suggestions.indexOf(suggestion) === 0;
        actions.push(fix);
      }
    }
    return actions;
  }
}

RoyCSSCodeActionProvider.providedCodeActionKinds = [
  vscode.CodeActionKind.QuickFix,
];

// ────────────────────────────────────────────────────────────────────────────
// 9. Commands
// ────────────────────────────────────────────────────────────────────────────

/**
 * Build the QuickPick items for browseEffects. Cached after first call.
 * @returns {vscode.QuickPickItem[]}
 */
let browseItemsCache = null;
function buildBrowseItems() {
  if (browseItemsCache) return browseItemsCache;
  browseItemsCache = effectsList.map((e) => ({
    label: e.className,
    description: e.name,
    detail: `${e.category} · ${e.description}`,
    // Pick detail data (not shown):
    picked: false,
    alwaysShow: false,
  }));
  return browseItemsCache;
}

/**
 * Insert text at the current cursor in the active editor, or copy to clipboard
 * if no editor is open.
 * @param {string} text
 */
async function insertOrCopy(text) {
  const editor = vscode.window.activeTextEditor;
  if (editor) {
    await editor.edit((b) => {
      // Insert at every cursor.
      editor.selections.forEach((sel) => b.insert(sel.active, text));
    });
    if (outputChannel) {
      outputChannel.appendLine(`[RoyCSS] Inserted "${text}" at ${editor.selections.length} cursor(s).`);
    }
  } else {
    await vscode.env.clipboard.writeText(text);
    await vscode.window.showInformationMessage(
      `RoyCSS: No active editor — copied "${text}" to clipboard.`,
    );
    if (outputChannel) {
      outputChannel.appendLine(`[RoyCSS] No active editor — copied "${text}" to clipboard.`);
    }
  }
}

/**
 * Command: roycss.browseEffects — open a QuickPick of all 1,569 effects.
 * @returns {Promise<void>}
 */
async function browseEffects() {
  if (!effectsList.length) {
    await vscode.window.showWarningMessage(
      "RoyCSS: class data is not loaded. Reinstall the extension.",
    );
    return;
  }
  const items = buildBrowseItems();
  const picked = await vscode.window.showQuickPick(items, {
    placeHolder: `Browse ${effectsList.length} RoyCSS effects`,
    matchOnDescription: true,
    matchOnDetail: true,
    ignoreFocusOut: false,
  });
  if (picked && typeof picked.label === "string") {
    await insertOrCopy(picked.label);
  }
}

/**
 * Command: roycss.searchEffect — open an InputBox for fuzzy substring search.
 * @returns {Promise<void>}
 */
async function searchEffect() {
  if (!effectsList.length) {
    await vscode.window.showWarningMessage(
      "RoyCSS: class data is not loaded. Reinstall the extension.",
    );
    return;
  }
  const query = await vscode.window.showInputBox({
    prompt: "Search RoyCSS effects by name, tag, or id",
    placeHolder: "e.g. glow, button, hover-zoom, pulse",
    ignoreFocusOut: true,
  });
  if (query === undefined) return; // user cancelled
  const q = query.trim().toLowerCase();
  if (!q) return;

  const matches = effectsList.filter((e) => {
    if (e.name.toLowerCase().includes(q)) return true;
    if (e.id.toLowerCase().includes(q)) return true;
    if (e.className.toLowerCase().includes(q)) return true;
    if (e.description.toLowerCase().includes(q)) return true;
    if (Array.isArray(e.tags) && e.tags.some((t) => t.toLowerCase().includes(q))) return true;
    return false;
  });

  if (matches.length === 0) {
    await vscode.window.showInformationMessage(
      `RoyCSS: No effects match "${query}".`,
    );
    return;
  }
  if (matches.length === 1) {
    await insertOrCopy(matches[0].className);
    return;
  }
  // Multiple matches — open a QuickPick.
  const items = matches.map((e) => ({
    label: e.className,
    description: e.name,
    detail: `${e.category} · ${e.description}`,
  }));
  const picked = await vscode.window.showQuickPick(items, {
    placeHolder: `${matches.length} effects match "${query}"`,
    matchOnDescription: true,
    matchOnDetail: true,
    ignoreFocusOut: false,
  });
  if (picked && typeof picked.label === "string") {
    await insertOrCopy(picked.label);
  }
}

// ────────────────────────────────────────────────────────────────────────────
// 10. Activation + lifecycle
// ────────────────────────────────────────────────────────────────────────────

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  const startHr = process.hrtime.bigint();

  // Output channel — created BEFORE loadClassData so it can log load errors.
  outputChannel = vscode.window.createOutputChannel("RoyCSS");
  context.subscriptions.push(outputChannel);

  outputChannel.appendLine("[RoyCSS] Activating...");

  // Load data.
  loadClassData(context);
  if (classData) {
    outputChannel.appendLine(
      `[RoyCSS] Loaded ${effectsList.length} effects (data version ${classData.version}, generated ${classData.generatedAt}).`,
    );
  }

  const cfg = vscode.workspace.getConfiguration("roycss");

  // ── Completion ────────────────────────────────────────────────────────
  if (cfg.get("enableCompletion", true)) {
    context.subscriptions.push(
      vscode.languages.registerCompletionItemProvider(
        DOCUMENT_SELECTOR,
        new RoyCSSCompletionProvider(),
        ...COMPLETION_TRIGGERS,
      ),
    );
    outputChannel.appendLine("[RoyCSS] ✓ CompletionItemProvider registered.");
  }

  // ── Hover ─────────────────────────────────────────────────────────────
  if (cfg.get("enableHover", true)) {
    context.subscriptions.push(
      vscode.languages.registerHoverProvider(
        DOCUMENT_SELECTOR,
        new RoyCSSHoverProvider(),
      ),
    );
    outputChannel.appendLine("[RoyCSS] ✓ HoverProvider registered.");
  }

  // ── Diagnostics ───────────────────────────────────────────────────────
  if (cfg.get("enableDiagnostics", true)) {
    diagnosticCollection = vscode.languages.createDiagnosticCollection("roycss");
    context.subscriptions.push(diagnosticCollection);

    // Scan all already-open documents.
    for (const doc of vscode.workspace.textDocuments) {
      try {
        scanDocument(doc);
      } catch (err) {
        outputChannel.appendLine(
          `[RoyCSS] Initial scan error for ${doc.uri.fsPath}: ${err && err.message}`,
        );
      }
    }

    // Wire up listeners.
    context.subscriptions.push(
      vscode.workspace.onDidOpenTextDocument((doc) => scheduleScan(doc)),
    );
    context.subscriptions.push(
      vscode.workspace.onDidChangeTextDocument((ev) => {
        if (ev.document) scheduleScan(ev.document);
      }),
    );
    context.subscriptions.push(
      vscode.workspace.onDidSaveTextDocument((doc) => {
        try {
          scanDocument(doc);
        } catch (err) {
          outputChannel.appendLine(`[RoyCSS] Save scan error: ${err && err.message}`);
        }
      }),
    );
    context.subscriptions.push(
      vscode.workspace.onDidCloseTextDocument((doc) => {
        diagnosticTimers.delete(doc.uri.toString());
        if (diagnosticCollection) diagnosticCollection.delete(doc.uri);
      }),
    );
    outputChannel.appendLine("[RoyCSS] ✓ DiagnosticCollection registered.");
  }

  // ── Code actions ──────────────────────────────────────────────────────
  if (cfg.get("enableCodeActions", true)) {
    context.subscriptions.push(
      vscode.languages.registerCodeActionProvider(
        DOCUMENT_SELECTOR,
        new RoyCSSCodeActionProvider(),
        {
          providedCodeActionKinds:
            RoyCSSCodeActionProvider.providedCodeActionKinds,
        },
      ),
    );
    outputChannel.appendLine("[RoyCSS] ✓ CodeActionProvider registered.");
  }

  // ── Commands ──────────────────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand("roycss.browseEffects", browseEffects),
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("roycss.searchEffect", searchEffect),
  );
  outputChannel.appendLine("[RoyCSS] ✓ Commands registered: roycss.browseEffects, roycss.searchEffect.");

  // ── Configuration-change listener ─────────────────────────────────────
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((ev) => {
      if (!ev.affectsConfiguration("roycss")) return;
      // Reset caches so new config takes effect.
      completionItemsCache = null;
      browseItemsCache = null;
      // Re-scan all open documents in case severity / enable changed.
      if (diagnosticCollection) {
        for (const doc of vscode.workspace.textDocuments) {
          try {
            scanDocument(doc);
          } catch (_) {
            /* ignore */
          }
        }
      }
      outputChannel.appendLine("[RoyCSS] Configuration changed — caches reset.");
    }),
  );

  const elapsedMs = Number(process.hrtime.bigint() - startHr) / 1e6;
  outputChannel.appendLine(
    `[RoyCSS] Activated in ${elapsedMs.toFixed(1)} ms.`,
  );
}

/**
 * @returns {void}
 */
function deactivate() {
  // All disposables tracked via context.subscriptions — VSCode disposes them.
  // Clear timers defensively (in case a debounce is pending).
  for (const t of diagnosticTimers.values()) clearTimeout(t);
  diagnosticTimers.clear();
}

// ────────────────────────────────────────────────────────────────────────────
// 11. Exports
// ────────────────────────────────────────────────────────────────────────────

module.exports = {
  activate,
  deactivate,
  // Exposed for the smoke test:
  _internal: {
    loadClassData,
    buildCompletionItems,
    buildBrowseItems,
    RoyCSSCompletionProvider,
    RoyCSSHoverProvider,
    RoyCSSCodeActionProvider,
    scanDocument,
    suggestClassNames,
    levenshtein,
    buildDocs,
    getRoyClassToken,
    SUPPORTED_LANGUAGES,
    DOCUMENT_SELECTOR,
    COMPLETION_TRIGGERS,
  },
};
