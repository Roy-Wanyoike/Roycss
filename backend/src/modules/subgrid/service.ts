/**
 * Subgrid service — generate subgrid CSS from a parent track config +
 * child span config.
 *
 * 6 subgrid presets cover the canonical column-count patterns:
 * 3-col, 4-col, 5-col, 6-col, 12-col, and an auto-fit-style layout using
 * fit-content tracks so the columns flex to their content.
 *
 * Conversions are cached per input so identical configurations return
 * instantly on subsequent calls.
 *
 * Reference: CSS Grid Layout Module Level 2 §7 (subgrids).
 */
import { CACHE_TTL } from "../../config/constants.js";
import { cacheWrap } from "../../lib/cache.js";
import { createLogger } from "../../lib/logger.js";
import { AppError } from "../../server/middleware/error.js";
import type { SubgridGenerateInput } from "./schema.js";

const log = createLogger("subgrid");

// ─── Types ───────────────────────────────────────────────────────────────
export interface SubgridResult {
  /** Generated CSS for the parent + each child. */
  css: string;
  /** Per-child breakdown of how it maps onto the parent tracks. */
  children: {
    label: string;
    span: number;
    subgrid: boolean;
    /** Track numbers (1-indexed) this child occupies on the parent. */
    parentTracks: number[];
    /** Inner cell count if subgrid is on. */
    cells?: number;
    color: string;
  }[];
  /** Parent track-size CSS fragment (e.g. "repeat(4, 1fr)"). */
  parentTracks: string;
  /** Human-readable explanation. */
  explanation: string;
}

export interface SubgridPreset {
  id: string;
  name: string;
  description: string;
  input: SubgridGenerateInput;
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function trackSizeCss(input: SubgridGenerateInput["parent"]): string {
  switch (input.trackSize) {
    case "fr":
      return `1fr`;
    case "px":
      return `${input.trackPx}px`;
    case "auto":
      return `auto`;
    case "minmax":
      return `minmax(${input.trackMin}px, 1fr)`;
    case "fit-content":
      return `fit-content(120px)`;
    default:
      return `1fr`;
  }
}

function buildParentCss(input: SubgridGenerateInput): string {
  const { columns, gap, name } = input.parent;
  const track = trackSizeCss(input.parent);
  const selector = name ? `.parent-${name}` : ".parent-grid";
  return [
    `${selector} {`,
    `  display: grid;`,
    `  grid-template-columns: repeat(${columns}, ${track});`,
    `  gap: ${gap}px;`,
    `}`,
  ].join("\n");
}

function buildChildCss(
  input: SubgridGenerateInput,
  index: number,
): { selector: string; body: string; tracks: number[]; cells?: number } {
  const child = input.children[index];
  if (!child) throw AppError.badRequest(`child at index ${index} missing`);
  const selector = `.child-${index + 1}`;
  const tracks: number[] = [];
  // Compute which parent tracks this child occupies (start at 1, sequential
  // placement; each child picks up where the previous left off, wrapping
  // to the next row when needed).
  const start = (() => {
    let t = 1;
    for (let i = 0; i < index; i++) {
      const prev = input.children[i];
      if (!prev) break;
      t += prev.span;
      if (t > input.parent.columns) {
        t = 1 + (prev.span > input.parent.columns ? 0 : 0);
      }
    }
    return t;
  })();
  for (let i = 0; i < child.span; i++) {
    tracks.push(((start - 1 + i) % input.parent.columns) + 1);
  }
  const cells = child.cells ?? child.span;
  const body = [
    `  grid-column: span ${child.span};`,
    ...(child.subgrid
      ? [
          `  display: grid;`,
          `  grid-template-columns: subgrid;`,
          `  /* ${cells} inner cells inherit parent tracks ${tracks.join(", ")} */`,
        ]
      : []),
  ].join("\n");
  return { selector, body, tracks, cells: child.subgrid ? cells : undefined };
}

// ─── 6 subgrid presets: 3-col, 4-col, 5-col, 6-col, 12-col, auto-fit ───────
const PALETTE = ["#5b8def", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"] as const;

const PRESETS: SubgridPreset[] = [
  {
    id: "preset-3-col",
    name: "3-Column Subgrid",
    description:
      "3-column grid with each child spanning all 3 columns and inheriting the parent tracks via subgrid — great for triple-pane layouts.",
    input: {
      parent: { columns: 3, trackSize: "fr", trackPx: 120, trackMin: 80, gap: 16, name: "three-col" },
      children: [
        { label: "Header", span: 3, subgrid: true, color: PALETTE[0] },
        { label: "Body", span: 3, subgrid: true, color: PALETTE[1] },
        { label: "Footer", span: 3, subgrid: true, color: PALETTE[2] },
      ],
    },
  },
  {
    id: "preset-4-col",
    name: "4-Column Subgrid",
    description:
      "4-column dashboard grid where each card spans 2 columns and inherits the parent gap via subgrid.",
    input: {
      parent: { columns: 4, trackSize: "fr", trackPx: 120, trackMin: 80, gap: 16, name: "dashboard" },
      children: [
        { label: "Revenue", span: 2, subgrid: true, color: PALETTE[0] },
        { label: "Active Users", span: 2, subgrid: true, color: PALETTE[1] },
        { label: "Churn", span: 2, subgrid: true, color: PALETTE[2] },
        { label: "MRR", span: 2, subgrid: true, color: PALETTE[3] },
      ],
    },
  },
  {
    id: "preset-5-col",
    name: "5-Column Subgrid",
    description:
      "5-column metric strip — each tile spans 1 column and inherits the parent tracks. Common for KPI rows and timeline weeks.",
    input: {
      parent: { columns: 5, trackSize: "fr", trackPx: 100, trackMin: 60, gap: 12, name: "metric-strip" },
      children: [
        { label: "Mon", span: 1, subgrid: true, color: PALETTE[0] },
        { label: "Tue", span: 1, subgrid: true, color: PALETTE[1] },
        { label: "Wed", span: 1, subgrid: true, color: PALETTE[2] },
        { label: "Thu", span: 1, subgrid: true, color: PALETTE[3] },
        { label: "Fri", span: 1, subgrid: true, color: PALETTE[4] },
      ],
    },
  },
  {
    id: "preset-6-col",
    name: "6-Column Subgrid",
    description:
      "6-column form layout where label + field pairs each take 3 columns with subgrid alignment — pixel-perfect label/value rows.",
    input: {
      parent: { columns: 6, trackSize: "fr", trackPx: 120, trackMin: 80, gap: 12, name: "form" },
      children: [
        { label: "Name", span: 3, subgrid: true, color: PALETTE[0] },
        { label: "Email", span: 3, subgrid: true, color: PALETTE[1] },
        { label: "Phone", span: 3, subgrid: true, color: PALETTE[2] },
        { label: "Country", span: 3, subgrid: true, color: PALETTE[3] },
      ],
    },
  },
  {
    id: "preset-12-col",
    name: "12-Column Subgrid",
    description:
      "12-column magazine layout with a 6-column feature article and 3+3 sidebar widgets — the classic print-grid ported to CSS grid.",
    input: {
      parent: { columns: 12, trackSize: "fr", trackPx: 120, trackMin: 80, gap: 24, name: "magazine" },
      children: [
        { label: "Feature", span: 6, subgrid: true, color: PALETTE[4] },
        { label: "Sidebar A", span: 3, subgrid: true, color: PALETTE[0] },
        { label: "Sidebar B", span: 3, subgrid: true, color: PALETTE[2] },
      ],
    },
  },
  {
    id: "preset-auto-fit",
    name: "Auto-Fit (fit-content tracks)",
    description:
      "Auto-fit-style responsive layout using `fit-content()` tracks — each column flexes to its content's natural width while children inherit the tracks via subgrid.",
    input: {
      parent: { columns: 6, trackSize: "fit-content", trackPx: 120, trackMin: 80, gap: 12, name: "auto-fit" },
      children: [
        { label: "Tag 1", span: 2, subgrid: true, color: PALETTE[0] },
        { label: "Tag 2", span: 2, subgrid: true, color: PALETTE[1] },
        { label: "Tag 3", span: 2, subgrid: true, color: PALETTE[2] },
      ],
    },
  },
];

const presets: SubgridPreset[] = PRESETS.map((p) => ({ ...p }));

// ─── Public service API ──────────────────────────────────────────────────

/** List all 6 subgrid presets. Cached. */
export async function listPresets(): Promise<SubgridPreset[]> {
  return cacheWrap(
    "subgrid:presets",
    () => Promise.resolve(presets.map((p) => ({ ...p }))),
    CACHE_TTL.subgridPresets,
  );
}

/** Generate subgrid CSS for the given parent + child configuration. */
export async function generateSubgrid(
  input: SubgridGenerateInput,
): Promise<SubgridResult> {
  const cacheKey = `subgrid:gen:${JSON.stringify(input)}`;
  return cacheWrap(
    cacheKey,
    () => {
      // Validate children fit: each child's span must be ≤ parent.columns.
      for (const [i, c] of input.children.entries()) {
        if (c.span > input.parent.columns) {
          throw AppError.badRequest(
            `child[${i}] span (${c.span}) exceeds parent columns (${input.parent.columns}).`,
          );
        }
      }

      const parentCss = buildParentCss(input);
      const childBlocks = input.children.map((_, i) => buildChildCss(input, i));
      const css = [
        parentCss,
        "",
        ...childBlocks.flatMap((b, i) => [
          `/* ${input.children[i]?.label ?? `Child ${i + 1}`} */`,
          `${b.selector} {`,
          b.body,
          `}`,
        ]),
      ].join("\n");

      const explanation =
        `Parent grid defines ${input.parent.columns} ${input.parent.trackSize} tracks ` +
        `with ${input.parent.gap}px gap. ${input.children.length} children use subgrid ` +
        `to inherit the parent's tracks so their inner cells align perfectly across rows.`;

      log.info("Subgrid generated", {
        columns: input.parent.columns,
        children: input.children.length,
      });

      return Promise.resolve({
        css,
        children: childBlocks.map((b, i) => ({
          label: input.children[i]?.label ?? `Child ${i + 1}`,
          span: input.children[i]?.span ?? 1,
          subgrid: input.children[i]?.subgrid ?? true,
          parentTracks: b.tracks,
          cells: b.cells,
          color: input.children[i]?.color ?? "#5b8def",
        })),
        parentTracks: `repeat(${input.parent.columns}, ${trackSizeCss(input.parent)})`,
        explanation,
      });
    },
    CACHE_TTL.subgridGenerate,
  );
}
