import { test, expect, type Page } from "@playwright/test";

/**
 * Locale + RTL — issue #129 PR-B (Arabic catalog + RTL chrome).
 *
 * Everything in this spec is client-side by design: the site is
 * statically prerendered with the "en" request locale (src/i18n/request.ts
 * reads NO dynamic APIs), and the stored locale is applied by the
 * pre-paint localeInitScript in src/app/layout.tsx (html lang/dir) plus
 * the LocaleProvider catalog swap (src/i18n/locale-provider.tsx).
 *
 * Seeding convention: `addInitScript` writes `roycss-locale=ar` into
 * localStorage BEFORE any navigation, so the inline init script (which
 * runs before first paint) applies lang="ar" dir="rtl" — the SSR HTML
 * still says <html lang="en">, so an observed "ar" attribute can ONLY
 * come from the pre-paint script. That is the FOUC-free contract.
 *
 * Scope: chromium project (the reference engine every dedicated spec is
 * written against, same policy as home.spec.ts) — the RTL assertions are
 * gate-run with `bunx playwright test tests/e2e/locale-rtl.spec.ts
 * --project=chromium`. Extending to the firefox/webkit matrix is a
 * follow-up once those engines are verified against this spec.
 */
test.describe("locale + RTL (issue #129 PR-B)", () => {
  // Chromium is the reference engine the dedicated specs are written
  // against (same policy as home.spec.ts); the PR-B gate runs
  // `--project=chromium`. Extending to the firefox/webkit matrix is a
  // follow-up once those engines are verified against this spec.
  test.beforeEach(() => {
    test.skip(
      test.info().project.name !== "chromium",
      "locale-rtl is a chromium-project spec (PR-B gate)",
    );
  });

  /** Seed the stored locale before ANY page script runs. */
  function seedLocale(page: Page, locale: string) {
    return page.addInitScript((value) => {
      window.localStorage.setItem("roycss-locale", value);
    }, locale);
  }

  test("stored ar applies html[lang=ar][dir=rtl] pre-paint while SSR stays en", async ({
    page,
  }) => {
    // The server-rendered document must still be the static en page —
    // no ar bleeding into SSR (static-first constraint).
    const served = await page.request.get("/");
    expect(served.ok(), "GET / should return 2xx").toBe(true);
    const html = await served.text();
    expect(html, "SSR document must keep the static en html tag").toContain(
      '<html lang="en"',
    );

    seedLocale(page, "ar");
    await page.goto("/");

    const root = page.locator("html");
    // lang="ar" in the live DOM can only come from the pre-paint init
    // script (SSR says lang="en") — i.e. correct before first paint.
    await expect(root).toHaveAttribute("lang", "ar");
    await expect(root).toHaveAttribute("dir", "rtl");
  });

  test("ar chrome strings render after the provider adopts the locale", async ({
    page,
  }) => {
    seedLocale(page, "ar");
    await page.goto("/");

    // Visible chrome: the pause-animations toggle (SiteHeader catalog).
    await expect(
      page.getByRole("button", { name: "إيقاف الحركات مؤقتًا" }),
    ).toBeVisible();

    // The language trigger re-renders with the Arabic label + code.
    await expect(
      page.getByRole("button", { name: "تغيير اللغة" }).first(),
    ).toBeVisible();

    // The skip link (roycss-page catalog) resolves through the same
    // provider — attach (not visible) because skip links are
    // focus-revealed and can be clipped until focused.
    await expect(
      page.getByRole("link", { name: "تخطَّ إلى التأثيرات" }),
    ).toBeAttached();
  });

  test("no horizontal overflow at 390px in RTL", async ({ page }) => {
    seedLocale(page, "ar");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(
      overflow.scrollWidth,
      "document must not scroll horizontally at 390px in RTL",
    ).toBe(390);
    expect(overflow.clientWidth).toBe(390);
  });

  test("site marquee plays reverse under dir=rtl", async ({ page }) => {
    seedLocale(page, "ar");
    await page.goto("/");

    // The [dir="rtl"] rule in src/app/roycss.css mirrors the batch-53
    // "marquee-rtl-safe" pattern (animation-direction: reverse over
    // direction-agnostic translateX keyframes).
    const rtlDirection = await page.evaluate(() => {
      const track = document.querySelector(".roycss-marquee-track");
      if (!track) throw new Error("site marquee track not found on /");
      return getComputedStyle(track).animationDirection;
    });
    expect(rtlDirection, "marquee track must reverse under RTL").toBe(
      "reverse",
    );
  });

  test("site marquee keeps normal direction under the default en/ltr", async ({
    page,
  }) => {
    // No seed: fresh context → static en render, html dir=ltr. The
    // primitive's inline animation-direction (normal) must survive.
    await page.goto("/");
    const ltrDirection = await page.evaluate(() => {
      const track = document.querySelector(".roycss-marquee-track");
      if (!track) throw new Error("site marquee track not found on /");
      return getComputedStyle(track).animationDirection;
    });
    expect(ltrDirection, "marquee track stays normal under LTR").toBe("normal");
  });

  test("the LanguageToggle switches to Arabic live and persists", async ({
    page,
  }) => {
    await page.goto("/");

    // Two toggles render on home (site header + mega header); use the
    // first. The menu lists one radio item per shipped locale.
    const trigger = page
      .getByRole("button", { name: "Change language" })
      .first();
    await expect(trigger).toBeVisible();
    await trigger.click();

    // Menu labels come from the CURRENT catalog — en at this point.
    await page.getByRole("menuitemradio", { name: "Arabic" }).click();

    // Live flip — no reload: document direction + chrome strings + storage.
    const root = page.locator("html");
    await expect(root).toHaveAttribute("lang", "ar");
    await expect(root).toHaveAttribute("dir", "rtl");
    await expect(
      page.getByRole("button", { name: "تغيير اللغة" }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "تخطَّ إلى التأثيرات" }),
    ).toBeAttached();
    const stored = await page.evaluate(() =>
      window.localStorage.getItem("roycss-locale"),
    );
    expect(stored).toBe("ar");

    // Reload: the pre-paint init script re-applies ar before first paint.
    await page.reload();
    await expect(root).toHaveAttribute("lang", "ar");
    await expect(root).toHaveAttribute("dir", "rtl");
    await expect(
      page.getByRole("button", { name: "إيقاف الحركات مؤقتًا" }),
    ).toBeVisible();
  });
});
