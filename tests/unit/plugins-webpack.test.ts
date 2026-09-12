import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import roycssWebpack, {
  createRoyCssWebpackEngine,
  roycss,
} from "../../packages/plugins/webpack/src/index";

/**
 * @roycss/plugin-webpack — structural + behavioural tests that exercise the
 * plugin's `apply` → `compilation.hooks.processAssets` path directly.
 *
 * ── HARNESS FIDELITY NOTE (webpack 5 asset-map shape) ──────────────────
 * webpack 5's `Compilation#emitAsset(name, source)` stores the Source
 * object DIRECTLY in the asset map: `compilation.assets[name]` IS the
 * Source, and `assets[name].source()` returns `string | Buffer`. It is
 * NOT `{ source: SourceObject }` — that shape belongs to the chunk-asset
 * info records (`{ hash, source, chunk }`). Verified against the webpack
 * 5 implementation bundled with Next.js
 * (`next/dist/compiled/webpack/bundle5.js`):
 *
 *   emitAsset(v,I,P={}){if(this.assets[v]){if(!Qt(this.assets[v],I)){…}}}
 *
 * The harness below replicates the REAL shape — every asset value is a
 * Source-like object with a `source()` method (string- and
 * Buffer-returning variants). Do NOT "fix" the plugin to double-unwrap
 * `.source.source()`, and do NOT flatten the harness to bare strings:
 * both regressions were a real bug class (session 3) — the plugin read
 * `assets[name].source.source()` and the full-stylesheet replace path
 * was dead code that silently fell through to double-emit.
 * ──────────────────────────────────────────────────────────────────────
 */

const REPO_ROOT = join(__dirname, "..", "..");
const DIST_CSS = join(REPO_ROOT, "dist", "roycss.css");
const FULL_CSS = readFileSync(DIST_CSS, "utf8");
const FIXTURES = join(__dirname, "plugins-fixtures");
const SAMPLE_PAGE = join(FIXTURES, "sample-page.tsx");

/** A webpack 5 Source whose `source()` returns a string (the common case). */
function stringSource(text: string): { source(): string | Buffer; size(): number } {
  return {
    source: () => text,
    size: () => Buffer.byteLength(text, "utf8"),
  };
}

/**
 * A webpack 5 Source whose `source()` returns a Buffer — `RawSource` built
 * from binary-oriented pipelines. The read path must tolerate BOTH return
 * types (`string | Buffer` is the documented Source contract).
 */
function bufferSource(text: string): { source(): string | Buffer; size(): number } {
  return {
    source: () => Buffer.from(text, "utf8"),
    size: () => Buffer.byteLength(text, "utf8"),
  };
}

interface RunWebpackOptions {
  assets?: Record<string, { source(): string | Buffer; size(): number }>;
  mode?: "development" | "production" | "none";
  context?: string;
}

interface RunResult {
  /** The (mutated) compilation asset map — values are still Source objects. */
  assets: Record<string, { source(): string | Buffer; size?(): number }>;
  processAssetsTap: { name: string; stage?: number; additionalAssets?: boolean };
  emitted: { name: string; source: { source(): string | Buffer } }[];
  updated: { name: string; source: { source(): string | Buffer } }[];
  warnings: string[];
}

/** Drive the plugin through a webpack-5-shaped compiler/compilation pair. */
function runWebpack(plugin: ReturnType<typeof roycssWebpack>, runOptions: RunWebpackOptions = {}): RunResult {
  const assets: Record<string, { source(): string | Buffer; size?(): number }> = { ...(runOptions.assets ?? {}) };
  const emitted: RunResult["emitted"] = [];
  const updated: RunResult["updated"] = [];
  const warnings: string[] = [];
  let processAssetsTap: RunResult["processAssetsTap"] | undefined;
  let processAssetsFn: ((assets: Record<string, { source(): string | Buffer }>) => void) | undefined;

  const compilation = {
    // REAL shape: the map values ARE the Source objects (see fidelity note).
    assets,
    hooks: {
      processAssets: {
        tap(tapOptions: RunResult["processAssetsTap"], fn: NonNullable<typeof processAssetsFn>) {
          if (processAssetsTap) throw new Error("processAssets tapped twice");
          processAssetsTap = tapOptions;
          processAssetsFn = fn;
        },
      },
    },
    emitAsset(name: string, source: { source(): string | Buffer }) {
      emitted.push({ name, source });
      assets[name] = source;
    },
    updateAsset(name: string, source: { source(): string | Buffer }) {
      updated.push({ name, source });
      assets[name] = source;
    },
  };
  const compiler = {
    options: { mode: runOptions.mode ?? "production" },
    context: runOptions.context ?? FIXTURES,
    hooks: {
      compilation: {
        // (Param named `c` — a `compilation` param would shadow the const
        // and make `typeof compilation` self-referential, TS2502.)
        tap(_name: string, fn: (c: typeof compilation) => void) {
          fn(compilation);
        },
      },
    },
  };

  plugin.apply(compiler as Parameters<typeof plugin.apply>[0]);
  if (!processAssetsFn) throw new Error("processAssets was not registered");
  const warn = vi.spyOn(console, "warn").mockImplementation((msg) => warnings.push(String(msg)));
  try {
    processAssetsFn(assets as Record<string, { source(): string | Buffer }>);
  } finally {
    warn.mockRestore();
  }
  return { assets, processAssetsTap: processAssetsTap!, emitted, updated, warnings };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("plugin shape", () => {
  it("exposes the documented webpack plugin interface and a named alias", () => {
    const plugin = roycssWebpack();
    expect(plugin.name).toBe("@roycss/plugin-webpack");
    expect(typeof plugin.apply).toBe("function");
    expect(roycss).toBe(roycssWebpack);
  });

  it("taps processAssets at the PRE_PROCESS stage with additionalAssets", () => {
    const { processAssetsTap } = runWebpack(roycssWebpack({ css: DIST_CSS, scan: [] }), {});
    expect(processAssetsTap.name).toBe("@roycss/plugin-webpack");
    expect(processAssetsTap.stage).toBe(-10000); // webpack.ProcessAssetsStage.PRE_PROCESS
    expect(processAssetsTap.additionalAssets).toBe(true);
  });

  it("exposes the shared engine factory (used by the rspack adapter)", () => {
    expect(typeof createRoyCssWebpackEngine).toBe("function");
    expect(createRoyCssWebpackEngine("x", { css: DIST_CSS }).name).toBe("x");
  });
});

describe("stylesheet replacement (asset map: Source objects)", () => {
  it("replaces a byte-identical stylesheet asset with the extracted subset", () => {
    const { assets, updated } = runWebpack(
      roycssWebpack({ css: DIST_CSS, scan: [], include: ["roycss-shake", "roycss-pulse-glow"] }),
      { assets: { "js/main.js": stringSource("console.log(1)"), "css/roycss.css": stringSource(FULL_CSS) } },
    );
    expect(updated).toHaveLength(1);
    expect(updated[0].name).toBe("css/roycss.css");
    // The replacement is a Source object with source()+size() — the real
    // shape (roycssStringSource provides the { source, size } contract).
    expect(typeof assets["css/roycss.css"].source).toBe("function");
    const css = String(assets["css/roycss.css"].source());
    expect(assets["css/roycss.css"].size!()).toBe(Buffer.byteLength(css, "utf8"));
    expect(css).toContain(".roycss-shake");
    expect(css).toContain("@keyframes roy-pulse-glow");
    expect(css).not.toContain(".roycss-fade-in-up");
    expect(assets["js/main.js"].source()).toBe("console.log(1)"); // untouched
  });

  it("replaces roycss.min.css assets too", () => {
    const { assets } = runWebpack(
      roycssWebpack({ css: DIST_CSS, scan: [], include: ["roycss-shake"] }),
      { assets: { "roycss.min.css": stringSource(FULL_CSS) } },
    );
    expect(String(assets["roycss.min.css"].source())).toContain(".roycss-shake");
  });

  it("reads a Buffer-returning Source (string | Buffer contract)", () => {
    // Regression (session 3): Source#source() may return a Buffer — the
    // read path must tolerate it, not assume a string.
    const { assets, updated } = runWebpack(
      roycssWebpack({ css: DIST_CSS, scan: [], include: ["roycss-shake"] }),
      { assets: { "css/roycss.css": bufferSource(FULL_CSS) } },
    );
    expect(updated).toHaveLength(1);
    expect(String(assets["css/roycss.css"].source())).toContain(".roycss-shake");
    expect(String(assets["css/roycss.css"].source())).not.toContain(".roycss-fade-in-up");
  });

  it("never replaces a roycss.css asset whose content differs (no clobbering)", () => {
    const { assets, updated, emitted, warnings } = runWebpack(
      roycssWebpack({ css: DIST_CSS, scan: [], include: ["roycss-shake"] }),
      { assets: { "roycss.css": stringSource("/* user-modified vendored copy */\n.r-custom {}") } },
    );
    expect(updated).toHaveLength(0);
    expect(emitted).toHaveLength(0); // would clobber the user's file — skipped
    expect(String(assets["roycss.css"].source())).toContain("user-modified");
    expect(warnings.some((w) => w.includes("does not match the RoyCSS stylesheet"))).toBe(true);
  });

  it("replaces on every compilation (watch rebuilds re-scan)", () => {
    const plugin = roycssWebpack({ css: DIST_CSS, scan: [], include: ["roycss-shake"] });
    const first = runWebpack(plugin, { assets: { "roycss.css": stringSource(FULL_CSS) } });
    expect(first.updated).toHaveLength(1);
    // Second compilation (watch rebuild) with the same plugin instance.
    const second = runWebpack(plugin, { assets: { "roycss.css": stringSource(FULL_CSS) } });
    expect(second.updated).toHaveLength(1);
  });
});

describe("emission fallback (no stylesheet asset)", () => {
  it("emits the subset as a new roycss.css asset", () => {
    const { assets, emitted, updated } = runWebpack(
      roycssWebpack({ css: DIST_CSS, scan: [], include: ["roycss-shake"] }),
      { assets: { "js/main.js": stringSource("console.log(1)") } },
    );
    expect(updated).toHaveLength(0);
    expect(emitted).toHaveLength(1);
    expect(emitted[0].name).toBe("roycss.css");
    expect(String(assets["roycss.css"].source())).toContain(".roycss-shake");
    expect(String(assets["roycss.css"].source())).not.toContain(".roycss-fade-in-up");
  });

  it("honours the assetName option", () => {
    const { assets, emitted } = runWebpack(
      roycssWebpack({ css: DIST_CSS, scan: [], include: ["roycss-shake"], assetName: "effects.css" }),
      { assets: {} },
    );
    expect(emitted[0].name).toBe("effects.css");
    expect(assets["effects.css"]).toBeDefined();
  });

  it("skips emission when emit: false", () => {
    const { emitted, assets } = runWebpack(
      roycssWebpack({ css: DIST_CSS, scan: [], include: ["roycss-shake"], emit: false }),
      { assets: {} },
    );
    expect(emitted).toHaveLength(0);
    expect(Object.keys(assets)).toHaveLength(0);
  });
});

describe("scanning + options", () => {
  it("scans the scan roots for class usage", () => {
    const { assets } = runWebpack(
      roycssWebpack({ css: DIST_CSS, scan: [SAMPLE_PAGE] }),
      { assets: {} },
    );
    const css = String(assets["roycss.css"].source());
    expect(css).toContain(".roycss-pulse-glow");
    expect(css).toContain(".roycss-bounce-in");
    expect(css).not.toContain(".roycss-fade-in-up");
  });

  it("pre-scans the default roots (<root>/src) when no scan option is given", () => {
    const project = mkdtempSync(join(tmpdir(), "roycss-webpack-"));
    // No src/ dir yet → no classes found → full stylesheet + warning.
    const empty = runWebpack(roycssWebpack({ css: DIST_CSS }), { context: project });
    expect(empty.warnings.some((w) => w.includes("FULL stylesheet"))).toBe(true);

    // A src/App.tsx appears (watch rebuild scenario) → its classes extract.
    mkdirSync(join(project, "src"));
    writeFileSync(join(project, "src", "App.tsx"), 'export const c = "roycss-shake";');
    const populated = runWebpack(roycssWebpack({ css: DIST_CSS }), { context: project });
    const css = String(populated.assets["roycss.css"].source());
    expect(css).toContain(".roycss-shake");
    expect(css).not.toContain(".roycss-fade-in-up");
  });

  it("emits the full stylesheet with a warning when no classes are found", () => {
    const { assets, warnings } = runWebpack(roycssWebpack({ css: DIST_CSS, scan: [] }), { assets: {} });
    expect(String(assets["roycss.css"].source())).toBe(FULL_CSS);
    expect(warnings.some((w) => w.includes("FULL stylesheet"))).toBe(true);
  });
});

describe("development mode (HMR-safe)", () => {
  it("keeps the full stylesheet asset in mode: development", () => {
    const { assets, updated } = runWebpack(
      roycssWebpack({ css: DIST_CSS, scan: [], include: ["roycss-shake"] }),
      { mode: "development", assets: { "roycss.css": stringSource(FULL_CSS) } },
    );
    expect(updated).toHaveLength(0);
    expect(assets["roycss.css"].source()).toBe(FULL_CSS);
  });

  it("emits the FULL stylesheet in development when emitting", () => {
    const { assets } = runWebpack(
      roycssWebpack({ css: DIST_CSS, scan: [], include: ["roycss-shake"] }),
      { mode: "development", assets: {} },
    );
    expect(String(assets["roycss.css"].source())).toBe(FULL_CSS);
  });

  it("extracts in development when dev: 'extract'", () => {
    const { assets, updated } = runWebpack(
      roycssWebpack({ css: DIST_CSS, scan: [], include: ["roycss-shake"], dev: "extract" }),
      { mode: "development", assets: { "roycss.css": stringSource(FULL_CSS) } },
    );
    expect(updated).toHaveLength(1);
    const css = String(assets["roycss.css"].source());
    expect(css).toContain(".roycss-shake");
    expect(css).not.toContain(".roycss-fade-in-up");
  });
});
