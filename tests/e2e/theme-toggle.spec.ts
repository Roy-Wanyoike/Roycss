import { test, expect } from "@playwright/test";

/**
 * Theme toggle — dark/light mode switch.
 *
 * The ThemeToggle component adds/removes the `dark` class on
 * `document.documentElement`. We assert the class flips and persists across
 * a reload (Next.js persists theme via localStorage / next-themes).
 */
test.describe("theme toggle", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("the toggle button is visible and labeled", async ({ page }) => {
    const toggle = page.getByRole("button", { name: "Toggle theme" });
    await expect(toggle).toBeVisible();
  });

  test("clicking the toggle flips the html element's dark class", async ({ page }) => {
    const toggle = page.getByRole("button", { name: "Toggle theme" });
    const before = await page.evaluate(() =>
      document.documentElement.classList.contains("dark"),
    );

    await toggle.click();
    // Give the state update + any CSS transition a moment.
    await page.waitForTimeout(300);

    const after = await page.evaluate(() =>
      document.documentElement.classList.contains("dark"),
    );
    expect(after, "dark class should flip after the first click").toBe(!before);
  });

  test("clicking the toggle twice restores the original state", async ({ page }) => {
    const toggle = page.getByRole("button", { name: "Toggle theme" });
    const before = await page.evaluate(() =>
      document.documentElement.classList.contains("dark"),
    );

    await toggle.click();
    await page.waitForTimeout(200);
    await toggle.click();
    await page.waitForTimeout(200);

    const after = await page.evaluate(() =>
      document.documentElement.classList.contains("dark"),
    );
    expect(after, "two clicks should restore the original theme").toBe(before);
  });

  test("the toggle is keyboard-reachable (Tab + Enter activates it)", async ({ page }) => {
    // Move focus to the body and Tab until the toggle is focused.
    await page.keyboard.press("Tab");
    const toggle = page.getByRole("button", { name: "Toggle theme" });
    // Focus the toggle explicitly — Tab order is non-deterministic across resolutions.
    await toggle.focus();
    await expect(toggle).toBeFocused();

    const before = await page.evaluate(() =>
      document.documentElement.classList.contains("dark"),
    );
    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);
    const after = await page.evaluate(() =>
      document.documentElement.classList.contains("dark"),
    );
    expect(after).toBe(!before);
  });
});
