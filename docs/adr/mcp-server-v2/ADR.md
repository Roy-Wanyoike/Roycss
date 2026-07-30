# RoyCSS MCP Server v2 — Architecture Decision Records

**Status:** Accepted
**Last updated:** 2026-07-31

Four ADRs governing the v2 server. Each follows the Nygard format: Context → Decision → Consequences.

---

## ADR-001: Tool granularity — separate `get_pattern` from `get_effect`

**Date:** 2026-07-31
**Status:** Accepted

### Context

v1 ships 7 tools covering effects, categories, install, framework usage, tokens, and recipes. v2 adds patterns (10 UI compositions built from effects) and four more capability surfaces (validate, suggest, a11y, browser support).

The question: do we add a single polymorphic `get_entity(type, id)` tool, or one tool per entity type?

A single tool is tempting — fewer entries in `tools/list`, less client-side dispatch code. But:

1. **AI clients pick tools by reading the `description` field in `tools/list`.** A merged `get_entity` description must enumerate every entity type and every response shape. Longer descriptions dilute the signal and hurt tool-selection accuracy (Claude's tool-use benchmarks show selection accuracy drops when descriptions exceed ~2 sentences).
2. **Input schemas diverge.** `get_effect` takes `{ id }`; `get_pattern` takes `{ id }`; `validate_class_name` takes `{ class }`; `suggest_for_intent` takes `{ intent }`; `get_browser_support` takes `{ effect_id }`. Merging them into one schema means a `oneOf` with discriminator — harder for clients to render, harder for the AI to fill.
3. **Response shapes diverge.** An effect has `cssCode`, `previewType`, `childCount`. A pattern has `html`, `effectIds`, `whenToUse`. A recipe has `effects: [...]`. A merged tool would return `oneOf` response shapes, which the AI then has to switch on.
4. **MCP convention.** Every mature MCP server we surveyed (filesystem, github, brave-search, sqlite) uses one tool per entity type. Following convention helps clients that auto-generate tool wrappers.

### Decision

One tool per entity type. v2 ships 13 tools (7 v1 + 6 new). Each tool has a single-sentence description, a flat input schema, and a single response shape.

### Consequences

- **+** Tool descriptions stay short and AI-tool-selection stays accurate.
- **+** Each tool is independently testable (one input schema → one response shape).
- **+** Client-side wrappers are trivial to auto-generate.
- **−** `tools/list` returns 13 entries instead of ~7. Acceptable — the MCP spec has no soft cap, and 13 is well within the cognitive budget of every client UI we've seen.
- **−** Adding a new entity type requires a new tool (not just a new value in a `type` enum). This is a feature, not a bug: it forces an explicit ADR per new capability.

---

## ADR-002: Resource vs tool — `roycss://effects` is a resource, `search_effects` is a tool

**Date:** 2026-07-31
**Status:** Accepted

### Context

MCP exposes two read primitives: **resources** (URI-addressable, static, client-attachable as context) and **tools** (active, parameterised, server-executed). Both can return the same data. Where do we draw the line for RoyCSS?

The v1 server only had tools. v2 adds resources. We considered three placements:

- **Option A — everything is a tool.** No resources. The AI calls `search_effects("pulse-glow")` every time it needs an effect. Familiar, but the AI pays a round-trip per question and never builds up a local index.
- **Option B — everything is a resource.** No tools. The AI reads `roycss://effects?query=pulse-glow`. But MCP resources are not parameterised queries — they're addressable blobs. Filtering would have to happen client-side after a full read.
- **Option C — split by cardinality + mutability.** Small static collections become resources; filtered/projected views become tools.

### Decision

Option C. The split:

| Data | Resource? | Tool? | Why |
|------|-----------|-------|-----|
| All effect IDs + names (1,569 × ~80 bytes = ~120 KB) | ✅ `roycss://effects` | — | Small, static, useful as pre-attached context |
| One effect by ID | ✅ `roycss://effects/{id}` (template) | ✅ `get_effect` | Both: client may read by URI template OR call the tool for the richer response (includes `usage`, fuzzy-match-on-miss) |
| Categories | ✅ `roycss://categories` | ✅ `list_categories` | Small + static = resource; tool exists for symmetry with v1 |
| Patterns | ✅ `roycss://patterns` | ✅ `get_patterns` + `get_pattern` | Small (10) + static = resource; tools exist for parameterised access (single pattern by ID) |
| Recipes | ✅ `roycss://recipes` | ✅ `get_recipes` | Same logic |
| Search results | — | ✅ `search_effects` | Parameterised, filtered, limited — not addressable |
| Framework usage | — | ✅ `get_framework_usage` | Generated from args |
| Install instructions | — | ✅ `get_install` | Generated from args |
| Design tokens | — | ✅ `get_design_tokens` | Could be a resource, but tokens are rare to need as full context — tool is enough |
| Validate / suggest / a11y / browser support | — | ✅ each | All parameterised, computed |

**Rule of thumb:** if it's a small static collection the client benefits from pre-loading, it's a resource. If it's a filtered/computed view, it's a tool. Some data is both.

### Consequences

- **+** Clients that support resource auto-attach (Claude Desktop, Cursor) get the full effect catalog in context without N tool calls.
- **+** Clients that don't support resources still work — the tools cover every use case.
- **+** `roycss://effects/{id}` template lets a client deep-link an effect in a chat message (URI is clickable in some clients).
- **−** Two ways to read an effect (`get_effect` tool vs `roycss://effects/{id}` resource) means two response shapes to maintain. The resource returns the raw effect object; the tool returns the same object plus a `usage` hint and a fuzzy-match-on-miss fallback. Documented in the resource's `description` field.
- **−** `roycss://patterns/{id}` is deliberately **not** a template — only 10 patterns, so the client reads `roycss://patterns` once and indexes locally. Asymmetry is documented in DESIGN.md §5.2.

---

## ADR-003: Prompts return structured briefs that name tools, not raw code

**Date:** 2026-07-31
**Status:** Accepted

### Context

MCP prompts are reusable message templates the client can invoke by name. Three prompts ship in v2: `design-a-landing-page`, `build-a-loading-state`, `accessibility-audit`.

The question: should a prompt return **finished RoyCSS code** (e.g., a complete landing-page HTML), or a **structured brief** that tells the AI which tools to call and what to consider?

Finished-code prompts are tempting — the AI gets a one-shot answer. But:

1. **Prompts are static templates.** A landing-page prompt that returns finished HTML must hard-code the effect IDs. If the catalog changes (effect renamed, removed), the prompt ships stale code. Briefs that name tools delegate the freshness problem to the tool layer, which always reads live data.
2. **AI models are better at code generation than at picking from a fixed menu.** A brief that says "call `search_effects('hero')` then `get_pattern('pattern-master-detail')` then `get_accessibility_considerations`" lets the model pick the actual effects based on the user's `audience`/`vibe` args. A finished-code prompt ignores those args.
3. **Testability.** A brief is a deterministic string. Finished code requires asserting on HTML structure (brittle).
4. **Composability.** A brief that names tools works in every client, even those without prompt support — the user can read the brief and call the tools manually.

### Decision

Prompts return **structured briefs** (a user-role message containing: a one-paragraph framing, a numbered list of tools to call with example args, and a checklist of considerations). The brief may also include an assistant-role hint that the AI is expected to follow.

Example (`build-a-loading-state`, `wait_duration: "long"`, `content_type: "detail"`):

```
USER:
You are building a RoyCSS loading state for a detail view with a long wait duration.

Call these tools in order:
1. get_pattern({ id: "pattern-skeleton-state" }) — get the skeleton loading pattern
2. search_effects({ query: "skeleton", category: "loaders" }) — find skeleton effects
3. get_accessibility_considerations({}) — get reduced-motion + contrast guidance

Considerations:
- Long waits (>800 ms): prefer skeleton over spinner
- Detail view: skeleton should mimic the content layout
- Always include prefers-reduced-motion fallback
```

### Consequences

- **+** Prompts stay fresh — they reference tools, not hardcoded effect IDs.
- **+** Args (`audience`, `vibe`, `wait_duration`) actually shape the output — the brief changes based on inputs.
- **+** Briefs are deterministic strings → easy to snapshot-test.
- **+** Works in clients without prompt support (user reads the brief and calls tools manually).
- **−** One extra round-trip per prompt invocation (the AI must call the named tools). Acceptable — the tools are sub-millisecond and the AI's code-generation latency dominates anyway.
- **−** The brief is only as good as its tool names. If a tool is renamed, the brief breaks. Mitigated by ADR-001's "never rename a shipped tool" rule.

---

## ADR-004: Structured error format — `{ error: { code, message, details? } }`

**Date:** 2026-07-31
**Status:** Accepted

### Context

v1 returns errors as ad-hoc strings:

- `get_effect` with missing id → `"Error: 'id' parameter is required."` + `isError: true`
- `get_effect` with unknown id → `"Effect \"foo\" not found. Use search_effects to find the right ID."` + `isError: true`
- Catch-all → `"Error: <exception message>"` + `isError: true`

The AI has to parse these strings to recover. There's no machine-readable code, no structured `details` for follow-up actions, no consistency between tools.

### Decision

Every error response is a single `content` item of `{ type: "text" }` whose `text` is a JSON string with this shape:

```jsonc
{
  "error": {
    "code": "NOT_FOUND",                 // string enum, see DESIGN.md §7
    "message": "Effect 'foo' not found.",// human-readable
    "details": {                          // optional, structured, actionable
      "type": "effect",
      "requestedId": "foo",
      "suggestions": [
        { "id": "btn-shine-sweep", "name": "Shine Sweep", "score": 0.71 },
        ...
      ]
    }
  }
}
```

`isError: true` is set on the response envelope (MCP's standard signal). The JSON-in-text is for the AI to parse.

Six error codes (string enum, see DESIGN.md §7): `NOT_FOUND`, `INVALID_ARGUMENT`, `INVALID_CLASS_NAME`, `UNSUPPORTED_FRAMEWORK`, `UNSUPPORTED_MANAGER`, `INTERNAL_ERROR`.

### Consequences

- **+** AI can branch on `code` without regex-parsing the message.
- **+** `details.suggestions` lets the AI auto-recover from a typo (`validate_class_name("roycss-puls-glo")` → suggestions include `roycss-pulse-glow`).
- **+** Consistent shape across all 13 tools — one parser, one mental model.
- **−** Slightly more bytes on the wire (JSON-wrapped vs plain string). Negligible — errors are < 1 KB.
- **−** Clients that display error text verbatim will show raw JSON to the user. Mitigated by the `message` field being human-readable; clients that parse JSON get the structured view, clients that don't still get a readable string in `message`. (Most MCP clients — Claude Desktop, Cursor — already parse tool-result text as markdown/JSON heuristically.)

---

## ADR-005: `patterns.json` is a shipped artifact, not imported from `src/`

**Date:** 2026-07-31
**Status:** Accepted

### Context

The 10 UI patterns live in `src/lib/roycss-patterns.ts` as a TypeScript module exporting a `Pattern[]` array. The MCP server needs the same data. Three options:

1. **Import directly:** `import { patterns } from "../src/lib/roycss-patterns"`. Couples the MCP server to the RoyCSS source tree. Breaks the "MCP server is a standalone artifact" boundary (root `eslint.config.mjs` line 65 explicitly ignores `mcp-server/**` to enforce this).
2. **Re-key by hand in `index.ts`.** Duplicates the data. Drifts when `src/` changes.
3. **Extract at build time into `patterns.json` and ship the JSON.** Single source of truth in `src/`, single shipped artifact in `mcp-server/`. The extraction is a one-time copy (the patterns are stable).

### Decision

Option 3. `patterns.json` lives in `mcp-server/` next to `effects.json`. It is generated by extracting `src/lib/roycss-patterns.ts` (the `patterns` array + `patternCategoryMeta` + `patternCategoryOrder`). The extraction is documented in IMPLEMENTATION-PLAN.md step 4 but is **not** wired into the MCP server's own startup — the server reads the shipped JSON.

The v2 server also embeds a defensive copy of the 10 patterns directly in `index.ts` as `FALLBACK_PATTERNS`. If `patterns.json` fails to load (corrupt, missing, wrong shape), the server logs to stderr and uses the fallback. This guarantees `get_patterns` always returns 10 patterns.

### Consequences

- **+** MCP server stays a standalone artifact — no `src/` import, no TypeScript project-reference, no build-time coupling.
- **+** Server is robust to a missing/corrupt `patterns.json` (fallback).
- **−** Two copies of the pattern data (`src/lib/roycss-patterns.ts` + `mcp-server/patterns.json`). Mitigated by: the patterns are stable (last edit was the initial commit), and a sync script can re-extract if they change. The IMPLEMENTATION-PLAN documents the extraction command.
- **−** If `src/` patterns change and nobody re-runs the extraction, the MCP server ships stale patterns. Acceptable risk: the patterns are a curated set of 10, not a generated catalog of 1,569. Changes will be rare and reviewed.
