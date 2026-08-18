"use client";

/**
 * PlatformSectionUnified — single, authoritative "RoyCSS Platform" section.
 *
 * Phase 2 refactor (Task 10): the section is now a thin wrapper around the
 * new `ProductGrid` + `ProductCard` + `product-registry` primitives:
 *
 *   - Metadata comes from `src/lib/product-registry.ts` (single source of truth)
 *   - The card UI is `src/components/roycss/product-card.tsx`
 *   - The grid, filters, and lazy-load modal live in
 *     `src/components/roycss/product-grid.tsx`
 *
 * This file keeps the section heading + outer container, and forwards the
 * optional `onLaunchTool` callback to the grid (used to surface legacy
 * differentiator tools in the roycss-page tool sheet).
 *
 * Behavior preserved from the previous version:
 *   - 6 category tabs with counts
 *   - Search by name / description / category
 *   - Click card → Dialog opens with lazy-loaded product component
 *   - Dialog has backdrop close + footer with tier/status + CTA
 *   - "Open in tool sheet" footer action only renders when `onLaunchTool`
 *     is provided
 *
 * New in Phase 2:
 *   - Sub-filter pills for tier and status (provided by ProductGrid)
 *   - Quality score badge per card (provided by ProductCard via
 *     `src/lib/effect-quality.ts`)
 *   - Hover lift + primary border glow on cards
 */

import { motion } from "framer-motion";
import { Layers } from "lucide-react";
import { ProductGrid } from "@/components/roycss/product-grid";
import { PRODUCT_REGISTRY } from "@/lib/product-registry";

export function PlatformSectionUnified({
  onLaunchTool,
}: {
  onLaunchTool?: (toolId: string) => void;
}) {
  return (
    <section
      id="platform"
      aria-label="The RoyCSS Platform"
      className="py-16 sm:py-20 scroll-mt-20"
    >
      <div className="container mx-auto px-4 sm:px-6">
        {/* ─── Heading ──────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.4 }}
          className="text-center max-w-3xl mx-auto mb-10"
        >
          <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs font-medium text-primary mb-3">
            <Layers className="size-3.5" />
            The RoyCSS Platform
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-3 tracking-tight">
            The RoyCSS Platform
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Everything you need to design, build, ship and scale modern interfaces.
          </p>
          <p className="text-sm text-muted-foreground/80 mt-2">
            <span className="font-semibold text-foreground tabular-nums">
              {PRODUCT_REGISTRY.length}
            </span>{" "}
            live products across{" "}
            <span className="font-semibold text-foreground">6 pillars</span> —
            click any card to try it.
          </p>
        </motion.div>

        {/* ─── Grid (filters + cards + modal) ──────────────────── */}
        <ProductGrid onLaunchTool={onLaunchTool} />
      </div>
    </section>
  );
}

export default PlatformSectionUnified;
