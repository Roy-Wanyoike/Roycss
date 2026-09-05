import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import roycssVite, { ROYCSS_VIRTUAL_MODULE, roycss } from "../../packages/plugins/vite/src/index";

/**
 * @roycss/plugin-vite — structural + behavioural tests that exercise the
 * plugin hooks directly (the `vite` import inside the plugin is type-only,
 * so no Vite runtime is needed here).
 */

const REPO_ROOT = join(__dirname, "..", "..");
const DIST_CSS = join(REPO_ROOT, "dist", "roycss.css");
const FULL_CSS = readFileSync(DIST_CSS, "utf8");
const FIXTURES = join(__dirname, "plugins-fixtures");
const SAMPLE_CODE = readFileSync(join(FIXTURES, "sample-page.tsx"), "utf8");

const RESOLVED_VIRTUAL = "\0virtual:roycss/css";

/** Invoke a plugin hook (plain function or `{ handler }` object form). */
function callHook(hook: unknown, ...args: unknown[]): unknown {
  if (typeof hook === "function") return (hook as (...a: unknown[]) => unknown)(...args);
  const handler = (hook as { handler?: unknown } | undefined)?.handler;
  if (typeof handler === "function") return (handler as (...a: unknown[]) => unknown)(...args);
  throw new Error("hook is not callable");
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("plugin shape", () => {
  it("exposes the documented Vite plugin interface", () => {
    const plugin = roycssVite();
    expect(plugin.name).toBe("@roycss/plugin-vite");
    expect(plugin.enforce).toBe("pre");
    expect(typeof plugin.configResolved).toBe("function");
    expect(typeof plugin.transform).toBe("function");
    expect(typeof plugin.resolveId).toBe("function");
    expect(typeof plugin.load).toBe("function");
    expect(typeof plugin.configureServer).toBe("function");
    expect(plugin.transformIndexHtml).toBeUndefined(); // inject: false by default
  });

  it("exports the virtual module id and a named alias", () => {
    expect(ROYCSS_VIRTUAL_MODULE).toBe("virtual:roycss/css");
    expect(roycss).toBe(roycssVite);
  });
});

describe("AOT extraction (build mode)", () => {
  it("serves the extracted subset through the virtual module", () => {
    const plugin = roycssVite({ css: DIST_CSS, include: ["roycss-shake", "roycss-pulse-glow"] });
    callHook(plugin.configResolved, { command: "build", root: FIXTURES });

    expect(callHook(plugin.resolveId, ROYCSS_VIRTUAL_MODULE)).toBe(RESOLVED_VIRTUAL);
    expect(callHook(plugin.resolveId, "./main.ts")).toBeNull();

    const css = callHook(plugin.load, RESOLVED_VIRTUAL) as string;
    expect(css).toContain(".roycss-shake");
    expect(css).toContain("@keyframes roy-shake");
    expect(css).toContain(".roycss-pulse-glow");
    expect(css).not.toContain(".roycss-fade-in-up");
  });

  it("marks classes during the transform and the next load picks them up", () => {
    const plugin = roycssVite({ css: DIST_CSS });
    callHook(plugin.configResolved, { command: "build", root: FIXTURES });

    // HMR-safe: the transform never rewrites module code.
    expect(callHook(plugin.transform, SAMPLE_CODE, "/src/Hero.tsx")).toBeNull();

    const css = callHook(plugin.load, RESOLVED_VIRTUAL) as string;
    expect(css).toContain(".roycss-pulse-glow");
    expect(css).toContain(".roycss-bounce-in");
    expect(css).not.toContain(".roycss-fade-in-up");
  });

  it("swaps the real stylesheet in place (import \"roycss.css\" usage)", () => {
    const plugin = roycssVite({ css: DIST_CSS, include: ["roycss-shake"] });
    callHook(plugin.configResolved, { command: "build", root: FIXTURES });
    const swapped = callHook(plugin.transform, FULL_CSS, DIST_CSS) as {
      code: string;
      map: null;
    } | null;
    expect(swapped).not.toBeNull();
    expect(swapped?.map).toBeNull();
    expect(swapped?.code).toContain(".roycss-shake");
    expect(swapped?.code).not.toContain(".roycss-fade-in-up");
  });

  it("falls back to the full stylesheet (with a warning) when nothing is used", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const plugin = roycssVite({ css: DIST_CSS });
    callHook(plugin.configResolved, { command: "build", root: FIXTURES });
    const css = callHook(plugin.load, RESOLVED_VIRTUAL) as string;
    expect(css).toBe(FULL_CSS);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("FULL stylesheet"));
  });

  it("ignores css, virtual and node_modules ids in the marking transform", () => {
    const plugin = roycssVite({ css: DIST_CSS });
    callHook(plugin.configResolved, { command: "build", root: FIXTURES });
    expect(callHook(plugin.transform, ".roycss-shake {}", "/src/styles.css")).toBeNull();
    expect(callHook(plugin.transform, "code", RESOLVED_VIRTUAL)).toBeNull();
    expect(callHook(plugin.transform, "code", "/node_modules/pkg/index.js")).toBeNull();
  });
});

describe("dev mode (HMR-safe)", () => {
  it("serves the full stylesheet by default", () => {
    const plugin = roycssVite({ css: DIST_CSS, include: ["roycss-shake"] });
    callHook(plugin.configResolved, { command: "serve", root: FIXTURES });
    const css = callHook(plugin.load, RESOLVED_VIRTUAL) as string;
    expect(css).toBe(FULL_CSS);
  });

  it("never rewrites the css module in dev (full mode)", () => {
    const plugin = roycssVite({ css: DIST_CSS });
    callHook(plugin.configResolved, { command: "serve", root: FIXTURES });
    expect(callHook(plugin.transform, FULL_CSS, DIST_CSS)).toBeNull();
  });

  it("serves the live-extracted subset when dev: 'extract'", () => {
    const plugin = roycssVite({ css: DIST_CSS, include: ["roycss-shake"], dev: "extract" });
    callHook(plugin.configResolved, { command: "serve", root: FIXTURES });
    const css = callHook(plugin.load, RESOLVED_VIRTUAL) as string;
    expect(css).toContain(".roycss-shake");
    expect(css).not.toContain(".roycss-fade-in-up");
    // Registering new classes through the transform triggers a reload.
    const send = vi.fn();
    callHook(plugin.configureServer, { ws: { send } });
    expect(callHook(plugin.transform, 'const x = "roycss-float"', "/src/App.tsx")).toBeNull();
    const updated = callHook(plugin.load, RESOLVED_VIRTUAL) as string;
    expect(updated).toContain(".roycss-float");
    expect(send).toHaveBeenCalledWith({ type: "full-reload" });
  });
});

describe("html injection option", () => {
  it("injects a <style> tag with the extracted css at build time", () => {
    const plugin = roycssVite({ css: DIST_CSS, include: ["roycss-shake"], inject: true });
    callHook(plugin.configResolved, { command: "build", root: FIXTURES });
    const result = callHook(
      plugin.transformIndexHtml,
      "<html><head><title>x</title></head><body></body></html>",
    ) as { html: string; tags: { tag: string; children: string; injectTo: string }[] };
    expect(result.html).toContain("<title>x</title>");
    expect(result.tags).toHaveLength(1);
    expect(result.tags[0].tag).toBe("style");
    expect(result.tags[0].injectTo).toBe("head");
    expect(result.tags[0].children).toContain(".roycss-shake");
  });
});
