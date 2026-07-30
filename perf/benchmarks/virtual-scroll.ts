/**
 * virtual-scroll.ts — VirtualScrollGrid render-cost benchmark.
 *
 * VirtualScrollGrid (src/components/roycss/virtual-scroll-grid.tsx) does
 * NOT do real DOM windowing — it renders `visibleCount` cards linearly,
 * starting at BATCH_SIZE=24 and growing by 24 each time the sentinel
 * intersects. This file measures the cost of the slicing + mapping
 * operations that VirtualScrollGrid performs on every render.
 *
 * We don't render React here (no jsdom); we measure the host-side
 * operations that bound React's render time:
 *
 *   - effects.slice(0, N)             — O(N), dominates for small N
 *   - effects.map((e) => e.id)         — O(N)
 *   - effects.filter((e) => set.has()) — O(N) (DynamicEffectCSS pattern)
 *
 * Combined cost is a tight lower bound on the JS time React must spend
 * before reconciliation. For N=1569 (the "load all cards" case triggered
 * by `roycss-load-all-cards` event), this is the worst case.
 *
 * Budgets:
 *   - 100 items : <0.5 ms (slicing + mapping)
 *   - 1000 items: <5 ms
 *   - 1569 items: <8 ms
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { BenchmarkResult } from "../benchmark";

interface EffectMeta {
  id: string;
  name: string;
  category: string;
  tags: string[];
}

function readEffects(distDir: string): EffectMeta[] {
  const path = join(distDir, "effects.json");
  if (!existsSync(path)) throw new Error(`Missing: ${path}`);
  return JSON.parse(readFileSync(path, "utf-8"));
}

function median(xs: number[]): number {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[mid - 1] + s[mid]) / 2 : s[mid];
}

function timeRender(effects: EffectMeta[], n: number, runs: number): number {
  const samples: number[] = [];
  // Warmup
  for (let i = 0; i < 3; i++) {
    effects.slice(0, n).map((e) => ({ key: e.id, name: e.name, tags: e.tags }));
  }
  for (let r = 0; r < runs; r++) {
    const t0 = process.hrtime.bigint();
    // Mirror VirtualScrollGrid's actual operations:
    const visible = effects.slice(0, n);
    const rendered = visible.map((e) => ({ key: e.id, name: e.name, tags: e.tags }));
    // Mirror DynamicEffectCSS filter+map (the other hot path on render):
    const set = new Set(rendered.map((r) => r.key));
    const css = effects.filter((e) => set.has(e.id)).map((e) => e.id);
    void css; // touch
    const t1 = process.hrtime.bigint();
    samples.push(Number(t1 - t0) / 1e6);
  }
  return median(samples);
}

export function runVirtualScrollBenchmark(projectRoot: string): BenchmarkResult[] {
  const distDir = join(projectRoot, "dist");
  const effects = readEffects(distDir);
  const runs = 25;

  const t100  = timeRender(effects, 100,  runs);
  const t1000 = timeRender(effects, 1000, runs);
  const t1569 = timeRender(effects, 1569, runs);

  return [
    {
      id: "virtual-scroll/100",
      label: "Render 100 cards (slice+map+filter)",
      value: t100,
      unit: "ms",
      target: 0.5,
      comparator: "lt",
      details: "Bounded below by VirtualScrollGrid's render work",
    },
    {
      id: "virtual-scroll/1000",
      label: "Render 1000 cards",
      value: t1000,
      unit: "ms",
      target: 5,
      comparator: "lt",
      details: "~⅔ of the catalog",
    },
    {
      id: "virtual-scroll/1569",
      label: "Render 1569 cards (load-all case)",
      value: t1569,
      unit: "ms",
      target: 8,
      comparator: "lt",
      details: "Triggered by roycss-load-all-cards event before smooth-scroll",
    },
  ];
}
