# RoyCSS CLI v2 — Design Document

- **Status:** Accepted
- **Date:** 2025-11-22
- **Owner:** Principal Engineer — CLI Platform v2 domain
- **Related:** `ADR.md`, `THREAT-MODEL.md`, `IMPLEMENTATION-PLAN.md`, `REVIEW-CHECKLIST.md`
- **Supersedes:** The single-file CLI dispatcher in `src/cli/index.ts` v1.0.0 (8 commands)

---

## 1. Overview

RoyCSS CLI v2 promotes the existing 8-command CLI (1.66 MB standalone bundle, 1,569 effects) into a full **project lifecycle tool**. v1 was a *content delivery* tool — it shipped CSS. v2 is also a *project authoring, analytics, and extensibility* tool.

| Capability cluster | v1 | v2 |
|---|---|---|
| Authoring | `init`, `add` | + `create` (scaffold full project), `upgrade` (migrate) |
| Discovery | `search`, `list`, `categories`, `info` | + `browse` (interactive TUI) |
| Project analytics | `doctor` | + `stats` (usage analytics), enhanced `doctor` |
| Tree-shaking | — | `export` (subset to standalone CSS file) |
| Extensibility | — | `plugin` (local plugin loader) |
| Total commands | 9 (incl. `help`, `version`) | 15 |

The CLI remains a **single-file standalone bundle** shipped via `roycss-cli` on npm. No external runtime dependencies are added in v2 — every new command is implemented with Node/Bun built-ins (`fs`, `path`, `readline`). This preserves the zero-dep, drop-in deployment story.

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    src/cli/index.ts  (entry)                    │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Flag parser  │  │ Color helpers│  │ Shared utilities     │  │
│  │ parseFlags() │  │ c, log, info │  │ copyToClipboard()    │  │
│  └──────┬───────┘  └──────────────┘  └──────────────────────┘  │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Command dispatcher (switch)                 │  │
│  │  init · add · search · list · categories · info ·       │  │
│  │  doctor · create · upgrade · stats · browse · export ·  │  │
│  │  plugin · version · help                                │  │
│  └──────┬───────────────────────────────────────────────────┘  │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Command handlers (functions)                │  │
│  │  Each handler receives (positional[], flags) and         │  │
│  │  calls into shared helpers. No global state except        │  │
│  │  the imported `effects` array.                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Plugin loader (lazy, opt-in)                │  │
│  │  Reads `.roycss/plugins/*.js`, calls each module's       │  │
│  │  `register(api)` export. Plugins can register            │  │
│  │  additional sub-commands scoped under `roycss <plugin>`. │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Build: `bun build src/cli/index.ts --outdir cli --target      │
│         node --outfile index.js` → 1.66 MB→~1.7 MB standalone  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.1 Source layout

v2 keeps the **single-file `index.ts`** layout. Rationale:
- The bundle target is a single `cli/index.js` — splitting source into many files only matters at authoring time, and the current file (1,000 lines after v2 additions) is still comfortably readable with section dividers.
- `bun build` inlines all imports anyway; multiple source files would not change the output.
- Refactoring into `src/cli/commands/*.ts` was considered (see ADR-001) and rejected for v2 because the per-command code is small (50–150 lines each) and shares heavy state (color helpers, `effects` array, `parseFlags`).

If the file grows past ~2,500 lines, the refactor to a command registry becomes mandatory in v3.

### 2.2 Module imports

```ts
import { effects, categoryMeta, categoryOrder } from "../lib/roycss-effects";
import { writeFileSync, readFileSync, existsSync, mkdirSync, readdirSync, statSync } from "fs";
import { join, dirname, resolve, extname } from "path";
import * as readline from "readline";
```

Everything else is implemented locally. No `node_modules` dependency is added by v2.

---

## 3. Command registry

The v2 dispatcher is a `switch (command)` over the first positional arg. Each branch:

1. Validates required positional args and flags.
2. Calls `cmd<Name>(positional, flags)` with the parsed values.
3. The handler is responsible for its own success/error output and `process.exit` codes.

### 3.1 Commands added in v2

| Command | Signature | Description |
|---|---|---|
| `create` | `create <name> [--template <t>] [--effect <id>] [--force]` | Scaffold a new project with RoyCSS pre-installed |
| `upgrade` | `upgrade` | Report outdated roycss versions, deprecated patterns, OKLCH violations |
| `stats` | `stats [--json]` | Project usage analytics: top effects, category breakdown, unused |
| `browse` | `browse [category]` | Interactive TUI browser (arrow keys + Enter + `c`) |
| `export` | `export <id> [id...] [--category <c>] [--tag <t>] [--out <file>]` | Export effect subset to a CSS file |
| `plugin` | `plugin <list\|enable\|disable\|init> [--name <n>]` | Plugin management |

### 3.2 Exit codes

| Code | Meaning |
|---|---|
| 0 | Success |
| 1 | User error (missing arg, invalid flag, effect not found) |
| 2 | Plugin error (failed to load, threw during `register()`) |

---

## 4. Plugin system

### 4.1 Discovery

Plugins live in **`.roycss/plugins/`** relative to the current working directory. The CLI scans this directory on every `plugin` invocation (no caching — keeps the surface tiny).

```
.roycss/
├── plugins/
│   ├── my-plugin.js          # active plugin
│   ├── my-plugin.disabled.js # disabled (extension convention)
│   └── sample.js             # scaffolded by `roycss plugin init`
└── config.json               # (future) plugin enable/disable registry
```

### 4.2 Plugin contract

A plugin is a CommonJS or ESM module that exports a `register` function:

```ts
// .roycss/plugins/my-plugin.js
module.exports = {
  name: "my-plugin",
  version: "1.0.0",
  description: "Adds a custom 'roycss audit' command.",
  register(api) {
    api.registerCommand("audit", (args) => {
      api.log("Running custom audit...");
    });
  },
};
```

The `api` object passed to `register()` exposes:

| Method | Description |
|---|---|
| `api.effects` | Read-only access to the full `CSSEffect[]` array |
| `api.categoryMeta` | The category metadata map |
| `api.log(msg)` / `api.success()` / `api.warn()` / `api.error()` | Themed output (same color helpers as core CLI) |
| `api.registerCommand(name, handler)` | Register a sub-command accessible via `roycss <plugin-name>:<command>` |
| `api.readFile(path)` / `api.writeFile(path, content)` | Sandboxed file I/O — refused outside the project root |

### 4.3 Loading order

1. On `roycss <plugin-action>`, scan `.roycss/plugins/*.js` (skipping `*.disabled.js`).
2. For each file, `require()` it inside a `try/catch`.
3. If the module exports `register`, call `register(api)` inside a `try/catch`.
4. Capture any thrown errors and print them with `warn()` — never crash the CLI on a plugin error.
5. For `plugin list`, just enumerate files without executing them.

### 4.4 v1 scope

- ✅ `plugin list` — enumerate `.roycss/plugins/`
- ✅ `plugin enable/disable` — rename `.js` ↔ `.disabled.js`
- ✅ `plugin init` — write a sample plugin to `.roycss/plugins/sample.js`
- ❌ Plugin marketplace — out of scope (see THREAT-MODEL.md §3)
- ❌ Remote plugins (npm install) — out of scope

---

## 5. TUI for `browse`

### 5.1 Approach

`browse` uses **`readline.emitKeypressEvents(process.stdin)` + `process.stdin.setRawMode(true)`**. No external TUI library. Rationale in ADR-003.

### 5.2 States

```
┌───────────────────────────────────┐
│ LIST mode                         │
│  ↑/↓ navigate                     │
│  Enter → detail mode              │
│  c → copy current effect CSS      │
│  q → quit                         │
└─────────────┬─────────────────────┘
              │ Enter
              ▼
┌───────────────────────────────────┐
│ DETAIL mode                       │
│  Shows full CSS + metadata        │
│  Enter/Esc/Backspace → list mode  │
│  c → copy CSS                     │
│  q → quit                         │
└───────────────────────────────────┘
```

### 5.3 Non-TTY fallback

When `process.stdin.isTTY === false` (CI, piped output, test harness), `setRawMode` throws. The CLI detects this and falls back to a non-interactive paged dump:

```
RoyCSS Browser — non-interactive mode (no TTY detected)
Listing effects in animations:
  roycss-pulse-glow — Pulse Glow
  roycss-bounce-in — Bounce In
  ...
```

This is what the v2 test harness will exercise — the TUI must not crash in piped mode.

### 5.4 Render loop

Each keystroke triggers a full re-render (`console.clear()` + redraw). No incremental rendering — effects lists are ≤ 100 items per category, so a full redraw is < 5 ms and avoids subtle diff bugs.

---

## 6. Export pipeline

### 6.1 Selection inputs

`export` accepts three orthogonal selection mechanisms:

1. **Positional effect IDs** — `roycss export pulse-glow bounce-in`
2. **`--category <cat>`** — all effects in that category
3. **`--tag <tag>`** — all effects with that tag

These are unioned (not intersected) and de-duplicated by effect ID. Rationale: a user saying "export pulse-glow plus everything tagged `attention`" wants both sets, not the intersection.

### 6.2 Pipeline

```
[IDs] + [--category] + [--tag]
       │
       ▼
   ┌────────────┐
   │ Resolve    │  →  CSSEffect[] (deduped by id)
   └─────┬──────┘
         │
         ▼
   ┌────────────┐
   │ Sort       │  →  by category, then id (stable output for diffs)
   └─────┬──────┘
         │
         ▼
   ┌────────────┐
   │ Compose    │  →  header + "\n\n" + each effect.cssCode
   └─────┬──────┘
         │
         ▼
   ┌────────────┐
   │ Write      │  →  --out file (default: roycss-custom.css)
   └────────────┘
```

### 6.3 Header

```css
/* RoyCSS Custom Export
 * Effects: <N>
 * Categories: <comma-separated>
 * Generated by: roycss export
 * Date: <ISO timestamp>
 */
```

The header is comment-prefixed so the output is valid CSS. Date is included so consumers can diff exports across runs.

### 6.4 Tree-shaking value

A typical React app uses 5–20 RoyCSS effects. Exporting only those effects drops the user's CSS payload from ~1.15 MB (full `roycss.css`) to ~5–20 KB. That's the primary value of `export` — it makes RoyCSS viable for performance-sensitive production sites that don't want the full catalog.

---

## 7. Enhanced `doctor`

v1 `doctor` checked 4 things: CSS file exists, package.json has roycss, import in entry point, class usage count.

v2 adds:

| Check | Severity | Description |
|---|---|---|
| OKLCH compliance | warn | Scan user's CSS files for `#hex` or `rgba()` literals — recommend `oklch()` |
| `prefers-reduced-motion` | warn | Check if user's global CSS has a `@media (prefers-reduced-motion)` block |
| Deprecated effects | info | Check if user is using any effect IDs flagged deprecated (none currently, but the hook exists) |
| Class usage vs available | info | Compare used `roycss-*` classes against the 1,569 catalog — warn on unknown classes (typos) |
| Bundle size | info | If `roycss.css` > 1 MB, suggest `roycss export` for tree-shaking |

---

## 8. Compatibility

- The CLI v2 still reads the same `effects` array from `src/lib/roycss-effects.ts`. No data migration needed.
- `roycss.css` files generated by v1 `init` are forward-compatible with v2.
- v1 commands keep their exact signatures. v2 only *adds* commands and flags; it never removes or renames.

---

## 9. Build & distribution

```bash
# From repo root:
bun build src/cli/index.ts --outdir cli --target node --outfile index.js

# Output: cli/index.js (~1.7 MB standalone, no runtime deps)
```

The bundle includes the entire `effects` array (1,569 effects, ~1.5 MB of CSS). This is intentional — the CLI must work offline, without importing `src/lib/*` at runtime. Bun tree-shakes nothing from the effects array since every effect is reachable from `effects.find(...)`.

### 9.1 Published package

`cli/package.json` declares `roycss-cli@1.0.0`. v2 will bump to `2.0.0` and add the new commands to the `keywords` list. The published `files` array remains `["index.js", "effects.json", "README.md"]` — `effects.json` is included for tooling that wants to read metadata without parsing the JS bundle.
