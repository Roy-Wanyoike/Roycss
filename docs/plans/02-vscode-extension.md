# Implementation Plan — RoyCSS VSCode Extension

- **Document owner:** Principal Engineer, VSCode Extension domain
- **Scope:** `/home/z/my-project/vscode-extension/`
- **Related:** `docs/adr/02-vscode-extension.md`, `docs/threat-models/02-vscode-extension.md`, `docs/benchmarks/02-vscode-extension.md`, `docs/checklists/02-vscode-extension.md`
- **Status:** v1.0 — In progress

---

## 1. Goals (v1.0)

1. Ship an installable `.vsix` that closes the "advertised but missing" gap
   documented in the prior feature audit (`worklog.md` →
   `feature-audit-2025` → "VSCode extension packaging" gap).
2. Provide **completion** for all 1569 `roycss-*` classes in HTML, CSS, JSX,
   TSX, Vue, and Svelte.
3. Provide **hover** info (name, description, tags, CSS preview, "View on
   RoyCSS" link) for every `roycss-*` token in the same six languages.
4. Provide **snippets** for the top 100 effects (copied verbatim from
   `vscode-support/roycss-snippets.json`).
5. Provide a **search** command (`roycss.searchEffects`) — QuickPick over all
   1569 effects, fuzzy match, on-select insert.
6. Provide an **insert** command (`roycss.insertEffect`) — same QuickPick,
   always inserts at cursor.
7. Provide a **playground** command (`roycss.openPlayground`) — Webview panel
   with duration/delay/repeat/easing sliders + live preview, mirroring
   `src/components/roycss/playground-panel.tsx` from the site.
8. Provide a **TextMate grammar** for `roycss-*` token highlighting in all six
   languages.
9. Zero runtime dependencies. Zero network calls. Activation <100 ms.
10. Update the site (`platform-ecosystem.tsx`, `get-started.tsx`) to reflect
    the v1.0 installable status.

---

## 2. Non-goals (v1.0)

- Full LSP server (deferred per ADR).
- Semantic highlighting (deferred per ADR).
- Diagnostics (deferred per ADR).
- Multi-editor support matrix beyond VSCode (VSCodium, Cursor, Windsurf may
  work but are not formally tested).
- Marketplace publication (the .vsix is built and verified; publication
  requires the publisher's PAT and is left to the maintainer).
- Open VSX publication (same reason).

---

## 3. Milestones

### M1 — Data layer (Day 1)

- [x] Write `scripts/build-vscode-effects.ts` that imports all 34 batch files
      from `src/lib/` and emits:
  - `vscode-extension/src/effects-data.ts` — compact metadata for 1569
    effects (id, name, category, description, tags, previewType). Target
    <500 KB compiled.
  - `vscode-extension/data/css-data.json` — full `cssCode` map keyed by
    effect id. ~1.1 MB.
- [x] Verify effect count = 1569.
- [x] Verify zero duplicate IDs.
- [x] Verify every effect has non-empty `name`, `description`, and at least
      one tag.

### M2 — Extension scaffold (Day 1)

- [x] `package.json` (VSCode manifest) — `engines.vscode: ^1.85.0`,
      `activationEvents` for the six languages, `main: ./out/src/extension.js`,
      `contributes.snippets`, `contributes.grammars`, `contributes.commands`,
      `contributes.configuration`.
- [x] `tsconfig.json` — `target: ES2022`, `module: commonjs`,
      `strict: true`, `outDir: out`.
- [x] `.vscodeignore` — exclude `src/`, `node_modules/`, `tests/`,
      `tsconfig.json`, `.git*`, `*.map`.
- [x] `README.md`, `CHANGELOG.md`, `LICENSE`, `icons/icon.png`,
      `icons/icon.svg`.

### M3 — Providers (Day 1)

- [x] `src/extension.ts` — `activate()` registers the completion provider,
      hover provider, and three commands. `deactivate()` is a no-op.
- [x] `src/completion-provider.ts` — `RoyCSSCompletionProvider` implements
      `vscode.CompletionItemProvider`. Returns 1569 items labelled
      `.roycss-X` with detail (effect name), documentation (description +
      tags), and `insertText: roycss-X`. Sorts recently-used first via
      `workspaceState`.
- [x] `src/hover-provider.ts` — `RoyCSSHoverProvider` implements
      `vscode.HoverProvider`. Returns a `MarkdownString` with H3 effect name,
      description, tags, CSS code block (lazy-loaded from
      `data/css-data.json`), and a "View on RoyCSS" link.
- [x] `src/commands.ts` — registers `roycss.searchEffects`,
      `roycss.insertEffect`, `roycss.openPlayground`.

### M4 — Webview panel (Day 1)

- [x] `src/search-panel.ts` — `openPlayground()` creates a `WebviewPanel`
      with strict CSP, inlined HTML/CSS/JS, an effect selector, sliders for
      duration/delay/repeat/easing, a live preview `<div>`, and a "Copy CSS"
      button. The webview `postMessage`s back to the extension host on
      "insert" and "copy" gestures; the host validates the message shape
      before acting.

### M5 — Snippets + grammar (Day 1)

- [x] `snippets/roycss.json` — verbatim copy of
      `vscode-support/roycss-snippets.json`.
- [x] `syntaxes/roycss.tmLanguage.json` — TextMate grammar that matches
      `roycss-[a-z0-9-]+` tokens and scopes them as `support.class.roycss`.
      Injected into `html`, `css`, `javascriptreact`,
      `typescriptreact`, `vue`, `svelte` via `contributes.grammars`.

### M6 — Tests (Day 1)

- [x] `tests/completion.test.ts` — mocks a `TextDocument` containing
      `class="roycss-"`, calls `RoyCSSCompletionProvider.provideCompletionItems`,
      asserts >1000 items returned.
- [x] `tests/bench.baseline.ts` — snapshots the benchmark numbers from
      `docs/benchmarks/02-vscode-extension.md` for CI regression checks.

### M7 — Build & package (Day 1)

- [x] `bun add -d @vscode/vsce` (devDependency only).
- [x] `tsc -p ./` — clean compile, no errors.
- [x] `bunx vsce package --no-yarn --no-dependencies` — produces
      `roycss-1.0.0.vsix`.
- [x] Verify `.vsix` size <5 MB.
- [x] Verify manifest validity: `node -e "JSON.parse(fs.readFileSync('package.json'))"`.

### M8 — Site integration (Day 1)

- [x] `src/components/roycss/platform-ecosystem.tsx` — add a new
      "RoyCSS VS Code Extension" product card with the description
      "v1.0 installable extension — completion, hover info, snippets, search
      panel". Bump the "Platform products" counter from 16 to 17.
- [x] `src/components/roycss/get-started.tsx` — Step 5 ("Install the VS Code
      snippets") is updated to mention installing the `.vsix` from
      `/vscode-extension/roycss-1.0.0.vsix`, with the install command
      `code --install-extension roycss-1.0.0.vsix`.

### M9 — Docs (Day 1)

- [x] `docs/adr/02-vscode-extension.md`
- [x] `docs/threat-models/02-vscode-extension.md`
- [x] `docs/benchmarks/02-vscode-extension.md`
- [x] `docs/plans/02-vscode-extension.md` (this file)
- [x] `docs/checklists/02-vscode-extension.md`
- [x] `worklog.md` entry appended.

---

## 4. Risks & mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| `vsce package` rejects the manifest (missing field, wrong type) | Medium | High | Validate manifest with `node -e "JSON.parse(...)"` before packaging; document required fields in `docs/checklists/02-vscode-extension.md` |
| `effects-data.ts` exceeds 500 KB compiled | Low | Low | Already measured at ~390 KB; if it grows past 500 KB, drop the `tags` array and look up tags lazily from `css-data.json` |
| Webview CSP too strict (breaks the playground) | Medium | Medium | Test the playground end-to-end before packaging; the CSP allows `style-src 'unsafe-inline'` and `script-src 'nonce-...'` which covers all inlined content |
| `tsc` emits source maps that bloat the .vsix | Low | Low | `.vscodeignore` excludes `*.map` |
| Activation time regresses below <100 ms after a future change | Low | High | `tests/bench.baseline.ts` fails CI on >25% regression |
| Site lint fails after `platform-ecosystem.tsx` / `get-started.tsx` edits | Medium | Medium | Run `bun run lint` after each edit; fix any unused-import / unused-var warnings before committing |
| Marketplace review rejects due to a missing field | Low | High | Cross-check manifest against `docs/checklists/02-vscode-extension.md` Section 4 (Marketplace readiness) |

---

## 5. Future work (post-v1.0)

These items are intentionally **out of scope** for v1.0 and are tracked here
so they don't get lost:

1. **LSP server** — implement per `docs/VSCODE-EXTENSION.md`. The
   `effects-data.ts` module is the integration seam.
2. **Semantic highlighting** — `DocumentSemanticTokensProvider` that flags
   unknown `roycss-*` classes.
3. **Diagnostics** — warn on `roycss-X` classes that don't exist in the
   catalog; warn on `roycss-X` classes that collide with FerrumCSS-prefixed
   effects.
4. **Code actions** — "Insert as snippet", "Open in playground", "Copy CSS".
5. **Open VSX publication** — for VSCodium / Gitpod / Eclipse Che.
6. **Multi-editor support matrix** — formally test the .vsix in Cursor,
   Windsurf, and (via the LSP) Neovim and JetBrains.
7. **Per-project effect allow-list** — `.roycssrc` file that restricts the
   completion catalog to a subset (e.g., only the effects actually imported
   in the project's CSS).
8. **FerrumCSS-aware completions** — surface `roycss-ferrum-*` effects under
   a separate trigger character to avoid polluting the native effect
   completions.
9. **AI-assisted effect suggestion** — integrate with the RoyCSS MCP server
   to suggest effects based on the surrounding code context.
10. **Performance dashboard** — periodic re-run of `tests/bench.baseline.ts`
    on a dedicated benchmark VM; publish results to a public dashboard.

---

## 6. Sequencing diagram

```
┌────────────┐   onLanguage:html    ┌──────────────────┐
│  VS Code   │ ───────────────────► │  extension.ts    │
│  editor    │                      │  activate()      │
│            │                      │                  │
│            │  registerProvider    │  ┌────────────┐  │
│            │ ◄────────────────────│  │ effects-   │  │
│            │                      │  │ data.ts    │  │
│            │                      │  │ (1569,     │  │
│            │                      │  │  ~390 KB)  │  │
│            │                      │  └────────────┘  │
│            │                      │                  │
│  user      │  CompletionItem[]    │  ┌────────────┐  │
│  types     │ ◄────────────────────│  │ completion │  │
│  "roycss-" │                      │  │ -provider  │  │
│            │                      │  └────────────┘  │
│            │                      │                  │
│  user      │  Hover               │  ┌────────────┐  │
│  hovers    │ ◄────────────────────│  │ hover-     │  │
│  roycss-X  │                      │  │ provider   │──┼──► data/css-data.json
│            │                      │  └────────────┘  │    (lazy, ~1.1 MB)
│            │                      │                  │
│  user runs │  WebviewPanel        │  ┌────────────┐  │
│  command   │ ◄────────────────────│  │ search-    │  │
│            │                      │  │ panel.ts   │  │
│            │                      │  └────────────┘  │
└────────────┘                      └──────────────────┘
```
