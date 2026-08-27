/**
 * RoyCSS Commands
 *
 * Registers three commands:
 *   - roycss.searchEffects  — QuickPick over 1569 effects, fuzzy search, on
 *                              select copies the class name to the clipboard
 *                              (or inserts at cursor if `editor` is focused).
 *   - roycss.insertEffect   — Same QuickPick, always inserts at cursor.
 *   - roycss.openPlayground — Opens the playground webview panel.
 *
 * All three commands are exposed in `contributes.commands` in package.json.
 */

import * as vscode from "vscode";
import { effects } from "./effects-data";
import { RecentlyUsed } from "./recently-used";
import { openPlayground } from "./search-panel";

const ROYCSS_PREFIX = "roycss-";

/**
 * Registers all three RoyCSS commands. Returns a Disposable that disposes
 * all three command registrations.
 */
export function registerCommands(recentlyUsed: RecentlyUsed): vscode.Disposable {
  const disposables: vscode.Disposable[] = [];

  disposables.push(
    vscode.commands.registerCommand("roycss.searchEffects", () =>
      searchEffectsCommand(recentlyUsed, { alwaysInsert: false }),
    ),
  );

  disposables.push(
    vscode.commands.registerCommand("roycss.insertEffect", () =>
      searchEffectsCommand(recentlyUsed, { alwaysInsert: true }),
    ),
  );

  disposables.push(
    vscode.commands.registerCommand("roycss.openPlayground", () => {
      try {
        openPlayground();
      } catch (err) {
        vscode.window.showErrorMessage(
          `[RoyCSS] Failed to open playground: ${String(err)}`,
        );
      }
    }),
  );

  return vscode.Disposable.from(...disposables);
}

// ───────────────────────────────────────────────────────────────────────
// QuickPick — fuzzy search across all 1569 effects
// ───────────────────────────────────────────────────────────────────────

interface SearchPickItem extends vscode.QuickPickItem {
  /** The `roycss-X` class name to insert. */
  readonly className: string;
}

/**
 * Builds the QuickPick items for all 1569 effects. Each item's `label` is
 * the effect name, `description` is the category, and `detail` is the
 * description (truncated for the QuickPick UI).
 */
function buildPickItems(): SearchPickItem[] {
  return effects.map((effect) => {
    const className = ROYCSS_PREFIX + effect.id;
    return {
      label: effect.name,
      description: `$(symbol-class) ${className}`,
      detail: effect.description,
      className,
    } as SearchPickItem;
  });
}

/**
 * Shows the QuickPick. On select:
 *   - If `alwaysInsert` is true OR the active editor has focus, insert the
 *     class at the cursor and record it as recently-used.
 *   - Otherwise, copy the class to the clipboard and tell the user.
 */
async function searchEffectsCommand(
  recentlyUsed: RecentlyUsed,
  opts: { alwaysInsert: boolean },
): Promise<void> {
  const items = buildPickItems();
  const editor = vscode.window.activeTextEditor;

  const picked = await vscode.window.showQuickPick(items, {
    placeHolder: `Search ${effects.length} RoyCSS effects…`,
    matchOnDescription: true,
    matchOnDetail: true,
    ignoreFocusOut: false,
    canPickMany: false,
  });

  if (!picked) return;

  // ─── Insert at cursor if there's an active editor ───
  if (editor) {
    try {
      await editor.edit((builder) => {
        const sel = editor.selection;
        if (sel.isEmpty) {
          builder.insert(sel.active, picked.className);
        } else {
          builder.replace(sel, picked.className);
        }
      });
      recentlyUsed.record(picked.className);
      return;
    } catch (err) {
      vscode.window.showErrorMessage(
        `[RoyCSS] Failed to insert "${picked.className}": ${String(err)}`,
      );
      return;
    }
  }

  // ─── No editor: copy to clipboard ───
  if (!opts.alwaysInsert) {
    try {
      await vscode.env.clipboard.writeText(picked.className);
      vscode.window.showInformationMessage(
        `[RoyCSS] Copied "${picked.className}" to clipboard`,
      );
    } catch (err) {
      vscode.window.showErrorMessage(
        `[RoyCSS] Failed to copy "${picked.className}": ${String(err)}`,
      );
    }
  } else {
    vscode.window.showWarningMessage(
      "[RoyCSS] No active editor — open a file first, then run RoyCSS: Insert Effect again.",
    );
  }
}
