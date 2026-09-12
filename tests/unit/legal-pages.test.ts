/**
 * Legal & trust pages — static-page contract (Task 5-e, audit F-01/UIX F-04).
 *
 * The /privacy and /terms routes are legal documents that must:
 *   1. always be statically prerendered (dynamic = "force-static"), and
 *   2. always carry descriptive metadata (title + description).
 *
 * The wire-ins (register sheet consent line, contact-form privacy link,
 * footer bottom-bar links) are asserted at the source level — those
 * components pull heavy client trees (framer-motion, sheets, contexts)
 * that don't belong in a node-env unit test.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import * as privacyPage from "@/app/privacy/page";
import * as termsPage from "@/app/terms/page";

const appRoot = resolve(__dirname, "../../src");

function readAppSource(rel: string): string {
  return readFileSync(resolve(appRoot, rel), "utf8");
}

describe("legal pages: /privacy", () => {
  it("is statically prerendered (force-static)", () => {
    expect(privacyPage.dynamic).toBe("force-static");
  });

  it("exports descriptive metadata", () => {
    const metadata = privacyPage.metadata;
    expect(metadata?.title).toBeTruthy();
    expect(metadata?.title).toContain("RoyCSS");
    expect(metadata?.description).toBeTruthy();
    expect(metadata!.description!.length).toBeGreaterThan(40);
  });

  it("renders a default page component", () => {
    expect(typeof privacyPage.default).toBe("function");
  });
});

describe("legal pages: /terms", () => {
  it("is statically prerendered (force-static)", () => {
    expect(termsPage.dynamic).toBe("force-static");
  });

  it("exports descriptive metadata", () => {
    const metadata = termsPage.metadata;
    expect(metadata?.title).toBeTruthy();
    expect(metadata?.title).toContain("RoyCSS");
    expect(metadata?.description).toBeTruthy();
    expect(metadata!.description!.length).toBeGreaterThan(40);
  });

  it("renders a default page component", () => {
    expect(typeof termsPage.default).toBe("function");
  });
});

describe("legal pages: wired into the trust surface", () => {
  it("register sheet shows the Terms + Privacy consent line", () => {
    const src = readAppSource("components/roycss/auth/register-sheet.tsx");
    expect(src).toContain('href="/terms"');
    expect(src).toContain('href="/privacy"');
    expect(src).toMatch(/By creating an account/i);
  });

  it("contact form links the privacy policy at the consent line", () => {
    const src = readAppSource("components/roycss/contact-form.tsx");
    expect(src).toContain('href="/privacy"');
  });

  it("footer bottom bar links both legal pages", () => {
    const src = readAppSource("components/roycss/roycss-page.tsx");
    expect(src).toContain('href="/privacy"');
    expect(src).toContain('href="/terms"');
  });
});
