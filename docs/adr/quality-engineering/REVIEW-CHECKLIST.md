# Quality Engineering — Review Checklist

> 15 items a reviewer must confirm before merging the RoyCSS test suite.
> Each item maps to a concrete artifact in the repo.

## Config & layout

1. **`/vitest.config.ts` exists** at repo root and is auto-discovered by `bunx vitest`.
2. **`/playwright.config.ts` exists** at repo root, sets `baseURL: "http://localhost:3000"`, and limits `projects` to chromium.
3. **`tests/unit/` and `tests/e2e/` are the only test directories**; no stray `*.test.ts` under `src/` or sibling workspaces.

## Unit-test integrity

4. **`effects.test.ts` asserts the exact total `1569`** — not a range, not `>= 1569`. Updates to the corpus must change the assertion.
5. **`effects.test.ts` asserts every `cssCode` contains the literal `.roycss-<id>`** — proves the class-name contract.
6. **`effects.test.ts` asserts keyframe names are globally unique** — prevents two batches from shipping the same `@keyframes roy-foo` symbol.
7. **`recipes.test.ts` and `patterns.test.ts` assert every `effectId` resolves** to a real effect — catches dangling references when batch files are renamed.
8. **`design-tokens.test.ts` rejects hex colors** via regex scan of the entire `designTokens` array — locks the OKLCH-first policy.
9. **`categories.test.ts` asserts `categoryOrder.length === 20`** — matches the `EffectCategory` union.

## Coverage

10. **`vitest.config.ts` enforces `coverage.thresholds` ≥ 70 %** for `src/lib/**` on lines, functions, branches, statements.
11. **`tests/REPORT.md` records the achieved coverage %** at the time of merge, with the exact command used to produce it.

## E2E integrity

12. **Every E2E spec uses role / label / text selectors** (`getByRole`, `getByLabel`, `getByText`) — no `page.$(".some-tailwind-class")` selectors that would break on a refactor.
13. **`contact-form.spec.ts` mocks `/api/contact`** via `page.route` so the suite is hermetic — no database dependency.
14. **Playwright `webServer` block** auto-starts `bun run dev` on port 3000 with a 60-second timeout, or skips when `PLAYWRIGHT_NO_SERVER` is set.

## Lint & CI

15. **`bun run lint` exits 0** at the tip of the QE branch; the suite introduces zero new ESLint violations.
