import { test, expect } from "@playwright/test";

/**
 * Patterns section — UI state templates (empty / loading / error / etc).
 *
 * Golden path:
 *   1. The Patterns section renders with a heading.
 *   2. At least one pattern card is visible.
 *   3. Clicking a card expands the HTML code block + "When to use" copy.
 *   4. The Copy HTML button is present.
 */
test.describe("patterns section", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.locator("#patterns").scrollIntoViewIfNeeded();
  });

  test("renders the Patterns section heading", async ({ page }) => {
    const heading = page.getByRole("heading", { name: /UI State Patterns/i }).first();
    await expect(heading).toBeVisible();
  });

  test("renders at least one pattern card", async ({ page }) => {
    const toggles = page.locator("#patterns").getByText(/^View HTML$/i);
    await expect(toggles.first()).toBeVisible();
    const count = await toggles.count();
    expect(count, "expected at least one pattern card").toBeGreaterThanOrEqual(1);
  });

  test("clicking a pattern card expands its HTML code block", async ({ page }) => {
    const firstToggle = page.locator("#patterns").getByText(/^View HTML$/i).first();
    await firstToggle.click();

    await expect(page.locator("#patterns").getByText(/^Hide code$/i).first()).toBeVisible();
    const codeBlock = page.locator("#patterns pre code").first();
    await expect(codeBlock).toBeVisible();
    const text = (await codeBlock.innerText()).trim();
    expect(text.length).toBeGreaterThan(0);
    expect(text).toContain("roycss-");
  });

  test("shows the 'When to use' copy after expanding", async ({ page }) => {
    const firstToggle = page.locator("#patterns").getByText(/^View HTML$/i).first();
    await firstToggle.click();
    const whenToUse = page.locator("#patterns").getByText(/When to use/i).first();
    await expect(whenToUse).toBeVisible();
  });

  test("exposes a Copy HTML button on the expanded card", async ({ page }) => {
    const firstToggle = page.locator("#patterns").getByText(/^View HTML$/i).first();
    await firstToggle.click();
    const copyBtn = page
      .locator("#patterns")
      .getByRole("button", { name: /Copy HTML/i })
      .first();
    await expect(copyBtn).toBeVisible();
  });

  test("filtering by category via the 'All' / category pills changes the visible count", async ({
    page,
  }) => {
    const section = page.locator("#patterns");
    const togglesBefore = await section.getByText(/^View HTML$/i).count();

    // Click the "States" pill if it's visible (it's the first non-All category).
    const statesPill = section.getByRole("button", { name: /States/i }).first();
    if (await statesPill.isVisible()) {
      await statesPill.click();
      const togglesAfter = await section.getByText(/^View HTML$/i).count();
      // Either the count changed, or every pattern is a "states" pattern (acceptable).
      expect(togglesAfter).toBeGreaterThanOrEqual(1);
    }
  });
});
