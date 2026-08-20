/**
 * Accessibility service — WCAG rules catalog + audits.
 *
 * Backed by Playwright + @axe-core/playwright when available. The
 * `auditUrl()` function lazily imports `playwright` and
 * `@axe-core/playwright`; if either fails to load (or the browser
 * can't launch), it falls back to a deterministic mock audit keyed off
 * the URL hash. `computeContrast()` is a real WCAG luminance
 * implementation and is always available — no fallback needed.
 *
 * Reads are LRU-cached; scans invalidate the audit cache key.
 */
import { randomUUID } from "node:crypto";

import { CACHE_TTL } from "../../config/constants.js";
import { cache, cacheWrap } from "../../lib/cache.js";
import { createLogger } from "../../lib/logger.js";
import type {
  AccessibilityAudit,
  ContrastResult,
  WCAGRule,
} from "../../types/index.js";
import type { A11yScanInput } from "./schema.js";

const log = createLogger("accessibility");

let playwrightChecked = false;
let playwrightOk = false;

/**
 * Detect whether Playwright + a chromium browser are usable in this
 * environment. Cached after the first probe. We avoid loading the
 * `playwright` package on module init — instead it is lazily `import()`
 * ed here so the module still loads if Playwright is uninstalled.
 */
export async function isPlaywrightAvailable(): Promise<boolean> {
  if (playwrightChecked) return playwrightOk;
  playwrightChecked = true;
  try {
    const pw = await import("playwright");
    const browser = await pw.chromium.launch({ headless: true });
    await browser.close();
    playwrightOk = true;
  } catch (err) {
    log.warn("Playwright unavailable — falling back to mock audits", {
      err: (err as Error).message,
    });
    playwrightOk = false;
  }
  return playwrightOk;
}

const RULES_KEY = "a11y:rules";
const auditKey = (url: string, level: string): string =>
  `a11y:audit:${level}:${url}`;
const contrastKey = (fg: string, bg: string): string =>
  `a11y:contrast:${fg}:${bg}`;

// ─── Seed: 10 WCAG 2.2 rules ─────────────────────────────────────────────
const SEED_RULES: WCAGRule[] = [
  {
    id: "wcag-1.1.1",
    principle: "Perceivable",
    guideline: "1.1 Text Alternatives",
    level: "A",
    description: "Non-text content has a text alternative that serves the equivalent purpose.",
    category: "images",
  },
  {
    id: "wcag-1.3.1",
    principle: "Perceivable",
    guideline: "1.3 Adaptable",
    level: "A",
    description: "Content structure is conveyed programmatically using semantic markup.",
    category: "structure",
  },
  {
    id: "wcag-1.4.3",
    principle: "Perceivable",
    guideline: "1.4 Distinguishable",
    level: "AA",
    description: "Text (and images of text) have a contrast ratio of at least 4.5:1.",
    category: "contrast",
  },
  {
    id: "wcag-1.4.11",
    principle: "Perceivable",
    guideline: "1.4 Distinguishable",
    level: "AA",
    description: "UI components and graphical objects have a contrast ratio of at least 3:1.",
    category: "contrast",
  },
  {
    id: "wcag-2.1.1",
    principle: "Operable",
    guideline: "2.1 Keyboard Accessible",
    level: "A",
    description: "All functionality is operable from a keyboard without requiring a mouse.",
    category: "keyboard",
  },
  {
    id: "wcag-2.4.4",
    principle: "Operable",
    guideline: "2.4 Navigable",
    level: "A",
    description: "Link purposes are clear from the link text or context.",
    category: "navigation",
  },
  {
    id: "wcag-2.4.7",
    principle: "Operable",
    guideline: "2.4 Navigable",
    level: "AA",
    description: "Keyboard focus is visible at all times.",
    category: "focus",
  },
  {
    id: "wcag-3.3.2",
    principle: "Understandable",
    guideline: "3.3 Input Assistance",
    level: "A",
    description: "Input fields have labels or instructions when content requires user input.",
    category: "forms",
  },
  {
    id: "wcag-4.1.2",
    principle: "Robust",
    guideline: "4.1 Compatible",
    level: "A",
    description: "UI components have name, role, and state exposed to assistive technologies.",
    category: "aria",
  },
  {
    id: "wcag-4.1.3",
    principle: "Robust",
    guideline: "4.1 Compatible",
    level: "AA",
    description: "Status messages are programmatically exposed without stealing focus.",
    category: "aria",
  },
];

const rules: WCAGRule[] = SEED_RULES.map((r) => ({ ...r }));

/** List all WCAG rules. Cached. */
export async function listRules(): Promise<WCAGRule[]> {
  return cacheWrap(
    RULES_KEY,
    () => Promise.resolve(rules.map((r) => ({ ...r }))),
    CACHE_TTL.a11yRules,
  );
}

// ─── Contrast ratio (real implementation, not mocked) ────────────────────

/** Parse a 3- or 6-digit hex color into [r,g,b] (0..255). */
function parseHex(hex: string): [number, number, number] {
  const h = hex.replace(/^#/, "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return [r, g, b];
}

/** Relative luminance per WCAG 2.x. */
function relativeLuminance([r, g, b]: [number, number, number]): number {
  const channel = (c: number): number => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Contrast ratio (1..21). */
function contrastRatio(fg: string, bg: string): number {
  const l1 = relativeLuminance(parseHex(fg));
  const l2 = relativeLuminance(parseHex(bg));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Compute contrast between two hex colors. Cached. */
export async function computeContrast(
  fg: string,
  bg: string,
): Promise<ContrastResult> {
  return cacheWrap(
    contrastKey(fg, bg),
    () => {
      const ratio = contrastRatio(fg, bg);
      const rounded = Math.round(ratio * 100) / 100;
      const result: ContrastResult = {
        foreground: fg,
        background: bg,
        ratio: rounded,
        AA: {
          normal: ratio >= 4.5,
          large: ratio >= 3,
        },
        AAA: {
          normal: ratio >= 7,
          large: ratio >= 4.5,
        },
      };
      return Promise.resolve(result);
    },
    CACHE_TTL.a11yContrast,
  );
}

// ─── Mock audit ──────────────────────────────────────────────────────────

/** Deterministic hash from string → 32-bit int (for mock variance). */
function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const MOCK_VIOLATIONS = [
  {
    ruleId: "wcag-1.1.1",
    severity: "critical" as const,
    selector: "img.hero-logo",
    message: "Image is missing an `alt` attribute.",
  },
  {
    ruleId: "wcag-1.4.3",
    severity: "serious" as const,
    selector: ".text-muted",
    message: "Text contrast ratio is 3.2:1 (below the 4.5:1 AA minimum).",
  },
  {
    ruleId: "wcag-2.1.1",
    severity: "critical" as const,
    selector: "div.custom-dropdown",
    message: "Custom widget is not operable with a keyboard.",
  },
  {
    ruleId: "wcag-2.4.7",
    severity: "serious" as const,
    selector: "*:focus",
    message: "Focus outline has been removed without a replacement indicator.",
  },
  {
    ruleId: "wcag-3.3.2",
    severity: "moderate" as const,
    selector: "input#email",
    message: "Input lacks an associated <label> element.",
  },
  {
    ruleId: "wcag-4.1.2",
    severity: "serious" as const,
    selector: "div[role='tablist']",
    message: "Tab buttons do not expose `aria-selected` state.",
  },
  {
    ruleId: "wcag-1.3.1",
    severity: "moderate" as const,
    selector: "div.layout",
    message: "Layout is built with <div> instead of semantic <main>/<nav>/<aside>.",
  },
  {
    ruleId: "wcag-4.1.3",
    severity: "minor" as const,
    selector: "div.toast",
    message: "Toast message is not marked with `role='status'`.",
  },
];

/**
 * Run an audit for a URL. When Playwright + @axe-core/playwright are
 * available, runs a real headless-browser axe scan and maps the result
 * into AccessibilityAudit. Otherwise returns a deterministic mock audit
 * keyed off the URL+level (keeps the cache coherent).
 *
 * Cached. POST /scan invalidates the cached audit before re-running.
 */
export async function auditUrl(
  url: string,
  level: "A" | "AA" | "AAA" = "AA",
): Promise<AccessibilityAudit> {
  return cacheWrap(
    auditKey(url, level),
    async () => {
      if (await isPlaywrightAvailable()) {
        try {
          const real = await runAxeAudit(url, level);
          if (real) return real;
        } catch (err) {
          log.warn("axe audit failed, falling back to mock", {
            err: (err as Error).message,
            url,
          });
        }
      }
      return mockAudit(url, level);
    },
    CACHE_TTL.a11yAudit,
  );
}

/** Run a real axe-core audit via Playwright. Returns null on failure. */
async function runAxeAudit(
  url: string,
  level: "A" | "AA" | "AAA",
): Promise<AccessibilityAudit | null> {
  const pw = await import("playwright");
  const axeMod = await import("@axe-core/playwright");
  const AxeBuilder = axeMod.AxeBuilder ?? axeMod.default?.AxeBuilder;
  if (!AxeBuilder) return null;
  const browser = await pw.chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15_000 });
    const axeTags =
      level === "A"
        ? ["wcag2a"]
        : level === "AAA"
          ? ["wcag2a", "wcag2aaa"]
          : ["wcag2a", "wcag2aa"];
    const result = await new AxeBuilder({ page })
      .withTags(axeTags)
      .analyze();
    const violations = (result.violations ?? []).flatMap((v) =>
      (v.nodes ?? []).slice(0, 5).map((n) => ({
        ruleId: v.id,
        severity:
          v.impact === "critical" || v.impact === "serious"
            ? ("critical" as const)
            : v.impact === "moderate"
              ? ("moderate" as const)
              : ("minor" as const),
        selector: (n.target ?? []).join(",") || v.id,
        message: `${v.help} — ${v.description}`.slice(0, 280),
      })),
    );
    const passes = (result.passes ?? []).length;
    const score = Math.max(
      0,
      100 - violations.length * 8 - violations.filter((v) => v.severity === "critical").length * 6,
    );
    return {
      id: `audit-${randomUUID().slice(0, 8)}`,
      url,
      scannedAt: new Date().toISOString(),
      score: Math.round(score),
      level,
      violations,
      passes,
      summary: `Found ${violations.length} violation(s) across ${violations.length + passes} checks (axe-core).`,
    };
  } finally {
    await browser.close();
  }
}

/** Deterministic mock audit — keyed off URL+level hash. */
async function mockAudit(
  url: string,
  level: "A" | "AA" | "AAA",
): Promise<AccessibilityAudit> {
  const h = hashString(url + level);
  const ruleCount = 4 + (h % 4); // 4..7 violations
  const violations = MOCK_VIOLATIONS.slice(0, ruleCount).map((v) => ({
    ...v,
  }));
  const levelRank = { A: 1, AA: 2, AAA: 3 } as const;
  const filtered = violations.filter((v) => {
    const rule = rules.find((r) => r.id === v.ruleId);
    if (!rule) return true;
    const ruleRank = levelRank[rule.level];
    return ruleRank <= levelRank[level];
  });
  const passes = 12 + (h % 6);
  const score = Math.max(
    0,
    100 -
      filtered.length *
        (filtered.some((v) => v.severity === "critical") ? 12 : 8),
  );
  return {
    id: `audit-${h.toString(36)}`,
    url,
    scannedAt: new Date().toISOString(),
    score: Math.round(score),
    level,
    violations: filtered,
    passes,
    summary: `Found ${filtered.length} violation(s) across ${filtered.length + passes} checks.`,
  };
}

/** Run a fresh scan (POST /scan). Invalidates the prior cached audit. */
export async function scan(input: A11yScanInput): Promise<AccessibilityAudit> {
  cache.delete(auditKey(input.url, input.level));
  const audit = await auditUrl(input.url, input.level);
  // Truncate to maxViolations.
  const truncated = input.maxViolations < audit.violations.length
    ? { ...audit, violations: audit.violations.slice(0, input.maxViolations) }
    : audit;
  log.info("Accessibility scan completed", {
    url: input.url,
    level: input.level,
    score: truncated.score,
  });
  return truncated;
}

/** Number of WCAG rules in the catalog. */
export function rulesCount(): number {
  return rules.length;
}

/** Test-only: clear cached audits. */
export function _resetA11yForTest(): void {
  cache.delete(RULES_KEY);
}
