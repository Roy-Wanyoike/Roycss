"use client";

/**
 * SiteHeader — compact sitewide primary nav + theme toggle (issue #191).
 *
 * Home keeps its mega-header inside roycss-page; every OTHER top-level
 * surface (/effects/**, /docs/**, /roadmap) mounts this lightweight sticky
 * bar instead:
 *
 *   [R] RoyCSS          Effects  Docs  Roadmap        [GH] [☾] [☰]
 *
 * Design rules:
 *   - Client component (needs usePathname + the theme toggle), but renders
 *     full SSR markup so statically prerendered pages stay static — it uses
 *     NO dynamic APIs and no browser-only values during render.
 *   - Theme toggle mirrors the home ThemeToggle EXACTLY (issue #160
 *     contract): the mount effect only READS `documentElement.classList`
 *     (deferred via rAF — never writes), the click handler is the only
 *     writer: it toggles the `dark` class + `color-scheme` inline style and
 *     persists via `writeStoredTheme()` from the shared theme-storage
 *     module (localStorage key `roycss-theme` — identical to home).
 *   - Mobile (<640px): brand + GitHub + toggle + hamburger; the primary
 *     links collapse into an in-header dropdown panel. 44px touch targets,
 *     no horizontal overflow at 390px.
 *   - Typography gate (issue #115 F-17): no sub-11px text utility sizes.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Github, Menu, Moon, Sun, X } from "lucide-react";
import { writeStoredTheme } from "@/components/ui-library/foundation/theme-storage";

const GITHUB_URL = "https://github.com/Roy-Wanyoike/Roycss";

/** Primary destinations rendered inside <nav aria-label="Primary">. */
const PRIMARY_LINKS = [
  { href: "/effects", label: "Effects" },
  { href: "/docs", label: "Docs" },
  { href: "/roadmap", label: "Roadmap" },
] as const;

/* ─── Theme toggle — exact mechanism of the home ThemeToggle ─────────── */

function SiteThemeToggle() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    // Read-only sync with the pre-hydration init script (src/app/layout.tsx).
    // The DOM class — not localStorage — is the source of truth so a stored
    // "system" preference resolves exactly like the script does. Deferred
    // via rAF (set-state-in-effect rule). NEVER writes on mount (issue #160).
    const id = requestAnimationFrame(() => {
      setDark(document.documentElement.classList.contains("dark"));
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    // Apply + persist ONLY on explicit user intent. Keep the .dark class
    // and the color-scheme inline style in agreement — the init script sets
    // both, so the toggle must too. Same key ("roycss-theme") as home.
    const root = document.documentElement;
    root.classList.toggle("dark", next);
    root.style.colorScheme = next ? "dark" : "light";
    writeStoredTheme(window.localStorage, next ? "dark" : "light");
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      aria-label="Toggle theme"
    >
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}

/* ─── Shared link styles ─────────────────────────────────────────────── */

function linkClass(active: boolean) {
  return (
    "flex min-h-[44px] items-center rounded-lg text-sm font-medium transition-colors " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 " +
    (active
      ? "bg-primary/10 text-primary"
      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground")
  );
}

/* ─── SiteHeader ─────────────────────────────────────────────────────── */

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-2 px-4 sm:gap-3 sm:px-6">
        {/* Brand → home (same mark as the docs TopBar / roadmap header) */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 text-sm font-semibold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-md"
          aria-label="RoyCSS — back to home"
        >
          <span className="inline-flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            R
          </span>
          <span className="hidden min-[420px]:inline">RoyCSS</span>
        </Link>

        {/* Desktop primary nav (<nav aria-label="Primary">, issue #191) */}
        <nav
          aria-label="Primary"
          className="ml-auto hidden items-center gap-1 sm:flex"
        >
          {PRIMARY_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${linkClass(isActive(link.href))} px-3`}
              aria-current={isActive(link.href) ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div
          className={
            /* Below sm the nav is display:none, so the cluster takes
               ml-auto; on sm+ the desktop nav owns the auto margin and the
               cluster sits flush after it. */
            "ml-auto flex items-center gap-1 sm:ml-0"
          }
        >
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            aria-label="GitHub repository (opens in a new tab)"
          >
            <Github className="size-4" />
          </a>
          <SiteThemeToggle />
          {/* Mobile hamburger — primary links live in the panel below */}
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="site-header-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:hidden"
          >
            {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown panel — rendered only while open, so exactly one
          "Primary" nav landmark is exposed to assistive tech at a time
          (the desktop <nav> is display:none below sm). */}
      {menuOpen ? (
        <nav
          aria-label="Primary"
          id="site-header-menu"
          className="border-t border-border/60 bg-background/95 backdrop-blur sm:hidden"
        >
          <ul className="mx-auto w-full max-w-6xl space-y-0.5 px-4 py-2 sm:px-6">
            {PRIMARY_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`${linkClass(isActive(link.href))} px-3 text-base`}
                  aria-current={isActive(link.href) ? "page" : undefined}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}

export default SiteHeader;
