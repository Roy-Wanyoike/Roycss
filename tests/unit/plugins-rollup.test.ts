import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import roycssRollup, { ROYCSS_VIRTUAL_MODULE, roycss } from "../../packages/plugins/rollup/src/index";

/**
 * @roycss/plugin-rollup — structural + behavioural tests that drive the
 * plugin hooks directly (rollup is not installed in this repo's dev tree;
 * the plugin types it structurally — same pattern as the Vite tests).
 */

const REPO_ROOT = join(__dirname, "..", "..");
const DIST_CSS = join(REPO_ROOT, "dist", "roycss.css");
const FULL_CSS = readFileSync(DIST_CSS, "utf8");
const FIXTURES = join(__dirname, "plugins-fixtures");
const SAMPLE_CODE = readFileSync(join(FIXTURES, "sample-page.tsx"), "utf8");

const RESOLVED_VIRTUAL = "\0virtual:roycss/css";

/** Minimal Rollup plugin context (`this` inside hooks) — records emitFile calls. */
function makeContext(): { emitFile: ReturnType<typeof vi.fn>; context: { emitFile: typeof vi.fn } } {
  const emitFile = vi.fn();
  return { emitFile, context: { emitFile } };
}

/** Invoke a plugin hook (plain function) with a bound plugin context. */
function callHook(hook: unknown, context: object | undefined, ...args: unknown[]): unknown {
  if (typeof hook !== "function") throw new Error("hook is not callable");
  return (hook as (...a: unknown[]) => unknown).apply(context, args);
}

/** A plugin instance with buildStart already driven (root = repo cwd, like rollup). */
function startedPlugin(options: Parameters<typeof roycssRollup>[0] = {}): ReturnType<typeof roycssRollup> {
  const plugin = roycssRollup({ css: DIST_CSS, scan: [], ...options });
  const { context } = makeContext();
  callHook(plugin.buildStart, context, { input: "src/main.js" });
  return plugin;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("plugin shape", () => {
  it("exposes the documented Rollup plugin interface and a named alias", () => {
    const plugin = startedPlugin();
    expect(plugin.name).toBe("@roycss/plugin-rollup");
    expect(typeof plugin.buildStart).toBe("function");
    expect(typeof plugin.resolveId).toBe("function");
    expect(typeof plugin.load).toBe("function");
    expect(typeof plugin.transform).toBe("function");
    expect(typeof plugin.generateBundle).toBe("function");
    expect(roycss).toBe(roycssRollup);
    expect(ROYCSS_VIRTUAL_MODULE).toBe("virtual:roycss/css");
  });

  it("resolves the virtual module id and nothing else", () => {
    const plugin = startedPlugin();
    expect(callHook(plugin.resolveId, undefined, ROYCSS_VIRTUAL_MODULE)).toBe(RESOLVED_VIRTUAL);
    expect(callHook(plugin.resolveId, undefined, "./main.ts")).toBeNull();
  });

  it("serves the extracted subset through the virtual module", () => {
    const plugin = startedPlugin({ include: ["roycss-shake", "roycss-pulse-glow"] });
    const css = callHook(plugin.load, undefined, RESOLVED_VIRTUAL) as string;
    expect(css).toContain(".roycss-shake");
    expect(css).toContain("@keyframes roy-pulse-glow");
    expect(css).not.toContain(".roycss-fade-in-up");
  });
});

describe("transform (marking + in-place swap)", () => {
  it("marks classes during the transform and the next load picks them up", () => {
    const plugin = startedPlugin();
    // Watch-safe: the transform never rewrites module code.
    expect(callHook(plugin.transform, makeContext().context, SAMPLE_CODE, "/src/Hero.tsx")).toBeNull();
    const css = callHook(plugin.load, undefined, RESOLVED_VIRTUAL) as string;
    expect(css).toContain(".roycss-pulse-glow");
    expect(css).toContain(".roycss-bounce-in");
    expect(css).not.toContain(".roycss-fade-in-up");
  });

  it("swaps the real stylesheet in place (import \"roycss.css\" usage)", () => {
    const plugin = startedPlugin({ include: ["roycss-shake"] });
    const swapped = callHook(plugin.transform, makeContext().context, FULL_CSS, DIST_CSS) as {
      code: string;
      map: null;
    } | null;
    expect(swapped).not.toBeNull();
    expect(swapped?.map).toBeNull();
    expect(swapped?.code).toContain(".roycss-shake");
    expect(swapped?.code).not.toContain(".roycss-fade-in-up");
  });

  it("leaves other roycss-named css files alone", () => {
    const plugin = startedPlugin({ include: ["roycss-shake"] });
    expect(callHook(plugin.transform, makeContext().context, FULL_CSS, "/src/vendor/roycss.css")).toBeNull();
  });

  it("ignores css, virtual and node_modules ids in the marking transform", () => {
    const plugin = startedPlugin();
    expect(callHook(plugin.transform, makeContext().context, ".roycss-shake {}", "/src/styles.css")).toBeNull();
    expect(callHook(plugin.transform, makeContext().context, "code", RESOLVED_VIRTUAL)).toBeNull();
    expect(callHook(plugin.transform, makeContext().context, "code", "/node_modules/pkg/index.js")).toBeNull();
  });

  it("falls back to the full stylesheet (with a warning) when nothing is used", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const plugin = startedPlugin();
    const css = callHook(plugin.load, undefined, RESOLVED_VIRTUAL) as string;
    expect(css).toBe(FULL_CSS);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("FULL stylesheet"));
  });
});

describe("buildStart (resolution + pre-scan)", () => {
  it("pre-scans the scan roots", () => {
    const plugin = startedPlugin({ scan: [join(FIXTURES, "sample-page.tsx")] });
    const css = callHook(plugin.load, undefined, RESOLVED_VIRTUAL) as string;
    expect(css).toContain(".roycss-pulse-glow");
    expect(css).toContain(".roycss-bounce-in");
    expect(css).not.toContain(".roycss-fade-in-up");
  });

  it("honours the include option", () => {
    const plugin = startedPlugin({ include: ["roycss-shake"] });
    const css = callHook(plugin.load, undefined, RESOLVED_VIRTUAL) as string;
    expect(css).toContain(".roycss-shake");
    expect(css).not.toContain(".roycss-fade-in-up");
  });

  it("resolves the css option (root-relative paths resolve against cwd)", () => {
    const plugin = roycssRollup({ css: "dist/roycss.css", scan: [], include: ["roycss-shake"] });
    const { context } = makeContext();
    callHook(plugin.buildStart, context, { input: "src/main.js" });
    const swapped = callHook(plugin.transform, context, FULL_CSS, DIST_CSS) as { code: string } | null;
    expect(swapped?.code).toContain(".roycss-shake");
  });

  it("throws a helpful error when no stylesheet can be resolved", () => {
    const plugin = roycssRollup({ css: "does/not/exist.css", scan: [] });
    const { context } = makeContext();
    expect(() => callHook(plugin.buildStart, context, {})).toThrow(/Could not read stylesheet/);
  });
});

describe("generateBundle (emit option)", () => {
  it("emits the subset as an asset when emit: true", () => {
    const plugin = startedPlugin({ include: ["roycss-shake"], emit: true });
    const { emitFile, context } = makeContext();
    callHook(plugin.generateBundle, context, { dir: "dist" }, {});
    expect(emitFile).toHaveBeenCalledTimes(1);
    const reference = emitFile.mock.calls[0][0] as { type: string; name: string; source: string };
    expect(reference.type).toBe("asset");
    expect(reference.name).toBe("roycss.css");
    expect(reference.source).toContain(".roycss-shake");
    expect(reference.source).not.toContain(".roycss-fade-in-up");

    // The assetName option overrides the default name.
    const renamed = startedPlugin({ include: ["roycss-shake"], emit: true, assetName: "effects.css" });
    const renamedContext = makeContext();
    callHook(renamed.generateBundle, renamedContext.context, { dir: "dist" }, {});
    expect((renamedContext.emitFile.mock.calls[0][0] as { name: string }).name).toBe("effects.css");
  });

  it("does not emit anything by default", () => {
    const plugin = startedPlugin({ include: ["roycss-shake"] });
    const { emitFile, context } = makeContext();
    callHook(plugin.generateBundle, context, { dir: "dist" }, {});
    expect(emitFile).not.toHaveBeenCalled();
  });

  it("emits the full stylesheet (with a warning) when no classes are used", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const plugin = startedPlugin({ emit: true });
    const { emitFile, context } = makeContext();
    callHook(plugin.generateBundle, context, { dir: "dist" }, {});
    expect((emitFile.mock.calls[0][0] as { source: string }).source).toBe(FULL_CSS);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("FULL stylesheet"));
  });

  it("reflects classes marked by the transform in the emitted asset", () => {
    const plugin = startedPlugin({ emit: true });
    callHook(plugin.transform, context0(), SAMPLE_CODE, "/src/Hero.tsx");
    const { emitFile, context } = makeContext();
    callHook(plugin.generateBundle, context, { dir: "dist" }, {});
    const source = (emitFile.mock.calls[0][0] as { source: string }).source;
    expect(source).toContain(".roycss-pulse-glow");
    expect(source).not.toContain(".roycss-fade-in-up");
  });
});

function context0(): object {
  return makeContext().context;
}
