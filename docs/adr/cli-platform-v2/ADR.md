# RoyCSS CLI v2 — Architecture Decision Records

- **Status:** Accepted (all four ADRs)
- **Date:** 2025-11-22
- **Owner:** Principal Engineer — CLI Platform v2 domain
- **Related:** `DESIGN.md`, `THREAT-MODEL.md`, `IMPLEMENTATION-PLAN.md`

---

## ADR-001: Command dispatcher — `switch` over registry

**Status:** Accepted · **Date:** 2025-11-22

### Context

v1 uses a single `switch (command)` in `src/cli/index.ts` to dispatch to `cmdInit`, `cmdAdd`, etc. v2 adds 6 new commands (15 total). Two patterns were considered:

1. **Keep the `switch`** — single function, grows linearly with command count.
2. **Command registry** — `Map<string, CommandHandler>`, each handler imported from `src/cli/commands/<name>.ts`. Plugins can append to the registry.

### Decision

**Keep the `switch` for v2.** Revisit at 20+ commands or when plugin-registered commands become a real use case.

### Rationale

- The CLI source file is ~1,000 lines after v2 additions. Section dividers keep it navigable. A registry refactor would add 15 files for ~30 lines each — net loss in authoring ergonomics.
- `bun build` inlines everything regardless of source layout, so the bundle is identical.
- Plugin-registered commands (v1 scope) are scoped under `roycss <plugin>:<cmd>` and dispatched by the plugin loader, not the top-level switch. The top-level router never needs to know about them.
- A registry refactor introduces shared-state coordination (who owns `effects`, color helpers, `parseFlags`?) — solvable but not free.

### Consequences

- **Pro:** Single file remains the source of truth. Easy to grep, easy to diff.
- **Pro:** No import-resolution risk in the bundle.
- **Con:** The file will eventually need splitting. Add a v3 task to revisit at 2,500 lines.
- **Con:** Plugin authors cannot *override* core commands. This is intentional — see THREAT-MODEL.md §2.

---

## ADR-002: Plugin discovery — local `.roycss/plugins/` directory

**Status:** Accepted · **Date:** 2025-11-22

### Context

Plugin systems need a discovery mechanism. Three options:

1. **Local directory** — `.roycss/plugins/*.js` in the user's project.
2. **npm packages** — install `roycss-plugin-*` packages, auto-discover via `package.json` deps.
3. **Marketplace** — central registry at `roycss.dev/plugins`, fetched on demand.

### Decision

**Local directory only for v1.** Defer npm-package discovery to v3, marketplace to v4+.

### Rationale

- **Supply-chain safety.** A local directory is reviewed by the user before installation. npm packages and a marketplace introduce a remote-trust surface that requires signing, verification, and a moderation pipeline RoyCSS does not have today. See `THREAT-MODEL.md` §3.
- **Zero-config.** A local directory works offline, behind corporate firewalls, in air-gapped CI. No registry round-trip.
- **Discoverable.** `roycss plugin list` reads one directory. Users can `ls .roycss/plugins/` themselves.
- **Reversible.** Disabling a plugin is a file rename (`.js` → `.disabled.js`). No uninstall step.
- **Future-compatible.** A v3 npm-package resolver can *populate* `.roycss/plugins/` (similar to how `bun install` populates `node_modules/`) without changing the v1 contract.

### Consequences

- **Pro:** Plugins are project-scoped, not global. Different projects can use different plugins.
- **Pro:** No network calls in the CLI. Predictable, fast, offline.
- **Con:** No auto-update of plugins. Users manage plugin versions manually.
- **Con:** No central catalog. Discoverability is "look at the marketplace README" — to be built in v4.

### Plugin enable/disable mechanism

Plugins are enabled by being `.js` files in `.roycss/plugins/`. To disable, the CLI renames them to `.disabled.js`. This:

- Survives `git` operations cleanly (file content unchanged, only extension renamed).
- Lets users see disabled plugins in `ls` output.
- Avoids a JSON state file that could drift out of sync with the filesystem.

---

## ADR-003: TUI library — custom `readline` over Ink / cli-table3

**Status:** Accepted · **Date:** 2025-11-22

### Context

The `browse` command needs an interactive TUI: arrow-key navigation, Enter to view, `c` to copy, `q` to quit. Three implementation paths:

1. **Ink** — React-for-CLIs. Powerful, declarative. ~250 KB dependency tree.
2. **cli-table3 + promptui** — table rendering + interactive prompts. ~50 KB.
3. **Custom `readline`** — `readline.emitKeypressEvents()` + `process.stdin.setRawMode(true)`. Zero deps.

### Decision

**Custom `readline`.** No external dependency.

### Rationale

- **Bundle size.** RoyCSS CLI is 1.66 MB standalone. Adding Ink would push it past 2 MB and pull in React, Yoga, and a tree of helpers. Adding cli-table3 would add ~50 KB. The `browse` TUI is simple enough (list + detail view, no widgets) that `readline` is sufficient.
- **Zero-dep promise.** The CLI's value proposition includes "drop in, no install, no network." Every dependency added breaks that promise somewhere (transitive vulns, resolution failures, version conflicts).
- **Maintenance.** Ink and cli-table3 both have open issues with Bun, raw mode, and Windows terminals. Custom `readline` uses Node's stable built-in API surface.
- **TUI scope.** v2 `browse` is a navigator, not a form. There are no text inputs, no multi-select, no autocomplete. The UI is two states (list + detail) with five keys. `readline` handles this trivially.

### Consequences

- **Pro:** Bundle stays at ~1.7 MB.
- **Pro:** No transitive supply-chain risk.
- **Pro:** Behavior is identical across macOS/Linux/Windows (Node's `readline` normalizes keypresses).
- **Con:** More bespoke code (render loop, key handling). ~120 lines of TUI logic.
- **Con:** No fancy widgets. If v3 needs autocomplete, multi-select, or forms, this decision should be revisited.

### Non-TTY fallback

When `process.stdin.isTTY === false`, `setRawMode` throws. The CLI detects this and falls back to a non-interactive paged dump. This makes `browse` testable in CI and pipes — important since the test harness for this task runs in a sandboxed shell.

---

## ADR-004: Export filter language — flags over DSL

**Status:** Accepted · **Date:** 2025-11-22

### Context

The `export` command lets users select a subset of effects to ship as a single CSS file. Selection mechanisms:

1. **Flags** — `--category`, `--tag`, plus positional IDs. Union semantics.
2. **Mini-DSL** — e.g. `roycss export "category:animations AND tag:glow"`.
3. **JSON file** — `roycss export --filter ./filter.json` where the file declares selection rules.

### Decision

**Flags only.** No DSL, no JSON file.

### Rationale

- **Composability.** `roycss export pulse-glow bounce-in --category animations --tag attention --out bundle.css` is immediately readable. A DSL would require learning a syntax for a feature used 2–5 times per project.
- **Shell-friendly.** Flags compose with `$(roycss list --json | jq ...)`. A DSL would need its own parser.
- **Coverage.** ~95% of real export use cases are "give me these N effects" or "give me everything in this category." Both are one-liner flags. The remaining 5% (intersection, exclusion) is served by `roycss list --json | jq | roycss export $(cat -)` — Unix composability wins.
- **Future-compatible.** A `--filter <file>` flag can be added in v3 without breaking v2 syntax.

### Union semantics

`roycss export pulse-glow --category animations --tag glow` exports:
- `pulse-glow` (explicit ID)
- ∪ all effects in `animations` (≈ 80 effects)
- ∪ all effects tagged `glow` (≈ 15 effects)

After de-dup, that's ~95 effects. This is what users mean when they say "give me this one plus everything in this category plus everything tagged glow."

**Not intersection** because:
- Intersection of {`pulse-glow`} ∩ {`animations`} ∩ {`glow`} = {`pulse-glow`} (already explicitly named). The flags become no-ops.
- Union is the more permissive, less surprising default. Users can pipe through `jq` for intersection if needed.

### Sort order

Output effects are sorted by `(category, id)` for stable diffs. Two `roycss export` runs with the same selection produce byte-identical files (modulo the date in the header).

---

## ADR-005: Versioning — semver, v2.0.0, no breaking changes

**Status:** Accepted · **Date:** 2025-11-22

### Context

v1 is `roycss-cli@1.0.0`. v2 adds 6 commands and 1 new flag (`--out`). No existing command signature changes. No existing flag is removed.

### Decision

Bump to **`2.0.0`** despite no breaking changes. Reasoning:

- The CLI ships as a standalone bundle. The npm package `roycss-cli` is independent of the main `roycss` package (currently `1.4.0`). The two version streams are decoupled.
- v2 is a major capability expansion (scaffolding, plugins, TUI). A 1.x → 2.0 bump signals the scope change to consumers reading `roycss version` or `npm view roycss-cli version`.
- Semver technically allows v1.1.0 here (no breaking changes), but RoyCSS uses the "minor-bump-on-big-feature" convention loosely. A 2.0.0 release makes the changelog entry cleaner.

### Consequences

- The `cli/package.json` field will move from `1.0.0` to `2.0.0` on next release.
- The `VERSION` constant in `src/cli/index.ts` moves from `"1.0.0"` to `"2.0.0"`.
- `roycss version` and `roycss help` both reflect the new version.
- v3 can be 2.x (additive) or 3.0.0 (breaking) depending on whether the command-registry refactor (ADR-001) happens.
