import { test, expect } from "@playwright/test";

/**
 * Home / landing-page smoke tests.
 *
 * Verifies the three things every visitor sees first:
 *   1. The page actually loads (200 OK)
 *   2. The document title is the RoyCSS brand
 *   3. The hero, primary nav, and footer are all visible
 *
 * If any of these fail, every other E2E spec is moot — so this file runs
 * first under {@link test.describe.configure({ mode: "serial" })}.
 */
test.describe("home / landing page", () => {
  test("loads with the RoyCSS title and hero", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.ok(), "GET / should return 2xx").toBe(true);
    await expect(page).toHaveTitle(/RoyCSS/i);

    // Hero h1 — the page renders two visible <h1> spans ("Beautiful CSS" + "Effects Library").
    // TextReveal strips whitespace between the spans, so we assert each phrase separately.
    const h1 = page.locator("h1").first();
    await expect(h1).toBeVisible();
    const h1Text = (await h1.innerText()).toLowerCase();
    expect(h1Text, `h1 should mention "beautiful css"`).toContain("beautiful css");
    expect(h1Text, `h1 should mention "effects library"`).toContain("effects library");
  });

  test("exposes the primary navigation", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Primary navigation" });
    await expect(nav).toBeVisible();

    // The desktop nav exposes Get Started / Effects / Recipes / etc. as buttons.
    await expect(nav.getByRole("button", { name: "Effects" })).toBeVisible();
    await expect(nav.getByRole("button", { name: "Recipes" })).toBeVisible();
  });

  test("renders the site footer", async ({ page }) => {
    await page.goto("/");
    const footer = page.getByRole("contentinfo", { name: "Site footer" });
    await expect(footer).toBeVisible();
  });

  test("exposes the ⌘K search button", async ({ page }) => {
    await page.goto("/");
    const searchBtn = page.getByRole("button", { name: "Search (⌘K)" });
    await expect(searchBtn).toBeVisible();
  });

  test("exposes the theme toggle", async ({ page }) => {
    await page.goto("/");
    const toggle = page.getByRole("button", { name: "Toggle theme" });
    await expect(toggle).toBeVisible();
  });
});
