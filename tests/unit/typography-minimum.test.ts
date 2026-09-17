import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..", "..");
const SRC_DIR = join(ROOT, "src");
const DOCS_DIR = join(ROOT, "src", "app", "docs");

/**
 * Typography minimum + accent-token gate (issue #115, UIX F-17/F-18).
 *
 * F-17: `text-[9px]` / `text-[10px]` badges, kbd hints and labels render
 * below comfortable legibility on mobile (they sat next to each other in
 * the search overlay's product rows and the homepage's dropdown/menu
 * chrome). Every occurrence was raised to `text-[11px]` — sibling 9px/10px
 * pairs became 11px together so the visual hierarchy is preserved, and
 * intentional larger sizes (text-xs and up) were left untouched. This
 * gate keeps new sub-11px utility sizes from creeping back in.
 *
 * F-18: the docs routes hardcoded `text-emerald-700/600` accent classes
 * instead of the theme's primary token (`text-primary`, defined from the
 * `--primary` OKLCH custom property and dark-mode-aware). Hardcoded
 * palette classes drift from the site accent; the token tracks
 * globals.css. This gate fails any docs route file that reintroduces
 * emerald-700/600 accent classes.
 *
 * Scope notes (deliberate):
 *   - Only 9px/10px are banned — the issue's grep range. A handful of
 *     8px micro-labels exist in tool internals (contrast matrix cells,
 *     sparkline units); those are tracked separately, not by this gate.
 *   - Emerald classes with success semantics elsewhere (status pills,
 *     "passed" states) are out of scope here; docs routes carry none.
 */

/** Every source file under a directory (recursive). */
function listSourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...listSourceFiles(full));
    else if (/\.(tsx|ts|jsx|js|css)$/.test(entry)) out.push(full);
  }
  return out;
}

/** Every .tsx route file (pages + layouts) under src/app/docs/. */
function listDocsRouteFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...listDocsRouteFiles(full));
    else if (entry.endsWith(".tsx")) out.push(full);
  }
  return out;
}

describe("typography minimum — F-17 (issue #115)", () => {
  it("scans a non-trivial source tree", () => {
    expect(listSourceFiles(SRC_DIR).length).toBeGreaterThan(400);
  });

  it("no text-[9px] or text-[10px] anywhere under src/", () => {
    const offenders: string[] = [];
    for (const file of listSourceFiles(SRC_DIR)) {
      const src = readFileSync(file, "utf8");
      const lines = src.split("\n");
      for (const [i, line] of lines.entries()) {
        if (/text-\[(?:9|10)px\]/.test(line)) {
          offenders.push(
            `${file.slice(ROOT.length + 1)}:${i + 1}: ${line.trim().slice(0, 90)}`,
          );
        }
      }
    }
    expect(offenders, offenders.slice(0, 10).join("\n")).toEqual([]);
  });

  it("the raised sizes are text-[11px] (hierarchy preserved, not deleted)", () => {
    // Sanity-check the codemod actually landed somewhere meaningful:
    // the search overlay's badges/kbd rows and the ui-library badge sizes.
    const overlay = readFileSync(
      join(SRC_DIR, "components/roycss/search-overlay.tsx"),
      "utf8",
    );
    expect(overlay).toContain("text-[11px] font-semibold uppercase tracking-wider");
    const card = readFileSync(
      join(SRC_DIR, "components/ui-library/data-display/card.tsx"),
      "utf8",
    );
    expect(card).toContain('sm: "text-[11px] px-1.5 py-0"');
    expect(card).toContain('md: "text-[11px] px-2 py-0.5"');
    // intentional larger sizes untouched
    expect(card).toContain('lg: "text-xs px-2.5 py-1"');
  });
});

describe("docs accent tokens — F-18 (issue #115)", () => {
  it("scans the docs route tree", () => {
    expect(listDocsRouteFiles(DOCS_DIR).length).toBeGreaterThan(30);
  });

  it("docs route files contain no text-emerald-700/600 accent classes", () => {
    const offenders: string[] = [];
    for (const file of listDocsRouteFiles(DOCS_DIR)) {
      const src = readFileSync(file, "utf8");
      const lines = src.split("\n");
      for (const [i, line] of lines.entries()) {
        if (/text-emerald-(?:700|600)/.test(line)) {
          offenders.push(
            `${file.slice(ROOT.length + 1)}:${i + 1}: ${line.trim().slice(0, 90)}`,
          );
        }
      }
    }
    expect(offenders, offenders.slice(0, 10).join("\n")).toEqual([]);
  });

  it("docs accents use the primary token instead", () => {
    // The replacement pattern: link/heading accents read text-primary
    // (theme-aware via the --primary custom property), like /privacy and
    // /terms already do.
    const docsLayout = readFileSync(join(DOCS_DIR, "layout.tsx"), "utf8");
    expect(docsLayout).toContain("bg-primary/10 font-medium text-primary");
    expect(docsLayout).toContain("bg-primary text-primary-foreground");
    expect(docsLayout).not.toMatch(/-emerald-/);
    const apiIndex = readFileSync(
      join(DOCS_DIR, "api/page.tsx"),
      "utf8",
    );
    expect(apiIndex).toContain("text-primary");
  });
});
