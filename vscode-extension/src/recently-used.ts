/**
 * RecentlyUsed — tracks which `roycss-*` classes the user has inserted,
 * sorted by recency. Persisted via `context.workspaceState` so the sort
 * order survives editor reloads.
 *
 * Used by:
 *   - completion-provider.ts (to float recently-used items to the top)
 *   - commands.ts (to record when the user inserts via QuickPick)
 */

import * as vscode from "vscode";

const RECENT_KEY = "roycss.recentlyUsed";
const RECENT_DEFAULT_LIMIT = 50;

let output: vscode.OutputChannel | undefined;

/** Allows the extension entry point to inject its output channel for logging. */
export function setOutputChannel(channel: vscode.OutputChannel): void {
  output = channel;
}

export class RecentlyUsed {
  private readonly limit: number;
  private readonly state: vscode.Memento;
  private cache: string[] | undefined;

  constructor(context: vscode.ExtensionContext) {
    this.state = context.workspaceState;
    const cfg = vscode.workspace.getConfiguration("roycss");
    this.limit = cfg.get<number>("recentlyUsedLimit", RECENT_DEFAULT_LIMIT);
  }

  /** Returns the recently-used class names, most-recent first. */
  list(): string[] {
    if (this.cache === undefined) {
      const stored = this.state.get<string[]>(RECENT_KEY, []);
      this.cache = Array.isArray(stored) ? stored.slice(0, this.limit) : [];
    }
    return this.cache;
  }

  /** Records a class as just-used. Moves it to the front of the list. */
  record(className: string): void {
    const current = this.list().filter((c) => c !== className);
    current.unshift(className);
    this.cache = current.slice(0, this.limit);
    try {
      void this.state.update(RECENT_KEY, this.cache);
    } catch (err) {
      // workspaceState.update can throw if the workspace is in a weird state
      // (e.g., closed mid-write). Log and continue — recently-used is a
      // best-effort sort, not a correctness requirement.
      output?.appendLine(`[RoyCSS] Failed to persist recentlyUsed: ${String(err)}`);
    }
  }
}
