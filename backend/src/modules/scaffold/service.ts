/**
 * Scaffold service — Roy Scaffold project scaffold generator.
 *
 * Mock backend (no DB). Seeds 8 project types and 5 frameworks Roy
 * Scaffold can target. Each generation produces a deterministic, small
 * file set derived from the project type + framework.
 *
 * Reads are LRU-cached; generations produce a result and return it
 * (the result list is not kept — scaffolds are one-shot).
 *
 * Future: route to an actual `create-*` template engine emitting the
 * same shape.
 */
import { randomUUID } from "node:crypto";

import { CACHE_TTL } from "../../config/constants.js";
import { cacheWrap } from "../../lib/cache.js";
import { createLogger } from "../../lib/logger.js";
import type {
  ProjectType,
  ScaffoldFramework,
  ScaffoldResult,
} from "../../types/index.js";
import { AppError } from "../../server/middleware/error.js";
import type { ScaffoldGenerateInput } from "./schema.js";

const log = createLogger("scaffold");

const TYPES_KEY = "scaffold:types";
const typeKey = (id: string): string => `scaffold:type:${id}`;
const FRAMEWORKS_KEY = "scaffold:frameworks";

// ─── Seed: 8 project types ───────────────────────────────────────────────
const SEED_TYPES: ProjectType[] = [
  {
    id: "pt-web-app",
    name: "Web App",
    description: "Full-stack web application with routing, SSR, and API routes.",
    category: "web",
    defaultFramework: "next",
    features: ["routing", "ssr", "api", "auth"],
  },
  {
    id: "pt-landing",
    name: "Landing Page",
    description: "Single-page marketing site with hero, features, and CTA.",
    category: "web",
    defaultFramework: "next",
    features: ["seo", "analytics", "forms"],
  },
  {
    id: "pt-docs",
    name: "Documentation Site",
    description: "Docs site with sidebar, search, MDX, and version selector.",
    category: "web",
    defaultFramework: "next",
    features: ["mdx", "search", "sidebar"],
  },
  {
    id: "pt-blog",
    name: "Blog",
    description: "Personal or team blog with RSS, tags, and drafts.",
    category: "web",
    defaultFramework: "astro",
    features: ["rss", "tags", "drafts"],
  },
  {
    id: "pt-component-library",
    name: "Component Library",
    description: "Publishable React component library with Storybook.",
    category: "library",
    defaultFramework: "vite",
    features: ["storybook", "tests", "docs"],
  },
  {
    id: "pt-api-server",
    name: "API Server",
    description: "REST API server with auth, validation, and OpenAPI spec.",
    category: "server",
    defaultFramework: "express",
    features: ["auth", "validation", "openapi"],
  },
  {
    id: "pt-cli",
    name: "CLI Tool",
    description: "Node CLI with commands, flags, and auto-update.",
    category: "library",
    defaultFramework: "commander",
    features: ["commands", "flags", "auto-update"],
  },
  {
    id: "pt-desktop",
    name: "Desktop App",
    description: "Cross-platform desktop app with native menus.",
    category: "desktop",
    defaultFramework: "electron",
    features: ["native-menu", "auto-update", "squirrel"],
  },
];

// ─── Seed: 5 frameworks ──────────────────────────────────────────────────
const SEED_FRAMEWORKS: ScaffoldFramework[] = [
  {
    id: "fw-next",
    name: "Next.js",
    version: "15.0",
    language: "typescript",
    runtime: "node",
    popularity: 96,
  },
  {
    id: "fw-vite",
    name: "Vite",
    version: "5.4",
    language: "typescript",
    runtime: "node",
    popularity: 89,
  },
  {
    id: "fw-astro",
    name: "Astro",
    version: "4.12",
    language: "typescript",
    runtime: "node",
    popularity: 78,
  },
  {
    id: "fw-express",
    name: "Express",
    version: "4.21",
    language: "typescript",
    runtime: "node",
    popularity: 84,
  },
  {
    id: "fw-electron",
    name: "Electron",
    version: "31.0",
    language: "typescript",
    runtime: "node",
    popularity: 71,
  },
];

const types: ProjectType[] = SEED_TYPES.map((t) => ({ ...t }));
const frameworks: ScaffoldFramework[] = SEED_FRAMEWORKS.map((f) => ({
  ...f,
}));

/** List all project types. Cached. */
export async function listTypes(): Promise<ProjectType[]> {
  return cacheWrap(
    TYPES_KEY,
    () => Promise.resolve(types.map((t) => ({ ...t }))),
    CACHE_TTL.scaffoldTypes,
  );
}

/** Get a single project type by id. Cached. Throws 404 if missing. */
export async function getTypeById(id: string): Promise<ProjectType> {
  return cacheWrap(
    typeKey(id),
    () => {
      const found = types.find((t) => t.id === id);
      if (!found) throw AppError.notFound(`Project type '${id}' not found`);
      return Promise.resolve({ ...found });
    },
    CACHE_TTL.scaffoldTypeDetail,
  );
}

/** List all scaffold frameworks. Cached. */
export async function listFrameworks(): Promise<ScaffoldFramework[]> {
  return cacheWrap(
    FRAMEWORKS_KEY,
    () => Promise.resolve(frameworks.map((f) => ({ ...f }))),
    CACHE_TTL.scaffoldFrameworks,
  );
}

/** Generate a project scaffold (mock). Returns a small file set. */
export async function generateScaffold(
  input: ScaffoldGenerateInput,
): Promise<ScaffoldResult> {
  // Look up project type + framework (soft-match by id or name).
  const type =
    types.find((t) => t.id === input.projectType) ??
    types.find(
      (t) => t.name.toLowerCase() === input.projectType.toLowerCase(),
    );
  if (!type) {
    throw AppError.notFound(`Project type '${input.projectType}' not found`);
  }
  const framework =
    frameworks.find((f) => f.id === input.framework) ??
    frameworks.find(
      (f) => f.name.toLowerCase() === input.framework.toLowerCase(),
    );
  if (!framework) {
    throw AppError.notFound(`Framework '${input.framework}' not found`);
  }

  const files = [
    {
      path: "package.json",
      content: JSON.stringify(
        {
          name: input.name,
          version: "0.1.0",
          private: true,
          type: "module",
          scripts: { dev: "dev", build: "build", start: "start" },
          dependencies: { [framework.name.toLowerCase()]: framework.version },
        },
        null,
        2,
      ),
    },
    {
      path: "README.md",
      content: `# ${input.name}\n\nGenerated by Roy Scaffold.\n- Project type: ${type.name}\n- Framework: ${framework.name} ${framework.version}\n- Language: ${input.language}\n`,
    },
    {
      path: `src/index.${input.language === "typescript" ? "ts" : "js"}`,
      content:
        input.language === "typescript"
          ? `export function main(): void {\n  console.log("Hello from ${input.name}");\n}\nmain();\n`
          : `export function main() {\n  console.log("Hello from ${input.name}");\n}\nmain();\n`,
    },
    ...input.features.map((feature) => ({
      path: `src/features/${feature}.${input.language === "typescript" ? "ts" : "js"}`,
      content: `// ${feature} feature scaffold\nexport const ${feature.replace(/-/g, "_")} = {\n  enabled: true,\n};\n`,
    })),
  ];

  const dependencies = [
    { name: framework.name.toLowerCase(), version: framework.version },
    ...input.features.map((f) => ({ name: f, version: "^1.0.0" })),
  ];

  const result: ScaffoldResult = {
    id: `scaffold-${randomUUID()}`,
    projectType: type.id,
    framework: framework.id,
    name: input.name,
    status: "complete",
    files,
    dependencies,
    createdAt: new Date().toISOString(),
  };
  log.info("Scaffold generated", {
    id: result.id,
    type: type.id,
    framework: framework.id,
    files: files.length,
  });
  return result;
}

/** Number of project types in the catalog. */
export function typesCount(): number {
  return types.length;
}

/** Test-only: no-op (state is read-only). */
export function _resetScaffoldForTest(): void {
  /* no-op */
}
