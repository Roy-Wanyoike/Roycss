import { test, expect } from "@playwright/test";

/**
 * /effects/<id> detail-route content (issue #277).
 *
 * The footer.spec.ts pins only the footer landmark on detail routes; the
 * page's core content (h1 name, CSS source block, copy affordance, category
 * link) was never asserted. This spec pins the golden path on a STABLE id —
 * `hover-glow-border` (Glow Border, category "hover"), registered in
 * src/lib/effects-batch-1.ts:1068 and already exercised by footer.spec.ts,
 * so the ISR on-demand render is proven reachable.
 *
 * The category link is a real Next <Link> to /effects/category/<slug>
 * (search-targets.categoryHref, issue #198) — clicking it must land on the
 * category landing page.
 */
test.describe("effect detail route — /effects/hover-glow-border", () => {
  test.use({ permissions: ["clipboard-write"] });

  test.beforeEach(async ({ page }) => {
    await page.goto("/effects/hover-glow-border");
    // Settle: the auth-context 401 refresh cycle re-navigates within ~3s
    // (same convention as footer.spec.ts, which tests this exact route).
    await page.waitForTimeout(3000);
  });

  test("renders the effect name as the page h1", async ({ page }) => {
    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toHaveText("Glow Border");
  });

  test("renders the full CSS source block for the effect", async ({ page }) => {
    // The usage section's CodeBlock carries the effect id as its filename.
    const codeBlock = page.locator("pre code").first();
    await expect(codeBlock).toBeVisible();
    const css = (await codeBlock.innerText()).trim();
    expect(css.length, "the effect's cssCode should be non-empty").toBeGreaterThan(0);
    // The generated class matches the id (catalog-wide contract).
    expect(css).toContain(".roycss-hover-glow-border");
  });

  test("exposes a working copy affordance on the code block", async ({ page }) => {
    const copyBtn = page.getByRole("button", { name: "Copy code" }).first();
    await expect(copyBtn).toBeVisible();
    await copyBtn.click();
    // CodeBlock flips its aria-label to "Copied" on a successful write.
    await expect(page.getByRole("button", { name: "Copied" }).first()).toBeVisible({
      timeout: 4000,
    });
  });

  test("the category badge link navigates to the category landing page", async ({ page }) => {
    // Issue #297: this test was committed (PR #289) with the badge locator
    // mangled — the element type and opening attribute bracket were eaten,
    // leaving the invalid selector 'aref="…"]' which can never resolve and
    // failed the test before any click happened. The product markup is a
    // real Next <Link> (src/app/effects/[id]/page.tsx, categoryHref from
    // issue #198); only the test needed repair. The locator is now
    // role-based (a11y-first) and the href route contract is still pinned
    // via toHaveAttribute below.
    const categoryLink = page.getByRole("link", { name: /Hover Effects/i });
    await expect(categoryLink).toBeVisible();
    // categoryHref("hover") → /effects/category/hover (issue #198 route).
    await expect(categoryLink).toHaveAttribute("href", "/effects/category/hover");
    // roycss-types.categoryMeta.hover.label
    await expect(categoryLink).toHaveText(/Hover Effects/i);

    await categoryLink.click();
    await expect(page).toHaveURL(/\/effects\/category\/hover$/);
    // The landing page renders its own named heading, not a 404.
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});
