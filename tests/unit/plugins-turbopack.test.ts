import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import postcss from "postcss";
import { afterEach, describe, expect, it, vi } from "vitest";
import roycssTurbopack, {
  ROYCSS_TURBOPACK_SUPPORT,
  createRoyCssTurbopackPostcssPlugin,
  generateRoyCssTurbopackStylesheet,
  roycss,
  withRoyCss,
  withRoyCssTurbopack,
} from "../../packages/plugins/turbopack/src/index";

/**
 * @roycss/plugin-turbopack — HONEST SUBSET. The adapter is the
 * bundler-agnostic generation pipeline from the Next.js adapter; these
 * tests pin the frozen support contract and drive the generation +
 * PostCSS paths (through real PostCSS) that the contract describes.
 */

const REPO_ROOT = join(__dirname, "..", "..");
const DIST_CSS = join(REPO_ROOT, "dist", "roycss.css");
const FULL_CSS = readFileSync(DIST_CSS, "utf8");
const FIXTURES = join(__dirname, "plugins-fixtures");
const SAMPLE_PAGE = join(FIXTURES, "sample-page.tsx");

function makeTmpDir(): string {
  return mkdtempSync(join(tmpdir(), "roycss-turbo-"));
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("frozen support contract (honest subset)", () => {
  it("documents exactly what Turbopack gets today", () => {
    expect(ROYCSS_TURBOPACK_SUPPORT).toEqual({
      generation: true,
      bundlerHooks: false,
      postcssPipeline: "untested",
    });
  });

  it("is frozen — no extra keys drift in", () => {
    expect(Object.keys(ROYCSS_TURBOPACK_SUPPORT).sort()).toEqual(["bundlerHooks", "generation", "postcssPipeline"]);
    expect(typeof ROYCSS_TURBOPACK_SUPPORT.generation).toBe("boolean");
    expect(typeof ROYCSS_TURBOPACK_SUPPORT.bundlerHooks).toBe("boolean");
  });

  it("the package description leads with HONEST SUBSET", () => {
    const pkg = JSON.parse(
      readFileSync(join(REPO_ROOT, "packages", "plugins", "turbopack", "package.json"), "utf8"),
    ) as { description: string };
    expect(pkg.description).toContain("HONEST SUBSET");
  });
});

describe("withRoyCssTurbopack (generation pipeline)", () => {
  it("merges the consumer config untouched — and adds no bundler hooks", () => {
    // bundlerHooks: false — the wrapper must not touch Next.js' turbopack
    // configuration surface at all.
    const config = withRoyCssTurbopack({ reactStrictMode: true, images: { remotePatterns: [] } }, {
      css: DIST_CSS,
      scan: [SAMPLE_PAGE],
      outDir: makeTmpDir(),
    });
    expect(config.reactStrictMode).toBe(true);
    expect(config.images).toEqual({ remotePatterns: [] });
    expect((config as Record<string, unknown>).turbopack).toBeUndefined();
  });

  it("exposes a named alias and the next-adapter exports", () => {
    expect(roycss).toBe(withRoyCssTurbopack);
    expect(roycssTurbopack).toBe(withRoyCssTurbopack);
    expect(typeof withRoyCss).toBe("function");
    expect(typeof generateRoyCssTurbopackStylesheet).toBe("function");
  });

  it("scans, extracts and writes the subset stylesheet (build mode)", () => {
    const outDir = makeTmpDir();
    withRoyCssTurbopack({}, { css: DIST_CSS, scan: [SAMPLE_PAGE], outDir });
    const generated = readFileSync(join(outDir, "roycss.css"), "utf8");
    expect(generated).toContain(".roycss-pulse-glow");
    expect(generated).toContain("@keyframes roy-pulse-glow");
    expect(generated).toContain(".roycss-bounce-in");
    expect(generated).not.toContain(".roycss-fade-in-up");
    expect(generated.length).toBeLessThan(FULL_CSS.length / 20);
  });

  it("writes the FULL stylesheet in dev mode (HMR-safe)", () => {
    vi.stubEnv("NODE_ENV", "development");
    const result = generateRoyCssTurbopackStylesheet({ css: DIST_CSS, scan: [SAMPLE_PAGE], outDir: makeTmpDir() });
    expect(result.isDev).toBe(true);
    expect(result.css).toBe(FULL_CSS);
  });

  it("reports generation stats (build mode)", () => {
    const result = generateRoyCssTurbopackStylesheet({ css: DIST_CSS, scan: [SAMPLE_PAGE], outDir: makeTmpDir() });
    expect(result.isDev).toBe(false); // NODE_ENV=test → build path
    expect(result.classes).toContain("roycss-pulse-glow");
    expect(result.stats.keptRules).toBeGreaterThan(0);
    expect(result.stats.totalRules).toBeGreaterThan(1000);
  });

  it("honours the include option (dynamic class names)", () => {
    const result = generateRoyCssTurbopackStylesheet({
      css: DIST_CSS,
      scan: [],
      include: ["roycss-shake"],
      outDir: makeTmpDir(),
    });
    expect(result.css).toContain(".roycss-shake");
    expect(result.css).not.toContain(".roycss-fade-in-up");
  });

  it("falls back to the full stylesheet (with a warning) when no classes are found", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = generateRoyCssTurbopackStylesheet({ css: DIST_CSS, scan: [join(makeTmpDir(), "none.ts")], outDir: makeTmpDir() });
    expect(result.css).toBe(FULL_CSS);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("found no r-*/roycss-* classes"));
  });

  it("never crashes the build on generation failure (fail-open)", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const config = withRoyCssTurbopack({ reactStrictMode: true }, { css: "/does/not/exist/roycss.css", outDir: makeTmpDir() });
    expect(config.reactStrictMode).toBe(true);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("stylesheet generation failed"));
  });

  it("skips file generation in postcss pipeline mode", () => {
    const outDir = makeTmpDir();
    // outDir is passed — if the pipeline option regressed, the generate
    // path would write roycss.css INTO it (and the assertion would fail).
    withRoyCssTurbopack({}, { css: DIST_CSS, scan: [SAMPLE_PAGE], outDir, pipeline: "postcss" });
    expect(existsSync(join(outDir, "roycss.css"))).toBe(false);
  });
});

describe("PostCSS pipeline (contract: untested against a live Turbopack build)", () => {
  it("inlines the extracted subset into @import \"roycss.css\" (real PostCSS)", () => {
    const plugin = createRoyCssTurbopackPostcssPlugin({ css: DIST_CSS, scan: [SAMPLE_PAGE] });
    const result = postcss([plugin]).process('@import "roycss.css";\n.app { margin: 0; }', { from: "app/globals.css" });
    expect(result.css).toContain(".roycss-pulse-glow");
    expect(result.css).toContain(".app { margin: 0; }");
    expect(result.css).not.toContain("@import");
    expect(result.css).not.toContain(".roycss-fade-in-up");
  });

  it("leaves non-RoyCSS imports untouched", () => {
    const plugin = createRoyCssTurbopackPostcssPlugin({ css: DIST_CSS, scan: [SAMPLE_PAGE] });
    const css = '@import "./reset.css";\n.app { margin: 0; }';
    const result = postcss([plugin]).process(css, { from: "app/globals.css" });
    expect(result.css).toBe(css);
  });

  it("preserves layer(…) qualifiers", () => {
    const plugin = createRoyCssTurbopackPostcssPlugin({ css: DIST_CSS, scan: [], include: ["roycss-shake"] });
    const result = postcss([plugin]).process('@import "roycss.css" layer(effects);', { from: "app/globals.css" });
    expect(result.css).toContain("@layer effects {");
    expect(result.css).toContain(".roycss-shake");
  });

  it("marks itself as a real PostCSS plugin", () => {
    const plugin = createRoyCssTurbopackPostcssPlugin as unknown as { postcss?: unknown };
    expect(plugin.postcss).toBe(true);
  });
});
