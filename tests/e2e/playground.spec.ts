import { test, expect } from "@playwright/test";

/**
 * Animation Playground — side panel for tweaking effect parameters.
 *
 * Golden path:
 *   1. The "Developer tools" nav dropdown exposes a "Playground" item that
 *      opens the side panel (the old dedicated home toolbar button is gone;
 *      all 70 tools now live under the Developer tools menu).
 *   2. The panel exposes a "Generated CSS" code block (non-empty).
 *   3. The Copy CSS button is present and clickable.
 *   4. The Replay button is present (so users can re-trigger animations).
 *
 * Sliders use Radix Slider which exposes role="slider" — we assert that
 * at least one slider is rendered, but don't try to drag it (Playwright's
 * drag on Radix sliders is flaky).
 */
test.describe("animation playground", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Settle: the auth-context 401 refresh cycle re-navigates within ~3s.
    await page.waitForTimeout(3000);
    await page.getByRole("button", { name: "Developer tools" }).click();
    await page.getByRole("menuitem", { name: "Playground" }).click();
  });

  test("opens the playground panel from the nav button", async ({ page }) => {
    const panel = page.getByRole("dialog");
    await expect(panel).toBeVisible();
    await expect(panel.getByText(/Animation Playground/i)).toBeVisible();
  });

  test("shows the Generated CSS code block with non-empty content", async ({ page }) => {
    const panel = page.getByRole("dialog");
    // exact: the sheet description also mentions "generated CSS" in passing.
    const label = panel.getByText("Generated CSS", { exact: true });
    await expect(label).toBeVisible();

    const codeBlock = panel.locator("pre code").first();
    await expect(codeBlock).toBeVisible();
    const text = (await codeBlock.innerText()).trim();
    expect(text.length, "Generated CSS should be non-empty").toBeGreaterThan(0);
    expect(text).toContain("animation");
  });

  test("exposes a Copy CSS button", async ({ page }) => {
    const copyBtn = page.getByRole("dialog").getByRole("button", { name: /Copy CSS/i }).first();
    await expect(copyBtn).toBeVisible();
  });

  test("exposes at least one slider for adjusting animation parameters", async ({ page }) => {
    const panel = page.getByRole("dialog");
    // Radix Slider exposes role="slider".
    const sliders = panel.getByRole("slider");
    await expect(sliders.first()).toBeVisible();
    const count = await sliders.count();
    expect(count, "expected at least 2 sliders (duration + delay)").toBeGreaterThanOrEqual(2);
  });

  test("exposes a Replay button", async ({ page }) => {
    const replayBtn = page.getByRole("dialog").getByRole("button", { name: /Replay animation/i }).first();
    await expect(replayBtn).toBeVisible();
  });

  test("closes when Escape is pressed", async ({ page }) => {
    const panel = page.getByRole("dialog");
    await expect(panel).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
  });
});
