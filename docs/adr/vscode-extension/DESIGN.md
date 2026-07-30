# RoyCSS VSCode Extension — Architecture Design

> Status: **Accepted** · Version: 1.0.0 · Last updated: 2026-07-31
> Owner: VSCode Extension domain (general-purpose subagent)
> Scope: `/home/z/my-project/vscode-extension/` and the installable `roycss-vscode-1.0.0.vsix`

---

## 1. Purpose

RoyCSS ships 1,569 production-ready CSS effects. Each effect is identified by a
class `roycss-<id>` (e.g. `roycss-pulse-glow`). The VSCode extension turns that
catalog into first-class editor support:

- **Autocomplete** — typing `roycss-` surfaces all 1,569 classes with documentation.
- **Hover docs** — hovering a `roycss-*` token shows the effect name, category,
  description, tags, and a fenced CSS preview block.
- **Snippets** — IntelliSense snippets that expand to a full HTML wrapper using
  the class (`<div class="roycss-…">Content</div>`), scoped to HTML/CSS/JSX/TSX/Vue/Svelte.
- **Diagnostics** — unknown `roycss-*` classes are flagged with a warning
  diagnostic (severity 1 → `Warning`) and a quick-fix `CodeAction` that suggests
  the closest known class.
- **Commands** — `roycss.browseEffects` opens a QuickPick of the full catalog;
  `roycss.searchEffect` opens an InputBox for fuzzy substring search and inserts
  the chosen class at the cursor.

The extension is **zero-runtime-dependency** and **zero-network-call**: all data
is bundled inside the `.vsix`. See `ADR.md` §1 and `THREAT-MODEL.md` for the
rationale.

---

## 2. Extension manifest (`package.json`)

### 2.1 Identity

| Field            | Value                                            |
| ---------------- | ------------------------------------------------ |
| `name`           | `roycss`                                         |
| `displayName`    | `RoyCSS`                                         |
| `publisher`      | `roycss`                                         |
| `version`        | `1.0.0`                                          |
| `license`        | `MIT`                                            |
| `engines.vscode` | `^1.85.0`                                        |
| `main`           | `./extension.js`                                 |
| `categories`     | `Snippets`, `Programming Languages`, `Other`     |
| `icon`           | `icons/icon.png`                                 |

### 2.2 Activation events

The extension activates the first time any of the eight supported languages is
opened, plus the two commands so they show up in the Command Palette even before
a file is open:

```jsonc
"activationEvents": [
  "onLanguage:css",
  "onLanguage:html",
  "onLanguage:javascript",
  "onLanguage:typescript",
  "onLanguage:javascriptreact",
  "onLanguage:typescriptreact",
  "onLanguage:vue",
  "onLanguage:svelte",
  "onCommand:roycss.browseEffects",
  "onCommand:roycss.searchEffect"
]
```

> **Note on `onLanguage:javascript` / `onLanguage:typescript`.** The plain
> (non-JSX) variants are included per the task spec so that template literals
> containing class strings (e.g. `className=\`roycss-…\``) in `.js` / `.ts`
> files also receive completion + hover + diagnostics. The completion provider
> uses a CSS-class-aware regex (see §4.1) so plain JS string contexts are
> handled correctly without polluting unrelated identifiers.

### 2.3 Contributions (`contributes`)

```text
commands            : roycss.browseEffects, roycss.searchEffect
snippets            : ./snippets.json (×8 languages)
configuration       : roycss.enableCompletion, roycss.enableHover,
                      roycss.enableDiagnostics, roycss.enableCodeActions,
                      roycss.maxCompletionItems, roycss.diagnosticSeverity
languages           : declares `roycss` language id + language-configuration.json
                      (so the optional `*.roycss` file extension works)
menus.commandPalette: both commands, gated on supported languages
```

### 2.4 Configuration schema

| Key                              | Type      | Default     | Description                                                                 |
| -------------------------------- | --------- | ----------- | --------------------------------------------------------------------------- |
| `roycss.enableCompletion`        | boolean   | `true`      | Register the `CompletionItemProvider`.                                     |
| `roycss.enableHover`             | boolean   | `true`      | Register the `HoverProvider`.                                              |
| `roycss.enableDiagnostics`       | boolean   | `true`      | Scan open documents for unknown `roycss-*` tokens and emit warnings.       |
| `roycss.enableCodeActions`       | boolean   | `true`      | Register the `CodeActionProvider` for quick-fix suggestions.               |
| `roycss.maxCompletionItems`      | number    | `1569`      | Cap the number of completion items (clamped 50–1569).                      |
| `roycss.diagnosticSeverity`      | enum      | `"warning"` | One of `"error"`, `"warning"`, `"information"`, `"hint"`, `"none"`.        |

---

## 3. Bundled data

| File              | Source                                    | Size (approx) | Purpose                                                            |
| ----------------- | ----------------------------------------- | ------------- | ----------------------------------------------------------------- |
| `class-data.json` | `dist/effects.json` (regenerated)         | ~600 KB       | Full catalog: id, className, name, category, description, tags, previewType, cssCode. |
| `snippets.json`   | Generated from `dist/effects.json`        | ~210 KB       | One HTML-wrapper snippet per effect (1,569 entries).              |
| `icons/icon.png`  | Reused from prior extension assets        | 5 KB          | Marketplace + editor icon.                                        |

Both JSON files are loaded **once** at `activate()` time, parsed with
`JSON.parse`, and indexed into in-memory `Map`s for O(1) lookup. Total memory
footprint at activation: ~3 MB (data) + ~5 MB (provider closures) ≈ 8 MB.

---

## 4. Providers

### 4.1 CompletionItemProvider

- **Trigger characters:** `-`, `"`, `'`, `` ` ``, space.
- **Selector:** the eight supported languages, scheme `file` and `untitled`.
- **Behavior:**
  1. Inspect the line up to the cursor; find the partial token matching
     `roycss-[\w-]*` that the cursor is inside.
  2. If found, return all `maxCompletionItems` matching classes as
     `CompletionItem` (kind `Class`), with `detail` = category, `documentation`
     = markdown (name + description + tags + fenced CSS preview).
  3. Each item carries a `command` `roycss._recordInsert` (internal) so that
     recently-used classes can be sorted to the top. (Optional — enabled only
     if `roycss.recentlyUsedLimit > 0`.)
- **Performance:** the 1,569 items are pre-built at activation; each
  `provideCompletionItems` call filters by substring against the cached array.
  Cold-call latency target: <30 ms on a 2024 laptop.

### 4.2 HoverProvider

- **Trigger:** VSCode calls it on any hover; the provider returns `null` if the
  word under the cursor is not a `roycss-*` token.
- **Output:** `MarkdownString`:

  ```markdown
  **Pulse Glow** · `animations`

  A smooth pulsing glow effect that draws attention to elements.

  `roycss-pulse-glow`

  Tags: `glow` · `pulse` · `attention` · `animate`

  ```css
  .roycss-pulse-glow {
    animation: roy-pulse-glow 2s ease-in-out infinite;
  }
  @keyframes roy-pulse-glow { … }
  ```

  [View on roycss.com](https://roycss.com)
  ```

- The CSS preview is truncated to 1,500 chars to keep the hover popup readable.

### 4.3 DiagnosticCollection

- **Collection name:** `roycss`.
- **Trigger:** registered via `vscode.languages.createDiagnosticCollection` and
  wired to `workspace.onDidOpenTextDocument`, `workspace.onDidChangeTextDocument`,
  and `workspace.onDidSaveTextDocument` for the eight supported languages.
- **Algorithm:**
  1. Tokenize the document text with a single global regex:
     `/(?:class(?:Name)?\s*=\s*["'`])?([\s\S]*?)(["'`])/g` is too greedy — use a
     targeted scan that matches `roycss-[\w-]+` anywhere, then verifies the
     match is in a "class-context" (inside `class="…"`, `className="…"`,
     `:class="…"`, `class:list=[…]`, or a CSS selector / template literal).
  2. For each match not in `classData.byClass`, emit a `Diagnostic` at severity
     `roycss.diagnosticSeverity` with message:
     `Unknown RoyCSS class "roycss-foo". Did you mean "roycss-foo-bar"?`
  3. The suggestion is computed by Levenshtein distance ≤ 3 against the
     class list (capped at 200 candidates to keep the scan fast).
- **Debounce:** 300 ms after `onDidChangeTextDocument` to avoid re-scanning on
  every keystroke during fast typing.

### 4.4 CodeActionProvider

- **Trigger:** `vscode.languages.registerCodeActionProvider` on the same
  selector, with `providedCodeActionKinds: [CodeActionKind.QuickFix]`.
- **Behavior:** for each `Diagnostic` of source `roycss`, produce one
  `CodeAction` per top suggestion (up to 3) that performs a `WorkspaceEdit`
  replacing the offending token with the suggested class.

---

## 5. Commands

### 5.1 `roycss.browseEffects`

- **Title:** `RoyCSS: Browse Effects`
- **UI:** `vscode.window.showQuickPick(items, { placeHolder: "Browse 1569 RoyCSS effects", matchOnDescription: true, matchOnDetail: true })`.
- **Items:** `{ label: "roycss-pulse-glow", description: "Pulse Glow", detail: "animations · A smooth pulsing glow…" }` for each effect.
- **On select:** insert `label` at the current cursor (`editor.edit`), or copy
  to clipboard if no text editor is open.
- **Performance:** the QuickPick items are built once and cached.

### 5.2 `roycss.searchEffect`

- **Title:** `RoyCSS: Search Effect`
- **UI:** `vscode.window.showInputBox({ prompt: "Search RoyCSS effects by name, tag, or id", placeHolder: "e.g. glow, button, hover-zoom" })`.
- **Behavior:** on submit, filter the catalog by case-insensitive substring
  match across `name`, `id`, and `tags`. If exactly one match → insert it. If
  multiple matches → open a QuickPick with just those matches. If zero matches
  → show an information message.

---

## 6. Language contribution (optional)

A `roycss` language id is declared so that `*.roycss` files (if any user
adopts that convention) get a sensible default language configuration
(brackets, comments, auto-closing pairs). The `language-configuration.json`
file mirrors CSS conventions:

- Comments: `/* … */`
- Brackets: `()`, `[]`, `{}`
- Auto-closing: enabled for the same set
- On-enter rules: increase indent after `{`, decrease indent before `}`.

This is **non-essential** for the core feature set; it's a no-op for users
who only edit HTML/CSS/JSX.

---

## 7. Activation & lifecycle

```text
[VSCode starts]
  └─ onLanguage:* fires → activate(context)
       ├─ load class-data.json (sync, JSON.parse)
       ├─ load snippets.json   (sync, JSON.parse) — already contributed via manifest
       ├─ build byClass Map + classList array + search index
       ├─ register CompletionItemProvider (trigger chars: - " ' ` space)
       ├─ register HoverProvider
       ├─ register DiagnosticCollection + listeners
       ├─ register CodeActionProvider
       ├─ register commands: roycss.browseEffects, roycss.searchEffect
       └─ log "[RoyCSS] Activated in Xms — N effects loaded"

[user types in CSS/HTML/JSX…]
  └─ VSCode calls provideCompletionItems / provideHover / onDidChangeTextDocument

[VSCode shuts down]
  └─ deactivate() — no-op; all disposables tracked via context.subscriptions
```

`activate()` target cold-start: <80 ms on a 2024 laptop. The dominant cost is
the synchronous `JSON.parse` of `class-data.json` (~25 ms).

---

## 8. Data flow

```text
dist/effects.json  ──┐
                     ├─→ build-data.js (node script, run pre-pack)
dist/roycss.css   ──┘        │
                             ├─→ vscode-extension/class-data.json
                             └─→ vscode-extension/snippets.json
                                       │
                                       └─→ packed into .vsix by vsce package
                                                   │
                                                   └─→ installed in user's VSCode
                                                          │
                                                          └─→ extension.js loads both
                                                              at activate() time
```

The build step is idempotent and runs from `build.sh` (which also runs
`vsce package`). The two JSON files are checked into the repo so the extension
can be packaged without a build step if needed.

---

## 9. Failure modes

| Failure                              | Detection                                  | Recovery                                                                  |
| ------------------------------------ | ------------------------------------------ | ------------------------------------------------------------------------- |
| `class-data.json` missing on disk    | `JSON.parse` throws in `activate()`        | Log to output channel; providers return empty results; diagnostics off.   |
| `class-data.json` malformed          | Same                                       | Same; user is told to reinstall the extension.                           |
| `snippets.json` malformed            | VSCode logs to the Extension Host console  | User can still use completion + hover; snippets silently unavailable.     |
| User disabled a feature via settings | `getConfiguration().get('roycss.enable*')` | Skip the relevant `register*` call; the rest of the extension still works. |
| Effect count mismatch (<1569)        | `build.sh` asserts count                   | Build fails fast; CI catches it before a release.                         |

---

## 10. Non-goals

- **Network features.** No telemetry, no marketplace fetch, no auto-update. The
  extension is hermetic.
- **A custom Language Server.** Direct providers are sufficient for the
  catalog size; an LSP would add 200 KB+ and a child process for no gain. See
  `ADR.md` §2.
- **Live preview of effects inside VSCode.** Out of scope; the hover preview
  shows the CSS source, not a rendered DOM. The web inspector
  (`/home/z/my-project/inspector/`) handles live preview.
- **Framework-specific integrations** (Tailwind plugin, Next.js plugin, etc.).
  The eight supported language IDs cover all JSX/TSX/Vue/Svelte templates
  where class strings live.

---

## 11. Cross-references

- `ADR.md` — 4 ADRs covering the major architectural decisions.
- `THREAT-MODEL.md` — STRIDE analysis of supply chain + malicious snippets.
- `IMPLEMENTATION-PLAN.md` — step-by-step build order with verification gates.
- `REVIEW-CHECKLIST.md` — 15 review items for sign-off.
