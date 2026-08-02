#!/usr/bin/env bun
/**
 * RoyCSS Effect Curation Script
 *
 * Loads all 1,569 effects from src/lib/roycss-effects.ts, runs the curation
 * pipeline (tag normalization, quality scoring, duplicate detection,
 * miscategorization detection), and writes four outputs:
 *
 *   scripts/curate-results/curation-report.json   — full machine-readable report
 *   scripts/curate-results/CURATION-REPORT.md     — human-readable report
 *   scripts/curate-results/duplicates.json        — duplicate clusters
 *   scripts/curate-results/quality-scores.json    — per-effect scores
 *
 * See docs/adr/effect-curation/ for design and the rubric.
 *
 * Usage:
 *   bun run scripts/curate-effects.ts
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { effects } from "../src/lib/roycss-effects";
import type { CSSEffect, EffectCategory } from "../src/lib/roycss-types";
import { recipes } from "../src/lib/roycss-recipes";
import { patterns } from "../src/lib/roycss-patterns";
import {
  CATEGORY_DEFINITIONS,
  type DimensionScore,
  type DuplicateCluster,
  findDuplicates,
  findMiscategorized,
  type MiscategorizationFinding,
  normalizeTags,
  scoreEffect,
  TAG_SYNONYMS,
  TAG_VOCABULARY,
  tierForScore,
} from "../src/lib/effect-taxonomy";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const OUT_DIR = join(__dirname, "curate-results");

// ═══════════════════════════════════════════════════════════════════
// Types for the curation report
// ═══════════════════════════════════════════════════════════════════

interface EffectScoreRow {
  id: string;
  name: string;
  category: EffectCategory;
  overall: number;
  tier: "A" | "B" | "C" | "D";
  dimensions: DimensionScore[];
  flags: string[];
}

interface TagChangeRow {
  effectId: string;
  from: string;
  to: string | null;
}

interface CurationReport {
  schema: string;
  generatedAt: string;
  totalEffects: number;
  uniqueIds: number;
  duplicateIds: string[];
  tagNormalization: {
    totalChanges: number;
    effectsAffected: number;
    topMappings: { from: string; to: string | null; count: number }[];
    uncontrolledTags: { tag: string; count: number }[];
  };
  quality: {
    avgOverall: number;
    avgPerDimension: Record<string, number>;
    tierDistribution: Record<string, number>;
    histogram: { bucket: string; count: number }[];
    lowQualityCount: number;
  };
  categoryStats: {
    category: string;
    label: string;
    count: number;
    avgQuality: number;
    minQuality: number;
    maxQuality: number;
    lowQualityCount: number;
  }[];
  duplicateClusters: {
    totalClusters: number;
    totalEffectsInClusters: number;
    clusters: DuplicateCluster[];
  };
  miscategorized: MiscategorizationFinding[];
  lowQuality: EffectScoreRow[];
  topQuality: EffectScoreRow[];
  bottomQuality: EffectScoreRow[];
  recommendations: {
    deprecate: { id: string; reason: string }[];
    merge: { cluster: DuplicateCluster }[];
    improve: { id: string; issue: string }[];
    blockedRemovals: { id: string; referencedBy: string[] }[];
  };
}

// ═══════════════════════════════════════════════════════════════════
// Step 1: Sanity-check IDs
// ═══════════════════════════════════════════════════════════════════

function sanityCheckIds(effects: CSSEffect[]): {
  unique: number;
  duplicateIds: string[];
} {
  const seen = new Map<string, number>();
  for (const e of effects) {
    seen.set(e.id, (seen.get(e.id) ?? 0) + 1);
  }
  const duplicateIds = [...seen.entries()]
    .filter(([, c]) => c > 1)
    .map(([id]) => id);
  return { unique: seen.size, duplicateIds };
}

// ═══════════════════════════════════════════════════════════════════
// Step 2: Tag normalization
// ═══════════════════════════════════════════════════════════════════

function normalizeAllTags(effects: CSSEffect[]): {
  changes: TagChangeRow[];
  effectsAffected: Set<string>;
  topMappings: Map<string, { from: string; to: string | null; count: number }>;
  uncontrolledTags: Map<string, number>;
} {
  const allChanges: TagChangeRow[] = [];
  const effectsAffected = new Set<string>();
  const topMappings = new Map<
    string,
    { from: string; to: string | null; count: number }
  >();
  const uncontrolledTags = new Map<string, number>();

  for (const e of effects) {
    const result = normalizeTags(e.tags, e.id);
    if (result.changes.length > 0) effectsAffected.add(e.id);
    for (const c of result.changes) {
      allChanges.push({ effectId: e.id, from: c.from, to: c.to });
      const key = `${c.from}→${c.to}`;
      const existing = topMappings.get(key) ?? {
        from: c.from,
        to: c.to,
        count: 0,
      };
      existing.count++;
      topMappings.set(key, existing);
    }
    // Count uncontrolled (non-canonical) tags in the normalized output.
    const canonical = new Set(Object.values(TAG_VOCABULARY).flat());
    for (const t of result.normalized) {
      if (!canonical.has(t)) {
        uncontrolledTags.set(t, (uncontrolledTags.get(t) ?? 0) + 1);
      }
    }
  }

  return {
    changes: allChanges,
    effectsAffected,
    topMappings,
    uncontrolledTags,
  };
}

// ═══════════════════════════════════════════════════════════════════
// Step 3: Quality scoring
// ═══════════════════════════════════════════════════════════════════

function scoreAllEffects(
  effects: CSSEffect[],
  duplicateClusters: DuplicateCluster[],
): EffectScoreRow[] {
  // Build a map from effectId → uniqueness score from the duplicate clusters.
  const uniquenessByEffect = new Map<string, { score: number; reason: string }>();
  for (const cluster of duplicateClusters) {
    const maxSim = Math.max(...cluster.members.map((m) => m.similarity));
    let uniq = 10;
    let reason = "no near-duplicates found";
    if (cluster.recommendation === "merge" || maxSim >= 0.95) {
      uniq = 2;
      reason = `near-exact duplicate (similarity ${maxSim.toFixed(2)})`;
    } else if (maxSim >= 0.9) {
      uniq = 4;
      reason = `multiple near-duplicates (similarity ${maxSim.toFixed(2)})`;
    } else if (maxSim >= 0.85) {
      uniq = 6;
      reason = `close duplicate candidate (similarity ${maxSim.toFixed(2)})`;
    } else if (maxSim >= 0.7) {
      uniq = 8;
      reason = `distant sibling (similarity ${maxSim.toFixed(2)})`;
    }
    // Canonical members get a small bonus (they're the "preferred" version).
    for (const m of cluster.members) {
      const bonus = m.id === cluster.canonical ? 1 : 0;
      uniquenessByEffect.set(m.id, {
        score: Math.max(0, Math.min(10, uniq + bonus)),
        reason: reason + (m.id === cluster.canonical ? " [canonical]" : ""),
      });
    }
  }

  const rows: EffectScoreRow[] = effects.map((e) => {
    const dimensions = scoreEffect(e);
    // Override uniqueness dimension with the global value.
    const uniq = uniquenessByEffect.get(e.id);
    if (uniq) {
      const idx = dimensions.findIndex((d) => d.dimension === "uniqueness");
      if (idx >= 0) {
        dimensions[idx] = {
          dimension: "uniqueness",
          score: uniq.score,
          reasoning: uniq.reason,
        };
      }
    }
    const overall =
      Math.round(
        (dimensions.reduce((s, d) => s + d.score, 0) / dimensions.length) *
          10,
      ) / 10;
    const tier = tierForScore(overall);
    const flags: string[] = [];
    for (const d of dimensions) {
      if (d.score < 5) flags.push(`${d.dimension}:${d.score}`);
    }
    return {
      id: e.id,
      name: e.name,
      category: e.category,
      overall,
      tier,
      dimensions,
      flags,
    };
  });

  return rows;
}

// ═══════════════════════════════════════════════════════════════════
// Step 4: Compose report
// ═══════════════════════════════════════════════════════════════════

function composeReport(
  effects: CSSEffect[],
  scores: EffectScoreRow[],
  tagNorm: ReturnType<typeof normalizeAllTags>,
  clusters: DuplicateCluster[],
  miscategorized: MiscategorizationFinding[],
  protectedIds: Set<string>,
): CurationReport {
  const total = effects.length;

  // Quality aggregates
  const avgOverall =
    Math.round(
      (scores.reduce((s, r) => s + r.overall, 0) / scores.length) * 100,
    ) / 100;
  const dimSums: Record<string, number> = {};
  for (const row of scores) {
    for (const d of row.dimensions) {
      dimSums[d.dimension] = (dimSums[d.dimension] ?? 0) + d.score;
    }
  }
  const avgPerDimension: Record<string, number> = {};
  for (const [k, v] of Object.entries(dimSums)) {
    avgPerDimension[k] = Math.round((v / scores.length) * 100) / 100;
  }

  // Tier distribution
  const tierDistribution: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const row of scores) tierDistribution[row.tier]++;

  // Histogram (0-1, 2-3, 4-5, 6-7, 8-9, 10)
  const buckets = [
    { bucket: "0-1", count: 0 },
    { bucket: "2-3", count: 0 },
    { bucket: "4-5", count: 0 },
    { bucket: "6-7", count: 0 },
    { bucket: "8-9", count: 0 },
    { bucket: "10", count: 0 },
  ];
  for (const row of scores) {
    const o = row.overall;
    if (o < 2) buckets[0].count++;
    else if (o < 4) buckets[1].count++;
    else if (o < 6) buckets[2].count++;
    else if (o < 8) buckets[3].count++;
    else if (o < 10) buckets[4].count++;
    else buckets[5].count++;
  }

  const lowQuality = scores.filter((r) => r.overall < 5);
  const sorted = [...scores].sort((a, b) => b.overall - a.overall);
  const topQuality = sorted.slice(0, 10);
  const bottomQuality = sorted.slice(-10).reverse();

  // Category stats
  const categoryStats: CurationReport["categoryStats"] = [];
  for (const cat of Object.keys(CATEGORY_DEFINITIONS) as EffectCategory[]) {
    const rows = scores.filter((r) => r.category === cat);
    if (rows.length === 0) {
      categoryStats.push({
        category: cat,
        label: CATEGORY_DEFINITIONS[cat].label,
        count: 0,
        avgQuality: 0,
        minQuality: 0,
        maxQuality: 0,
        lowQualityCount: 0,
      });
      continue;
    }
    const overalls = rows.map((r) => r.overall);
    categoryStats.push({
      category: cat,
      label: CATEGORY_DEFINITIONS[cat].label,
      count: rows.length,
      avgQuality:
        Math.round(
          (overalls.reduce((s, v) => s + v, 0) / overalls.length) * 100,
        ) / 100,
      minQuality: Math.min(...overalls),
      maxQuality: Math.max(...overalls),
      lowQualityCount: rows.filter((r) => r.overall < 5).length,
    });
  }
  categoryStats.sort((a, b) => b.count - a.count);

  // Top tag mappings
  const topMappings = [...tagNorm.topMappings.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  // Uncontrolled tags (sorted by count, then alphabetical)
  const uncontrolledTags = [...tagNorm.uncontrolledTags.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));

  // Recommendations
  const deprecate: { id: string; reason: string }[] = [];
  for (const row of scores) {
    if (row.overall < 4) {
      deprecate.push({
        id: row.id,
        reason: `overall ${row.overall} < 4.0`,
      });
    } else {
      const uniq = row.dimensions.find((d) => d.dimension === "uniqueness");
      if (uniq && uniq.score < 3) {
        deprecate.push({
          id: row.id,
          reason: `uniqueness ${uniq.score} < 3.0 (near-duplicate)`,
        });
      } else {
        const corr = row.dimensions.find((d) => d.dimension === "correctness");
        if (corr && corr.score < 3) {
          deprecate.push({
            id: row.id,
            reason: `correctness ${corr.score} < 3.0 (stub or broken)`,
          });
        }
      }
    }
  }

  const merge: { cluster: DuplicateCluster }[] = clusters
    .filter((c) => c.recommendation === "merge")
    .map((cluster) => ({ cluster }));

  const improve: { id: string; issue: string }[] = [];
  for (const row of scores) {
    if (row.overall >= 4 && row.overall < 6) {
      const lowDims = row.dimensions
        .filter((d) => d.score < 6)
        .map((d) => `${d.dimension}=${d.score}`)
        .join(", ");
      improve.push({ id: row.id, issue: lowDims });
    }
  }

  // Blocked removals (deprecation candidates that are referenced by recipes/patterns)
  const blockedRemovals: { id: string; referencedBy: string[] }[] = [];
  for (const d of deprecate) {
    if (protectedIds.has(d.id)) {
      const referencedBy: string[] = [];
      for (const r of recipes) {
        if (r.effectIds.includes(d.id)) referencedBy.push(`recipe:${r.id}`);
      }
      for (const p of patterns) {
        if (p.effectIds.includes(d.id)) referencedBy.push(`pattern:${p.id}`);
      }
      if (referencedBy.length > 0) {
        blockedRemovals.push({ id: d.id, referencedBy });
      }
    }
  }

  return {
    schema: "roycss.curation.v1",
    generatedAt: new Date().toISOString(),
    totalEffects: total,
    uniqueIds: total, // updated by caller
    duplicateIds: [], // updated by caller
    tagNormalization: {
      totalChanges: tagNorm.changes.length,
      effectsAffected: tagNorm.effectsAffected.size,
      topMappings,
      uncontrolledTags,
    },
    quality: {
      avgOverall,
      avgPerDimension,
      tierDistribution,
      histogram: buckets,
      lowQualityCount: lowQuality.length,
    },
    categoryStats,
    duplicateClusters: {
      totalClusters: clusters.length,
      totalEffectsInClusters: clusters.reduce(
        (s, c) => s + c.members.length,
        0,
      ),
      clusters,
    },
    miscategorized,
    lowQuality,
    topQuality,
    bottomQuality,
    recommendations: {
      deprecate,
      merge,
      improve,
      blockedRemovals,
    },
  };
}

// ═══════════════════════════════════════════════════════════════════
// Step 5: Render markdown report
// ═══════════════════════════════════════════════════════════════════

function renderMarkdown(report: CurationReport): string {
  const lines: string[] = [];
  const pad = (n: number, s: string) => s.padEnd(n);

  lines.push("# RoyCSS Effect Curation Report");
  lines.push("");
  lines.push(
    `> Generated: ${report.generatedAt} · Schema: \`${report.schema}\``,
  );
  lines.push("");
  lines.push("## 1. Executive Summary");
  lines.push("");
  lines.push(`- **Total effects audited:** ${report.totalEffects}`);
  lines.push(`- **Unique effect IDs:** ${report.uniqueIds}`);
  lines.push(
    `- **Average quality score:** ${report.quality.avgOverall} / 10 (tier distribution: A=${report.quality.tierDistribution.A}, B=${report.quality.tierDistribution.B}, C=${report.quality.tierDistribution.C}, D=${report.quality.tierDistribution.D})`,
  );
  lines.push(
    `- **Low-quality effects (overall < 5):** ${report.quality.lowQualityCount}`,
  );
  lines.push(
    `- **Duplicate clusters found:** ${report.duplicateClusters.totalClusters} (involving ${report.duplicateClusters.totalEffectsInClusters} effects)`,
  );
  lines.push(
    `- **Tag normalizations applied:** ${report.tagNormalization.totalChanges} (across ${report.tagNormalization.effectsAffected} effects)`,
  );
  lines.push(
    `- **Miscategorized effects detected:** ${report.miscategorized.length}`,
  );
  lines.push(
    `- **Deprecation candidates:** ${report.recommendations.deprecate.length}`,
  );
  lines.push(
    `- **Merge candidates:** ${report.recommendations.merge.length}`,
  );
  lines.push(
    `- **Improve candidates:** ${report.recommendations.improve.length}`,
  );
  lines.push(
    `- **Blocked removals (referenced by recipes/patterns):** ${report.recommendations.blockedRemovals.length}`,
  );
  lines.push("");

  // Per-dimension averages
  lines.push("**Per-dimension averages:**");
  lines.push("");
  lines.push("| Dimension | Avg score |");
  lines.push("|---|---|");
  for (const [dim, avg] of Object.entries(report.quality.avgPerDimension)) {
    lines.push(`| ${dim} | ${avg} |`);
  }
  lines.push("");

  // Histogram
  lines.push("**Overall quality histogram:**");
  lines.push("");
  const maxBucket = Math.max(...report.quality.histogram.map((h) => h.count));
  for (const h of report.quality.histogram) {
    const barLen =
      maxBucket > 0 ? Math.round((h.count / maxBucket) * 30) : 0;
    const bar = "█".repeat(barLen) + "░".repeat(30 - barLen);
    lines.push(
      `  ${pad(5, h.bucket)} |${bar}| ${h.count}`,
    );
  }
  lines.push("");

  // Section 2: Category distribution
  lines.push("## 2. Category Distribution");
  lines.push("");
  lines.push(
    "| Category | Count | Avg quality | Min | Max | Low-quality (# < 5) |",
  );
  lines.push("|---|---|---|---|---|---|");
  for (const c of report.categoryStats) {
    lines.push(
      `| ${c.label} (\`${c.category}\`) | ${c.count} | ${c.avgQuality} | ${c.minQuality} | ${c.maxQuality} | ${c.lowQualityCount} |`,
    );
  }
  lines.push("");

  // Section 3: Top 10 highest-quality
  lines.push("## 3. Top 10 Highest-Quality Effects");
  lines.push("");
  lines.push("| # | ID | Name | Category | Overall | Tier |");
  lines.push("|---|---|---|---|---|---|");
  report.topQuality.forEach((r, i) => {
    lines.push(
      `| ${i + 1} | \`${r.id}\` | ${r.name} | ${r.category} | ${r.overall} | ${r.tier} |`,
    );
  });
  lines.push("");

  // Section 4: Bottom 10 lowest-quality
  lines.push("## 4. Bottom 10 Lowest-Quality Effects");
  lines.push("");
  lines.push("| # | ID | Name | Category | Overall | Tier | Specific issues |");
  lines.push("|---|---|---|---|---|---|---|");
  report.bottomQuality.forEach((r, i) => {
    const issues = r.dimensions
      .filter((d) => d.score < 7)
      .map((d) => `${d.dimension}=${d.score}`)
      .join(", ");
    lines.push(
      `| ${i + 1} | \`${r.id}\` | ${r.name} | ${r.category} | ${r.overall} | ${r.tier} | ${issues || "none specific"} |`,
    );
  });
  lines.push("");

  // Section 5: Duplicate clusters
  lines.push("## 5. Duplicate Clusters");
  lines.push("");
  lines.push(
    `Found **${report.duplicateClusters.totalClusters}** clusters involving **${report.duplicateClusters.totalEffectsInClusters}** effects.`,
  );
  lines.push("");
  const clustersToShow = report.duplicateClusters.clusters.slice(0, 30);
  clustersToShow.forEach((c, i) => {
    lines.push(`### Cluster ${i + 1}: canonical \`${c.canonical}\` — _${c.recommendation}_`);
    lines.push("");
    lines.push("| Effect ID | Name | Similarity | Reason |");
    lines.push("|---|---|---|---|");
    for (const m of c.members) {
      const canon = m.id === c.canonical ? " **(canonical)**" : "";
      lines.push(
        `| \`${m.id}\`${canon} | ${m.name} | ${m.similarity.toFixed(3)} | ${m.reason} |`,
      );
    }
    lines.push("");
  });
  if (report.duplicateClusters.clusters.length > 30) {
    lines.push(
      `... and ${report.duplicateClusters.clusters.length - 30} more clusters (see \`duplicates.json\` for the full list).`,
    );
    lines.push("");
  }

  // Section 6: Tag normalization summary
  lines.push("## 6. Tag Normalization Summary");
  lines.push("");
  lines.push(
    `Applied **${report.tagNormalization.totalChanges}** normalizations across **${report.tagNormalization.effectsAffected}** effects.`,
  );
  lines.push("");
  lines.push("**Top 20 most common normalizations:**");
  lines.push("");
  lines.push("| From | To | Count |");
  lines.push("|---|---|---|");
  for (const m of report.tagNormalization.topMappings) {
    const toStr = m.to === null ? "_stripped (id-mirror)_" : `\`${m.to}\``;
    lines.push(`| \`${m.from}\` | ${toStr} | ${m.count} |`);
  }
  lines.push("");

  lines.push(
    `**Uncontrolled tags (not in TAG_VOCABULARY):** ${report.tagNormalization.uncontrolledTags.length} unique tags found in the normalized output.`,
  );
  lines.push("");
  lines.push("Top 20 uncontrolled tags (candidates for promotion to TAG_VOCABULARY):");
  lines.push("");
  lines.push("| Tag | Count |");
  lines.push("|---|---|");
  for (const u of report.tagNormalization.uncontrolledTags.slice(0, 20)) {
    lines.push(`| \`${u.tag}\` | ${u.count} |`);
  }
  lines.push("");

  // Section 7: Miscategorization findings
  lines.push("## 7. Miscategorization Findings");
  lines.push("");
  lines.push(
    `Found **${report.miscategorized.length}** effects whose name/tags suggest a different category than assigned.`,
  );
  lines.push("");
  if (report.miscategorized.length > 0) {
    lines.push("| Effect ID | Name | Declared | Suggested | Confidence | Reason |");
    lines.push("|---|---|---|---|---|---|");
    for (const m of report.miscategorized.slice(0, 30)) {
      lines.push(
        `| \`${m.effectId}\` | ${m.name} | ${m.declaredCategory} | ${m.suggestedCategory} | ${m.confidence}× | ${m.reason} |`,
      );
    }
    if (report.miscategorized.length > 30) {
      lines.push(
        `... and ${report.miscategorized.length - 30} more (see \`curation-report.json\` for the full list).`,
      );
    }
    lines.push("");
  }

  // Section 8: Recommendations
  lines.push("## 8. Recommendations");
  lines.push("");

  lines.push(`### 8.1 Deprecate (${report.recommendations.deprecate.length})`);
  lines.push("");
  lines.push(
    "Effects with overall < 4.0, uniqueness < 3.0 (near-duplicate), or correctness < 3.0 (stub/broken). Removal is **advisory** — see `ADR.md` §4.",
  );
  lines.push("");
  if (report.recommendations.deprecate.length > 0) {
    lines.push("| Effect ID | Reason |");
    lines.push("|---|---|");
    for (const d of report.recommendations.deprecate.slice(0, 50)) {
      lines.push(`| \`${d.id}\` | ${d.reason} |`);
    }
    if (report.recommendations.deprecate.length > 50) {
      lines.push(
        `... and ${report.recommendations.deprecate.length - 50} more (see \`curation-report.json\`).`,
      );
    }
    lines.push("");
  }

  lines.push(
    `### 8.2 Merge (${report.recommendations.merge.length})`,
  );
  lines.push("");
  lines.push(
    "Clusters with recommendation `merge` (max similarity ≥ 0.95). These are near-exact duplicates — keep the canonical, drop the rest.",
  );
  lines.push("");
  if (report.recommendations.merge.length > 0) {
    lines.push("| Cluster canonical | Members | Max similarity |");
    lines.push("|---|---|---|");
    for (const { cluster } of report.recommendations.merge.slice(0, 30)) {
      const maxSim = Math.max(
        ...cluster.members.map((m) => m.similarity),
      ).toFixed(3);
      const members = cluster.members.map((m) => `\`${m.id}\``).join(", ");
      lines.push(
        `| \`${cluster.canonical}\` | ${members} | ${maxSim} |`,
      );
    }
    if (report.recommendations.merge.length > 30) {
      lines.push(
        `... and ${report.recommendations.merge.length - 30} more (see \`duplicates.json\`).`,
      );
    }
    lines.push("");
  }

  lines.push(
    `### 8.3 Improve (${report.recommendations.improve.length})`,
  );
  lines.push("");
  lines.push(
    "Effects with overall 4.0–5.9 (C tier). Worth saving — targeted remediation per the dimension flags.",
  );
  lines.push("");
  if (report.recommendations.improve.length > 0) {
    lines.push("| Effect ID | Issues to address |");
    lines.push("|---|---|");
    for (const im of report.recommendations.improve.slice(0, 50)) {
      lines.push(`| \`${im.id}\` | ${im.issue} |`);
    }
    if (report.recommendations.improve.length > 50) {
      lines.push(
        `... and ${report.recommendations.improve.length - 50} more (see \`curation-report.json\`).`,
      );
    }
    lines.push("");
  }

  lines.push(
    `### 8.4 Blocked removals (${report.recommendations.blockedRemovals.length})`,
  );
  lines.push("");
  lines.push(
    "Deprecation candidates that are **referenced by recipes or patterns** — cannot be removed until the reference is migrated.",
  );
  lines.push("");
  if (report.recommendations.blockedRemovals.length > 0) {
    lines.push("| Effect ID | Referenced by |");
    lines.push("|---|---|");
    for (const b of report.recommendations.blockedRemovals) {
      lines.push(`| \`${b.id}\` | ${b.referencedBy.join(", ")} |`);
    }
    lines.push("");
  } else {
    lines.push("_None — no deprecation candidates are currently referenced by recipes or patterns._");
    lines.push("");
  }

  lines.push("---");
  lines.push("");
  lines.push(
    "_This report is regenerated on every run of `bun run scripts/curate-effects.ts`. Do not edit by hand — edit the source data or the taxonomy module and re-run._",
  );
  lines.push("");

  return lines.join("\n");
}

// ═══════════════════════════════════════════════════════════════════
// Main pipeline
// ═══════════════════════════════════════════════════════════════════

function main() {
  console.log("RoyCSS Effect Curation Pipeline");
  console.log("================================");
  console.log(`Loaded ${effects.length} effects from src/lib/roycss-effects.ts`);
  console.log("");

  // Step 1: Sanity check IDs
  console.log("[1/6] Sanity-checking IDs...");
  const { unique, duplicateIds } = sanityCheckIds(effects);
  console.log(`      unique=${unique}, duplicates=${duplicateIds.length}`);
  if (duplicateIds.length > 0) {
    console.error(
      "FATAL: duplicate effect IDs detected:",
      duplicateIds.slice(0, 10),
    );
    process.exit(1);
  }

  // Step 2: Tag normalization
  console.log("[2/6] Normalizing tags...");
  const tagNorm = normalizeAllTags(effects);
  console.log(
    `      ${tagNorm.changes.length} changes across ${tagNorm.effectsAffected.size} effects`,
  );
  console.log(
    `      ${tagNorm.uncontrolledTags.size} unique uncontrolled tags remain`,
  );

  // Step 3: Find duplicates first (needed for uniqueness scoring)
  console.log("[3/6] Detecting duplicate clusters...");
  const t0 = Date.now();
  const clusters = findDuplicates(effects);
  console.log(
    `      ${clusters.length} clusters involving ${clusters.reduce((s, c) => s + c.members.length, 0)} effects (in ${Date.now() - t0}ms)`,
  );
  const mergeClusters = clusters.filter((c) => c.recommendation === "merge");
  console.log(`      ${mergeClusters.length} clusters flagged for merge`);

  // Step 4: Score all effects
  console.log("[4/6] Scoring effects on 5 quality dimensions...");
  const t1 = Date.now();
  const scores = scoreAllEffects(effects, clusters);
  console.log(`      scored ${scores.length} effects (in ${Date.now() - t1}ms)`);
  const avgOverall =
    Math.round(
      (scores.reduce((s, r) => s + r.overall, 0) / scores.length) * 100,
    ) / 100;
  console.log(`      average overall: ${avgOverall}/10`);
  const tierDist = { A: 0, B: 0, C: 0, D: 0 };
  for (const r of scores) tierDist[r.tier]++;
  console.log(
    `      tier distribution: A=${tierDist.A} B=${tierDist.B} C=${tierDist.C} D=${tierDist.D}`,
  );
  console.log(`      low-quality (< 5): ${scores.filter((r) => r.overall < 5).length}`);

  // Step 5: Miscategorization detection
  console.log("[5/6] Detecting miscategorized effects...");
  const miscategorized = findMiscategorized(effects);
  console.log(`      ${miscategorized.length} miscategorized effects found`);

  // Build protected-ids set from recipes + patterns
  const protectedIds = new Set<string>();
  for (const r of recipes) for (const id of r.effectIds) protectedIds.add(id);
  for (const p of patterns) for (const id of p.effectIds) protectedIds.add(id);

  // Step 6: Compose & write report
  console.log("[6/6] Composing & writing report...");
  const report = composeReport(
    effects,
    scores,
    tagNorm,
    clusters,
    miscategorized,
    protectedIds,
  );
  report.uniqueIds = unique;
  report.duplicateIds = duplicateIds;

  // Write outputs
  mkdirSync(OUT_DIR, { recursive: true });

  const reportJsonPath = join(OUT_DIR, "curation-report.json");
  writeFileSync(reportJsonPath, JSON.stringify(report, null, 2));
  console.log(`      wrote ${reportJsonPath} (${JSON.stringify(report).length} bytes)`);

  const duplicatesPath = join(OUT_DIR, "duplicates.json");
  writeFileSync(
    duplicatesPath,
    JSON.stringify(
      {
        schema: "roycss.curation.duplicates.v1",
        generatedAt: report.generatedAt,
        totalClusters: clusters.length,
        clusters,
      },
      null,
      2,
    ),
  );
  console.log(`      wrote ${duplicatesPath}`);

  const qualityPath = join(OUT_DIR, "quality-scores.json");
  writeFileSync(
    qualityPath,
    JSON.stringify(
      {
        schema: "roycss.curation.quality.v1",
        generatedAt: report.generatedAt,
        totalEffects: scores.length,
        scores,
      },
      null,
      2,
    ),
  );
  console.log(`      wrote ${qualityPath}`);

  const mdPath = join(OUT_DIR, "CURATION-REPORT.md");
  const md = renderMarkdown(report);
  writeFileSync(mdPath, md);
  console.log(`      wrote ${mdPath} (${md.length} bytes)`);

  console.log("");
  console.log("Curation complete. Outputs in scripts/curate-results/.");
}

main();
