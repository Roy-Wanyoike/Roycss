/**
 * RoyCSS VSCode Extension — entry point.
 *
 * activate() is called by VSCode the first time a supported language is
 * opened (per `activationEvents` in package.json). It registers:
 *   - CompletionItemProvider (for `roycss-*` class completions)
 *   - HoverProvider (for hover info on `roycss-*` tokens)
 *   - 3 commands (searchEffects, insertEffect, openPlayground)
 *
 * deactivate() is a no-op — all state is in workspaceState, which VSCode
 * persists automatically. No background timers, no file watchers, no
 * disposable resources need explicit teardown.
 */

import * as vscode from "vscode";
import { RoyCSSCompletionProvider } from "./completion-provider";
import { RoyCSSHoverProvider } from "./hover-provider";
import { registerCommands } from "./commands";
import { RecentlyUsed, setOutputChannel } from "./recently-used";
import { effects } from "./effects-data";

let output: vscode.OutputChannel | undefined;

/** Languages the extension activates on (mirrors package.json activationEvents). */
export const SUPPORTED_LANGUAGES = [
  "html",
  "css",
  "javascriptreact",
  "typescriptreact",
  "vue",
  "svelte",
] as const;

/** Selector for documents the providers will be registered against. */
const DOCUMENT_SELECTOR: vscode.DocumentSelector = SUPPORTED_LANGUAGES.map(
  (language) => ({ scheme: "file", language }),
);

/** TRIGGER characters that cause VSCode to call our completion provider eagerly. */
const COMPLETION_TRIGGERS = ["-", "."];

export function activate(context: vscode.ExtensionContext): void {
  const start = process.hrtime.bigint();

  // ─── Output channel for diagnostics (NEVER telemetry — local-only) ───
  output = vscode.window.createOutputChannel("RoyCSS");
  context.subscriptions.push(output);
  setOutputChannel(output);

  output.appendLine(
    `[RoyCSS] Activating — ${effects.length} effects loaded from embedded data`,
  );

  // ─── Recently-used tracker (shared between completion + insert command) ───
  const recentlyUsed = new RecentlyUsed(context);

  // ─── Completion provider ───
  const completionProvider = new RoyCSSCompletionProvider(recentlyUsed);
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      DOCUMENT_SELECTOR,
      completionProvider,
      ...COMPLETION_TRIGGERS,
    ),
  );

  // ─── Hover provider ───
  const hoverProvider = new RoyCSSHoverProvider();
  context.subscriptions.push(
    vscode.languages.registerHoverProvider(DOCUMENT_SELECTOR, hoverProvider),
  );

  // ─── Commands ───
  context.subscriptions.push(registerCommands(recentlyUsed));

  // ─── Done ───
  const elapsedMs = Number(process.hrtime.bigint() - start) / 1e6;
  output.appendLine(
    `[RoyCSS] Activated in ${elapsedMs.toFixed(1)} ms — completion + hover + commands registered`,
  );
}

export function deactivate(): void {
  // No-op. All disposables are tracked via context.subscriptions and VSCode
  // will dispose them automatically. The output channel is also in
  // subscriptions, so we don't need to close it here.
}

// Re-export RecentlyUsed so existing imports from "./extension" keep working.
export { RecentlyUsed } from "./recently-used";
