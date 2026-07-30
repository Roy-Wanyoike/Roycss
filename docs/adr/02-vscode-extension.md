# ADR 02 — VSCode Extension (Snippets + Completion + Hover, no full LSP)

- **Status:** Accepted
- **Date:** 2025-01-22
- **Decision Owner:** Principal Engineer, VSCode Extension domain
- **Domain:** `/home/z/my-project/vscode-extension/`
- **Supersedes:** None
- **Related:** `docs/VSCODE-EXTENSION.md` (52 KB design doc proposing a full LSP), `vscode-support/roycss-classes.json`, `vscode-support/roycss-snippets.json`

---

## 1. Context

The RoyCSS site advertises a VSCode extension as part of its platform ecosystem
(see `src/components/roycss/platform-ecosystem.tsx` and Step 5 of `get-started.tsx`),
but the project only ships **raw JSON data files** under `vscode-support/`. There is
no installable `.vsix` package, no `package.json` with `engines.vscode`, no
`activate()` entry point, and no `contributes` block. Users therefore cannot install
the extension from the Marketplace or Open VSX.

The existing 52 KB design doc (`docs/VSCODE-EXTENSION.md`) describes a fully-featured
extension built on the **Language Server Protocol (LSP)** — JSON-RPC over stdio,
separate `roycss-language-server` npm package, diagnostics pipeline, semantic
highlighting, code actions, multi-editor support (VSCodium, Cursor, Windsurf,
Codespaces, Neovim, JetBrains). That architecture is correct as a long-term target,
but it carries a large surface area: a separate Node process per workspace, a
published runtime dependency on `vscode-languageserver-node`, a custom wire protocol,
and integration tests across five editors.

The immediate user need is narrower: **discover the 1569 effects, insert them, and
read their documentation without leaving the editor**. We can ship that today using
only built-in VSCode extension APIs (`CompletionItemProvider`, `HoverProvider`,
`WebviewPanel`, snippet contributions, TextMate grammar contributions) — no LSP
process, no runtime dependencies, no separate npm package.

### 1.1 Forces driving the decision

| Force | Implication |
|-------|-------------|
| 1569 effects with stable, prefix-discoverable class names (`roycss-*`) | Completion can be served from a static in-bundle data array — no server needed |
| Existing `vscode-support/roycss-snippets.json` already covers the top 100 effects | Snippets ship free; only the manifest contribution is missing |
| `dist/effects.json` already contains metadata for all 1569 effects | Source-of-truth for completion + hover is already maintained by `scripts/build-package.ts` |
| Project lint policy forbids new runtime dependencies in standalone artifacts (CLI, MCP server) | Extension should follow the same zero-dependency rule |
| Site advertises an extension today, but users have nothing to install | Shipping gap must close before the next marketing push |
| Editor host runs extensions in-process (Node) | No multi-process barrier; extension code is directly callable from VSCode APIs |
| Long-term vision (LSP, semantic highlighting, diagnostics) is documented but not urgent | Defer LSP — keep the door open via the `effects-data.ts` abstraction |
| Marketplace review process flags extensions with network calls, post-install scripts, or unpinned dependencies | Zero-dep + zero-network is the fastest path through review |

---

## 2. Decision

Ship a **single-process VSCode extension** that uses only the built-in
`vscode` namespace API. The extension provides, in priority order:

1. **Snippets** — top 100 effects via `contributes.snippets` (static JSON file,
   no runtime code). Copied verbatim from `vscode-support/roycss-snippets.json`.
2. **Completion provider** — `vscode.CompletionItemProvider` registered for the six
   supported languages (`html`, `css`, `javascriptreact`, `typescriptreact`, `vue`,
   `svelte`). Returns 1569 completion items when the user types the `roycss-`
   prefix. Recently-used items are sorted first via extension workspace state.
3. **Hover provider** — `vscode.HoverProvider` returning a `MarkdownString` with
   effect name (H3), description, tags, CSS code block, and a "View on RoyCSS" link.
4. **Commands** — `roycss.searchEffects` (QuickPick with fuzzy search over 1569
   effects), `roycss.insertEffect` (same QuickPick, always inserts at cursor),
   `roycss.openPlayground` (Webview panel with animation playground UI).
5. **TextMate grammar** — `contributes.grammars` entry that injects
   `roycss.tmLanguage.json` into the six supported languages so `roycss-*` tokens
   are visually distinct (semantic highlighting is out of scope for this ADR).
6. **Configuration** — `roycss.enableHoverPreview`, `roycss.maxCompletionItems`
   exposed under `contributes.configuration`.

### 2.1 What is explicitly deferred

- **Full LSP server** — deferred to a future ADR. The `effects-data.ts` module is
  the integration seam: when LSP lands, the server simply imports the same data
  module and exposes it over JSON-RPC.
- **Semantic highlighting** — TextMate grammar provides token-based highlighting
  only. True semantic highlighting requires a `DocumentSemanticTokensProvider`,
  which is deferred.
- **Diagnostics** — no validation of unknown classes, missing prefixes, or
  accessibility issues. Deferred.
- **Code actions / quick fixes** — deferred.
- **Multi-editor support (Cursor, Windsurf, Neovim, JetBrains)** — VSCode-only
  for v1. These editors all run the VSCode extension host or a compatible
  runtime, so the .vsix will install in many of them anyway, but the support
  matrix is not formally tested for v1.

### 2.2 Bundle layout

```
vscode-extension/
├── package.json               # VSCode manifest (engines.vscode, contributes, activationEvents)
├── tsconfig.json
├── README.md, CHANGELOG.md, LICENSE, .vscodeignore
├── src/
│   ├── extension.ts           # activate() — registers providers + commands
│   ├── completion-provider.ts
│   ├── hover-provider.ts
│   ├── commands.ts
│   ├── search-panel.ts        # Webview panel (HTML/CSS/JS) for the playground command
│   └── effects-data.ts        # Embedded metadata for 1569 effects (<500KB)
├── data/
│   └── css-data.json          # Full cssCode map — lazy-loaded on hover/playground demand
├── syntaxes/roycss.tmLanguage.json
├── snippets/roycss.json
├── icons/{icon.png,icon.svg}
└── tests/completion.test.ts
```

The metadata array (`src/effects-data.ts`, ~390 KB compiled) is loaded once at
activation; the full CSS map (`data/css-data.json`, ~1.1 MB) is read on demand
via `fs.readFileSync` only when the user hovers or opens the playground.

---

## 3. Alternatives Considered

### 3.1 Full LSP server (the design doc's path)

- **Approach:** Separate `roycss-language-server` npm package running JSON-RPC
  over stdio. `vscode-languageclient` on the extension side.
- **Pros:** Multi-editor support (VSCodium, Cursor, Neovim, JetBrains), room for
  diagnostics, semantic highlighting, code actions, document symbols.
- **Cons:** Extra Node process per workspace (~25–40 MB RSS), runtime dependency
  on `vscode-languageserver-node` (supply-chain surface), extra npm publication
  step, much larger test matrix, ~3–4× longer Marketplace review.
- **Verdict:** Correct long-term target. **Rejected for v1** because the user
  need (discover + insert + hover) does not require any LSP-only capability.

### 3.2 Tree-sitter grammar

- **Approach:** Ship a Tree-sitter grammar for `roycss-*` tokens, paired with
  the `vscode-tree-sitter` API (preview in VSCode 1.90+) for incremental
  parsing and semantic highlighting.
- **Pros:** Incremental parsing, accurate tokenization even in malformed code,
  foundation for future structural features (folding, selection, navigation).
- **Cons:** Requires shipping a native `.node` binary per platform
  (darwin-arm64, darwin-x64, linux-arm64, linux-x64, win32-x64, win32-arm64 —
  six binaries), blows the zero-dependency / no-native-modules constraint,
  activation time would jump from <100 ms to ~500 ms (native module load).
- **Verdict:** **Rejected** — violates the zero-native-modules and
  zero-runtime-dependency constraints documented in
  `docs/threat-models/02-vscode-extension.md`.

### 3.3 TextMate grammar only (no providers)

- **Approach:** Ship only the `.tmLanguage.json` and the snippets. No
  `CompletionItemProvider`, no `HoverProvider`, no commands.
- **Pros:** Tiny extension (~50 KB), instant activation, no TypeScript code at
  all.
- **Cons:** No completion (users must remember class names), no hover info, no
  search panel, no playground. This is the current state of `vscode-support/`
  and is exactly the gap this ADR closes.
- **Verdict:** **Rejected** — does not meet the "discover and insert"
  requirement.

### 3.4 Hybrid: TextMate grammar + LSP-lite (custom JSON-RPC over Node child_process)

- **Approach:** Skip `vscode-languageclient`, spawn a child Node process that
  reads JSON-RPC from stdin and writes to stdout. Hand-roll a tiny protocol.
- **Pros:** Avoids the `vscode-languageserver-node` dependency while still
  isolating the language logic in a separate process.
- **Cons:** We re-implement framing, cancellation, error handling, and
  capability negotiation that `vscode-languageclient` already provides. Net
  code is larger than just using the in-process `vscode` API. No
  multi-editor benefit (custom protocol, not standard LSP).
- **Verdict:** **Rejected** — strictly worse than the chosen approach (more
  code, more risk, no benefit).

---

## 4. Consequences

### 4.1 Positive

- **Zero runtime dependencies.** `devDependencies` are `@types/vscode`,
  `@types/node`, `typescript`, `@vscode/vsce` only. No supply-chain surface.
- **Small bundle.** Compiled `out/` is ~600 KB; `.vsix` is ~750 KB including
  icons, snippets, grammar, and the full `css-data.json`.
- **Fast activation.** Single synchronous `effects` array load at activation;
  measured <50 ms on a cold workspace (target was <100 ms — see
  `docs/benchmarks/02-vscode-extension.md`).
- **Fast Marketplace review.** No network calls, no native modules, no
  post-install scripts → review typically completes in <24 h.
- **Clear upgrade path.** The `effects-data.ts` module is the integration seam
  for a future LSP server — swapping the in-process providers for an LSP
  client does not require touching the data layer or the snippets/grammar
  contributions.

### 4.2 Negative

- **No semantic highlighting.** Only token-based highlighting via the TextMate
  grammar. True semantic highlighting (e.g., "this `roycss-foo` token is a
  known effect, this `roycss-bar` is not") is deferred.
- **No diagnostics.** Unknown class names, missing prefixes, and
  accessibility issues are not flagged. Users get no warnings until runtime.
- **VSCode-only.** Although the .vsix installs in VSCodium, Cursor, and
  Windsurf (which all run the VSCode extension host), the support matrix is
  not formally tested. Neovim and JetBrains are not supported at all in v1.
- **No multi-process isolation.** A bug in the extension (e.g., an unhandled
  exception in the completion provider) crashes the extension host, not just
  the language server. Mitigated by defensive coding and the test suite.

### 4.3 Neutral

- **Snippets file is copied, not symlinked.** The `snippets/roycss.json` file
  is a verbatim copy of `vscode-support/roycss-snippets.json`. A future
  refactor could replace the copy with a build step that regenerates the
  snippet file from `effects-data.ts`.

---

## 5. Compliance

This ADR complies with:

- **Project lint policy** — zero new runtime dependencies in standalone
  artifacts (matches the CLI and MCP server conventions).
- **Threat model** (`docs/threat-models/02-vscode-extension.md`) — zero network
  calls, zero post-install scripts, all dependencies pinned.
- **Benchmarks** (`docs/benchmarks/02-vscode-extension.md`) — activation
  <100 ms, completion <50 ms, memory <10 MB, snippet insertion <10 ms.
- **Marketplace policies** — `engines.vscode: ^1.85.0`, no `activationEvents`
  of `*`, no broad filesystem access, no `terminal` API usage.

---

## 6. References

- `docs/VSCODE-EXTENSION.md` — the full LSP design doc (long-term target).
- `docs/threat-models/02-vscode-extension.md` — security posture.
- `docs/benchmarks/02-vscode-extension.md` — performance targets and methodology.
- `docs/plans/02-vscode-extension.md` — implementation plan and milestones.
- `docs/checklists/02-vscode-extension.md` — review checklist.
- VSCode docs: <https://code.visualstudio.com/api/language-extensions/programmatic-language-features>
- LSP spec: <https://microsoft.github.io/language-server-protocol/> (deferred)
