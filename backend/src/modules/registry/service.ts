/**
 * Registry service — Roy Registry package registry.
 *
 * Mock backend (no DB). Seeds 10 RoyCSS-related npm packages with
 * versions, downloads, ratings, and tags. Each package has a version
 * history (3-5 versions) accessible via /packages/:id/versions.
 *
 * Reads are LRU-cached; publishing a package invalidates the package
 * list cache.
 *
 * Future: wire to a real npm registry (or local verdaccio) emitting
 * the same shape.
 */
import { randomUUID } from "node:crypto";

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

/** List all packages. Cached. */
export async function listPackages(): Promise<RegistryPackage[]> {
  return cacheWrap(
    PACKAGES_KEY,
    () => Promise.resolve(packages.map((p) => ({ ...p }))),
    CACHE_TTL.registryPackages,
  );
}

/** Get a single package by id. Cached. Throws 404 if missing. */
export async function getPackageById(id: string): Promise<RegistryPackage> {
  return cacheWrap(
    packageKey(id),
    () => {
      const found = packages.find((p) => p.id === id);
      if (!found) throw AppError.notFound(`Package '${id}' not found`);
      return Promise.resolve({ ...found });
    },
    CACHE_TTL.registryPackageDetail,
  );
}

/** List version history for a package. Cached. Throws 404 if missing. */
export async function listPackageVersions(
  id: string,
): Promise<PackageVersion[]> {
  // Validate existence (throws 404).
  await getPackageById(id);

  return cacheWrap(
    versionsKey(id),
    () => {
      const pkg = packages.find((p) => p.id === id);
      if (!pkg) throw AppError.notFound(`Package '${id}' not found`);
      return Promise.resolve(seedVersions(pkg).map((v) => ({ ...v })));
    },
    CACHE_TTL.registryPackageVersions,
  );
}

/** Publish a new package to the registry. Invalidates list cache. */
export async function publishPackage(
  input: PublishPackageInput,
): Promise<RegistryPackage> {
  // Reject duplicate names.
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
  packages.push(pkg);
  invalidatePackages(pkg.id);
  log.info("Package published", { id: pkg.id, name: pkg.name });
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
