# RoyCSS — Official VS Code Extension Architecture

> **Mission:** Make RoyCSS the most productive CSS-effects library to author inside VS Code. The extension brings the 700+ effect registry, design tokens, OKLCH palette, accessibility hints, performance warnings, and AI-assisted suggestions directly into the editor — so developers never need to leave their file to discover, preview, lint, or migrate RoyCSS.

The extension is published as **`roycss.roycss-vscode`** on the VS Code Marketplace and Open VSX. It is built on the **Language Server Protocol (LSP)** so it also works in VSCodium, Cursor, Windsurf, GitHub Codespaces, and (with adapter shims) Neovim and JetBrains via LSP clients.

---

## Table of Contents

1. [Architecture](#1-architecture)
2. [Extension API](#2-extension-api)
3. [Language Server Protocol](#3-language-server-protocol)
4. [Commands](#4-commands)
5. [Snippets](#5-snippets)
6. [Diagnostics](#6-diagnostics)
7. [Hover Providers](#7-hover-providers)
8. [Completion Providers](#8-completion-providers)
9. [Configuration](#9-configuration)
10. [Installation](#10-installation)
11. [Roadmap](#11-roadmap)

---

## 1. Architecture

### 1.1 High-Level Topology

```
┌────────────────────────────────────────────────────────────────┐
│  VS Code Extension Host (Node.js, per-workspace)               │
│                                                                │
│  ┌──────────────────┐    ┌──────────────────────────────────┐  │
│  │ extension.ts     │    │  Language Client (vscode-language │  │
│  │  - activation    │◄──►│  client) — JSON-RPC over stdio    │  │
│  │  - commands      │    │                                  │  │
│  │  - webview views │    └────────────────┬─────────────────┘  │
│  │  - status bar    │                     │                    │
│  └──────────────────┘                     │                    │
│                                           │ spawn               │
└───────────────────────────────────────────┼────────────────────┘
                                            │
                                            ▼
┌────────────────────────────────────────────────────────────────┐
│  RoyCSS Language Server (Node.js, isolated process)            │
│                                                                │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────┐    │
│  │ Document    │  │ Class       │  │ Diagnostic Engine    │    │
│  │ Store       │  │ Registry    │  │  - lint              │    │
│  │ (增量 parse)│  │ (700+ cls)  │  │  - dead-class        │    │
│  └─────────────┘  └─────────────┘  │  - a11y hints        │    │
│                                    │  - perf warnings     │    │
│  ┌─────────────┐  ┌─────────────┐  └──────────────────────┘    │
│  │ Hover       │  │ Completion  │  ┌──────────────────────┐    │
│  │ Provider    │  │ Provider    │  │ Code Actions         │    │
│  │ (preview +  │  │ (fuzzy +    │  │  - sort classes      │    │
│  │  OKLCH swat)│  │  relevance) │  │  - migrate           │    │
│  └─────────────┘  └─────────────┘  │  - fix conflicts     │    │
│                                    └──────────────────────┘    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  AI Suggestion Engine                                    │  │
│  │   - context collector (file + project + selection)       │  │
│  │   - prompt builder → RoyCSS AI endpoint                  │  │
│  │   - response → inline suggestions                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Shared Data Layer                                       │  │
│  │   - roycss-classes.json   (class registry, 700+)         │  │
│  │   - roycss-snippets.json  (HTML scaffolds)               │  │
│  │   - design-tokens.json    (OKLCH palette)                │  │
│  │   - effect-metadata.json  (a11y, perf, variants)         │  │
│  │   - migration-map.json    (Animate.css/Tailwind/Bootstrap│  │
│  │                            class → RoyCSS class)         │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

### 1.2 Design Principles

1. **LSP-first.** Every language feature is implemented in the language server; the extension host is a thin shell. This guarantees portability to other LSP clients.
2. **Static-data where possible.** Class metadata is bundled at build time; no runtime fetches for known data.
3. **Zero-config by default, full-config when needed.** Install and it works. Power users can override every behavior.
4. **Performance over completeness.** A 50ms hover is more valuable than a 500ms hover with extra info.
5. **Diagnostics are suggestions, not errors.** RoyCSS classes are CSS — we never block compilation. All diagnostics are warnings or hints.
6. **Offline-first.** The extension works fully offline; AI features degrade gracefully.

### 1.3 Activation Events

```jsonc
// package.json (extension manifest, abbreviated)
{
  "activationEvents": [
    "onLanguage:html",
    "onLanguage:css",
    "onLanguage:scss",
    "onLanguage:vue",
    "onLanguage:svelte",
    "onLanguage:javascript",
    "onLanguage:typescript",
    "onLanguage:javascriptreact",
    "onLanguage:typescriptreact",
    "onLanguage:astro",
    "onLanguage:handlebars",
    "onLanguage:php",
    "onLanguage:ruby",
    "onLanguage:python",
    "onLanguage:rust",
    "onStartupFinished"
  ]
}
```

RoyCSS class names appear in HTML, template syntax, JSX `className`, Vue `class=`, Svelte `class:`, Astro frontmatter, and even server-template languages. The extension activates on any language that can contain class attributes.

### 1.4 Project Structure

```
packages/
├── vscode-roycss/                  ← the published extension
│   ├── src/
│   │   ├── extension.ts            ← activation, command/view registration
│   │   ├── language-client.ts      ← LSP client wiring
│   │   ├── commands/               ← VS Code command handlers
│   │   │   ├── sort-classes.ts
│   │   │   ├── migrate.ts
│   │   │   ├── insert-snippet.ts
│   │   │   ├── open-in-docs.ts
│   │   │   └── toggle-theme.ts
│   │   ├── views/                  ← webview views
│   │   │   ├── explorer-view.ts
│   │   │   ├── token-view.ts
│   │   │   └── ai-suggest-view.ts
│   │   ├── statusBar/              ← status bar items
│   │   └── utils/
│   ├── syntaxes/                   ← TextMate grammars
│   │   └── roycss-classes.tmLanguage.json
│   ├── snippets/
│   │   └── roycss.json             ← VS Code native snippets (fallback)
│   ├── data/                       ← static data (copied from root)
│   │   ├── roycss-classes.json
│   │   ├── roycss-snippets.json
│   │   ├── design-tokens.json
│   │   ├── effect-metadata.json
│   │   └── migration-map.json
│   ├── webviews/                   ← React bundles for webviews
│   ├── package.json                ← extension manifest
│   ├── tsconfig.json
│   └── README.md
├── roycss-lsp/                     ← the language server (reusable)
│   ├── src/
│   │   ├── server.ts               ← LSP entry
│   │   ├── documents/              ← text document manager
│   │   ├── registry/               ← class + token registries
│   │   ├── parser/                 ← class-attribute extractor
│   │   ├── providers/              ← LSP feature providers
│   │   │   ├── completion.ts
│   │   │   ├── hover.ts
│   │   │   ├── diagnostic.ts
│   │   │   ├── code-action.ts
│   │   │   ├── definition.ts
│   │   │   ├── document-link.ts
│   │   │   └── semantic-tokens.ts
│   │   ├── rules/                  ← lint rules
│   │   ├── ai/                     ← AI suggestion engine
│   │   └── utils/
│   ├── tests/
│   └── package.json
└── shared/                         ← shared types + data builders
    └── src/
        ├── types.ts                ← shared interfaces
        └── build-data.ts           ← turns /src/lib/effects-batch-*.ts
                                       into the static JSON the LSP consumes
```

### 1.5 Why a Separate Language Server Package?

- **Reuse.** The same server powers the Neovim and JetBrains clients (via community LSP wrappers).
- **Testability.** The server is a pure Node module — we can test providers without spinning up VS Code.
- **Bundle size.** The extension package stays lean; the server ships only the runtime needed.
- **Independent versioning.** The server can release patch versions faster than the extension's marketplace review allows.

---

## 2. Extension API

### 2.1 Public VS Code API Surface

The extension exposes a small, stable API for other extensions (e.g., a future "RoyCSS for Tailwind IntelliSense bridge"):

```typescript
// Activated via: const roycss = vscode.extensions.getExtension('roycss.roycss-vscode')?.exports;

export interface RoyCssExtensionApi {
  /** The full class registry (700+ entries). */
  readonly classes: ReadonlyArray<RoyCssClassEntry>;

  /** Look up a class by its exact name (e.g. "roycss-pulse-glow"). */
  getClass(name: string): RoyCssClassEntry | undefined;

  /** Fuzzy search across class names, descriptions, and tags. */
  search(query: string, options?: SearchOptions): RoyCssClassEntry[];

  /** The design-token registry (colors, spacing, motion, etc.). */
  readonly tokens: ReadonlyArray<RoyCssTokenEntry>;

  /** Returns the migration target for a foreign class name, if any. */
  getMigrationTarget(foreignClass: string): RoyCssMigrationTarget | undefined;

  /** Subscribe to registry updates (after a version bump / data refresh). */
  onDidUpdateRegistry(listener: () => void): vscode.Disposable;
}
```

### 2.2 Internal Module Boundaries

| Module | Owns | Does Not Own |
|--------|------|--------------|
| `extension.ts` | Activation, UI wiring, command registration | LSP logic |
| `language-client.ts` | LSP transport, server lifecycle | Provider implementations |
| `commands/*` | VS Code command handlers (UI side) | LSP server-side actions |
| `views/*` | Webview rendering, message passing | Class data (always read-only) |
| `statusBar/*` | Status bar items | Persistent state |
| `lsp/providers/*` | LSP feature implementations | VS Code APIs |
| `lsp/rules/*` | Diagnostic rule definitions | How diagnostics are surfaced |
| `lsp/ai/*` | AI prompt building, response parsing | UI for inline suggestions |

---

## 3. Language Server Protocol

### 3.1 LSP Capabilities Advertised

The server declares these capabilities in its `InitializeResult`:

| Capability | Method | Purpose |
|-----------|--------|---------|
| Completion | `textDocument/completion` | Autocomplete class names |
| Hover | `textDocument/hover` | Preview + documentation tooltips |
| Signature Help | `textDocument/signatureHelp` | (Reserved for token functions) |
| Definition | `textDocument/definition` | Jump to effect source |
| Document Link | `textDocument/documentLink` | Click class → open docs URL |
| Semantic Tokens | `textDocument/semanticTokens` | Colorize RoyCSS classes |
| Diagnostics | `textDocument/publishDiagnostics` | Lint + a11y + perf warnings |
| Code Actions | `textDocument/codeAction` | Sort, migrate, fix conflicts |
| Code Lens | `textDocument/codeLens` | "Preview in docs" lens above class |
| Document Highlight | `textDocument/documentHighlight` | Highlight all usages of a class |
| Rename | `textDocument/rename` | Rename a class across the project |
| Inlay Hints | `textDocument/inlayHint` | Render-cost hint next to class |

### 3.2 Server Lifecycle

```typescript
// roycss-lsp/src/server.ts (simplified)
import { createConnection, TextDocuments, InitializeResult } from "vscode-languageserver/node";
import { RoyCssRegistry } from "./registry";
import { CompletionProvider } from "./providers/completion";
import { HoverProvider } from "./providers/hover";
import { DiagnosticEngine } from "./providers/diagnostic";
// ... other providers

const connection = createConnection();
const documents = new TextDocuments();
documents.listen(connection);

const registry = new RoyCssRegistry(/* hydrated from data/ JSON */);
const completion = new CompletionProvider(registry);
const hover = new HoverProvider(registry);
const diagnostics = new DiagnosticEngine(registry);

connection.onInitialize((params): InitializeResult => {
  const opts = params.initializationOptions ?? {};
  registry.configure(opts);
  return {
    capabilities: {
      completionProvider: { resolveProvider: true, triggerCharacters: ["\"", "'", " ", "."] },
      hoverProvider: true,
      definitionProvider: true,
      documentLinkProvider: { resolveProvider: false },
      semanticTokensProvider: { legend: { tokenTypes: ["roycss"], tokenModifiers: ["valid", "invalid", "deprecated"] }, full: true },
      codeActionProvider: { codeActionKinds: ["quickfix", "refactor"] },
      codeLensProvider: { resolveProvider: false },
      documentHighlightProvider: true,
      renameProvider: { prepareProvider: true },
      inlayHintProvider: { resolveProvider: false },
      diagnosticProvider: { interFileDependencies: true, workspaceDiagnostics: false },
      textDocumentSync: 1,
    },
  };
});

documents.onDidChangeContent((e) => diagnostics.validateDocument(e.document));
documents.onDidOpen((e) => diagnostics.validateDocument(e.document));
connection.onCompletion((p) => completion.provide(p));
connection.onHover((p) => hover.provide(p));
// ... other handlers

connection.listen();
```

### 3.3 Class Attribute Parser

RoyCSS class names appear inside `class="..."`, `className="..."`, `class:roycss-foo` (Svelte), `:class="{ 'roycss-foo': cond }"` (Vue), and Tailwind-style template strings. The parser is a single shared module:

```typescript
// roycss-lsp/src/parser/class-attribute.ts
export interface ClassSpan {
  /** Absolute offset of the class name in the document. */
  start: number;
  end: number;
  /** The class name, without quotes. */
  name: string;
  /** Which class-attribute syntax it came from. */
  syntax: "html" | "jsx" | "svelte" | "vue" | "astro" | "tailwind-template";
}

export function findClassSpans(
  document: TextDocument,
  position?: Position,
): ClassSpan[];
```

It uses a fast regex pre-pass and a small state machine to disambiguate quotes/comments. This single parser feeds completion, hover, diagnostics, semantic tokens, and code actions — no duplicate logic.

### 3.4 Performance Targets

| Operation | Budget | Strategy |
|-----------|--------|----------|
| Document open (full parse + diagnostics) | ≤ 80ms | Tree-sitter-style incremental scan |
| Keystroke → completion list | ≤ 30ms p95 | In-memory prefix trie |
| Hover | ≤ 50ms p95 | Pre-rendered markdown cache |
| Diagnostics on save (whole project) | ≤ 400ms | Parallel rule execution, memoized |
| Rename across project | ≤ 1s | Project-wide ripgrep |

---

## 4. Commands

The extension contributes these commands to the Command Palette (`Cmd+Shift+P`):

| Command ID | Title | Default Keybinding |
|-----------|-------|-------------------|
| `roycss.sortClasses` | RoyCSS: Sort classes in this element | `Ctrl+Shift+S` (editor) |
| `roycss.migrate` | RoyCSS: Migrate foreign classes… | — |
| `roycss.insertSnippet` | RoyCSS: Insert snippet… | `Ctrl+Shift+R` |
| `roycss.openInDocs` | RoyCSS: Open class in documentation | `Ctrl+Shift+D` |
| `roycss.previewInWebview` | RoyCSS: Preview effect in side panel | `Ctrl+Shift+P` (editor) |
| `roycss.toggleTheme` | RoyCSS: Toggle preview theme | — |
| `roycss.copyHtml` | RoyCSS: Copy HTML for current class | — |
| `roycss.copyCss` | RoyCSS: Copy CSS for current class | — |
| `roycss.exportCollection` | RoyCSS: Export current file's classes as collection | — |
| `roycss.suggestEffect` | RoyCSS: AI — suggest effect for selection | `Ctrl+Shift+A` |
| `roycss.openExplorer` | RoyCSS: Open Component Explorer | — |
| `roycss.openTokenPanel` | RoyCSS: Open token inspector | — |
| `roycss.showReleaseNotes` | RoyCSS: Show release notes | — (auto on update) |

### 4.1 Command: Sort Classes (`roycss.sortClasses`)

Reorders all RoyCSS classes within the current `class=""` attribute using a deterministic order:

```
1. Layout & structure   (none in RoyCSS, reserved)
2. Backgrounds          (bg-*)
3. Borders              (border-*)
4. Filters              (filter-*)
5. Visual / glass       (glass-*, visual-*)
6. Text                 (text-*)
7. Transform            (transform-*)
8. Animations           (anim-*)
9. Hover                (hover-*)
10. Microinteractions   (micro-*)
11. Cursor / particles  (cursor-*, particle-*)
12. Other / misc        (alphabetical within group)
```

Non-RoyCSS classes (Tailwind, Bootstrap, custom) are preserved in their original positions and never reordered. The sort runs as a workspace edit so it composes with Format Document.

### 4.2 Command: Migrate (`roycss.migrate`)

Opens a Quick Pick:

```
Migrate from:
  ❯ Animate.css
    Tailwind CSS
    Bootstrap
```

After selecting a source, the extension scans the workspace for foreign class names (using the `migration-map.json` registry), presents a preview diff, and applies renames as a single workspace edit. Unmapped classes are listed in a "Review needed" output channel.

### 4.3 Command: AI Suggest (`roycss.suggestEffect`)

Collects context (current selection, surrounding element, project framework, theme) and asks the RoyCSS AI endpoint for a suggested effect. The response is inserted as an inline suggestion (ghost text) the user can accept with `Tab` or dismiss with `Esc`. See §8.4 for the completion flow.

### 4.4 Command: Open in Docs (`roycss.openInDocs`)

If the cursor is on a RoyCSS class name, opens the corresponding `https://roycss.dev/docs/effects/...` page in the user's default browser. If the class is deprecated, the URL pins to the version where it was last valid.

---

## 5. Snippets

### 5.1 Native Snippets (`snippets/roycss.json`)

A curated set of native VS Code snippets (generated from `vscode-support/roycss-snippets.json` plus richer metadata). Each snippet:

- Has a meaningful prefix (`roycss-pulse-glow`, `roycss-hover-glow-border`, …).
- Inserts a complete HTML scaffold with the class applied and a placeholder for content.
- Has a description that matches the docs site.
- Is scoped to `html, jsx, tsx, vue, svelte, astro` to avoid noise in non-template files.

Example:

```json
{
  "Pulse Glow": {
    "prefix": "roycss-pulse-glow",
    "body": [
      "<div class=\"roycss-pulse-glow\">",
      "  ${1:Content}",
      "</div>"
    ],
    "description": "A smooth pulsing glow effect that draws attention to elements. Honors prefers-reduced-motion.",
    "scope": "html,jsx,tsx,vue,svelte,astro"
  }
}
```

### 5.2 Snippet Generation Command (`roycss.insertSnippet`)

Beyond native snippets, `roycss.insertSnippet` opens a Quick Pick with **all 700+ effects** filtered by what the user types, plus preview thumbnails (rendered as Markdown images via the docs site's preview API). Selecting one inserts the framework-appropriate scaffold (auto-detected from the current file's language).

```
┌────────────────────────────────────────────────────────────┐
│  Insert RoyCSS effect                                      │
│                                                            │
│  Type to filter 700+ effects…                              │
│                                                            │
│  ▸ roycss-anim-pulse-glow      · Animations · ▶ thumbnail  │
│    roycss-anim-pulse-soft      · Animations                │
│    roycss-hover-glow-border    · Hover                     │
│    roycss-text-neon-glow       · Text                      │
│    ...                                                     │
└────────────────────────────────────────────────────────────┘
```

### 5.3 Framework-Aware Body Generation

The snippet body adapts to the current language:

| Language | Body Shape |
|----------|-----------|
| HTML / Astro | `<div class="roycss-pulse-glow">$1</div>` |
| JSX / TSX | `<div className="roycss-pulse-glow">$1</div>` |
| Vue | `<div :class="'roycss-pulse-glow'">$1</div>` (or static `class=`) |
| Svelte | `<div class="roycss-pulse-glow">$1</div>` |
| Angular template | `<div class="roycss-pulse-glow">$1</div>` |

For effects with required child elements (e.g. loaders with `<span>`s), the snippet includes the correct `childCount` of placeholder spans.

### 5.4 Snippet Variants

Each snippet also exposes variants via tab-stops. Typing `roycss-pulse-glow` and pressing `Tab` cycles:

1. Default class
2. `-soft` variant
3. `-strong` variant
4. `-slow` variant
5. Back to default

This lets developers try intensity/speed variants without retyping.

---

## 6. Diagnostics

### 6.1 Diagnostic Severities

RoyCSS diagnostics use three severities (never `Error`):

| Severity | Use |
|----------|-----|
| `Warning` | Likely bugs: invalid class, conflicting utilities, perf issue |
| `Information` | Suggestions: dead class, missing aria |
| `Hint` | Style nits: unsorted classes, redundant variant |

### 6.2 Lint Rules

#### R1. Invalid Class

```
⚠  "roycss-pulse-gloww" is not a valid RoyCSS class.
   Did you mean "roycss-pulse-glow"? [Quick Fix]
```

- Matches `roycss-*` tokens against the registry using Levenshtein distance ≤ 2.
- Quick Fix: replace with the closest match.
- Severity: Warning.

#### R2. Conflicting Utilities

```
⚠  "roycss-anim-pulse-glow" and "roycss-anim-shake" both animate the same element.
   Browsers will only honor the last `animation` declaration. [Quick Fix: keep one]
```

- Detects two animation classes on the same element (CSS `animation` shortens on declaration).
- Also flags two hover effects that both animate `transform`.
- Quick Fix: removes one (user picks).

#### R3. Deprecated Class

```
ℹ  "roycss-float" is deprecated since v1.4.0. Use "roycss-anim-float" instead.
   [Quick Fix: rename] [Open migration guide]
```

- Sourced from `effect-metadata.json`'s `versionDeprecated` + `replacementFor`.
- Quick Fix: rename across the project (LSP rename).

#### R4. Dead Class Detection

```
ℹ  "roycss-bounce-in" is defined in your CSS but not used in any template.
   Remove or tree-shake? [Quick Fix: remove from CSS]
```

- Operates in two modes:
  - **Within-document:** class appears in `class=""` but the CSS file doesn't define it (or vice versa).
  - **Project-wide:** scan on save; report RoyCSS classes referenced in templates that aren't in the imported CSS bundle.
- Powered by a workspace-wide class-usage index (rebuilt on save).
- Severity: Information.

#### R5. Accessibility Hints

```
ℹ  "roycss-anim-flash" may be unsafe for photosensitive users (flashes > 3 Hz).
   Consider "roycss-anim-pulse-soft" for a motion-safe alternative.
```

- Flags effects with `flashSafe: false` in metadata.
- Flags animations on elements with `aria-live="polite"` or `aria-live="assertive"` (motion can distract screen-reader users).
- Flags missing `aria-label` on elements whose only child is a decorative RoyCSS loader.
- Severity: Information; Quick Fix: replace with a motion-safe alternative.

#### R6. Performance Warnings

```
⚠  6 elements on this page use "roycss-particle-fireflies" (each runs a 5s animation).
   Consider reducing to ≤ 3, or use a single canvas-based particle effect. [Learn more]
```

- Counts same-class instances per file; warns when count exceeds `effect.metadata.recommendedMaxInstances`.
- Flags combinations known to thrash the compositor (e.g., 4+ simultaneous `filter-*` effects with `backdrop-filter`).
- Flags `anim-*` classes on > 20 elements (suggests `prefers-reduced-motion` guard).
- Severity: Warning.

#### R7. Theme Compatibility

```
ℹ  "roycss-text-neon-glow" assumes a dark surface. In light theme the glow may be invisible.
   [Quick Fix: wrap in `.dark:` variant] [Preview in light theme]
```

- Cross-references effect metadata's `themeAffinity: "dark" | "light" | "both"` with the project's detected theme tokens.
- Quick Fix: wraps the element in a `@media (prefers-color-scheme: dark)` block or adds the framework's dark variant.

#### R8. Reduced-Motion Guard Missing

```
ℹ  "roycss-anim-bounce-in" runs unconditionally. Wrap in a `prefers-reduced-motion` guard
   for users who opt out of motion. [Quick Fix: insert guard]
```

- Only fires when the project hasn't already opted into RoyCSS's global reduced-motion reset (the `@import "roycss";` line includes it by default).
- Quick Fix inserts a media query block.

### 6.3 Diagnostic Code Actions

Every diagnostic that can be auto-fixed exposes a Code Action (the lightbulb):

- Replace invalid class with closest valid match.
- Remove conflicting utility (pick which to keep).
- Rename deprecated class.
- Insert `prefers-reduced-motion` guard.
- Wrap element in dark-mode variant.
- Sort classes in this element.

Code Actions also surface in the "Source Action" right-click menu for batch application.

---

## 7. Hover Providers

### 7.1 Hover on a RoyCSS Class Name

Hovering shows a rich Markdown tooltip:

```
┌────────────────────────────────────────────────────────────┐
│  **roycss-anim-pulse-glow**                                │
│  Animations · since v1.0.0 · 0.42 kB gz                    │
│                                                            │
│  A smooth pulsing glow effect that draws attention to      │
│  elements.                                                 │
│                                                            │
│  [▶ Live preview rendered here via CSS-in-Markdown]        │
│   ┌─────────────────────────────────────────────────────┐  │
│   │                                                     │  │
│   │            ████  glowing box  ████                  │  │
│   │                                                     │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                            │
│  Tokens used:                                              │
│  ■ --roy-color-primary      oklch(0.697 0.155 162.48)      │
│  ■ --roy-motion-duration-normal  300ms                     │
│                                                            │
│  Accessibility: ✅ motion-safe · ✅ flash-safe             │
│  Render cost:   compositor only                            │
│                                                            │
│  Variants: `-soft` · `-strong` · `-slow`                   │
│                                                            │
│  [Open in docs ↗] [Copy HTML] [Copy CSS] [Preview in webview] │
└────────────────────────────────────────────────────────────┘
```

Implementation notes:

- The preview is rendered as an inline `<style>` + `<div>` block inside the Markdown hover (VS Code sanitizes; we use the `vscode-markdown-it-` approved subset).
- Token swatches use OKLCH rendering — VS Code (Chromium-based) supports `oklch()` natively.
- Action buttons are `command:` links handled by the extension.
- Hover is debounced 150ms to avoid re-rendering on every pixel of movement.

### 7.2 Hover on a Design Token

Hovering on `--roy-color-primary` (or `var(--roy-color-primary)`) shows:

```
┌────────────────────────────────────────────────────────────┐
│  **--roy-color-primary**                                   │
│  Color · Brand                                             │
│                                                            │
│  ■ oklch(0.697 0.155 162.48)   (renders as actual swatch)  │
│                                                            │
│  L: 0.697   C: 0.155   H: 162.48°                          │
│  sRGB fallback: #22c55e                                    │
│                                                            │
│  Used by:                                                  │
│  • 47 effects (pulse-glow, hover-glow-border, …)           │
│  • 12 component primitives                                 │
│                                                            │
│  Variants:                                                 │
│  ■ --roy-color-primary-deep   oklch(0.418 0.093 162.48)    │
│  ■ --roy-color-primary-light  oklch(0.802 0.137 162.48)    │
│                                                            │
│  [Copy OKLCH] [Copy sRGB] [Copy hex] [Open in token panel] │
└────────────────────────────────────────────────────────────┘
```

### 7.3 Hover on an Effect Snippet

Hovering over an inserted `<div class="roycss-pulse-glow">` shows the same hover as §7.1, plus a "Used 3× in this file" line and a "Jump to next usage" action.

### 7.4 Token Previews (OKLCH Swatches)

The extension ships a `MarkdownString` renderer that converts OKLCH strings to inline `<span>` swatches with the actual color. For browsers/editors without OKLCH support (rare; VS Code 1.85+ supports it), it falls back to sRGB hex with a note "preview in sRGB; RoyCSS ships OKLCH."

For tokens that include alpha (e.g. `oklch(0.14 0.015 175 / 50%)`), the swatch is rendered over a checkerboard background so the alpha is visible.

---

## 8. Completion Providers

### 8.1 Class-Name Completion

Triggered by:

- Typing inside `class="`, `className="`, `:class="`, `class:` (Svelte).
- Pressing `Space` after an existing class (to add another).
- Manually via `Ctrl+Space` anywhere a class name is valid.

The completion list shows **all 700+ classes**, ranked by:

1. **Prefix match** — classes starting with the typed prefix rank highest.
2. **Fuzzy match** — `plsGlow` matches `roycss-anim-pulse-glow`.
3. **Context relevance** — if the cursor is inside a `<button>`, button-effects (`btn-*`, `hover-*`) rank higher; inside `<input>`, form effects (`form-*`) rank higher.
4. **Project history** — classes already used in this workspace rank higher.
5. **Global popularity** — most-copied effects (per the docs site's telemetry) rank higher when no other signal dominates.
6. **Recency** — newly added effects in the installed RoyCSS version get a small boost.

### 8.2 Completion Item Shape

Each completion item includes:

```typescript
interface RoyCssCompletionItem extends vscode.CompletionItem {
  detail: string;              // "Animations · 0.42 kB"
  documentation: vscode.MarkdownString;  // preview + a11y + variants
  sortText: string;            // padded rank, e.g. "0001"
  filterText: string;          // alias-friendly, e.g. "pulse-glow anim-pulse-glow"
  insertText: string;          // "roycss-anim-pulse-glow"
  kind: vscode.CompletionItemKind.Class;
  tags: vscode.CompletionItemTag[];  // [Deprecated] if applicable
  command?: { command: "roycss.onClassInserted", title: "", arguments: [...] };
}
```

The `command` field fires a telemetry event (opt-in) and triggers a 100ms delayed preview panel update if the user has the side panel open.

### 8.3 Sort Order Visualization

The completion list groups items visually:

```
┌────────────────────────────────────────────────────────────┐
│  Animations                                                │
│  ─────────                                                 │
│  ▸ roycss-anim-pulse-glow      · 0.42 kB · motion-safe     │
│    roycss-anim-pulse-soft      · 0.38 kB · motion-safe     │
│    roycss-anim-pulse-ring      · 0.51 kB · motion-safe     │
│  Hover                                                     │
│  ─────────                                                 │
│    roycss-hover-glow-border    · 0.27 kB · motion-safe     │
│  Text                                                      │
│  ─────────                                                 │
│    roycss-text-neon-glow       · 0.36 kB · ⚠ contrast      │
└────────────────────────────────────────────────────────────┘
```

Group headers come from `vscode.CompletionItemKind.Module` separator items; this keeps the list scannable across 700+ entries.

### 8.4 AI-Assisted Utility Suggestions

When the user types a class attribute and pauses for > 400ms without selecting, the extension calls the AI suggestion engine with:

```typescript
interface AiSuggestionContext {
  /** The partial class name typed so far. */
  partial: string;
  /** The element tag being styled. */
  elementTag: string;
  /** Surrounding JSX/HTML context (parent, siblings). */
  elementContext: ElementContext;
  /** The framework detected (react, vue, svelte, html). */
  framework: Framework;
  /** The project's theme tokens (extracted from CSS/SCSS). */
  theme: ThemeSnapshot;
  /** Classes already on this element. */
  existingClasses: string[];
  /** Whether the cursor is in a hover context (inside :hover CSS rule, etc.). */
  isHoverContext: boolean;
}
```

The AI endpoint returns 1–3 suggested RoyCSS classes with a confidence score and a one-line explanation. These surface as:

- **Inline ghost-text suggestions** (gray text after the cursor) — accept with `Tab`.
- **Top-of-completion-list items** with an ⚡ icon and "AI" badge.

If the user has AI suggestions disabled (default off for privacy), the extension falls back to pure registry completion.

### 8.5 Variant Completion

After inserting `roycss-anim-pulse-glow`, pressing `-` triggers variant completion:

```
┌────────────────────────────────────────────────────────────┐
│  roycss-anim-pulse-glow-|                                  │
│                                                            │
│  ▸ -soft      (3.0s, 50% intensity)                        │
│    -strong    (1.2s, 150% intensity)                       │
│    -slow      (4.0s, default intensity)                    │
│    -fast      (0.8s, default intensity)                    │
└────────────────────────────────────────────────────────────┘
```

This nudges users toward the variant system without requiring them to read the docs.

---

## 9. Configuration

### 9.1 Settings Schema (`package.json` `contributes.configuration`)

```jsonc
{
  "roycss.enabled": {
    "type": "boolean",
    "default": true,
    "markdownDescription": "Enable the RoyCSS language server."
  },
  "roycss.version": {
    "type": "string",
    "enum": ["auto", "1.0.x", "1.1.x", "1.2.x", "1.3.x", "1.4.x"],
    "default": "auto",
    "markdownDescription": "Pin the RoyCSS data version. `auto` reads from `package.json` dependency."
  },
  "roycss.includeLanguages": {
    "type": "array",
    "items": { "type": "string" },
    "default": ["html", "css", "scss", "vue", "svelte", "javascript", "typescript", "javascriptreact", "typescriptreact", "astro"],
    "markdownDescription": "Languages where RoyCSS completion and diagnostics run."
  },
  "roycss.diagnostics.enabled": {
    "type": "boolean",
    "default": true
  },
  "roycss.diagnostics.rules": {
    "type": "object",
    "properties": {
      "invalid-class":        { "type": "string", "enum": ["off", "hint", "info", "warning"], "default": "warning" },
      "conflicting-utilities":{ "type": "string", "enum": ["off", "hint", "info", "warning"], "default": "warning" },
      "deprecated-class":     { "type": "string", "enum": ["off", "hint", "info", "warning"], "default": "info" },
      "dead-class":           { "type": "string", "enum": ["off", "hint", "info", "warning"], "default": "info" },
      "accessibility":        { "type": "string", "enum": ["off", "hint", "info", "warning"], "default": "info" },
      "performance":          { "type": "string", "enum": ["off", "hint", "info", "warning"], "default": "warning" },
      "theme-compat":         { "type": "string", "enum": ["off", "hint", "info", "warning"], "default": "info" },
      "reduced-motion-guard": { "type": "string", "enum": ["off", "hint", "info", "warning"], "default": "info" }
    },
    "default": {}
  },
  "roycss.completion.sortByRelevance": {
    "type": "boolean",
    "default": true,
    "markdownDescription": "Rank completion items by context relevance instead of pure alphabetical."
  },
  "roycss.completion.showVariantsAfterDash": {
    "type": "boolean",
    "default": true
  },
  "roycss.hover.includePreview": {
    "type": "boolean",
    "default": true
  },
  "roycss.hover.includeTokenSwatches": {
    "type": "boolean",
    "default": true
  },
  "roycss.ai.enabled": {
    "type": "boolean",
    "default": false,
    "markdownDescription": "Enable AI-assisted suggestions. Sends context (selection, surrounding element, project framework) to the RoyCSS AI endpoint. No file contents are stored."
  },
  "roycss.ai.endpoint": {
    "type": "string",
    "default": "https://ai.roycss.dev/v1/suggest"
  },
  "roycss.ai.maxSuggestions": {
    "type": "number",
    "default": 3,
    "minimum": 1,
    "maximum": 5
  },
  "roycss.sort.order": {
    "type": "array",
    "items": { "type": "string" },
    "default": ["backgrounds", "borders", "filters", "visual", "glass", "text", "transform", "animations", "hover", "micro", "cursor", "particles", "misc"],
    "markdownDescription": "Order of RoyCSS category prefixes when sorting classes."
  },
  "roycss.webview.theme": {
    "type": "string",
    "enum": ["auto", "light", "dark"],
    "default": "auto"
  },
  "roycss.telemetry.enabled": {
    "type": "boolean",
    "default": false,
    "markdownDescription": "Send anonymous usage metrics (most-used classes, error counts). No code or file paths."
  }
}
```

### 9.2 Workspace vs. User Settings

- **Telemetry** is always user-scoped (never workspace) so workspaces can't enable it without consent.
- **AI** defaults to off and requires explicit user opt-in (workspace or user scope).
- **Diagnostics rules** are typically workspace-scoped so teams can enforce a shared baseline (committed in `.vscode/settings.json`).

### 9.3 Configuration Validation

On activation, the extension validates settings:

- Unknown rule names → warning notification with a "Reset to defaults" button.
- AI enabled without an endpoint → prompts user to confirm the default endpoint.
- Pinned version that's no longer in the registry → warns and offers to switch to `auto`.

---

## 10. Installation

### 10.1 From the Marketplace

1. Open VS Code.
2. Open Extensions (`Cmd+Shift+X`).
3. Search "RoyCSS".
4. Click Install.

The extension activates automatically the first time you open a file in a supported language. No restart required (the LSP server spawns on first use).

### 10.2 From Open VSX (VSCodium, Cursor, Gitpod)

```
Extensions: Search "RoyCSS" → Install
```

Open VSX releases ship within 24 hours of the Marketplace release.

### 10.3 From Source (Developers)

```bash
git clone https://github.com/Roy-Wanyoike/roycss.git
cd roycss
bun install
bun run build:vscode        # builds packages/vscode-roycss + roycss-lsp
code --install-extension packages/vscode-roycss/roycss-vscode-*.vsix
```

For development with hot reload:

```bash
bun run dev:vscode          # watches and recompiles
# In VS Code: press F5 → launches an Extension Development Host
```

### 10.4 Verification

After install, run the command `RoyCSS: Show release notes`. If the extension is healthy, you'll see:

- A welcome webview listing the 700+ available classes.
- A status bar item showing `RoyCSS: 700 classes · v1.4.0`.
- Hovering on any `roycss-*` class name in an HTML file shows the rich hover.

If nothing appears:

- Check the output channel "RoyCSS Language Server" for errors.
- Run `RoyCSS: Restart language server`.
- File an issue with the output channel contents: `RoyCSS: Report issue`.

### 10.5 Uninstall

Standard VS Code uninstall. The extension removes its `~/.vscode/extensions/roycss.roycss-vscode-*` directory. No persistent state is left in user settings unless the user added settings manually.

### 10.6 Enterprise / Air-Gapped Install

The `.vsix` is self-contained — all data (`roycss-classes.json`, snippets, tokens, metadata) is bundled. The only external calls are:

- The docs site ("Open in docs" command) — optional.
- The AI endpoint — only if `roycss.ai.enabled` is true.

For air-gapped environments, set `roycss.ai.enabled: false` and the extension works fully offline.

---

## 11. Roadmap

### 11.1 Phased Delivery

| Phase | Weeks | Deliverables |
|-------|-------|--------------|
| **P1 — MVP** | 1–3 | LSP skeleton, class-attribute parser, completion (700+ classes), basic hover, install/activation |
| **P2 — Diagnostics** | 4–6 | Invalid-class, conflicting-utilities, deprecated-class rules; quick fixes; settings schema |
| **P3 — Rich Hovers** | 7–9 | Live preview hovers, OKLCH token swatches, variant completion |
| **P4 — Productivity** | 10–12 | Sort classes command, snippet generator, open-in-docs, copy HTML/CSS commands |
| **P5 — A11y & Perf** | 13–15 | Accessibility hints (R5), performance warnings (R6), theme-compat (R7), reduced-motion guard (R8) |
| **P6 — Dead Class** | 16–17 | Project-wide class-usage index, dead-class detection, workspace diagnostics |
| **P7 — AI** | 18–20 | Context collector, AI suggestion engine, inline ghost text, opt-in flow |
| **P8 — Migration** | 21–22 | Migration-map registry, migrate command (Animate.css / Tailwind / Bootstrap), preview diff |
| **P9 — Webviews** | 23–24 | Component Explorer side panel, token inspector, theme preview, release notes |
| **P10 — Polish** | 25–26 | Performance tuning, semantic tokens, code lens, rename across project |

### 11.2 Public Milestones

Mirroring the docs-site roadmap, the extension roadmap is visible at `https://roycss.dev/roadmap#vscode-extension`:

- **Q1:** MVP + Diagnostics (P1–P2) — "RoyCSS classes autocomplete and lint"
- **Q2:** Rich Hovers + Productivity (P3–P4) — "RoyCSS is as fast as Tailwind IntelliSense"
- **Q3:** A11y & Perf + Dead Class + AI (P5–P7) — "RoyCSS proactively improves your code"
- **Q4:** Migration + Webviews + Polish (P8–P10) — "RoyCSS replaces three other extensions"

### 11.3 Non-Goals (Explicitly Out of Scope)

- We do not bundle a CSS formatter (use Prettier).
- We do not bundle a Tailwind compatibility shim (use the Tailwind extension; RoyCSS coexists).
- We do not bundle a linter for non-RoyCSS CSS (use Stylelint).
- We do not ship a GUI theme builder (that lives on the docs site).
- We do not support VS Code versions older than the latest 6 months (security + LSP API stability).

### 11.4 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Activation-to-first-completion latency | ≤ 50ms p95 | Telemetry histogram |
| Hover latency | ≤ 50ms p95 | Telemetry histogram |
| Diagnostic pass on save (10k-line file) | ≤ 400ms | Telemetry histogram |
| Marketplace rating | ≥ 4.5 / 5 | Marketplace |
| Install-to-value time | ≤ 2 minutes | Welcome webview survey |
| AI suggestion acceptance rate | ≥ 35% | Telemetry (opt-in) |
| Diagnostics-acted-on rate | ≥ 60% | Telemetry (opt-in) |

### 11.5 Risks & Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| 700-class completion list overwhelms users | High | Group headers, context ranking, variant narrowing |
| LSP server memory grows with project size | Medium | Class-usage index is LRU-capped at 50MB; rebuild on save |
| AI endpoint latency / downtime | Medium | Ghost-text suggestions are debounced 400ms; on failure, fall back silently to registry completion |
| VS Code API breaking changes | Low | Pin `engines.vscode` to a 6-month floor; CI tests against Insiders weekly |
| OKLCH swatch rendering in non-Chromium editors | Low | sRGB fallback with a clear "RoyCSS ships OKLCH" note |
| Migration false positives (e.g., user really did mean a Bootstrap class) | Medium | Migration command always shows a diff preview; never auto-applies on save |

---

## Appendix A: Data Pipeline (build-time)

```
src/lib/effects-batch-*.ts    (700+ CSSEffect objects)
              │
              ▼
shared/src/build-data.ts      (pure builder)
              │
              ├─► roycss-classes.json    (just the class names, for completion)
              ├─► roycss-snippets.json   (VS Code snippets + framework bodies)
              ├─► effect-metadata.json   (a11y, perf, variants, versionAdded)
              ├─► design-tokens.json     (OKLCH palette, spacing, motion)
              └─► migration-map.json     (foreign-class → roycss-class)
              │
              ▼
copied into packages/vscode-roycss/data/ and packages/roycss-lsp/data/
              │
              ▼
bundled at build time; no runtime fetch
```

This pipeline runs on every RoyCSS release. The extension's data files are versioned alongside the RoyCSS package — installing RoyCSS v1.4.0 in your project automatically loads v1.4.0 metadata into the extension (when `roycss.version: "auto"`).

## Appendix B: Testing Strategy

- **Unit tests (Vitest)** — parser, completion ranking, diagnostic rules, snippet body generation.
- **Integration tests** — LSP server against fixture workspaces; assert published diagnostics, completion items, hover contents.
- **End-to-end tests (vscode-test)** — drive VS Code via the extension test harness; assert command outcomes, webview state.
- **Snapshot tests** — hover Markdown, completion item JSON, to catch unintended changes.
- **Performance tests** — 10k-line fixture file; assert diagnostic pass < 400ms p95.
- **Accessibility tests** — webviews pass axe-core in headless Chromium.

All tests run in CI on every PR; merges to `main` require green tests + a successful `.vsix` build.

## Appendix C: Release Process

1. Bump `package.json` version in `packages/vscode-roycss` and `packages/roycss-lsp`.
2. Update `CHANGELOG.md` with conventional-commit-derived entries.
3. CI builds the `.vsix`, runs all tests, runs Lighthouse on the bundled webviews.
4. Tag the release; CI publishes to VS Code Marketplace and Open VSX in parallel.
5. The docs site's "Editor Setup" page auto-updates to the new version (sourced from the Marketplace API).
6. The "Show release notes" command fetches the changelog and renders it in a webview on next activation.

---

*This document is the canonical specification for the RoyCSS VS Code extension. All implementation PRs must reference the section they implement. Last updated: RoyCSS v1.0.0.*
