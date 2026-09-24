import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..", "..");
const PAGE_SRC = join(ROOT, "src/components/roycss/roycss-page.tsx");

/**
 * Issue #258 symptom 2 — Gecko deep anchor scrolls landed short.
 *
 * The Explore ▾ → #recipes/#patterns/#collections flows settled HUNDREDS of
 * px off the 72px sticky-header offset on Firefox while Chromium converged.
 * Mechanism (fixed in roycss-page.tsx's scrollToSection):
 *   1. Gecko DROPS a second smooth window.scrollTo() issued while a smooth
 *      scroll is in flight (Chromium cancels and restarts), so the old
 *      behavior:"smooth" corrective passes never applied on Firefox;
 *   2. Gecko's rAF cadence during compositor-driven smooth scrolls
 *      false-triggers the stable-frame settle detector, wasting passes.
 * Fix under test:
 *   - corrective passes use behavior:"instant" (cannot be dropped, applies
 *     within a frame, never passes behavior:"smooth");
 *   - settle detection prefers the "scrollend" event (Firefox 109+ /
 *     Chromium 127+), feature-detected via "onscrollend" in window, with
 *     the original rAF stable-frame loop kept as the fallback and as a
 *     no-op-scroll backstop (scrollend never fires when the viewport is
 *     already at the requested position);
 *   - the multi-pass re-arm loop is retained (max 8 corrections, 12s
 *     budget) and a newer nav click supersedes an in-flight loop.
 *
 * The vitest environment is `node` (no DOM, per vitest.config.ts) and
 * roycss-page.tsx is a heavy client surface, so these are source-level
 * pins — the same convention as tests/unit/theme-persistence.test.ts and
 * tests/unit/animation-pause-storage.test.ts.
 */

/** Extract the whole scrollToSection function source. */
function scrollToSectionSrc(): string {
  const src = readFileSync(PAGE_SRC, "utf8");
  const start = src.indexOf("function scrollToSection(");
  if (start === -1) throw new Error("scrollToSection not found in roycss-page.tsx");
  const end = src.indexOf("\n}\n", start);
  if (end === -1) throw new Error("scrollToSection end not found (unexpected file shape)");
  return src.slice(start, end);
}

/* ─── 1. the correction contract ─────────────────────────────────────── */

describe("scrollToSection corrective passes — instant, never smooth (#258)", () => {
  const src = scrollToSectionSrc();

  it("keeps the initial navigation scroll smooth (Chromium UX unchanged)", () => {
    expect(src).toContain(
      'window.scrollTo({ top: Math.max(0, offset), behavior: "smooth" })',
    );
  });

  it("issues corrective scrolls with behavior: 'instant'", () => {
    const passStart = src.indexOf("const correctPass = () => {");
    const passEnd = src.indexOf("const awaitSettle", passStart);
    expect(passStart, "correctPass block not found").toBeGreaterThan(-1);
    expect(passEnd, "correctPass block not terminated").toBeGreaterThan(passStart);
    const correctPass = src.slice(passStart, passEnd);
    expect(correctPass).toContain('behavior: "instant"');
    expect(correctPass).toContain("window.scrollY + drift");
  });

  it("the correction call does NOT pass behavior: 'smooth' (Gecko drops it)", () => {
    // Exactly ONE smooth scroll may exist in the whole function — the
    // initial navigation scroll. Every corrective pass must be instant.
    const smoothCount = src.split('behavior: "smooth"').length - 1;
    expect(smoothCount).toBe(1);
  });

  it("corrective scrolls re-measure drift before scrolling (fresh measurement)", () => {
    const passStart = src.indexOf("const correctPass = () => {");
    const passEnd = src.indexOf("const awaitSettle", passStart);
    const correctPass = src.slice(passStart, passEnd);
    const measure = correctPass.indexOf("target.getBoundingClientRect().top");
    const scroll = correctPass.indexOf("window.scrollTo({");
    expect(measure).toBeGreaterThan(-1);
    expect(scroll).toBeGreaterThan(measure);
  });
});

/* ─── 2. settle detection — scrollend preferred, rAF fallback kept ───── */

describe("scrollToSection settle detection — scrollend + feature-detected fallback (#258)", () => {
  const src = scrollToSectionSrc();

  it("registers a scrollend listener as the primary settle signal", () => {
    expect(src).toContain('window.addEventListener("scrollend"');
  });

  it("feature-detects scrollend via 'onscrollend' in window", () => {
    expect(src).toContain('"onscrollend" in window');
  });

  it("keeps the rAF stable-frame detector as the no-scrollend fallback", () => {
    // Backstop (scrollend branch, for no-op scrolls) + legacy fallback
    // branch: two stable-frame settle detectors in total.
    const detectors = src.split("stableFrames >= 12").length - 1;
    expect(detectors).toBe(2);
    expect(src).toContain("requestAnimationFrame(tick)");
  });

  it("removes the scrollend listener when the stable-frame backstop wins", () => {
    expect(src).toContain('window.removeEventListener("scrollend", finish)');
  });

  it("guards against double settle with an armed flag", () => {
    expect(src).toContain("let armed = true;");
    expect(src).toContain("if (!armed) return;");
  });
});

/* ─── 3. multi-pass re-arm loop retained ─────────────────────────────── */

describe("scrollToSection multi-pass drift correction loop (#258)", () => {
  const src = scrollToSectionSrc();

  it("keeps the 8-pass correction budget and 12s overall deadline", () => {
    expect(src).toContain("corrections >= 8");
    expect(src).toContain("> 12000");
  });

  it("re-arms the settle wait after every applied correction", () => {
    // Once before the loop starts, once after each corrective scroll.
    const reArms = src.split("awaitSettle(correctPass)").length - 1;
    expect(reArms).toBe(2);
  });

  it("only corrects when drift exceeds the 8px guard", () => {
    expect(src).toContain("Math.abs(drift) <= 8");
  });

  it("measures drift against the untouched 72px sticky-header offset", () => {
    const full = readFileSync(PAGE_SRC, "utf8");
    expect(full).toContain("const SCROLL_SECTION_NAV_OFFSET = 72;");
    expect(src).toContain(
      "target.getBoundingClientRect().top - SCROLL_SECTION_NAV_OFFSET",
    );
  });

  it("a newer nav click supersedes an in-flight correction loop", () => {
    const full = readFileSync(PAGE_SRC, "utf8");
    // scrollSectionEpoch is module-level — pinned against the full source.
    expect(full).toContain("let scrollSectionEpoch = 0;");
    expect(src).toContain("const epoch = ++scrollSectionEpoch;");
    expect(src).toContain("epoch !== scrollSectionEpoch");
  });
});

/* ─── 4. pre-scroll height stabilization preserved ───────────────────── */

describe("scrollToSection height stabilization (#258 context)", () => {
  it("still dispatches roycss-load-all-cards for below-grid targets", () => {
    const src = scrollToSectionSrc();
    expect(src).toContain('new CustomEvent("roycss-load-all-cards")');
    expect(src).toContain('document.querySelector("#effects")');
  });

  it("still waits two animation frames before measuring", () => {
    const src = scrollToSectionSrc();
    // Double rAF: rAF(() => { rAF(() => { … }) })
    const first = src.indexOf("requestAnimationFrame(() => {");
    const second = src.indexOf("requestAnimationFrame(() => {", first + 1);
    expect(first).toBeGreaterThan(-1);
    expect(second).toBeGreaterThan(first);
  });
});
