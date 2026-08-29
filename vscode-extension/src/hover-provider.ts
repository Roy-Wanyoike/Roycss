/**
 * RoyCSSHoverProvider
 *
 * Returns hover info for `roycss-*` tokens in HTML, CSS, JSX, TSX, Vue,
 * and Svelte documents.
 *
 * Hover content (MarkdownString):
 *   ### Effect Name
 *   <description>
 *
 *   **Tags:** `tag1`, `tag2`, `tag3`
 *   **Category:** `animations`
 *
 *   ```css
 *   <full CSS source — lazy-loaded from data/css-data.json>
 *   ```
 *
 *   [View on RoyCSS](https://roycss.com)
 *
 * The CSS source is loaded on first hover (lazy) and cached for the
 * extension lifetime.
 */

import * as vscode from "vscode";
import { findByClassName, getCssCode, type EffectMeta } from "./effects-data";

const ROYCSS_LINK_TARGETS: Record<string, string> = {
  "roycss.com": "https://roycss.com",
  github: "https://github.com/Roy-Wanyoike/roycss",
  none: "",
};

export class RoyCSSHoverProvider implements vscode.HoverProvider {
  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken,
  ): vscode.Hover | undefined {
    const range = document.getWordRangeAtPosition(
      position,
      /\broycss-[a-z0-9]+(?:-[a-z0-9]+)*\b/i,
    );
    if (!range) return undefined;

    const className = document.getText(range).toLowerCase();
    const effect = findByClassName(className);
    if (!effect) return undefined;

    return new vscode.Hover(this.buildMarkdown(effect), range);
  }

  private buildMarkdown(effect: EffectMeta): vscode.MarkdownString {
    const md = new vscode.MarkdownString();
    md.isTrusted = false; // no command URIs, no inline HTML
    md.supportThemeIcons = true;

    // ─── H3: Effect name ───
    md.appendMarkdown(`### ${escapeMarkdown(effect.name)}\n\n`);

    // ─── Description ───
    md.appendMarkdown(`${escapeMarkdown(effect.description)}\n\n`);

    // ─── Tags ───
    if (effect.tags.length > 0) {
      md.appendMarkdown(
        `**Tags:** ${effect.tags.map((t) => `\`${escapeMarkdown(t)}\``).join(", ")}\n\n`,
      );
    }

    // ─── Category + preview type ───
    md.appendMarkdown(
      `**Category:** \`${escapeMarkdown(effect.category)}\`  \n` +
        `**Preview type:** \`${escapeMarkdown(effect.previewType)}\`\n\n`,
    );

    // ─── CSS preview (lazy-loaded) ───
    const enableHoverPreview = vscode.workspace
      .getConfiguration("roycss")
      .get<boolean>("enableHoverPreview", true);

    if (enableHoverPreview) {
      const css = getCssCode(effect.id);
      if (css) {
        // Truncate very long CSS so the hover doesn't dominate the viewport.
        // 1500 chars is ~50 lines — plenty for the typical effect.
        const truncated = css.length > 1500 ? css.slice(0, 1500) + "\n/* … truncated */" : css;
        md.appendMarkdown("```css\n" + truncated + "\n```\n\n");
      }
    }

    // ─── Link ───
    const linkTarget = vscode.workspace
      .getConfiguration("roycss")
      .get<"roycss.com" | "github" | "none">("hoverLinkTarget", "roycss.com");
    const url = ROYCSS_LINK_TARGETS[linkTarget];
    if (url) {
      md.appendMarkdown(`[View on RoyCSS](${url})\n`);
    }

    return md;
  }
}

/**
 * Escapes characters that would otherwise be interpreted as Markdown syntax.
 * We only escape the characters most likely to appear in user-facing strings
 * (descriptions and tag names): backticks, asterisks, underscores, and
 * square brackets.
 */
function escapeMarkdown(s: string): string {
  return s.replace(/[`*_\[\]]/g, (ch) => "\\" + ch);
}
