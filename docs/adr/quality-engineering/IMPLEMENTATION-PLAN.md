# Quality Engineering — Implementation Plan

> Step-by-step plan for shipping the RoyCSS test suite. Each step is sized to
> a single commit. Order matters: later steps depend on earlier ones.

## Phase 0 — Pre-flight (done)

- [x] Confirm `bun` 1.3.x available in sandbox.
- [x] Install `vitest@4` + `@vitest/coverage-v8` + `@playwright/test` via `bun add -d`.
- [x] Install chromium for Playwright via `bunx playwright install chromium`.
- [x] Read `src/lib/roycss-{types,effects,recipes,patterns,design-tokens,framework-adapters}.ts` to understand the public API under test.

## Phase 1 — Design docs (done)

- [x] `docs/adr/quality-engineering/DESIGN.md`
- [x] `docs/adr/quality-engineering/ADR.md` (5 ADRs)
- [x] `docs/adr/quality-engineering/IMPLEMENTATION-PLAN.md` (this file)
- [x] `docs/adr/quality-engineering/REVIEW-CHECKLIST.md`

## Phase 2 — Configs

1. Create `/vitest.config.ts`:
   - `environment: "node"`
   - `include: ["tests/unit/**/*.test.ts"]`
   - `coverage.provider: "v8"`, `reportsDirectory: "tests/coverage"`, `reporter: ["text","html","json"]`
   - `coverage.thresholds.lines/functions/branches/statements: 70` for `src/lib/**`
   - `coverage.exclude` for `dist/`, `tests/`, `node_modules/`, `**/*.d.ts`, source `index.ts` re-exports
   - `alias: { "@": resolve(__dirname, "src") }`
2. Create `/playwright.config.ts`:
   - `testDir: "./tests/e2e"`
   - `baseURL: "http://localhost:3000"`
   - `projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }]`
   - `retries: 1`, `workers: 1` (dev server is single-instance)
   - `webServer` auto-starts `bun run dev` only if `PLAYWRIGHT_NO_SERVER` env is unset
   - `reporter: [["list"], ["html", { open: "never" }]]`

## Phase 3 — Unit tests (`tests/unit/`)

Each file is self-contained — no shared `setup.ts`. Order of creation:

1. `effects.test.ts` — invariants on the 1,569-effect corpus:
   - total count is exactly `1569`
   - ids are unique
   - keyframe names (`@keyframes roy-…`) are unique across the corpus
   - every `category` ∈ `EffectCategory`
   - every `previewType` ∈ `PreviewType`
   - every `cssCode` is non-empty and starts with `/* … */` or `.roycss-`
   - every `cssCode` contains the literal string `.roycss-<id>`
2. `categories.test.ts` — `categoryOrder.length === 20`, every `categoryMeta` key ∈ `categoryOrder`, every effect's category ∈ `categoryOrder`.
3. `recipes.test.ts` — 12 recipes, every `effectId` resolves in `effects`, `searchRecipes` filters by name / description / tags / category and by category arg.
4. `patterns.test.ts` — 10 patterns, every `effectId` resolves, `searchPatterns` filters by query and by category.
5. `design-tokens.test.ts` — 12 token categories, every color token matches `oklch(...)`, no hex colors anywhere, shadow tokens use `color-mix(in oklch, …)`, `generateCSSVariables()` produces a `:root { … }` block with every token, `generateJSONTokens()` and `generateTailwindConfig()` return non-empty objects.
6. `framework-adapters.test.ts` — `getFrameworkExamples()` returns exactly 6 examples, every framework has non-empty `install` / `import` / `usage`, every `usage` snippet contains `roycss-<effectId>`.

## Phase 4 — E2E tests (`tests/e2e/`)

Each spec owns one section of the page. Use resilient selectors: `getByRole`, `getByLabel`, `getByText` — never raw CSS classes.

1. `home.spec.ts` — load, title contains "RoyCSS", hero `<h1>` visible, primary `<nav>` visible, footer visible.
2. `effects-grid.spec.ts` — grid renders ≥ 1 card; clicking a category pill filters the visible count; typing into the search box filters cards; clicking a card opens the detail dialog with the effect name + CSS code.
3. `search-overlay.spec.ts` — ⌘K opens overlay, typing filters the result list, Escape closes the overlay.
4. `recipes.spec.ts` — recipes section renders 12 cards, clicking a card expands the HTML `<pre>`, "Copy HTML" button triggers clipboard write.
5. `patterns.spec.ts` — patterns section renders 10 cards, clicking a card expands the HTML block.
6. `playground.spec.ts` — playground button opens the side panel, "Generated CSS" `<pre>` is present and non-empty, "Copy CSS" button works.
7. `navigation.spec.ts` — every primary-nav button scrolls its target section into view (assert `boundingClientRect.top ≥ 0`); on a mobile viewport the hamburger menu opens and lists 6 sections.
8. `theme-toggle.spec.ts` — clicking the toggle flips `<html class="dark">` (or `data-theme`), and a second click restores the original state.
9. `contact-form.spec.ts` — opening the form (mobile menu → Contact), submitting with empty fields surfaces a validation error; submitting valid data with `page.route("**/api/contact", …)` mocked to `{ ok: true }` shows the success state.
10. `footer.spec.ts` — footer is visible, sponsor + GitHub links have correct `href` and `target="_blank"`.

## Phase 5 — Run, validate, report

1. `bunx vitest run --coverage` — capture pass/fail counts + coverage %.
2. `bun run lint` — must be 0 errors.
3. `bunx playwright test` (only if a dev server is reachable; otherwise validate specs by `bunx tsc --noEmit -p tsconfig.json` on the e2e dir).
4. Write `tests/REPORT.md` with:
   - unit: total / passed / failed / coverage per-file
   - e2e: total / passed / failed / skipped
   - lint result
   - known issues / follow-ups

## Phase 6 — Follow-ups (out of scope this pass)

- Wire `quality.yml` GitHub Actions workflow (sketched in DESIGN.md § 8).
- Add `@testing-library/react` integration tier once jsdom polyfills for `IntersectionObserver` / `oklch()` are in place.
- Add `webkit` project to Playwright config once CI matrix budget is approved.
- Add visual regression with `@playwright/test` snapshot comparisons for hero, effects grid, recipes, footer.
- Add a flake-rate budget and auto-quarantine workflow for flaky E2E tests.

## Risk register

| Risk                                | Likelihood | Impact | Mitigation                                                  |
| ----------------------------------- | ---------- | ------ | ----------------------------------------------------------- |
| Dev server flakiness in E2E         | Medium     | High   | `webServer.timeout: 60_000`, 1 retry, single worker.        |
| Coverage drops when batches expand  | Low        | Medium | Count assertions fail loudly; PR must update both.          |
| Playwright chromium unavailable in CI | Low      | High   | `bunx playwright install --with-deps` in CI; fallback to `tsc --noEmit` validation. |
| `color-mix` / `oklch` parse in node  | None       | N/A    | We assert on string shape, not computed color.              |
