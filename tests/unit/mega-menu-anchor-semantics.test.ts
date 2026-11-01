import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..", "..");
const PAGE_SRC = join(ROOT, "src/components/roycss/roycss-page.tsx");

/**
 * Issue #299 (semantics item) — mega-menu nav items rendered as DIVs.
 *
 * The mega-menu config objects (EXPLORE_ITEMS / PLATFORM_GROUPS) carry
 * real hrefs (#effects, #recipes, #platform, /effects) but MegaMenuRow
 * rendered each item as a Radix DropdownMenuItem — a DIV with
 * role="menuitem" and no href. In-page anchor navigation had no semantic
 * link: screen-reader link roving, middle/⌘-click, copy-link and crawler
 * discovery all saw a div.
 *
 * Fix under test: DropdownMenuItem asChild promotes the config's own
 * <a href> to the menuitem. Radix keeps role="menuitem", arrow-key roving
 * focus and Enter/Space activation; the DOM gains a genuine anchor.
 * Modifier-clicks keep native anchor behavior; plain clicks preventDefault
 * and navigate in place (scrollToSection for hashes, router.push for
 * routes) — unchanged UX, real semantics.
 *
 * The vitest environment is `node` (no DOM), so these are source-level
 * pins — same convention as tests/unit/mega-menu-close-gecko.test.ts.
 */

/** Extract the source between two markers (throws if either is missing). */
function extractSrc(startMarker: string, endMarker: string): string {
  const src = readFileSync(PAGE_SRC, "utf8");
  const start = src.indexOf(startMarker);
  if (start === -1) throw new Error(`${startMarker} not found in roycss-page.tsx`);
  const end = src.indexOf(endMarker, start);
  if (end === -1) throw new Error(`${endMarker} not found after ${startMarker}`);
  return src.slice(start, end);
}

function megaMenuRowSrc(): string {
  return extractSrc("function MegaMenuRow(", "\n/* ─── Scroll Progress Bar");
}

/* ─── 1. the row renders a real anchor ───────────────────────────────── */

describe("MegaMenuRow — real <a> anchors (#299 semantics)", () => {
  const src = megaMenuRowSrc();

  it("promotes the anchor to the Radix menuitem via asChild", () => {
    expect(src).toContain("<DropdownMenuItem asChild>");
    const itemStart = src.indexOf("<DropdownMenuItem asChild>");
    const itemBlock = src.slice(itemStart);
    expect(itemBlock).toContain("<a");
    expect(itemBlock).toContain("href={item.href}");
  });

  it("keeps in-place navigation on plain clicks (preventDefault)", () => {
    expect(src).toContain("e.preventDefault();");
  });

  it("modifier/middle clicks keep native anchor behavior", () => {
    expect(src).toContain(
      "if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {",
    );
    const guardStart = src.indexOf("if (e.metaKey");
    const guardEnd = src.indexOf("}", guardStart);
    const guardBlock = src.slice(guardStart, guardEnd + 1);
    // Early return inside the guard — modifier clicks never navigate.
    expect(guardBlock).toContain("return;");
    // preventDefault happens only AFTER the guard (plain clicks only).
    const pd = src.indexOf("e.preventDefault();");
    const firstReturn = src.indexOf("return;", guardStart);
    expect(pd).toBeGreaterThan(firstReturn);
  });

  it("hash items still scroll + move focus to the target section", () => {
    expect(src).toContain("onSelect(item.href)");
    expect(src).toContain('target.setAttribute("tabindex", "-1")');
    expect(src).toContain('target.focus({ preventScroll: true })');
  });

  it("route items still navigate with the router", () => {
    expect(src).toContain("router.push(item.href)");
  });

  it("the anchor is typed as an anchor event (no implicit any)", () => {
    expect(src).toContain("React.MouseEvent<HTMLAnchorElement>");
  });
});

/* ─── 2. the configs the anchors are built from ──────────────────────── */

describe("mega-menu configs — every item carries a usable href", () => {
  const src = readFileSync(PAGE_SRC, "utf8");

  it("EXPLORE_ITEMS hrefs point at sections or real routes", () => {
    const block = extractSrc("const EXPLORE_ITEMS:", "const PLATFORM_GROUPS:");
    const hrefs = [...block.matchAll(/href: "([^"]+)"/g)].map((m) => m[1]);
    expect(hrefs.length).toBeGreaterThanOrEqual(5);
    for (const href of hrefs) {
      expect(href.startsWith("#") || href.startsWith("/")).toBe(true);
    }
    expect(hrefs).toContain("#effects");
    expect(hrefs).toContain("/effects");
  });

  it("all Platform items anchor to #platform (incl. Playground)", () => {
    const block = extractSrc("const PLATFORM_GROUPS:", "MEGA_MENU_SELECT_LATCH_MS");
    const hrefs = [...block.matchAll(/href: "([^"]+)"/g)].map((m) => m[1]);
    expect(hrefs.length).toBeGreaterThanOrEqual(18);
    for (const href of hrefs) {
      expect(href).toBe("#platform");
    }
    // The QA path: Home → Platform ▾ → Playground must land on #platform.
    expect(block).toContain('label: "Playground"');
  });
});
