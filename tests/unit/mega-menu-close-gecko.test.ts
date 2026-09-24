import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..", "..");
const PAGE_SRC = join(ROOT, "src/components/roycss/roycss-page.tsx");

/**
 * Issue #258 symptom 1 — the Explore ▾ Radix mega-menu did not close after
 * selecting an item on Firefox (Gecko) while Chromium closed immediately.
 *
 * Mechanism (proven live with an aria-expanded trace on Firefox 155):
 *   Gecko re-synthesizes mouseenter/mouseleave boundary events whenever
 *   DOM/layout changes under a STATIONARY pointer (Blink does not). Two
 *   failure modes followed:
 *     1. Open/close OSCILLATION: Radix positions the portaled content after
 *        mount, so the content flashed over the pointer then moved below
 *        the trigger; each synthetic boundary event re-armed the opposite
 *        100ms hover timer and the menu cycled open↔closed with no input
 *        (trace: expanded true→false→true… every ~300–600ms).
 *     2. Close-on-select never observable: after a selection closed the
 *        menu, the unmount re-synthesized a wrapper mouseenter and openMenu
 *        re-opened it.
 *
 * Fix under test (NavMegaMenu in roycss-page.tsx):
 *   - the hover open/close timers RE-VERIFY at fire time that the last
 *     known pointer position (lastPointerRef, updated by pointermove/
 *     pointerdown on wrapper + content) is still inside the hover zone
 *     (trigger wrapper ∪ open content): spurious closes are swallowed,
 *     spurious opens ignored — real movement always updates coordinates
 *     first, so genuine hover intent is unchanged;
 *   - a pointerdown inside the open content latches lastSelectionAtRef
 *     (capture phase, WITHOUT closing — closing stays Radix's onSelect →
 *     onOpenChange job) and openMenu ignores re-entries within
 *     MEGA_MENU_SELECT_LATCH_MS (450ms);
 *   - pointer leaves the DOCUMENT → documentElement mouseleave force-closes
 *     (stale-inside coordinates would otherwise keep it open);
 *   - Chromium never synthesizes these events, so its behavior is unchanged.
 *
 * The vitest environment is `node` (no DOM, per vitest.config.ts) and
 * roycss-page.tsx is a heavy client surface, so these are source-level
 * pins — the same convention as tests/unit/scroll-section-gecko.test.ts.
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

/** The whole NavMegaMenu component source (up to the next top-level fn). */
function navMegaMenuSrc(): string {
  return extractSrc("function NavMegaMenu(", "\nfunction ScrollProgress(");
}

describe("mega-menu Gecko interop (#258 menu half)", () => {
  /* ─── 1. the latch constant ──────────────────────────────────────────── */

  it("defines MEGA_MENU_SELECT_LATCH_MS as 450 with the #258 rationale", () => {
    const src = readFileSync(PAGE_SRC, "utf8");
    expect(src).toContain("const MEGA_MENU_SELECT_LATCH_MS = 450;");
    const constBlock = extractSrc(
      "How long (ms) after a pointerdown",
      "const MEGA_MENU_SELECT_LATCH_MS = 450;",
    );
    expect(constBlock).toContain("#258");
  });

  /* ─── 2. pointer tracking + zone state ─────────────────────────────── */

  it("declares the zone/pointer/latch refs inside NavMegaMenu", () => {
    const src = navMegaMenuSrc();
    expect(src).toContain("const zoneRef = useRef<HTMLDivElement | null>(null);");
    expect(src).toContain("const contentRef = useRef<HTMLDivElement | null>(null);");
    expect(src).toContain("const lastPointerRef = useRef({ x: -1, y: -1 });");
    expect(src).toContain("const lastSelectionAtRef = useRef(0);");
  });

  it("trackPointer records truthful coordinates", () => {
    const body = extractSrc(
      "const trackPointer = useCallback((event: React.PointerEvent) => {",
      "}, []);",
    );
    expect(body).toContain("event.clientX");
    expect(body).toContain("event.clientY");
  });

  it("pointerInZone checks wrapper ∪ content and fails OPEN without pointer data", () => {
    const body = extractSrc(
      "const pointerInZone = useCallback(() => {",
      "}, []);",
    );
    // fail-open: no pointer data (keyboard-only, touch-before-move) preserves
    // the pre-existing behavior instead of bricking the menu
    expect(body).toContain("if (x < 0 && y < 0) return true;");
    expect(body).toContain("zoneRef.current?.getBoundingClientRect()");
    expect(body).toContain("contentRef.current?.getBoundingClientRect()");
    // degenerate (unmounted) content boxes must not match
    expect(body).toContain("content.width > 0");
  });

  it("latchSelection records coordinates + timestamp and does NOT close the menu", () => {
    const body = extractSrc(
      "const latchSelection = useCallback((event: React.PointerEvent) => {",
      "}, []);",
    );
    expect(body).toContain("lastSelectionAtRef.current = performance.now();");
    expect(body).toContain("lastPointerRef.current");
    // Closing is Radix's onSelect → onOpenChange job; the latch must not
    // race it (closing on pointerdown would unmount the item before its
    // click fires and lose the selection entirely).
    expect(body).not.toContain("setOpen(false)");
    expect(body).not.toContain("clearTimeout");
  });

  /* ─── 3. the fire-time zone re-verification (loop killer) ──────────── */

  it("openMenu guard: latch window first, then re-verify the zone at fire time", () => {
    const body = extractSrc(
      "const openMenu = useCallback(() => {",
      "const closeMenu = useCallback(() => {",
    );
    expect(body).toContain(
      "performance.now() - lastSelectionAtRef.current <\n      MEGA_MENU_SELECT_LATCH_MS",
    );
    // zone re-verification INSIDE the timer callback (fire time, not arm time)
    const timerBody = body.slice(body.indexOf("setTimeout(() => {"));
    expect(timerBody).toContain("if (!pointerInZone()) return;");
    expect(timerBody).toContain("setOpen(true)");
    // zone check must run before the open
    expect(timerBody.indexOf("pointerInZone()")).toBeLessThan(
      timerBody.indexOf("setOpen(true)"),
    );
    expect(body).toContain("}, 100);");
  });

  it("closeMenu re-verifies the zone at fire time and swallows spurious synthetic leaves", () => {
    const body = extractSrc(
      "const closeMenu = useCallback(() => {",
      "}, [pointerInZone]);",
    );
    const timerBody = body.slice(body.indexOf("setTimeout(() => {"));
    expect(timerBody).toContain("if (pointerInZone()) return;");
    expect(timerBody).toContain("setOpen(false)");
    expect(timerBody.indexOf("pointerInZone()")).toBeLessThan(
      timerBody.indexOf("setOpen(false)"),
    );
    // the close path must not consult the selection latch (only open does)
    expect(body).not.toContain("lastSelectionAtRef");
  });

  it("both timers keep the 100ms hover-intent delay", () => {
    const openMenuBody = extractSrc(
      "const openMenu = useCallback(() => {",
      "const closeMenu = useCallback(() => {",
    );
    expect(openMenuBody).toContain("}, 100);");
    const closeMenuBody = extractSrc(
      "const closeMenu = useCallback(() => {",
      "}, [pointerInZone]);",
    );
    expect(closeMenuBody).toContain("}, 100);");
  });

  it("document-level mouseleave force-closes (stale-inside coordinates case)", () => {
    const src = navMegaMenuSrc();
    expect(src).toContain(
      'document.documentElement.addEventListener("mouseleave", forceClose);',
    );
    const effect = extractSrc(
      'document.documentElement.addEventListener("mouseleave", forceClose);',
      "}, []);",
    );
    expect(effect).toContain("removeEventListener");
    // forceClose must bypass the zone guard
    expect(src).toContain("const forceClose = () => {");
  });

  /* ─── 4. wiring ────────────────────────────────────────────────────── */

  it("wires ref={zoneRef} + pointer tracking on the wrapper div", () => {
    const src = navMegaMenuSrc();
    expect(src).toContain("ref={zoneRef}");
    const wrapper = extractSrc("<div\n      ref={zoneRef}", "<DropdownMenu open={open}");
    expect(wrapper).toContain("onMouseEnter={openMenu}");
    expect(wrapper).toContain("onMouseLeave={closeMenu}");
    expect(wrapper).toContain("onPointerMove={trackPointer}");
    expect(wrapper).toContain("onPointerDown={trackPointer}");
  });

  it("wires ref={contentRef} + latch + tracking on DropdownMenuContent", () => {
    const content = extractSrc("<DropdownMenuContent", "</DropdownMenuContent>");
    expect(content).toContain("ref={contentRef}");
    expect(content).toContain("onPointerDownCapture={latchSelection}");
    expect(content).toContain("onMouseEnter={openMenu}");
    expect(content).toContain("onMouseLeave={closeMenu}");
    expect(content).toContain("onPointerMove={trackPointer}");
  });

  /* ─── 5. regression guards ─────────────────────────────────────────── */

  it("keeps onCloseAutoFocus prevention (trigger-refocus yank fix)", () => {
    const content = extractSrc("<DropdownMenuContent", "</DropdownMenuContent>");
    expect(content).toContain(
      "onCloseAutoFocus={(event) => event.preventDefault()}",
    );
  });

  it("keeps the controlled Radix state shape", () => {
    const src = navMegaMenuSrc();
    expect(src).toContain("<DropdownMenu open={open} onOpenChange={setOpen}>");
    expect(src).toContain('aria-haspopup="menu"');
    expect(src).toContain("aria-expanded={open}");
  });
});
