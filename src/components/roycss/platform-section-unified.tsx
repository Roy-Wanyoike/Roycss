"use client";

/**
 * PlatformSectionUnified — single, authoritative "RoyCSS Platform" section.
 *
 * Phase 2 refactor: the inline 600-line grid was replaced with a thin
 * wrapper around <ProductGrid /> (the new single source of truth in
 * src/lib/product-registry.ts). The onLaunchTool prop is preserved
 * for backwards compatibility — it no-ops since ProductGrid renders
 * its own modal with the live component.
 */

import { ProductGrid } from "@/components/roycss/product-grid";

export function PlatformSectionUnified(_props: { onLaunchTool?: (toolId: string) => void }) {
  return (
    <section id="platform" aria-labelledby="platform-heading" className="py-12 sm:py-16 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8">
          <h2 id="platform-heading" className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
            RoyCSS Platform
          </h2>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            62 products across 6 pillars — Components, AI, Dev Tools, Enterprise, Integrations & Design.
          </p>
        </div>
        <ProductGrid />
      </div>
    </section>
  );
}

export default PlatformSectionUnified;
