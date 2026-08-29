/**
 * Version service — Roy Version release tracking + upgrade checker.
 *
 * Sources its current version + releasedAt + changelog text from the
 * build artifact `dist/version-manifest.json` (produced by
 * `scripts/generate-build-artifacts.ts` from `package.json` +
 * `CHANGELOG.md`). The semver comparisons use the `semver` package.
 *
 * The breaking-changes list remains a static in-memory seed (the
 * version-manifest artifact doesn't carry structured breaking-change
 * data). The 5 historical changelog entries remain a static seed (the
 * manifest only carries the latest released section's body text).
 *
 * All reads are LRU-cached; check-upgrade is a pure computation.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import semver from "semver";

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

const __dirname = dirname(fileURLToPath(import.meta.url));
const BACKEND_ROOT = resolve(__dirname, "..", "..", "..");
const VERSION_MANIFEST_PATH = resolve(
  BACKEND_ROOT,
  "..",
  "dist",
  "version-manifest.json",
);

const CURRENT_KEY = "version:current";
const LATEST_KEY = "version:latest";
const CHANGELOG_KEY = "version:changelog";
const BREAKING_KEY = "version:breaking";

/** The next version we expect to ship (mock bump of the current). */
const LATEST_VERSION = "2.1.0";

/** Manifest shape produced by generate-build-artifacts.ts. */
interface VersionManifest {
  version: string;
  releasedAt: string;
  changelog: string;
}

let cachedManifest: VersionManifest | null = null;

/** Load + cache the version-manifest.json artifact. */
function loadManifest(): VersionManifest {
  if (cachedManifest) return cachedManifest;

  let raw: string;
  try {
    raw = readFileSync(VERSION_MANIFEST_PATH, "utf-8");
  } catch (err) {
    log.error(
      "Failed to read version-manifest.json artifact — falling back to defaults",
      {
        path: VERSION_MANIFEST_PATH,
        err: err instanceof Error ? err.message : String(err),
      },
    );
    cachedManifest = {
      version: "0.0.0",
      releasedAt: new Date(0).toISOString(),
      changelog: "",
    };
    return cachedManifest;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    log.error("version-manifest.json is malformed — falling back to defaults", {
      path: VERSION_MANIFEST_PATH,
      err: err instanceof Error ? err.message : String(err),
    });
    cachedManifest = {
      version: "0.0.0",
      releasedAt: new Date(0).toISOString(),
      changelog: "",
    };
    return cachedManifest;
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    typeof (parsed as { version?: unknown }).version !== "string"
  ) {
    log.error("version-manifest.json shape is invalid — falling back to defaults", {
      path: VERSION_MANIFEST_PATH,
    });
    cachedManifest = {
      version: "0.0.0",
      releasedAt: new Date(0).toISOString(),
      changelog: "",
    };
    return cachedManifest;
  }

  const manifest = parsed as VersionManifest;
  cachedManifest = {
    version: manifest.version,
    releasedAt: manifest.releasedAt,
    changelog: manifest.changelog,
  };
  log.info("Version manifest loaded", {
    path: VERSION_MANIFEST_PATH,
    version: cachedManifest.version,
    releasedAt: cachedManifest.releasedAt,
  });
  return cachedManifest;
}

// ─── Seed: 5 changelog entries (static — manifest only carries the latest) ──
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
export async function getCurrentVersion(): Promise<{
  version: string;
  releasedAt: string;
  changelog: string;
}> {
  return cacheWrap(
    CURRENT_KEY,
    () => {
      const manifest = loadManifest();
      return Promise.resolve({
        version: manifest.version,
        releasedAt: manifest.releasedAt,
        changelog: manifest.changelog,
      });
    },
    CACHE_TTL.versionCurrent,
  );
}

/** Alias for `getCurrentVersion` (matches the task spec's preferred name). */
export async function getVersion(): Promise<{
  version: string;
  releasedAt: string;
  changelog: string;
}> {
  return getCurrentVersion();
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

/** Check whether an upgrade is available (POST /check-upgrade). */
export async function checkUpgrade(
  input: CheckUpgradeInput,
): Promise<UpgradeCheckResult> {
  const currentVersion = await getCurrentVersion();
  const current = input.current ?? currentVersion.version;
  const latest = (await getLatestVersion()).version;
  const upgradeAvailable = semver.lt(current, latest);
  const breaking = (await getBreakingChanges()).filter(
    (b) => semver.lt(current, b.version),
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

log.debug("Version module loaded");
