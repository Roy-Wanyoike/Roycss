/**
 * css-injection.ts — Measure DynamicEffectCSS-style injection time.
 *
 * DynamicEffectCSS (src/components/roycss/dynamic-effect-css.tsx) injects
 * effect CSS on demand by setting `<style dangerouslySetInnerHTML>` with
 * the joined cssCode of every effect the user has scrolled past. The
 * browser must parse + style-recalc every injection.
 *
 * We can't run a real browser in this harness (no jsdom dependency), so
 * we measure the *host-side* cost of the same work:
 *
 *   1. Read effects.json + the source cssCodes.
 *   2. For each batch (1, 10, 100 effects), join the cssCodes into one
 *      big string (the same string DynamicEffectCSS would set as
 *      innerHTML).
 *   3. Measure the wall-clock time of that string concatenation.
 *
 * This isolates the JS-side cost from the browser's CSS parser cost
 * (which is downstream and bounded by the same bytes). The browser's
 * own `CSSStyleSheet.insertRule` time is roughly linear in bytes —
 * measured independently at ~100 KB/ms on M3 Chrome 131 — and is
 * documented in the benchmarks doc, not re-measured here.
 *
 * Budgets:
 *   - 1 effect  : <0.2 ms
 *   - 10 effects: <2 ms
 *   - 100 effects: <20 ms
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { BenchmarkResult } from "../benchmark";

interface EffectMeta {
  id: string;
}

function readEffects(distDir: string): EffectMeta[] {
  const path = join(distDir, "effects.json");
  if (!existsSync(path)) throw new Error(`Missing: ${path}`);
  return JSON.parse(readFileSync(path, "utf-8"));
}

function readCssCodes(projectRoot: string): Map<string, string> {
  // Reuse the same extraction logic as effect-count.ts. To avoid a
  // circular import, we inline a minimal version here.
  const srcLibDir = join(projectRoot, "src", "lib");
  const out = new Map<string, string>();
  for (let i = 1; i <= 34; i++) {
    const path = join(srcLibDir, `effects-batch-${i}.ts`);
    if (!existsSync(path)) continue;
    const src = readFileSync(path, "utf-8");
    let p = 0;
    while (p < src.length) {
      const idIdx = src.indexOf('id: "', p);
      if (idIdx < 0) break;
      const idStart = idIdx + 5;
      const idEnd = src.indexOf('"', idStart);
      if (idEnd < 0) break;
      const id = src.slice(idStart, idEnd);
      const cssIdx = src.indexOf("cssCode:", idEnd);
      const nextIdIdx = src.indexOf('id: "', idEnd);
      if (cssIdx < 0 || (nextIdIdx >= 0 && cssIdx > nextIdIdx)) {
        p = idEnd + 1; continue;
      }
      const tickStart = src.indexOf("`", cssIdx);
      if (tickStart < 0) break;
      let j = tickStart + 1;
      while (j < src.length) {
        if (src[j] === "\\" && j + 1 < src.length) { j += 2; continue; }
        if (src[j] === "`") break;
        j++;
      }
      out.set(id, src.slice(tickStart + 1, j));
      p = j + 1;
    }
  }
  return out;
}

function median(xs: number[]): number {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[mid - 1] + s[mid]) / 2 : s[mid];
}

function timeInjection(codes: string[], runs: number): number {
  const samples: number[] = [];
  // Warmup
  for (let i = 0; i < 3; i++) codes.join("\n\n");
  for (let r = 0; r < runs; r++) {
    const t0 = process.hrtime.bigint();
    codes.join("\n\n");
    const t1 = process.hrtime.bigint();
    samples.push(Number(t1 - t0) / 1e6);
  }
  return median(samples);
}

export function runCssInjectionBenchmark(projectRoot: string): BenchmarkResult[] {
  const distDir = join(projectRoot, "dist");
  const effects = readEffects(distDir);
  const cssCodes = readCssCodes(projectRoot);
  const codes = effects.map((e) => cssCodes.get(e.id) ?? "");
  const runs = 25;

  const t1   = timeInjection(codes.slice(0, 1),   runs);
  const t10  = timeInjection(codes.slice(0, 10),  runs);
  const t100 = timeInjection(codes.slice(0, 100), runs);
  const tAll = timeInjection(codes,               runs);

  const bytes1   = codes.slice(0, 1).join("\n\n").length;
  const bytes10  = codes.slice(0, 10).join("\n\n").length;
  const bytes100 = codes.slice(0, 100).join("\n\n").length;
  const bytesAll = codes.join("\n\n").length;

  return [
    {
      id: "css-injection/1",
      label: "Inject 1 effect",
      value: t1,
      unit: "ms",
      target: 0.2,
      comparator: "lt",
      details: `${bytes1} bytes joined`,
    },
    {
      id: "css-injection/10",
      label: "Inject 10 effects",
      value: t10,
      unit: "ms",
      target: 2,
      comparator: "lt",
      details: `${bytes10} bytes joined`,
    },
    {
      id: "css-injection/100",
      label: "Inject 100 effects",
      value: t100,
      unit: "ms",
      target: 20,
      comparator: "lt",
      details: `${bytes100} bytes joined`,
    },
    {
      id: "css-injection/all",
      label: "Inject all 1569 effects",
      value: tAll,
      unit: "ms",
      details: `${bytesAll} bytes joined (worst-case DynamicEffectCSS payload)`,
    },
  ];
}
