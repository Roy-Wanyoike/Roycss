import { test, expect, type Page } from "@playwright/test";

/**
 * Primary navigation — mega-menu flows, Docs link, Get Started + mobile
 * hamburger menu.
 *
 * Current menu reality (mega-header redesign):
 *   <nav aria-label="Primary navigation"> (desktop ≥lg) contains:
 *     · "Get Started" button  → scrolls to #get-started
 *     · "Explore ▾" dropdown  → menu items: Effects (#effects),
 *       Full catalog (/effects route), Recipes (#recipes),
 *       Patterns (#patterns), Collections (#collections)
 *     · "Platform ▾" dropdown → scrolls to #platform
 *     · "Docs" — a LINK to /docs/getting-started (not a button)
 *     · "FAQ" button          → scrolls to #faq
 *   Below lg the items collapse into the hamburger menu ("Open menu"),
 *   an inline panel inside the hero <header> (banner) with the same
 *   section buttons plus a Docs link.
 *
 * Section scrolls use expect.poll on the target's viewport top so the
 * long smooth scroll (the catalog grid loads ~2k cards for below-grid
 * targets) plus the nav's drift correction can settle before asserting.
 */

/** Poll until `anchor`'s top edge is at/above the sticky-header offset. */
async function expectSectionNearTop(page: Page, anchor: string) {
  await expect
    .poll(
      () =>
        page.evaluate((sel) => {
          const el = document.querySelector(sel);
          return el ? Math.round(el.getBoundingClientRect().top) : null;
        }, anchor),
      { timeout: 15_000 },
    )
    .toBeLessThan(250);
}

test.describe("primary navigation", () => {
  // Firefox interop (#258) was fixed in #263 (deep-scroll convergence via
  // scrollend settle + instant drift corrections) and #264 (mega-menu
  // fire-time pointer-zone re-verification + selection latch) — both proven
  // live on Firefox 155; the suite below now runs on the full matrix.
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    // Auth 401 refresh re-navigates the page within ~3s of first load.
    await page.waitForTimeout(3000);
  });

  test('clicking "Get Started" scrolls the page to the get-started section', async ({
    page,
  }) => {
    const nav = page.getByRole("navigation", { name: "Primary navigation" });
    const btn = nav.getByRole("button", { name: /^Get Started$/ });
    await expect(btn).toBeVisible();

    // First scroll PAST the get-started section (it sits ~9k px deep after
    // the featured/category/WebGL/carousel sections) to prove the click
    // scrolls UPWARD to it. Deterministic instant jump: a 20k-px wheel
    // gesture is smooth-ANIMATED by Gecko for seconds (Blink finishes far
    // sooner), so the old wheel+600ms read mid-flight on Firefox and
    // corrupted the before/after comparison (#258 matrix round-off).
    await page.evaluate(() =>
      window.scrollTo({ top: Number.MAX_SAFE_INTEGER, behavior: "instant" }),
    );
    await page.waitForTimeout(600);
    const beforeScrollY = await page.evaluate(() => window.scrollY);
    expect(beforeScrollY).toBeGreaterThan(0);

    await btn.click();
    await expectSectionNearTop(page, "#get-started");
    const afterScrollY = await page.evaluate(() => window.scrollY);
    expect(afterScrollY, "Get Started click should scroll the page upward").toBeLessThan(
      beforeScrollY,
    );
  });

  test('clicking "FAQ" scrolls the FAQ section into view', async ({ page }) => {
    const nav = page.getByRole("navigation", { name: "Primary navigation" });
    const btn = nav.getByRole("button", { name: /^FAQ$/ });
    await expect(btn).toBeVisible();
    await btn.click();
    await expectSectionNearTop(page, "#faq");
  });

  test('the "Explore" dropdown scrolls to #effects', async ({ page }) => {
    const nav = page.getByRole("navigation", { name: "Primary navigation" });
    const explore = nav.getByRole("button", { name: /^Explore$/ });
    await expect(explore).toBeVisible();
    await explore.click();

    const menu = page.getByRole("menu");
    await expect(menu).toBeVisible();
    await menu.getByRole("menuitem", { name: /^Effects/ }).click();

    // Selecting an item closes the dropdown.
    await expect(menu).toBeHidden();
    await expectSectionNearTop(page, "#effects");
  });

  test('the "Explore" dropdown scrolls to #recipes', async ({ page }) => {
    const nav = page.getByRole("navigation", { name: "Primary navigation" });
    await nav.getByRole("button", { name: /^Explore$/ }).click();
    await page.getByRole("menu").getByRole("menuitem", { name: /^Recipes/ }).click();
    await expectSectionNearTop(page, "#recipes");
  });

  test('the "Explore" dropdown scrolls to #patterns', async ({ page }) => {
    const nav = page.getByRole("navigation", { name: "Primary navigation" });
    await nav.getByRole("button", { name: /^Explore$/ }).click();
    await page.getByRole("menu").getByRole("menuitem", { name: /^Patterns/ }).click();
    await expectSectionNearTop(page, "#patterns");
  });

  test('the "Explore" dropdown scrolls to #collections', async ({ page }) => {
    const nav = page.getByRole("navigation", { name: "Primary navigation" });
    await nav.getByRole("button", { name: /^Explore$/ }).click();
    await page.getByRole("menu").getByRole("menuitem", { name: /^Collections/ }).click();
    await expectSectionNearTop(page, "#collections");
  });

  test('the "Explore" dropdown links "Full catalog" to the /effects route', async ({
    page,
  }) => {
    const nav = page.getByRole("navigation", { name: "Primary navigation" });
    await nav.getByRole("button", { name: /^Explore$/ }).click();
    await page
      .getByRole("menu")
      .getByRole("menuitem", { name: /^Full catalog/ })
      .click();
    // "Full catalog" is a route item — it must navigate, not scroll.
    await page.waitForURL("**/effects");
    expect(new URL(page.url()).pathname).toBe("/effects");
  });

  test('"Docs" is a link to the docs site', async ({ page }) => {
    const nav = page.getByRole("navigation", { name: "Primary navigation" });
    const docs = nav.getByRole("link", { name: "Docs" });
    await expect(docs).toBeVisible();
    await expect(docs).toHaveAttribute("href", "/docs/getting-started");
    await docs.click();
    await page.waitForURL("**/docs/getting-started");
    expect(new URL(page.url()).pathname).toBe("/docs/getting-started");
  });
});

test.describe("mobile hamburger menu", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 720 });
    await page.goto("/");
    // Auth 401 refresh re-navigates the page within ~3s of first load.
    await page.waitForTimeout(3000);
  });

  test("the hamburger button is visible on mobile and opens the menu", async ({
    page,
  }) => {
    const hamburger = page.getByRole("button", { name: "Open menu" });
    await expect(hamburger).toBeVisible();
    await hamburger.click();

    // The menu panel lives inside the hero header (banner); scope to it so
    // same-named controls deeper in the page (pricing CTAs, footer) can't
    // satisfy the assertions.
    const menu = page.getByRole("banner");
    // Opening the drawer flips the trigger to "Close menu".
    await expect(menu.getByRole("button", { name: "Close menu" })).toBeVisible();
    // The banner also contains a "Platform" nav button and an "Explore the
    // Platform" CTA — first()+exact keeps the drawer-item assertions strict
    // without tripping on those.
    await expect(menu.getByRole("button", { name: "Effects" }).first()).toBeVisible();
    await expect(menu.getByRole("button", { name: "Recipes" }).first()).toBeVisible();
    await expect(menu.getByRole("button", { name: "Patterns" }).first()).toBeVisible();
    await expect(menu.getByRole("button", { name: "Collections" }).first()).toBeVisible();
    await expect(menu.getByRole("button", { name: "Platform", exact: true }).first()).toBeVisible();
    await expect(menu.getByRole("button", { name: "FAQ" }).first()).toBeVisible();
    // "Docs" is a link in the mobile menu too (desktop nav is display:none).
    const mobileDocs = menu.getByRole("link", { name: "Docs" }).filter({
      visible: true,
    });
    await expect(mobileDocs).toHaveCount(1);
    await expect(mobileDocs).toHaveAttribute("href", "/docs/getting-started");
  });

  test("closing the menu hides the section list", async ({ page }) => {
    await page.getByRole("button", { name: "Open menu" }).click();
    const menu = page.getByRole("banner");
    await expect(menu.getByRole("button", { name: "Get Started" })).toBeVisible();

    // The button has flipped its aria-label to "Close menu".
    await page.getByRole("button", { name: "Close menu" }).click();
    // The panel unmounts (after its exit animation) — the banner-scoped
    // menu items are gone and the hamburger flips back to "Open menu".
    await expect(menu.getByRole("button", { name: "Get Started" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible();
  });

  test("tapping a section link in the mobile menu closes the menu and scrolls", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Open menu" }).click();
    await page
      .getByRole("banner")
      .getByRole("button", { name: "Effects" })
      .click();
    // The hamburger label should have flipped back to "Open menu"…
    await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible();
    // …and the Effects section should actually be on screen.
    await expectSectionNearTop(page, "#effects");
  });
});
