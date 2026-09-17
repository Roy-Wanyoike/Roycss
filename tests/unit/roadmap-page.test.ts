import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import * as roadmapPage from "@/app/roadmap/page";
import {
  ROADMAP_ITEMS,
  LAUNCH_MILESTONES,
  inProgressItems,
  plannedItems,
  shippedItems,
  type RoadmapStatus,
} from "@/lib/roadmap-data";

/**
 * /roadmap page contract + roadmap-data integrity (issue #130, PF-045).
 *
 * The page is a public promise about project state, so it is held to the
 * same standard as the legal pages:
 *   1. statically prerendered (dynamic = "force-static") with descriptive
 *      metadata and a default export, and
 *   2. fed by a data cut whose every entry is well-formed — valid status
 *      enum, non-empty title/description, unique ids — and whose honest
 *      shape (a real body of shipped + planned work, owner actions kept
 *      OUT of the feature list) matches docs/PENDING-FEATURES.md.
 *
 * The footer wiring is asserted at the source level (roycss-page pulls a
 * heavy client tree), mirroring tests/unit/legal-pages.test.ts.
 */

const VALID_STATUSES: readonly RoadmapStatus[] = [
  "shipped",
  "in-progress",
  "planned",
];

describe("roadmap page: /roadmap", () => {
  it("is statically prerendered (force-static)", () => {
    expect(roadmapPage.dynamic).toBe("force-static");
  });

  it("exports descriptive metadata", () => {
    const metadata = roadmapPage.metadata;
    expect(metadata?.title).toBeTruthy();
    expect(metadata?.title).toContain("RoyCSS");
    expect(metadata?.title).toContain("Roadmap");
    expect(metadata?.description).toBeTruthy();
    expect(metadata!.description!.length).toBeGreaterThan(40);
    expect(metadata!.description).toContain("PENDING-FEATURES");
  });

  it("renders a default page component", () => {
    expect(typeof roadmapPage.default).toBe("function");
  });
});

describe("roadmap data: integrity of the PENDING-FEATURES cut", () => {
  it("has a non-trivial body of items", () => {
    expect(ROADMAP_ITEMS.length).toBeGreaterThanOrEqual(40);
  });

  it("every entry has a valid status enum", () => {
    const offenders = ROADMAP_ITEMS.filter(
      (item) => !VALID_STATUSES.includes(item.status),
    ).map((item) => `${item.id}: ${String(item.status)}`);
    expect(offenders).toEqual([]);
  });

  it("every entry has a non-empty title and description", () => {
    const offenders = ROADMAP_ITEMS.filter(
      (item) =>
        !item.title?.trim() ||
        item.title.trim().length < 4 ||
        !item.description?.trim() ||
        item.description.trim().length < 20,
    ).map((item) => item.id);
    expect(offenders).toEqual([]);
  });

  it("ids are unique and look like backlog ids (PF-NNN)", () => {
    const ids = ROADMAP_ITEMS.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id).toMatch(/^PF-\d{3}$/);
    }
  });

  it("matches the honest cut: >= 10 shipped and >= 5 planned", () => {
    // The backlog's own recount: 11+ done at the 2026-09-12 triage, more
    // flipped done since (PF-011/016/048); several not-started items are
    // planned. The public page must show both realities.
    expect(shippedItems.length).toBeGreaterThanOrEqual(10);
    expect(plannedItems.length).toBeGreaterThanOrEqual(5);
    expect(inProgressItems.length).toBeGreaterThanOrEqual(5);
  });

  it("status filters partition the item list", () => {
    expect(
      shippedItems.length + plannedItems.length + inProgressItems.length,
    ).toBe(ROADMAP_ITEMS.length);
  });

  it("launch milestones are kept out of the feature list", () => {
    // Owner-only work (npm publish, Vercel reclaim, domain, keys) is not
    // feature work — it must live in its own section, tracked by issue.
    expect(LAUNCH_MILESTONES.length).toBeGreaterThanOrEqual(5);
    const featureIds = new Set(ROADMAP_ITEMS.map((item) => item.id));
    for (const milestone of LAUNCH_MILESTONES) {
      expect(milestone.id).toMatch(/^LM-\d{2}$/);
      expect(milestone.title?.trim()).toBeTruthy();
      expect(milestone.description?.trim().length).toBeGreaterThanOrEqual(20);
      expect(featureIds.has(milestone.id)).toBe(false);
    }
  });
});

describe("roadmap page: wired into the site", () => {
  it("footer bottom bar links /roadmap next to Privacy/Terms", () => {
    const src = readFileSync(
      resolve(__dirname, "../../src/components/roycss/roycss-page.tsx"),
      "utf8",
    );
    expect(src).toContain('href="/privacy"');
    expect(src).toContain('href="/terms"');
    expect(src).toContain('href="/roadmap"');
  });

  it("the contributor ladder is documented in CONTRIBUTING.md", () => {
    const src = readFileSync(
      resolve(__dirname, "../../docs/CONTRIBUTING.md"),
      "utf8",
    );
    expect(src).toContain("## Contributor Ladder");
    for (const rung of [
      "**Contributor**",
      "**Active contributor**",
      "**Module owner**",
      "**Maintainer**",
    ]) {
      expect(src).toContain(rung);
    }
  });
});
