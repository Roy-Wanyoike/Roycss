/**
 * DevTools service — mock inspection + token/utility data for Roy DevTools.
 *
 * Returns mock CSS-class inspection results for any URL, the platform's
 * design token catalog, and the full list of generated utility classes.
 * All reads are LRU-cached.
 *
 * Future: replace `inspectUrl` and `analyzePage` with real headless-browser
 * scraping (Playwright) — the route layer won't need to change.
 */
import { CACHE_TTL } from "../../config/constants.js";
import { cacheWrap } from "../../lib/cache.js";
import { createLogger } from "../../lib/logger.js";
import type { DevToolsResult } from "../../types/index.js";
import type { AnalyzePageInput } from "./schema.js";

const log = createLogger("devtools");

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

/** Inspect a URL — returns the mock class list. Cached per URL. */
export async function inspectUrl(url: string): Promise<DevToolsResult> {
  return cacheWrap(
    inspectKey(url),
    () => {
      const result: DevToolsResult = {
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
      return Promise.resolve(result);
    },
    CACHE_TTL.devtoolsInspect,
  );
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
