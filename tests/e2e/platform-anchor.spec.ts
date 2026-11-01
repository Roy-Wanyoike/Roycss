import { test, expect, type Page } from "@playwright/test";

/**
 * Issue #299 — criterion 1: mega-menu anchor navigation must land correctly
 * WITHOUT a pause-animations crutch, under a bounded lazy-mount budget.
 *
 * Scenario (worst case on purpose): from the very top of home, BEFORE any
 * below-the-fold LazySection has mounted, open the desktop mega-menu
 * (Platform ▾) and click "Playground" (href="#platform"). The jump crosses
 * the virtualized effects grid (which lazy-loads cards) and FIVE
 * LazySection wrappers (recipes, content-taxonomy, patterns, collections,
 * platform), each expanding from skeleton to real content mid-scroll.
 *
 * Acceptance bar:
 *   1. The viewport ends with #platform's top edge at the sticky-header
 *      offset (SCROLL_SECTION_NAV_OFFSET = 72px in roycss-page.tsx)
 *      ±250px — not at a stale position thousands of px away.
 *   2. The mount budget stays bounded: LazySection wrappers render
 *      skeletons until IntersectionObserver (rootMargin 400px) mounts
 *      them, one-shot (src/components/roycss/lazy-section.tsx). Sections
 *      crossed in transit legitimately mount, but the far side of the
 *      landing horizon must stay skeletons: after a ±250px landing,
 *      #faq's top is ≥ platform.top + 700 (platform minHeight) + 700
 *      (tools minHeight) > viewport (800) + rootMargin (400), so #faq
 *      must STILL be unmounted. With 7 top-level wrappers that caps
 *      simultaneously mounted sections at 6.
 *
 *      OBSERVABLE (robustness note): a LazySection wrapper <section> has
 *      no class attribute; in skeleton phase its ONLY element child is
 *      the sized placeholder `<div class="w-full" style="min-height:…">`
 *      holding the default shimmer (aria-hidden + `.animate-pulse` bar).
 *      A wrapper counts as mounted iff that skeleton signature is absent.
 *   3. No pause-animations crutch: AnimationPauser's contract is that
 *      only OFFSCREEN effect elements carry data-animation-paused="true"
 *      (globals.css neutralizes them with animation-play-state: paused
 *      !important; rootMargin 100px). If the anchor jump "wins" by
 *      freezing animations wholesale, on-screen previews inside the
 *      landed #platform section would stay paused — we assert none do
 *      once the jump settles.
 */

/** SCROLL_SECTION_NAV_OFFSET in roycss-page.tsx — sticky-header reserve. */
const NAV_OFFSET = 72;
/** Issue #299 tolerance around the landing offset. */
const TOLERANCE = 250;
/** Top-level LazySection wrappers on home, in document order. */
const LAZY_IDS = [
  "recipes",
  "content-taxonomy",
  "patterns",
  "collections",
  "platform",
  "tools",
  "faq",
];

// QA sandbox: the chromium_headless_shell artifact is blocked from the
// download CDN, so use the full chromium binary's new-headless mode.
// "chromium" channel resolves to the same engine on CI with all browsers
// installed — this is purely a binary-availability fallback. Top-level
// (not in a describe) because channel forces a new worker.
// Launch args are container hygiene: /dev/shm here is 64MB (the default
// compositor shm usage crashes the renderer mid-jump) and the sandbox
// runs without a GPU. Both are no-ops on normal CI machines.
test.use({
  channel: "chromium",
  launchOptions: { args: ["--disable-dev-shm-usage", "--disable-gpu"] },
});

test.describe("platform anchor nav (issue #299)", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    // Auth 401 refresh re-navigates the page within ~3s of first load.
    await page.waitForTimeout(3000);
  });

  /**
   * Open the desktop mega-menu (Platform ▾) and click the "Playground"
   * item — the #299 navigation path. Same trigger→menuitem pattern as
   * navigation.spec.ts's Explore dropdowns.
   */
  async function jumpViaMegaMenu(page: Page) {
    const nav = page.getByRole("navigation", { name: "Primary navigation" });
    const trigger = nav.getByRole("button", { name: /^Platform$/ });
    await expect(trigger).toBeVisible();
    await trigger.click();

    const playground = page
      .getByRole("menu")
      .getByRole("menuitem", { name: /^Playground/ });
    await expect(playground).toBeVisible();
    await playground.click();
  }

  /**
   * #platform's viewport top once the page is AT REST (two rAF frames
   * with zero scroll delta — the app's own settle heuristic), or
   * +Infinity while a scroll is still in flight. Keeps expect.poll from
   * passing on a transient mid-flight sample.
   */
  async function settledPlatformTop(page: Page): Promise<number> {
    return page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          const el = document.getElementById("platform");
          if (!el) return resolve(Number.POSITIVE_INFINITY);
          const y0 = window.scrollY;
          const top0 = Math.round(el.getBoundingClientRect().top);
          requestAnimationFrame(() =>
            requestAnimationFrame(() => {
              resolve(window.scrollY === y0 ? top0 : Number.POSITIVE_INFINITY);
            }),
          );
        }),
    );
  }

  /**
   * Mounted-vs-skeleton audit over the 7 top-level LazySection wrappers.
   * See the header comment for the skeleton signature.
   */
  async function auditLazySections(page: Page) {
    return page.evaluate((ids: string[]) => {
      const skeletonPhase = (wrapper: Element): boolean => {
        const kids = Array.from(wrapper.children);
        if (kids.length !== 1) return false;
        const only = kids[0];
        return (
          only.tagName === "DIV" &&
          only.classList.contains("w-full") &&
          /min-height/.test(only.getAttribute("style") ?? "") &&
          only.querySelector(".animate-pulse") !== null
        );
      };
      const audit: { mounted: string[]; skeleton: string[] } = {
        mounted: [],
        skeleton: [],
      };
      for (const id of ids) {
        const wrapper = document.getElementById(id);
        if (!wrapper) continue;
        (skeletonPhase(wrapper) ? audit.skeleton : audit.mounted).push(id);
      }
      return audit;
    }, LAZY_IDS);
  }

  test("mega-menu Platform → Playground lands #platform within ±250px of the sticky-header offset", async ({
    page,
  }) => {
    test.setTimeout(90_000);

    // Precondition: the jump happens BEFORE lazy sections load — every
    // wrapper is still a skeleton while the page sits at the top of home.
    const before = await auditLazySections(page);
    expect(
      before.skeleton.length,
      `precondition: all ${LAZY_IDS.length} LazySection wrappers should still be skeletons at the top of home (mounted: ${before.mounted.join(", ") || "none"})`,
    ).toBe(LAZY_IDS.length);

    await jumpViaMegaMenu(page);

    // Wait out the smooth scroll + drift-correction passes (the app caps
    // at 8 passes / 12s) and arrive inside the window.
    await expect
      .poll(() => settledPlatformTop(page), {
        timeout: 20_000,
        intervals: [250],
      })
      .toBeLessThanOrEqual(NAV_OFFSET + TOLERANCE);

    // Full bounded window on the settled sample — the poll matcher only
    // bounds the top edge, the lower bound is asserted here.
    const finalTop = await settledPlatformTop(page);
    expect(
      finalTop,
      `#platform should land at ${NAV_OFFSET}px ± ${TOLERANCE}px (sticky-header offset) — landed at ${finalTop}px`,
    ).toBeGreaterThanOrEqual(NAV_OFFSET - TOLERANCE);

    // Stale-position floor: #platform sits several thousand px below the
    // fold; a stale no-op jump leaves the page near the top.
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(
      scrollY,
      "the mega-menu jump should have actually scrolled deep into the page",
    ).toBeGreaterThan(1000);
  });

  test("bounded mount budget: far-side LazySections stay skeletons after the jump", async ({
    page,
  }) => {
    test.setTimeout(90_000);

    const before = await auditLazySections(page);
    expect(
      before.skeleton.length,
      `precondition: all ${LAZY_IDS.length} LazySection wrappers should still be skeletons at the top of home (mounted: ${before.mounted.join(", ") || "none"})`,
    ).toBe(LAZY_IDS.length);

    await jumpViaMegaMenu(page);

    // The budget is only meaningful once the jump has landed within the
    // same bounded window as the landing test above.
    await expect
      .poll(() => settledPlatformTop(page), {
        timeout: 20_000,
        intervals: [250],
      })
      .toBeLessThanOrEqual(NAV_OFFSET + TOLERANCE);
    // Give the final IntersectionObserver ticks a beat after settle.
    await page.waitForTimeout(250);

    const after = await auditLazySections(page);
    expect(
      after.mounted.length,
      `simultaneously mounted LazySections must stay under the cap of ${LAZY_IDS.length - 1} (mounted: ${after.mounted.join(", ") || "none"}; skeletons: ${after.skeleton.join(", ") || "none"})`,
    ).toBeLessThanOrEqual(LAZY_IDS.length - 1);
    expect(
      after.skeleton,
      "#faq sits ≥1400px below the landing horizon (viewport 800 + rootMargin 400) — it must still be an unmounted skeleton",
    ).toContain("faq");
  });

  test("no pause-animations crutch: on-screen previews in #platform are live after the jump", async ({
    page,
  }) => {
    test.setTimeout(90_000);

    await jumpViaMegaMenu(page);

    // Land first — the crutch check is only meaningful on the settled
    // landing position.
    await expect
      .poll(() => settledPlatformTop(page), {
        timeout: 20_000,
        intervals: [250],
      })
      .toBeLessThanOrEqual(NAV_OFFSET + TOLERANCE);

    // AnimationPauser (rootMargin 100px) must have un-paused every effect
    // element inside #platform that is on-screen after the landing. A
    // wholesale "pause everything" crutch would leave offenders behind.
    const pausedOnscreen = () =>
      page.evaluate(() => {
        const section = document.getElementById("platform");
        if (!section) return -1; // wrapper gone = setup problem, never passes
        const vh = window.innerHeight;
        let offenders = 0;
        section
          .querySelectorAll<HTMLElement>("[class*='roycss-'], [data-effect-id]")
          .forEach((el) => {
            if (el.dataset.animationPaused !== "true") return;
            const r = el.getBoundingClientRect();
            const nearViewport =
              r.width > 0 &&
              r.height > 0 &&
              r.bottom > -100 && // AnimationPauser rootMargin = 100px
              r.top < vh + 100;
            if (nearViewport) offenders += 1;
          });
        return offenders;
      });
    await expect
      .poll(pausedOnscreen, { timeout: 5_000, intervals: [250] })
      .toBe(0);
  });
});
