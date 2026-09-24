import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const SRC = join(__dirname, "..", "..", "src/components/roycss/effects/webgl-showcase.tsx");

/**
 * The Firefox-interop round of issue #258 caught a full-page crash: on
 * environments without WebGL (headless Firefox, VMs, hardened privacy
 * setups), mounting a Three.js effect threw "Error creating WebGL context"
 * which bubbled past the Suspense (no local boundary) into the GLOBAL error
 * boundary — the whole home page rendered "Something went wrong" and every
 * navigation/scroll assertion failed.
 *
 * Fix under test (webgl-showcase.tsx):
 *   - a dedicated WebGLErrorBoundary class wraps the lazy Suspense preview
 *     panel, degrading to an honest "needs hardware graphics acceleration"
 *     panel with a Try-again retry;
 *   - the boundary is keyed by the active effect id so switching tabs
 *     remounts it (failed effect can be retried);
 *   - the rest of the section (tabs, description, CTA) stays interactive.
 *
 * Source-level pins (vitest node env, same convention as
 * tests/unit/scroll-section-gecko.test.ts).
 */

function showcaseSrc(): string {
  return readFileSync(SRC, "utf8");
}

describe("WebGLShowcase graceful degradation (#258 firefox round)", () => {
  it("defines a WebGLErrorBoundary class with getDerivedStateFromError", () => {
    const src = showcaseSrc();
    expect(src).toContain("class WebGLErrorBoundary extends Component<");
    expect(src).toContain("static getDerivedStateFromError(error: Error)");
    expect(src).toContain("return { hasError: true, message: error.message };");
  });

  it("logs the failure without crashing the page", () => {
    const src = showcaseSrc();
    expect(src).toContain('console.warn("WebGL showcase effect failed:"');
  });

  it("falls back to an honest, accessible no-WebGL panel with a retry", () => {
    const src = showcaseSrc();
    expect(src).toContain('role="status"');
    expect(src).toContain("hardware graphics acceleration");
    expect(src).toContain("Try again");
    // retry resets the error state
    expect(src).toContain(
      "onClick={() => this.setState({ hasError: false, message: undefined })}",
    );
  });

  it("wraps the lazy Suspense preview panel, keyed per active effect", () => {
    const src = showcaseSrc();
    expect(src).toContain("<WebGLErrorBoundary key={active}>");
    expect(src).toContain("</WebGLErrorBoundary>");
    // the boundary must wrap the Suspense that renders the THREE effects
    const boundaryBlock = src.slice(
      src.indexOf("<WebGLErrorBoundary key={active}>"),
      src.indexOf("</WebGLErrorBoundary>"),
    );
    expect(boundaryBlock).toContain("<Suspense fallback={<EffectFallback />}>");
    expect(boundaryBlock).toContain("<ThreeTubesCursor");
    expect(boundaryBlock).toContain("<ThreeWaveGrid");
  });
});
