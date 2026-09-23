import { describe, expect, it } from "vitest";
import { effects } from "@/lib/roycss-effects";
import {
  DEFAULT_SPAN_COUNT,
  countSpanElements,
  getReducedMotionNote,
  getRequiredMarkup,
  usesSpanChildren,
} from "@/lib/effect-page-content";
import { getEffectPageA11yBadges } from "@/lib/effect-a11y-badges";

/**
 * Issue #190 — required-markup block + reduced-motion note + full a11y
 * badge row for /effects/[id].
 *
 * The audit (task 9-c) found: 57 effects declare childCount, 81 more
 * reference child <span> selectors without declaring it (e.g. text-wave
 * needs 6 spans, the page showed none), and no effect page carried a
 * reduced-motion note. These tests pin the pure derivations.
 */
const byId = (id: string) => effects.find((e) => e.id === id)!;

describe("usesSpanChildren", () => {
  it("detects span element selectors", () => {
    expect(usesSpanChildren(".x > span { color: red; }")).toBe(true);
    expect(usesSpanChildren("span.foo { color: red; }")).toBe(true);
    expect(usesSpanChildren(".x span:hover { color: red; }")).toBe(true);
    expect(usesSpanChildren("/* a span lives here */\n.x { color: red; }")).toBe(false);
  });

  it("never flags grid/span keyword declarations or hyphenated tokens", () => {
    // grid-column span keyword + span-inline-end logical property value.
    expect(usesSpanChildren(".x { grid-column: 2 / span 2; }")).toBe(false);
    expect(usesSpanChildren(".x { position-area: span-inline-end; }")).toBe(false);
  });
});

describe("getRequiredMarkup", () => {
  it("returns null when the CSS needs no special markup", () => {
    expect(getRequiredMarkup(byId("pulse-glow"))).toBeNull();
    expect(getRequiredMarkup(byId("btn-glow"))).toBeNull();
  });

  it("uses the declared childCount verbatim (loader-dots → 3)", () => {
    const markup = getRequiredMarkup(byId("loader-dots"))!;
    expect(markup.spanCount).toBe(3);
    expect(markup.exact).toBe(true);
    expect(markup.snippet).toBe(
      '<div class="roycss-loader-dots">\n  <span></span>\n  <span></span>\n  <span></span>\n</div>'
    );
  });

  it("derives the span count from nth-child indices (text-wave → 6)", () => {
    const markup = getRequiredMarkup(byId("text-wave"))!;
    expect(markup.spanCount).toBe(6);
    expect(markup.exact).toBe(true);
    expect(markup.snippet.split("<span></span>").length - 1).toBe(6);
    expect(markup.snippet).toContain('<div class="roycss-text-wave">');
  });

  it("marks group-styled spans as illustrative with the default count", () => {
    // CSS styles every child span but pins no exact count.
    const css = ".roycss-x > span { display: inline-block; }";
    const markup = getRequiredMarkup({ id: "x", childCount: undefined, cssCode: css });
    expect(markup).not.toBeNull();
    expect(markup!.exact).toBe(false);
    expect(markup!.spanCount).toBe(DEFAULT_SPAN_COUNT);
    expect(markup!.snippet).toContain("<!-- Any number of <span> children works");
  });

  it("covers childCount effects even when the CSS targets `> *`", () => {
    const markup = getRequiredMarkup(byId("physics-bounce-chain"))!;
    expect(markup.spanCount).toBe(5);
    expect(markup.exact).toBe(true);
  });

  it("honors authored structured requiredMarkup verbatim (issue #215)", () => {
    // nav-drawer-slide: <aside> + data-open state, NOT a div of bare spans.
    const drawer = getRequiredMarkup(byId("nav-drawer-slide"))!;
    expect(drawer.exact).toBe(true);
    expect(drawer.intro).toBeDefined();
    expect(drawer.snippet).toContain('<aside class="roycss-nav-drawer-slide" data-open="false">');
    expect(drawer.snippet).toContain("<span>Home</span>");
    expect(drawer.snippet).not.toContain("<div");

    // nav-hamburger-morph: a real <button> with aria state.
    const burger = getRequiredMarkup(byId("nav-hamburger-morph"))!;
    expect(burger.snippet).toContain('<button class="roycss-nav-hamburger-morph"');
    expect(burger.snippet).toContain('aria-expanded="false"');
    expect(burger.snippet).toContain('aria-label="Open menu"');
    expect(burger.spanCount).toBe(3);

    // media-compare-wipe: <figure> + 2 <img> — no spans at all.
    const wipe = getRequiredMarkup(byId("media-compare-wipe"))!;
    expect(wipe.snippet).toContain("<figure");
    expect(wipe.snippet).toContain('<img src="after.jpg" alt="After">');
    expect(wipe.snippet).toContain('<img src="before.jpg" alt="Before">');
    expect(wipe.spanCount).toBe(0);

    // media-lightbox-zoom: the :target overlay is a second element.
    const lightbox = getRequiredMarkup(byId("media-lightbox-zoom"))!;
    expect(lightbox.snippet).toContain('class="roycss-media-lightbox-zoom-overlay" id="img-1"');
    expect(lightbox.snippet).toContain('aria-label="Close"');
    expect(lightbox.spanCount).toBe(1);
  });

  it("CATALOG PIN: 78 childCount + 77 span-css + 1 structured = 156 with markup", () => {
    const withChildCount = effects.filter((e) => (e.childCount ?? 0) > 0);
    expect(withChildCount.length).toBe(78);
    const spanNoChildCount = effects.filter(
      (e) => !e.childCount && !e.requiredMarkup && usesSpanChildren(e.cssCode)
    );
    expect(spanNoChildCount.length).toBe(77);
    // #215: exactly one structural effect needs markup WITHOUT any spans:
    const structuredNoSpans = effects.filter(
      (e) => e.requiredMarkup && (e.childCount ?? 0) === 0 && !usesSpanChildren(e.cssCode)
    );
    expect(structuredNoSpans.map((e) => e.id)).toEqual(["media-compare-wipe"]);
    const withMarkup = effects.filter((e) => getRequiredMarkup(e) !== null);
    expect(withMarkup.length).toBe(156);
  });

  it("every effect with markup yields an exact snippet whose <span> count matches", () => {
    for (const effect of effects) {
      const markup = getRequiredMarkup(effect);
      if (!markup) continue;
      expect(markup.snippet, effect.id).toContain(`roycss-${effect.id}`);
      // Count <span> ELEMENTS (structured snippets carry labelled spans).
      expect(countSpanElements(markup.snippet), effect.id).toBe(markup.spanCount);
      if (markup.exact) expect(markup.snippet, effect.id).not.toContain("Any number of");
    }
  });
});

describe("getReducedMotionNote", () => {
  it("returns null for non-animated CSS", () => {
    expect(getReducedMotionNote(".x:hover { color: red; }", false)).toBeNull();
  });

  it("notes the missing guard for animated, non-motion-safe effects", () => {
    const note = getReducedMotionNote(
      ".x { animation: roy-x 2s infinite; } @keyframes roy-x { to { opacity: 0; } }",
      false
    );
    expect(note).toContain("prefers-reduced-motion");
    expect(note).toContain("no-preference");
  });

  it("credits effects that ship their own guard", () => {
    const css = "@media (prefers-reduced-motion: reduce) { .x { animation: none; } }";
    const note = getReducedMotionNote(css, true);
    expect(note).toContain("ships its own");
  });

  it("detects animation-name without @keyframes too", () => {
    expect(getReducedMotionNote(".x { animation-name: spin; }", false)).not.toBeNull();
  });
});

describe("getEffectPageA11yBadges (page row)", () => {
  it("fails closed for unknown ids", () => {
    expect(getEffectPageA11yBadges("definitely-not-an-effect-id")).toEqual([]);
  });

  it("shows Motion-safe for guarded effects instead of Motion-caution", () => {
    // Find a motion-safe effect from the generated tags.
    const guarded = effects.find(
      (e) => getEffectPageA11yBadges(e.id).some((b) => b.key === "motion-safe")
    );
    expect(guarded).toBeDefined();
    const badges = getEffectPageA11yBadges(guarded!.id);
    expect(badges[0]).toMatchObject({ key: "motion-safe", tone: "positive" });
    expect(badges.some((b) => b.key === "motion-caution")).toBe(false);
  });

  it("labels interactive (non-decorative) effects as Interactive", () => {
    const interactive = effects.find(
      (e) => getEffectPageA11yBadges(e.id).some((b) => b.key === "interactive")
    );
    expect(interactive).toBeDefined();
    const badges = getEffectPageA11yBadges(interactive!.id);
    expect(badges.some((b) => b.key === "decorative")).toBe(false);
    expect(badges.find((b) => b.key === "interactive")!.label).toBe("Interactive");
  });

  it("keeps the A11y note last with the shared guidance text", () => {
    const badges = getEffectPageA11yBadges("text-gradient");
    expect(badges[badges.length - 1]).toMatchObject({
      key: "a11y-note",
      tone: "violet",
    });
    expect(badges[badges.length - 1].title).toContain("background-clip: text");
  });

  it("emits 2–3 badges for every known effect, in the fixed order", () => {
    for (const effect of effects) {
      const badges = getEffectPageA11yBadges(effect.id);
      expect(badges.length, effect.id).toBeGreaterThanOrEqual(2);
      expect(badges.length, effect.id).toBeLessThanOrEqual(3);
      // First badge is always the motion-safety verdict.
      expect(["motion-safe", "motion-caution"], effect.id).toContain(badges[0].key);
      // Second badge is always the semantics verdict.
      expect(["decorative", "interactive"], effect.id).toContain(badges[1].key);
    }
  });
});
