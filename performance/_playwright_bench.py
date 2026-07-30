#!/usr/bin/env python3
"""
_playwright_bench.py — Python Playwright helper for RoyCSS runtime + render benchmarks.

Invoked by performance/runtime-bench.ts and performance/effect-render-bench.ts
via Bun.spawn. Reads JSON config from argv, prints JSON results to stdout.

Why Python (not @playwright/test)?
  @playwright/test is not in package.json (constraint: don't modify package.json).
  Python Playwright is already installed at /home/z/.venv with chromium-1228.
  See docs/adr/performance/ADR.md ADR-005 for the full decision.

Usage:
  python3 _playwright_bench.py runtime  --url http://localhost:3000/ --runs 3
  python3 _playwright_bench.py render   --url http://localhost:3000/ --counts 10,50,100,500,1000

Output: single JSON object on stdout (all other logging → stderr).
Exit: 0 on success, 1 on error (error message printed to stderr).
"""

from __future__ import annotations

import argparse
import json
import sys
import time
import traceback
from typing import Any


# ─── Performance observer bootstrap ─────────────────────────────────────────
# This script is evaluated BEFORE any page navigation so we capture every
# performance entry from t=0. Results are stashed on window.__perf.
PERF_BOOTSTRAP = r"""
(() => {
  if (window.__perf) return;  // idempotent
  window.__perf = {
    longTasks: [],
    clsEntries: [],
    lcpEntries: [],
    fcp: null,
    ttfb: null,
    navStart: null,
    domContentLoaded: null,
    load: null,
  };
  const perf = window.__perf;

  // Navigation entry (TTFB, domContentLoaded, load)
  const nav = performance.getEntriesByType('navigation')[0];
  if (nav) {
    perf.ttfb = nav.responseStart - nav.requestStart;
    perf.navStart = nav.startTime;
    perf.domContentLoaded = nav.domContentLoadedEventEnd;
    perf.load = nav.loadEventEnd;
  }

  // Paint entries (FCP)
  try {
    const paintObs = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          perf.fcp = entry.startTime;
        }
      }
    });
    paintObs.observe({ type: 'paint', buffered: true });
  } catch (e) {}

  // LCP
  try {
    const lcpObs = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      if (entries.length > 0) {
        perf.lcpEntries = entries.map(e => ({ startTime: e.startTime, renderTime: e.renderTime, loadTime: e.loadTime, size: e.size, element: e.element ? e.element.tagName : null }));
      }
    });
    lcpObs.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch (e) {}

  // Long tasks (for TBT)
  try {
    const longObs = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        perf.longTasks.push({ startTime: entry.startTime, duration: entry.duration });
      }
    });
    longObs.observe({ type: 'longtask', buffered: true });
  } catch (e) {}

  // Layout shift (for CLS)
  try {
    const clsObs = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          perf.clsEntries.push({ startTime: entry.startTime, value: entry.value });
        }
      }
    });
    clsObs.observe({ type: 'layout-shift', buffered: true });
  } catch (e) {}
})();
"""


# ─── Helpers ────────────────────────────────────────────────────────────────
def _median(values: list[float]) -> float:
    if not values:
        return 0.0
    s = sorted(values)
    n = len(s)
    mid = n // 2
    if n % 2 == 1:
        return float(s[mid])
    return (float(s[mid - 1]) + float(s[mid])) / 2.0


def _max_diff(values: list[float]) -> float:
    if not values:
        return 0.0
    return max(values) - min(values)


def _setup_browser():
    from playwright.sync_api import sync_playwright

    pw = sync_playwright().start()
    browser = pw.chromium.launch(headless=True)
    context = browser.new_context(
        viewport={"width": 1280, "height": 800},
        user_agent="RoyCSS-PerfBench/1.0 (Playwright)",
    )
    # Install the perf bootstrap before any navigation
    context.add_init_script(PERF_BOOTSTRAP)
    return pw, browser, context


def _collect_perf(page) -> dict[str, Any]:
    """Read the captured performance entries from window.__perf and compute
    TTFB/FCP/LCP/CLS/TBT/TTI."""
    raw = page.evaluate(
        r"""() => {
        const perf = window.__perf || {};
        const lcp = perf.lcpEntries && perf.lcpEntries.length > 0
          ? perf.lcpEntries[perf.lcpEntries.length - 1]
          : null;
        const lcpValue = lcp ? (lcp.renderTime || lcp.startTime || 0) : 0;
        const cls = perf.clsEntries.reduce((s, e) => s + e.value, 0);
        const longTasks = perf.longTasks || [];
        // TBT = sum of (duration - 50) for long tasks with startTime > FCP
        const fcp = perf.fcp || 0;
        let tbt = 0;
        let lastLongEnd = 0;
        for (const t of longTasks) {
          if (t.startTime >= fcp) {
            tbt += Math.max(0, t.duration - 50);
            lastLongEnd = Math.max(lastLongEnd, t.startTime + t.duration);
          }
        }
        // TTI approximation: max(FCP, lastLongEnd). If no long tasks, TTI ≈ FCP.
        const tti = Math.max(fcp, lastLongEnd);
        return {
          ttfb: perf.ttfb || 0,
          fcp: perf.fcp || 0,
          lcp: lcpValue,
          lcpSize: lcp ? lcp.size : 0,
          lcpElement: lcp ? lcp.element : null,
          cls: cls,
          tbt: tbt,
          tti: tti,
          longTaskCount: longTasks.length,
          longTasks: longTasks,
          domContentLoaded: perf.domContentLoaded || 0,
          load: perf.load || 0,
          domCount: document.querySelectorAll('*').length,
        };
    }"""
    )
    return raw


def _measure_scroll_fps(page, duration_ms: int = 5000) -> dict[str, Any]:
    """Programmatically scroll for `duration_ms`, counting requestAnimationFrame
    callbacks to estimate FPS. Scrolls down a small amount each frame, wrapping
    back to top if we hit the bottom."""
    result = page.evaluate(
        r"""(durationMs) => {
        return new Promise((resolve) => {
          const start = performance.now();
          const end = start + durationMs;
          let frames = 0;
          const frameTimes = [];
          let lastFrame = start;
          const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
          function step(t) {
            if (t >= end) {
              const dur = t - start;
              const fps = frames > 0 ? (frames / dur) * 1000 : 0;
              // Compute p95 frame time
              const sorted = frameTimes.slice().sort((a, b) => a - b);
              const p95 = sorted.length > 0 ? sorted[Math.floor(sorted.length * 0.95)] : 0;
              const max = sorted.length > 0 ? sorted[sorted.length - 1] : 0;
              resolve({ fps: fps, frames: frames, durationMs: dur, p95FrameMs: p95, maxFrameMs: max });
              return;
            }
            if (lastFrame > 0) frameTimes.push(t - lastFrame);
            lastFrame = t;
            frames++;
            // Scroll
            let y = window.scrollY + 8;
            if (y > maxScroll) y = 0;
            window.scrollTo(0, y);
            requestAnimationFrame(step);
          }
          requestAnimationFrame(step);
        });
    }""",
        duration_ms,
    )
    return result


def _measure_memory(page) -> dict[str, Any]:
    """Use Chrome DevTools Protocol to read V8 + Blink perf metrics."""
    try:
        # Playwright Python: page.context is a property, not a method.
        client = page.context.new_cdp_session(page)
        client.send("Performance.enable")
        metrics_resp = client.send("Performance.getMetrics")
        metrics = {m["name"]: m["value"] for m in metrics_resp.get("metrics", [])}
        client.detach()
        return {
            "jsHeapUsedSize": metrics.get("JSHeapUsedSize", 0),
            "jsHeapTotalSize": metrics.get("JSHeapTotalSize", 0),
            "jsHeapLimit": metrics.get("JSHeapLimit", 0),
            "nodes": metrics.get("Nodes", 0),
            "layoutCount": metrics.get("LayoutCount", 0),
            "recalcStyleCount": metrics.get("RecalcStyleCount", 0),
            "scriptDuration": metrics.get("ScriptDuration", 0),
            "taskDuration": metrics.get("TaskDuration", 0),
            "jsEventListeners": metrics.get("JSEventListeners", 0),
        }
    except Exception as e:
        return {"error": f"CDP memory capture failed: {e}"}


# ─── Runtime benchmark ──────────────────────────────────────────────────────
def run_runtime_benchmark(url: str, runs: int) -> dict[str, Any]:
    pw, browser, context = _setup_browser()
    per_run: list[dict[str, Any]] = []
    errors: list[str] = []
    try:
        for i in range(runs):
            page = context.new_page()
            try:
                t0 = time.time()
                page.goto(url, wait_until="domcontentloaded", timeout=60000)
                # Give Next.js a moment to hydrate + LCP to settle
                page.wait_for_timeout(3000)
                # Try to wait for networkidle, but don't fail the run if it times out
                try:
                    page.wait_for_load_state("networkidle", timeout=5000)
                except Exception:
                    pass
                wall_clock_ms = (time.time() - t0) * 1000

                perf = _collect_perf(page)
                scroll = _measure_scroll_fps(page, 5000)
                memory = _measure_memory(page)

                per_run.append({
                    "run": i + 1,
                    "wallClockMs": wall_clock_ms,
                    "perf": perf,
                    "scroll": scroll,
                    "memory": memory,
                })
            except Exception as e:
                errors.append(f"run {i+1}: {e}")
            finally:
                page.close()
    finally:
        browser.close()
        pw.stop()

    # Aggregate
    def gather(key_path: str) -> list[float]:
        vals: list[float] = []
        for r in per_run:
            v: Any = r
            for k in key_path.split("."):
                if isinstance(v, dict):
                    v = v.get(k)
                else:
                    v = None
                    break
            if isinstance(v, (int, float)):
                vals.append(float(v))
        return vals

    def agg(key_path: str) -> dict[str, Any]:
        vals = gather(key_path)
        return {
            "median": _median(vals),
            "min": min(vals) if vals else 0,
            "max": max(vals) if vals else 0,
            "values": vals,
            "variancePct": (round(_max_diff(vals) / _median(vals) * 100, 1) if _median(vals) > 0 else 0),
        }

    return {
        "ok": len(errors) == 0,
        "url": url,
        "runs": runs,
        "errors": errors,
        "metrics": {
            "ttfb": agg("perf.ttfb"),
            "fcp": agg("perf.fcp"),
            "lcp": agg("perf.lcp"),
            "tti": agg("perf.tti"),
            "tbt": agg("perf.tbt"),
            "cls": agg("perf.cls"),
            "domCount": agg("perf.domCount"),
            "scrollFps": agg("scroll.fps"),
            "scrollP95FrameMs": agg("scroll.p95FrameMs"),
            "scrollMaxFrameMs": agg("scroll.maxFrameMs"),
            "jsHeapUsedSize": agg("memory.jsHeapUsedSize"),
            "domNodesCdp": agg("memory.nodes"),
            "layoutCount": agg("memory.layoutCount"),
            "recalcStyleCount": agg("memory.recalcStyleCount"),
            "scriptDuration": agg("memory.scriptDuration"),
            "taskDuration": agg("memory.taskDuration"),
            "longTaskCount": agg("perf.longTaskCount"),
        },
        "perRun": per_run,
    }


# ─── Effect render benchmark ────────────────────────────────────────────────
EFFECT_CARD_HTML = r"""
<div class="perf-bench-card" data-effect-id="{id}">
  <div class="perf-bench-card-preview">
    <div class="roycss-perf-bench-{id}" style="width:48px;height:48px;border-radius:8px;background:oklch(0.7 0.15 250);"></div>
  </div>
  <div class="perf-bench-card-body">
    <div class="perf-bench-card-title">Effect {id}</div>
    <div class="perf-bench-card-meta">animations · preview</div>
    <div class="perf-bench-card-tags"><span>tag</span><span>tag</span></div>
  </div>
  <div class="perf-bench-card-footer">
    <button aria-label="copy">copy</button>
    <button aria-label="favorite">favorite</button>
  </div>
</div>
""".strip()


def run_render_benchmark(url: str, counts: list[int]) -> dict[str, Any]:
    pw, browser, context = _setup_browser()
    results: list[dict[str, Any]] = []
    initial: dict[str, Any] = {}
    errors: list[str] = []
    try:
        page = context.new_page()
        try:
            page.goto(url, wait_until="domcontentloaded", timeout=60000)
            page.wait_for_timeout(3000)
            try:
                page.wait_for_load_state("networkidle", timeout=5000)
            except Exception:
                pass

            # 1. Verify virtual-scroll threshold: count .perf-auto cards (the
            #    className on every real EffectCard root).
            initial = page.evaluate(
                r"""() => {
                const cards = document.querySelectorAll('.perf-auto');
                const total = document.querySelectorAll('*').length;
                // Also look for [class*=roycss-] (effect preview elements)
                const previewEls = document.querySelectorAll('[class*="roycss-"]');
                return {
                    initialCardCount: cards.length,
                    domCount: total,
                    previewElCount: previewEls.length,
                    scrollHeight: document.documentElement.scrollHeight,
                };
            }"""
            )

            # 2. For each N, inject N synthetic cards and measure render time + DOM + memory
            for n in counts:
                # Clean up previous injection
                page.evaluate(
                    r"""() => {
                    const old = document.getElementById('perf-bench-container');
                    if (old) old.remove();
                }"""
                )

                # Pre-build HTML in Python (we don't want to time string concatenation in JS)
                html = "\n".join(EFFECT_CARD_HTML.replace("{id}", str(i)) for i in range(n))

                measurement = page.evaluate(
                    r"""(html) => {
                    return new Promise((resolve) => {
                        // Force GC if possible (Chrome only)
                        if (window.gc) window.gc();
                        const memBefore = performance.memory ? performance.memory.usedJSHeapSize : 0;
                        const container = document.createElement('div');
                        container.id = 'perf-bench-container';
                        container.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:16px;padding:24px;';
                        const t0 = performance.now();
                        container.innerHTML = html;
                        document.body.appendChild(container);
                        // Force layout
                        void container.offsetHeight;
                        const t1 = performance.now();
                        const memAfter = performance.memory ? performance.memory.usedJSHeapSize : 0;
                        resolve({
                            renderMs: t1 - t0,
                            domCount: document.querySelectorAll('*').length,
                            memDeltaBytes: memAfter - memBefore,
                            containerChildCount: container.children.length,
                        });
                    });
                }""",
                    html,
                )

                # Memory via CDP
                memory = _measure_memory(page)

                results.append({
                    "n": n,
                    "renderMs": measurement["renderMs"],
                    "domCount": measurement["domCount"],
                    "memDeltaBytes": measurement["memDeltaBytes"],
                    "containerChildCount": measurement["containerChildCount"],
                    "cdpNodes": memory.get("nodes", 0),
                    "cdpJsHeapUsed": memory.get("jsHeapUsedSize", 0),
                    "cdpLayoutCount": memory.get("layoutCount", 0),
                    "cdpRecalcStyleCount": memory.get("recalcStyleCount", 0),
                })
        except Exception as e:
            errors.append(f"render benchmark: {e}\n{traceback.format_exc()}")
        finally:
            page.close()
    finally:
        browser.close()
        pw.stop()

    return {
        "ok": len(errors) == 0,
        "url": url,
        "counts": counts,
        "initial": initial,
        "results": results,
        "errors": errors,
    }


# ─── CLI ────────────────────────────────────────────────────────────────────
def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("mode", choices=["runtime", "render"])
    parser.add_argument("--url", default="http://localhost:3000/")
    parser.add_argument("--runs", type=int, default=3)
    parser.add_argument("--counts", default="10,50,100,500,1000")
    args = parser.parse_args()

    try:
        if args.mode == "runtime":
            result = run_runtime_benchmark(args.url, args.runs)
        else:
            counts = [int(x) for x in args.counts.split(",")]
            result = run_render_benchmark(args.url, counts)
        print(json.dumps(result))
        return 0 if result.get("ok", False) else 1
    except Exception as e:
        print(json.dumps({"ok": False, "error": str(e), "trace": traceback.format_exc()}))
        return 1


if __name__ == "__main__":
    sys.exit(main())
