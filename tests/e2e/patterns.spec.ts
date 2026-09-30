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

  test("filtering by category via the 'States' pill filters the visible count", async ({
    page,
  }) => {
    // Smell fix (issue #277): this test used to be a vacuous conditional —
    // when the pill was hidden it asserted NOTHING (and the pill is in fact
    // deterministic: the patterns corpus always ships states entries). Both
    // branches now carry real assertions and the conditional is gone.
    const section = page.locator("#patterns");

    // The "All" pill advertises the total as its badge count.
    const allPill = section.getByRole("button", { name: /^All/ }).first();
    await expect(allPill).toBeVisible();
    const allText = (await allPill.innerText()).replace(/\D+/g, "");
    const total = Number(allText);
    expect(total, "the All pill should advertise the pattern total").toBeGreaterThan(0);

    // The first non-All category pill ("States") is deterministic too.
    const statesPill = section.getByRole("button", { name: /^States/ }).first();
    await expect(statesPill).toBeVisible();
    await statesPill.click();

    // The summary line flips to the filtered count, which must be a strict
    // subset of the total (feedback + layouts entries exist in the corpus).
    const summary = section.getByText(/Showing \d+ patterns?/i);
    await expect(summary).toBeVisible({ timeout: 10_000 });
    const filtered = Number(((await summary.innerText()).match(/Showing (\d+)/i) ?? [])[1]);
    expect(filtered, "the summary should carry a count").not.toBeNaN();
    expect(filtered, "filtering by States should reduce the count").toBeLessThan(total);
    expect(filtered, "the States category should have at least 1 pattern").toBeGreaterThanOrEqual(1);

    // The filtered grid still renders at least one expandable card.
    const togglesAfter = section.getByText(/^View HTML$/i);
    await expect(togglesAfter.first()).toBeVisible();
    expect(await togglesAfter.count()).toBeGreaterThanOrEqual(1);
  });
});
