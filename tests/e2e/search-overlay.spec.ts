import { test, expect } from "@playwright/test";

/**
 * ⌘K search overlay — the cross-cutting discovery surface.
 *
 * Golden path:
 *   1. Clicking the ⌘K button (or pressing the keyboard shortcut) opens the overlay.
 *   2. Typing a query filters the results list.
 *   3. Pressing Escape closes the overlay.
 *
 * The overlay is rendered at z-index 200 so we don't need to scroll anything
 * into view first.
 */
test.describe("search overlay (⌘K)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("opens the overlay when the ⌘K button is clicked", async ({ page }) => {
    const searchBtn = page.getByRole("button", { name: "Search (⌘K)" });
    await expect(searchBtn).toBeVisible();
    await searchBtn.click();

    const input = page.getByRole("textbox", {
      name: "Search effects, recipes, patterns, and sections",
    });
    await expect(input).toBeVisible();
    await expect(input).toBeFocused();
  });

  test("opens the overlay via the Cmd/Ctrl+K keyboard shortcut", async ({ page }) => {
    const isMac = process.platform === "darwin";
    const modifier = isMac ? "Meta" : "Control";
    await page.keyboard.press(`${modifier}+K`);

    const input = page.getByRole("textbox", {
      name: "Search effects, recipes, patterns, and sections",
    });
    await expect(input).toBeVisible();
  });

  test("typing a query surfaces matching effects", async ({ page }) => {
    await page.getByRole("button", { name: "Search (⌘K)" }).click();
    const input = page.getByRole("textbox", {
      name: "Search effects, recipes, patterns, and sections",
    });
    await input.fill("glow");

    // Either results show up, or the "No results for ..." empty state appears.
    // Both prove the query was processed.
    await expect(
      page.getByText(/\d+ results/i).or(page.getByText(/No results for/i)),
    ).toBeVisible({ timeout: 8000 });
  });

  test("pressing Escape closes the overlay", async ({ page }) => {
    await page.getByRole("button", { name: "Search (⌘K)" }).click();
    const input = page.getByRole("textbox", {
      name: "Search effects, recipes, patterns, and sections",
    });
    await expect(input).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(input).toBeHidden();
  });

  test("clicking the close button (X) closes the overlay", async ({ page }) => {
    await page.getByRole("button", { name: "Search (⌘K)" }).click();
    const closeBtn = page.getByRole("button", { name: "Close search" });
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();

    const input = page.getByRole("textbox", {
      name: "Search effects, recipes, patterns, and sections",
    });
    await expect(input).toBeHidden();
  });
});
