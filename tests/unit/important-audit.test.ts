import { describe, it, expect } from "vitest";
import {
  auditImportant,
  checkAgainstBaseline,
  type ImportantAuditReport,
} from "../../scripts/audit-important";

/** Sample stylesheet exercising all three !important categories. */
const SAMPLE_CSS = `
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; }
}
.roycss-form-toggle-switch > div {
  inline-size: 22px !important;
}
.card {
  color: red !important;
}
`;

describe("important + @layer audit (issue #128 / PF-035 V1)", () => {
  it("categorizes a11y-guard occurrences as allowed", () => {
    const report = auditImportant(SAMPLE_CSS, "sample.css");
    const guard = report.occurrences.filter((o) => o.category === "a11y-guard");
    expect(guard).toHaveLength(1);
    expect(guard[0].property).toBe("animation-duration");
    expect(guard[0].line).toBe(3);
  });

  it("categorizes effect-internal occurrences inside .roycss-* selectors", () => {
    const report = auditImportant(SAMPLE_CSS, "sample.css");
    const internal = report.occurrences.filter((o) => o.category === "effect-internal");
    expect(internal).toHaveLength(1);
    expect(internal[0].selector).toContain(".roycss-form-toggle-switch");
    expect(internal[0].property).toBe("inline-size");
  });

  it("flags everything else as unjustified", () => {
    const report = auditImportant(SAMPLE_CSS, "sample.css");
    const unjustified = report.occurrences.filter((o) => o.category === "unjustified");
    expect(unjustified).toHaveLength(1);
    expect(unjustified[0].property).toBe("color");
    expect(unjustified[0].selector).toBe(".card");
  });

  it("totals occurrences and reports category counts", () => {
    const report = auditImportant(SAMPLE_CSS, "sample.css");
    expect(report.totalImportant).toBe(3);
    expect(report.byCategory).toEqual({
      "a11y-guard": 1,
      "effect-internal": 1,
      unjustified: 1,
    });
  });

  it("parses declaration property/value correctly", () => {
    const report = auditImportant(SAMPLE_CSS, "sample.css");
    const internal = report.occurrences.find((o) => o.category === "effect-internal");
    expect(internal?.value).toBe("22px");
  });

  it("reports @layer absence honestly", () => {
    const report = auditImportant(SAMPLE_CSS, "sample.css");
    expect(report.layer.hasLayerStatement).toBe(false);
    expect(report.layer.declaredOrder).toBeNull();
    expect(report.layer.orderValid).toBe(true); // nothing to invalidate
  });

  it("validates correct @layer order", () => {
    const css = `@layer tokens, reset, base, components, utilities;\n.a{}`;
    const report = auditImportant(css, "layered.css");
    expect(report.layer.hasLayerStatement).toBe(true);
    expect(report.layer.orderValid).toBe(true);
    expect(report.layer.unknownLayers).toEqual([]);
  });

  it("detects out-of-order @layer declarations", () => {
    const css = "@layer utilities, tokens;\n.a{}";
    const report = auditImportant(css, "layered.css");
    expect(report.layer.orderValid).toBe(false);
  });

  it("reports unknown layers without failing order validation", () => {
    const css = "@layer tokens, mystery;\n.a{}";
    const report = auditImportant(css, "layered.css");
    expect(report.layer.orderValid).toBe(true);
    expect(report.layer.unknownLayers).toEqual(["mystery"]);
  });

  describe("baseline ratchet gate", () => {
    const baseReport: ImportantAuditReport = {
      file: "sample.css",
      totalImportant: 3,
      byCategory: { "a11y-guard": 1, "effect-internal": 1, unjustified: 1 },
      occurrences: [],
      layer: {
        hasLayerStatement: false,
        declaredOrder: null,
        expectedOrder: [],
        orderValid: true,
        unknownLayers: [],
      },
      auditedAt: "2026-09-22T00:00:00.000Z",
    };

    it("passes when counts are within baseline", () => {
      const { pass, failures } = checkAgainstBaseline(baseReport, {
        unjustified: 1,
        effectInternal: 1,
        total: 3,
        note: "",
      });
      expect(pass).toBe(true);
      expect(failures).toEqual([]);
    });

    it("fails when unjustified count grows", () => {
      const report = {
        ...baseReport,
        byCategory: { "a11y-guard": 1, "effect-internal": 1, unjustified: 2 },
      };
      const { pass, failures } = checkAgainstBaseline(report, {
        unjustified: 1,
        effectInternal: 1,
        total: 3,
        note: "",
      });
      expect(pass).toBe(false);
      expect(failures[0]).toMatch(/unjustified !important grew/);
    });

    it("fails when effect-internal count grows", () => {
      const report = {
        ...baseReport,
        byCategory: { "a11y-guard": 1, "effect-internal": 2, unjustified: 1 },
      };
      const { pass } = checkAgainstBaseline(report, {
        unjustified: 1,
        effectInternal: 1,
        total: 3,
        note: "",
      });
      expect(pass).toBe(false);
    });

    it("fails on invalid layer order regardless of counts", () => {
      const report = {
        ...baseReport,
        layer: {
          ...baseReport.layer,
          hasLayerStatement: true,
          declaredOrder: ["utilities", "tokens"],
          orderValid: false,
        },
      };
      const { pass, failures } = checkAgainstBaseline(report, {
        unjustified: 1,
        effectInternal: 1,
        total: 3,
        note: "",
      });
      expect(pass).toBe(false);
      expect(failures[0]).toMatch(/@layer order invalid/);
    });

    it("skips ratchet when no baseline exists (sentinel -1)", () => {
      const report = {
        ...baseReport,
        byCategory: { "a11y-guard": 0, "effect-internal": 99, unjustified: 99 },
      };
      const { pass } = checkAgainstBaseline(report, {
        unjustified: -1,
        effectInternal: -1,
        total: -1,
        note: "no baseline yet",
      });
      expect(pass).toBe(true);
    });

    it("counts may go down without failing (ratchet)", () => {
      const report = {
        ...baseReport,
        byCategory: { "a11y-guard": 1, "effect-internal": 0, unjustified: 0 },
      };
      const { pass } = checkAgainstBaseline(report, {
        unjustified: 1,
        effectInternal: 1,
        total: 3,
        note: "",
      });
      expect(pass).toBe(true);
    });
  });

  it("is case-insensitive for !important and handles empty CSS", () => {
    expect(auditImportant("", "empty.css").totalImportant).toBe(0);
    const css = ".a { color: red !IMPORTANT; }";
    expect(auditImportant(css, "case.css").totalImportant).toBe(1);
  });
});
