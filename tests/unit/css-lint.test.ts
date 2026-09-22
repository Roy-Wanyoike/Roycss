import { describe, it, expect } from "vitest";
import {
  lintCss,
  lintNoImportant,
  lintOklchColors,
  lintRoycssPrefix,
  lintReducedMotionGuard,
  lintLayerOrder,
  applyFixes,
  extractLayerStatement,
  indexToLineCol,
  RECOMMENDED_LAYER_ORDER,
} from "@/lib/css-lint";

/** Build a prefers-reduced-motion guard wrapper around body CSS. */
const guard = (body: string) =>
  `@media (prefers-reduced-motion: reduce) {\n${body}\n}`;

describe("css-lint engine (issue #128 / PF-036 V1)", () => {
  describe("indexToLineCol", () => {
    it("returns 1-based line and column", () => {
      const src = "a {\n  color: red;\n}";
      expect(indexToLineCol(src, 0)).toEqual({ line: 1, column: 1 });
      expect(indexToLineCol(src, src.indexOf("color"))).toEqual({
        line: 2,
        column: 3,
      });
    });

    it("clamps negative indexes to the start", () => {
      expect(indexToLineCol("abc", -5)).toEqual({ line: 1, column: 1 });
    });
  });

  describe("rule: no-important", () => {
    it("flags !important outside guards as warning with position", () => {
      const css = ".a { color: red !important; }";
      const findings = lintNoImportant(css, true);
      expect(findings).toHaveLength(1);
      expect(findings[0].severity).toBe("warning");
      expect(findings[0].line).toBe(1);
      expect(findings[0].column).toBeGreaterThan(0);
      expect(findings[0].fixable).toBe(false);
    });

    it("allows !important inside a reduced-motion guard by policy", () => {
      const css = guard("  * { animation-duration: 0.01ms !important; }");
      expect(lintNoImportant(css, true)).toHaveLength(0);
    });

    it("still reports in-guard !important as info when allowA11yImportant=false", () => {
      const css = guard("  * { animation-duration: 0.01ms !important; }");
      const findings = lintNoImportant(css, false);
      expect(findings).toHaveLength(1);
      expect(findings[0].severity).toBe("info");
      expect(findings[0].detail?.inA11yGuard).toBe(true);
    });

    it("handles multiple occurrences and case-insensitivity", () => {
      const css = ".a { x: 1 !IMPORTANT; } .b { y: 2 !important; }";
      expect(lintNoImportant(css, true)).toHaveLength(2);
    });

    it("does not treat non-reduced-motion media blocks as guards", () => {
      const css = '@media (min-width: 40rem) { .a { z: 1 !important; } }';
      const findings = lintNoImportant(css, true);
      expect(findings).toHaveLength(1);
      expect(findings[0].detail?.inA11yGuard).toBe(false);
    });
  });

  describe("rule: oklch-colors", () => {
    it("flags hex, rgba, and hsla literals", () => {
      const css = [
        ".a { color: #ff5733; }",
        ".b { color: rgba(0,0,0,0.5); }",
        ".c { color: hsla(200, 50%, 50%, 1); }",
      ].join("\n");
      const findings = lintOklchColors(css);
      expect(findings).toHaveLength(3);
      expect(findings.every((f) => f.rule === "oklch-colors")).toBe(true);
    });

    it("does not flag oklch() or color-mix over oklch", () => {
      const css =
        ".a { color: oklch(0.7 0.1 200); background: color-mix(in oklch, oklch(0.5 0.1 200) 50%, transparent); }";
      expect(lintOklchColors(css)).toHaveLength(0);
    });

    it("reports exact line numbers", () => {
      const css = ".a {\n  color: #abc;\n}";
      expect(lintOklchColors(css)[0].line).toBe(2);
    });

    it("ignores # not followed by valid hex length", () => {
      // #ab is not a valid hex color (3,4,6,8 digits only)
      expect(lintOklchColors(".a { content: '#ab'; }")).toHaveLength(0);
    });
  });

  describe("rule: roycss-prefix", () => {
    const known = ["glow-border", "bounce-in"];

    it("flags known effect ids used without prefix", () => {
      const markup = '<div class="card glow-border">x</div>';
      const findings = lintRoycssPrefix(markup, known);
      expect(findings).toHaveLength(1);
      expect(findings[0].severity).toBe("error");
      expect(findings[0].fixable).toBe(true);
      expect(findings[0].detail?.effectId).toBe("glow-border");
    });

    it("does not flag already-prefixed classes", () => {
      const markup = '<div class="roycss-glow-border">x</div>';
      expect(lintRoycssPrefix(markup, known)).toHaveLength(0);
    });

    it("supports className (JSX) syntax", () => {
      const markup = '<div className="bounce-in">x</div>';
      expect(lintRoycssPrefix(markup, known)).toHaveLength(1);
    });

    it("is a no-op for pure CSS without class attributes", () => {
      expect(lintRoycssPrefix(".glow-border { color: red; }", known)).toHaveLength(0);
    });
  });

  describe("rule: reduced-motion-guard", () => {
    it("warns when no guard exists", () => {
      const findings = lintReducedMotionGuard(".a { color: red; }");
      expect(findings).toHaveLength(1);
      expect(findings[0].fixable).toBe(true);
      expect(findings[0].line).toBe(0);
    });

    it("passes when a guard exists (any case)", () => {
      expect(lintReducedMotionGuard("@media (PREFERS-REDUCED-MOTION: reduce) {}")).toHaveLength(0);
    });
  });

  describe("rule: layer-order", () => {
    it("passes when no layer statement exists", () => {
      expect(lintLayerOrder(".a { color: red; }")).toHaveLength(0);
    });

    it("accepts the recommended order", () => {
      const css = `@layer ${RECOMMENDED_LAYER_ORDER.join(", ")};\n.a{}`;
      expect(lintLayerOrder(css)).toHaveLength(0);
    });

    it("flags out-of-order layers", () => {
      const css = "@layer utilities, tokens;\n.a{}";
      const findings = lintLayerOrder(css);
      expect(findings).toHaveLength(1);
      expect(findings[0].severity).toBe("warning");
      // The offending layer is the one that regressed vs the recommended skeleton.
      expect(findings[0].detail?.layer).toBe("tokens");
      expect(findings[0].message).toContain("utilities");
    });

    it("reports unknown layers as info", () => {
      const css = "@layer tokens, mystery;\n.a{}";
      const findings = lintLayerOrder(css);
      expect(findings).toHaveLength(1);
      expect(findings[0].severity).toBe("info");
      expect(findings[0].detail?.layer).toBe("mystery");
    });

    it("extracts layer names via extractLayerStatement", () => {
      expect(extractLayerStatement("@layer a, b, c;")).toEqual(["a", "b", "c"]);
      expect(extractLayerStatement("@layer a { .x{} }")).toBeNull();
    });
  });

  describe("applyFixes", () => {
    it("inserts a reduced-motion guard when missing", () => {
      const css = ".a { color: red; }";
      const result = lintCss(css);
      const { fixed, appliedFixes } = applyFixes(css, result.findings);
      expect(appliedFixes.some((f) => f.rule === "reduced-motion-guard")).toBe(true);
      expect(fixed.startsWith("@media (prefers-reduced-motion: reduce)")).toBe(true);
    });

    it("prefixes known effect ids in class attributes (markup)", () => {
      const markup = '<div class="glow-border bounce-in">x</div>';
      const known = ["glow-border", "bounce-in"];
      const result = lintCss(markup, { knownEffectIds: known });
      const { fixed, appliedFixes } = applyFixes(markup, result.findings, {
        knownEffectIds: known,
      });
      expect(fixed).toBe('<div class="roycss-glow-border roycss-bounce-in">x</div>');
      expect(appliedFixes.length).toBeGreaterThan(0);
    });

    it("never removes !important (cascade risk)", () => {
      const css = ".a { color: red !important; }";
      const result = lintCss(css);
      const { fixed } = applyFixes(css, result.findings);
      expect(fixed).toContain("!important");
    });

    it("is idempotent for already-fixed input", () => {
      const markup = '<div class="roycss-glow-border">x</div>';
      const known = ["glow-border"];
      const result = lintCss(markup, { knownEffectIds: known });
      const { fixed } = applyFixes(markup, result.findings, { knownEffectIds: known });
      expect(fixed).toBe(markup);
    });
  });

  describe("lintCss orchestrator", () => {
    it("sorts findings by line then column", () => {
      const css = ".b { color: #111; }\n.a { color: #222 !important; }";
      const result = lintCss(css, { allowA11yImportant: false });
      const lines = result.findings.map((f) => f.line);
      expect(lines).toEqual([...lines].sort((a, b) => a - b));
    });

    it("honors disabledRules", () => {
      const css = ".a { color: #111; }";
      const result = lintCss(css, {
        disabledRules: ["oklch-colors", "reduced-motion-guard"],
      });
      expect(result.findings).toHaveLength(0);
      // And disabling just oklch-colors leaves no oklch finding.
      const partial = lintCss(css, { disabledRules: ["oklch-colors"] });
      expect(partial.findings.some((f) => f.rule === "oklch-colors")).toBe(false);
    });

    it("skips markup-only rules for pure CSS and vice versa", () => {
      const css = ".a { color: red; }";
      const r1 = lintCss(css, { knownEffectIds: ["a"] });
      expect(r1.findings.some((f) => f.rule === "roycss-prefix")).toBe(false);
      expect(r1.findings.some((f) => f.rule === "reduced-motion-guard")).toBe(true);
    });

    it("summarizes severities", () => {
      const css = guard("  * { a: 1 !important; }") + "\n.a { color: #111; }";
      const result = lintCss(css, { allowA11yImportant: false });
      expect(result.summary).toEqual({
        errors: 0,
        warnings: 1, // oklch-colors
        infos: 1, // in-guard !important downgraded
        allowed: 0,
      });
    });

    it("error findings count as errors in summary", () => {
      const markup = '<div class="bounce-in">x</div>';
      const result = lintCss(markup, { knownEffectIds: ["bounce-in"] });
      expect(result.summary.errors).toBe(1);
    });
  });
});
