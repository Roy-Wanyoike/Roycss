import { defineConfig } from "vitest/config";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Vitest configuration for the RoyCSS backend test suite.
 *
 * Two PROJECTS (vitest "projects", fka workspaces) because unit and
 * integration tests have opposite isolation requirements:
 *
 *   - `unit`        — tests/unit/**; default per-file isolation, which
 *                     lets tests use `vi.mock()` (e.g. swapping the
 *                     Prisma client for fakes in the middleware tests).
 *                     `setupFiles: tests/unit/setup-env.ts` canonicalizes
 *                     env vars before backend modules are imported.
 *   - `integration` — tests/integration/**; `fileParallelism: false` +
 *                     `isolate: false` run every file in ONE worker with
 *                     a shared module registry, so the PrismaClient
 *                     singleton (src/lib/db.ts, stashed on globalThis)
 *                     is shared instead of three instances racing on the
 *                     same SQLite file. `globalSetup:
 *                     tests/integration/setup.ts` pushes the schema to
 *                     `file:./test.db` and wipes all tables in FK-safe
 *                     order ONCE per run (in a separate process).
 *
 * `bun run test` runs both projects; `bun run test:integration` passes a
 * path filter that selects only the integration project.
 *
 * Run:           bun run test
 * Run (CI):      bun run test:integration
 * Watch (local): bunx vitest
 */
const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    reporters: ["default"],
    exclude: ["node_modules/**", "dist/**"],
    // Coverage is inherited by both projects below.
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "html", "json"],
      reportsDirectory: "coverage",
      include: ["src/**/*.ts"],
      exclude: [
        "src/index.ts",      // server bootstrap — exercised end-to-end
        "src/server/app.ts", // express app factory — exercised end-to-end
        "src/**/*.d.ts",
        "src/lib/logger.ts", // pino-style logger — out of scope
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
    projects: [
      {
        test: {
          name: "unit",
          include: ["tests/unit/**/*.test.ts"],
          // Default isolation (fresh module registry per file) so
          // vi.mock() works regardless of execution order.
          // Env canonicalization before backend modules load.
          setupFiles: ["tests/unit/setup-env.ts"],
        },
      },
      {
        test: {
          name: "integration",
          include: ["tests/integration/**/*.test.ts"],
          setupFiles: ["tests/unit/setup-env.ts"],
          // Vitest 4 — `poolOptions.forks.singleFork` was removed; the
          // replacement is `fileParallelism: false` (forces a single
          // worker) plus `isolate: false` (don't spin up a new module
          // registry per test file). Both are needed to guarantee the
          // Prisma client singleton is shared across test files.
          pool: "forks",
          fileParallelism: false,
          isolate: false,
          // Runs `prisma db push` + `deleteMany({})` once per run, in a
          // separate Node process, before any integration test executes.
          globalSetup: ["tests/integration/setup.ts"],
        },
      },
    ],
  },
});
