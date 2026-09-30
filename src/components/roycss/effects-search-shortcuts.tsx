"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SearchOverlay } from "@/components/roycss/search-overlay";

/**
 * ⌘K / Ctrl+K → search overlay on the /effects catalog page (issue #271).
 *
 * The /effects page advertises the ⌘K shortcut in its "Search hint" block,
 * but the only keyboard listener lived in the home page component
 * (roycss-page.tsx), so pressing ⌘K on /effects did nothing. Rather than
 * refactor the home page's entangled shortcut/overlay state, this small
 * client mount owns the overlay state for /effects and duplicates ONLY the
 * ⌘K behavior the page advertises:
 *
 *   - ⌘K / Ctrl+K  → open the shared SearchOverlay
 *   - Escape       → close (also handled inside the overlay's input handler)
 *   - "/" and "?"  → intentionally NOT wired here; they are home-page-only
 *     affordances and are not advertised on /effects.
 *
 * Result targets all work away from home: effects → real /effects/<id>
 * routes, docs → real /docs routes (both plain <Link>s inside the overlay),
 * and home-section results jump via `onJumpToSection("#id")`, which from
 * /effects navigates to the home anchor (`/#id`) — the overlay's documented
 * "section → home anchor jump" contract (search-overlay.tsx).
 */
export function EffectsSearchShortcuts() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘K / Ctrl+K → open search (case-insensitive: some layouts/IMEs and
      // synthetic key events deliver uppercase "K" with ctrl/meta held).
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setOpen(true);
        return;
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Section-type results (recipes/patterns/collections/platform/home
  // sections) live on the home page — from /effects, a "jump" is a
  // navigation to the home anchor.
  const handleJumpToSection = useCallback(
    (id: string) => {
      router.push(`/${id.startsWith("#") ? id : `#${id}`}`);
    },
    [router],
  );

  return (
    <SearchOverlay
      open={open}
      onOpenChange={setOpen}
      onJumpToSection={handleJumpToSection}
    />
  );
}
