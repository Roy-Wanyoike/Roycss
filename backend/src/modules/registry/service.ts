/**
 * Registry service — Roy Registry package registry.
 *
 * Backed by the real npm registry (`https://registry.npmjs.org/<pkg>`)
 * for read operations. The npm registry serves public packages without
 * a token, so reads always attempt the real call when the network is
 * reachable; on failure (404, network error, etc.), the deterministic
 * seeded catalog is returned — same signature, same downstream cache
 * keys.
 *
 * Publishing requires `NPM_TOKEN`. When set, `publishPackage()`
 * attempts a real npm publish (`PUT /<pkg>`) and falls back to a
 * local-only record on failure. When unset, publish is always
 * local-only.
 *
 * Reads are LRU-cached; publishing a package invalidates the package
 * list cache.
 */
import { randomUUID } from "node:crypto";

import { env } from "../../config/env.js";
import { CACHE_TTL } from "../../config/constants.js";
import { cache, cacheWrap } from "../../lib/cache.js";
import { createLogger } from "../../lib/logger.js";
import type {
  PackageVersion,
  RegistryPackage,
} from "../../types/index.js";
import { AppError } from "../../server/middleware/error.js";
import type { PublishPackageInput } from "./schema.js";

const log = createLogger("registry");

/** True iff an npm publish token is configured (publish attempts use it). */
export const isNpmConfigured: boolean = Boolean(env.NPM_TOKEN);

const NPM_REGISTRY = "https://registry.npmjs.org";

const PACKAGES_KEY = "registry:packages";
const packageKey = (id: string): string => `registry:package:${id}`;
const versionsKey = (id: string): string => `registry:package:${id}:versions`;

function invalidatePackages(id?: string): void {
  cache.delete(PACKAGES_KEY);
  if (id) {
    cache.delete(packageKey(id));
    cache.delete(versionsKey(id));
  }
}

// ─── Seed: 10 packages ───────────────────────────────────────────────────
const SEED_PACKAGES: RegistryPackage[] = [
  {
    id: "pkg-roycss-core",
    name: "@roycss/core",
    description: "The RoyCSS runtime — atomic utilities, tokens, and effects.",
    author: "roycss",
    version: "2.0.0",
    latestVersion: "2.1.0",
    downloads: 1_204_500,
    rating: 4.9,
    tags: ["core", "css", "utilities"],
    license: "MIT",
    createdAt: "2024-09-01T00:00:00.000Z",
    updatedAt: "2025-03-01T00:00:00.000Z",
  },
  {
    id: "pkg-roycss-react",
    name: "@roycss/react",
    description: "React bindings for RoyCSS — hooks, components, and providers.",
    author: "roycss",
    version: "2.0.0",
    latestVersion: "2.1.0",
    downloads: 486_200,
    rating: 4.8,
    tags: ["react", "components"],
    license: "MIT",
    createdAt: "2024-09-04T00:00:00.000Z",
    updatedAt: "2025-03-01T00:00:00.000Z",
  },
  {
    id: "pkg-roycss-cli",
    name: "@roycss/cli",
    description: "Command-line interface for scaffolding, generating, and migrating RoyCSS projects.",
    author: "roycss",
    version: "2.0.0",
    latestVersion: "2.1.0",
    downloads: 312_800,
    rating: 4.7,
    tags: ["cli", "scaffold"],
    license: "MIT",
    createdAt: "2024-09-08T00:00:00.000Z",
    updatedAt: "2025-03-01T00:00:00.000Z",
  },
  {
    id: "pkg-roycss-themes",
    name: "@roycss/themes",
    description: "Curated theme presets for RoyCSS — healthcare, banking, fintech, and more.",
    author: "roycss",
    version: "2.0.0",
    latestVersion: "2.0.4",
    downloads: 184_300,
    rating: 4.6,
    tags: ["themes", "presets"],
    license: "MIT",
    createdAt: "2024-10-02T00:00:00.000Z",
    updatedAt: "2025-02-12T00:00:00.000Z",
  },
  {
    id: "pkg-roycss-motion",
    name: "@roycss/motion",
    description: "Animation library on top of RoyCSS — entrance, exit, scroll, and gesture presets.",
    author: "roycss",
    version: "1.4.0",
    latestVersion: "1.5.0",
    downloads: 142_700,
    rating: 4.7,
    tags: ["motion", "animation"],
    license: "MIT",
    createdAt: "2024-11-15T00:00:00.000Z",
    updatedAt: "2025-02-22T00:00:00.000Z",
  },
  {
    id: "pkg-roycss-inspector",
    name: "@roycss/inspector",
    description: "Browser DevTools extension for inspecting and auditing RoyCSS class usage.",
    author: "roycss",
    version: "1.2.0",
    latestVersion: "1.2.1",
    downloads: 96_400,
    rating: 4.5,
    tags: ["devtools", "inspector"],
    license: "MIT",
    createdAt: "2024-12-04T00:00:00.000Z",
    updatedAt: "2025-02-18T00:00:00.000Z",
  },
  {
    id: "pkg-roycss-tokens",
    name: "@roycss/tokens",
    description: "Design tokens package — colors, spacing, typography, in W3C tokens format.",
    author: "roycss",
    version: "2.0.0",
    latestVersion: "2.0.2",
    downloads: 78_900,
    rating: 4.8,
    tags: ["tokens", "design-tokens"],
    license: "MIT",
    createdAt: "2024-10-12T00:00:00.000Z",
    updatedAt: "2025-02-05T00:00:00.000Z",
  },
  {
    id: "pkg-roycss-icons",
    name: "@roycss/icons",
    description: "SVG icon set optimized for RoyCSS — stroke-based, tree-shakeable, and accessible.",
    author: "roycss",
    version: "1.0.0",
    latestVersion: "1.1.0",
    downloads: 64_200,
    rating: 4.6,
    tags: ["icons", "svg"],
    license: "MIT",
    createdAt: "2024-11-22T00:00:00.000Z",
    updatedAt: "2025-02-14T00:00:00.000Z",
  },
  {
    id: "pkg-roycss-marketing",
    name: "@roycss/marketing",
    description: "Community package — marketing landing blocks built on RoyCSS.",
    author: "mira-lin",
    version: "0.4.0",
    latestVersion: "0.4.2",
    downloads: 12_800,
    rating: 4.4,
    tags: ["community", "landing"],
    license: "MIT",
    createdAt: "2025-01-08T00:00:00.000Z",
    updatedAt: "2025-02-20T00:00:00.000Z",
  },
  {
    id: "pkg-roycss-vue",
    name: "@roycss/vue",
    description: "Vue 3 bindings for RoyCSS — composables and components.",
    author: "community",
    version: "0.2.0",
    latestVersion: "0.3.0",
    downloads: 8_900,
    rating: 4.3,
    tags: ["community", "vue"],
    license: "MIT",
    createdAt: "2025-01-18T00:00:00.000Z",
    updatedAt: "2025-02-28T00:00:00.000Z",
  },
];

// ─── Seed: version history (3-5 entries per package) ─────────────────────
function seedVersions(pkg: RegistryPackage): PackageVersion[] {
  const [major, minor, patch] = pkg.latestVersion
    .split(".")
    .map((n) => parseInt(n, 10));
  const base = `${major ?? 1}.${minor ?? 0}.${patch ?? 0}`;
  const prev1 = `${major ?? 1}.${(minor ?? 1) - 1}.0`;
  const prev2 = `${major ?? 1}.${(minor ?? 1) - 2}.0`;
  const prev3 = `${(major ?? 2) - 1}.9.0`;
  return [
    {
      version: base,
      publishedAt: pkg.updatedAt,
      downloads: Math.round(pkg.downloads * 0.4),
      size: 142_000,
      deprecated: false,
      readme: `# ${pkg.name}@${base}\n\n${pkg.description}`,
    },
    {
      version: prev1,
      publishedAt: "2024-12-01T00:00:00.000Z",
      downloads: Math.round(pkg.downloads * 0.3),
      size: 138_000,
      deprecated: false,
      readme: `# ${pkg.name}@${prev1}`,
    },
    {
      version: prev2,
      publishedAt: "2024-10-01T00:00:00.000Z",
      downloads: Math.round(pkg.downloads * 0.2),
      size: 134_000,
      deprecated: false,
      readme: `# ${pkg.name}@${prev2}`,
    },
    {
      version: prev3,
      publishedAt: "2024-08-01T00:00:00.000Z",
      downloads: Math.round(pkg.downloads * 0.1),
      size: 128_000,
      deprecated: true,
      readme: `# ${pkg.name}@${prev3} (deprecated)`,
    },
  ];
}

const packages: RegistryPackage[] = SEED_PACKAGES.map((p) => ({ ...p }));

// ─── npm registry helpers ─────────────────────────────────────────────────

interface NpmRegistryResponse {
  "name"?: string;
  "description"?: string;
  "license"?: string;
  "dist-tags"?: { latest?: string };
  versions?: Record<
    string,
    {
      dist?: { unpackedSize?: number; tarball?: string };
      deprecated?: string;
      _npmUser?: string;
    }
  >;
  time?: Record<string, string>;
  author?: string | { name?: string };
  maintainers?: { name?: string }[];
}

/** Map a npm registry response into a partial RegistryPackage (overrides
 *  only the fields the registry actually has; keeps the seed's rating +
 *  downloads since the registry doesn't expose those). */
function mapNpmToRegistry(
  seed: RegistryPackage,
  data: NpmRegistryResponse,
): RegistryPackage {
  const latest = data["dist-tags"]?.latest ?? seed.latestVersion;
  const publishedAt = data.time?.[latest] ?? seed.updatedAt;
  const author =
    typeof data.author === "string"
      ? (data.author.split("<")[0]?.trim() ?? seed.author)
      : data.author?.name ??
        data.maintainers?.[0]?.name ??
        seed.author;
  return {
    ...seed,
    description: data.description ?? seed.description,
    latestVersion: latest,
    version: latest,
    author,
    license: data.license ?? seed.license,
    updatedAt: publishedAt,
  };
}

/** Fetch a single package's metadata from the npm registry. Returns null on
 *  404, network error, or non-JSON. Works without a token for public pkgs. */
async function fetchNpmPackage(
  name: string,
): Promise<NpmRegistryResponse | null> {
  try {
    const url = `${NPM_REGISTRY}/${encodeURIComponent(name).replace("%40", "@")}`;
    const res = await fetch(url, {
      headers: {
        accept: "application/json",
        ...(env.NPM_TOKEN
          ? { authorization: `Bearer ${env.NPM_TOKEN}` }
          : {}),
      },
    });
    if (res.status === 404) return null;
    if (!res.ok) {
      log.warn("npm registry fetch failed", {
        name,
        status: res.status,
      });
      return null;
    }
    return (await res.json()) as NpmRegistryResponse;
  } catch (err) {
    log.warn("npm registry fetch errored", {
      name,
      err: (err as Error).message,
    });
    return null;
  }
}

/** Build a PackageVersion list from a npm registry response. Falls back to
 *  the seed version history if the response lacks version info. */
function mapNpmVersions(
  seed: RegistryPackage,
  data: NpmRegistryResponse,
): PackageVersion[] {
  const versionsMap = data.versions ?? {};
  const timesMap = data.time ?? {};
  const entries = Object.entries(versionsMap).slice(-10).reverse();
  if (entries.length === 0) return seedVersions(seed).map((v) => ({ ...v }));
  return entries.map(([version, meta]) => ({
    version,
    publishedAt: timesMap[version] ?? seed.updatedAt,
    downloads: Math.round(seed.downloads * 0.3),
    size: meta.dist?.unpackedSize ?? 140_000,
    deprecated: Boolean(meta.deprecated),
    readme: `# ${seed.name}@${version}${meta.deprecated ? ` (deprecated: ${meta.deprecated})` : ""}`,
  }));
}

// ─── Public API ─────────────────────────────────────────────────────────

/** List all packages. Cached. Enriches each seed entry with real npm
 *  registry data when the package is published and reachable. */
export async function listPackages(): Promise<RegistryPackage[]> {
  return cacheWrap(
    PACKAGES_KEY,
    async () => {
      const enriched: RegistryPackage[] = [];
      for (const seed of packages) {
        const npm = await fetchNpmPackage(seed.name);
        enriched.push(npm ? mapNpmToRegistry(seed, npm) : { ...seed });
      }
      return enriched;
    },
    CACHE_TTL.registryPackages,
  );
}

/** Get a single package by id. Cached. Throws 404 if missing.
 *  Enriches with real npm registry data when available. */
export async function getPackageById(id: string): Promise<RegistryPackage> {
  return cacheWrap(
    packageKey(id),
    async () => {
      const seed = packages.find((p) => p.id === id);
      if (!seed) throw AppError.notFound(`Package '${id}' not found`);
      const npm = await fetchNpmPackage(seed.name);
      return npm ? mapNpmToRegistry(seed, npm) : { ...seed };
    },
    CACHE_TTL.registryPackageDetail,
  );
}

/** List version history for a package. Cached. Throws 404 if missing.
 *  Uses real npm registry version history when available. */
export async function listPackageVersions(
  id: string,
): Promise<PackageVersion[]> {
  // Validate existence (throws 404).
  await getPackageById(id);

  return cacheWrap(
    versionsKey(id),
    async () => {
      const seed = packages.find((p) => p.id === id);
      if (!seed) throw AppError.notFound(`Package '${id}' not found`);
      const npm = await fetchNpmPackage(seed.name);
      if (npm) return mapNpmVersions(seed, npm);
      return seedVersions(seed).map((v) => ({ ...v }));
    },
    CACHE_TTL.registryPackageVersions,
  );
}

/** Publish a new package to the registry. Invalidates list cache.
 *  When NPM_TOKEN is set, attempts a real npm publish (PUT) — on failure
 *  (network error, 4xx, etc.), records the package locally only. */
export async function publishPackage(
  input: PublishPackageInput,
): Promise<RegistryPackage> {
  // Reject duplicate names (local catalog check — the npm registry may
  // already have a package with this name, but we don't auto-reject that).
  const dup = packages.find((p) => p.name === input.name);
  if (dup) {
    throw AppError.conflict(
      `Package '${input.name}' already exists`,
      { existingId: dup.id },
    );
  }
  const now = new Date().toISOString();
  const pkg: RegistryPackage = {
    id: `pkg-${randomUUID()}`,
    name: input.name,
    description: input.description,
    author: input.author,
    version: input.version,
    latestVersion: input.version,
    downloads: 0,
    rating: 0,
    tags: input.tags,
    license: input.license,
    createdAt: now,
    updatedAt: now,
  };

  if (isNpmConfigured) {
    // Attempt a real npm publish. The npm registry accepts a PUT to
    // /<package> with the package manifest as the body. We send the
    // minimum shape npm accepts; failures fall back to local-only.
    try {
      const manifest = {
        name: input.name,
        version: input.version,
        description: input.description,
        author: input.author,
        license: input.license,
        tags: input.tags,
      };
      const res = await fetch(
        `${NPM_REGISTRY}/${encodeURIComponent(input.name).replace("%40", "@")}`,
        {
          method: "PUT",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${env.NPM_TOKEN}`,
            accept: "application/json",
          },
          body: JSON.stringify(manifest),
        },
      );
      if (res.ok) {
        log.info("Package published to npm registry", {
          id: pkg.id,
          name: pkg.name,
        });
      } else {
        log.warn("npm publish failed — package recorded locally only", {
          name: pkg.name,
          status: res.status,
        });
      }
    } catch (err) {
      log.warn("npm publish errored — package recorded locally only", {
        name: pkg.name,
        err: (err as Error).message,
      });
    }
  } else {
    log.info("Package published (local only — NPM_TOKEN unset)", {
      id: pkg.id,
      name: pkg.name,
    });
  }

  packages.push(pkg);
  invalidatePackages(pkg.id);
  return pkg;
}

/** Number of packages in the registry. */
export function packagesCount(): number {
  return packages.length;
}

/** Test-only: reset to seed. */
export function _resetRegistryForTest(): void {
  packages.length = 0;
  packages.push(...SEED_PACKAGES.map((p) => ({ ...p })));
  invalidatePackages();
}

log.debug("Registry module loaded", {
  packages: SEED_PACKAGES.length,
  npmConfigured: isNpmConfigured,
});
