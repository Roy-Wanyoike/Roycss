"use client";

/**
 * MobileBottomNav
 * ─────────────────────────────────────────────────────────────────
 * A persistent 5-item bottom navigation bar shown only on viewports
 * below the `md` breakpoint (i.e. < 768px). Each item is a 56px-tall
 * touch target (well above the WCAG 2.5.5 / 2.5.8 44px minimum) so
 * thumb navigation is comfortable on phones, even when the user has
 * a case or screen-edge gestures to contend with.
 *
 * • `Home` — smooth-scroll to top
 * • `Effects` — jump to #effects
 * • `Platform` — jump to #platform
 * • `Docs` — open the docs overlay (parent-controlled)
 * • `Search` — open the search overlay (parent-controlled)
 *
 * The bar uses `position: fixed; bottom: 0` so it floats above the
 * page content; the parent layout adds bottom padding via the
 * `min-h-[56px]` reserved space inside the page footer / sticky
 * mini-nav system to avoid covering content. It respects the safe
 * area inset on iOS via `pb-[env(safe-area-inset-bottom)]`.
 */

import { Home, Sparkles, Box, BookOpen, Search, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileBottomNavProps {
  /** Currently active section id (from IntersectionObserver in the page). */
  activeSection: string;
  /** Open the docs overlay. */
  onOpenDocs: () => void;
  /** Open the search overlay (⌘K). */
  onOpenSearch: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  action: () => void;
}

export function MobileBottomNav({
  activeSection,
  onOpenDocs,
  onOpenSearch,
}: MobileBottomNavProps) {
  const items: NavItem[] = [
    {
      id: "hero",
      label: "Home",
      icon: Home,
      action: () => window.scrollTo({ top: 0, behavior: "smooth" }),
    },
    {
      id: "effects",
      label: "Effects",
      icon: Sparkles,
      action: () =>
        document
          .querySelector("#effects")
          ?.scrollIntoView({ behavior: "smooth" }),
    },
    {
      id: "platform",
      label: "Platform",
      icon: Box,
      action: () =>
        document
          .querySelector("#platform")
          ?.scrollIntoView({ behavior: "smooth" }),
    },
    { id: "docs", label: "Docs", icon: BookOpen, action: onOpenDocs },
    { id: "search", label: "Search", icon: Search, action: onOpenSearch },
  ];

  return (
    <nav
      aria-label="Mobile bottom navigation"
      className="fixed inset-x-0 bottom-0 z-40 md:hidden border-t border-border/60 bg-background/80 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="flex justify-around">
        {items.map((item) => {
          const Icon = item.icon;
          // The "hero" item is active when the page is at the very top
          // (activeSection is "" or "hero"). Every other item is active
          // only when its id matches the currently-observed section.
          const isActive =
            activeSection === item.id ||
            (item.id === "hero" &&
              (activeSection === "" || activeSection === "hero"));
          return (
            <li key={item.id} className="flex-1 min-w-0">
              <button
                type="button"
                onClick={item.action}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 w-full min-h-[56px] py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-inset",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="size-5" aria-hidden="true" />
                <span className="text-[10px] font-medium leading-none">
                  {item.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
