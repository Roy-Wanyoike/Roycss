/**
 * Honest monetization CTAs (Task 5-e, audit UI/UX F-09 + F-13).
 *
 * Source-level contract:
 *   - pricing-section.tsx must not fire fake "coming soon" toasts;
 *     paid-tier CTAs open a waitlist dialog that POSTs to the existing
 *     `/api/contact` endpoint (the only email-persisting endpoint we
 *     have today) with real success/error states.
 *   - favorites-sheet.tsx must guard the irreversible clear-all behind
 *     an AlertDialog confirmation and label the icon-only trigger.
 *
 * These are source assertions because the components pull heavy client
 * trees (framer-motion, radix, sonner) that don't belong in a
 * node-env unit test; behavior is covered by the e2e suite.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const appRoot = resolve(__dirname, "../../src");

function readAppSource(rel: string): string {
  return readFileSync(resolve(appRoot, rel), "utf8");
}

describe("pricing CTAs: honest pre-launch pattern (UIX F-09)", () => {
  const src = readAppSource("components/roycss/pricing-section.tsx");

  it("no longer fires fake 'coming soon' toasts", () => {
    expect(src).not.toMatch(/coming soon/i);
    expect(src).not.toContain('from "@/hooks/use-toast"');
    expect(src).not.toContain("toast(");
  });

  it("paid-tier CTAs invite to a waitlist instead of a trial", () => {
    expect(src).toContain("Join Pro Waitlist");
    expect(src).toContain("Join Team Waitlist");
  });

  it("waitlist form persists the email via the existing contact endpoint", () => {
    expect(src).toContain('"/api/contact"');
    expect(src).toMatch(/Plan Waitlist/);
  });

  it("states plainly that paid plans are not purchasable yet", () => {
    expect(src).toMatch(/aren.t available for purchase yet/i);
  });

  it("links the legal pages next to the pricing claims", () => {
    expect(src).toContain('href="/privacy"');
    expect(src).toContain('href="/terms"');
  });
});

describe("favorites clear-all: confirm destructive action (UIX F-13)", () => {
  const src = readAppSource("components/roycss/favorites-sheet.tsx");

  it("labels the icon-only trigger for screen readers", () => {
    expect(src).toMatch(/aria-label=\{?["'`]?Clear all /);
  });

  it("confirms via AlertDialog before clearing", () => {
    expect(src).toContain("AlertDialogTrigger");
    expect(src).toMatch(/Clear all favorites\?/);
    expect(src).toMatch(/cannot be undone/i);
    expect(src).toContain("AlertDialogAction");
  });
});
