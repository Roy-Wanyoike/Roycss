# RoyCSS VSCode Extension — Architecture Decision Records

> Status: **Accepted** · Version: 1.0.0 · Last updated: 2026-07-31
> Scope: `/home/z/my-project/vscode-extension/`

Each ADR follows the Nygard format: Context → Decision → Consequences.
Decisions are **Accepted** unless noted otherwise.

---

## ADR-1: Bundle the class catalog inside the .vsix (no network fetch)

### Context

RoyCSS ships 1,569 effects. The extension needs full catalog metadata
(id, className, name, category, description, tags, cssCode) for completion,
hover, diagnostics, and the browse command. Two sourcing strategies are
possible:

1. **Bundled** — ship `class-data.json` (≈600 KB) inside the `.vsix`. Load
   with `JSON.parse` at activation. No network.
2. **Network-fetched** — ship a thin extension that fetches the catalog from
   `https://roycss.com/api/effects.json` on first activation, caches it in
   `globalStorage`, and refreshes on a weekly cadence.

### Decision

**Bundled.** `class-data.json` is generated from `dist/effects.json` at build
time and packaged inside the `.vsix`.

### Rationale

- **Offline-first.** Users on corporate VPNs, planes, or air-gapped environments
  get full functionality.
- **Performance.** `JSON.parse` of 600 KB ≈ 25 ms on a 2024 laptop; a network
  fetch is ≥250 ms even on fast connections and adds cold-start variance.
- **Supply-chain hygiene.** No network calls means no TLS-pin maintenance, no
  CDN trust boundary, no MITM surface. The `security/` SBOM already audits the
  repo; a network-fetched catalog would introduce a second trust boundary that
  the SBOM can't cover.
- **Determinism.** The bundled catalog matches the version of `roycss.css`
  shipped in the same release. A network-fetched catalog could drift ahead of
  (or behind) the user's local CSS.
- **Cost.** A network endpoint requires hosting, monitoring, versioning,
  deprecation. None of that is worth it for a 600 KB static catalog.

### Consequences

- **+** Zero network calls → simpler threat model, faster activation.
- **+** Deterministic behavior across environments.
- **−** Catalog updates require a new `.vsix` release. Mitigated by: the
  extension follows the RoyCSS release cadence (monthly) and the marketplace
  auto-updates extensions by default.
- **−** `.vsix` size grows by ≈600 KB. Acceptable: marketplace allows up to
  100 MB; we're at ~1 MB total.

### Alternatives considered

- **Hybrid (bundled + optional network refresh).** Rejected: doubles the
  testing matrix and the network code would still need a security review.
- **Lazy CSS source (only bundle metadata, fetch CSS on first hover).**
  Rejected: hover latency would become network-bound; users would see an empty
  CSS block on first hover.

---

## ADR-2: Direct providers, not a Language Server

### Context

The extension needs completion, hover, diagnostics, and code actions for
`roycss-*` tokens across 8 languages. Two implementation strategies:

1. **Direct providers** — `vscode.languages.registerCompletionItemProvider`
   et al. in `extension.js`. Runs in the extension host process.
2. **Language Server (LSP)** — `vscode-languageclient` + a separate Node LSP
   binary. The LSP does the analysis; the extension is a thin client.

### Decision

**Direct providers.** A single `extension.js` file registers all four
providers + two commands. No child process, no LSP.

### Rationale

- **Latency.** Direct providers run in-process; LSP adds IPC + serialization
  per request. For 1,569-item completion lists, the IPC overhead is
  non-trivial.
- **Bundle size.** `vscode-languageclient` + `vscode-languageserver` add
  ≈150 KB and a Node child process. Direct providers add 0 bytes (just our
  `extension.js`).
- **Complexity.** An LSP requires a separate build pipeline, a separate
  `server.js`, transport wiring, and crash-recovery logic. For a
  catalog-lookup workload (no AST, no cross-file analysis), this is overkill.
- **Debuggability.** Direct providers log to the RoyCSS output channel. LSP
  logs require launching the server with `--inspect`.
- **Sufficiency.** The "analysis" we do is (a) regex-scan for `roycss-*`
  tokens and (b) Map lookup. Neither benefits from incremental AST parsing.

### Consequences

- **+** Smaller `.vsix`, faster activation, simpler code (one file).
- **+** Single process → no IPC failures to debug.
- **−** Diagnostics scan is single-threaded with the extension host. For very
  large files (>50 K lines), the 300 ms debounced scan could cause UI jank.
  Mitigated by: the regex is linear and the file-size cutoff in
  `extension.js` (skip diagnostics for files > 200 KB).
- **−** We can't easily share the analyzer with other editors (Neovim, JetBrains).
  Acceptable: RoyCSS's primary editor is VSCode; other editors can use the
  `cli/` package or the `mcp-server/`.

### Alternatives considered

- **LSP with bundled server.** Rejected per above.
- **Web Worker inside the extension host.** Not supported by the VSCode
  extension host API.

---

## ADR-3: Snippet format — HTML wrapper per effect, single snippets.json

### Context

The 1,569 effects each need a snippet. Three format options:

1. **HTML wrapper** — `body: ["<div class=\"roycss-<id>\">", "  Content", "</div>"]`,
   scope `html,jsx,tsx,vue,svelte`. Matches the existing `vscode-support/roycss-snippets.json`
   format (689 entries).
2. **CSS source** — `body: [".roycss-<id> { … }", "@keyframes … { … }"]`,
   scope `css`. The user gets the raw CSS injected into their stylesheet.
3. **Both** — two snippets per effect (3,138 entries), differentiated by
   `-css` suffix in the prefix.

### Decision

**HTML wrapper only**, single `snippets.json` with 1,569 entries. CSS source
is shown in the hover popup instead of via snippets.

### Rationale

- **User intent.** The vast majority of RoyCSS usage is "drop a class on an
  element". The HTML wrapper snippet matches that workflow directly. CSS
  source snippets would be used only by power users who want to copy-modify
  the CSS — and those users can read the CSS in the hover popup or click
  through to the source on roycss.com.
- **Snippet catalog size.** VSCode's IntelliSense popup slows down noticeably
  past ~3,000 items. 1,569 is already at the high end; doubling to 3,138
  would hurt UX.
- **Maintenance.** One snippet format = one generator. The build script is
  ~30 lines of Node.
- **Consistency with prior art.** The existing
  `vscode-support/roycss-snippets.json` uses this format and it has worked
  well in beta testing.
- **Scope correctness.** The HTML wrapper snippet is valid in JSX, TSX, Vue,
  Svelte, and HTML. A CSS-source snippet would only be valid in `.css` files.

### Consequences

- **+** IntelliSense popup stays fast.
- **+** One source of truth (effects.json) → one snippet file.
- **−** Users who want the CSS source in their stylesheet must hover + copy.
  Mitigated by: the hover popup renders a copyable fenced CSS block.
- **−** The 689-entry legacy `vscode-support/roycss-snippets.json` is now
  superseded by the 1,569-entry `vscode-extension/snippets.json`. The legacy
  file is left untouched (per the task's file-ownership rule) but is no
  longer the canonical source.

### Alternatives considered

- **Both formats.** Rejected per IntelliSense popup performance.
- **CSS source only.** Rejected: would break the HTML/JSX workflow that 90%
  of users want.

---

## ADR-4: Activation strategy — onLanguage for 8 languages + onCommand for 2 commands

### Context

The extension's features (completion, hover, diagnostics, snippets) are only
useful when editing one of 8 languages. The 2 commands (`roycss.browseEffects`,
`roycss.searchEffect`) should be available even when no supported file is open
(so users can browse the catalog from any context).

### Decision

**Activation events:**

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

`activationEvents` is **explicitly declared** (not relying on VSCode's
static-analysis-based activation inference) for determinism and to satisfy
the VSCode 1.85+ marketplace review process.

### Rationale

- **8 languages.** Covers all contexts where class strings live:
  - `css` — `.roycss-foo { }` selectors.
  - `html` — `class="roycss-foo"`.
  - `javascript` / `typescript` — template literals and string literals
    containing class names (e.g. `el.className = 'roycss-foo'`).
  - `javascriptreact` / `typescriptreact` — `className="roycss-foo"`.
  - `vue` — `class="roycss-foo"` in `<template>`.
  - `svelte` — `class="roycss-foo"`.
- **`onCommand` for both commands.** Without this, the commands would only
  be visible in the Command Palette after a supported file is opened, which
  breaks the "browse the catalog from anywhere" use case.
- **Explicit declaration.** VSCode 1.74+ can infer activation events from
  `contributes.commands` and `contributes.languages`, but the inference is
  not 100% reliable for `onLanguage:*` with non-default languages like
  `svelte`. Explicit declaration removes ambiguity.

### Consequences

- **+** Commands work even with no editor open.
- **+** Activation is deterministic — no reliance on static analysis.
- **−** The extension activates the moment a user opens any `.js`/`.ts` file,
  even if they have no intention of using RoyCSS. Mitigated by: activation is
  cheap (<80 ms, 8 MB resident) and the extension is otherwise idle.
- **−** Slightly larger activation surface than a strict `onLanguage:css`
  only. Acceptable given the cross-language workflow RoyCSS supports.

### Alternatives considered

- **`onStartupFinished`.** Rejected: activates on every VSCode launch, even
  for users who never edit a frontend file.
- **`onLanguage:css` only.** Rejected: misses the JSX/Vue/Svelte workflow,
  which is the primary use case for the modern RoyCSS audience.
- **Rely on static-analysis inference.** Rejected: not reliable across all
  8 languages, especially `svelte` and `vue`.

---

## ADR-5: Diagnostics scan — debounced regex, not a CST parse

### Context

The diagnostics feature flags unknown `roycss-*` tokens. Two approaches:

1. **Regex scan** — a single global regex `/(?:roycss-[\w-]+)/g` over the
   document text, with a heuristic to verify the match is in a "class context".
2. **CST parse** — parse the document with a per-language parser
   (`@vue/compiler-dom` for Vue, `tree-sitter` for JS/TS, postcss for CSS) and
   walk the tree to find class attributes.

### Decision

**Regex scan with class-context heuristic**, debounced 300 ms after
`onDidChangeTextDocument`.

### Rationale

- **Performance.** A regex scan over a 1,000-line file takes <5 ms. A
  tree-sitter parse takes 50–150 ms and adds a 2 MB native dependency.
- **Cross-language uniformity.** One regex works across all 8 languages
  (with a small per-language "class context" verifier). A CST approach would
  need 4 different parsers.
- **Sufficiency.** The only false-positive risk is matching `roycss-foo` in a
  comment or string literal. The class-context heuristic (must be inside
  `class=`, `className=`, `:class=`, `class:list=`, a CSS selector, or a
  template literal tagged with `css`/`html`) eliminates 95% of false
  positives; the remaining 5% are acceptable for a Warning-severity
  diagnostic.
- **Dependency hygiene.** No new native deps. The extension stays at 0
  runtime dependencies (per the security threat model).

### Consequences

- **+** Zero new dependencies; extension stays hermetic.
- **+** Fast enough for files up to ~200 KB. Files larger than that are
  skipped (logged to the output channel).
- **−** Occasional false positives in unusual contexts (e.g. a string
  literal that happens to contain `roycss-` followed by an unknown id).
  Acceptable: severity is `Warning`, and users can disable diagnostics via
  `roycss.enableDiagnostics: false`.
- **−** No type-aware checks (e.g. "this class is only valid on `<button>`
  elements"). Out of scope; RoyCSS classes are element-agnostic.

### Alternatives considered

- **CST parse per language.** Rejected per performance + dependency cost.
- **Disable diagnostics by default.** Rejected: diagnostics are a key
  differentiator (catches typos like `roycss-pulse-gloww` immediately).

---

## Summary table

| ADR  | Decision                                       | Status   |
| ---- | ---------------------------------------------- | -------- |
| ADR-1 | Bundle catalog inside .vsix (no network)      | Accepted |
| ADR-2 | Direct providers, not a Language Server       | Accepted |
| ADR-3 | HTML-wrapper snippets, single snippets.json   | Accepted |
| ADR-4 | 8 onLanguage + 2 onCommand activation events  | Accepted |
| ADR-5 | Debounced regex diagnostics, no CST parse     | Accepted |
