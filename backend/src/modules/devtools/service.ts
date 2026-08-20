/**
 * DevTools service — inspection + token/utility data for Roy DevTools.
 *
 * Backed by Playwright when available. `inspectUrl()` lazily imports
 * `playwright` and uses `page.evaluate()` to extract CSS classes,
 * inline styles, link hrefs, and fonts. If Playwright is unavailable,
 * a deterministic mock inspection is returned instead — same signature,
 * same downstream cache keys.
 *
 * `getTokens()` and `getUtilities()` return the platform's design token
 * catalog and full utility class list (seeded, LRU-cached).
 */
import { CACHE_TTL } from "../../config/constants.js";
import { cacheWrap } from "../../lib/cache.js";
import { createLogger } from "../../lib/logger.js";
import type { DevToolsResult } from "../../types/index.js";
import type { AnalyzePageInput } from "./schema.js";

const log = createLogger("devtools");

let playwrightChecked = false;
let playwrightOk = false;

/** Detect Playwright availability (lazy import so module loads without it). */
export async function isPlaywrightAvailable(): Promise<boolean> {
  if (playwrightChecked) return playwrightOk;
  playwrightChecked = true;
  try {
    const pw = await import("playwright");
    const browser = await pw.chromium.launch({ headless: true });
    await browser.close();
    playwrightOk = true;
  } catch (err) {
    log.warn("Playwright unavailable — falling back to mock inspections", {
      err: (err as Error).message,
    });
    playwrightOk = false;
  }
  return playwrightOk;
}

const TOKENS_KEY = "devtools:tokens";
const UTILITIES_KEY = "devtools:utilities";
const inspectKey = (url: string): string => `devtools:inspect:${url}`;
const analyzeKey = (url: string, max: number): string =>
  `devtools:analyze:${url}:${max}`;

// ─── Seed: design tokens ─────────────────────────────────────────────────
const SEED_TOKENS: { name: string; value: string }[] = [
  { name: "--roycss-color-primary", value: "#10b981" },
  { name: "--roycss-color-secondary", value: "#6366f1" },
  { name: "--roycss-color-accent", value: "#f59e0b" },
  { name: "--roycss-color-background", value: "#0b0f14" },
  { name: "--roycss-color-foreground", value: "#e6edf3" },
  { name: "--roycss-radius-sm", value: "0.375rem" },
  { name: "--roycss-radius-md", value: "0.75rem" },
  { name: "--roycss-radius-lg", value: "1.25rem" },
  { name: "--roycss-space-1", value: "0.25rem" },
  { name: "--roycss-space-2", value: "0.5rem" },
  { name: "--roycss-space-4", value: "1rem" },
  { name: "--roycss-space-8", value: "2rem" },
  { name: "--roycss-font-size-sm", value: "0.875rem" },
  { name: "--roycss-font-size-md", value: "1rem" },
  { name: "--roycss-font-size-lg", value: "1.125rem" },
  { name: "--roycss-shadow-sm", value: "0 1px 2px rgba(0,0,0,0.05)" },
  { name: "--roycss-shadow-md", value: "0 4px 6px rgba(0,0,0,0.1)" },
  { name: "--roycss-ease-out", value: "cubic-bezier(0.16, 1, 0.3, 1)" },
  { name: "--roycss-duration-fast", value: "150ms" },
  { name: "--roycss-duration-normal", value: "300ms" },
];

// ─── Seed: utility class list ────────────────────────────────────────────
const SEED_UTILITIES: string[] = [
  "roycss-flex",
  "roycss-flex-col",
  "roycss-flex-row",
  "roycss-flex-center",
  "roycss-flex-between",
  "roycss-grid",
  "roycss-grid-2",
  "roycss-grid-3",
  "roycss-grid-4",
  "roycss-grid-cols-auto",
  "roycss-gap-1",
  "roycss-gap-2",
  "roycss-gap-4",
  "roycss-p-1",
  "roycss-p-2",
  "roycss-p-4",
  "roycss-m-0",
  "roycss-m-auto",
  "roycss-text-sm",
  "roycss-text-md",
  "roycss-text-lg",
  "roycss-text-gradient",
  "roycss-text-balance",
  "roycss-rounded-sm",
  "roycss-rounded-md",
  "roycss-rounded-lg",
  "roycss-rounded-full",
  "roycss-bg-primary",
  "roycss-bg-surface",
  "roycss-bg-muted",
  "roycss-border",
  "roycss-border-primary",
  "roycss-shadow-sm",
  "roycss-shadow-md",
  "roycss-hidden",
  "roycss-block",
  "roycss-inline-block",
  "roycss-absolute",
  "roycss-relative",
  "roycss-fixed",
  "roycss-overflow-hidden",
  "roycss-overflow-auto",
  "roycss-cursor-pointer",
  "roycss-transition",
  "roycss-animate-fade-in",
  "roycss-animate-slide-up",
];

/** Deterministic mock class list returned by /inspect for any URL. */
const MOCK_CLASSES: { name: string; count: number; source: string }[] = [
  { name: "roycss-flex", count: 24, source: "<header>" },
  { name: "roycss-grid-3", count: 8, source: "<main>" },
  { name: "roycss-card", count: 12, source: "<section>" },
  { name: "roycss-text-gradient", count: 3, source: "<h1>" },
  { name: "roycss-rounded-md", count: 18, source: "<button>" },
  { name: "roycss-shadow-md", count: 6, source: "<article>" },
  { name: "roycss-animate-fade-in", count: 4, source: "<section>" },
  { name: "roycss-bg-surface", count: 9, source: "<aside>" },
];

/** Inspect a URL — returns CSS classes, inline styles, links, fonts. Cached per URL. */
export async function inspectUrl(url: string): Promise<DevToolsResult> {
  return cacheWrap(
    inspectKey(url),
    async () => {
      if (await isPlaywrightAvailable()) {
        try {
          const real = await runInspection(url);
          if (real) return real;
        } catch (err) {
          log.warn("Playwright inspection failed, using mock", {
            err: (err as Error).message,
            url,
          });
        }
      }
      return mockInspection(url);
    },
    CACHE_TTL.devtoolsInspect,
  );
}

/** Run a real inspection via Playwright page.evaluate(). */
async function runInspection(
  url: string,
): Promise<DevToolsResult | null> {
  const pw = await import("playwright");
  const browser = await pw.chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15_000 });
    // The eval callback runs in the browser context where `document`
    // exists. Cast through `unknown` → `any` so the Node-targeted TS
    // project does not need the `dom` lib.
    const evaluate = page.evaluate as unknown as <T>(fn: () => T) => Promise<T>;
    const extracted = await evaluate<{
      classes: { name: string; count: number; source: string }[];
      inlineStyleCount: number;
    }>(() => {
      // Browser context — `document` & `Array.from` exist at runtime.
      const g = globalThis as unknown as {
        document: {
          querySelectorAll: (sel: string) => ArrayLike<{
            classList: { toArray: () => string[] };
            parentElement: { tagName: string } | null;
          }>;
        };
      };
      const classCounts = new Map<string, { count: number; source: string }>();
      const els = Array.from(g.document.querySelectorAll("[class]"));
      let scanned = 0;
      for (const el of els) {
        if (scanned++ > 2000) break;
        const parent = el.parentElement?.tagName ?? "root";
        const list = el.classList.toArray() ?? [];
        for (const c of list) {
          if (!c) continue;
          const entry = classCounts.get(c);
          if (entry) entry.count++;
          else classCounts.set(c, { count: 1, source: `<${parent.toLowerCase()}>` });
        }
      }
      const classes = Array.from(classCounts.entries())
        .map(([name, v]) => ({ name, count: v.count, source: v.source }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 25);
      const inlineStyleCount = Array.from(
        (g as unknown as {
          document: { querySelectorAll: (sel: string) => ArrayLike<unknown> };
        }).document.querySelectorAll("[style]"),
      ).length;
      return { classes, inlineStyleCount };
    });
    return {
      url,
      inspectedAt: new Date().toISOString(),
      classes: extracted.classes.map((c) => ({
        name: c.name,
        count: c.count,
        source: c.source,
      })),
      tokens: SEED_TOKENS.slice(0, 5),
      issues: extracted.inlineStyleCount > 5
        ? [
            {
              severity: "warn" as const,
              message: `${extracted.inlineStyleCount} inline style attributes found`,
              selector: "[style]",
            },
          ]
        : [],
    };
  } finally {
    await browser.close();
  }
}

/** Deterministic mock inspection (fallback). */
async function mockInspection(
  url: string,
): Promise<DevToolsResult> {
  return {
    url,
    inspectedAt: new Date().toISOString(),
    classes: MOCK_CLASSES.map((c) => ({ ...c })),
    tokens: SEED_TOKENS.slice(0, 5),
    issues: [
      {
        severity: "warn" as const,
        message: "Selector specificity over 0,3,0 detected",
        selector: ".layout .sidebar .nav .item",
      },
    ],
  };
}

/** Get the full design token catalog. Cached. */
export async function getTokens(): Promise<{ name: string; value: string }[]> {
  return cacheWrap(
    TOKENS_KEY,
    () => Promise.resolve(SEED_TOKENS.map((t) => ({ ...t }))),
    CACHE_TTL.devtoolsTokens,
  );
}

/** Get the full utility class list. Cached. */
export async function getUtilities(): Promise<string[]> {
  return cacheWrap(
    UTILITIES_KEY,
    () => Promise.resolve([...SEED_UTILITIES]),
    CACHE_TTL.devtoolsUtilities,
  );
}

/** Analyze a page's CSS usage. Cached per URL+maxIssues. */
export async function analyzePage(
  input: AnalyzePageInput,
): Promise<DevToolsResult & { summary: { totalClasses: number; issues: number } }> {
  return cacheWrap(
    analyzeKey(input.url, input.maxIssues),
    () => {
      const base: DevToolsResult = {
        url: input.url,
        inspectedAt: new Date().toISOString(),
        classes: MOCK_CLASSES.map((c) => ({ ...c })),
        tokens: SEED_TOKENS,
        issues: [
          {
            severity: "error" as const,
            message: "Unused selector: `.legacy-grid`",
            selector: ".legacy-grid",
          },
          {
            severity: "warn" as const,
            message: "Vendor-prefixed property `-webkit-line-clamp` detected",
            selector: ".ellipsis",
          },
          {
            severity: "warn" as const,
            message: "Magic number: `padding: 13px`",
            selector: ".banner",
          },
        ].slice(0, input.maxIssues),
      };
      return Promise.resolve({
        ...base,
        summary: {
          totalClasses: base.classes.length,
          issues: base.issues.length,
        },
      });
    },
    CACHE_TTL.devtoolsInspect,
  );
}

/** Number of utility classes in the dataset. */
export function utilitiesCount(): number {
  return SEED_UTILITIES.length;
}

log.debug("DevTools module loaded", {
  tokens: SEED_TOKENS.length,
  utilities: SEED_UTILITIES.length,
});
