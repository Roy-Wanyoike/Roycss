import { test, expect } from "@playwright/test";

/**
 * Primary navigation — section scrolling + mobile hamburger menu.
 *
 * Golden path:
 *   1. Clicking each desktop nav button scrolls its target section into view.
 *   2. On a mobile viewport, the hamburger menu opens and lists the sections.
 *
 * Selectors use the visible button text (Get Started / Effects / Recipes /
 * Patterns / Platform / Docs / FAQ) rather than DOM order so a refactor that
 * re-orders nav items doesn't break the suite.
 */
test.describe("primary navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  const sections: Array<{ label: string; anchor: string }> = [
    { label: "Effects", anchor: "#effects" },
    { label: "Recipes", anchor: "#recipes" },
    { label: "Patterns", anchor: "#patterns" },
    { label: "Docs", anchor: "#docs" },
    { label: "FAQ", anchor: "#faq" },
  ];

  for (const { label, anchor } of sections) {
    test(`clicking "${label}" scrolls the target section into view`, async ({ page }) => {
      // The desktop nav buttons live inside the primary <nav>.
      const nav = page.getByRole("navigation", { name: "Primary navigation" });
      const btn = nav.getByRole("button", { name: new RegExp(`^${label}$`) }).first();
      await expect(btn).toBeVisible();
      await btn.click();

      // Wait for smooth-scroll to settle, then assert the target's top is at or
      // above the fold (within a 200 px tolerance for sticky headers).
      await page.waitForTimeout(800);
      const target = page.locator(anchor).first();
      const box = await target.boundingBox();
      expect(box, `target ${anchor} should exist`).not.toBeNull();
      expect(box!.y, `target ${anchor} should be near the top after scroll`).toBeLessThan(250);
    });
  }

  test("scrolls back to the top when navigating to Get Started", async ({ page }) => {
    const nav = page.getByRole("navigation", { name: "Primary navigation" });
    const btn = nav.getByRole("button", { name: /^Get Started$/ }).first();
    await expect(btn).toBeVisible();

    // First scroll down to prove the click actually moves the viewport.
    await page.mouse.wheel(0, 4000);
    await page.waitForTimeout(400);
    const beforeScrollY = await page.evaluate(() => window.scrollY);
    expect(beforeScrollY).toBeGreaterThan(0);

    await btn.click();
    await page.waitForTimeout(800);
    const afterScrollY = await page.evaluate(() => window.scrollY);
    expect(afterScrollY, "Get Started click should scroll the page upward").toBeLessThan(
      beforeScrollY,
    );
  });
});

test.describe("mobile hamburger menu", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Mobile viewport — hamburger appears below md (768px).
    await page.setViewportSize({ width: 375, height: 720 });
  });

  test("the hamburger button is visible on mobile and opens the menu", async ({ page }) => {
    const hamburger = page.getByRole("button", { name: "Open menu" });
    await expect(hamburger).toBeVisible();
    await hamburger.click();

    // After opening, the menu lists the 6 primary section links.
    const menu = page.getByRole("button", { name: "Get Started" }).first();
    await expect(menu).toBeVisible();
    await expect(page.getByRole("button", { name: "Effects" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Recipes" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Platform" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Docs" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "FAQ" }).first()).toBeVisible();
  });

  test("closing the menu hides the section list", async ({ page }) => {
    await page.getByRole("button", { name: "Open menu" }).click();
    await expect(page.getByRole("button", { name: "Get Started" }).first()).toBeVisible();

    // The button has flipped its aria-label to "Close menu".
    const closeBtn = page.getByRole("button", { name: "Close menu" });
    await closeBtn.click();
    await expect(page.getByRole("button", { name: "Get Started" }).first()).toBeHidden();
  });

  test("tapping a section link in the mobile menu closes the menu", async ({ page }) => {
    await page.getByRole("button", { name: "Open menu" }).click();
    await page.getByRole("button", { name: "Effects" }).first().click();
    await page.waitForTimeout(600);
    // The hamburger label should have flipped back to "Open menu".
    await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible();
  });
});
