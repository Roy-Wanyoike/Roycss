import { defineConfig } from "vitest/config";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Vitest configuration for the RoyCSS backend integration suite.
 *
 * Design choices:
 *   - `globalSetup` — runs `tests/integration/setup.ts` ONCE before any
 *     test executes (and in a separate Node process, decoupled from the
 *     test worker). That file calls `bunx prisma db push --skip-generate`
 *     against `file:./test.db` and then `deleteMany({})` on every table
 *     in FK-safe order, giving each test run a clean slate. Using
 *     `globalSetup` (not `setupFiles`) is the difference between "runs
 *     once per suite" and "runs once per test file" — only the former
 *     is correct here because wiping the DB is expensive and
 *     cross-test-file state should be a single shared fact.
 *   - `fileParallelism: false` + `isolate: false` — run all test files
 *     in a single worker without per-file module isolation. This is
 *     needed so the PrismaClient singleton (created in `src/lib/db.ts`
 *     and stashed on `globalThis`) is shared between tests in different
 *     files. Without this, each test file would re-import the modules
 *     and end up with three separate PrismaClient instances racing on
 *     the same SQLite file — Prisma can handle it but it's wasteful.
 *   - Coverage — V8 provider against `src/**` (excluding the entry
 *     point and server bootstrap, which are exercised end-to-end by
 *     the integration tests but are not "unit-testable" in isolation).
 *
 * Run:           bun run test
 * Run (CI):      bun run test:integration
 * Watch (local): bunx vitest
 */
const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    exclude: ["node_modules/**", "dist/**"],
    globals: false,
    reporters: ["default"],
    // Vitest 4 — `poolOptions.forks.singleFork` was removed; the
    // replacement is `fileParallelism: false` (forces a single worker)
    // plus `isolate: false` (don't spin up a new module registry per
    // test file). Both are needed to guarantee the Prisma client
    // singleton is shared across test files.
    pool: "forks",
    fileParallelism: false,
    isolate: false,
    // Global setup file — runs `prisma db push` + `deleteMany({})` once
    // before any test executes (in a separate Node process).
    globalSetup: ["tests/integration/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "html", "json"],
      reportsDirectory: "coverage",
      include: ["src/**/*.ts"],
      exclude: [
        "src/index.ts",        // server bootstrap — exercised end-to-end
        "src/server/app.ts",   // express app factory — exercised end-to-end
        "src/**/*.d.ts",
        "src/lib/logger.ts",   // pino-style logger — out of scope
      ],
      thresholds: {
        lines: 0,
        functions: 0,
        branches: 0,
        statements: 0,
      },
    },
    // Resolve `@/...` aliases if a test ever imports backend code with
    // those — the backend doesn't use them today, but keep parity with
    // the frontend's vitest config in case future tests do.
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
});
