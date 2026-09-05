import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import postcss from "postcss";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createRoyCssPipeline,
  createRoyCssPostcssPlugin,
  generateRoyCssStylesheet,
  roycssCriticalStyle,
  roycssCriticalStyleTag,
  withRoyCss,
} from "../../packages/plugins/next/src/index";

/**
 * @roycss/plugin-next — withRoyCss generation, the SSR critical-CSS hooks
 * and the PostCSS-style pipeline (run through real PostCSS, which ships as
 * a Next.js dependency).
 */

const REPO_ROOT = join(__dirname, "..", "..");
const DIST_CSS = join(REPO_ROOT, "dist", "roycss.css");
const FULL_CSS = readFileSync(DIST_CSS, "utf8");
const FIXTURES = join(__dirname, "plugins-fixtures");
const SAMPLE_PAGE = join(FIXTURES, "sample-page.tsx");
const GLOBAL_CSS = readFileSync(join(FIXTURES, "global.css"), "utf8");

function makeTmpDir(): string {
  return mkdtempSync(join(tmpdir(), "roycss-next-"));
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("withRoyCss", () => {
  it("merges the consumer config untouched and returns it", () => {
    const config = withRoyCss({ reactStrictMode: true, images: { remotePatterns: [] } }, {
      css: DIST_CSS,
      scan: [SAMPLE_PAGE],
      outDir: makeTmpDir(),
    });
    expect(config.reactStrictMode).toBe(true);
    expect(config.images).toEqual({ remotePatterns: [] });
  });

  it("scans, extracts and writes the subset stylesheet (build mode)", () => {
    const outDir = makeTmpDir();
    withRoyCss({}, { css: DIST_CSS, scan: [SAMPLE_PAGE], outDir });
    const generated = readFileSync(join(outDir, "roycss.css"), "utf8");
    expect(generated).toContain(".roycss-pulse-glow");
    expect(generated).toContain("@keyframes roy-pulse-glow");
    expect(generated).toContain(".roycss-bounce-in");
    expect(generated).not.toContain(".roycss-fade-in-up");
    expect(generated.length).toBeLessThan(FULL_CSS.length / 20);
  });

  it("reports generation stats through generateRoyCssStylesheet", () => {
    const result = generateRoyCssStylesheet(
      { css: DIST_CSS, scan: [SAMPLE_PAGE], outDir: makeTmpDir() },
    );
    expect(result.isDev).toBe(false); // NODE_ENV=test → build path
    expect(result.classes).toContain("roycss-pulse-glow");
    expect(result.stats.keptRules).toBeGreaterThan(0);
    expect(result.stats.totalRules).toBeGreaterThan(1000);
    expect(existsSync(result.outPath)).toBe(true);
  });

  it("writes the FULL stylesheet in dev mode (HMR-safe)", () => {
    // vi.stubEnv (not a direct assignment — NODE_ENV is read-only under
    // @types/node) keeps the test type-clean.
    vi.stubEnv("NODE_ENV", "development");
    const result = generateRoyCssStylesheet({
      css: DIST_CSS,
      scan: [SAMPLE_PAGE],
      outDir: makeTmpDir(),
    });
    expect(result.isDev).toBe(true);
    expect(result.css).toBe(FULL_CSS);
  });

  it("falls back to the full stylesheet when no classes are found", () => {
    const outDir = makeTmpDir();
    const emptySource = join(makeTmpDir(), "empty.ts");
    const result = generateRoyCssStylesheet({ css: DIST_CSS, scan: [emptySource], outDir });
    expect(result.classes).toEqual([]);
    expect(result.css).toBe(FULL_CSS);
  });

  it("skips file generation in postcss pipeline mode", () => {
    const outDir = makeTmpDir();
    withRoyCss({}, { css: DIST_CSS, scan: [SAMPLE_PAGE], pipeline: "postcss" });
    expect(existsSync(join(outDir, "roycss.css"))).toBe(false);
  });
});

describe("roycssCriticalStyle (SSR injection hook)", () => {
  it("returns raw critical CSS for the given classes", () => {
    const css = roycssCriticalStyle({ css: DIST_CSS, classes: ["roycss-pulse-glow"] });
    expect(css).toContain(".roycss-pulse-glow");
    expect(css).toContain("@keyframes roy-pulse-glow");
    expect(css).not.toContain(".roycss-shake");
  });

  it("returns a <style> tag from roycssCriticalStyleTag", () => {
    const tag = roycssCriticalStyleTag({ css: DIST_CSS, classes: ["roycss-pulse-glow"] });
    expect(tag.startsWith("<style data-roycss-critical>")).toBe(true);
    expect(tag).toContain(".roycss-pulse-glow");
    expect(tag.endsWith("</style>")).toBe(true);
  });

  it("returns an empty string when nothing matches", () => {
    expect(roycssCriticalStyle({ css: DIST_CSS, classes: [] })).toBe("");
    expect(roycssCriticalStyle({ css: DIST_CSS, classes: ["roycss-nope-nope"] })).toBe("");
    expect(roycssCriticalStyleTag({ css: DIST_CSS, classes: ["roycss-nope-nope"] })).toBe("");
  });

  it("falls back to scanning the default roots when classes are omitted", () => {
    const css = roycssCriticalStyle({ css: DIST_CSS, scan: [SAMPLE_PAGE] });
    expect(css).toContain(".roycss-pulse-glow");
  });
});

describe("createRoyCssPostcssPlugin (PostCSS-style pipeline)", () => {
  it("replaces the roycss @import with the extracted subset", async () => {
    const plugin = createRoyCssPostcssPlugin({ css: DIST_CSS, scan: [SAMPLE_PAGE] });
    const result = await postcss([plugin]).process(GLOBAL_CSS, { from: "global.css" });
    expect(result.css).not.toContain('@import "roycss.css"');
    expect(result.css).toContain(".roycss-pulse-glow");
    expect(result.css).toContain("@keyframes roy-pulse-glow");
    // Consumer CSS passes through.
    expect(result.css).toContain(".app-shell");
    expect(result.css).toContain("--app-margin");
    expect(result.css).not.toContain(".roycss-fade-in-up");
  });

  it("preserves layer() qualifiers", async () => {
    const plugin = createRoyCssPostcssPlugin({ css: DIST_CSS, scan: [SAMPLE_PAGE] });
    const input = '@import "roycss.css" layer(effects);\n.b { color: blue; }\n';
    const result = await postcss([plugin]).process(input, { from: "layered.css" });
    expect(result.css).toContain("@layer effects");
    expect(result.css).toContain(".roycss-pulse-glow");
    expect(result.css).toContain(".b");
  });

  it("is a no-op for stylesheets without a roycss import", async () => {
    const plugin = createRoyCssPostcssPlugin({ css: DIST_CSS, scan: [SAMPLE_PAGE] });
    const input = "a { color: red; }\n";
    const result = await postcss([plugin]).process(input, { from: "plain.css" });
    expect(result.css).toContain("color: red");
    expect(result.css).not.toContain(".roycss-pulse-glow");
  });

  it("leaves non-RoyCSS imports untouched", async () => {
    const plugin = createRoyCssPostcssPlugin({ css: DIST_CSS, scan: [SAMPLE_PAGE] });
    const input = '@import "reset.css";\n';
    const result = await postcss([plugin]).process(input, { from: "imports.css" });
    expect(result.css).toContain('@import "reset.css"');
  });
});

describe("re-exports", () => {
  it("re-exports the shared pipeline from the core", () => {
    expect(typeof createRoyCssPipeline).toBe("function");
  });
});
