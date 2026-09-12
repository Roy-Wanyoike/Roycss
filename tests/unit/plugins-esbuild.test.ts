import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import roycssEsbuild, {
  roycss,
  type EsbuildOnLoadArgsLike,
  type EsbuildOnLoadResultLike,
  type EsbuildPluginLike,
} from "../../packages/plugins/esbuild/src/index";

/**
 * @roycss/plugin-esbuild — structural + behavioural tests that drive the
 * `setup(build)` onLoad registrations directly (esbuild is not installed
 * in this repo's dev tree; the plugin types it structurally).
 *
 * Harness notes:
 *  • `onLoad` filters are recorded and matched against `args.path` with
 *    plain JS RegExp — the same regular expressions the plugin hands to
 *    a real esbuild build.
 *  • Both content-serving onLoads (module marking + stylesheet swap) MUST
 *    return `watchFiles` — esbuild only auto-watches files it reads
 *    itself, so a plugin-served file without `watchFiles` is invisible to
 *    watch mode (session-3 bug, now pinned here).
 */

const REPO_ROOT = join(__dirname, "..", "..");
const DIST_CSS = join(REPO_ROOT, "dist", "roycss.css");
const FULL_CSS = readFileSync(DIST_CSS, "utf8");
const FIXTURES = join(__dirname, "plugins-fixtures");
const SAMPLE_PAGE = join(FIXTURES, "sample-page.tsx");
const SAMPLE_CODE = readFileSync(SAMPLE_PAGE, "utf8");

interface RegisteredOnLoad {
  filter: RegExp;
  callback: (args: EsbuildOnLoadArgsLike) => EsbuildOnLoadResultLike | null | undefined;
}

interface EsbuildHarness {
  plugin: EsbuildPluginLike;
  onLoads: RegisteredOnLoad[];
  /** Run the registered onLoads for a path, first match wins (esbuild semantics). */
  runOnLoad(path: string): EsbuildOnLoadResultLike | null;
}

function onLoadArgs(path: string): EsbuildOnLoadArgsLike {
  return { path, namespace: "file", suffix: "", pluginData: undefined };
}

function makeHarness(options: Parameters<typeof roycssEsbuild>[0], watch: boolean | undefined = undefined): EsbuildHarness {
  const onLoads: RegisteredOnLoad[] = [];
  const build = {
    initialOptions: { absWorkingDir: FIXTURES, watch },
    onLoad: (filter: RegExp, callback: RegisteredOnLoad["callback"]) => {
      onLoads.push({ filter, callback });
    },
    onResolve: () => {},
  };
  const plugin = roycssEsbuild(options);
  plugin.setup(build as Parameters<typeof plugin.setup>[0]);
  return {
    plugin,
    onLoads,
    runOnLoad(path) {
      for (const { filter, callback } of onLoads) {
        if (filter.test(path)) {
          const result = callback(onLoadArgs(path));
          if (result) return result;
        }
      }
      return null;
    },
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("plugin shape", () => {
  it("exposes the documented esbuild plugin interface and a named alias", () => {
    const harness = makeHarness({ css: DIST_CSS, scan: [] });
    expect(harness.plugin.name).toBe("@roycss/plugin-esbuild");
    expect(typeof harness.plugin.setup).toBe("function");
    expect(harness.onLoads.length).toBe(2); // stylesheet swap + module marking
    expect(roycss).toBe(roycssEsbuild);
  });

  it("registers a stylesheet onLoad that only matches roycss css basenames", () => {
    const harness = makeHarness({ css: DIST_CSS, scan: [] });
    const stylesheet = harness.onLoads.find(({ filter }) => filter.test("/project/node_modules/roycss/dist/roycss.css"));
    expect(stylesheet).toBeDefined();
    // Non-RoyCSS css is not matched by the stylesheet filter.
    expect(harness.onLoads.some(({ filter }) => filter.test("/project/src/styles.css"))).toBe(false);
  });

  it("declines a roycss.css file that is not the resolved stylesheet", () => {
    const harness = makeHarness({ css: DIST_CSS, scan: [] });
    expect(harness.runOnLoad(join(FIXTURES, "vendored", "roycss.css"))).toBeNull();
  });
});

describe("stylesheet swap onLoad", () => {
  it("serves the extracted subset in a one-shot build", () => {
    const harness = makeHarness({ css: DIST_CSS, scan: [], include: ["roycss-shake", "roycss-pulse-glow"] });
    const result = harness.runOnLoad(DIST_CSS)!;
    expect(result.contents).toContain(".roycss-shake");
    expect(result.contents).toContain("@keyframes roy-pulse-glow");
    expect(result.contents).not.toContain(".roycss-fade-in-up");
  });

  it("returns watchFiles with the served stylesheet (esbuild auto-watches nothing it did not read)", () => {
    const harness = makeHarness({ css: DIST_CSS, scan: [], include: ["roycss-shake"] });
    const result = harness.runOnLoad(DIST_CSS)!;
    expect(result.watchFiles).toEqual([DIST_CSS]);
  });

  it("serves the FULL stylesheet under watch by default (rebuilds never go stale)", () => {
    const harness = makeHarness({ css: DIST_CSS, scan: [], include: ["roycss-shake"] }, true);
    const result = harness.runOnLoad(DIST_CSS)!;
    expect(result.contents).toBe(FULL_CSS);
    expect(result.watchFiles).toEqual([DIST_CSS]); // full mode still serves it, still watches it
  });

  it("serves the live-extracted subset under watch with dev: 'extract'", () => {
    const harness = makeHarness({ css: DIST_CSS, scan: [], include: ["roycss-shake"], dev: "extract" }, true);
    const result = harness.runOnLoad(DIST_CSS)!;
    expect(result.contents).toContain(".roycss-shake");
    expect(result.contents).not.toContain(".roycss-fade-in-up");
  });

  it("falls back to the full stylesheet (with a warning) when nothing is used", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const harness = makeHarness({ css: DIST_CSS, scan: [] });
    const result = harness.runOnLoad(DIST_CSS)!;
    expect(result.contents).toBe(FULL_CSS);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("FULL stylesheet"));
  });
});

describe("module marking onLoad", () => {
  it("scans the served module and registers its classes for extraction", () => {
    const harness = makeHarness({ css: DIST_CSS, scan: [] });
    const served = harness.runOnLoad(SAMPLE_PAGE)!;
    expect(served.contents).toBe(SAMPLE_CODE); // served verbatim

    // The stylesheet now reflects the module's classes (marking worked).
    const stylesheet = harness.runOnLoad(DIST_CSS)!;
    expect(stylesheet.contents).toContain(".roycss-pulse-glow");
    expect(stylesheet.contents).toContain(".roycss-bounce-in");
    expect(stylesheet.contents).not.toContain(".roycss-fade-in-up");
  });

  it("returns watchFiles for the served module (watch mode keeps rebuilding)", () => {
    // Regression (session 3): esbuild only auto-watches files it reads
    // itself — a plugin-served module without `watchFiles` would never
    // trigger a watch rebuild.
    const harness = makeHarness({ css: DIST_CSS, scan: [] });
    const served = harness.runOnLoad(SAMPLE_PAGE)!;
    expect(served.watchFiles).toEqual([SAMPLE_PAGE]);
  });

  it("declines node_modules paths and unreadable files", () => {
    const harness = makeHarness({ css: DIST_CSS, scan: [] });
    expect(harness.runOnLoad("/project/node_modules/pkg/index.js")).toBeNull();
    expect(harness.runOnLoad("/project/does-not-exist.tsx")).toBeNull();
  });
});

describe("scanning + options", () => {
  it("pre-scans the default roots (<root>/src) at setup time", () => {
    const project = mkdtempSync(join(tmpdir(), "roycss-esbuild-"));
    writeFileSync(
      join(project, "index.html"),
      '<main class="roycss-pulse-glow"><button class="roycss-bounce-in">go</button></main>',
    );
    const onLoads: RegisteredOnLoad[] = [];
    const build = {
      initialOptions: { absWorkingDir: project },
      onLoad: (filter: RegExp, callback: RegisteredOnLoad["callback"]) => {
        onLoads.push({ filter, callback });
      },
      onResolve: () => {},
    };
    roycssEsbuild({ css: DIST_CSS }).setup(build as Parameters<EsbuildPluginLike["setup"]>[0]);

    const stylesheet = onLoads.find(({ filter }) => filter.test(DIST_CSS))!;
    const result = stylesheet!.callback(onLoadArgs(DIST_CSS))!;
    expect(result.contents).toContain(".roycss-pulse-glow");
    expect(result.contents).toContain(".roycss-bounce-in");
    expect(result.contents).not.toContain(".roycss-fade-in-up");
  });

  it("honours the scan option", () => {
    const project = mkdtempSync(join(tmpdir(), "roycss-esbuild-scan-"));
    writeFileSync(join(project, "page.tsx"), 'export const c = ["roycss-shake", "roycss-bounce-in"];');
    const harness = makeHarness({ css: DIST_CSS, scan: [join(project, "page.tsx")] });
    const stylesheet = harness.runOnLoad(DIST_CSS)!;
    expect(stylesheet.contents).toContain(".roycss-shake");
    expect(stylesheet.contents).toContain(".roycss-bounce-in");
    expect(stylesheet.contents).not.toContain(".roycss-fade-in-up");
  });

  it("resolves the css option relative to absWorkingDir", () => {
    // (No classes anywhere in these roots → the full-stylesheet fallback
    // warning fires; mocked to keep the suite output clean.)
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const harness = makeHarness({ css: DIST_CSS, scan: [] });
    expect(harness.runOnLoad(DIST_CSS)).not.toBeNull();
  });

  it("warns once when no classes are found anywhere", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const harness = makeHarness({ css: DIST_CSS, scan: [] });
    harness.runOnLoad(DIST_CSS);
    harness.runOnLoad(DIST_CSS);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("FULL stylesheet"));
  });
});
