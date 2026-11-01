import { test, expect } from "@playwright/test";

/**
 * Issue #299 — criteria 2 & 3: keyboard skip link + deterministic hydration.
 *
 * Criterion 2 — the skip link ("Skip to effects", i18n key
 * SkipLink.skipToEffects in messages/en.json) must be the FIRST Tab stop
 * on home. roycss-page.tsx renders it as the first element inside the
 * page body, before the hero/header; nothing may steal the first tab
 * stop.
 *
 * Criterion 3 — hydration must be deterministic. The intermittent
 * first-load hydration mismatch mentioned data-animation-paused; each
 * test below loads home fresh (a brand-new browser context per test,
 * workers=1 → loads run consecutively) and collects console
 * errors/warnings + pageerror events, asserting ZERO hydration-related
 * output. Unrelated console noise (the auth-context 401 refresh, live
 * service traffic) is explicitly out of scope.
 */

// QA sandbox: the chromium_headless_shell artifact is blocked from the
// download CDN, so use the full chromium binary's new-headless mode.
// "chromium" channel resolves to the same engine on CI with all browsers
// installed — this is purely a binary-availability fallback. Top-level
// (not in a describe) because channel forces a new worker. Launch args
// are container hygiene (/dev/shm is 64MB here, no GPU) — no-ops on CI.
test.use({
  channel: "chromium",
  launchOptions: { args: ["--disable-dev-shm-usage", "--disable-gpu"] },
});

test.describe("skip link (issue #299 criterion 2)", () => {
  test("skip link is the first Tab stop on home", async ({ page }) => {
    await page.goto("/");
    // Auth 401 refresh re-navigates the page within ~3s of first load;
    // let it finish so the Tab press lands on the settled document.
    await page.waitForTimeout(3000);

    await page.keyboard.press("Tab");

    const skipLink = page.getByRole("link", { name: /skip/i });
    // tSkip("skipToEffects") → "Skip to effects" (messages/en.json) — the
    // link must exist exactly once so "first Tab stop" is unambiguous.
    await expect(skipLink).toHaveCount(1);
    const isFocused = await skipLink.evaluate(
      (el) => document.activeElement === el,
    );
    expect(
      isFocused,
      "after exactly one Tab press, document.activeElement must be the skip link",
    ).toBe(true);
  });
});

test.describe("hydration determinism (issue #299 criterion 3)", () => {
  // What counts as a hydration problem in captured console/pageerror text:
  const HYDRATION_NOISE = [
    /hydrat/i, // "Hydration failed because…", "…while hydrating…", "…hydrated but…"
    /data-animation-paused/i, // the attribute the intermittent mismatch named
    /#418|#423|#425\b/, // React minified hydration error codes
    /did not match|does not match server/i, // "Text content does not match server-rendered HTML"
  ];

  for (const load of [1, 2]) {
    test(`fresh home load #${load}: zero hydration warnings/errors`, async ({
      page,
    }) => {
      test.setTimeout(60_000);
      const problems: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error" || msg.type() === "warning") {
          problems.push(`console.${msg.type()}: ${msg.text()}`);
        }
      });
      page.on("pageerror", (err) => {
        problems.push(`pageerror: ${err.message}`);
      });

      await page.goto("/");
      // Hydration runs on first load AND on the auth-context
      // re-navigation (~3s in). The mismatch was intermittent on FIRST
      // load — wait long enough for both to settle and surface.
      await page.waitForTimeout(5000);

      const hydration = problems.filter((text) =>
        HYDRATION_NOISE.some((re) => re.test(text)),
      );
      expect(
        hydration,
        "home must hydrate deterministically — no hydration-mismatch errors (in particular none mentioning data-animation-paused)",
      ).toEqual([]);
    });
  }
});
