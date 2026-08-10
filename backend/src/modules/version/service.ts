/**
 * Version service — Roy Version release tracking + upgrade checker.
 *
 * Mock backend (no DB). Seeds the current platform version (v2.0.0),
 * the latest available version (v2.1.0), 5 changelog entries, and 3
 * breaking changes between the current and latest.
 *
 * Reads are LRU-cached; check-upgrade is a pure computation.
 *
 * Future: pull from a real release manifest (CHANGELOG.md + semver).
 */
import { CACHE_TTL } from "../../config/constants.js";
import { cacheWrap } from "../../lib/cache.js";
import { createLogger } from "../../lib/logger.js";
import type {
  BreakingChange,
  ChangelogEntry,
  UpgradeCheckResult,
} from "../../types/index.js";
import type { CheckUpgradeInput } from "./schema.js";

const log = createLogger("version");

const CURRENT_KEY = "version:current";
const LATEST_KEY = "version:latest";
const CHANGELOG_KEY = "version:changelog";
const BREAKING_KEY = "version:breaking";

// ─── Versions ────────────────────────────────────────────────────────────
const CURRENT_VERSION = "2.0.0";
const LATEST_VERSION = "2.1.0";

// ─── Seed: 5 changelog entries ───────────────────────────────────────────
const SEED_CHANGELOG: ChangelogEntry[] = [
  {
    version: "2.1.0",
    date: "2025-03-01",
    type: "minor",
    highlights: [
      "Roy Architect, Roy Review, Roy Designer added to the platform.",
      "New sync integrations for Figma and GitHub.",
    ],
    changes: [
      { type: "added", description: "12 new backend modules (batch 1)." },
      { type: "added", description: "Roy Architect AI generation API." },
      { type: "changed", description: "Themes API now returns a `tokens` object." },
      { type: "fixed", description: "Cache invalidation race in marketplace listings." },
    ],
  },
  {
    version: "2.0.0",
    date: "2025-02-01",
    type: "major",
    highlights: [
      "RoyCSS v2 — new design token system, new API surface.",
      "Platform SDKs for TypeScript and Python.",
    ],
    changes: [
      { type: "added", description: "Design token system based on oklch." },
      { type: "added", description: "Platform SDKs (TS, Python)." },
      { type: "removed", description: "Legacy `roycss-util-*` utility classes (see migration guide)." },
      { type: "security", description: "Stricter CSP defaults for embedded preview frames." },
    ],
  },
  {
    version: "1.9.2",
    date: "2025-01-15",
    type: "patch",
    highlights: ["Bug-fix release."],
    changes: [
      { type: "fixed", description: "Effect preview flicker on Safari 17." },
      { type: "fixed", description: "Inspector scan missing `data-*` attributes." },
    ],
  },
  {
    version: "1.9.1",
    date: "2025-01-08",
    type: "patch",
    highlights: ["Performance and a11y fixes."],
    changes: [
      { type: "fixed", description: "Bundle size regression in 1.9.0." },
      { type: "fixed", description: "Tab order in the documentation viewer." },
    ],
  },
  {
    version: "1.9.0",
    date: "2025-01-02",
    type: "minor",
    highlights: ["Inspector extension v2.", "Motion library expansion."],
    changes: [
      { type: "added", description: "12 new motion presets." },
      { type: "added", description: "Inspector extension v2 with class scanning." },
      { type: "deprecated", description: "`roycss-shadow-1` (use `roycss-shadow-sm` instead)." },
    ],
  },
];

// ─── Seed: 3 breaking changes between 2.0.0 and 2.1.0 ────────────────────
const SEED_BREAKING: BreakingChange[] = [
  {
    id: "bc-2-1-0-tokens-shape",
    version: "2.1.0",
    title: "Theme `tokens` shape changed",
    description:
      "The `tokens` object on themes now nests under `color`, `radius`, and `typography` instead of being flat.",
    migration:
      "Update any code reading `theme.tokens.primary` to `theme.tokens.color.primary`. A codemod is available as `roycss-codemod theme-shape`.",
    severity: "high",
  },
  {
    id: "bc-2-1-0-removed-legacy-utils",
    version: "2.1.0",
    title: "Removed `roycss-util-*` legacy utilities",
    description:
      "The compatibility layer for `roycss-util-*` utility classes (deprecated in 2.0.0) has been removed.",
    migration:
      "Run `roycss-codemod util-to-atomic` to migrate to the new atomic utility classes.",
    severity: "medium",
  },
  {
    id: "bc-2-1-0-default-export",
    version: "2.1.0",
    title: "Default exports removed from platform SDK",
    description:
      "Platform SDK packages no longer ship a default export. Use the named exports instead.",
    migration:
      "Replace `import roycss from '@roycss/sdk'` with `import { createRoyCSS } from '@roycss/sdk'`.",
    severity: "low",
  },
];

/** Get the current platform version. Cached. */
export async function getCurrentVersion(): Promise<{ version: string }> {
  return cacheWrap(
    CURRENT_KEY,
    () => Promise.resolve({ version: CURRENT_VERSION }),
    CACHE_TTL.versionCurrent,
  );
}

/** Get the latest available version. Cached. */
export async function getLatestVersion(): Promise<{ version: string }> {
  return cacheWrap(
    LATEST_KEY,
    () => Promise.resolve({ version: LATEST_VERSION }),
    CACHE_TTL.versionLatest,
  );
}

/** Get the full changelog. Cached. */
export async function getChangelog(): Promise<ChangelogEntry[]> {
  return cacheWrap(
    CHANGELOG_KEY,
    () => Promise.resolve(SEED_CHANGELOG.map((c) => ({ ...c }))),
    CACHE_TTL.versionChangelog,
  );
}

/** Get all known breaking changes. Cached. */
export async function getBreakingChanges(): Promise<BreakingChange[]> {
  return cacheWrap(
    BREAKING_KEY,
    () => Promise.resolve(SEED_BREAKING.map((b) => ({ ...b }))),
    CACHE_TTL.versionBreakingChanges,
  );
}

/** Compare two semver strings: -1 if a<b, 0 if equal, 1 if a>b. */
function compareSemver(a: string, b: string): number {
  const parse = (v: string): [number, number, number] => {
    const [core] = v.split("+");
    const base = (core ?? "").split("-")[0] ?? "0";
    const [majorStr, minorStr, patchStr] = base.split(".");
    const major = parseInt(majorStr ?? "0", 10) || 0;
    const minor = parseInt(minorStr ?? "0", 10) || 0;
    const patch = parseInt(patchStr ?? "0", 10) || 0;
    return [major, minor, patch];
  };
  const [aM, am, ap] = parse(a);
  const [bM, bm, bp] = parse(b);
  if (aM !== bM) return aM < bM ? -1 : 1;
  if (am !== bm) return am < bm ? -1 : 1;
  if (ap !== bp) return ap < bp ? -1 : 1;
  return 0;
}

/** Check whether an upgrade is available (POST /check-upgrade). */
export async function checkUpgrade(
  input: CheckUpgradeInput,
): Promise<UpgradeCheckResult> {
  const current = input.current ?? CURRENT_VERSION;
  const latest = (await getLatestVersion()).version;
  const upgradeAvailable = compareSemver(current, latest) < 0;
  const breaking = (await getBreakingChanges()).filter(
    (b) => compareSemver(current, b.version) < 0,
  );
  const recommendation: UpgradeCheckResult["recommendation"] = upgradeAvailable
    ? breaking.some((b) => b.severity === "high")
      ? "review"
      : "upgrade"
    : "skip";
  const notes = upgradeAvailable
    ? breaking.length === 0
      ? `Upgrade to ${latest} is safe — no breaking changes detected since ${current}.`
      : `${breaking.length} breaking change(s) between ${current} and ${latest}. Review before upgrading.`
    : `You are on or ahead of the latest version (${latest}).`;
  log.info("Upgrade check", { current, latest, upgradeAvailable, breaking: breaking.length });
  return {
    current,
    latest,
    upgradeAvailable,
    breakingChanges: breaking.length,
    recommendation,
    notes,
  };
}
