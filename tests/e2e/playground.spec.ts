import { test, expect } from "@playwright/test";

/**
 * Animation Playground — side panel for tweaking effect parameters.
 *
 * Golden path:
 *   1. The "Open animation playground" button opens the side panel.
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
  });

  test("opens the playground panel from the nav button", async ({ page }) => {
    const playgroundBtn = page.getByRole("button", { name: "Open animation playground" });
    // The button is hidden on extra-small viewports; force desktop width.
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(playgroundBtn).toBeVisible();
    await playgroundBtn.click();

    const panel = page.getByRole("dialog");
    await expect(panel).toBeVisible();
    await expect(panel.getByText(/Animation Playground/i)).toBeVisible();
  });

  test("shows the Generated CSS code block with non-empty content", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.getByRole("button", { name: "Open animation playground" }).click();

    const panel = page.getByRole("dialog");
    const label = panel.getByText(/Generated CSS/i);
    await expect(label).toBeVisible();

    const codeBlock = panel.locator("pre code").first();
    await expect(codeBlock).toBeVisible();
    const text = (await codeBlock.innerText()).trim();
    expect(text.length, "Generated CSS should be non-empty").toBeGreaterThan(0);
    expect(text).toContain("animation");
  });

  test("exposes a Copy CSS button", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.getByRole("button", { name: "Open animation playground" }).click();
    const copyBtn = page.getByRole("dialog").getByRole("button", { name: /Copy CSS/i }).first();
    await expect(copyBtn).toBeVisible();
  });

  test("exposes at least one slider for adjusting animation parameters", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.getByRole("button", { name: "Open animation playground" }).click();
    const panel = page.getByRole("dialog");
    // Radix Slider exposes role="slider".
    const sliders = panel.getByRole("slider");
    await expect(sliders.first()).toBeVisible();
    const count = await sliders.count();
    expect(count, "expected at least 2 sliders (duration + delay)").toBeGreaterThanOrEqual(2);
  });

  test("exposes a Replay button", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.getByRole("button", { name: "Open animation playground" }).click();
    const replayBtn = page.getByRole("dialog").getByRole("button", { name: /Replay animation/i }).first();
    await expect(replayBtn).toBeVisible();
  });

  test("closes when Escape is pressed", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.getByRole("button", { name: "Open animation playground" }).click();
    const panel = page.getByRole("dialog");
    await expect(panel).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
  });
});
