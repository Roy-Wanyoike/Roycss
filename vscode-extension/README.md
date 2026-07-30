# RoyCSS — VSCode Extension

> **1,569 production-ready CSS effects.** Autocomplete, hover docs, snippets,
> diagnostics, and a browse command — directly in your editor.
> **Zero runtime dependencies. Zero network calls.**

[![effects: 1569](https://img.shields.io/badge/effects-1569-emerald)](https://roycss.com)
[![dependencies: 0](https://img.shields.io/badge/dependencies-0-success)](https://github.com/Roy-Wanyoike/roycss/tree/main/vscode-extension)
[![vscode: ^1.85.0](https://img.shields.io/badge/vscode-%5E1.85.0-blue)](https://code.visualstudio.com)
[![license: MIT](https://img.shields.io/badge/license-MIT-green)](./LICENSE)

## Features

### 1. Autocomplete for all 1,569 `roycss-*` classes

Type `roycss-` in any CSS / HTML / JS / TS / JSX / TSX / Vue / Svelte file and
IntelliSense surfaces the full catalog with class name, effect name, category,
description, tags, and a fenced CSS preview block.

```
roycss-pulse-glow    Pulse Glow · animations
                     A smooth pulsing glow effect that draws attention to elements
                     .roycss-pulse-glow {
                       animation: roy-pulse-glow 2s ease-in-out infinite;
                     }
                     @keyframes roy-pulse-glow { ... }
```

### 2. Hover documentation

Hover any `roycss-*` token to see the effect's full metadata plus a copyable
CSS preview:

```markdown
**Pulse Glow** · `animations`

A smooth pulsing glow effect that draws attention to elements.

`roycss-pulse-glow`

Tags: `glow` · `pulse` · `attention` · `animate`

```css
.roycss-pulse-glow {
  animation: roy-pulse-glow 2s ease-in-out infinite;
}
@keyframes roy-pulse-glow { ... }
```

[View on roycss.com](https://roycss.com) · [Source on GitHub](https://github.com/Roy-Wanyoike/roycss)
```

### 3. Snippets that expand to full effect markup

The extension ships 1,569 snippets (one per effect). Type a class name and
press `Tab` to expand:

```
roycss-pulse-glow<Tab>
```

Expands to:

```html
<div class="roycss-pulse-glow">
  Content
</div>
```

Snippets are scoped to HTML, CSS, JavaScript, TypeScript, JavaScriptReact,
TypeScriptReact, Vue, and Svelte.

### 4. Diagnostics that warn on unknown `roycss-*` classes

If you type `roycss-pulse-gloww` (typo), the extension underlines it with a
warning squiggle and shows:

```
Unknown RoyCSS class "roycss-pulse-gloww". Did you mean "roycss-pulse-glow"?
```

A **quick-fix** (lightbulb → `Ctrl+.`) offers to replace the typo with the
closest known class.

### 5. Commands

| Command                       | Keybinding (Win/Linux) | Mac            | What it does                                |
| ----------------------------- | ---------------------- | -------------- | ------------------------------------------- |
| `RoyCSS: Browse Effects`      | `Ctrl+Shift+Alt+R`     | `Cmd+Shift+Alt+R` | Opens a QuickPick of all 1,569 effects. |
| `RoyCSS: Search Effect`       | `Ctrl+Shift+R`         | `Cmd+Shift+R`  | Opens an InputBox for fuzzy substring search. |

Both commands insert the chosen class at the cursor (or copy to clipboard if
no editor is open).

---

## Installation

### From the marketplace (when published)

1. Open VSCode.
2. `Ctrl+Shift+X` (or `Cmd+Shift+X` on Mac) to open the Extensions panel.
3. Search for `RoyCSS`.
4. Click **Install**.

### From a local `.vsix` (development / pre-release)

1. Build the `.vsix` (see [Building](#building) below) — produces
   `roycss-vscode-1.0.0.vsix`.
2. Install it:
   ```sh
   code --install-extension roycss-vscode-1.0.0.vsix
   ```
   Or in VSCode: Extensions panel → `…` menu → **Install from VSIX…** → pick
   the file.
3. Reload VSCode.

### Manual unpack (no `code` CLI)

If neither of the above works:

1. Unzip `roycss-vscode-1.0.0.vsix` (it's a zip archive).
2. Move the `extension/` folder to:
   - **Windows:** `%USERPROFILE%\.vscode\extensions\roycss.roycss-1.0.0\`
   - **macOS / Linux:** `~/.vscode/extensions/roycss.roycss-1.0.0/`
3. Restart VSCode.

---

## Configuration

Open VSCode settings (`Ctrl+,`) and search for `roycss`:

| Key                            | Default     | Description                                                  |
| ------------------------------ | ----------- | ------------------------------------------------------------ |
| `roycss.enableCompletion`      | `true`      | Register the completion provider.                            |
| `roycss.enableHover`           | `true`      | Register the hover provider.                                 |
| `roycss.enableDiagnostics`     | `true`      | Scan documents for unknown `roycss-*` classes.               |
| `roycss.enableCodeActions`     | `true`      | Register the quick-fix code-action provider.                 |
| `roycss.maxCompletionItems`    | `1569`      | Cap the number of completion items (50–1569).                |
| `roycss.diagnosticSeverity`    | `"warning"` | Severity for unknown-class diagnostics: `error` / `warning` / `information` / `hint` / `none`. |

---

## Supported languages

The extension activates on these 8 language IDs:

| Language ID          | File types                       |
| -------------------- | -------------------------------- |
| `css`                | `.css`                           |
| `html`               | `.html`, `.htm`                  |
| `javascript`         | `.js`, `.mjs`, `.cjs`            |
| `typescript`         | `.ts`, `.mts`, `.cts`            |
| `javascriptreact`    | `.jsx`                           |
| `typescriptreact`    | `.tsx`                           |
| `vue`                | `.vue`                           |
| `svelte`             | `.svelte`                        |

The extension also declares a `roycss` language id for `*.roycss` files
(optional; mostly a no-op for users who don't use that extension).

---

## Usage

### Drop a class on an element

```html
<!-- In an HTML file -->
<button class="roycss-pulse-glow">Click me</button>
```

```tsx
// In a React component
<div className="roycss-text-gradient">Hello, world!</div>
```

```vue
<!-- In a Vue template -->
<template>
  <div class="roycss-bg-aurora">…</div>
</template>
```

### Search for an effect

1. `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac).
2. Type `glow` (or any substring — name, tag, or id).
3. Pick from the QuickPick. The class is inserted at your cursor.

### Browse the full catalog

1. `Ctrl+Shift+Alt+R` (or `Cmd+Shift+Alt+R` on Mac).
2. Scroll / type to filter.
3. Pick → inserted at the cursor.

### Include the RoyCSS stylesheet in your project

The extension does **not** inject any CSS — it only provides editor support.
To actually apply the effects, include the RoyCSS stylesheet in your project:

```html
<link rel="stylesheet" href="https://unpkg.com/roycss/dist/roycss.min.css">
```

Or install via npm:

```sh
npm install roycss
```

```js
import "roycss/dist/roycss.min.css";
```

See <https://roycss.com> for full docs.

---

## Building (for contributors)

### Prerequisites

- Node.js ≥ 18 (for `node build-data.js`).
- `npx` (bundled with Node.js) for `vsce package`.
- The RoyCSS project at `/home/z/my-project/` with `dist/effects.json` and
  `dist/roycss.css` already built (run `bun run build` in the project root).

### Build steps

```sh
cd vscode-extension
bash build.sh
```

`build.sh`:

1. Runs `node build-data.js` — regenerates `class-data.json` (1,569 effects)
   and `snippets.json` (1,569 snippets) from `../dist/effects.json` +
   `../dist/roycss.css`.
2. Runs `vsce package` (or `npx @vscode/vsce@latest package` if `vsce` is
   not installed globally).
3. Verifies the resulting `.vsix` exists.

The output is `roycss-vscode-1.0.0.vsix`.

### Manual packaging (if `vsce` is unavailable)

If `vsce` and `npx` are both unavailable (e.g. air-gapped environment):

1. Ensure `class-data.json`, `snippets.json`, `extension.js`, `package.json`,
   `language-configuration.json`, `icons/`, `LICENSE`, `README.md`,
   `CHANGELOG.md` are all present in `vscode-extension/`.
2. Create a zip archive with this layout (note the `extension/` prefix):
   ```text
   extension/
     package.json
     extension.js
     class-data.json
     snippets.json
     language-configuration.json
     icons/icon.png
     LICENSE
     README.md
     CHANGELOG.md
   [Content_Types].xml       (the VSIX manifest — see below)
   extension.vsixmanifest    (the VSCode manifest — see below)
   ```
3. The two manifest files (`[Content_Types].xml` and `extension.vsixmanifest`)
   are what `vsce package` normally generates for you. Templates are in the
   [VSCode extension API docs](https://code.visualstudio.com/api/working-with-extensions/publishing-extension).
4. Rename the `.zip` to `.vsix`.
5. Install with `code --install-extension your.vsix`.

This manual path is **not recommended** — install Node.js + use `vsce` if at
all possible.

---

## Architecture

See [`docs/adr/vscode-extension/`](../docs/adr/vscode-extension/) for:

- `DESIGN.md` — extension architecture, providers, lifecycle.
- `ADR.md` — 5 ADRs covering bundled vs network-fetched data, LSP vs direct
  providers, snippet format, activation strategy, diagnostics approach.
- `THREAT-MODEL.md` — STRIDE analysis (zero network, zero deps, zero shell exec).
- `IMPLEMENTATION-PLAN.md` — step-by-step build order.
- `REVIEW-CHECKLIST.md` — 15 review items for release sign-off.

---

## Privacy

The extension makes **zero network calls** and **zero shell exec calls**. All
data is bundled inside the `.vsix` (1.7 MB `class-data.json` + 470 KB
`snippets.json`). The only filesystem access is reading the extension's own
`class-data.json` at activation. No telemetry, no analytics, no error
reporting.

---

## Troubleshooting

**The extension doesn't activate.** Open the Output panel (`Ctrl+Shift+U`),
select "RoyCSS" from the dropdown. You should see `[RoyCSS] Activated in Xms`.
If you see an error loading `class-data.json`, reinstall the extension.

**Completion doesn't show all 1,569 effects.** Check
`roycss.maxCompletionItems` in settings — it caps the list (default 1,569).

**Diagnostics are too noisy.** Set `roycss.diagnosticSeverity` to `"none"`
or `roycss.enableDiagnostics` to `false`.

**Hover popup is empty.** The `class-data.json` file may be corrupt. Run
`bash build.sh` to regenerate it, or reinstall the extension.

**Snippets don't expand.** Make sure you're in a supported language file
(`.html`, `.css`, `.js`, `.jsx`, `.ts`, `.tsx`, `.vue`, `.svelte`). The
snippets are scoped to those language IDs only.

---

## Screenshots

> Placeholders — replace with actual screenshots before marketplace publish.

- `screenshots/completion.png` — typing `roycss-` shows 1,569 completion items.
- `screenshots/hover.png` — hovering `roycss-pulse-glow` shows the effect metadata + CSS preview.
- `screenshots/diagnostics.png` — typo `roycss-pulse-gloww` is flagged with a quick-fix.
- `screenshots/browse.png` — the Browse Effects QuickPick.
- `screenshots/search.png` — the Search Effect InputBox + filtered QuickPick.

---

## License

MIT © Royford Wanyoike Wamaitha. See [LICENSE](./LICENSE).
