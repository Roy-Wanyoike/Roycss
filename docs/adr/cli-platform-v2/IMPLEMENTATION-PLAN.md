# RoyCSS CLI v2 — Implementation Plan

- **Status:** In Progress
- **Date:** 2025-11-22
- **Owner:** Principal Engineer — CLI Platform v2 domain
- **Related:** `DESIGN.md`, `ADR.md`, `REVIEW-CHECKLIST.md`

---

## Overview

14-step plan. Each step is independently committable. Steps 1–4 are pure refactors / no-ops at runtime; steps 5–10 add new commands; step 11 hardens `doctor`; steps 12–14 are build/test/docs.

| Step | Type | Files | Estimate | Risk |
|---|---|---|---|---|
| 1 | Docs | `docs/adr/cli-platform-v2/*` | 2h | None |
| 2 | Refactor | `src/cli/index.ts` (extract helpers) | 30m | Low |
| 3 | Add | `cmdCreate` | 1.5h | Medium (template scaffolding) |
| 4 | Add | `cmdUpgrade` | 1h | Low |
| 5 | Add | `cmdStats` | 1h | Low |
| 6 | Add | `cmdBrowse` (TUI + non-TTY fallback) | 2h | Medium (raw mode) |
| 7 | Add | `cmdExport` | 45m | Low |
| 8 | Add | `cmdPlugin` | 1.5h | Medium (loader safety) |
| 9 | Enhance | `cmdDoctor` (OKLCH, a11y, deprecations) | 1h | Low |
| 10 | Update | `cmdHelp`, `cmdVersion`, header docstring | 30m | None |
| 11 | Build | `bun build` standalone | 15m | Low |
| 12 | Test | Each new command | 1h | Low |
| 13 | Lint | `bun run lint` clean | 15m | Low |
| 14 | Worklog | Append entry | 15m | None |

---

## Step 1: Design docs ✅

Create `docs/adr/cli-platform-v2/` with:
- `DESIGN.md` — architecture, command registry, plugin system, TUI, export pipeline
- `ADR.md` — 5 ADRs (command pattern, plugin discovery, TUI library, export filter language, versioning)
- `THREAT-MODEL.md` — malicious plugins, file system access, supply chain, TTY, info disclosure
- `IMPLEMENTATION-PLAN.md` — this document
- `REVIEW-CHECKLIST.md` — 15 review items

---

## Step 2: Refactor shared helpers

Extract from the existing `src/cli/index.ts`:

- `c` (color map) — keep at top of file, no change.
- `log`, `success`, `error`, `info`, `warn` — keep at top of file, no change.
- `parseFlags(args)` — keep at top of file, no change.
- `copyToClipboard(text)` — keep at top of file, no change.

Bump `VERSION` from `"1.0.0"` to `"2.0.0"`.

Add new imports:
```ts
import { statSync, mkdirSync, readdirSync } from "fs";   // already partially imported
import { join, dirname, resolve, extname } from "path";  // add resolve, extname
import * as readline from "readline";                    // new for browse
```

---

## Step 3: `create <project-name>`

**Signature:** `create <name> [--template <t>] [--effect <id>] [--force]`

**Valid templates:** `react`, `vue`, `svelte`, `vanilla`, `nextjs`, `html`

**Files written per template:**

| Template | Files |
|---|---|
| `vanilla` | `package.json`, `roycss.css`, `index.html`, `main.js`, `README.md` |
| `html` | `package.json`, `roycss.css`, `index.html`, `README.md` |
| `react` | `package.json`, `roycss.css`, `index.html`, `src/main.tsx`, `src/App.tsx`, `README.md` |
| `vue` | `package.json`, `roycss.css`, `index.html`, `src/main.ts`, `src/App.vue`, `README.md` |
| `svelte` | `package.json`, `roycss.css`, `index.html`, `src/main.ts`, `src/App.svelte`, `README.md` |
| `nextjs` | `package.json`, `roycss.css`, `src/app/layout.tsx`, `src/app/page.tsx`, `README.md` |

**`roycss.css` content:** Header comment + the initial effect's CSS (or `pulse-glow` if `--effect` not specified). Optionally include all effects if `--full` flag is passed (defer to v2.1).

**Path safety:** Refuse paths that escape `process.cwd()` via `..`. Allow with `--force`.

**Output:** Print next steps (`cd <name>`, `npm install`, `npm run dev`).

---

## Step 4: `upgrade`

**Signature:** `upgrade` (no args, no flags)

**Scans:**

1. `package.json` for `roycss` in dependencies/devDependencies. Compare version to `2.0.0`. If `< 2.0.0`, warn and recommend `npm install roycss@latest`.
2. `roycss.css` (if present) — scan for:
   - `#hex` and `rgba()` color literals → recommend `roycss upgrade --migrate-colors` (deferred to v2.1; for v1 just report)
   - Missing `@media (prefers-reduced-motion: reduce)` block → recommend adding one
3. Source files (`.html`, `.tsx`, `.jsx`, `.vue`, `.svelte`, `.ts`, `.js`) for:
   - Use of unprefixed effect classes (e.g., `class="pulse-glow"` instead of `class="roycss-pulse-glow"`) — report as migration candidate

**v1 scope: report-only.** No auto-migration. Print a summary at the end.

---

## Step 5: `stats`

**Signature:** `stats [--json]`

**Scans:** `src`, `app`, `pages`, `components`, `public` (skip `node_modules`, `.git`, hidden dirs).

**Reports:**
- Total `roycss-*` class usages (count)
- Top 10 effect IDs by usage
- Category breakdown (count per RoyCSS category)
- Unused effects: effect IDs in the RoyCSS catalog but never used in source

**`--json` flag:** Same data as JSON. Useful for CI dashboards.

**Performance:** For 1,569 effects and a typical 500-file project, this is O(files × effects_per_file). Bounded by `readFileSync` cost — should complete in < 5 seconds.

---

## Step 6: `browse [category]`

**Signature:** `browse [category]`

**Behavior:**
- If `[category]` is provided, list effects in that category.
- If not provided, list all effects (paginated).
- Arrow keys (↑/↓) to navigate.
- Enter to view full CSS.
- `c` to copy CSS to clipboard.
- `q` to quit.

**Non-TTY fallback:** When `process.stdin.isTTY === false`, dump a paged list (no keypress handling).

**Cleanup:** Register `process.on("exit")` and `process.on("SIGINT")` handlers to restore terminal state.

---

## Step 7: `export <id> [id...]`

**Signature:** `export <id> [id...] [--category <cat>] [--tag <tag>] [--out <file>]`

**Selection (union, deduped):**
1. Explicit IDs from positional args
2. All effects in `--category`
3. All effects with `--tag`

**Output:** `--out` file (default: `roycss-custom.css`). Header comment + sorted effects' CSS.

**Sort:** By `(category, id)` for stable diffs.

**Reporting:** Print count + file size + list of exported effect IDs.

---

## Step 8: `plugin <action>`

**Actions:**
- `list` — enumerate `.roycss/plugins/*.js` (skip `*.disabled.js`). Do not execute.
- `enable --name <n>` — rename `.disabled.js` → `.js`
- `disable --name <n>` — rename `.js` → `.disabled.js`
- `init` — write `.roycss/plugins/sample.js` with a documented sample plugin

**Plugin contract (for documentation; execution deferred to v2.1):**

```js
module.exports = {
  name: "sample",
  version: "1.0.0",
  description: "Sample RoyCSS plugin",
  register(api) {
    api.registerCommand("hello", () => api.log("Hello from sample plugin!"));
  },
};
```

**v1 scope:** No plugin execution. The `register()` function is documented but never called in v1. This is the safety floor — see THREAT-MODEL.md §2.3.

---

## Step 9: Enhanced `doctor`

Add to the existing `cmdDoctor`:

| Check | Severity | Description |
|---|---|---|
| OKLCH compliance | warn | Scan user CSS for `#hex` / `rgba()` literals |
| `prefers-reduced-motion` | warn | Check global CSS for the media query |
| Deprecated effects | info | (No deprecations yet, but the hook exists) |
| Unknown `roycss-*` classes | info | Warn on classes not in the catalog (typos) |
| Bundle size | info | If `roycss.css` > 1 MB, suggest `export` |

---

## Step 10: Update `help`, `version`, header docstring

- `cmdHelp`: add 6 new commands + `--out` flag.
- `cmdVersion`: print `2.0.0`.
- Header docstring at top of file: list all 15 commands + 6 flags.

---

## Step 11: Build

```bash
cd /home/z/my-project && bun build src/cli/index.ts --outdir cli --target node --outfile index.js
```

**Expected output:** `cli/index.js` at ~1.7 MB (slight increase from 1.66 MB due to new code; no new deps).

---

## Step 12: Test each command

| Test | Expected |
|---|---|
| `node cli/index.js create test-project --template react` | Creates directory with `package.json`, `roycss.css`, `src/main.tsx`, `src/App.tsx`, `index.html` |
| `node cli/index.js stats` | Reports usage counts |
| `node cli/index.js export pulse-glow bounce-in --out /tmp/test.css` | Creates `/tmp/test.css` with both effects |
| `node cli/index.js browse animations` | Does not crash (non-TTY fallback prints list) |
| `node cli/index.js plugin list` | Lists plugins (likely empty) |
| `node cli/index.js upgrade` | Reports status |
| `node cli/index.js help` | Shows all 15 commands |
| `node cli/index.js version` | Shows `RoyCSS CLI v2.0.0` |

Also smoke-test v1 commands to confirm no regressions:
- `node cli/index.js init` (in a temp dir)
- `node cli/index.js search glow`
- `node cli/index.js list animations`
- `node cli/index.js info pulse-glow`
- `node cli/index.js doctor`
- `node cli/index.js categories`

---

## Step 13: Lint

```bash
cd /home/z/my-project && bun run lint
```

Must be **0 errors, 0 warnings**. The ESLint config already disables most rules; new code should not trip any of the remaining ones.

If lint fails, fix and re-run. Common pitfalls:
- Unused imports (rule disabled, but cleaner to remove)
- `@typescript-eslint/no-explicit-any` (disabled — but prefer specific types)
- `no-console` (disabled — `console.log` is fine in a CLI)

---

## Step 14: Worklog entry

Append to `worklog.md`:

```
---

Task ID: cli-platform-v2
Agent: Principal Engineer — CLI Platform v2 domain
Task: [one-line summary]
Work Log:
- [step-by-step what was done]
Stage Summary:
- [deliverables + status]
```

---

## Out-of-scope (deferred)

The following are explicitly **not** in v1 of CLI v2:

1. **Plugin execution.** The `register()` API is documented but never called. v2.1 will add safe execution.
2. **`roycss upgrade --migrate-colors`** auto-migration. v1 only reports.
3. **`create --full`** (export all 1,569 effects to the new project's `roycss.css`). v1 only writes the initial effect.
4. **Plugin marketplace** (THREAT-MODEL.md §3). v3+.
5. **Command-registry refactor** (ADR-001). v3+.
6. **Windows TTY testing.** The non-TTY fallback handles the test harness; real Windows arrow-key behavior is untested in v1.

---

## Risks

| Risk | Probability | Mitigation |
|---|---|---|
| `browse` raw-mode crashes on weird terminals | Medium | Non-TTY fallback + cleanup handlers |
| `create` template files have wrong framework syntax | Low | Smoke-test each template with a real `bun install` if time permits |
| `stats` is slow on large projects | Low | Bound by `readFileSync`; acceptable for v1 |
| Plugin `init` writes a file that linters reject | Low | Sample plugin is plain JS with no TS syntax |
| Bundle size exceeds 1.8 MB | Low | New code is < 50 KB; effects array unchanged |
