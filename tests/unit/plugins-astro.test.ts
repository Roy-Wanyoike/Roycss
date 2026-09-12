import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import roycssAstro, { roycss } from "../../packages/plugins/astro/src/index";
import type { AstroConfigSetupHookOptions, AstroIntegrationLike } from "../../packages/plugins/astro/src/index";
import type { Plugin as VitePlugin } from "vite";

/**
 * @roycss/plugin-astro — the integration delegates to the Vite plugin, so
 * these tests drive the INJECTED vite plugin end-to-end (configResolved →
 * resolveId/load/transform), not a mocked one. The Astro side of the
 * harness uses the structural `astro:config:setup` shell (command +
 * config + updateConfig), exactly as Astro invokes it.
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

interface SetupResult {
  /** Whether updateConfig was called at all (sync must never call it). */
  updated: boolean;
  /** The injected Vite plugin (first and only), when updateConfig ran. */
  vitePlugin: VitePlugin | undefined;
  /** The full config object handed to updateConfig. */
  config: { vite?: { plugins?: unknown[] } } | undefined;
}

/** Run the astro:config:setup hook with the given command/config, capturing the injection. */
function runSetup(
  integration: AstroIntegrationLike,
  options: Partial<AstroConfigSetupHookOptions> & { command: AstroConfigSetupHookOptions["command"] },
): SetupResult {
  const result: SetupResult = { updated: false, vitePlugin: undefined, config: undefined };
  const hookOptions: AstroConfigSetupHookOptions = {
    command: options.command,
    config: options.config ?? { root: FIXTURES },
    updateConfig: (config) => {
      result.updated = true;
      result.config = config;
      result.vitePlugin = (config.vite?.plugins?.[0] ?? undefined) as VitePlugin | undefined;
    },
  };
  integration.hooks["astro:config:setup"](hookOptions);
  return result;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("integration shape", () => {
  it("exposes the Astro integration shape and a named alias", () => {
    const integration = roycssAstro();
    expect(integration.name).toBe("@roycss/plugin-astro");
    expect(typeof integration.hooks["astro:config:setup"]).toBe("function");
    expect(roycss).toBe(roycssAstro);
  });

  it("injects exactly one vite plugin under config.vite.plugins", () => {
    const result = runSetup(roycssAstro({ css: DIST_CSS, scan: [] }), { command: "build" });
    expect(result.updated).toBe(true);
    expect(result.config?.vite?.plugins).toHaveLength(1);
    expect((result.vitePlugin as { name?: string } | undefined)?.name).toBe("@roycss/plugin-vite");
  });

  it("injects for dev, build and preview commands alike (only sync is a no-op)", () => {
    expect(runSetup(roycssAstro({ css: DIST_CSS, scan: [] }), { command: "dev" }).updated).toBe(true);
    expect(runSetup(roycssAstro({ css: DIST_CSS, scan: [] }), { command: "preview" }).updated).toBe(true);
  });
});

describe("astro sync is a no-op (regression)", () => {
  it("returns before resolving the stylesheet — no updateConfig, no throw", () => {
    // Regression (session 3): `astro sync` used to compute the stylesheet
    // path before its early-return, crashing with
    // "[roycss] No RoyCSS stylesheet found" in projects without the
    // artifact. sync must be a silent no-op instead.
    const bareProject = mkdtempSync(join(tmpdir(), "roycss-astro-sync-"));
    expect(() => runSetup(roycssAstro(), { command: "sync", config: { root: bareProject } })).not.toThrow();
  });

  it("injects nothing even when the stylesheet IS present", () => {
    const result = runSetup(roycssAstro({ css: DIST_CSS, scan: [] }), { command: "sync" });
    expect(result.updated).toBe(false);
    expect(result.vitePlugin).toBeUndefined();
  });
});

describe("delegation to the vite plugin (end-to-end)", () => {
  it("build command: the injected plugin extracts the subset (virtual module)", () => {
    const { vitePlugin } = runSetup(roycssAstro({ css: DIST_CSS, scan: [], include: ["roycss-shake"] }), { command: "build" });
    callHook(vitePlugin!.configResolved, { command: "build", root: FIXTURES });
    expect(callHook(vitePlugin!.resolveId, "virtual:roycss/css")).toBe(RESOLVED_VIRTUAL);
    const css = callHook(vitePlugin!.load, RESOLVED_VIRTUAL) as string;
    expect(css).toContain(".roycss-shake");
    expect(css).not.toContain(".roycss-fade-in-up");
  });

  it("dev command: the injected plugin serves the full stylesheet (HMR-safe)", () => {
    const { vitePlugin } = runSetup(roycssAstro({ css: DIST_CSS, scan: [] }), { command: "dev" });
    callHook(vitePlugin!.configResolved, { command: "serve", root: FIXTURES });
    const css = callHook(vitePlugin!.load, RESOLVED_VIRTUAL) as string;
    expect(css).toBe(FULL_CSS);
  });

  it("marking transform works through the injected plugin", () => {
    const { vitePlugin } = runSetup(roycssAstro({ css: DIST_CSS, scan: [] }), { command: "build" });
    callHook(vitePlugin!.configResolved, { command: "build", root: FIXTURES });
    expect(callHook(vitePlugin!.transform, SAMPLE_CODE, "/src/Hero.tsx")).toBeNull();
    const css = callHook(vitePlugin!.load, RESOLVED_VIRTUAL) as string;
    expect(css).toContain(".roycss-bounce-in");
    expect(css).not.toContain(".roycss-fade-in-up");
  });

  it("options pass through: include + dev: 'extract'", () => {
    const { vitePlugin } = runSetup(
      roycssAstro({ css: DIST_CSS, scan: [], include: ["roycss-shake"], dev: "extract" }),
      { command: "dev" },
    );
    callHook(vitePlugin!.configResolved, { command: "serve", root: FIXTURES });
    const css = callHook(vitePlugin!.load, RESOLVED_VIRTUAL) as string;
    expect(css).toContain(".roycss-shake");
    expect(css).not.toContain(".roycss-fade-in-up");
  });

  it("scan roots pass through to the injected plugin", () => {
    const { vitePlugin } = runSetup(roycssAstro({ css: DIST_CSS, scan: [join(FIXTURES, "sample-page.tsx")] }), { command: "build" });
    callHook(vitePlugin!.configResolved, { command: "build", root: FIXTURES });
    const css = callHook(vitePlugin!.load, RESOLVED_VIRTUAL) as string;
    expect(css).toContain(".roycss-pulse-glow");
    expect(css).not.toContain(".roycss-fade-in-up");
  });

  it("adds a customized srcDir as an extra scan root", () => {
    const project = mkdtempSync(join(tmpdir(), "roycss-astro-srcdir-"));
    mkdirSync(join(project, "source"));
    writeFileSync(join(project, "source", "App.tsx"), 'export const c = "roycss-shake";');
    const { vitePlugin } = runSetup(roycssAstro({ css: DIST_CSS }), {
      command: "build",
      config: { root: project, srcDir: "source" },
    });
    callHook(vitePlugin!.configResolved, { command: "build", root: project });
    const css = callHook(vitePlugin!.load, RESOLVED_VIRTUAL) as string;
    expect(css).toContain(".roycss-shake");
    expect(css).not.toContain(".roycss-fade-in-up");
  });

  it("honours the css option in a project with no resolvable stylesheet", () => {
    const bareProject = mkdtempSync(join(tmpdir(), "roycss-astro-css-"));
    // Without the css option this throws (see the next test); with it, the
    // injection succeeds.
    const result = runSetup(roycssAstro({ css: DIST_CSS, scan: [] }), { command: "build", config: { root: bareProject } });
    expect(result.updated).toBe(true);
  });

  it("throws the documented error in dev/build when no stylesheet can be resolved", () => {
    const bareProject = mkdtempSync(join(tmpdir(), "roycss-astro-bare-"));
    expect(() => runSetup(roycssAstro(), { command: "build", config: { root: bareProject } })).toThrow(
      /No RoyCSS stylesheet found/,
    );
  });
});
