import { test, expect } from "@playwright/test";

/**
 * Copy-CSS from the effect detail dialog (issue #277).
 *
 * The highest-value unpinned interaction: every copy e2e covered the
 * recipes/patterns sections, but the DIALOG's copy affordance (CopyAsDropdown
 * — 7 formats via the shared useCopyFormat hook) was never clicked by a test.
 *
 * Golden path:
 *   1. Open an effect card → detail dialog.
 *   2. Click the "Copy CSS in different formats" dropdown trigger.
 *   3. Pick the "CSS Class" format → the trigger flips to "Copied!" for 2s
 *      (the copied state lives on the trigger button, aria-label unchanged).
 *
 * Copy-history affordance: NOT in the dialog — it is the global navbar
 * "Developer tools" menu item (CopyHistorySheet, w-72 dropdown). The sheet
 * is pinned too: it opens with its empty state, because pushToCopyHistory
 * is currently imported but never called by any copy path (product gap,
 * noted in the PR) — asserting a populated history here would fail today.
 *
 * Clipboard permissions mirror recipes.spec.ts: clipboard-write keeps the
 * headless golden path working through the shared clipboard helper.
 */
test.describe("effect detail dialog — copy CSS", () => {
  test.use({
    permissions: ["clipboard-write"],
    viewport: { width: 1440, height: 900 }, // xl (≥1280): the tools menu is visible
  });

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Settle: the auth-context 401 refresh cycle re-navigates within ~3s
    // (same convention as effects-grid.spec.ts / recipes.spec.ts).
    await page.waitForTimeout(3000);
    // Scroll the effects section into view so the grid window renders cards.
    await page.locator("#effects").scrollIntoViewIfNeeded();
    await page.getByRole("button", { name: /Opens the effect details/ }).first().waitFor({
      timeout: 15_000,
    });
  });

  test("copying CSS from the detail dialog flips the Copy affordance to Copied!", async ({
    page,
  }) => {
    const firstCard = page.getByRole("button", { name: /Opens the effect details/ }).first();
    // Activate via keyboard: the card's real trigger button is layered UNDER
    // the preview/info chrome (issue #216 z-0 pattern), so at viewports where
    // the element center lands on the relative-positioned preview area a
    // mouse click is hit-test-intercepted. Focus+Enter exercises the same
    // onClick deterministically at any viewport.
    await firstCard.focus();
    await page.keyboard.press("Enter");

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // The dialog's copy affordance is the CopyAsDropdown trigger.
    const copyTrigger = dialog.locator('button[aria-label="Copy CSS in different formats"]');
    await expect(copyTrigger).toBeVisible();
    await expect(copyTrigger).toHaveText(/Copy/);

    // Open the dropdown and copy in the first (default) format.
    await copyTrigger.click();
    const menuItem = page.getByRole("menuitem", { name: /CSS Class/ }).first();
    await expect(menuItem).toBeVisible();
    await menuItem.click();

    // The trigger flips to the copied state (2s window) after the clipboard
    // write resolves — the same contract the recipes section pins.
    await expect(copyTrigger).toHaveText(/Copied!/, { timeout: 4000 });

    // The dialog is still open and functional after copying.
    await expect(dialog).toBeVisible();
    const codeBlock = dialog.locator("pre code").first();
    await expect(codeBlock).toBeVisible();
  });

  test("copy-history affordance opens the Copy History sheet (navbar tools menu)", async ({
    page,
  }) => {
    // The affordance lives in the navbar "Developer tools" dropdown, not in
    // the dialog itself (checked: effect-detail-dialog.tsx renders no history
    // control; roycss-page.tsx:2053 wires the menu item to CopyHistorySheet).
    const toolsBtn = page.getByRole("button", { name: "Developer tools" });
    await expect(toolsBtn).toBeVisible();
    await toolsBtn.click();

    const historyItem = page.getByRole("menuitem", { name: /Copy History/ });
    await expect(historyItem).toBeVisible();
    await historyItem.click();

    // CopyHistorySheet renders as a side sheet (role=dialog) with its title.
    const sheet = page.getByRole("dialog");
    await expect(sheet).toBeVisible();
    await expect(sheet.getByText("Copy History")).toBeVisible();
    // Empty state: no copy path currently pushes into the history store, so
    // the sheet always opens with "No copies yet" (honest pin, see file doc).
    await expect(sheet.getByText("No copies yet")).toBeVisible();
  });
});
