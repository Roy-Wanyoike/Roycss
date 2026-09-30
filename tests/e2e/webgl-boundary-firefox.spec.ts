import { test, expect } from "@playwright/test";

/**
 * Firefox WebGL-boundary regression guard (issue #277) — e2e pin of the
 * 1139cc9 fix (issue #258).
 *
 * Headless Firefox here has NO WebGL: mounting a Three.js showcase effect
 * throws "Error creating WebGL context". The 1139cc9 fix wraps the lazy
 * preview panel in a dedicated WebGLErrorBoundary that degrades to an
 * honest, accessible "needs hardware graphics acceleration" panel (with a
 * Try-again retry) while the tabs/description/CTA around it stay interactive.
 * Before that fix the failure bubbled into the GLOBAL error boundary and the
 * whole home page rendered "Something went wrong".
 *
 * Contract under test:
 *   1. The WebGL showcase either shows the graceful no-WebGL panel OR a
 *      working canvas (Canvas-2D effects genuinely run on this box) —
 *      both are acceptable; a hard crash is not.
 *   2. Tabs remain interactive (switching updates the panel + description).
 *   3. The CTA stays visible.
 *   4. The global error boundary NEVER appears.
 *
 * Firefox-scoped per the sandbox protocol (chromium is the reference engine;
 * this guard exists BECAUSE firefox lacks WebGL here).
 */
test.describe("WebGL showcase — graceful degradation on firefox", () => {
  test.beforeEach(() => {
    test.skip(
      test.info().project.name !== "firefox",
      "WebGL boundary guard is a firefox-project spec (mirrors the headless-firefox #258 environment)",
    );
  });

  test("home page survives the WebGL-less environment with an interactive showcase", async ({
    page,
  }) => {
    await page.goto("/");

    // The global error boundary (src/app/error.tsx) must NEVER appear.
    const globalError = page.getByText("Something went wrong");
    await expect(globalError).toHaveCount(0);

    // Mount the showcase's heavy lazy effect (IntersectionObserver-deferred).
    const showcase = page.locator("#webgl-effects");
    await showcase.scrollIntoViewIfNeeded();

    // Tablist renders inside ScrollReveal — wait for the first tab.
    const tablist = page.getByRole("tablist", { name: "WebGL effect selector" });
    await expect(tablist).toBeVisible({ timeout: 15_000 });

    // Default tab is the WebGL-backed "3D Tubes Cursor": on this box its
    // context creation fails → the graceful panel. Accept EITHER the
    // graceful panel OR a live canvas — never a global crash.
    //
    // NOTE: neither outcome is synchronously visible when the tablist
    // appears — the lazy Three.js chunk must load and either throw into the
    // boundary (graceful panel) or mount its <canvas>. isVisible() does not
    // auto-wait, so a naive immediate probe would race the lazy mount and
    // misread "not yet rendered" as "WebGL works". Poll BOTH outcomes until
    // one of them wins; whichever appears first is the honest result.
    const gracefulPanel = page
      .getByRole("status")
      .filter({ hasText: "hardware graphics acceleration" });
    // `string` (not a union): the poll callback assigns through a closure and
    // TS's control-flow analysis keeps the outer variable narrowed to the
    // initializer type, which would flag the branch below as impossible.
    let outcome: string = "pending";
    await expect
      .poll(
        async () => {
          if (await gracefulPanel.isVisible().catch(() => false)) {
            outcome = "graceful";
          } else if (
            await showcase
              .locator("canvas")
              .first()
              .isVisible()
              .catch(() => false)
          ) {
            outcome = "canvas";
          }
          return outcome;
        },
        { timeout: 30_000, intervals: [500] },
      )
      .not.toBe("pending");

    if (outcome === "graceful") {
      // The expected no-WebGL path: the graceful panel with its retry affordance.
      await expect(gracefulPanel).toBeVisible();
      await expect(gracefulPanel).toContainText("Try again");
    } else {
      // The environment gained WebGL: the canvas must actually be there.
      await expect(showcase.locator("canvas").first()).toBeVisible({ timeout: 15_000 });
    }
    await expect(globalError).toHaveCount(0);

    // Tabs stay interactive: switch to the Canvas-2D "Particle Network".
    const particlesTab = page.getByRole("tab", { name: "Particle Network" });
    await particlesTab.click();
    await expect(particlesTab).toHaveAttribute("aria-selected", "true");

    // The panel + description follow the active tab.
    const panel = page.locator("#webgl-effect-panel");
    await expect(panel).toBeVisible();
    await expect(
      page.getByText("100 particles float and connect with proximity lines"),
    ).toBeVisible();
    await expect(globalError).toHaveCount(0);

    // The section CTA remains interactive (scrolls back to #effects).
    const cta = page.getByRole("button", { name: /Explore .* CSS Effects/ });
    await expect(cta).toBeVisible();
    await cta.click();
    await expect(globalError).toHaveCount(0);
  });
});
