import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..", "..");
const PAGE_SRC = join(ROOT, "src/components/roycss/roycss-page.tsx");

/**
 * Issue #299 — the skip link must be the FIRST Tab stop on home.
 *
 * The QA run found the skip link at DOM idx 0 yet the first Tab landed on
 * a featured-card button. Two mechanisms plausibly explain a browser (or
 * tab-order dump) skipping an otherwise first-in-DOM anchor:
 *
 *   1. VISIBILITY HEURISTICS — the link used `sr-only` (1×1px box,
 *      clip:rect(0,0,0,0)). Tab-order tooling that filters "invisible"
 *      elements can drop a clipped zero-size box from the tab sequence
 *      even though real browsers keep it focusable.
 *   2. CONDITIONAL/PORTAL ORDERING — anything conditionally mounted or
 *      portaled before it would displace the first stop.
 *
 * Fix under test (roycss-page.tsx RoyCSSPage):
 *   - the skip link is the literal FIRST JSX child of the page root div
 *     (before CursorGlow, portals, or any other element);
 *   - it keeps a REAL box (absolute top-4 left-4, standard padding) parked
 *     INSIDE the viewport with opacity-0 + pointer-events-none (opacity
 *     never affects focusability, and the box never enters the
 *     "far offscreen" class Chromium's traversal skips) — revealing
 *     itself on :focus;
 *   - it is unconditional, unanimated, and carries stable markers
 *     (id="skip-to-effects", data-skip-link) for QA/e2e pinning; and
 *   - the FIRST Tab keydown of the session is handed to the link by the
 *     window keydown guard (once, and only before any pointer
 *     interaction) — a live Chromium probe showed traversal bypassing the
 *     DOM-first link entirely when content-visibility:auto grids exist
 *     below the fold, so the guard makes the contract engine-proof.
 *
 * The vitest environment is `node` (no DOM), so these are source-level
 * pins — the same convention as tests/unit/scroll-section-gecko.test.ts.
 */

/** The RoyCSSPage component source (from its definition to EOF marker). */
function pageSrc(): string {
  const src = readFileSync(PAGE_SRC, "utf8");
  const start = src.indexOf("export default function RoyCSSPage()");
  if (start === -1) throw new Error("RoyCSSPage not found");
  return src.slice(start);
}

/* ─── 1. DOM-order contract ──────────────────────────────────────────── */

describe("skip link — first element in the page tree (#299)", () => {
  const src = pageSrc();

  it("renders before any other JSX element in RoyCSSPage", () => {
    const skipIdx = src.indexOf('id="skip-to-effects"');
    expect(skipIdx).toBeGreaterThan(-1);
    // First interactive/focusable element after it — the cursor glow is the
    // next rendered node; nothing focusable may precede the skip link.
    const cursorGlow = src.indexOf("<CursorGlow />");
    expect(cursorGlow).toBeGreaterThan(skipIdx);
  });

  it("is the first child of the page root div (no focusable sibling before it)", () => {
    const rootDiv = src.indexOf('<div className="min-h-screen');
    const skip = src.indexOf('<a\n        ref={skipLinkRef}');
    expect(rootDiv).toBeGreaterThan(-1);
    expect(skip).toBeGreaterThan(rootDiv);
    // Slice past the root div's own opening tag before scanning.
    const openEnd = src.indexOf(">", rootDiv) + 1;
    const between = src.slice(openEnd, skip);
    // Only comments and whitespace may sit between the root div and the
    // skip link — no portals, banners, or auto-focused widgets.
    expect(between).not.toMatch(/<(?!!--)[a-zA-Z]/);
  });

  it("keeps the #effects target so native anchor semantics work", () => {
    const skipBlockStart = src.indexOf('<a\n        ref={skipLinkRef}');
    const skipBlock = src.slice(skipBlockStart, skipBlockStart + 620);
    expect(skipBlock).toContain('href="#effects"');
    expect(skipBlock).toContain("tSkip(");
  });

  it("is unconditionally rendered (not behind a conditional or dialog)", () => {
    const skip = src.indexOf('<a\n        ref={skipLinkRef}');
    // No ternary/&& immediately before the anchor within the JSX.
    const before = src.slice(skip - 120, skip);
    expect(before).not.toContain("&&");
    expect(before).not.toContain("?");
  });
});

/* ─── 2. visibility-hardening contract ───────────────────────────────── */

describe("skip link — real-box off-canvas pattern (no clip heuristics)", () => {
  const src = pageSrc();
  const skipBlockStart = src.indexOf('<a\n        ref={skipLinkRef}');
  const skipBlockEnd = src.indexOf("</a>", skipBlockStart);
  const skipBlock = src.slice(skipBlockStart, skipBlockEnd);

  it("no longer uses the sr-only 1px/clip box", () => {
    expect(skipBlock).not.toContain("sr-only");
  });

  it("parks a real box inside the viewport (opacity-parked, not offscreen)", () => {
    expect(skipBlock).toContain("absolute top-4 left-4");
    expect(skipBlock).toContain("opacity-0");
    expect(skipBlock).toContain("pointer-events-none");
    expect(skipBlock).toContain("focus:opacity-100");
    expect(skipBlock).toContain("focus:pointer-events-auto");
    // The off-viewport translate parking put the box entirely ABOVE the
    // viewport (rect.bottom < 0) — live probes showed Chromium's traversal
    // skipping that class entirely. It must stay gone.
    expect(skipBlock).not.toContain("-translate-y-24");
    // A z-index above every overlay so the focused link is never covered.
    expect(skipBlock).toContain("z-[200]");
  });

  it("carries stable markers for QA/e2e pinning", () => {
    expect(skipBlock).toContain('id="skip-to-effects"');
    expect(skipBlock).toContain('data-skip-link="true"');
  });

  it("the sr-only clip pattern is gone from the skip link entirely", () => {
    // The old pattern relied on focus:not-sr-only to reveal on focus —
    // replaced by the opacity reveal.
    expect(src).not.toContain("focus:not-sr-only");
  });
});

/* ─── 3. First-Tab guard contract (QA round 2) ───────────────────────── */

describe("skip link — first-Tab keydown guard (#299 QA round 2)", () => {
  const src = pageSrc();

  it("hands the session's first Tab to the skip link", () => {
    // The guard runs inside the existing window keydown handler, BEFORE the
    // ⌘K///? shortcuts, so a Tab can never be swallowed by them.
    const guardIdx = src.indexOf("!firstTabTakenRef.current");
    const cmdKIdx = src.indexOf("⌘K / Ctrl+K → open search");
    expect(guardIdx).toBeGreaterThan(-1);
    expect(cmdKIdx).toBeGreaterThan(guardIdx);
  });

  it("fires exactly once per session and only before pointer interaction", () => {
    expect(src).toContain("firstTabTakenRef.current = true");
    expect(src).toContain("!pointerInteractedRef.current");
    // A pointerdown establishes the user's own traversal starting point —
    // the guard must never hijack it (capture-phase, one-shot listener).
    expect(src).toContain('window.addEventListener("pointerdown", markPointer');
    expect(src).toContain("{ capture: true, once: true }");
  });

  it("only hijacks when focus is truly at the document start", () => {
    expect(src).toContain("active === document.body");
    expect(src).toContain("active === document.documentElement");
    // The handoff focuses the real anchor element.
    expect(src).toContain("skipLinkRef.current.focus()");
  });
});
