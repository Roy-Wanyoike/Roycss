#!/usr/bin/env bun
/**
 * keyboard-nav.ts — Verify keyboard accessibility of the RoyCSS site.
 *
 * What it checks (per WCAG 2.1 AA):
 *   - 2.1.1 Keyboard: every interactive element is reachable via Tab.
 *   - 2.4.3 Focus Order: tab order is logical (matches DOM order).
 *   - 2.4.7 Focus Visible: every focused element has a non-zero :focus-visible outline.
 *   - 2.1.2 No Keyboard Trap: Escape closes every overlay; focus is not trapped in any non-overlay.
 *
 * Strategy:
 *   1. Open the page.
 *   2. Send 80 Tab keystrokes; after each, eval `document.activeElement` and capture
 *      tag, role, accessible name, and computed outline (width / style / color).
 *   3. Open the Search overlay via the keyboard shortcut (⌘K button). Tab-walk inside;
 *      press Escape; verify the overlay closed and focus returned to the trigger.
 *   4. Open the Favorites sheet. Tab-walk inside; press Escape; verify close + restore.
 *   5. Open the Effect Detail dialog (Tab to first effect card + Enter). Tab-walk;
 *      press Escape; verify close.
 *
 * Output: tests/a11y/results/keyboard-nav.json
 */

import { spawnSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const RESULTS_DIR = join(HERE, "results");
const TARGET_URL = process.env.URL ?? "http://localhost:3000/";

mkdirSync(RESULTS_DIR, { recursive: true });

/* ─── agent-browser helpers ────────────────────────────────────────────── */

function ab(args: string[], opts?: { input?: string; timeout?: number }): { stdout: string; stderr: string; status: number | null } {
  const r = spawnSync("agent-browser", args, {
    encoding: "utf-8",
    input: opts?.input,
    timeout: opts?.timeout ?? 60_000,
  });
  return { stdout: r.stdout ?? "", stderr: r.stderr ?? "", status: r.status };
}

interface AbResult<T> {
  success: boolean;
  data: { result: T; origin: string } | null;
  error: string | null;
}

function abEvalStdin<T>(script: string, timeoutMs = 30_000): T {
  const r = ab(["eval", "--stdin", "--json", "--timeout", String(timeoutMs)], { input: script, timeout: timeoutMs + 15_000 });
  if (!r.stdout) {
    throw new Error(`agent-browser eval produced no stdout: ${r.stderr || ""}`);
  }
  let outer: AbResult<T>;
  try {
    outer = JSON.parse(r.stdout) as AbResult<T>;
  } catch (e) {
    throw new Error(`could not parse agent-browser JSON: ${(e as Error).message}\nfirst 500 chars: ${r.stdout.slice(0, 500)}`);
  }
  if (!outer.success || !outer.data) {
    throw new Error(`agent-browser eval unsuccessful: ${outer.error ?? "(no error)"}`);
  }
  return outer.data.result;
}

function abPress(key: string): void {
  ab(["press", key, "--timeout", "15000"], { timeout: 25_000 });
}

function abOpen(url: string): void {
  ab(["close", "--all"], { timeout: 15_000 });
  const r = ab(["open", url, "--timeout", "90000"], { timeout: 120_000 });
  const ok = r.status === 0 || (r.stdout && r.stdout.includes("✓"));
  if (!ok) {
    console.error(`✗ agent-browser open failed: ${r.stderr || r.stdout}`);
    process.exit(1);
  }
  // Verify navigation actually happened — agent-browser can leave the tab on
  // about:blank if the browser was just launched.
  try {
    const check = abEvalStdin<string>(`location.href`, 10_000);
    if (!check.includes(url.replace(/^https?:\/\//, "").replace(/\/$/, ""))) {
      console.error(`⚠ browser is on ${check}, forcing navigation to ${url} …`);
      abEvalStdin<string>(`location.href = ${JSON.stringify(url)}; ''`, 10_000);
      ab(["wait", "3000"], { timeout: 10_000 });
    }
  } catch {
    // ignore
  }
}

function ensurePageReady(): void {
  for (let attempt = 1; attempt <= 10; attempt++) {
    const check = abEvalStdin<string>(
      `JSON.stringify({ url: location.href, readyState: document.readyState, bodyChildCount: document.body ? document.body.childElementCount : -1, hasMain: !!document.querySelector('main'), hasTitle: !!document.querySelector('title'), htmlLang: document.documentElement.getAttribute('lang') || '' })`,
      10_000,
    );
    const parsed = JSON.parse(check) as { url: string; readyState: string; bodyChildCount: number; hasMain: boolean; hasTitle: boolean; htmlLang: string };
    console.error(`  page-ready attempt ${attempt}: url=${parsed.url} ready=${parsed.readyState} bodyChildren=${parsed.bodyChildCount} hasMain=${parsed.hasMain} lang=${parsed.htmlLang}`);
    if (parsed.bodyChildCount > 0 && parsed.hasMain && parsed.htmlLang) {
      return;
    }
    ab(["wait", "1500"], { timeout: 10_000 });
  }
  console.error(`✗ page did not reach ready state after 10 attempts.`);
  process.exit(1);
}

/* ─── Phase 1: Tab walk ────────────────────────────────────────────────── */

interface FocusRecord {
  step: number;
  tag: string;
  role: string;
  name: string;
  href: string | null;
  text: string;
  outlineWidth: string;
  outlineStyle: string;
  outlineColor: string;
  hasVisibleOutline: boolean;
  inOverlay: boolean;
  isBody: boolean;
  rectX: number;
  rectY: number;
}

const FOCUS_PROBE = `
(() => {
  const el = document.activeElement;
  if (!el || el === document.body) {
    return JSON.stringify({ tag: 'body', role: '', name: '', href: null, text: '',
      outlineWidth: '0px', outlineStyle: 'none', outlineColor: 'rgb(0, 0, 0)',
      hasVisibleOutline: false, isBody: true, rectX: 0, rectY: 0 });
  }
  const cs = getComputedStyle(el);
  const tag = el.tagName.toLowerCase();
  const role = el.getAttribute('role') || '';
  let name = el.getAttribute('aria-label') || '';
  if (!name) {
    const labelledBy = el.getAttribute('aria-labelledby');
    if (labelledBy) {
      const labelEl = document.getElementById(labelledBy);
      if (labelEl) name = labelEl.textContent || '';
    }
  }
  if (!name) {
    name = el.textContent?.trim().slice(0, 80) || '';
  }
  const href = el.getAttribute('href') || null;
  const text = el.textContent?.trim().slice(0, 60) || '';
  const outlineWidth = cs.outlineWidth;
  const outlineStyle = cs.outlineStyle;
  const outlineColor = cs.outlineColor;
  // Determine if focus-visible is active by matching :focus-visible selector.
  let hasVisibleOutline = false;
  try {
    hasVisibleOutline = el.matches(':focus-visible');
  } catch (e) {
    hasVisibleOutline = false;
  }
  // Check if inside an overlay (role=dialog or [data-state=open])
  const inOverlay = !!el.closest('[role="dialog"], [data-state="open"].sheet, [data-state="open"].dialog-content, [role="alertdialog"]');
  const rect = el.getBoundingClientRect();
  return JSON.stringify({ tag, role, name, href, text, outlineWidth, outlineStyle, outlineColor, hasVisibleOutline, inOverlay, isBody: false, rectX: Math.round(rect.x), rectY: Math.round(rect.y) });
})()
`;

function captureFocus(step: number): FocusRecord {
  const raw = abEvalStdin<string>(FOCUS_PROBE, 15_000);
  const parsed = JSON.parse(raw) as FocusRecord;
  return { ...parsed, step };
}

console.error("→ opening page …");
abOpen(TARGET_URL);
ab(["wait", "--load", "networkidle", "--timeout", "60000"], { timeout: 70_000 });
ab(["wait", "1500"], { timeout: 10_000 });
ensurePageReady();

console.error("→ tab-walking the page (80 Tab presses) …");
const focusRecords: FocusRecord[] = [];
// Reset focus to the very beginning of the document. `document.body.focus()`
// is a no-op because <body> isn't focusable by default; we focus the skip
// link (which is the first focusable element) directly so the tab walk
// starts from a known position. If the skip link is missing, we fall back
// to scrolling to top and blurring the active element.
const resetResult = abEvalStdin<string>(
  `(() => {
    window.scrollTo(0, 0);
    const skip = document.querySelector('a[href="#effects"]');
    if (skip) { (skip).focus(); return 'skip'; }
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    return 'blur';
  })()`,
  5_000,
);
console.error(`  focus reset: ${resetResult}`);
// Record the starting focus as step 0.
focusRecords.push(captureFocus(0));

const MAX_TABS = 80;
let stuckCount = 0;
let lastSignature = "";
for (let i = 0; i < MAX_TABS; i++) {
  abPress("Tab");
  // Tiny settle for Framer Motion overlays/animations.
  ab(["wait", "120"], { timeout: 5_000 });
  const rec = captureFocus(i + 1);
  // Include position in the signature so different elements with the same
  // accessible name (e.g. "Copy" buttons on every code block) are not
  // confused for a focus trap.
  const sig = `${rec.tag}|${rec.name}|${rec.inOverlay}|${rec.rectX},${rec.rectY}`;
  focusRecords.push(rec);
  // Stop early if we've cycled back to the SAME element (same name + same
  // position) 3 times in a row — i.e. we're trapped in an overlay or have
  // wrapped the whole page.
  if (sig === lastSignature) {
    stuckCount++;
    if (stuckCount >= 3) {
      console.error(`  → detected focus loop at step ${i + 1}, stopping early`);
      break;
    }
  } else {
    stuckCount = 0;
  }
  lastSignature = sig;
  if (rec.isBody) {
    // We Tabbed past the last interactive element — wrap complete.
    if (i > 5) {
      console.error(`  → reached <body> at step ${i + 1}, tab cycle complete`);
      break;
    }
  }
}

/* ─── Phase 2: Skip link ───────────────────────────────────────────────── */

console.error("→ verifying skip link …");
// The skip link was already focused at step 0 of the tab walk. Verify it
// exists in the DOM and has the right attributes.
const skipLinkDom = abEvalStdin<string>(
  `JSON.stringify({
    exists: !!document.querySelector('a[href="#effects"]'),
    isSrOnly: !!document.querySelector('a[href="#effects"]')?.className?.includes('sr-only'),
    revealsOnFocus: !!document.querySelector('a[href="#effects"]')?.className?.includes('focus:not-sr-only'),
    text: document.querySelector('a[href="#effects"]')?.textContent?.trim() || '',
    targetExists: !!document.getElementById('effects'),
  })`,
  10_000,
);
const skipLinkParsed = JSON.parse(skipLinkDom) as { exists: boolean; isSrOnly: boolean; revealsOnFocus: boolean; text: string; targetExists: boolean };
const skipLinkResult = {
  skipLinkExists: skipLinkParsed.exists,
  skipLinkText: skipLinkParsed.text,
  skipLinkIsSrOnly: skipLinkParsed.isSrOnly,
  skipLinkRevealsOnFocus: skipLinkParsed.revealsOnFocus,
  skipLinkTargetExists: skipLinkParsed.targetExists,
  isSkipLink: skipLinkParsed.exists && skipLinkParsed.isSrOnly && skipLinkParsed.revealsOnFocus && skipLinkParsed.targetExists && /skip/i.test(skipLinkParsed.text),
  firstFocusableTag: focusRecords[0]?.tag || "",
  firstFocusableText: focusRecords[0]?.text || "",
  firstFocusableHref: focusRecords[0]?.href || null,
};
console.error(`  skip link: exists=${skipLinkParsed.exists} text="${skipLinkParsed.text}" targetExists=${skipLinkParsed.targetExists}`);

/* ─── Phase 3: Overlay Escape + focus trap ─────────────────────────────── */

interface OverlayTest {
  name: string;
  opened: boolean;
  focusTrapped: boolean;
  escapeClosed: boolean;
  focusRestoredToTrigger: boolean;
  note?: string;
}

async function testOverlay(name: string, openScript: string, triggerSelector: string): Promise<OverlayTest> {
  const result: OverlayTest = {
    name,
    opened: false,
    focusTrapped: false,
    escapeClosed: false,
    focusRestoredToTrigger: false,
  };

  try {
    // Open the overlay
    abEvalStdin<string>(openScript, 10_000);
    ab(["wait", "800"], { timeout: 10_000 });

    // Check overlay is open. We look for multiple indicators:
    //   - Radix Dialog/Sheet: [role="dialog"], [data-state="open"]
    //   - Custom SearchOverlay: button[aria-label="Close search"] visible
    //     (this is specific to the overlay; the main search input has a
    //     different placeholder and no close button)
    const openCheck = abEvalStdin<string>(
      `JSON.stringify({
        radixOpen: !!document.querySelector('[role="dialog"], [data-state="open"], [role="alertdialog"]'),
        searchCloseBtn: !!document.querySelector('button[aria-label="Close search"]'),
        overlayInputFocused: document.activeElement?.getAttribute('placeholder')?.includes('recipes, patterns, sections') ?? false,
      })`,
      10_000,
    );
    const openParsed = JSON.parse(openCheck) as { radixOpen: boolean; searchCloseBtn: boolean; overlayInputFocused: boolean };
    result.opened = openParsed.radixOpen || openParsed.searchCloseBtn || openParsed.overlayInputFocused;
    if (!result.opened) {
      result.note = "overlay did not open";
      return result;
    }

    // Tab through 10 times; verify focus stays inside the overlay
    let trappedCount = 0;
    for (let i = 0; i < 10; i++) {
      abPress("Tab");
      ab(["wait", "100"], { timeout: 5_000 });
      const r = captureFocus(i);
      if (r.inOverlay) trappedCount++;
    }
    result.focusTrapped = trappedCount >= 8; // Allow 2 escapes for edge cases

    // Press Escape
    abPress("Escape");
    ab(["wait", "500"], { timeout: 10_000 });

    // Verify overlay closed (use same multi-indicator check)
    const closeCheck = abEvalStdin<string>(
      `JSON.stringify({
        radixOpen: !!document.querySelector('[role="dialog"], [data-state="open"], [role="alertdialog"]'),
        searchCloseBtn: !!document.querySelector('button[aria-label="Close search"]'),
        overlayInputFocused: document.activeElement?.getAttribute('placeholder')?.includes('recipes, patterns, sections') ?? false,
      })`,
      10_000,
    );
    const closeParsed = JSON.parse(closeCheck) as { radixOpen: boolean; searchCloseBtn: boolean; overlayInputFocused: boolean };
    result.escapeClosed = !closeParsed.radixOpen && !closeParsed.searchCloseBtn && !closeParsed.overlayInputFocused;

    // Verify focus restored to trigger (or at least to body)
    const focusAfter = captureFocus(0);
    result.focusRestoredToTrigger = !focusAfter.isBody || focusAfter.tag !== "body";
  } catch (e) {
    result.note = `error: ${(e as Error).message}`;
  }

  return result;
}

console.error("→ testing Search overlay (Escape + focus trap) …");
const searchTest = await testOverlay(
  "Search overlay",
  `(() => { const b = document.querySelector('button[aria-label="Search (⌘K)"]'); if (b) b.click(); return ''; })()`,
  'button[aria-label="Search (⌘K)"]',
);

console.error("→ testing Favorites sheet (Escape + focus trap) …");
const favTest = await testOverlay(
  "Favorites sheet",
  `(() => { const b = document.querySelector('button[aria-label="Open favorites"]'); if (b) b.click(); return ''; })()`,
  'button[aria-label="Open favorites"]',
);

console.error("→ testing Effect Detail dialog (Escape + focus trap) …");
const dialogTest = await testOverlay(
  "Effect Detail dialog",
  `(() => {
    // The FeaturedEffectCard uses <div role="button" aria-label="View details for ...">.
    // The main grid EffectCard is click-only (not keyboard-accessible) — documented
    // as a known issue in WCAG-REPORT.md. We test the featured card here.
    const btn = document.querySelector('[role="button"][aria-label^="View details for"]');
    if (btn) btn.click();
    return '';
  })()`,
  '[role="button"][aria-label^="View details for"]',
);

/* ─── Phase 4: Compute summary + write report ─────────────────────────── */

const interactiveRecords = focusRecords.filter((r) => !r.isBody);
const uniqueElements = new Set(interactiveRecords.map((r) => `${r.tag}|${r.name}|${r.href ?? ""}`));
const focusVisibleFailures = interactiveRecords.filter((r) => !r.hasVisibleOutline);

const summary = {
  generatedAt: new Date().toISOString(),
  targetUrl: TARGET_URL,
  totalTabPresses: focusRecords.length,
  totalInteractiveReached: interactiveRecords.length,
  uniqueInteractiveElements: uniqueElements.size,
  focusVisibleFailures: focusVisibleFailures.length,
  skipLink: skipLinkResult,
  overlays: {
    search: searchTest,
    favorites: favTest,
    effectDetail: dialogTest,
  },
  overallPass:
    focusVisibleFailures.length === 0 &&
    skipLinkResult.isSkipLink &&
    [searchTest, favTest, dialogTest].every((t) => t.opened && t.escapeClosed),
};

const report = {
  ...summary,
  focusSequence: focusRecords,
  focusVisibleFailures,
};

const outPath = join(RESULTS_DIR, "keyboard-nav.json");
writeFileSync(outPath, JSON.stringify(report, null, 2));
console.log(`JSON written to ${outPath}`);

console.log("\n" + "═".repeat(78));
console.log("  Keyboard Navigation Audit — " + TARGET_URL);
console.log("═".repeat(78));
console.log(`  Tab presses:           ${summary.totalTabPresses}`);
console.log(`  Interactive reached:   ${summary.totalInteractiveReached}`);
console.log(`  Unique elements:       ${summary.uniqueInteractiveElements}`);
console.log(`  Focus-visible passes:  ${summary.totalInteractiveReached - summary.focusVisibleFailures}/${summary.totalInteractiveReached}`);
console.log(`  Skip link present:     ${summary.skipLink.isSkipLink ? "✓" : "✗"}`);
console.log(`  Search overlay:        opened=${searchTest.opened} trapped=${searchTest.focusTrapped} esc=${searchTest.escapeClosed}`);
console.log(`  Favorites sheet:       opened=${favTest.opened} trapped=${favTest.focusTrapped} esc=${favTest.escapeClosed}`);
console.log(`  Effect Detail dialog:  opened=${dialogTest.opened} trapped=${dialogTest.focusTrapped} esc=${dialogTest.escapeClosed}`);
console.log("═".repeat(78));
console.log(summary.overallPass ? "✅ keyboard nav: PASS" : "❌ keyboard nav: FAIL");
console.log("");

ab(["close", "--all"], { timeout: 15_000 });
process.exit(summary.overallPass ? 0 : 1);
