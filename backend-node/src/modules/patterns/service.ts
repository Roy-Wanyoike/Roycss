/**
 * Patterns service — UX patterns built from effects.
 *
 * Source: src/lib/roycss-patterns.ts in the parent project. Snapshot
 * kept here so the backend is self-contained.
 */
import { CACHE_TTL } from "../../config/constants.js";
import { cacheWrap } from "../../lib/cache.js";
import type { Pattern } from "../../types/index.js";
import { AppError } from "../../server/middleware/error.js";
import { ListPatternsQuerySchema } from "./schema.js";
import type { z } from "zod";

// ─── Pattern snapshot ────────────────────────────────────────────────────
const PATTERNS: Pattern[] = [
  {
    id: "pattern-empty-state",
    name: "Empty State",
    category: "states",
    description: "A calming empty state with a breathing orb and clear CTA.",
    whenToUse: "When a list or content area has no items. Always include a clear CTA button.",
    effectIds: ["anim-breathing-orb-b18"],
    tags: ["empty", "state", "placeholder", "cta"],
    html: `<div style="display:flex;flex-direction:column;align-items:center;gap:1rem;padding:3rem;">
  <div class="roycss-anim-breathing-orb-b18"></div>
  <h3>Nothing here yet</h3>
  <p>Create your first item to get started.</p>
  <button>Create Item</button>
</div>`,
  },
  {
    id: "pattern-loading-state",
    name: "Loading State",
    category: "states",
    description: "A loading state with spinner and progress text.",
    whenToUse: "When fetching data. Show a spinner for short waits, skeleton for long waits.",
    effectIds: ["loader-spinner"],
    tags: ["loading", "state", "spinner", "progress"],
    html: `<div style="display:flex;flex-direction:column;align-items:center;gap:1rem;padding:2rem;">
  <div class="roycss-loader-spinner"></div>
  <p>Loading your dashboard...</p>
</div>`,
  },
  {
    id: "pattern-error-state",
    name: "Error State",
    category: "states",
    description: "An error state with clear message and retry button.",
    whenToUse: "When an action fails. Always explain what went wrong and provide a retry button.",
    effectIds: ["micro-shake-error"],
    tags: ["error", "state", "retry", "feedback"],
    html: `<div style="padding:2rem;border-radius:1rem;text-align:center;">
  <span>Something went wrong</span>
  <p>We couldn't load your data. Please try again.</p>
  <button>Retry</button>
</div>`,
  },
  {
    id: "pattern-success-state",
    name: "Success State",
    category: "states",
    description: "A success state with confetti and confirmation.",
    whenToUse: "When a user completes a significant action. Use confetti for delight.",
    effectIds: ["particles-confetti-burst"],
    tags: ["success", "state", "confetti", "celebration"],
    html: `<div style="text-align:center;padding:2rem;">
  <div class="roycss-particles-confetti-burst"><span></span><span></span><span></span></div>
  <h3>Success!</h3>
  <p>Your changes have been saved.</p>
</div>`,
  },
  {
    id: "pattern-skeleton-feedback",
    name: "Skeleton Feedback",
    category: "feedback",
    description: "Skeleton loaders used as progressive loading feedback.",
    whenToUse: "For content-heavy pages where a spinner feels too sparse.",
    effectIds: ["loader-shimmer"],
    tags: ["skeleton", "loading", "shimmer", "feedback"],
    html: `<div style="padding:1rem;display:flex;flex-direction:column;gap:0.5rem;">
  <div class="roycss-loader-shimmer" style="height:1.5rem;width:60%;"></div>
  <div class="roycss-loader-shimmer" style="height:1rem;width:90%;"></div>
  <div class="roycss-loader-shimmer" style="height:1rem;width:80%;"></div>
</div>`,
  },
  {
    id: "pattern-master-detail",
    name: "Master-Detail Layout",
    category: "layouts",
    description: "A responsive master-detail layout with animated selection.",
    whenToUse: "When a list drives a detail view (inbox, settings, file browser).",
    effectIds: ["fade-in-up"],
    tags: ["layout", "master-detail", "responsive"],
    html: `<div style="display:grid;grid-template-columns:240px 1fr;gap:1rem;">
  <aside class="master">
    <ul><li>Item 1</li><li>Item 2</li></ul>
  </aside>
  <section class="detail roycss-fade-in-up">Detail content</section>
</div>`,
  },
];

export type ListPatternsInput = z.infer<typeof ListPatternsQuerySchema>;

export interface PatternListResult {
  items: Pattern[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** List patterns with optional filters. Cached. */
export async function listPatterns(input: ListPatternsInput): Promise<PatternListResult> {
  return cacheWrap(
    `patterns:list:${JSON.stringify(input)}`,
    () => {
      let filtered = PATTERNS;
      if (input.category) filtered = filtered.filter((p) => p.category === input.category);
      if (input.tag) filtered = filtered.filter((p) => p.tags.includes(input.tag!));

      const page = input.page;
      const limit = input.limit;
      const start = (page - 1) * limit;
      const items = filtered.slice(start, start + limit);

      return Promise.resolve({
        items,
        page,
        limit,
        total: filtered.length,
        totalPages: Math.max(1, Math.ceil(filtered.length / limit)),
      });
    },
    CACHE_TTL.patternsList,
  );
}

/** Get a single pattern by id. Cached. Throws 404 if missing. */
export async function getPatternById(id: string): Promise<Pattern> {
  return cacheWrap(
    `pattern:${id}`,
    () => {
      const found = PATTERNS.find((p) => p.id === id);
      if (!found) throw AppError.notFound(`Pattern '${id}' not found`);
      return Promise.resolve(found);
    },
    CACHE_TTL.patternDetail,
  );
}

/** Number of patterns in the dataset. */
export function patternsCount(): number {
  return PATTERNS.length;
}
