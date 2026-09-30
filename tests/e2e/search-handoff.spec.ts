import { test, expect } from "@playwright/test";

/**
 * Search-overlay result → navigation handoff (issue #277).
 *
 * search-overlay.spec.ts pins open/type/close; the RESULT CLICK was never
 * followed. This spec pins the issue #161 contract: an effect result is a
 * real <Link> to /effects/<id> (effectDetailHref) — clicking "Glow Border"
 * navigates to /effects/hover-glow-border (the same stable id as
 * effect-detail-route.spec.ts), and the overlay closes on the way out.
 *
 * "Glow Border" is a deterministic first-hit: the query matches the effect's
 * name exactly, and no section/recipe/pattern result contains it.
 */
test.describe("search overlay — result → navigation handoff", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Settle: the auth-context 401 refresh cycle re-navigates within ~3s
    // (same convention as search-overlay.spec.ts).
    await page.waitForTimeout(3000);
  });

  test("clicking an effect result navigates to its /effects/<id> detail page", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Search (⌘K)" }).click();
    const input = page.getByRole("dialog").getByRole("searchbox");
    await expect(input).toBeVisible();
    await expect(input).toBeFocused();

    await input.fill("Glow Border");

    // The overlay's result list renders "Glow Border" as a real link.
    const result = page
      .getByRole("dialog")
      .locator("a", { hasText: "Glow Border" })
      .first();
    await expect(result).toBeVisible({ timeout: 8000 });

    await result.click();

    // The handoff: overlay closed, browser landed on the effect detail page.
    await expect(page).toHaveURL(/\/effects\/hover-glow-border$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Glow Border");
  });
});
