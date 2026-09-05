/**
 * Env canonicalization for the test worker — the vitest `setupFiles`
 * entry. Runs BEFORE any test module is imported, which matters because
 * importing backend code evaluates the Zod-validated env loader
 * (src/config/env.ts) at module load and it hard-exits when
 * DATABASE_URL / JWT secrets are missing.
 *
 * Mirrors tests/integration/setup.ts (the globalSetup process, which
 * does NOT see this file):
 *   - DATABASE_URL is FORCED to the throwaway `file:./test.db` so an
 *     ambient value (shell export, sandbox default) can never point the
 *     suite at a real dev/prod database. CI and the `test:integration`
 *     script set exactly this value, so nothing documented changes.
 *   - JWT secrets default when absent so a bare `bun run test` works
 *     from a clean shell (`??=` — explicit values always win).
 *
 * NODE_ENV is deliberately left alone so local runs match CI (where it
 * is unset and defaults to "development"; CI's backend job exports
 * NODE_ENV=test itself).
 */
const TEST_DB_PATH = "file:./test.db";
if (process.env.DATABASE_URL !== TEST_DB_PATH) {
  console.log(
    `[setup-env] Ignoring ambient DATABASE_URL="${
      process.env.DATABASE_URL ?? "<unset>"
    }" — tests always use ${TEST_DB_PATH}`,
  );
  process.env.DATABASE_URL = TEST_DB_PATH;
}
process.env.JWT_SECRET ??= "test-jwt-secret-32-chars-long";
process.env.JWT_REFRESH_SECRET ??= "test-refresh-secret-32-chars";
