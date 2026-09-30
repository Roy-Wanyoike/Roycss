import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FilterStudio } from "@/components/roycss/filter-studio";
import { AnimationTimeline } from "@/components/roycss/animation-timeline";
import { SpacingScaleGenerator } from "@/components/roycss/spacing-scale-generator";
import { FlexboxVisualizer } from "@/components/roycss/flexbox-visualizer";
import { BoxShadowGenerator } from "@/components/roycss/box-shadow-generator";
import { TransformStudio } from "@/components/roycss/transform-studio";
import { CSSGridGenerator } from "@/components/roycss/grid-generator";
import { CSSVariableManager } from "@/components/roycss/variable-manager";
import { ColorShadeGenerator } from "@/components/roycss/color-shade-generator";
import { ColorPaletteGenerator } from "@/components/roycss/palette-generator";
import { FontPreviewTool } from "@/components/roycss/font-preview-tool";
import { ClipPathGenerator } from "@/components/roycss/clip-path-generator";
import { CSSGradientGenerator } from "@/components/roycss/gradient-generator";
import { BorderRadiusVisualizer } from "@/components/roycss/border-radius-visualizer";
import { EasingVisualizer } from "@/components/roycss/tools/easing-visualizer";
import { Slider } from "@/components/ui/slider";

/**
 * Tools UX pass (issues #269 + #271), pinned at two levels mirroring the
 * repo's established test rigor (cf. clipboard-fallback.test.ts):
 *
 *   1. render-based — every tool sheet that renders without props is
 *      server-rendered and EVERY <input>/<select> in the markup must carry
 *      an accessible name (aria-label), plus exact assertions on the named
 *      worst offenders (filter-studio's 8 sliders, transform-studio's 11).
 *
 *   2. source-level wiring — all 15 silent clipboard catch sites from issue
 *      #271 (+ 3 same-class sites discovered during the sweep in files the
 *      a11y half already touches: gradient-generator, border-radius-
 *      visualizer, comparison-panel, easing-visualizer) route through
 *      copyTextToClipboard with the full failure contract from PR #261
 *      (visible "Copy failed — press Ctrl+C / ⌘C" state, aria-live polite
 *      status region, selectElementText on the rendered payload where a
 *      <code> ref exists, auto-reset 2000/4000ms), the docs CTA retarget,
 *      and the ⌘K-on-/effects decision.
 */

const ROOT = join(__dirname, "..", "..");
const src = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

/* ─── helpers ───────────────────────────────────────────────── */

/** Extract self-closing JSX <input> tags (multi-line safe). */
function inputTags(source: string): string[] {
  return source.match(/<input\b[\s\S]*?\/>/g) ?? [];
}

/** Rendered-HTML <input …/> tags (handlers are not serialized). */
function htmlInputTags(html: string): string[] {
  return html.match(/<input\b[^>]*\/>/g) ?? [];
}

function htmlSelectOpenTags(html: string): string[] {
  return html.match(/<select\b[^>]*>/g) ?? [];
}

const hasAriaLabel = (tag: string) =>
  /\b(?:aria-label|aria-labelledby)=/.test(tag);

/* ─── 1. Render-based: zero unlabeled form controls ─────────── */

describe("rendered tool sheets: every input/select has an accessible name (issue #269)", () => {
  const cases: Array<[string, () => ReactElement]> = [
    ["FilterStudio", () => createElement(FilterStudio)],
    ["AnimationTimeline", () => createElement(AnimationTimeline)],
    ["SpacingScaleGenerator", () => createElement(SpacingScaleGenerator)],
    ["FlexboxVisualizer", () => createElement(FlexboxVisualizer)],
    ["BoxShadowGenerator", () => createElement(BoxShadowGenerator)],
    ["TransformStudio", () => createElement(TransformStudio)],
    ["CSSGridGenerator", () => createElement(CSSGridGenerator)],
    ["CSSVariableManager", () => createElement(CSSVariableManager)],
    ["ColorShadeGenerator", () => createElement(ColorShadeGenerator)],
    ["ColorPaletteGenerator", () => createElement(ColorPaletteGenerator)],
    ["FontPreviewTool", () => createElement(FontPreviewTool)],
    ["ClipPathGenerator", () => createElement(ClipPathGenerator)],
    ["CSSGradientGenerator", () => createElement(CSSGradientGenerator)],
    ["BorderRadiusVisualizer", () => createElement(BorderRadiusVisualizer)],
    ["EasingVisualizer", () => createElement(EasingVisualizer)],
  ];

  for (const [name, el] of cases) {
    it(`${name}: no unlabeled <input>/<select> in the SSR markup`, () => {
      const html = renderToStaticMarkup(el());
      const inputs = htmlInputTags(html);
      const selects = htmlSelectOpenTags(html);
      expect(inputs.length + selects.length).toBeGreaterThan(0);
      for (const tag of [...inputs, ...selects]) {
        // Skip Radix Slider's internal BubbleInput (<input style="display:none">):
        // form-sync plumbing, never exposed to users or AT.
        if (/display:\s*none/.test(tag)) continue;
        // aria-label/aria-labelledby directly, or id= — the id+htmlFor
        // association (easing-visualizer's bezier controls) is not visible
        // in static markup and is verified at source level below.
        expect(hasAriaLabel(tag) || /\bid=/.test(tag), `unlabeled control: ${tag}`).toBe(true);
      }
    });
  }

  it("every id-labeled input across the rendered sheets has a matching htmlFor label", () => {
    const sources = [
      "src/components/roycss/filter-studio.tsx",
      "src/components/roycss/animation-timeline.tsx",
      "src/components/roycss/spacing-scale-generator.tsx",
      "src/components/roycss/flexbox-visualizer.tsx",
      "src/components/roycss/box-shadow-generator.tsx",
      "src/components/roycss/transform-studio.tsx",
      "src/components/roycss/grid-generator.tsx",
      "src/components/roycss/variable-manager.tsx",
      "src/components/roycss/color-shade-generator.tsx",
      "src/components/roycss/palette-generator.tsx",
      "src/components/roycss/font-preview-tool.tsx",
      "src/components/roycss/clip-path-generator.tsx",
      "src/components/roycss/gradient-generator.tsx",
      "src/components/roycss/border-radius-visualizer.tsx",
      "src/components/roycss/tools/easing-visualizer.tsx",
    ];
    for (const file of sources) {
      const source = src(file);
      const inputIds = inputTags(source)
        .map((t) => t.match(/\bid="([^"]+)"/)?.[1])
        .filter((v): v is string => Boolean(v));
      const htmlForValues = new Set(
        source.match(/htmlFor="([^"]+)"/g)?.map((h) => h.slice(9, -1)) ?? [],
      );
      for (const id of inputIds) {
        expect(htmlForValues.has(id), `${file}: input id="${id}" has no htmlFor label`).toBe(true);
      }
    }
  });

  it("FilterStudio: the 8 filter sliders have their visible labels as accessible names", () => {
    const html = renderToStaticMarkup(createElement(FilterStudio));
    const ranges = htmlInputTags(html).filter((t) => /type="range"/.test(t));
    expect(ranges).toHaveLength(8);
    const labels = ranges.map((t) => t.match(/aria-label="([^"]+)"/)?.[1]);
    expect(labels).toEqual([
      "Blur",
      "Brightness",
      "Contrast",
      "Grayscale",
      "Hue Rotate",
      "Invert",
      "Saturate",
      "Sepia",
    ]);
  });

  it("TransformStudio: all 11 transform sliders are labeled with their visible labels", () => {
    const html = renderToStaticMarkup(createElement(TransformStudio));
    const ranges = htmlInputTags(html).filter((t) => /type="range"/.test(t));
    expect(ranges).toHaveLength(11);
    for (const expected of [
      "Perspective",
      "Translate X",
      "Translate Y",
      "Translate Z",
      "Rotate X",
      "Rotate Y",
      "Rotate Z",
      "Scale X",
      "Scale Y",
      "Skew X",
      "Skew Y",
    ]) {
      expect(ranges.some((t) => t.includes(`aria-label="${expected}"`))).toBe(
        true,
      );
    }
  });

  it("BorderRadiusVisualizer: linked mode labels the single slider 'All corners'", () => {
    const html = renderToStaticMarkup(createElement(BorderRadiusVisualizer));
    const ranges = htmlInputTags(html).filter((t) => /type="range"/.test(t));
    expect(ranges).toHaveLength(1);
    expect(ranges[0]).toContain('aria-label="All corners"');
  });

  it("ColorPaletteGenerator: base-hue slider is labeled", () => {
    const html = renderToStaticMarkup(createElement(ColorPaletteGenerator));
    const ranges = htmlInputTags(html).filter((t) => /type="range"/.test(t));
    expect(ranges).toHaveLength(1);
    expect(ranges[0]).toContain('aria-label="Base Hue (degrees)"');
  });
});

/* ─── 2. Source pins: every range input in the named files ──── */

describe("source pins: every <input type=range> in the issue-#269 files is labeled", () => {
  // easing-visualizer's range is programmatically labeled the other repo
  // way: id + <label htmlFor>. The demo checkbox in browser-capability-lab
  // is wrapped in a <label> with visible text ("Toggle me") — the third
  // valid association form.
  const FILES = [
    "src/components/roycss/filter-studio.tsx",
    "src/components/roycss/spacing-scale-generator.tsx",
    "src/components/roycss/gradient-generator.tsx",
    "src/components/roycss/transform-studio.tsx",
    "src/components/roycss/grid-generator.tsx",
    "src/components/roycss/flexbox-visualizer.tsx",
    "src/components/roycss/border-radius-visualizer.tsx",
    "src/components/roycss/comparison-panel.tsx",
    "src/components/roycss/palette-generator.tsx",
    "src/components/roycss/font-preview-tool.tsx",
    "src/components/roycss/tools/easing-visualizer.tsx",
    "src/components/roycss/tools/browser-capability-lab.tsx",
  ];

  for (const file of FILES) {
    it(`${file}: every range input carries aria-label (or id+htmlFor label)`, () => {
      const ranges = inputTags(src(file)).filter((t) =>
        /type="range"/.test(t),
      );
      expect(ranges.length).toBeGreaterThan(0);
      for (const tag of ranges) {
        const labeled = hasAriaLabel(tag) || /\bid=/.test(tag);
        expect(labeled, `unlabeled range: ${tag}`).toBe(true);
      }
    });
  }

  it("easing-visualizer: the duration range keeps its id+htmlFor label association", () => {
    const source = src("src/components/roycss/tools/easing-visualizer.tsx");
    expect(source).toContain('id="bezier-duration"');
    expect(source).toContain('htmlFor="bezier-duration"');
  });

  it("browser-capability-lab: the only unlabeled-by-aria input is the label-wrapped demo checkbox", () => {
    const tags = inputTags(
      src("src/components/roycss/tools/browser-capability-lab.tsx"),
    );
    for (const tag of tags) {
      const ok = hasAriaLabel(tag) || /\bid=/.test(tag) || /type="checkbox"/.test(tag);
      expect(ok, `unlabeled control: ${tag}`).toBe(true);
    }
    expect(tags.some((t) => /type="checkbox"/.test(t))).toBe(true);
  });

  it("comparison-panel: the effect-picker search input is labeled (was placeholder-only)", () => {
    const source = src("src/components/roycss/comparison-panel.tsx");
    expect(source).toContain('aria-label="Search effects to compare"');
  });

  it("playground-panel: Radix sliders/selects carry aria-labels (Sheet closed in SSR)", () => {
    const source = src("src/components/roycss/playground-panel.tsx");
    expect(source).toContain('aria-label="Duration (seconds)"');
    expect(source).toContain('aria-label="Delay (seconds)"');
    expect(source).toContain('aria-label="Effect"');
    expect(source).toContain('aria-label="Repeat"');
    expect(source).toContain('aria-label="Easing"');
  });
});

/* ─── 3. Source pins: clipboard failure UX at every site ────── */

describe("source pins: all copy affordances route through copyTextToClipboard (issue #271)", () => {
  // The 15 sites named in issue #271 plus 3 same-class silent catches
  // discovered during the sweep (files the #269 a11y half already touches):
  // gradient-generator, border-radius-visualizer, comparison-panel and
  // easing-visualizer. `selectsPayload` = a rendered <code> ref exists for
  // selectElementText (the contract's "where a payload ref exists" clause —
  // per-item/swatch tools without a code block rely on the visible +
  // announced status line instead).
  const SITES: Array<{ file: string; selectsPayload: boolean }> = [
    { file: "src/components/roycss/filter-studio.tsx", selectsPayload: true },
    { file: "src/components/roycss/animation-timeline.tsx", selectsPayload: true },
    { file: "src/components/roycss/spacing-scale-generator.tsx", selectsPayload: false },
    { file: "src/components/roycss/playground-panel.tsx", selectsPayload: true },
    { file: "src/components/roycss/flexbox-visualizer.tsx", selectsPayload: true },
    { file: "src/components/roycss/box-shadow-generator.tsx", selectsPayload: true },
    { file: "src/components/roycss/transform-studio.tsx", selectsPayload: true },
    { file: "src/components/roycss/grid-generator.tsx", selectsPayload: true },
    { file: "src/components/roycss/variable-manager.tsx", selectsPayload: false },
    { file: "src/components/roycss/patterns-section.tsx", selectsPayload: true },
    { file: "src/components/roycss/color-shade-generator.tsx", selectsPayload: false },
    { file: "src/components/roycss/palette-generator.tsx", selectsPayload: false },
    { file: "src/components/roycss/font-preview-tool.tsx", selectsPayload: true },
    { file: "src/components/roycss/clip-path-generator.tsx", selectsPayload: true },
    { file: "src/components/roycss/gradient-generator.tsx", selectsPayload: true },
    { file: "src/components/roycss/border-radius-visualizer.tsx", selectsPayload: true },
    { file: "src/components/roycss/comparison-panel.tsx", selectsPayload: false },
    { file: "src/components/roycss/tools/easing-visualizer.tsx", selectsPayload: true },
  ];

  for (const { file, selectsPayload } of SITES) {
    it(`${file}: shared helper + failed-state contract + auto-reset, no raw clipboard API`, () => {
      const source = src(file);
      expect(source).toContain('from "@/lib/clipboard"');
      expect(source).toContain("copyTextToClipboard(");
      // Visible failed state (button text / status line) + the constants.
      expect(source).toContain("CLIPBOARD_FAILED_MESSAGE");
      expect(source).toContain("CLIPBOARD_FAILED_RESET_MS");
      // Polite, always-rendered announcement region.
      expect(source).toContain('role="status" aria-live="polite"');
      // The raw silent-catch path is gone.
      expect(source).not.toContain("navigator.clipboard");
      if (selectsPayload) {
        expect(source).toContain("selectElementText(");
        expect(source).toContain("codeRef");
      }
    });
  }

  it("the 15 issue-named sites are a subset of the pinned sites", () => {
    const pinned = new Set(SITES.map((s) => s.file));
    const named = [
      "src/components/roycss/filter-studio.tsx",
      "src/components/roycss/animation-timeline.tsx",
      "src/components/roycss/spacing-scale-generator.tsx",
      "src/components/roycss/playground-panel.tsx",
      "src/components/roycss/flexbox-visualizer.tsx",
      "src/components/roycss/box-shadow-generator.tsx",
      "src/components/roycss/transform-studio.tsx",
      "src/components/roycss/grid-generator.tsx",
      "src/components/roycss/variable-manager.tsx",
      "src/components/roycss/patterns-section.tsx",
      "src/components/roycss/color-shade-generator.tsx",
      "src/components/roycss/palette-generator.tsx",
      "src/components/roycss/font-preview-tool.tsx",
      "src/components/roycss/clip-path-generator.tsx",
    ];
    for (const file of named) expect(pinned.has(file)).toBe(true);
    // spacing-scale-generator contributes TWO named sites (row copy + copy all).
    const spacing = src("src/components/roycss/spacing-scale-generator.tsx");
    expect(spacing.match(/copyTextToClipboard\(/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it("failed-state constants still match the PR-#261 contract", async () => {
    const mod = await import("@/lib/clipboard");
    expect(mod.CLIPBOARD_FAILED_MESSAGE).toBe("Copy failed — press Ctrl+C / ⌘C");
    expect(mod.CLIPBOARD_FAILED_RESET_MS).toBe(4000);
  });

  it("success paths keep their 2000ms 'Copied!' reset", () => {
    // Representative single-copy + per-item tools.
    for (const file of [
      "src/components/roycss/filter-studio.tsx",
      "src/components/roycss/grid-generator.tsx",
      "src/components/roycss/spacing-scale-generator.tsx",
      "src/components/roycss/patterns-section.tsx",
    ]) {
      const source = src(file);
      expect(source).toContain("2000");
      expect(source).toContain("Copied!");
    }
  });
});

/* ─── 4. Shared Slider thumb labeling ───────────────────────── */

describe("shared Radix <Slider> forwards aria-label to the role=slider thumb (issue #269)", () => {
  // Radix renders the actual slider role on the Thumb; before the ui/slider
  // fix, an aria-label passed to the shared component landed on a roleless
  // Root span and the announced control had NO name (getLabel() returns
  // undefined for single-value sliders).
  it("SSR markup: the role=slider span carries the passed aria-label", () => {
    const html = renderToStaticMarkup(
      createElement(Slider, {
        value: [3],
        min: 0,
        max: 10,
        step: 0.1,
        "aria-label": "Duration (seconds)",
      }),
    );
    const sliderRoles = html.match(/<span[^>]*role="slider"[^>]*>/g) ?? [];
    expect(sliderRoles.length).toBe(1);
    expect(sliderRoles[0]).toContain('aria-label="Duration (seconds)"');
    // The roleless Root span no longer carries a duplicate label attribute.
    const roots = html.match(/<span[^>]*data-slot="slider"[^>]*>/g) ?? [];
    expect(roots.length).toBe(1);
    expect(roots[0]).not.toContain("aria-label");
  });

  it("multi-value sliders do NOT stamp the shared label on every thumb", () => {
    const html = renderToStaticMarkup(
      createElement(Slider, {
        value: [2, 8],
        min: 0,
        max: 10,
        "aria-label": "Range",
      }),
    );
    const sliderRoles = html.match(/<span[^>]*role="slider"[^>]*>/g) ?? [];
    expect(sliderRoles.length).toBe(2);
    // Forwarding is gated to single-value sliders — a duplicated "Range" on
    // both thumbs would be WORSE than no attribute (ambiguity). Multi-value
    // thumbs fall back to Radix's own per-thumb naming at hydration
    // (getLabel(): "Value N of M" / "Minimum"/"Maximum" — verified in
    // node_modules/@radix-ui/react-slider/dist/index.mjs).
    for (const tag of sliderRoles) {
      expect(tag).not.toContain('aria-label="Range"');
    }
  });

  it("source pin: the consumer-facing labels in playground-panel/easing-visualizer stay on <Slider>", () => {
    const sliderSource = src("src/components/ui/slider.tsx");
    expect(sliderSource).toContain('"aria-label": ariaLabel');
    expect(sliderSource).toContain(
      "aria-label={_values.length === 1 ? ariaLabel : undefined}",
    );
  });
});

/* ─── 5. Dead affordances (issue #271 part 2 + 3) ───────────── */

describe("docs search CTA retarget", () => {
  it("docs layout: CTA targets the effects explorer via explorerHref() — the dead /#search anchor is gone", () => {
    const source = src("src/app/docs/layout.tsx");
    expect(source).toContain('from "@/lib/search-targets"');
    expect(source).toContain("href={explorerHref()}");
    expect(source).not.toContain('"/#search"');
    // The icon-only control's accessible name matches its real destination.
    expect(source).toContain('aria-label="Open effects explorer"');
  });

  it("explorerHref() emits the verified /#effects home anchor", async () => {
    const mod = await import("@/lib/search-targets");
    expect(mod.explorerHref()).toBe("/#effects");
  });

  it("the home page still renders the #effects target for that anchor", () => {
    const source = src("src/components/roycss/roycss-page.tsx");
    expect(source).toContain('id="effects"');
  });
});

describe("⌘K on /effects — the advertised shortcut now actually works", () => {
  it("effects page mounts the shortcut component and keeps the ⌘K hint", () => {
    const source = src("src/app/effects/page.tsx");
    expect(source).toContain(
      'from "@/components/roycss/effects-search-shortcuts"',
    );
    expect(source).toContain("<EffectsSearchShortcuts />");
    // The hint remains, now honest: ⌘K works on this page.
    expect(source).toContain("Press");
    expect(source).toContain("<kbd");
    expect(source).toContain("search the whole catalog");
  });

  it("the shortcut component duplicates only the ⌘K behavior and renders the shared overlay", () => {
    const source = src("src/components/roycss/effects-search-shortcuts.tsx");
    expect(source).toContain('from "@/components/roycss/search-overlay"');
    expect(source).toContain("<SearchOverlay");
    // ⌘K / Ctrl+K (case-insensitive), mirroring the home-page listener.
    expect(source).toContain("e.metaKey || e.ctrlKey");
    expect(source).toContain('e.key === "k" || e.key === "K"');
    // Home-section results navigate to the home anchor from /effects.
    expect(source).toContain("router.push");
    // "/" and "?" stay home-only (documented decision).
    expect(source).not.toContain('e.key === "/"');
    expect(source).not.toContain('e.key === "?"');
  });
});
