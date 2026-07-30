/**
 * RoyCSS Inspector — content-script unit test.
 *
 * Uses bun:test. The detectRoyCssClasses function is pure — it takes a
 * ParentNode and returns matches. To avoid pulling in a JSDOM dependency,
 * we hand-roll a tiny stub that implements just the surface area the
 * detector needs:
 *
 *   - querySelectorAll(selector) → returns an array of stub elements
 *   - element.getAttribute("class") → returns the class string
 *
 * This keeps the test fast (<10ms) and dependency-free.
 */

import { describe, it, expect } from "bun:test";
import { detectRoyCssClasses } from "../src/content";

/** Minimal element stub. */
class FakeElement {
  constructor(public classString: string | null) {}
  getAttribute(name: string): string | null {
    if (name === "class") return this.classString;
    return null;
  }
}

/** Minimal root stub implementing querySelectorAll. */
class FakeRoot {
  constructor(public elements: FakeElement[]) {}
  querySelectorAll(selector: string): FakeElement[] {
    if (selector !== '[class*="roycss-"]') {
      throw new Error(`Unexpected selector: ${selector}`);
    }
    // Replicate the browser's substring-match semantics: only elements
    // whose class attribute contains the substring "roycss-" are returned.
    return this.elements.filter(
      (el) => el.classString !== null && el.classString.includes("roycss-"),
    );
  }
}

describe("detectRoyCssClasses", () => {
  it("detects a single roycss-* class on one element", () => {
    const root = new FakeRoot([
      new FakeElement("roycss-pulse-glow"),
    ]);
    const matches = detectRoyCssClasses(root as unknown as ParentNode);
    expect(matches.length).toBe(1);
    expect(matches[0].effectId).toBe("pulse-glow");
    expect(matches[0].className).toBe("roycss-pulse-glow");
  });

  it("detects multiple roycss-* classes on a single element", () => {
    const root = new FakeRoot([
      new FakeElement("btn roycss-pulse-glow roycss-shake"),
    ]);
    const matches = detectRoyCssClasses(root as unknown as ParentNode);
    expect(matches.length).toBe(2);
    expect(matches.map((m) => m.effectId).sort()).toEqual(["pulse-glow", "shake"]);
  });

  it("ignores non-roycss classes", () => {
    const root = new FakeRoot([
      new FakeElement("btn primary large"),
    ]);
    // The fake root filters by substring, so this element won't even be
    // returned. But the detector itself must also not produce matches.
    const matches = detectRoyCssClasses(root as unknown as ParentNode);
    expect(matches.length).toBe(0);
  });

  it("skips elements without a class attribute", () => {
    const root = new FakeRoot([
      new FakeElement(null),
    ]);
    const matches = detectRoyCssClasses(root as unknown as ParentNode);
    expect(matches.length).toBe(0);
  });

  it("does not match class names that merely start with 'roycss-' as a substring of another word", () => {
    // The regex uses \b word boundary. "xroycss-pulse" should NOT match
    // because the leading "x" violates the word boundary.
    const root = new FakeRoot([
      new FakeElement("xroycss-pulse-glow"),
    ]);
    // The fake root filters by substring, so this element IS returned
    // (it contains "roycss-"). The detector's regex must then reject it
    // because of the word-boundary anchor.
    const matches = detectRoyCssClasses(root as unknown as ParentNode);
    expect(matches.length).toBe(0);
  });

  it("detects classes with hyphens and numbers in the effect id", () => {
    const root = new FakeRoot([
      new FakeElement("roycss-ferrum-fade-in-2"),
    ]);
    const matches = detectRoyCssClasses(root as unknown as ParentNode);
    expect(matches.length).toBe(1);
    expect(matches[0].effectId).toBe("ferrum-fade-in-2");
  });

  it("handles a mixed batch of elements (only roycss-* ones match)", () => {
    const root = new FakeRoot([
      new FakeElement("btn"),
      new FakeElement("roycss-pulse-glow"),
      new FakeElement("card highlighted"),
      new FakeElement("roycss-float roycss-shake"),
      new FakeElement(null),
    ]);
    const matches = detectRoyCssClasses(root as unknown as ParentNode);
    expect(matches.length).toBe(3);
    expect(matches.map((m) => m.effectId).sort()).toEqual(["float", "pulse-glow", "shake"]);
  });

  it("returns an empty array when querySelectorAll throws", () => {
    const brokenRoot = {
      querySelectorAll: () => {
        throw new Error("not connected");
      },
    };
    const matches = detectRoyCssClasses(brokenRoot as unknown as ParentNode);
    expect(matches).toEqual([]);
  });
});
