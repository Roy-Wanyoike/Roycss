# Changelog

All notable changes to the **RoyCSS** VSCode extension are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] — 2026-07-31

### Added

- **Initial release** of the RoyCSS VSCode extension.
- **CompletionItemProvider** for all **1,569** `roycss-*` classes. Typing
  `roycss-` in any of the 8 supported languages (CSS, HTML, JS, TS, JSX, TSX,
  Vue, Svelte) surfaces the full catalog with class name, effect name,
  category, description, tags, and a fenced CSS preview block.
- **HoverProvider** — hovering a `roycss-*` token shows the effect's full
  metadata (name, category, description, className, tags) plus a copyable
  CSS preview block (truncated at 1,500 chars for readability).
- **DiagnosticCollection** — flags unknown `roycss-*` classes with a
  configurable severity (`error` / `warning` / `information` / `hint` /
  `none`). Default: `warning`. Diagnostic message includes the closest
  known classes (Levenshtein distance ≤ 3).
- **CodeActionProvider** — quick-fix on unknown-class diagnostics offers to
  replace the typo with the closest known class (up to 3 suggestions).
- **Command: `RoyCSS: Browse Effects`** (`roycss.browseEffects`) — opens a
  QuickPick of all 1,569 effects; inserts the chosen class at the cursor.
- **Command: `RoyCSS: Search Effect`** (`roycss.searchEffect`) — opens an
  InputBox for fuzzy substring search across name, id, className,
  description, and tags.
- **Snippets** — 1,569 HTML-wrapper snippets (one per effect) scoped to all
  8 supported languages. Type a class name + `Tab` to expand to
  `<div class="roycss-…">Content</div>`.
- **Language contribution** — declares the `roycss` language id for
  `*.roycss` files, with a `language-configuration.json` mirroring CSS
  conventions (block comments, brackets, auto-closing pairs, on-enter rules).
- **Configuration** — 6 settings: `roycss.enableCompletion`,
  `roycss.enableHover`, `roycss.enableDiagnostics`,
  `roycss.enableCodeActions`, `roycss.maxCompletionItems` (50–1569),
  `roycss.diagnosticSeverity`.
- **Keybindings** — `Ctrl+Shift+R` / `Cmd+Shift+R` for Search Effect;
  `Ctrl+Shift+Alt+R` / `Cmd+Shift+Alt+R` for Browse Effects.
- **Output channel** — `RoyCSS` channel logs activation timing, provider
  registration, command invocations, and any data-load errors. **No telemetry,
  no network, no error reporting.**
- **Build script** (`build.sh`) — regenerates `class-data.json` +
  `snippets.json` from `../dist/effects.json` + `../dist/roycss.css`, then
  packages a `.vsix` via `vsce package` (or `npx @vscode/vsce@latest package`
  as fallback).
- **Smoke test** (`test/smoke.test.js`) — mocks the `vscode` module and
  verifies that `activate()` registers 2 commands, 1 completion provider,
  1 hover provider, 1 code-action provider, and 1 diagnostic collection.

### Security & supply chain

- **Zero runtime dependencies.** `dependencies: {}` in `package.json`.
- **Zero dev dependencies.** `devDependencies: {}` in `package.json`.
- **Zero `postinstall` scripts.** The only `scripts` are `build`, `package`,
  `test`, `lint` — all run at development time, never at install time.
- **Zero network calls** in `extension.js` (verified by grep).
- **Zero `child_process`** usage in `extension.js` (verified by grep).
- **All data bundled inside the `.vsix`** — `class-data.json` (1.7 MB) and
  `snippets.json` (470 KB) are checked in and packed by `vsce`.
- See `docs/adr/vscode-extension/THREAT-MODEL.md` for the full STRIDE
  analysis (17 threats enumerated, 0 critical, 1 high mitigated, 3 medium
  mitigated, 11 low, 3 N/A).

### Architecture

- **Direct providers, no Language Server.** A single `extension.js` (CommonJS,
  plain Node.js — no TypeScript, no bundler) registers all 4 providers and 2
  commands. See `docs/adr/vscode-extension/ADR.md` §2 for the rationale.
- **Bundled catalog, no network fetch.** `class-data.json` is generated at
  build time from `dist/effects.json`. See `docs/adr/vscode-extension/ADR.md`
  §1.
- **Debounced regex diagnostics, no CST parse.** 300 ms debounce after
  `onDidChangeTextDocument`; files >200 KB are skipped. See
  `docs/adr/vscode-extension/ADR.md` §5.

### Documentation

- `docs/adr/vscode-extension/DESIGN.md` — architecture (activation, providers,
  lifecycle, failure modes).
- `docs/adr/vscode-extension/ADR.md` — 5 ADRs.
- `docs/adr/vscode-extension/THREAT-MODEL.md` — STRIDE.
- `docs/adr/vscode-extension/IMPLEMENTATION-PLAN.md` — step-by-step plan.
- `docs/adr/vscode-extension/REVIEW-CHECKLIST.md` — 15 review items.
- `vscode-extension/README.md` — install / usage / configuration / build.

### Known limitations

- **9 effects have no CSS preview in hover.** These effects
  (`ferrum-skeleton-card-*`, `ferrum-input-float-label-wrapper`, etc.) are
  defined in `dist/roycss.css` using CSS nesting without explicit closing
  braces for the outer rules — the extractor falls back to a 600-char snippet
  but it may not capture the full rule. Hover shows what's available; the
  full CSS is in `dist/roycss.css` on disk.
- **1 effect has no CSS at all.** `card-gradient-border-b19` is listed in
  `dist/effects.json` but has no corresponding `.roycss-card-gradient-border-b19`
  rule in `dist/roycss.css` (only `…-b19-v2` exists). The hover popup shows
  a placeholder comment.
- **No live preview inside VSCode.** Hover shows the CSS source, not a
  rendered DOM. For live preview, use the RoyCSS web inspector at
  <https://roycss.com> or the browser-extension inspector
  (`/home/z/my-project/inspector/`).
- **Diagnostics scan is regex-based.** Occasional false positives in unusual
  contexts (e.g. a string literal that happens to contain `roycss-` followed
  by an unknown id). Severity is `Warning` by default; disable via
  `roycss.enableDiagnostics: false`.

---

## Template for future releases

```markdown
## [Unreleased]

### Added
- …

### Changed
- …

### Fixed
- …

### Security
- …

### Removed
- …
```
