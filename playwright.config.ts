import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for RoyCSS E2E tests.
 *
 * - Specs live in tests/e2e (one .spec.ts file per page section).
 * - Multi-browser matrix: chromium + firefox + webkit (see tests/README.md).
 *   Browser binaries are a local, one-time install — NOT a package.json dep:
 *   `bunx playwright install firefox webkit` (~600 MB). WebKit on Linux also
 *   needs system libraries: `sudo bunx playwright install-deps webkit`.
 * - The dev server is auto-started unless `PLAYWRIGHT_NO_SERVER` is set
 *   (used in CI when a server is already running). The auto-started server
 *   listens on the port embedded in `PLAYWRIGHT_BASE_URL` (default
 *   `http://localhost:3000`) so an overridden base URL never races a
 *   server stuck on :3000 (issue #274).
 *
 * Run:    bunx playwright test                      # all 3 projects
 *         bunx playwright test --project=chromium  # one project
 * UI:     bunx playwright test --ui
 * Debug:  bunx playwright test --debug
 */
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
// Port the auto-started dev server must listen on — derived from BASE_URL
// so the health-check below and the server it waits for always agree
// (issue #274: `bun run dev` hardcodes -p 3000, which deadlocked the
// health-check whenever PLAYWRIGHT_BASE_URL pointed elsewhere).
const BASE_PORT = new URL(BASE_URL).port || "3000";
const shouldStartServer = !process.env.PLAYWRIGHT_NO_SERVER;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1, // dev server is single-instance; parallel browser contexts race for the same DB
  reporter: process.env.CI
    ? [["github"], ["list"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    // Chromium first: it is the reference engine every spec is written against.
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
  ...(shouldStartServer
    ? {
        webServer: {
          // Default port: the canonical `bun run dev` script (teed to
          // dev.log). Overridden port: next dev directly with -p, because
          // appending args to the piped script would hit `tee`, not next.
          command:
            BASE_PORT === "3000"
              ? "bun run dev"
              : `bunx next dev -p ${BASE_PORT}`,
          url: BASE_URL,
          timeout: 120_000,
          reuseExistingServer: !process.env.CI,
          stdout: "pipe",
          stderr: "pipe",
        },
      }
    : {}),
});
