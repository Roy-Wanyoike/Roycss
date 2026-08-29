# RoyCSS MCP Server v2 — Implementation Plan

**Status:** In progress
**Last updated:** 2026-07-31
**Owner:** MCP Server v2 subagent

Step-by-step plan to take the server from v1 (7 tools, no resources/prompts) to v2 (13 tools, 5 resources, 3 prompts, structured errors). Each step is independently verifiable.

---

## Phase 0 — Baseline verification (DONE)

- [x] Read v1 `index.ts` (773 lines) — 7 tools, stdio transport, no resources, no prompts.
- [x] Read `effects.json` — 1,569 effects, 20 categories, **metadata only** (no `cssCode` field per effect; v1 `get_effect` returns `cssCode: undefined`).
- [x] Read `src/lib/roycss-patterns.ts` (175 lines) — 10 patterns with `id`, `name`, `category`, `description`, `whenToUse`, `html`, `effectIds`, `tags`. Plus `patternCategoryMeta` and `patternCategoryOrder`.
- [x] Read `compat/results/support-matrix.json` — 18 CSS features with browser support + per-feature `effectsUsing` counts. Real data to embed in `get_browser_support`.
- [x] Read `a11y/results/reduced-motion.json` — 4 prefers-reduced-motion guarantees, all passing. Real data to embed in `get_accessibility_considerations`.
- [x] Verified server runs: `echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | bun mcp-server/index.ts` returns 7 tools.
- [x] Verified MCP SDK v1.30.0 is installed at root `node_modules/@modelcontextprotocol/sdk` (the mcp-server has no own node_modules; Bun resolves up the tree).
- [x] Verified `mcp-server/**` is in the root `eslint.config.mjs` ignore list (line 65) — so root `bun run lint` does not lint the MCP server. Lint will pass as long as nothing outside the MCP server breaks.

---

## Phase 1 — Design docs (DONE)

- [x] Create `docs/adr/mcp-server-v2/` directory.
- [x] `DESIGN.md` — architecture, transport, capabilities, tool registry, resources, prompts, error handling, data loading, concurrency, versioning, file layout.
- [x] `ADR.md` — 5 ADRs (tool granularity, resource vs tool, prompt design, error format, patterns.json as shipped artifact).
- [x] `THREAT-MODEL.md` — STRIDE + prompt-injection analysis, 8 threats, 3 composite scenarios, monitoring, open questions.
- [x] `IMPLEMENTATION-PLAN.md` — this file.
- [ ] `REVIEW-CHECKLIST.md` — 15 review items (next).

---

## Phase 2 — Data extraction

### Step 2.1 — Create `mcp-server/patterns.json`

- [ ] Extract the 10 patterns from `src/lib/roycss-patterns.ts` into a JSON file at `mcp-server/patterns.json`.
- [ ] Schema: `{ "version": 1, "patternCategoryMeta": {...}, "patternCategoryOrder": [...], "patterns": [...] }`.
- [ ] Each pattern: `{ id, name, category, description, whenToUse, html, effectIds, tags }`.
- [ ] Verify the JSON parses and contains exactly 10 patterns.

### Step 2.2 — Embed fallback patterns in `index.ts`

- [ ] Copy the 10 patterns into a `FALLBACK_PATTERNS` constant in `index.ts`.
- [ ] Used only if `patterns.json` fails to load.

### Step 2.3 — Embed browser feature table in `index.ts`

- [ ] Define `BROWSER_FEATURES` constant — the 18 features from `compat/results/support-matrix.json`.
- [ ] Each entry: `{ feature, name, browsers: {chrome, firefox, safari, edge}, baseline2024 }`.

### Step 2.4 — Embed a11y guidance in `index.ts`

- [ ] Define `A11Y_GUIDANCE` constant — prefers-reduced-motion guarantees (4), contrast notes, focus-state requirements, ARIA rules.

### Step 2.5 — Embed intent keyword map in `index.ts`

- [ ] Define `INTENT_KEYWORDS` — maps intent phrases to {effects: [search queries], patterns: [ids], recipes: [ids]}.
- [ ] Examples: "draw attention" → effects:[pulse,glow,attention], patterns:[], recipes:[notification-pulse-badge]; "loading state" → effects:[loader,skeleton,spinner], patterns:[pattern-loading-state, pattern-skeleton-state], recipes:[loading-triple-spinner, loading-ring-pulse].

---

## Phase 3 — Rewrite `index.ts` to v2

### Step 3.1 — Header & imports

- [ ] Update header comment to list all 13 tools, 5 resources, 3 prompts.
- [ ] Add imports: `ListResourcesRequestSchema`, `ReadResourceRequestSchema`, `ListResourceTemplatesRequestSchema`, `ListPromptsRequestSchema`, `GetPromptRequestSchema` from the SDK types.
- [ ] Add `readFileSync` for `patterns.json` loading.

### Step 3.2 — Server declaration

- [ ] Bump `version` to `"2.0.0"`.
- [ ] Add `resources: { listChanged: false }` and `prompts: { listChanged: false }` to capabilities.

### Step 3.3 — Structured error helper

- [ ] Add `makeError(code, message, details?)` → returns `{ content: [{type:"text", text: JSON.stringify({error:{code,message,details}})}], isError: true }`.
- [ ] Replace all v1 ad-hoc error strings with `makeError` calls.

### Step 3.4 — Update v1 tools to use structured errors

- [ ] `get_effect` — missing id → `makeError("INVALID_ARGUMENT", ...)`. Unknown id → `makeError("NOT_FOUND", ..., {suggestions: [...]})`.
- [ ] `get_framework_usage` — unknown framework → `makeError("UNSUPPORTED_FRAMEWORK", ..., {supported: [...]})`.
- [ ] `get_install` — unknown manager → fall back to npm (v1 behavior) OR `makeError("UNSUPPORTED_MANAGER", ...)`. Decision: **fall back to npm** (v1 behavior, no breaking change) but include `{ note: "Unknown manager 'X', defaulting to npm" }` in the response.
- [ ] Catch-all → `makeError("INTERNAL_ERROR", ..., {stack: ...})`.

### Step 3.5 — Add new tools (definitions in ListTools handler)

- [ ] `get_patterns` — no args. Returns `{ totalPatterns, patterns: [{id, name, category, description, effectIds}] }`.
- [ ] `get_pattern` — `{ id }` required. Returns full pattern with `html`.
- [ ] `validate_class_name` — `{ class }` required. Strip `roycss-` prefix if present. If exact match → `{ valid: true, id, name, category }`. If not → `{ valid: false, suggestions: [{id, name, score}] }` (Levenshtein, top 5, score ≥ 0.5).
- [ ] `suggest_for_intent` — `{ intent }` required. Match intent against `INTENT_KEYWORDS`. Return `{ intent, matchedKeywords, effects: [...top 5], patterns: [...top 3], recipes: [...top 3] }`.
- [ ] `get_accessibility_considerations` — optional `{ effect_id }`. Return prefers-reduced-motion guidance, contrast notes, focus-state requirements, ARIA rules. If `effect_id` provided, add effect-specific notes (e.g., for `loader-*` → "spinners must have an aria-label or be hidden from screen readers").
- [ ] `get_browser_support` — `{ effect_id }` required. Infer features used (heuristic on category/tags/id), return per-feature browser support + summary.

### Step 3.6 — Add new tools (handlers in CallTool handler)

- [ ] One `case` per new tool, following the v1 pattern.
- [ ] Each handler uses `makeError` on bad input.

### Step 3.7 — Add resource handlers

- [ ] `ListResourcesRequestSchema` handler → returns the 4 static resources: `roycss://effects`, `roycss://categories`, `roycss://patterns`, `roycss://recipes`. Each with `name`, `description`, `mimeType: "application/json"`.
- [ ] `ListResourceTemplatesRequestSchema` handler → returns 1 template: `roycss://effects/{id}` with `name`, `description`, `mimeType`, `uriTemplate`.
- [ ] `ReadResourceRequestSchema` handler → switch on URI:
  - `roycss://effects` → all effect IDs + names + categories (compact).
  - `roycss://effects/<id>` → single effect detail (or `makeError`-style text if not found).
  - `roycss://categories` → 20 categories with counts.
  - `roycss://patterns` → 10 patterns (compact, no html).
  - `roycss://recipes` → 12 recipes (compact).
  - Unknown URI → return text "Resource not found: <uri>".

### Step 3.8 — Add prompt handlers

- [ ] `ListPromptsRequestSchema` handler → returns 3 prompts with `name`, `description`, `arguments` (each arg has `name`, `description`, `required`).
- [ ] `GetPromptRequestSchema` handler → switch on prompt name:
  - `design-a-landing-page` → returns `{ messages: [{ role: "user", content: { type: "text", text: <brief> } }] }` where brief references tools to call.
  - `build-a-loading-state` → same pattern, brief varies by `wait_duration` arg.
  - `accessibility-audit` → same pattern, brief includes audit checklist.
- [ ] Unknown prompt → return a user-role message saying "Unknown prompt: X. Available: ...".

### Step 3.9 — Update startup log

- [ ] Log: `[RoyCSS MCP] Server v2.0.0 running with N effects, M patterns, K recipes, L resources, P prompts`.

---

## Phase 4 — Update `README.md`

- [ ] Bump version mention to 2.0.0.
- [ ] Add the 6 new tools to the tools table + per-tool sections with example args + response shape.
- [ ] Add a "Resources" section listing the 5 resources with URIs and example reads.
- [ ] Add a "Prompts" section listing the 3 prompts with arguments and example output.
- [ ] Add an "Error format" subsection documenting the `{ error: { code, message, details } }` shape + the 6 codes.
- [ ] Add a "v1 → v2 migration" subsection noting that all v1 tools are unchanged.

---

## Phase 5 — Update `package.json`

- [ ] Bump `version` from `"1.0.0"` to `"2.0.0"`.
- [ ] No new dependencies (the MCP SDK already supports resources/prompts).

---

## Phase 6 — Testing & verification

### Step 6.1 — Lint

- [ ] `cd /home/z/my-project && bun run lint` → must exit 0, 0 errors, 0 warnings.
- [ ] (Note: `mcp-server/**` is in the eslint ignore list, so this only verifies we didn't break anything else. The MCP server itself is not linted by the root config.)

### Step 6.2 — Type check (optional, since mcp-server has no tsconfig)

- [ ] `cd /home/z/my-project/mcp-server && bun build index.ts --outdir /tmp/mcp-build --target node` → must succeed (catches syntax errors, bad imports).
- [ ] Clean up `/tmp/mcp-build`.

### Step 6.3 — Server smoke test

- [ ] `echo '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}},"id":1}' | bun mcp-server/index.ts` → returns initialize result with `capabilities: { tools, resources, prompts }`.

### Step 6.4 — tools/list

- [ ] `echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | bun mcp-server/index.ts` → returns 13 tools.
- [ ] Verify the 6 new tool names appear: `get_patterns`, `get_pattern`, `validate_class_name`, `suggest_for_intent`, `get_accessibility_considerations`, `get_browser_support`.

### Step 6.5 — resources/list

- [ ] Send `{"method":"resources/list","id":1}` → returns 4 static resources.
- [ ] Send `{"method":"resources/templates/list","id":1}` → returns 1 template (`roycss://effects/{id}`).

### Step 6.6 — prompts/list

- [ ] Send `{"method":"prompts/list","id":1}` → returns 3 prompts.

### Step 6.7 — Tool: `get_patterns`

- [ ] Call `get_patterns` → returns `totalPatterns: 10` and an array of 10 patterns.
- [ ] Verify each pattern has `id, name, category, description, effectIds`.

### Step 6.8 — Tool: `get_pattern`

- [ ] Call `get_pattern({id:"pattern-empty-state"})` → returns the pattern with `html`.
- [ ] Call `get_pattern({id:"nonexistent"})` → returns `NOT_FOUND` error with suggestions.

### Step 6.9 — Tool: `validate_class_name`

- [ ] Call `validate_class_name({class:"roycss-pulse-glow"})` → returns `{valid: true, id:"pulse-glow", name:"Pulse Glow", category:"animations"}`.
- [ ] Call `validate_class_name({class:"roycss-puls-glo"})` → returns `{valid: false, suggestions: [{id:"pulse-glow", ...}]}` with `pulse-glow` as the top suggestion.
- [ ] Call `validate_class_name({class:"pulse-glow"})` (no prefix) → server strips nothing, but the lookup should still find `pulse-glow` because we also try the input as-is. Verify behavior.

### Step 6.10 — Tool: `suggest_for_intent`

- [ ] Call `suggest_for_intent({intent:"loading state"})` → returns effects (loader-*), patterns (pattern-loading-state, pattern-skeleton-state), recipes (loading-triple-spinner, loading-ring-pulse).
- [ ] Call `suggest_for_intent({intent:"draw attention to a button"})` → returns effects (pulse-glow, btn-shine-sweep), patterns ([]), recipes (notification-pulse-badge or buttons-cta-group).

### Step 6.11 — Tool: `get_accessibility_considerations`

- [ ] Call with no args → returns general a11y guidance (4 sections).
- [ ] Call with `{effect_id:"loader-spinner"}` → adds loader-specific note.

### Step 6.12 — Tool: `get_browser_support`

- [ ] Call `get_browser_support({effect_id:"pulse-glow"})` → returns features used (oklch, color-mix at minimum), browser matrix, summary.
- [ ] Call `get_browser_support({effect_id:"nonexistent"})` → returns NOT_FOUND error.

### Step 6.13 — Resource: `roycss://effects`

- [ ] Call `resources/read` with `roycss://effects` → returns 1,569 effects (compact).
- [ ] Call `resources/read` with `roycss://effects/pulse-glow` → returns the effect detail.

### Step 6.14 — Prompt: `build-a-loading-state`

- [ ] Call `prompts/get` with `name:"build-a-loading-state"`, `arguments:{wait_duration:"long", content_type:"detail"}` → returns a user-role message that mentions `pattern-skeleton-state`.

### Step 6.15 — Regression: v1 tools still work

- [ ] Call `search_effects({query:"glow"})` → returns effects.
- [ ] Call `get_effect({id:"pulse-glow"})` → returns effect detail.
- [ ] Call `list_categories` → returns 20 categories.
- [ ] Call `get_recipes({})` → returns 12 recipes.
- [ ] Call `get_install({manager:"pnpm"})` → returns pnpm install command.
- [ ] Call `get_framework_usage({framework:"react", effect_id:"pulse-glow"})` → returns React example.
- [ ] Call `get_design_tokens` → returns tokens.

---

## Phase 7 — Documentation & worklog

- [ ] Verify all 5 design docs are in `docs/adr/mcp-server-v2/`.
- [ ] Verify `README.md` updated.
- [ ] Verify `package.json` version is `2.0.0`.
- [ ] Append worklog entry to `/home/z/my-project/worklog.md` with `---` delimiter, Task ID, Agent, Task, Work Log, Stage Summary.
- [ ] Final report to the main agent: design docs paths, tools added, resources exposed, prompts added, test results, lint result, issues.

---

## Definition of Done

- [ ] 5 design docs exist in `docs/adr/mcp-server-v2/`.
- [ ] `mcp-server/index.ts` is v2 (13 tools, 5 resources, 3 prompts, structured errors).
- [ ] `mcp-server/patterns.json` exists with 10 patterns.
- [ ] `mcp-server/README.md` is v2.
- [ ] `mcp-server/package.json` version is `2.0.0`.
- [ ] `bun run lint` exits 0.
- [ ] `tools/list` returns 13 tools including the 6 new ones.
- [ ] `get_patterns` returns 10 patterns.
- [ ] `validate_class_name("roycss-pulse-glow")` returns valid; `validate_class_name("roycss-puls-glo")` suggests `pulse-glow`.
- [ ] `suggest_for_intent({intent:"loading state"})` returns loader effects + loading patterns + loading recipes.
- [ ] Worklog entry appended.
