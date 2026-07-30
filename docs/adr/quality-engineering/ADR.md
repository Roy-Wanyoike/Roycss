# Quality Engineering — Architecture Decision Records

> Five decisions that shape the RoyCSS test suite. Each ADR follows the
> Nygard format: Context · Decision · Consequences · Alternatives.

---

## ADR-001 — Use Vitest (not Jest) as the unit-test runner

**Date:** 2025 · **Status:** Accepted

### Context

RoyCSS already ships on Bun and Next.js 16. The unit-test runner needs to (a) understand ESM + TypeScript path aliases (`@/*`), (b) produce V8 coverage suitable for the threshold gate, and (c) start in under 500 ms so the inner dev loop stays tight. Jest is the historical default but its ESM story is still brittle, its startup is ~1.5 s on this codebase, and its coverage instrumentation conflicts with Bun's module loader.

### Decision

Adopt **Vitest 4.x** with `@vitest/coverage-v8`.

### Consequences

- ✅ Vitest reads `vite`/`tsconfig` path aliases natively; no `tsconfig-paths` shim.
- ✅ V8 coverage is faster and more accurate than istanbul for ESM.
- ✅ Watch mode is sub-second.
- ⚠️ Vitest 4 requires Node ≥ 20; CI runner must match.
- ⚠️ Snapshot formatting differs from Jest — any team migrating from Jest will need to re-baseline.

### Alternatives considered

- **Jest 30** — slower cold start, ESM mode still flagged experimental.
- **Bun's built-in `bun test`** — lacks coverage thresholds and per-file coverage gating; would force us to write a custom coverage wrapper.
- **Node's built-in `node:test`** — no coverage tooling out of the box.

---

## ADR-002 — Use Playwright (not Cypress) for E2E

**Date:** 2025 · **Status:** Accepted

### Context

The roycss page uses `IntersectionObserver`, `ResizeObserver`, `oklch()`, `color-mix()`, and `backdrop-filter` — modern features that demand a real browser engine. We need cross-tab parallelism, network interception for the contact form, and a single API for chromium / firefox / webkit.

### Decision

Adopt **Playwright 1.62+** with `@playwright/test`.

### Consequences

- ✅ Auto-waiting by default → fewer flaky selectors.
- ✅ `page.route()` mocks the contact endpoint without a separate mock server.
- ✅ Trace viewer replaces video artifacts for debugging.
- ⚠️ Larger install footprint than Cypress (~120 MB per browser).
- ⚠️ No real-time GUI comparable to Cypress's runner; team uses headed mode + `--debug`.

### Alternatives considered

- **Cypress 13** — single-browser by default, no native tabs, network stubbing limited to `cy.intercept` which is weaker than `page.route` for response shaping.
- **Selenium / WebDriverIO** — slower, more boilerplate, no built-in component-test story.
- **Puppeteer** — lower-level; we'd reinvent `@playwright/test`'s fixture and assertion layer.

---

## ADR-003 — Use V8 coverage (not Istanbul / babel-instrumented)

**Date:** 2025 · **Status:** Accepted

### Context

RoyCSS source is TypeScript compiled on-the-fly by Vitest's Vite pipeline. Istanbul instrumentation requires a transform step that rewrites every file, which (a) slows cold runs, (b) breaks source maps for some radix-ui re-exports, and (c) produces noticeably different line counts than production builds.

### Decision

Use **`@vitest/coverage-v8`** (native V8 inspector coverage) as the sole coverage provider.

### Consequences

- ✅ ~3× faster than istanbul on this codebase.
- ✅ Coverage maps exactly to the TypeScript source the user sees.
- ⚠️ V8 coverage ignores files that are never imported — uncovered files show as 0 %, not "missing". We mitigate by globbing `src/lib/**/*.ts` in the config so every file is counted.
- ⚠**Behavior** branches (e.g. `?.` chains) may show as partially covered when V8 reports them as executed — known limitation; acceptable for our 70 % target.

### Alternatives considered

- **`@vitest/coverage-istanbul`** — slower, transform-heavy, fights with ESM.
- **`c8`** — superseded by `@vitest/coverage-v8` for Vitest workflows.

---

## ADR-004 — Colocate config at repo root, keep test files under `tests/` (not `__tests__/`)

**Date:** 2025 · **Status:** Accepted

### Context

The repo already has 14 sibling workspaces (`inspector/`, `vscode-extension/`, `mcp-server/`, `cli/`, `performance/`, `security/`, `a11y/`, `compat/`, `perf/`, `examples/`, `docs/`, `scripts/`, `agent-ctx/`, `upload/`). Each ships its own tooling. We need a top-level test home that (a) doesn't pollute `src/`, (b) is unambiguous in `.gitignore` / CI globs, and (c) keeps configs (`vitest.config.ts`, `playwright.config.ts`) at the repo root where Vitest/Playwright auto-discover them.

### Decision

- Configs at **repo root**: `/vitest.config.ts`, `/playwright.config.ts`.
- Test files under **`/tests/unit/`** and **`/tests/e2e/`** — flat, no `__tests__/` mirrors.
- No colocated `*.test.ts` next to source. Source is read-only to the QE agent.

### Consequences

- ✅ One `tests/` glob for CI; one `.gitignore` entry for artifacts.
- ✅ The `src/` tree stays a pure library — editors don't mix tests and source in the same tree view.
- ⚠️ Jump-to-test is one keystroke further in editors that prefer colocated tests; mitigated by the convention `<module-name>.test.ts` so fuzzy-find works.
- ⚠️ QE agent cannot drop fixtures inside `src/` — we use `tests/unit/fixtures/` if fixtures become necessary (none needed in this pass).

### Alternatives considered

- **Colocated `src/lib/__tests__/effects.test.ts`** — closer to the source but conflicts with the task's "src/ is read-only" rule and entangles test files with the published npm package.
- **`qa/` directory** — non-idiomatic for the JS ecosystem; `tests/` is the Vitest default mental model.

---

## ADR-005 — CI integration via Bun, single chromium browser, 1 retry

**Date:** 2025 · **Status:** Accepted

### Context

CI minutes are the dominant cost of a test suite. RoyCSS's user base is 100 % chromium-class browsers (Chrome, Edge, Brave, Arc) per the analytics snapshot in the platform-ecosystem docs. Firefox / Safari share is < 2 %.

### Decision

- **CI runner:** Bun (matches local dev, fastest install).
- **E2E browser matrix:** chromium-only for the initial pass; webkit added when share justifies.
- **Retry policy:** 1 retry on E2E (covers transient dev-server startup races), 0 retries on unit (deterministic).
- **Coverage gating:** Vitest `coverage.thresholds` block merges below 70 %.

### Consequences

- ✅ E2E suite finishes in < 5 min on a single runner.
- ✅ Bun install is ~2× faster than npm.
- ⚠️ We will not catch webkit-specific CSS bugs (e.g. `backdrop-filter` quirks) until the matrix expands.
- ⚠️ A single flaky test costs ~30 s on every CI run due to the retry; we accept this trade-off until a flake-rate budget is exceeded.

### Alternatives considered

- **Cross-browser matrix from day 1** — triples CI time for < 2 % of users.
- **puppeteer-cluster** — reinvents Playwright's parallelism.
- **No retries** — dev-server cold start races would flake ~1 in 20 runs.
