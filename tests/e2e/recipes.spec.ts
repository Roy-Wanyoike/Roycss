import { test, expect } from "@playwright/test";

/**
 * Recipes section — curated effect combinations (home, #recipes).
 *
 * NOTE: the section is a LazySection (IntersectionObserver-mounted), so it
 * is NOT in the initial DOM — the test must scroll it into view and wait
 * for the lazy chunk to mount before asserting.
 *
 * Golden path:
 *   1. The Recipes section renders with a heading.
 *   2. At least one recipe card is visible.
 *   3. Clicking a card expands the HTML <pre> code block.
 *   4. The "Copy HTML" button is present and clickable.
 */
test.describe("recipes section", () => {
  // The Copy HTML affordance copies through the shared clipboard helper
  // (async API → execCommand fallback); clipboard-write permission keeps
  // the headless golden path working. The both-paths-fail UX ("Copy failed
  // — press Ctrl+C / ⌘C" state + payload selection) is pinned at the unit
  // level in tests/unit/clipboard-fallback.test.ts.
  test.use({ permissions: ["clipboard-write"] });

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Settle: the auth-context 401 refresh cycle re-navigates within ~3s.
    await page.waitForTimeout(3000);
    // Mount the lazy section, then wait for its recipe cards (the h2 is
    // stylistic — "Solution-Focused Patterns" — not the word "Recipes";
    // the region landmark is the stable Recipes handle).
    await page.locator("#recipes").scrollIntoViewIfNeeded();
    await page.getByText(/^View HTML$/i).first().waitFor({ timeout: 15000 });
  });

  test("renders the Recipes section with recipe cards", async ({ page }) => {
    const region = page.getByRole("region", { name: "Recipes" });
    await expect(region).toBeVisible();
    const toggles = page.getByText(/^View HTML$/i);
    const count = await toggles.count();
    expect(count, "expected multiple recipe cards").toBeGreaterThanOrEqual(3);
  });

  test("renders at least one recipe card", async ({ page }) => {
    const toggles = page.getByText(/^View HTML$/i);
    await expect(toggles.first()).toBeVisible();
    const count = await toggles.count();
    expect(count, "expected multiple recipe cards").toBeGreaterThanOrEqual(3);
  });

  test("clicking a recipe card expands its HTML code block", async ({ page }) => {
    const firstToggle = page.getByText(/^View HTML$/i).first();
    await firstToggle.click();
    await expect(page.getByText(/^Hide code$/i).first()).toBeVisible();
    const codeBlock = page.locator("#recipes pre code").first();
    await expect(codeBlock).toBeVisible();
  });

  test("exposes a Copy HTML button on the expanded card", async ({ page }) => {
    const firstToggle = page.getByText(/^View HTML$/i).first();
    await firstToggle.click();
    // Same proven flow as the expand test: wait for the code block to mount
    // (AnimatePresence height animation), then the absolutely-positioned
    // copy affordance inside it.
    const codeBlock = page.locator("#recipes pre code").first();
    await expect(codeBlock).toBeVisible();
    // hasText filter, not name-matching: the copy button mixes an inline SVG
    // with its label and the role-engine's name resolution intermittently
    // misses it right after the AnimatePresence mount.
    const copyBtn = page
      .locator("#recipes button")
      .filter({ hasText: /Copy HTML/i })
      .first();
    await expect(copyBtn).toBeVisible({ timeout: 10000 });
    await copyBtn.click();
    await expect(page.locator("#recipes").getByText(/^Copied!$/i).first()).toBeVisible({ timeout: 4000 });
  });
});
