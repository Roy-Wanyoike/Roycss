/**
 * lib.test.ts — shared codemod core (PF-015, issue #95)
 *
 * The class-token scanner, mapping engine and reporter are load-bearing for
 * every codemod: byte-exact whitespace preservation, look-alike-attribute
 * rejection, surgical replacement and uniform report formatting.
 */

import { describe, it, expect } from "vitest";

import {
  scanClassAttributes,
  tokenizeAttributeValue,
  isRoycssClass,
} from "../../../scripts/codemods/lib/class-scanner";
import { applyMapping, type MappingTable } from "../../../scripts/codemods/lib/mapper";
import { formatFileReport, formatSummary, summarize } from "../../../scripts/codemods/lib/reporter";
import { globToFiles } from "../../../scripts/codemods/lib/engine";
import { join } from "node:path";

const TABLE: MappingTable = {
  "btn-primary": "roycss-btn-glow",
  "spinner-border": "roycss-loader-spinner",
  "btn-lg": null, // recognized, no equivalent
};

describe("class-token scanner", () => {
  it("finds class= and className= attributes with their exact offsets", () => {
    const src = `<a class="x" className="y"></a>`;
    const attrs = scanClassAttributes(src);
    expect(attrs.map((a) => a.name)).toEqual(["class", "className"]);
    for (const attr of attrs) {
      expect(src.slice(attr.valueStart, attr.valueEnd)).toBe(attr.name === "class" ? "x" : "y");
      expect(src.slice(attr.start, attr.end)).toBe(`${attr.name}="${attr.tokens[0].value}"`);
    }
  });

  it("tokenizes values with absolute offsets and preserves whitespace runs", () => {
    const tokens = tokenizeAttributeValue(" a \n\t b  ", 10);
    expect(tokens.map((t) => t.value)).toEqual(["a", "b"]);
    expect(tokens.map((t) => [t.start, t.end])).toEqual([
      [11, 12],
      [16, 17],
    ]);
  });

  it("returns no tokens for empty or whitespace-only values", () => {
    expect(tokenizeAttributeValue("")).toEqual([]);
    expect(tokenizeAttributeValue("   \n  ")).toEqual([]);
  });

  it("supports single- and double-quoted values", () => {
    const src = `<i class='a'></i><i class="b"></i>`;
    const attrs = scanClassAttributes(src);
    expect(attrs.map((a) => a.quote)).toEqual(["'", '"']);
    expect(attrs.flatMap((a) => a.tokens.map((t) => t.value))).toEqual(["a", "b"]);
  });

  it("skips dynamic bindings (className={expr}) and non-class attributes", () => {
    const src = [
      `<div id="btn-primary" title="class=not-really">`,
      `<div className={styles.dynamic}>`,
      `<div class="real">`,
    ].join("");
    const attrs = scanClassAttributes(src);
    expect(attrs).toHaveLength(1);
    expect(attrs[0].tokens[0].value).toBe("real");
  });

  it("rejects look-alike attribute names (data-class=, subclass=, xlink:class=)", () => {
    const src = `<div data-class="btn-primary" subclass="x" xlink:class="y" class="ok"></div>`;
    const attrs = scanClassAttributes(src);
    expect(attrs).toHaveLength(1);
    expect(attrs[0].tokens.map((t) => t.value)).toEqual(["ok"]);
  });

  it("multi-line class lists keep their exact layout", () => {
    const src = `<div class="a\n   b\n\tc">x</div>`;
    const attr = scanClassAttributes(src)[0];
    expect(attr.tokens.map((t) => t.value)).toEqual(["a", "b", "c"]);
    expect(src.slice(attr.valueStart, attr.valueEnd)).toBe("a\n   b\n\tc");
  });

  it("identifies RoyCSS/RoyMotion library classes", () => {
    expect(isRoycssClass("roycss-fade-in")).toBe(true);
    expect(isRoycssClass("roymotion-fade-in")).toBe(true);
    expect(isRoycssClass("fade-in")).toBe(false);
    expect(isRoycssClass("animate__fadeIn")).toBe(false);
  });
});

describe("mapper", () => {
  it("replaces tokens surgically, preserving whitespace and quoting byte-for-byte", () => {
    const src = `<div class="  btn-primary\t spinner-border  ">x</div>`;
    const r = applyMapping(src, TABLE);
    expect(r.output).toBe(`<div class="  roycss-btn-glow\t roycss-loader-spinner  ">x</div>`);
  });

  it("never replaces unknown classes; reports them instead", () => {
    const src = `<div class="mystery btn-primary">x</div>`;
    const r = applyMapping(src, TABLE);
    expect(r.output).toBe(`<div class="mystery roycss-btn-glow">x</div>`);
    expect(r.unknown).toEqual(["mystery"]);
  });

  it("maps null entries as recognized-but-kept, distinct from unknown", () => {
    const src = `<div class="btn-lg">x</div>`;
    const r = applyMapping(src, TABLE);
    expect(r.output).toBe(src);
    expect(r.kept).toEqual(["btn-lg"]);
    expect(r.unknown).toEqual([]);
  });

  it("skips already-RoyCSS classes by default (inbound safety) and reports them", () => {
    const src = `<div class="roycss-fade-in btn-primary">x</div>`;
    const r = applyMapping(src, TABLE);
    expect(r.output).toBe(`<div class="roycss-fade-in roycss-btn-glow">x</div>`);
    expect(r.alreadyRoycss).toEqual(["roycss-fade-in"]);
  });

  it("ignore patterns route framework utilities to the ignored bucket", () => {
    const src = `<div class="flex p-4 btn-primary">x</div>`;
    const r = applyMapping(src, TABLE, { ignore: [/^(flex|p-\d+)$/] });
    expect(r.output).toBe(`<div class="flex p-4 roycss-btn-glow">x</div>`);
    expect(r.ignored).toEqual(["flex", "p-4"]);
    expect(r.unknown).toEqual([]);
  });

  it("is idempotent by construction: targets are skipped on the next run", () => {
    const src = `<div class="btn-primary spinner-border">x</div>`;
    const once = applyMapping(src, TABLE);
    const twice = applyMapping(once.output, TABLE);
    expect(twice.output).toBe(once.output);
    expect(twice.replaced).toEqual([]);
  });

  it("dedupes replaced pairs while rewriting every occurrence", () => {
    const src = `<a class="btn-primary"></a><b class="btn-primary"></b>`;
    const r = applyMapping(src, TABLE);
    expect(r.replaced).toEqual([{ from: "btn-primary", to: "roycss-btn-glow" }]);
    expect(r.output).toBe(`<a class="roycss-btn-glow"></a><b class="roycss-btn-glow"></b>`);
  });
});

describe("reporter", () => {
  it("formats a per-file report with all buckets", () => {
    const text = formatFileReport(
      {
        file: "src/App.tsx",
        changed: true,
        replaced: [{ from: "btn", to: "roycss-btn-glow" }],
        unknown: ["mystery"],
        kept: ["btn-lg"],
        ignored: ["flex"],
        alreadyRoycss: ["roycss-fade-in"],
        approximate: [],
      },
      true,
    );
    expect(text).toContain("src/App.tsx — changed: 1 replaced, 1 kept (no equivalent), 1 kept as-is, 1 unknown, 1 already roycss");
    expect(text).toContain("✓ btn → roycss-btn-glow");
    expect(text).toContain("= btn-lg kept — no RoyCSS equivalent");
    expect(text).toContain("? mystery unknown — left untouched");
  });

  it("summarizes a run across files and dedupes class lists", () => {
    const report = {
      file: "a.tsx",
      changed: true,
      replaced: [{ from: "btn", to: "roycss-btn-glow" }],
      unknown: ["mystery"],
      kept: [],
      ignored: [],
      alreadyRoycss: [],
      approximate: [],
    };
    const summary = summarize("from-bootstrap", [report, report], false);
    expect(summary.files).toBe(2);
    expect(summary.classesReplaced).toBe(2);
    expect(summary.unknownClasses).toEqual(["mystery"]); // deduped
    expect(formatSummary(summary)).toContain("migrate from-bootstrap: 2 files scanned, 2 changed");
    expect(formatSummary(summary)).toContain("mode: dry-run (use --write to apply)");
  });
});

describe("globToFiles (dependency-free glob engine)", () => {
  it("resolves a literal file path", () => {
    const files = globToFiles("tests/unit/codemods/fixtures/bootstrap-input.html", join(__dirname, "../../.."));
    expect(files).toHaveLength(1);
    expect(files[0].endsWith("bootstrap-input.html")).toBe(true);
  });

  it("resolves * and ** patterns, sorted and deduped", () => {
    const root = join(__dirname, "../../..");
    const files = globToFiles("tests/unit/codemods/fixtures/*.html", root);
    expect(files.length).toBeGreaterThanOrEqual(3);
    expect(files).toEqual([...files].sort());
    const deep = globToFiles("tests/unit/**/fixtures/*.txt", root);
    expect(deep.length).toBeGreaterThanOrEqual(5);
    expect(deep.every((f) => f.endsWith(".txt"))).toBe(true);
  });

  it("returns [] for patterns that match nothing", () => {
    expect(globToFiles("tests/unit/codemods/fixtures/*.nope", join(__dirname, "../../.."))).toEqual([]);
  });
});
