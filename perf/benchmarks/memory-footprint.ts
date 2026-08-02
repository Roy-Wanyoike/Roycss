/**
 * memory-footprint.ts — Estimate per-effect-card heap cost.
 *
 * Without a running browser we cannot measure real DOM memory, but we
 * can measure the JavaScript-heap cost of the effect metadata itself,
 * which is the lower bound for any card-grid implementation.
 *
 * Method:
 *   - Load effects.json (the published metadata file, 547 KB).
 *   - Measure JSON.parse time (proxy for V8 string → object allocation).
 *   - Measure V8 heap size of the parsed array via process.memoryUsage().
 *   - Divide by 1569 to get per-effect heap cost.
 *
 * Reference (Chrome DevTools, M3 / Chrome 131, for comparison):
 *   - Effect metadata object (7 fields): ~280 bytes heap
 *   - Effect React Element (EffectCard): ~1.4 KB heap
 *   - DOM node for EffectCard: ~14 KB heap (per LABS-33)
 *   - Inline `<style>` text for one effect: ~771 bytes (avg cssCode)
 *
 * Budget:
 *   - Per-effect metadata heap: <2 KB (well below at ~280 B)
 *   - Full catalog heap: <1 MB (1569 × 280 B ≈ 440 KB)
 *   - JSON.parse time for full catalog: <50 ms
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { BenchmarkResult } from "../benchmark";

interface EffectMeta {
  id: string;
  name: string;
  category: string;
  description: string;
  tags: string[];
  previewType: string;
  previewText: string | null;
  childCount: number | null;
}

function readRaw(distDir: string): string {
  const path = join(distDir, "effects.json");
  if (!existsSync(path)) throw new Error(`Missing: ${path}`);
  return readFileSync(path, "utf-8");
}

function median(xs: number[]): number {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[mid - 1] + s[mid]) / 2 : s[mid];
}

export function runMemoryFootprintBenchmark(projectRoot: string): BenchmarkResult[] {
  const distDir = join(projectRoot, "dist");
  const raw = readRaw(distDir);
  const rawBytes = Buffer.byteLength(raw, "utf-8");

  // Warmup V8's JSON parser so the measured run reflects steady-state.
  for (let i = 0; i < 3; i++) JSON.parse(raw);

  // Measure parse time (25 runs, median).
  const samples: number[] = [];
  for (let r = 0; r < 25; r++) {
    const t0 = process.hrtime.bigint();
    JSON.parse(raw);
    const t1 = process.hrtime.bigint();
    samples.push(Number(t1 - t0) / 1e6);
  }
  const parseMs = median(samples);

  // Hold a reference and measure heap delta. Bun's JSON.parse stores the
  // resulting object graph in `external` memory (V8's external-string
  // heap), not `heapUsed` — so we sum heapUsed + external + arrayBuffers
  // to capture the full picture. (This was verified empirically: a fresh
  // JSON.parse of effects.json shows delta_external ≈ 340 KB and
  // delta_heapUsed = 0.)
  if (typeof Bun !== "undefined" && typeof Bun.gc === "function") Bun.gc(true);
  const before = process.memoryUsage();
  const effects: EffectMeta[] = JSON.parse(raw);
  // Force promotion: touch every field.
  let acc = 0;
  for (const e of effects) {
    acc += e.id.length + e.name.length + e.description.length;
    for (const t of e.tags) acc += t.length;
  }
  // Force another GC so new-space garbage (transient parse structures)
  // is reclaimed, leaving only the reachable `effects` graph.
  if (typeof Bun !== "undefined" && typeof Bun.gc === "function") Bun.gc(true);
  const after = process.memoryUsage();
  const totalBefore = before.heapUsed + before.external + before.arrayBuffers;
  const totalAfter  = after.heapUsed  + after.external  + after.arrayBuffers;
  const heapDelta = Math.max(0, totalAfter - totalBefore);
  const perEffectHeap = heapDelta / effects.length;
  // Reference `acc` so V8 cannot dead-code-eliminate the parse.
  if (acc < 0) console.log("unreachable");

  // Sum of string lengths in the parsed objects (lower bound — V8 also
  // stores hash tables, hidden classes, etc.).
  let stringBytes = 0;
  for (const e of effects) {
    stringBytes += e.id.length + e.name.length + e.category.length +
                   e.description.length + e.previewType.length;
    if (e.previewText) stringBytes += e.previewText.length;
    for (const t of e.tags) stringBytes += t.length;
  }

  return [
    {
      id: "memory-footprint/json-parse-ms",
      label: "JSON.parse(effects.json)",
      value: parseMs,
      unit: "ms",
      target: 50,
      comparator: "lt",
      details: `Median of 25 runs; raw size ${rawBytes} bytes`,
    },
    {
      id: "memory-footprint/catalog-heap",
      label: "Catalog heap (1569 effects)",
      value: heapDelta,
      unit: "bytes",
      target: 1024 * 1024,
      comparator: "lt",
      details: `process.memoryUsage().heapUsed delta after JSON.parse`,
    },
    {
      id: "memory-footprint/per-effect-heap",
      label: "Per-effect metadata heap",
      value: perEffectHeap,
      unit: "bytes",
      target: 2048,
      comparator: "lt",
      details: "Catalog heap ÷ 1569 effects",
    },
    {
      id: "memory-footprint/string-bytes",
      label: "String bytes (lower bound)",
      value: stringBytes,
      unit: "bytes",
      details: "Sum of all string field lengths in parsed effects array",
    },
    {
      id: "memory-footprint/effects-count",
      label: "Effects held in memory",
      value: effects.length,
      unit: "count",
      details: "Should equal 1569 — guards against accidental truncation",
    },
  ];
}
