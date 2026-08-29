/**
 * Scaffold service — Roy Scaffold project scaffold generator.
 *
 * The catalog of project types reflects real `create-next-app` flags
 * + non-Next scaffolders (Vite, Express, Commander). Each project type's
 * `features` array carries the actual CLI flags the scaffold will pass
 * through, so the front-end can render the exact command (e.g.
 * `bun create next-app my-app --ts --app --tailwind --eslint --import-alias '@/*'`).
 *
 * Reads are LRU-cached; generations produce a result and return it
 * (the result list is not kept — scaffolds are one-shot).
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

// ─── 8 project types mapped to real create-next-app / scaffolder flags ───
// Each `features` array holds the actual CLI flags the scaffold will pass
// through, so the front-end can render the exact command verbatim.
const TYPES: ProjectType[] = [
  {
    id: "pt-next-app-ts",
    name: "Next.js App Router (TypeScript)",
    description: "Next.js 16 with App Router + TypeScript + Tailwind + ESLint — the canonical fullstack starter.",
    category: "web",
    defaultFramework: "next",
    features: ["--ts", "--app", "--tailwind", "--eslint", "--src-dir", "--import-alias '@/*'"],
  },
  {
    id: "pt-next-app-js",
    name: "Next.js App Router (JavaScript)",
    description: "Next.js App Router + JavaScript + Tailwind + ESLint — for teams not yet on TypeScript.",
    category: "web",
    defaultFramework: "next",
    features: ["--js", "--app", "--tailwind", "--eslint", "--import-alias '@/*'"],
  },
  {
    id: "pt-next-app-minimal",
    name: "Next.js Minimal",
    description: "Next.js with TypeScript + App Router only — no Tailwind, no ESLint. The smallest viable Next.js app.",
    category: "web",
    defaultFramework: "next",
    features: ["--ts", "--app", "--no-tailwind", "--no-eslint", "--import-alias '@/*'"],
  },
  {
    id: "pt-next-app-turbopack",
    name: "Next.js + Turbopack",
    description: "Next.js with --turbopack for the dev server and bundler — faster HMR, native SWC.",
    category: "web",
    defaultFramework: "next",
    features: ["--ts", "--app", "--tailwind", "--eslint", "--turbopack", "--import-alias '@/*'"],
  },
  {
    id: "pt-next-pages-router",
    name: "Next.js Pages Router",
    description: "Next.js with the legacy Pages Router (--no-app) — for projects migrating from Next 12 and earlier.",
    category: "web",
    defaultFramework: "next",
    features: ["--ts", "--no-app", "--src-dir", "--tailwind", "--import-alias '@/*'"],
  },
  {
    id: "pt-vite-react",
    name: "Vite + React",
    description: "Vite React-TS template (`bun create vite@latest -- --template react-ts`) — fast SPA without SSR.",
    category: "web",
    defaultFramework: "vite",
    features: ["--template", "react-ts"],
  },
  {
    id: "pt-express-api",
    name: "Express API Server",
    description: "Express 4 + TypeScript REST API scaffold — routes + service + schema triplet generator.",
    category: "server",
    defaultFramework: "express",
    features: ["--ts", "--json", "--no-view", "express-generator"],
  },
  {
    id: "pt-cli-tool",
    name: "Node CLI Tool",
    description: "CLI scaffold with Commander + Inquirer — Node 22, ESM, tsup for builds.",
    category: "library",
    defaultFramework: "commander",
    features: ["commander", "inquirer", "tsup", "--type=module"],
  },
];

// ─── 5 scaffold frameworks ───────────────────────────────────────────────
const FRAMEWORKS: ScaffoldFramework[] = [
  {
    id: "fw-next",
    name: "Next.js",
    version: "16.0",
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
    id: "fw-commander",
    name: "Commander",
    version: "12.1",
    language: "typescript",
    runtime: "node",
    popularity: 71,
  },
];

const types: ProjectType[] = TYPES.map((t) => ({ ...t }));
const frameworks: ScaffoldFramework[] = FRAMEWORKS.map((f) => ({
  ...f,
}));

/** List all project types. Cached. */
export async function listTypes(): Promise<ProjectType[]> {
  return cacheWrap(
    TYPES_KEY,
    () => Promise.resolve(types.map((t) => ({ ...t, features: [...t.features] }))),
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
      return Promise.resolve({ ...found, features: [...found.features] });
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

/** Generate a project scaffold. Returns a small file set. */
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
      content: `# ${input.name}\n\nGenerated by Roy Scaffold.\n- Project type: ${type.name}\n- Framework: ${framework.name} ${framework.version}\n- Language: ${input.language}\n- CLI flags: ${type.features.join(" ")}\n`,
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
