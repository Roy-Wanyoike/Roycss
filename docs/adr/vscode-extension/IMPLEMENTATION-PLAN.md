# RoyCSS VSCode Extension — Implementation Plan

> Status: **Accepted** · Version: 1.0.0 · Last updated: 2026-07-31
> Scope: `/home/z/my-project/vscode-extension/` and `/home/z/my-project/docs/adr/vscode-extension/`
> Prerequisite: `dist/effects.json` (1,569 effects) and `dist/roycss.css` exist
> (they do — built by the main project's `bun run build`).

---

## Phase 1 — Design docs (in `docs/adr/vscode-extension/`)

| Step | Output                                   | Verification                                      |
| ---- | ---------------------------------------- | ------------------------------------------------- |
| 1.1  | `DESIGN.md`                              | Architecture section covers activation, languages, all 4 providers, both commands, lifecycle. |
| 1.2  | `ADR.md`                                 | 5 ADRs (catalog source, LSP vs direct, snippet format, activation, diagnostics strategy). |
| 1.3  | `THREAT-MODEL.md`                        | STRIDE per category, supply-chain section, malicious-snippet section. |
| 1.4  | `IMPLEMENTATION-PLAN.md` (this file)     | Phase-by-phase with verification gates. |
| 1.5  | `REVIEW-CHECKLIST.md`                    | 15 review items covering manifest, activation, contributes, security, packaging. |

**Gate:** all 5 docs exist and reference each other. ✅ Done before Phase 2 starts.

---

## Phase 2 — Data generation

| Step | Output                                  | Verification                                                  |
| ---- | --------------------------------------- | ------------------------------------------------------------- |
| 2.1  | `vscode-extension/build-data.js`        | Node script; reads `dist/effects.json`, writes `class-data.json` + `snippets.json`. |
| 2.2  | `vscode-extension/class-data.json`      | `node -e "console.log(require('./class-data.json').effects.length)"` prints `1569`. |
| 2.3  | `vscode-extension/snippets.json`        | `node -e "console.log(Object.keys(require('./snippets.json')).length)"` prints `1569`. |
| 2.4  | Each effect has `cssCode`               | `node -e` script asserts every entry has non-empty `cssCode`. |

**Source of truth:** `/home/z/my-project/dist/effects.json` (1,569 effects with
metadata) + `/home/z/my-project/dist/roycss.css` (1.2 MB of full CSS source per
class). The build script extracts the CSS for each `.roycss-<id>` rule and any
associated `@keyframes roy-<id>` block.

**Note:** The legacy `vscode-support/roycss-classes.json` has only 700 entries
and `vscode-support/roycss-snippets.json` has only 689 — both are superseded.
Per the task's file-ownership rule, those legacy files are left untouched.

**Gate:** class-data.json has ≥1,569 entries; snippets.json has exactly 1,569
entries; both are valid JSON.

---

## Phase 3 — Extension implementation

| Step | Output                                  | Verification                                                  |
| ---- | --------------------------------------- | ------------------------------------------------------------- |
| 3.1  | `vscode-extension/package.json`         | Valid JSON; `main: ./extension.js`; `engines.vscode: ^1.85.0`; 8 `onLanguage` + 2 `onCommand` activation events; `contributes.commands` (2), `contributes.snippets` (1 path ×8 languages), `contributes.configuration` (6 keys), `contributes.languages` (roycss). |
| 3.2  | `vscode-extension/extension.js`         | `node -c extension.js` exits 0. Exports `activate(context)` and `deactivate()`. |
| 3.3  | `vscode-extension/language-configuration.json` | Valid JSON; has `comments`, `brackets`, `autoClosingPairs`, `surroundingPairs`. |
| 3.4  | `vscode-extension/README.md`            | Has install instructions, features list, usage examples, screenshots placeholder, troubleshooting. |
| 3.5  | `vscode-extension/CHANGELOG.md`         | Has `## [1.0.0] - 2026-07-31` section with feature list. |
| 3.6  | `vscode-extension/LICENSE`              | Copied from `/home/z/my-project/LICENSE` (MIT). |
| 3.7  | `vscode-extension/.vscodeignore`        | Excludes `src/**`, `out/**`, `tests/**`, `*.map`, `node_modules/**`, `build-data.js`, `tsconfig*.json`. |
| 3.8  | `vscode-extension/icons/icon.png`       | Reused from existing assets (5 KB PNG). |
| 3.9  | `vscode-extension/build.sh`             | Executable; runs `build-data.js` (regenerates data) + `npx @vscode/vsce package`. |

### 3.2 extension.js — required exports

- `activate(context)` — registers all 4 providers + 2 commands; loads
  `class-data.json` and `snippets.json` synchronously via `require()` /
  `JSON.parse(readFileSync(...))`.
- `deactivate()` — no-op.
- `RoyCSSCompletionProvider` — `provideCompletionItems(doc, pos, token, ctx)`.
- `RoyCSSHoverProvider` — `provideHover(doc, pos, token)`.
- `RoyCSSDiagnosticCollection` — created via `vscode.languages.createDiagnosticCollection('roycss')`;
  has `scanDocument(doc)` method.
- `RoyCSSCodeActionProvider` — `provideCodeActions(doc, range, ctx, token)`.
- Command handlers — `browseEffects()` and `searchEffect()`.

### 3.2.1 extension.js — internal invariants

- **No `require()` of npm packages** beyond `vscode`, `fs`, `path`, `crypto` (all built-in).
- **No `child_process`** anywhere.
- **No `fetch` / `http` / `https`** anywhere.
- **All `JSON.parse` calls wrapped in try/catch.**
- **All providers return `undefined`/`null` on error**, never throw.

---

## Phase 4 — Tests

| Step | Output                                  | Verification                                                  |
| ---- | --------------------------------------- | ------------------------------------------------------------- |
| 4.1  | `vscode-extension/test/smoke.test.js`   | Mocks the `vscode` module; loads `extension.js`; asserts that calling `activate({ subscriptions: [], ... })` registers ≥2 commands, ≥1 completion provider, ≥1 hover provider, and a diagnostic collection. Exits 0. |
| 4.2  | `node -c extension.js`                  | Exits 0 (syntax check). |
| 4.3  | `node test/smoke.test.js`               | Exits 0; prints `PASS: N assertions`. |

The smoke test does **not** require a running VSCode instance. It mocks the
`vscode` module via Node's `require.cache` injection before requiring
`extension.js`.

---

## Phase 5 — Validation

| Step | Command                                                | Expected                                              |
| ---- | ------------------------------------------------------ | ----------------------------------------------------- |
| 5.1  | `cd /home/z/my-project && bun run lint`                | Exit 0, 0 errors. (The vscode-extension/ is excluded from the root eslint config; this just confirms we didn't break anything else.) |
| 5.2  | `node -e "JSON.parse(require('fs').readFileSync('vscode-extension/package.json'))"` | No throw. |
| 5.3  | `node -e "JSON.parse(require('fs').readFileSync('vscode-extension/class-data.json'))"` | No throw. |
| 5.4  | `node -e "JSON.parse(require('fs').readFileSync('vscode-extension/snippets.json'))"` | No throw. |
| 5.5  | `node -e "const c=require('./vscode-extension/class-data.json'); console.log(c.effects.length)"` | Prints `1569`. |
| 5.6  | `node -e "const s=require('./vscode-extension/snippets.json'); console.log(Object.keys(s).length)"` | Prints `1569`. |
| 5.7  | `node -c vscode-extension/extension.js`                | Exit 0. |
| 5.8  | `cd vscode-extension && node test/smoke.test.js`       | Exit 0, all assertions pass. |

---

## Phase 6 — Packaging

| Step | Output                                  | Verification                                                  |
| ---- | --------------------------------------- | ------------------------------------------------------------- |
| 6.1  | Run `cd vscode-extension && bash build.sh` | Produces `roycss-vscode-1.0.0.vsix`. |
| 6.2  | Verify the .vsix is a valid zip         | `unzip -l roycss-vscode-1.0.0.vsix | head` lists `extension/`, `extension/package.json`, `extension/extension.js`, `extension/class-data.json`, `extension/snippets.json`, `extension/icons/icon.png`, `extension/LICENSE`, `extension/README.md`, `extension/CHANGELOG.md`, `[Content_Types].xml`. |
| 6.3  | If `vsce` is unavailable (no network, no npx) | Document the manual packaging steps in `README.md` §"Manual packaging". |

### 6.1 build.sh — algorithm

```bash
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

# 1. Regenerate data (idempotent; skips if effects.json unchanged)
node build-data.js

# 2. Package with vsce (prefers global, falls back to npx)
if command -v vsce >/dev/null 2>&1; then
  vsce package --no-yarn --no-dependencies --allow-star-activation
elif command -v npx >/dev/null 2>&1; then
  npx --yes @vscode/vsce@latest package --no-yarn --no-dependencies --allow-star-activation
else
  echo "ERROR: neither vsce nor npx is available." >&2
  echo "Manual packaging steps are documented in README.md." >&2
  exit 1
fi

# 3. Verify
ls -la roycss-vscode-1.0.0.vsix
echo "✅ Built roycss-vscode-1.0.0.vsix"
```

`--no-yarn` and `--no-dependencies` are safe because the extension has zero
runtime dependencies. `--allow-star-activation` is required because we use
explicit `onLanguage:*` activation events (vsce warns otherwise).

---

## Phase 7 — Worklog

| Step | Output                                                |
| ---- | ----------------------------------------------------- |
| 7.1  | Append a `---`-delimited section to `worklog.md` with: Task ID, Agent, Task, Work Log (chronological), Stage Summary (file paths, counts, validation results, packaging outcome). |

---

## Cross-references

- `DESIGN.md` — what each file should contain.
- `ADR.md` — why each decision was made.
- `THREAT-MODEL.md` — what could go wrong and how we prevent it.
- `REVIEW-CHECKLIST.md` — 15 review items to sign off before release.
