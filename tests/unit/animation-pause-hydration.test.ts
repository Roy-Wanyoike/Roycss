import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  ANIMATION_PAUSED_ATTR,
  HYDRATION_RETRY_INTERVAL_MS,
  HYDRATION_RETRY_MAX_ATTEMPTS,
  REACT_FIBER_EXPANDO_PREFIX,
  isReactOwned,
  pauseActionFor,
} from "@/components/roycss/animation-pauser-policy";

const ROOT = join(__dirname, "..", "..");
const PAUSER_SRC = join(ROOT, "src/components/roycss/animation-pauser.tsx");
const TOGGLE_SRC = join(ROOT, "src/components/roycss/pause-animations-toggle.tsx");
const LAYOUT_SRC = join(ROOT, "src/app/layout.tsx");

/**
 * Issue #299 — intermittent `data-animation-paused` hydration mismatch.
 *
 * Mechanism: with streaming SSR + selective hydration, AnimationPauser's
 * mount effect can run while later Suspense boundaries (next/dynamic
 * sections with ssr:true) still show UNhydrated server HTML. The old
 * initial pass stamped `data-animation-paused="true"` onto every
 * `[class*='roycss-']` element — including the effect-showcase grid's
 * LivePreview/TextPreview spans inside not-yet-hydrated boundaries. When
 * React hydrated those boundaries, it reconciled server HTML that no
 * longer matched what it would render — the mismatch report surfaced on
 * the featured TextPreview span (the only text difference between the
 * server snapshot and the live DOM was the pauser's own attribute).
 *
 * Fix contract (deterministic first render; post-mount application):
 *   1. React markup NEVER renders the attribute — AnimationPauser renders
 *      null; the server HTML is the deterministic default (running).
 *   2. The initial observe() sweep is deferred behind a double rAF, so no
 *      writes happen during the hydration window.
 *   3. Stamping is gated on React OWNERSHIP (`__reactFiber$*` expando —
 *      react-dom attaches it to every host element it creates/hydrates).
 *      Unclaimed nodes are retried on a bounded timer, never mutated
 *      pre-hydration.
 *   4. The persisted site-wide pause preference keeps its existing
 *      hydration-safe contract: the layout init script applies
 *      `data-animations-paused` to <html> pre-paint (outside React), and
 *      PauseAnimationsToggle reads it back post-mount via rAF.
 *
 * The policy module is DOM-free (ownership injected as a predicate), so
 * the stamp/unstamp/skip matrix is tested with plain objects.
 */

/* ─── 1. ownership policy (real logic) ───────────────────────────────── */

describe("animation-pauser-policy — React ownership gate (#299)", () => {
  it("detects react-dom's __reactFiber$ expando (claimed element)", () => {
    const claimed = { [`${REACT_FIBER_EXPANDO_PREFIX}abc123`]: {} };
    expect(isReactOwned(claimed)).toBe(true);
  });

  it("unclaimed elements (server HTML not yet hydrated) have no fiber expando", () => {
    const unclaimed = { class: "roycss-pulse-glow", dataset: {} };
    expect(isReactOwned(unclaimed)).toBe(false);
  });

  it("off-screen + owned → stamp (freeze animations)", () => {
    const el = { [`${REACT_FIBER_EXPANDO_PREFIX}x`]: {} };
    expect(pauseActionFor(el, false)).toBe("stamp");
  });

  it("off-screen + NOT owned → skip (never mutate pre-hydration server HTML)", () => {
    const el = { class: "roycss-text-preview" };
    expect(pauseActionFor(el, false)).toBe("skip");
  });

  it("on-screen → unstamp regardless of ownership (safe no-op pre-hydration)", () => {
    const claimed = { [`${REACT_FIBER_EXPANDO_PREFIX}x`]: {} };
    const unclaimed = {};
    expect(pauseActionFor(claimed, true)).toBe("unstamp");
    expect(pauseActionFor(unclaimed, true)).toBe("unstamp");
  });

  it("accepts an injected ownership predicate for tests/odd embedders", () => {
    const el = {};
    expect(pauseActionFor(el, false, true)).toBe("stamp");
    expect(pauseActionFor(el, false, false)).toBe("skip");
  });

  it("the pause attribute is distinct from the site-wide pause attribute", () => {
    // data-animation-paused (singular, per-element, this component) vs
    // data-animations-paused (plural, on <html>, Pause animations toggle).
    expect(ANIMATION_PAUSED_ATTR).toBe("data-animation-paused");
    expect(ANIMATION_PAUSED_ATTR).not.toBe("data-animations-paused");
  });

  it("the retry budget is bounded", () => {
    expect(HYDRATION_RETRY_INTERVAL_MS).toBeGreaterThanOrEqual(250);
    expect(HYDRATION_RETRY_MAX_ATTEMPTS).toBeGreaterThanOrEqual(5);
    expect(HYDRATION_RETRY_MAX_ATTEMPTS).toBeLessThanOrEqual(60);
  });
});

/* ─── 2. AnimationPauser (source-level pins) ─────────────────────────── */

describe("AnimationPauser — hydration-safe stamping (#299)", () => {
  const src = readFileSync(PAUSER_SRC, "utf8");

  it("renders null — the SSR markup never carries the pause attribute", () => {
    expect(src).toContain("return null;");
    expect(src).not.toMatch(/<\w+[^>]*data-animation-paused/);
  });

  it("defers the initial sweep behind a double rAF (past the hydration window)", () => {
    expect(src).toContain("requestAnimationFrame");
    const first = src.indexOf("requestAnimationFrame(() => {");
    const second = src.indexOf("requestAnimationFrame(() => {", first + 1);
    expect(first).toBeGreaterThan(-1);
    expect(second).toBeGreaterThan(first);
    expect(src).toContain("observeAll(document.body)");
  });

  it("stamps only through the ownership-gated policy", () => {
    expect(src).toContain("pauseActionFor(el, isIntersecting)");
    expect(src).toContain("isReactOwned");
    // The direct imperative write only happens for owned elements inside
    // applyAction / the ownership retry — never in the raw IO callback.
    const ioStart = src.indexOf("const io = new IntersectionObserver");
    const ioEnd = src.indexOf("const observeAll", ioStart);
    const ioBlock = src.slice(ioStart, ioEnd);
    expect(ioBlock).toContain("applyAction(");
    expect(ioBlock).not.toContain("el.dataset.animationPaused = ");
  });

  it("retries unclaimed elements on a bounded timer instead of stamping", () => {
    expect(src).toContain("pendingOwnership");
    expect(src).toContain("HYDRATION_RETRY_MAX_ATTEMPTS");
    expect(src).toContain("HYDRATION_RETRY_INTERVAL_MS");
  });

  it("keeps the MutationObserver + IntersectionObserver perf contract", () => {
    expect(src).toContain("new IntersectionObserver(");
    expect(src).toContain("new MutationObserver(");
    expect(src).toContain('rootMargin: "100px"');
    expect(src).toContain("[class*='roycss-'], [data-effect-id]");
  });

  it("cleans up observers, retries, and rAFs on unmount", () => {
    expect(src).toContain("io.disconnect()");
    expect(src).toContain("mo.disconnect()");
    expect(src).toContain("clearTimeout(retryTimer)");
  });
});

/* ─── 3. the stored pause preference stays hydration-safe (#214 tail) ── */

describe("pause preference — deterministic first render, post-mount apply", () => {
  it("the toggle renders the default state first and syncs post-mount via rAF", () => {
    const src = readFileSync(TOGGLE_SRC, "utf8");
    expect(src).toContain("useState(false)");
    // Read-only sync deferred via rAF — identical hydration output.
    expect(src).toContain("requestAnimationFrame(() => {");
    expect(src).toContain("hasAttribute(HTML_ATTR)");
    // Writes happen ONLY on user intent.
    expect(src).toContain("const toggle = () => {");
  });

  it("the pre-paint init script reads storage and only touches <html>", () => {
    const src = readFileSync(LAYOUT_SRC, "utf8");
    expect(src).toContain("roycss-animations-paused");
    expect(src).toContain("data-animations-paused");
    expect(src).toContain("document.documentElement.setAttribute");
  });

  it("the globals.css freeze rules for both attributes are pinned", () => {
    const css = readFileSync(join(ROOT, "src/app/globals.css"), "utf8");
    expect(css).toContain('[data-animation-paused="true"]');
    expect(css).toContain('html[data-animations-paused="true"] *');
  });
});
