import { test, expect } from "@playwright/test";

/**
 * Cross-browser smoke — one ultra-cheap sanity pass per browser project.
 *
 * Every test in this file runs identically against each project declared in
 * playwright.config.ts (chromium, firefox, webkit). It is deliberately
 * minimal — three navigations and a single click per browser — so the whole
 * file adds only a few seconds per project. Its job is to catch
 * engine-specific breakage (hydration failures, layout/visibility quirks,
 * theme-class handling) that the chromium-only specs can't see, NOT to
 * re-test behavior already covered by the dedicated per-surface specs.
 */
test.describe("cross-browser smoke", () => {
  test("home renders the hero heading", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.ok(), "GET / should return 2xx").toBe(true);

    // The hero renders two visible <h1> spans ("Build Beautiful" + "Frontend
    // Interfaces"); TextReveal strips whitespace between them, so assert each
    // phrase separately (same contract as home.spec.ts).
    const h1 = page.locator("h1").first();
    await expect(h1).toBeVisible();
    const h1Text = (await h1.innerText()).toLowerCase().replace(/[\s\u200b\u00a0]+/g, " ");
    expect(h1Text, `h1 should mention "build beautiful"`).toContain("build beautiful");
    expect(h1Text, `h1 should mention "frontend interfaces"`).toContain("frontend interfaces");
  });

  test("/effects renders the named category regions", async ({ page }) => {
    await page.goto("/effects");

    // Each category is a <section aria-labelledby="cat-…">, which exposes an
    // implicit "region" role. The index ships 29 categories; assert a healthy
    // subset rather than the exact count so a content change can't flake this.
    const regions = page.getByRole("region");
    await expect(regions.first()).toBeVisible();
    const count = await regions.count();
    expect(count, "expected the category region list on /effects").toBeGreaterThanOrEqual(20);
  });

  test("theme toggle flips the html element's dark class", async ({ page }) => {
    await page.goto("/");
    const toggle = page.getByRole("button", { name: "Toggle theme" });
    await expect(toggle).toBeVisible();

    const before = await page.evaluate(() =>
      document.documentElement.classList.contains("dark"),
    );

    // The click is only handled once React has hydrated; on slower engines a
    // first click can be lost, so re-click inside the retry loop instead of
    // sleeping. The toggle flips state on every handled click, so the poll
    // resolves as soon as one click lands post-hydration.
    await expect
      .poll(
        async () => {
          const now = await page.evaluate(() =>
            document.documentElement.classList.contains("dark"),
          );
          if (now !== before) return now;
          await toggle.click();
          return page.evaluate(() =>
            document.documentElement.classList.contains("dark"),
          );
        },
        { timeout: 15_000, intervals: [250, 500, 1_000] },
      )
      .toBe(!before);
  });
});
