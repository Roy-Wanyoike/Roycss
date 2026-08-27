/**
 * RoyCSSCompletionProvider
 *
 * Returns `roycss-*` class completions for HTML, CSS, JSX, TSX, Vue, and
 * Svelte documents. Returns the full 1569-effect catalog when the user
 * types the `roycss-` prefix, sorted by:
 *   1. Recently-used classes (most-recent first)
 *   2. Alphabetical by class name
 *
 * Each completion item:
 *   - label: `.roycss-X` (with the leading dot for visual cue)
 *   - detail: the human-readable effect name (e.g., "Pulse Glow")
 *   - documentation: description + tags (Markdown)
 *   - insertText: `roycss-X` (no leading dot — the user is inside a class
 *     attribute string and wants the bare class name)
 *   - kind: vscode.CompletionItemKind.Class
 *   - filterText: `roycss-X` (so the user can type either "roycss-" or
 *     "pulse-glow" to filter)
 */

import * as vscode from "vscode";
import { effects, type EffectMeta } from "./effects-data";
import { RecentlyUsed } from "./recently-used";

const ROYCSS_PREFIX = "roycss-";

export class RoyCSSCompletionProvider implements vscode.CompletionItemProvider {
  private readonly recentlyUsed: RecentlyUsed;

  constructor(recentlyUsed: RecentlyUsed) {
    this.recentlyUsed = recentlyUsed;
  }

  /**
   * Called by VSCode when the user types in a document that matches our
   * DocumentSelector. We always return the full catalog (VSCode filters
   * it down based on what the user has typed so far).
   *
   * Returning a `CompletionList` with `items: []` and `isIncomplete: false`
   * would suppress the completion popup; we return the full list and let
   * VSCode filter.
   */
  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken,
    _context: vscode.CompletionContext,
  ): vscode.CompletionItem[] | vscode.CompletionList {
    // ─── Bail out fast if the cursor isn't in a context where roycss-* classes make sense ───
    if (!isInClassContext(document, position)) {
      return [];
    }

    // ─── Build the full item list ───
    const maxItems = this.getMaxItems();
    const recent = new Set(this.recentlyUsed.list());
    const items: vscode.CompletionItem[] = [];

    for (let i = 0; i < effects.length && items.length < maxItems; i++) {
      const effect = effects[i];
      const className = ROYCSS_PREFIX + effect.id;
      const item = new vscode.CompletionItem(
        "." + className,
        vscode.CompletionItemKind.Class,
      );

      item.detail = effect.name;
      item.documentation = buildDocumentation(effect);
      item.insertText = className;
      item.filterText = className;

      // Recently-used items get a higher sort priority so they float to the top.
      if (recent.has(className)) {
        item.sortText = "0_" + effect.id;
      } else {
        item.sortText = "1_" + effect.id;
      }

      items.push(item);
    }

    return new vscode.CompletionList(items, false);
  }

  private getMaxItems(): number {
    const cfg = vscode.workspace.getConfiguration("roycss");
    return cfg.get<number>("maxCompletionItems", effects.length);
  }
}

// ───────────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────────

/**
 * Returns true if the cursor is in a position where `roycss-*` class names
 * make sense — i.e., inside an HTML/SVG `class="..."` or `className="..."`
 * attribute, inside a CSS class selector, or inside a Vue/Svelte class
 * binding.
 *
 * This is a fast heuristic — we don't tokenize the document. If the cursor
 * is on a line containing `class=` or `className=`, or inside a CSS rule,
 * we return true.
 */
function isInClassContext(
  document: vscode.TextDocument,
  position: vscode.Position,
): boolean {
  const line = document.lineAt(position.line).text;
  const prefix = line.slice(0, position.character);

  // HTML / JSX / Vue / Svelte class attribute
  if (/\b(class|className|class:)\s*[:=]\s*["'`{]/i.test(prefix)) {
    return true;
  }

  // CSS / SCSS / Less rule context — line starts with `.` or contains `.roycss-`
  if (/^\s*\.[\w-]*$/.test(line) || /\.roycss-[\w-]*/.test(line)) {
    return true;
  }

  // Tailwind-style class list (just a string of classes)
  if (/\bclass\s*=\s*["'`]/i.test(line) && position.character > line.indexOf("=")) {
    return true;
  }

  // Fallback: if the user has already typed `roycss-` on this line, complete it.
  if (/roycss-[\w-]*$/.test(prefix)) {
    return true;
  }

  return false;
}

/**
 * Builds a MarkdownString documentation block for a completion item.
 * Format:
 *   <description>
 *
 *   **Tags:** tag1, tag2, tag3
 *   **Category:** animations
 *   **Preview type:** box
 */
function buildDocumentation(effect: EffectMeta): vscode.MarkdownString {
  const md = new vscode.MarkdownString();
  md.isTrusted = false; // no command URIs, no inline HTML
  md.supportThemeIcons = true;

  md.appendMarkdown(effect.description + "\n\n");
  md.appendMarkdown(
    `**Tags:** ${effect.tags.map((t) => `\`${t}\``).join(", ")}\n\n`,
  );
  md.appendMarkdown(`**Category:** \`${effect.category}\`\n\n`);
  md.appendMarkdown(`**Preview type:** \`${effect.previewType}\`` + "\n");

  return md;
}
