import { test, expect } from "@playwright/test";

/**
 * Footer — the bottom-of-page chrome.
 *
 * Golden path:
 *   1. The footer is visible and labeled as a landmark.
 *   2. The GitHub + Sponsor links have correct hrefs and `target="_blank"`.
 *   3. The footer's nav buttons (Get Started / Docs / FAQ) scroll the page.
 */
test.describe("footer", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
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

  test("the Sponsor link opens in a new tab", async ({ page }) => {
    const footer = page.getByRole("contentinfo", { name: "Site footer" });
    await footer.scrollIntoViewIfNeeded();
    const sponsorLink = footer.getByRole("link", { name: "Sponsor RoyCSS" }).first();
    await expect(sponsorLink).toBeVisible();
    await expect(sponsorLink).toHaveAttribute("target", "_blank");
    const href = await sponsorLink.getAttribute("href");
    expect(href, "Sponsor link should point at github sponsors").toMatch(/github.*sponsor/i);
  });

  test("footer exposes Get Started / Docs / FAQ scroll buttons", async ({ page }) => {
    const footer = page.getByRole("contentinfo", { name: "Site footer" });
    await footer.scrollIntoViewIfNeeded();
    await expect(footer.getByRole("button", { name: "Get Started" }).first()).toBeVisible();
    await expect(footer.getByRole("button", { name: "Docs" }).first()).toBeVisible();
    await expect(footer.getByRole("button", { name: "FAQ" }).first()).toBeVisible();
  });

  test("clicking the FAQ button scrolls the FAQ section into view", async ({ page }) => {
    const footer = page.getByRole("contentinfo", { name: "Site footer" });
    await footer.scrollIntoViewIfNeeded();
    await footer.getByRole("button", { name: "FAQ" }).first().click();
    await page.waitForTimeout(800);
    const faq = page.locator("#faq").first();
    const box = await faq.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y, "FAQ section should be near the top after click").toBeLessThan(300);
  });

  test("footer does not overflow horizontally on a mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 720 });
    await page.goto("/");
    const footer = page.getByRole("contentinfo", { name: "Site footer" });
    await footer.scrollIntoViewIfNeeded();
    const box = await footer.boundingBox();
    expect(box, "footer should have a bounding box").not.toBeNull();
    expect(box!.width, "footer should fit within the mobile viewport").toBeLessThanOrEqual(375);
  });
});
