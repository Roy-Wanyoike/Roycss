import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for RoyCSS E2E tests.
 *
 * - Specs live in tests/e2e (one .spec.ts file per page section).
 * - Multi-browser matrix: chromium + firefox + webkit (see tests/README.md).
 *   Browser binaries are a local, one-time install — NOT a package.json dep:
 *   `bunx playwright install firefox webkit` (~600 MB). WebKit on Linux also
 *   needs system libraries: `sudo bunx playwright install-deps webkit`.
 * - The dev server is auto-started on port 3000 unless `PLAYWRIGHT_NO_SERVER`
 *   is set (used in CI when a server is already running).
 *
 * Run:    bunx playwright test                      # all 3 projects
 *         bunx playwright test --project=chromium  # one project
 * UI:     bunx playwright test --ui
 * Debug:  bunx playwright test --debug
 */
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
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
          command: "bun run dev",
          url: BASE_URL,
          timeout: 120_000,
          reuseExistingServer: !process.env.CI,
          stdout: "pipe",
          stderr: "pipe",
        },
      }
    : {}),
});
