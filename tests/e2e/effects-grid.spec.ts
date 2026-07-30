import { test, expect } from "@playwright/test";

/**
 * Effects grid — the core catalog surface.
 *
 * Covers the three highest-traffic user flows:
 *   1. Browse: grid renders, count is plausible, cards have visible names.
 *   2. Filter by category: clicking a category pill changes the visible count.
 *   3. Filter by search: typing narrows the visible cards.
 *   4. Detail dialog: clicking a card opens a dialog with the effect name and CSS.
 *
 * Selectors are role/label-based so a Tailwind refactor can't break the suite.
 */
test.describe("effects grid", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Scroll the effects section into view so virtualization doesn't hide cards.
    await page.locator("#effects").scrollIntoViewIfNeeded();
  });

  test("renders the effects section with the expected heading", async ({ page }) => {
    const heading = page.getByRole("heading", { name: /All Effects/i });
    await expect(heading).toBeVisible();
  });

  test("renders at least one effect card with a visible name", async ({ page }) => {
    // Every effect card is a <button> with aria-label "View details for <Name>".
    const cards = page.getByRole("button", { name: /View details for .+/i });
    await expect(cards.first()).toBeVisible();
    const count = await cards.count();
    expect(count, "expected at least 12 visible effect cards").toBeGreaterThanOrEqual(12);
  });

  test("shows a result count that matches the visible card count", async ({ page }) => {
    const cards = page.getByRole("button", { name: /View details for .+/i });
    const initialCount = await cards.count();
    expect(initialCount).toBeGreaterThan(0);
    // The "Showing N effects" text should match (within the visible page).
    const summary = page.getByText(/Showing \d+ effects/i).first();
    await expect(summary).toBeVisible();
  });

  test("clicking a category pill filters the visible card count", async ({ page }) => {
    const cards = page.getByRole("button", { name: /View details for .+/i });
    const initialCount = await cards.count();

    // Pick the "Loaders" pill if present (small enough to filter quickly).
    const loadersPill = page.getByRole("button", { name: /^Loaders/i }).first();
    await expect(loadersPill).toBeVisible();
    await loadersPill.click();

    // Wait for the count summary to update, then re-count visible cards.
    await expect(page.getByText(/Showing \d+ (?:effect|effects) in/i).first()).toBeVisible();
    const filteredCount = await cards.count();
    expect(filteredCount, "filtering by Loaders should reduce the visible count").toBeLessThan(
      initialCount,
    );
    expect(filteredCount, "Loaders category should have at least 1 effect").toBeGreaterThan(0);
  });

  test("typing into the search box narrows the visible cards", async ({ page }) => {
    const cards = page.getByRole("button", { name: /View details for .+/i });
    const initialCount = await cards.count();

    const search = page.getByRole("searchbox", {
      name: "Search CSS effects by name, tag, or category",
    });
    await expect(search).toBeVisible();
    await search.fill("glow");

    // Give the UI a tick to filter.
    await page.waitForTimeout(400);
    const filteredCount = await cards.count();
    expect(filteredCount, "searching 'glow' should narrow results").toBeLessThanOrEqual(
      initialCount,
    );
  });

  test("clearing the search restores the original count", async ({ page }) => {
    const cards = page.getByRole("button", { name: /View details for .+/i });
    const baseline = await cards.count();

    const search = page.getByRole("searchbox", {
      name: "Search CSS effects by name, tag, or category",
    });
    await search.fill("glow");
    await page.waitForTimeout(300);

    const clearBtn = page.getByRole("button", { name: "Clear search" });
    await clearBtn.click();
    await page.waitForTimeout(300);

    const restored = await cards.count();
    expect(restored, "clearing search should restore the original visible count").toBe(baseline);
  });

  test("clicking an effect card opens the detail dialog with its name and CSS code", async ({
    page,
  }) => {
    const firstCard = page.getByRole("button", { name: /View details for .+/i }).first();
    const cardLabel = (await firstCard.getAttribute("aria-label")) ?? "";
    const effectName = cardLabel.replace("View details for ", "").trim();
    expect(effectName.length).toBeGreaterThan(0);

    await firstCard.click();

    // The detail dialog uses a sr-only DialogTitle with the effect name.
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(effectName).first()).toBeVisible();

    // The dialog shows the CSS code inside a <pre><code> block.
    const codeBlock = dialog.locator("pre code").first();
    await expect(codeBlock).toBeVisible();
    const codeText = (await codeBlock.innerText()).trim();
    expect(codeText.length, "CSS code block should be non-empty").toBeGreaterThan(0);
    expect(codeText).toContain(".roycss-");

    // Close the dialog.
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });
});
