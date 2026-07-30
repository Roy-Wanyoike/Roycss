# RoyCSS Quality Engineering — Test Strategy

> Owner: Quality Engineering agent · Status: Active · Last updated: 2025

## 1. Mission

Establish a comprehensive, automated test suite for RoyCSS that:

1. Guarantees the integrity of the 1,569-effect data corpus (every effect is unique, valid, and emits a usable CSS class).
2. Locks the public API of `src/lib/` against regressions.
3. Covers every golden-path user flow on the marketing site (browse → filter → search → detail → copy → recipes → patterns → playground → contact).
4. Runs in CI on every PR in under 5 minutes (unit) and every merge to `main` in under 15 minutes (unit + E2E).

## 2. Test Pyramid

```
            ┌──────────┐
            │   E2E    │  Playwright · 10 specs · golden-path only
            │  ~30 tcs │  ~3-5 min on chromium
            └──────────┘
          ┌──────────────┐
          │ Integration  │  (future) component tests with @testing-library/react
          │   ~50 tcs    │  deferred until jsdom env is wired
          └──────────────┘
        ┌────────────────────┐
        │      Unit          │  Vitest · 6 spec files · pure-TS, no DOM
        │     ~120 tcs       │  < 3 s wall-clock
        └────────────────────┘
```

The pyramid is intentionally **bottom-heavy**: RoyCSS's value lives in its data corpus (`src/lib/*.ts`), so the bulk of coverage lives at the unit tier where tests are fast, deterministic, and grep-able. E2E tests are reserved for flows that cross component boundaries and prove the user-visible contract.

## 3. Coverage Targets

| Surface                | Tool          | Target                                | Rationale                                                    |
| ---------------------- | ------------- | ------------------------------------- | ------------------------------------------------------------ |
| `src/lib/*.ts`         | Vitest + v8   | **≥ 70 %** lines / branches           | Mandated by task brief; protects the data + helper layer.    |
| `src/lib/roycss-types.ts` | Vitest     | **100 %**                             | Type + constant module; trivial to fully cover; non-negotiable. |
| `src/components/**`    | (deferred)    | N/A this pass                         | Will be covered when component-testing tier is added.        |
| E2E golden paths       | Playwright    | 10 specs, all green on `bun run dev`  | Each spec maps 1:1 to a section in `roycss-page.tsx`.        |

Thresholds are enforced in `vitest.config.ts` via `coverage.thresholds`. A build that drops below fails CI.

## 4. Test Naming Convention

- File: `<module-name>.test.ts` (unit) or `<feature>.spec.ts` (E2E).
- Test case (`it` / `test`): lowercase sentence, behavior-first.
  - ✅ `it("rejects two effects that share the same id")`
  - ❌ `it("test duplicates")`
- Describe blocks mirror the module surface, not the file name:
  - ✅ `describe("searchRecipes", () => { … })`
  - ❌ `describe("roycss-recipes.ts", () => { … })`

## 5. Fixtures & Data Strategy

RoyCSS's "fixture" is the live `effects` array. We import the real module — no JSON snapshots — so the tests catch data regressions the moment a batch file changes.

| Fixture                | Source                                   | Used by                          |
| ---------------------- | ---------------------------------------- | -------------------------------- |
| `effects`              | `src/lib/roycss-effects.ts`              | `effects.test.ts`, `recipes.test.ts`, `patterns.test.ts`, `categories.test.ts` |
| `recipes`              | `src/lib/roycss-recipes.ts`              | `recipes.test.ts`                |
| `patterns`             | `src/lib/roycss-patterns.ts`             | `patterns.test.ts`               |
| `designTokens`         | `src/lib/design-tokens.ts`               | `design-tokens.test.ts`          |
| `frameworkExamples`    | `src/lib/framework-adapters.ts`          | `framework-adapters.test.ts`     |
| `categoryMeta`/Order   | `src/lib/roycss-types.ts`                | `categories.test.ts`             |

No fixture JSON is checked in. Snapshot tests are **prohibited** for data — they hide drift. The single acceptable snapshot target is the Playwright visual-diff baseline (not used in this pass).

## 6. Mocking Strategy

- **Unit tests:** zero mocks. We test the real exports. If a test requires a mock, the unit is too tightly coupled — refactor instead.
- **E2E tests:** the only "mock" is `page.route("**/api/contact", …)` in `contact-form.spec.ts` so the suite does not depend on a live database. Every other interaction exercises the real Next.js dev server on `:3000`.
- **Time / random:** RoyCSS has no `Date.now()` or `Math.random()` in the modules under test, so no fake-timers are required.

## 7. Test Tier Definitions

### 7.1 Unit (Vitest)

- **What:** pure-TypeScript modules in `src/lib/`.
- **Where:** `tests/unit/*.test.ts`.
- **Environment:** `node` (no DOM).
- **Speed budget:** full suite < 3 s.
- **Assertions:** custom predicates for CSS-shape invariants; standard `expect` for the rest.

### 7.2 Integration (deferred)

- **What:** React components rendered with `@testing-library/react` + jsdom.
- **Why deferred:** jsdom does not implement `IntersectionObserver`, `ResizeObserver`, or CSS `oklch()`; the roycss-page uses all three. The cost of polyfilling outweighs the value until we adopt a component-isolation pattern. Track in `IMPLEMENTATION-PLAN.md` § 5.

### 7.3 E2E (Playwright)

- **What:** full browser-driven flows against `http://localhost:3000`.
- **Where:** `tests/e2e/*.spec.ts`.
- **Browsers:** chromium-only (per ADR-004). Webkit + Firefox to follow once CI matrix budget allows.
- **Retry policy:** 1 retry on failure, 0 in `--for-only` mode.
- **Speed budget:** < 5 min total on a warm cache.

## 8. CI Integration Sketch

```
# .github/workflows/quality.yml (sketch — not wired in this pass)
jobs:
  unit:
    runs-on: ubuntu-latest
    steps: [setup-bun, bun install, bunx vitest run --coverage]
  e2e:
    runs-on: ubuntu-latest
    steps:
      - setup-bun
      - bun install
      - bun run build          # production build for E2E
      - bunx playwright install --with-deps chromium
      - bunx playwright test
```

Coverage report is published as a CI artifact; the `tests/REPORT.md` file in-repo captures the current snapshot.

## 9. What We Explicitly Do NOT Test

- Third-party libraries (Radix, Framer Motion, cmdk) — trust upstream.
- Visual pixel diffs — deferred to a future Lighthouse / Percy tier.
- Cross-browser matrix beyond chromium — cost > value until traffic justifies it.
- Performance benchmarks — owned by the `performance/` agent.
- Accessibility audits — owned by the `a11y/` agent (we only assert the minimum a11y contract inside E2E specs: presence of `aria-label`s, keyboard reachability of the search overlay).

## 10. Maintenance Policy

- Any PR that adds an effect **must** keep `effects.test.ts` green. If the total count assertion fails, update the count in the same PR — the test is the change-detector.
- Any PR that adds a recipe / pattern **must** keep `recipes.test.ts` / `patterns.test.ts` green.
- Any PR that adds a new `EffectCategory` value **must** update `categories.test.ts` and the `categoryOrder` length assertion.
