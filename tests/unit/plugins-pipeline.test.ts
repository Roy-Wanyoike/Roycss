import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  createRoyCssPipeline,
  isRoyCssImportUrl,
  parseImportLayer,
} from "../../packages/plugins/core/src/index";

/**
 * Pipeline tests — the used-class registry plus the PostCSS-style string
 * pipeline that rewrites `@import "roycss.css"` into the extracted subset.
 */

const STYLESHEET = `
.r-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); }
.roycss-pulse-glow { animation: roy-pulse-glow 2s infinite; }
@keyframes roy-pulse-glow { to { opacity: 1; } }
.roycss-shake { animation: roy-shake 0.5s; }
@keyframes roy-shake { to { transform: none; } }
`;

function writeTemp(name: string, content: string): string {
  const dir = mkdtempSync(join(tmpdir(), "roycss-pipeline-"));
  const path = join(dir, name);
  writeFileSync(path, content);
  return path;
}

describe("createRoyCssPipeline", () => {
  it("loads the stylesheet and starts with include classes only", () => {
    const path = writeTemp("roycss.css", STYLESHEET);
    const pipeline = createRoyCssPipeline({ stylesheet: path, include: ["roycss-shake"] });
    expect(pipeline.stylesheetPath).toBe(path);
    expect(pipeline.classes()).toEqual(["roycss-shake"]);
    expect(pipeline.source).toBe(STYLESHEET);
  });

  it("accumulates classes from scanned sources and files", () => {
    const path = writeTemp("roycss.css", STYLESHEET);
    const pipeline = createRoyCssPipeline({ stylesheet: path });
    expect(pipeline.scanSource('className="roycss-pulse-glow"')).toBe(1);
    expect(pipeline.scanSource('className="roycss-pulse-glow"')).toBe(0); // idempotent
    const sourceFile = writeTemp("App.tsx", 'export const A = () => <div className="r-grid-2" />;');
    expect(pipeline.scanFiles([sourceFile])).toBe(1);
    expect(pipeline.classes()).toEqual(["r-grid-2", "roycss-pulse-glow"]);
  });

  it("extracts through the shared core", () => {
    const path = writeTemp("roycss.css", STYLESHEET);
    const pipeline = createRoyCssPipeline({ stylesheet: path });
    pipeline.scanSource('className="roycss-shake"');
    const result = pipeline.extract();
    expect(result.css).toContain(".roycss-shake");
    expect(result.css).toContain("@keyframes roy-shake");
    expect(result.css).not.toContain(".roycss-pulse-glow");
  });

  it("requires a stylesheet path", () => {
    expect(() => createRoyCssPipeline()).toThrowError(/stylesheet/);
  });
});

describe("pipeline.process (@import rewriting)", () => {
  it("replaces a roycss @import with the extracted subset", () => {
    const path = writeTemp("roycss.css", STYLESHEET);
    const pipeline = createRoyCssPipeline({ stylesheet: path });
    pipeline.scanSource('className="roycss-pulse-glow"');

    const input = '@import "roycss.css";\n:root { --x: 1; }\n.local { margin: 0; }\n';
    const output = pipeline.process(input);
    expect(output).toContain(".roycss-pulse-glow");
    expect(output).toContain("@keyframes roy-pulse-glow");
    expect(output).not.toContain("@import");
    // Surrounding CSS passes through untouched.
    expect(output).toContain(":root { --x: 1; }");
    expect(output).toContain(".local { margin: 0; }");
  });

  it("preserves layer() qualifiers", () => {
    const path = writeTemp("roycss.css", STYLESHEET);
    const pipeline = createRoyCssPipeline({ stylesheet: path });
    pipeline.scanSource('className="roycss-pulse-glow"');
    const output = pipeline.process('@import "roycss.css" layer(effects);\n');
    expect(output.startsWith("@layer effects {")).toBe(true);
    expect(output).toContain(".roycss-pulse-glow");
  });

  it("leaves non-RoyCSS imports alone", () => {
    const path = writeTemp("roycss.css", STYLESHEET);
    const pipeline = createRoyCssPipeline({ stylesheet: path });
    pipeline.scanSource('className="roycss-pulse-glow"');
    const input = '@import "other-lib.css";\n@import "./reset.css";\n';
    expect(pipeline.process(input)).toBe(input);
  });

  it("returns the input unchanged when nothing was scanned yet", () => {
    const path = writeTemp("roycss.css", STYLESHEET);
    const pipeline = createRoyCssPipeline({ stylesheet: path });
    const input = '@import "roycss.css";\n.local { color: red; }\n';
    expect(pipeline.process(input)).toBe(input);
  });
});

describe("import url helpers", () => {
  it("recognizes every shipped import form", () => {
    expect(isRoyCssImportUrl("roycss.css")).toBe(true);
    expect(isRoyCssImportUrl("./roycss.css")).toBe(true);
    expect(isRoyCssImportUrl("roycss.min.css")).toBe(true);
    expect(isRoyCssImportUrl("roycss")).toBe(true);
    expect(isRoyCssImportUrl("roycss/css")).toBe(true);
    expect(isRoyCssImportUrl("roycss/dist/roycss.css")).toBe(true);
    expect(isRoyCssImportUrl("node_modules/roycss/dist/roycss.css")).toBe(true);
  });

  it("rejects lookalikes", () => {
    expect(isRoyCssImportUrl("other-roycss.css")).toBe(false);
    expect(isRoyCssImportUrl("roycss-fallbacks.css")).toBe(false);
    expect(isRoyCssImportUrl("tailwindcss")).toBe(false);
  });

  it("parses layer qualifiers", () => {
    expect(parseImportLayer('@import "roycss.css" layer(effects);')).toBe("effects");
    expect(parseImportLayer('@import "roycss.css";')).toBeUndefined();
  });
});
