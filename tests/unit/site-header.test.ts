import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * SiteHeader contract (issue #191 — sitewide nav + theme toggle on
 * secondary pages).
 *
 * The shared compact header must:
 *   1. expose ONE "Primary" nav landmark with brand → home plus
 *      Effects/Docs/Roadmap links and an external GitHub link,
 *   2. reuse the EXACT theme mechanism of the home ThemeToggle (issue #160
 *      contract): read-only mount sync (deferred rAF), the ONLY write is
 *      the toggle handler persisting via the shared theme-storage module
 *      (localStorage key `roycss-theme`),
 *   3. be mounted on the secondary surfaces: /effects (layout, so
 *      /effects/<id> is covered without touching that page), /docs
 *      (layout), /roadmap (page),
 *   4. respect the typography minimum (issue #115 F-17: no text-[9px]/
 *      text-[10px]) and the docs accent-token rule (no -emerald-).
 *   5. mount the site-wide PauseAnimationsToggle (issue #214) with its
 *      APG toggle-button contract intact and the #214-tail persistence
 *      wired through the shared animation-pause-storage module.
 *
 * Source-level assertions mirror tests/unit/theme-persistence.test.ts and
 * tests/unit/legal-pages.test.ts — the vitest environment is node (no DOM).
 */

const ROOT = join(__dirname, "..", "..");

const headerSrc = readFileSync(
  join(ROOT, "src/components/roycss/site-header.tsx"),
  "utf8",
);
const effectsLayoutSrc = readFileSync(
  join(ROOT, "src/app/effects/layout.tsx"),
  "utf8",
);
const docsLayoutSrc = readFileSync(
  join(ROOT, "src/app/docs/layout.tsx"),
  "utf8",
);
const roadmapSrc = readFileSync(join(ROOT, "src/app/roadmap/page.tsx"), "utf8");

const pauseToggleSrc = readFileSync(
  join(ROOT, "src/components/roycss/pause-animations-toggle.tsx"),
  "utf8",
);

describe("site-header: nav landmarks (issue #191)", () => {
  it("is a client component exporting SiteHeader", () => {
    expect(headerSrc.trimStart().startsWith('"use client"')).toBe(true);
    expect(headerSrc).toContain("export function SiteHeader");
  });

  it("has a <nav aria-label=\"Primary\"> with Effects/Docs/Roadmap", () => {
    expect(headerSrc).toContain('aria-label="Primary"');
    for (const href of ["/effects", "/docs", "/roadmap"]) {
      expect(headerSrc).toContain(`href: "${href}"`);
    }
  });

  it("brand links home and GitHub is an external icon link", () => {
    expect(headerSrc).toContain('href="/"');
    expect(headerSrc).toContain("https://github.com/Roy-Wanyoike/Roycss");
    expect(headerSrc).toContain('target="_blank"');
    expect(headerSrc).toContain('rel="noreferrer"');
  });

  it("mobile hamburger is announced and collapses into a panel", () => {
    // Issue #129 PR-A: the labels live in the SiteHeader catalog
    // (messages/en.json "Open menu"/"Close menu" — identical strings).
    expect(headerSrc).toContain('aria-label={menuOpen ? t("menuClose") : t("menuOpen")}');
    expect(headerSrc).toContain("aria-expanded={menuOpen}");
    expect(headerSrc).toContain('aria-controls="site-header-menu"');
  });

  it("marks the current section with aria-current", () => {
    expect(headerSrc).toContain('aria-current={isActive(');
  });

  it("respects the typography minimum (no text-[9px]/text-[10px])", () => {
    expect(headerSrc).not.toMatch(/text-\[(?:9|10)px\]/);
  });
});

describe("site-header: theme toggle reuses the exact home mechanism (#160)", () => {
  it("writes via the shared theme-storage module — never raw localStorage", () => {
    expect(headerSrc).toContain("writeStoredTheme(window.localStorage");
    expect(headerSrc).not.toContain("localStorage.setItem");
  });

  it("mount effect only reads the DOM class (no writes, rAF-deferred)", () => {
    const effectStart = headerSrc.indexOf("useEffect(");
    const effectEnd = headerSrc.indexOf("}, []);", effectStart);
    const mountEffect = headerSrc.slice(effectStart, effectEnd);
    expect(mountEffect).toContain("classList.contains");
    expect(mountEffect).toContain("requestAnimationFrame");
    expect(mountEffect).not.toContain("writeStoredTheme");
    expect(mountEffect).not.toContain("setItem");
  });

  it("toggle handler keeps the .dark class and color-scheme in agreement", () => {
    const handlerStart = headerSrc.indexOf("const toggleTheme");
    const handlerEnd = headerSrc.indexOf("};", handlerStart);
    const handler = headerSrc.slice(handlerStart, handlerEnd);
    expect(handler).toContain('classList.toggle("dark", next)');
    expect(handler).toContain('root.style.colorScheme = next ? "dark" : "light"');
    expect(handler.indexOf("writeStoredTheme")).toBeGreaterThan(0);
  });

  it("the toggle has an accessible name", () => {
    // Issue #129 PR-A: resolved from the SiteHeader catalog
    // (messages/en.json "Toggle theme" — identical string).
    expect(headerSrc).toContain('aria-label={t("themeToggleAria")}');
  });
});

describe("site-header: pause toggle reuses the shared #214 mechanism", () => {
  it("SiteHeader mounts PauseAnimationsToggle (secondary surfaces keep the control)", () => {
    expect(headerSrc).toContain("<PauseAnimationsToggle />");
    // Home's mega-header mounts its own instance (guarded in
    // animation-pause-storage.test.ts via the shared component).
    expect(headerSrc).not.toContain("aria-label=\"Pause animations\"");
  });

  it("the toggle keeps its constant accessible name + aria-pressed state", () => {
    expect(pauseToggleSrc).toContain('aria-label="Pause animations"');
    expect(pauseToggleSrc).toContain("aria-pressed={paused}");
  });

  it("persisted writes go through the shared animation-pause-storage module", () => {
    expect(pauseToggleSrc).toContain(
      'from "@/components/ui-library/foundation/animation-pause-storage"',
    );
    const calls =
      pauseToggleSrc.split("writeStoredAnimationPause(window.localStorage").length - 1;
    expect(calls).toBe(1);
  });

  it("no mount-time localStorage writes (write-on-user-intent-only, #214 tail)", () => {
    expect(pauseToggleSrc).not.toContain("localStorage.setItem");
    const effectStart = pauseToggleSrc.indexOf("useEffect(");
    const effectEnd = pauseToggleSrc.indexOf("}, []);", effectStart);
    const mountEffect = pauseToggleSrc.slice(effectStart, effectEnd);
    expect(mountEffect).toContain("requestAnimationFrame");
    expect(mountEffect).toContain("hasAttribute");
    expect(mountEffect).not.toContain("writeStoredAnimationPause");
    expect(mountEffect).not.toContain("setItem");
  });
});

describe("site-header: mounted on the secondary surfaces", () => {
  it("/effects layout renders SiteHeader (covers /effects/<id> too)", () => {
    expect(effectsLayoutSrc).toContain("import { SiteHeader }");
    expect(effectsLayoutSrc).toContain("<SiteHeader />");
    // No dynamic APIs added — force-static on /effects is preserved.
    expect(effectsLayoutSrc).not.toMatch(/headers\(|cookies\(|draftMode\(/);
  });

  it("/docs layout renders SiteHeader above the docs TopBar", () => {
    expect(docsLayoutSrc).toContain('import { SiteHeader } from "@/components/roycss/site-header"');
    expect(docsLayoutSrc).toContain("<SiteHeader />");
    expect(docsLayoutSrc).toContain("<TopBar onOpenSidebar");
    // The docs TopBar must stick BELOW the SiteHeader (2 × h-14 stack).
    expect(docsLayoutSrc).toContain("sticky top-14");
    expect(docsLayoutSrc).toContain("sticky top-28");
  });

  it("/roadmap renders SiteHeader", () => {
    expect(roadmapSrc).toContain('import { SiteHeader } from "@/components/roycss/site-header"');
    expect(roadmapSrc).toContain("<SiteHeader />");
    // The old page-local sticky header is gone (brand + nav now live in
    // the shared SiteHeader).
    expect(roadmapSrc).not.toContain('aria-label="Site pages"');
  });

  it("home's existing header is untouched (roycss-page still owns it)", () => {
    // SiteHeader must not be wired into the home page — it has its own
    // mega-header with ThemeToggle (guarded by theme-persistence.test.ts).
    const homeSrc = readFileSync(
      join(ROOT, "src/components/roycss/roycss-page.tsx"),
      "utf8",
    );
    expect(homeSrc).not.toContain("site-header");
    expect(homeSrc).toContain("function ThemeToggle()");
  });
});
