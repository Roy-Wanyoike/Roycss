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

    // Hero h1 — the page renders two visible <h1> spans ("Build Beautiful" +
    // "Frontend Interfaces"). TextReveal strips whitespace between the spans,
    // so we assert each phrase separately.
    const h1 = page.locator("h1").first();
    await expect(h1).toBeVisible();
    const h1Text = (await h1.innerText()).toLowerCase().replace(/[\s\u200b\u00a0]+/g, " ");
    expect(h1Text, `h1 should mention "build beautiful"`).toContain("build beautiful");
    expect(h1Text, `h1 should mention "frontend interfaces"`).toContain("frontend interfaces");
  });

  test("exposes the primary navigation", async ({ page }) => {
    await page.goto("/");
    // Settle the auth-context 401 refresh cycle (re-navigates within ~3s).
    await page.waitForTimeout(3000);
    // The home mega-header is landmark "Primary navigation" with trigger
    // buttons (Get Started / Explore / Platform / FAQ) + a Docs link.
    // The inner-page SiteHeader is a different landmark ("Primary").
    const nav = page.getByRole("navigation", { name: "Primary navigation" });
    await expect(nav).toBeVisible();

    await expect(nav.getByRole("button", { name: "Get Started" })).toBeVisible();
    await expect(nav.getByRole("button", { name: "Explore" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Docs" })).toBeVisible();
  });

  test("renders the site footer", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(3000);
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
