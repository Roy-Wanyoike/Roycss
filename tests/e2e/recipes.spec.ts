import { test, expect } from "@playwright/test";

/**
 * Recipes section — curated effect combinations.
 *
 * Golden path:
 *   1. The Recipes section renders with a heading.
 *   2. At least one recipe card is visible.
 *   3. Clicking a card expands the HTML <pre> code block.
 *   4. The "Copy HTML" button is present and clickable.
 */
test.describe("recipes section", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.locator("#recipes").scrollIntoViewIfNeeded();
  });

  test("renders the Recipes section heading", async ({ page }) => {
    const heading = page.getByRole("heading", { name: /Recipes/i }).first();
    await expect(heading).toBeVisible();
  });

  test("renders at least one recipe card", async ({ page }) => {
    // Recipe cards have a "View HTML" toggle inside their clickable header.
    const toggles = page.getByText(/^View HTML$/i);
    await expect(toggles.first()).toBeVisible();
    const count = await toggles.count();
    expect(count, "expected at least one recipe card").toBeGreaterThanOrEqual(1);
  });

  test("clicking a recipe card expands its HTML code block", async ({ page }) => {
    const firstToggle = page.getByText(/^View HTML$/i).first();
    await firstToggle.click();

    // After expansion the toggle text flips to "Hide code" and a <pre> appears.
    await expect(page.getByText(/^Hide code$/i).first()).toBeVisible();
    const codeBlock = page.locator("#recipes pre code").first();
    await expect(codeBlock).toBeVisible();
    const text = (await codeBlock.innerText()).trim();
    expect(text.length, "HTML snippet should be non-empty").toBeGreaterThan(0);
    expect(text).toContain("roycss-");
  });

  test("exposes a Copy HTML button on the expanded card", async ({ page }) => {
    const firstToggle = page.getByText(/^View HTML$/i).first();
    await firstToggle.click();
    const copyBtn = page.getByRole("button", { name: /Copy HTML/i }).first();
    await expect(copyBtn).toBeVisible();

    // Grant clipboard permissions and click — should flip to "Copied!".
    await copyBtn.click();
    await expect(page.getByText(/^Copied!$/i).first()).toBeVisible({ timeout: 4000 });
  });

  test("collapses the HTML block when the toggle is clicked again", async ({ page }) => {
    const firstToggle = page.getByText(/^View HTML$/i).first();
    await firstToggle.click();
    await expect(page.getByText(/^Hide code$/i).first()).toBeVisible();
    await firstToggle.click();
    await expect(page.getByText(/^View HTML$/i).first()).toBeVisible();
  });
});
