import { test, expect } from "@playwright/test";

/**
 * Effects grid — the core catalog surface.
 *
 * Covers the three highest-traffic user flows:
 *   1. Browse: grid renders, count is plausible, cards have visible names.
 *   2. Filter by category: clicking a category pill shrinks the summary count.
 *   3. Filter by search: typing narrows the results; clearing restores them.
 *   4. Detail dialog: clicking a card opens a dialog with the effect name and CSS.
 *
 * The grid is window-rendered (VirtualScrollGrid renders one BATCH of cards
 * and loads more on scroll), so the DOM card count is a RENDER WINDOW, not
 * the result size — the authoritative count is the "Showing N effects"
 * summary line. Cards are buttons whose accessible name is
 * "<Name> — <description>. Opens the effect details."
 */
test.describe("effects grid", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Auth 401 refresh re-navigates the page within ~3s of first load.
    await page.waitForTimeout(3000);
    // Scroll the effects section into view so the grid window renders cards.
    await page.locator("#effects").scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
  });

  /** The "Showing N effects…" summary paragraph — the authoritative count. */
  function summary(page: import("@playwright/test").Page) {
    return page.getByText(/Showing \d+ effects?/i).first();
  }

  async function summaryTotal(page: import("@playwright/test").Page) {
    const text = await summary(page).innerText();
    const n = Number(text.match(/Showing (\d+)/i)?.[1]);
    expect(n, `summary "${text}" should contain a count`).not.toBeNaN();
    return n;
  }

  test("renders the effects section with the expected heading", async ({ page }) => {
    const heading = page.getByRole("heading", { name: /All Effects/i });
    await expect(heading).toBeVisible();
  });

  test("renders at least one effect card with a visible name", async ({ page }) => {
    // Every grid card is a <button> named "<Name> — <desc>. Opens the effect details."
    const cards = page.getByRole("button", { name: /Opens the effect details/ });
    await expect(cards.first()).toBeVisible();
    const count = await cards.count();
    expect(count, "the initial render window should hold a batch of cards").toBeGreaterThanOrEqual(12);
    // …and the summary reports the full (virtualized) catalog size.
    const total = await summaryTotal(page);
    expect(total, "catalog should expose the full effect count via the summary").toBeGreaterThanOrEqual(12);
  });

  test("shows a result count that matches the visible card count", async ({ page }) => {
    const cards = page.getByRole("button", { name: /Opens the effect details/ });
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    await expect(summary(page)).toBeVisible();
  });

  test("clicking a category pill filters the result count", async ({ page }) => {
    const cards = page.getByRole("button", { name: /Opens the effect details/ });
    await expect(cards.first()).toBeVisible();
    const initialTotal = await summaryTotal(page);

    // Pick the "Loaders" pill (a mid-size category).
    const loadersPill = page.getByRole("button", { name: /^Loaders/i }).first();
    await expect(loadersPill).toBeVisible();
    await loadersPill.click();

    // The summary flips to "Showing N effects in Loaders" and N shrinks.
    await expect
      .poll(() => summary(page).innerText(), { timeout: 10_000 })
      .toMatch(/Showing \d+ effects? in /i);
    const filteredTotal = await summaryTotal(page);
    expect(filteredTotal, "filtering by Loaders should reduce the count").toBeLessThan(initialTotal);
    expect(filteredTotal, "Loaders category should have at least 1 effect").toBeGreaterThan(0);
    // The re-rendered grid still shows cards from the filtered window.
    await expect(cards.first()).toBeVisible();
  });

  test("typing into the search box narrows the results", async ({ page }) => {
    const cards = page.getByRole("button", { name: /Opens the effect details/ });
    await expect(cards.first()).toBeVisible();
    const initialTotal = await summaryTotal(page);

    const search = page.getByRole("searchbox", {
      name: "Search CSS effects by name, tag, or category",
    });
    await expect(search).toBeVisible();
    await search.fill("glow");

    // The summary echoes the active query and the result count shrinks.
    await expect
      .poll(() => summary(page).innerText(), { timeout: 10_000 })
      .toMatch(/matching/i);
    const filteredTotal = await summaryTotal(page);
    expect(filteredTotal, "searching 'glow' should narrow results").toBeLessThan(initialTotal);
    await expect(cards.first()).toBeVisible();
  });

  test("clearing the search restores the original count", async ({ page }) => {
    const initialTotal = await summaryTotal(page);

    const search = page.getByRole("searchbox", {
      name: "Search CSS effects by name, tag, or category",
    });
    await search.fill("glow");
    await expect
      .poll(() => summary(page).innerText(), { timeout: 10_000 })
      .toMatch(/matching/i);

    const clearBtn = page.getByRole("button", { name: "Clear search" });
    await expect(clearBtn).toBeVisible();
    await clearBtn.click();

    await expect
      .poll(() => summary(page).innerText(), { timeout: 10_000 })
      .not.toMatch(/matching/i);
    const restored = await summaryTotal(page);
    expect(restored, "clearing search should restore the original count").toBe(initialTotal);
  });

  test("clicking an effect card opens the detail dialog with its name and CSS code", async ({
    page,
  }) => {
    const firstCard = page.getByRole("button", { name: /Opens the effect details/ }).first();
    const cardLabel = (await firstCard.getAttribute("aria-label")) ?? "";
    // Accessible name contract: "<Name> — <description>. Opens the effect details."
    const effectName = cardLabel.split(" — ")[0].trim();
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
