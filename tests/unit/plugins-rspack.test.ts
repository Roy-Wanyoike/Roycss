import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import roycssRspack, { roycss, roycssStringSource } from "../../packages/plugins/rspack/src/index";

/**
 * @roycss/plugin-rspack — the webpack-engine adapter (Rspack implements
 * the webpack 5 plugin API). These tests drive the plugin through a
 * Rspack-shaped harness with the REAL webpack 5 asset-map semantics:
 * `compilation.assets[name]` IS the Source object and `source()` returns
 * `string | Buffer` (see the fidelity note in plugins-webpack.test.ts,
 * which verifies the shape against the webpack 5 implementation bundled
 * with Next.js). Honesty note: this adapter is typechecked structurally —
 * not against a live Rspack build.
 */

const REPO_ROOT = join(__dirname, "..", "..");
const DIST_CSS = join(REPO_ROOT, "dist", "roycss.css");
const FULL_CSS = readFileSync(DIST_CSS, "utf8");
const FIXTURES = join(__dirname, "plugins-fixtures");

/** A webpack 5 / Rspack Source whose `source()` returns a string. */
function stringSource(text: string): { source(): string | Buffer; size(): number } {
  return { source: () => text, size: () => Buffer.byteLength(text, "utf8") };
}

/** A Source returning a Buffer (the string | Buffer contract). */
function bufferSource(text: string): { source(): string | Buffer; size(): number } {
  return { source: () => Buffer.from(text, "utf8"), size: () => Buffer.byteLength(text, "utf8") };
}

interface RunResult {
  assets: Record<string, { source(): string | Buffer; size?(): number }>;
  emitted: { name: string }[];
  updated: { name: string }[];
}

/** Drive the plugin through an rspack-shaped compiler/compilation pair. */
function runRspack(plugin: ReturnType<typeof roycssRspack>, assets: Record<string, { source(): string | Buffer }>, mode: "development" | "production" = "production"): RunResult {
  const store: Record<string, { source(): string | Buffer; size?(): number }> = { ...assets };
  const emitted: { name: string }[] = [];
  const updated: { name: string }[] = [];
  let processAssetsFn: ((assets: Record<string, { source(): string | Buffer }>) => void) | undefined;

  const compilation = {
    assets: store,
    hooks: {
      processAssets: {
        tap(_options: unknown, fn: NonNullable<typeof processAssetsFn>) {
          processAssetsFn = fn;
        },
      },
    },
    emitAsset(name: string, source: { source(): string | Buffer }) {
      emitted.push({ name });
      store[name] = source;
    },
    updateAsset(name: string, source: { source(): string | Buffer }) {
      updated.push({ name });
      store[name] = source;
    },
  };
  plugin.apply({
    options: { mode },
    context: FIXTURES,
    hooks: { compilation: { tap: (_n: string, fn: (c: typeof compilation) => void) => fn(compilation) } },
  });
  if (!processAssetsFn) throw new Error("processAssets was not registered");
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  try {
    processAssetsFn(store as Record<string, { source(): string | Buffer }>);
  } finally {
    warn.mockRestore();
  }
  return { assets: store, emitted, updated };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("rspack adapter (shared webpack engine)", () => {
  it("exposes the Rspack-branded plugin interface and a named alias", () => {
    const plugin = roycssRspack();
    expect(plugin.name).toBe("@roycss/plugin-rspack");
    expect(typeof plugin.apply).toBe("function");
    expect(roycss).toBe(roycssRspack);
  });

  it("replaces the stylesheet asset with the extracted subset (webpack 5 asset semantics)", () => {
    const { assets, updated } = runRspack(
      roycssRspack({ css: DIST_CSS, scan: [], include: ["roycss-shake", "roycss-pulse-glow"] }),
      { "css/roycss.css": stringSource(FULL_CSS) },
    );
    expect(updated).toHaveLength(1);
    const css = String(assets["css/roycss.css"].source());
    expect(css).toContain(".roycss-shake");
    expect(css).toContain("@keyframes roy-pulse-glow");
    expect(css).not.toContain(".roycss-fade-in-up");
  });

  it("reads a Buffer-returning Source (string | Buffer contract)", () => {
    const { updated } = runRspack(
      roycssRspack({ css: DIST_CSS, scan: [], include: ["roycss-shake"] }),
      { "css/roycss.css": bufferSource(FULL_CSS) },
    );
    expect(updated).toHaveLength(1);
  });

  it("emits the subset as a new asset when no stylesheet asset is present", () => {
    const { assets, emitted } = runRspack(
      roycssRspack({ css: DIST_CSS, scan: [], include: ["roycss-shake"] }),
      { "js/main.js": stringSource("console.log(1)") },
    );
    expect(emitted).toHaveLength(1);
    expect(emitted[0].name).toBe("roycss.css");
    expect(String(assets["roycss.css"].source())).toContain(".roycss-shake");
  });

  it("scans the scan roots for class usage", () => {
    const { assets } = runRspack(roycssRspack({ css: DIST_CSS, scan: [join(FIXTURES, "sample-page.tsx")] }), {});
    const css = String(assets["roycss.css"].source());
    expect(css).toContain(".roycss-pulse-glow");
    expect(css).not.toContain(".roycss-fade-in-up");
  });

  it("keeps the full stylesheet in development mode (HMR-safe)", () => {
    const { assets, updated } = runRspack(
      roycssRspack({ css: DIST_CSS, scan: [], include: ["roycss-shake"] }),
      { "roycss.css": stringSource(FULL_CSS) },
      "development",
    );
    expect(updated).toHaveLength(0);
    expect(assets["roycss.css"].source()).toBe(FULL_CSS);
  });

  it("extracts in development with dev: 'extract'", () => {
    const { assets, updated } = runRspack(
      roycssRspack({ css: DIST_CSS, scan: [], include: ["roycss-shake"], dev: "extract" }),
      { "roycss.css": stringSource(FULL_CSS) },
      "development",
    );
    expect(updated).toHaveLength(1);
    expect(String(assets["roycss.css"].source())).toContain(".roycss-shake");
  });

  it("re-exports the webpack engine's Source helper", () => {
    const source = roycssStringSource(".a{}");
    expect(source.source()).toBe(".a{}");
    expect(source.size()).toBe(4);
  });
});
