# RoyCSS MCP Server v2 — Design

**Status:** Accepted
**Last updated:** 2026-07-31
**Server version:** `2.0.0`

This document describes the architecture of the RoyCSS MCP Server v2 — a [Model Context Protocol](https://modelcontextprotocol.io) server that exposes the RoyCSS effect catalog, UI patterns, recipes, framework adapters, design tokens, and accessibility/browser-support guidance to AI assistants (Claude, Cursor, Windsurf, Copilot, Codex).

---

## 1. Goals

v2 layers four new capabilities on top of the v1 catalog (7 tools, 1,569 effects):

1. **Patterns** — expose the 10 production UI patterns (`Empty State`, `Loading State`, `Error State`, `Success State`, `Offline State`, `Skeleton Loading`, `Progressive Disclosure`, `Toast Feedback`, `Master-Detail Layout`, `Wizard Steps`) so the AI can recommend composition patterns, not just single effects.
2. **Validation & intent-based suggestion** — `validate_class_name` (fuzzy) + `suggest_for_intent` so the AI can self-correct typos and recommend effects/patterns/recipes from a natural-language UX goal.
3. **Accessibility & browser support** — `get_accessibility_considerations` and `get_browser_support` bake WCAG 2.1 AA + Baseline-2024 browser guidance directly into every recommendation the AI emits.
4. **Resources & prompts** — expose static data as MCP `resources` (so clients can attach them as context) and ship 3 `prompts` (landing page, loading state, accessibility audit) as reusable workflow templates.

Non-goals: streaming, HTTP/SSE transport, authentication, multi-tenant isolation. v2 stays single-process stdio.

---

## 2. Transport

```
┌─────────────────┐     stdio (JSON-RPC 2.0 over stdin/stdout)     ┌─────────────────────┐
│  AI Client      │ ←─────────────────────────────────────────────→ │  RoyCSS MCP Server  │
│  (Claude, etc.) │                                                 │  (Bun + TypeScript) │
└─────────────────┘                                                 └──────────┬──────────┘
                                                                               │
                                                          ┌────────────────────┼────────────────────┐
                                                          │                    │                    │
                                                   ┌──────▼──────┐    ┌──────▼──────┐    ┌──────▼──────┐
                                                   │ effects.json│    │ patterns.json│    │ in-process   │
                                                   │  1,569       │    │  10 patterns │    │ data tables  │
                                                   │  20 cats     │    │              │    │ (tokens,     │
                                                   └─────────────┘    └─────────────┘    │  features,   │                                                                                         │  prompts)    │
                                                                                         └─────────────┘
```

- **Transport:** `StdioServerTransport` from `@modelcontextprotocol/sdk/server/stdio.js`. One process per AI client. No network listener, no port, no auth surface (see THREAT-MODEL.md §2).
- **Framing:** Newline-delimited JSON-RPC 2.0. Server logs go to **stderr** (never stdout, which is reserved for the protocol).
- **Lifecycle:** Client sends `initialize` → server replies with capabilities → client sends `initialized` notification → tool/resource/prompt requests flow until stdin closes.

---

## 3. Capabilities advertised

The server declares three capability blocks in its `initialize` response:

```jsonc
{
  "capabilities": {
    "tools": {},
    "resources": { "listChanged": false },
    "prompts": { "listChanged": false }
  }
}
```

`listChanged: false` on resources and prompts because the catalog is static for the lifetime of a process (it is loaded once at startup from `effects.json` + `patterns.json`). If a future version syncs the catalog at runtime, flip `listChanged: true` and emit `notifications/resources/list_changed`.

---

## 4. Tool registry

13 tools (7 from v1 + 6 new). Each tool is a pure function: `(args) => { content, isError? }`. No tool mutates server state; every tool is safe to call concurrently.

| # | Tool | Phase | Purpose |
|---|------|-------|---------|
| 1 | `search_effects` | v1 | Search 1,569 effects by keyword/category/tags |
| 2 | `get_effect` | v1 | Get full metadata + usage for one effect |
| 3 | `list_categories` | v1 | List 20 categories with counts |
| 4 | `get_install` | v1 | Install instructions per package manager |
| 5 | `get_framework_usage` | v1 | React/Vue/Angular/Svelte/Next.js/vanilla example |
| 6 | `get_design_tokens` | v1 | OKLCH color system + principles |
| 7 | `get_recipes` | v1 | Curated effect combinations |
| 8 | `get_patterns` | **v2** | List all 10 UI patterns (id, name, category, description, effectIds) |
| 9 | `get_pattern` | **v2** | Single pattern with full HTML + effectIds |
| 10 | `validate_class_name` | **v2** | Validate a `roycss-*` class exists; fuzzy-match closest |
| 11 | `suggest_for_intent` | **v2** | From a UX intent string → effects + patterns + recipes |
| 12 | `get_accessibility_considerations` | **v2** | prefers-reduced-motion, contrast, focus guidance |
| 13 | `get_browser_support` | **v2** | Per-effect browser support matrix from CSS feature usage |

### 4.1 Tool granularity — see ADR-001

The 13 tools split along three axes: **lookup** (by ID), **search** (by query), **guidance** (static docs). We deliberately did **not** merge `get_pattern` + `get_effect` into one "get_entity" tool, because clients pick tools from the `tools/list` menu by description — a single merged tool would force the AI to disambiguate entity type on every call.

### 4.2 Tool input schema

Every tool input schema is a JSON-Schema object with `type: "object"`, optional `properties`, optional `required`. The MCP SDK validates args client-side before sending; the server **re-validates** defensively (see §7 Error handling) because not every client validates.

---

## 5. Resources

Resources are **read-only, addressable, static context** the AI client can attach to a conversation. They use the `roycss://` URI scheme.

| URI | Type | Returns |
|-----|------|---------|
| `roycss://effects` | static | Array of `{ id, name, category }` for all 1,569 effects (compact — ~120 KB) |
| `roycss://effects/{id}` | template | Full effect metadata for one effect |
| `roycss://categories` | static | 20 categories with counts |
| `roycss://patterns` | static | 10 UI patterns (id, name, category, description, effectIds) |
| `roycss://recipes` | static | 12 curated recipes (id, title, description, effects) |

### 5.1 Resource vs tool — see ADR-002

- A **resource** answers "what data exists?" — the client pre-attaches it as context, no round-trip per question.
- A **tool** answers "compute this for me" — active, parameterised, side-effecting (in our case: filtered/projected views).

`roycss://effects` (all 1,569 IDs) is a resource because it is small, static, and the AI benefits from having it in context. `search_effects` is a tool because it returns a **filtered, ranked, limited** view that depends on runtime args.

### 5.2 Resource templates

`roycss://effects/{id}` is exposed via `ListResourceTemplatesRequest` (MCP's mechanism for URI templates). The client receives the template and can substitute `{id}` itself, or call `ReadResource` with the concrete URI. We support both.

Static URIs (`roycss://effects`, `roycss://categories`, `roycss://patterns`, `roycss://recipes`) are returned in `ListResources`.

`roycss://patterns/{id}` is **not** exposed as a template — there are only 10 patterns, so the client can read `roycss://patterns` once and index locally. This is a deliberate asymmetry: the cost of a second template slot in the client UI outweighs the savings (see ADR-002).

---

## 6. Prompts

Three reusable prompt templates. Each is a function `(args) => { messages, description? }` that returns one or more `PromptMessage` objects with `role: "user"` or `"assistant"`.

| Prompt | Arguments | Returns |
|--------|-----------|---------|
| `design-a-landing-page` | `audience` (string), `vibe` (string: `minimal`/`bold`/`playful`), `primary_effect` (string, optional) | A user-role message containing a structured brief + a server-role hint that names the specific RoyCSS tools to call |
| `build-a-loading-state` | `wait_duration` (string: `short`/`medium`/`long`), `content_type` (string: `list`/`detail`/`form`) | A user-role brief that pre-bakes the right pattern (`loader-spinner` for short, `pattern-skeleton-state` for long) and names tools to call |
| `accessibility-audit` | `target` (string: url or component name), `motion_sensitive` (boolean, default false) | A user-role brief with an audit checklist (reduced-motion, contrast, focus, ARIA) and tool calls to `get_accessibility_considerations` |

### 6.1 Prompt template design — see ADR-003

Prompts return **structured briefs that name the tools to call**, not raw CSS. This keeps the prompt deterministic and testable, and lets the AI's model do the actual code generation (which is its strength). The prompt is a "recipe for a conversation", not a "recipe for code".

---

## 7. Error handling

See ADR-004 for the full format. Summary:

- **User-facing errors** (bad args, not found): return `isError: true` + a `content` array with one `{ type: "text" }` containing a JSON string `{ error: { code, message, details? } }`.
- **Server errors** (unexpected exception): same shape, `code: "INTERNAL_ERROR"`, plus the exception message in `details`. Logged to stderr with a stack trace.
- **Protocol errors** (malformed JSON-RPC): handled by the SDK; we don't customise.

Error codes (string enum):

| Code | Meaning |
|------|---------|
| `NOT_FOUND` | Effect/pattern/recipe ID does not exist |
| `INVALID_ARGUMENT` | Required arg missing or wrong type |
| `INVALID_CLASS_NAME` | `validate_class_name` input was not a `roycss-*` class |
| `UNSUPPORTED_FRAMEWORK` | `get_framework_usage` got an unknown framework |
| `UNSUPPORTED_MANAGER` | `get_install` got an unknown package manager |
| `INTERNAL_ERROR` | Unexpected exception |

The `details` field carries actionable context (e.g., for `NOT_FOUND`, the top-5 fuzzy matches).

---

## 8. Data loading

At process startup the server loads:

1. `effects.json` (1,569 effects, 20 categories) — same multi-path probe as v1 (`./effects.json`, `../dist/effects.json`, `../../dist/effects.json`).
2. `patterns.json` (10 patterns + category meta) — new in v2, lives next to `effects.json`. Generated by extracting `src/lib/roycss-patterns.ts` at build time (see IMPLEMENTATION-PLAN.md step 4).
3. `BROWSER_FEATURES` — an 18-entry table of CSS features + browser support, embedded directly in `index.ts` (sourced from `compat/results/support-matrix.json`). Small enough (~3 KB) that a separate JSON file is overkill.
4. `A11Y_GUIDANCE` — prefers-reduced-motion guarantees + contrast + focus rules, embedded in `index.ts` (sourced from `a11y/results/reduced-motion.json` + `a11y/results/contrast.json`).

If `effects.json` fails to load, the server logs to stderr and continues with an empty catalog (so `tools/list` still works — clients can call `get_install` / `get_design_tokens` without the catalog). If `patterns.json` fails to load, the server falls back to an embedded copy of the 10 patterns (defensive — never blocks startup).

---

## 9. Concurrency & performance

- **No shared mutable state.** Every tool handler reads from the loaded `EFFECTS` / `PATTERNS` arrays. Bun's single-threaded event loop serialises JSON-RPC requests anyway, but the design is safe even under a future worker-pool transport.
- **Hot path is `search_effects`.** v1 already runs in O(n) over 1,569 effects with no index. v2 keeps that — 1,569 is small enough that a linear scan is ~0.5 ms. We do **not** add an inverted index in v2 (premature; would need a benchmark showing > 50 ms).
- **`get_patterns` / `get_pattern` / `validate_class_name`** are O(10) or O(n) with n=1,569 — sub-millisecond.
- **`suggest_for_intent`** is O(n) over effects + O(10) over patterns + O(12) over recipes — sub-millisecond.
- **`get_browser_support`** is O(18) over the feature table + a heuristic mapping per effect — sub-millisecond.

Memory footprint: `effects.json` is ~120 KB parsed; `patterns.json` is ~5 KB; embedded tables are ~8 KB. Total resident < 60 MB (Bun runtime included).

---

## 10. Versioning & backwards compatibility

- Server `version: "2.0.0"` (was `"1.0.0"`).
- All 7 v1 tools keep their names, input schemas, and response shapes. A client written against v1 keeps working against v2 — no breaking changes.
- 6 new tools are purely additive.
- 5 new resources and 3 new prompts are purely additive.
- The `capabilities` object adds `resources` and `prompts` — clients that don't support them simply ignore the keys.

If a future v3 needs to break a tool's response shape, the plan is: ship a new tool (`get_effect_v2`), deprecate the old one in the description (`"Deprecated: use get_effect_v2"`), remove it in v4. Never mutate a shipped tool's schema in place.

---

## 11. File layout

```
mcp-server/
├── index.ts          # v2 server (13 tools, 5 resources, 3 prompts)
├── effects.json      # 1,569 effects metadata
├── patterns.json     # 10 UI patterns (NEW in v2)
├── package.json      # version 2.0.0
└── README.md         # v2 docs
```

`patterns.json` is generated by running `scripts/extract-patterns.ts` (a build-time script — see IMPLEMENTATION-PLAN.md). In v2 we ship the pre-generated file alongside `effects.json`; the extraction script is documented but not run as part of the MCP server's own startup (it would couple the MCP server to the RoyCSS source tree, violating the "MCP server is a standalone artifact" boundary enforced by the root `eslint.config.mjs` ignore list at line 65).
