import { test, expect } from "@playwright/test";

/**
 * Footer — the bottom-of-page chrome.
 *
 * Golden path:
 *   1. The footer is visible and labeled as a landmark.
 *   2. The GitHub link opens in a new tab with rel=noopener.
 *   3. The Sponsor control opens the sponsor dialog, whose GitHub Sponsors
 *      CTA opens in a new tab.
 *   4. The Resources column exposes Get Started / FAQ scroll buttons and a
 *      Docs route link (/docs/getting-started).
 */
test.describe("footer", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Auth 401 refresh re-navigates the page within ~3s of first load.
    await page.waitForTimeout(3000);
  });

  test("the footer is visible as a landmark", async ({ page }) => {
    const footer = page.getByRole("contentinfo", { name: "Site footer" });
    await expect(footer).toBeVisible();
    // The footer should be scrolled into view at the bottom of the page.
    await footer.scrollIntoViewIfNeeded();
    const box = await footer.boundingBox();
    expect(box, "footer should have a bounding box").not.toBeNull();
  });

  test("the GitHub link opens in a new tab with rel=noopener", async ({ page }) => {
    const footer = page.getByRole("contentinfo", { name: "Site footer" });
    await footer.scrollIntoViewIfNeeded();
    const githubLink = footer.getByRole("link", { name: "GitHub repository" }).first();
    await expect(githubLink).toBeVisible();
    await expect(githubLink).toHaveAttribute("target", "_blank");
    await expect(githubLink).toHaveAttribute("rel", /noopener/);
    const href = await githubLink.getAttribute("href");
    expect(href, "GitHub link should point at github.com").toMatch(/github\.com/i);
  });

  test("the Sponsor control opens the sponsor dialog with a GitHub Sponsors CTA", async ({
    page,
  }) => {
    const footer = page.getByRole("contentinfo", { name: "Site footer" });
    await footer.scrollIntoViewIfNeeded();
    // The footer sponsor control opens a dialog (amounts + tiers); the
    // outbound GitHub Sponsors link lives inside that dialog.
    const sponsorBtn = footer.getByRole("button", { name: "Sponsor RoyCSS" }).first();
    await expect(sponsorBtn).toBeVisible();
    await sponsorBtn.click();

    const dialog = page.getByRole("dialog", { name: "Sponsor RoyCSS" });
    await expect(dialog).toBeVisible();
    const sponsorsLink = dialog.getByRole("link", { name: /GitHub Sponsors/i });
    await expect(sponsorsLink).toBeVisible();
    await expect(sponsorsLink).toHaveAttribute("target", "_blank");
    const href = await sponsorsLink.getAttribute("href");
    expect(href, "sponsors CTA should point at github sponsors").toMatch(/github\.com\/sponsors/i);

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("footer exposes Get Started / FAQ scroll buttons and a Docs link", async ({
    page,
  }) => {
    const footer = page.getByRole("contentinfo", { name: "Site footer" });
    await footer.scrollIntoViewIfNeeded();
    await expect(footer.getByRole("button", { name: "Get Started" }).first()).toBeVisible();
    await expect(footer.getByRole("button", { name: "FAQ" }).first()).toBeVisible();
    // "Docs" is a route link now — the in-page docs sheet was retired.
    const docsLink = footer.getByRole("link", { name: "Documentation" });
    await expect(docsLink).toBeVisible();
    await expect(docsLink).toHaveAttribute("href", "/docs/getting-started");
  });

  test("clicking the FAQ button scrolls the FAQ section into view", async ({ page }) => {
    const footer = page.getByRole("contentinfo", { name: "Site footer" });
    await footer.scrollIntoViewIfNeeded();
    await footer.getByRole("button", { name: "FAQ" }).first().click();
    // The FAQ section sits above the footer; its LazySection content mounts
    // as it scrolls into view — poll for the settled position.
    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const el = document.querySelector("#faq");
            return el ? Math.round(el.getBoundingClientRect().top) : null;
          }),
        { timeout: 15_000 },
      )
      .toBeLessThan(300);
  });

  test("footer does not overflow horizontally on a mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 720 });
    await page.goto("/");
    await page.waitForTimeout(3000);
    const footer = page.getByRole("contentinfo", { name: "Site footer" });
    await footer.scrollIntoViewIfNeeded();
    const box = await footer.boundingBox();
    expect(box, "footer should have a bounding box").not.toBeNull();
    expect(box!.width, "footer should fit within the mobile viewport").toBeLessThanOrEqual(375);
  });
});

/**
 * Footer on /effects routes — regression guard for issue #242.
 *
 * The global "Site footer" moved into src/app/effects/layout.tsx, so EVERY
 * /effects route type must render EXACTLY ONE footer landmark: the index
 * (not double-rendered), an effect detail page, and a category page
 * (not missing). The footer lives in the layout, so it must be present
 * before hydration on all three.
 */
test.describe("footer on /effects routes", () => {
  const effectsRoutes = [
    { route: "/effects", label: "index" },
    { route: "/effects/hover-glow-border", label: "detail" },
    { route: "/effects/category/glass-ui", label: "category" },
  ] as const;

  for (const { route, label } of effectsRoutes) {
    test(`exactly one "Site footer" landmark on ${label} (${route})`, async ({ page }) => {
      await page.goto(route);
      // Auth 401 refresh re-navigates the page within ~3s of first load.
      await page.waitForTimeout(3000);
      // Exactly one footer in the DOM with the shared landmark label.
      await expect(page.locator('footer[aria-label="Site footer"]')).toHaveCount(1);
      const footer = page.getByRole("contentinfo", { name: "Site footer" });
      await footer.scrollIntoViewIfNeeded();
      await expect(footer).toBeVisible();
      const box = await footer.boundingBox();
      expect(box, "footer should have a bounding box").not.toBeNull();
    });
  }
});
