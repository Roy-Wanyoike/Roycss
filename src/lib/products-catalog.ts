/**
 * products-catalog.ts — backwards-compatible search-index source.
 *
 * Phase 2 (Task 10): This file is now a THIN SHIM that re-exports metadata
 * from the new single source of truth at `src/lib/product-registry.ts`.
 *
 * It keeps the old public API surface (`PRODUCTS_CATALOG`, `ProductMeta`,
 * `PRODUCT_TIER_META`) so consumers like `search-overlay.tsx` continue to
 * work without modification. New consumers should import directly from
 * `@/lib/product-registry` instead.
 *
 * The legacy category labels ("Build", "Design", "AI", "Developer Tools",
 * "Enterprise", "Learning & Community") are mapped from the new registry
 * category ids ("components", "design", "ai", "devtools", "enterprise",
 * "integrations").
 */

import {
  PRODUCT_REGISTRY,
  PRODUCT_TIER_META as NEW_TIER_META,
  normalizeStatus,
  normalizeTier,
  type ProductCategory as NewProductCategory,
  type ProductTier as NewProductTier,
  type ProductStatus as NewProductStatus,
} from "@/lib/product-registry";

export type ProductCategory =
  | "Build"
  | "Design"
  | "AI"
  | "Developer Tools"
  | "Enterprise"
  | "Learning & Community";

export type ProductTier = "free" | "pro" | "enterprise" | "cloud";

export type ProductStatus = "ready" | "beta" | "roadmap";

export interface ProductMeta {
  id: string;
  name: string;
  description: string;
  category: ProductCategory;
  tier: ProductTier;
  status: ProductStatus;
}

/* ─── Mapping tables ─────────────────────────────────────────── */

const CATEGORY_NEW_TO_LEGACY: Record<NewProductCategory, ProductCategory> = {
  components: "Build",
  design: "Design",
  ai: "AI",
  devtools: "Developer Tools",
  enterprise: "Enterprise",
  integrations: "Learning & Community",
};

const TIER_NEW_TO_LEGACY: Record<NewProductTier, ProductTier> = {
  free: "free",
  pro: "pro",
  team: "pro",
  enterprise: "enterprise",
};

const STATUS_NEW_TO_LEGACY: Record<NewProductStatus, ProductStatus> = {
  live: "ready",
  beta: "beta",
  "coming-soon": "roadmap",
};

/* ─── Re-exported catalog (memoized at module load) ──────────── */

export const PRODUCTS_CATALOG: ProductMeta[] = PRODUCT_REGISTRY.map((p) => ({
  id: p.id,
  name: p.name,
  description: p.shortDescription,
  category: CATEGORY_NEW_TO_LEGACY[p.category],
  tier: TIER_NEW_TO_LEGACY[p.tier],
  status: STATUS_NEW_TO_LEGACY[p.status],
}));

/* ─── Tier metadata — surface the new registry's style map but
   remap "team" → "pro" so old shape ("cloud") callers still work. ─ */

export const PRODUCT_TIER_META: Record<
  ProductTier,
  { label: string; className: string }
> = {
  free: NEW_TIER_META.free,
  pro: NEW_TIER_META.pro,
  enterprise: NEW_TIER_META.enterprise,
  cloud: NEW_TIER_META.enterprise,
};

/* ─── Convenience: keep the normalize helpers reachable for any
   downstream caller that wants to convert between old/new shapes. ─ */

export { normalizeStatus, normalizeTier };
