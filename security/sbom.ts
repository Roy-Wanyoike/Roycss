/**
 * security/sbom.ts
 *
 * Generates a CycloneDX 1.4 Software Bill of Materials (SBOM) from
 * `package.json` dependencies. For each runtime dependency, reads its
 * `package.json` to get the installed version, license, and homepage.
 *
 * Output: `security/results/sbom.json`
 *
 * Exit code: 0 (informational; always succeeds unless input is missing).
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";

const ROOT = join(import.meta.dir, "..");
const RESULTS_DIR = join(import.meta.dir, "results");
const SBOM_PATH = join(RESULTS_DIR, "sbom.json");

interface RootPackageJson {
  name: string;
  version: string;
  description?: string;
  license?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  overrides?: Record<string, string | { [k: string]: string }>;
}

interface DepPackageJson {
  name: string;
  version: string;
  description?: string;
  license?: string | { type?: string; url?: string };
  licenses?: Array<{ type?: string; url?: string }>;
  homepage?: string;
  repository?: string | { type?: string; url?: string };
  author?: string | { name?: string; email?: string; url?: string };
  private?: boolean;
}

interface CycloneDXComponent {
  type: "library" | "application";
  "bom-ref": string;
  name: string;
  version: string;
  description?: string;
  purl: string;
  hashes?: Array<{ alg: string; content: string }>;
  licenses?: Array<{ license: { id: string } | { name: string } }>;
  externalReferences?: Array<{ type: string; url: string }>;
  properties?: Array<{ name: string; value: string }>;
}

interface CycloneDXBom {
  bomFormat: "CycloneDX";
  specVersion: "1.4";
  serialNumber: string;
  version: 1;
  metadata: {
    timestamp: string;
    tools: Array<{ vendor: string; name: string; version: string }>;
    component: {
      type: "application";
      "bom-ref": string;
      name: string;
      version: string;
      description?: string;
      licenses?: Array<{ license: { id: string } }>;
    };
  };
  components: CycloneDXComponent[];
}

function normalizeLicense(license: DepPackageJson["license"]): string | null {
  if (!license) return null;
  if (typeof license === "string") return license;
  if (license.type) return license.type;
  return null;
}

function normalizeLicenses(pkg: DepPackageJson): string | null {
  // CycloneDX prefers `licenses` (array) over `license` (string). npm
  // packages use `license` (string) historically; some old packages use
  // `licenses` (array). Handle both.
  if (pkg.licenses && Array.isArray(pkg.licenses) && pkg.licenses.length > 0) {
    return pkg.licenses[0].type ?? null;
  }
  return normalizeLicense(pkg.license);
}

function isSpdxLicense(license: string | null): boolean {
  if (!license) return false;
  // Quick heuristic: SPDX license IDs are short, alphanumeric, may contain
  // `-` and `+` and `.` (e.g. "Apache-2.0", "BSD-3-Clause", "MIT", "0BSD").
  return /^[A-Za-z0-9.\-+]+$/.test(license) && license.length <= 40;
}

function readDepPackageJson(name: string): DepPackageJson | null {
  // Try direct path first (npm hoisting)
  const paths = [
    join(ROOT, "node_modules", name, "package.json"),
  ];
  // For scoped packages, @scope/name → node_modules/@scope/name/package.json
  // (already handled by the join above)
  for (const p of paths) {
    try {
      return JSON.parse(readFileSync(p, "utf8"));
    } catch {
      // continue
    }
  }
  return null;
}

function repoUrl(repo: DepPackageJson["repository"]): string | null {
  if (!repo) return null;
  if (typeof repo === "string") {
    // Shorthand: "github:user/repo" or a URL
    if (repo.startsWith("github:")) return `https://github.com/${repo.slice(7)}`;
    if (repo.startsWith("git://")) return repo.replace(/^git:/, "https:");
    if (repo.startsWith("git+")) return repo.slice(4);
    if (/^https?:\/\//.test(repo)) return repo;
    return null;
  }
  if (repo.url) {
    return repo.url.replace(/^git\+/, "").replace(/^git:/, "https:").replace(/\.git$/, "");
  }
  return null;
}

function sha256Hash(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

function main(): number {
  if (!existsSync(join(ROOT, "package.json"))) {
    console.error("sbom.ts: package.json not found at", ROOT);
    return 1;
  }

  const rootPkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as RootPackageJson;
  const runtimeDeps = Object.keys(rootPkg.dependencies || {});
  const devDeps = Object.keys(rootPkg.devDependencies || {});
  const overrides = rootPkg.overrides || {};

  mkdirSync(RESULTS_DIR, { recursive: true });

  const components: CycloneDXComponent[] = [];

  // Add the root application as the first component (it's also in metadata.component,
  // but listing it here lets downstream tools see it in the components array too).
  // We skip that to follow CycloneDX convention: the root app is in metadata.component only.

  // Runtime dependencies
  for (const name of runtimeDeps) {
    const depPkg = readDepPackageJson(name);
    if (!depPkg) {
      // Dep not installed; record as a component with unknown version
      components.push({
        type: "library",
        "bom-ref": `pkg:npm/${encodeURIComponent(name)}@unknown`,
        name,
        version: "unknown",
        purl: `pkg:npm/${encodeURIComponent(name)}`,
        properties: [
          { name: "roycss:declaredRange", value: rootPkg.dependencies![name] },
          { name: "roycss:installed", value: "false" },
        ],
      });
      continue;
    }

    const declaredRange = rootPkg.dependencies![name];
    const license = normalizeLicenses(depPkg);
    const licensesField = license
      ? isSpdxLicense(license)
        ? [{ license: { id: license } }]
        : [{ license: { name: license } }]
      : undefined;

    const externalRefs: CycloneDXComponent["externalReferences"] = [];
    if (depPkg.homepage) externalRefs.push({ type: "website", url: depPkg.homepage });
    const repo = repoUrl(depPkg.repository);
    if (repo) externalRefs.push({ type: "vcs", url: repo });

    const properties: CycloneDXComponent["properties"] = [
      { name: "roycss:declaredRange", value: declaredRange },
      { name: "roycss:dependencyType", value: "runtime" },
    ];
    if (overrides[name]) {
      properties.push({
        name: "roycss:overrideApplied",
        value: typeof overrides[name] === "string" ? (overrides[name] as string) : JSON.stringify(overrides[name]),
      });
    }

    components.push({
      type: "library",
      "bom-ref": `pkg:npm/${encodeURIComponent(name)}@${depPkg.version}`,
      name,
      version: depPkg.version,
      description: depPkg.description,
      purl: `pkg:npm/${encodeURIComponent(name)}@${depPkg.version}`,
      licenses: licensesField,
      externalReferences: externalRefs.length > 0 ? externalRefs : undefined,
      properties,
    });
  }

  // Dev dependencies (marked via properties for filtering)
  for (const name of devDeps) {
    const depPkg = readDepPackageJson(name);
    if (!depPkg) continue;
    const declaredRange = rootPkg.devDependencies![name];
    const license = normalizeLicenses(depPkg);
    const licensesField = license
      ? isSpdxLicense(license)
        ? [{ license: { id: license } }]
        : [{ license: { name: license } }]
      : undefined;

    components.push({
      type: "library",
      "bom-ref": `pkg:npm/${encodeURIComponent(name)}@${depPkg.version}#dev`,
      name,
      version: depPkg.version,
      description: depPkg.description,
      purl: `pkg:npm/${encodeURIComponent(name)}@${depPkg.version}`,
      licenses: licensesField,
      properties: [
        { name: "roycss:declaredRange", value: declaredRange },
        { name: "roycss:dependencyType", value: "dev" },
      ],
    });
  }

  // Sort components alphabetically for deterministic output
  components.sort((a, b) => a.name.localeCompare(b.name) || a.version.localeCompare(b.version));

  const rootLicense = normalizeLicense(rootPkg.license as string);
  const rootLicensesField = rootLicense
    ? isSpdxLicense(rootLicense)
      ? [{ license: { id: rootLicense } }]
      : [{ license: { name: rootLicense } }]
    : undefined;

  const sbom: CycloneDXBom = {
    bomFormat: "CycloneDX",
    specVersion: "1.4",
    serialNumber: `urn:uuid:${crypto.randomUUID()}`,
    version: 1,
    metadata: {
      timestamp: new Date().toISOString(),
      tools: [
        {
          vendor: "RoyCSS",
          name: "security/sbom.ts",
          version: "1.0.0",
        },
      ],
      component: {
        type: "application",
        "bom-ref": `pkg:npm/${encodeURIComponent(rootPkg.name)}@${rootPkg.version}`,
        name: rootPkg.name,
        version: rootPkg.version,
        description: rootPkg.description,
        licenses: rootLicensesField as CycloneDXBom["metadata"]["component"]["licenses"],
      },
    },
    components,
  };

  writeFileSync(SBOM_PATH, JSON.stringify(sbom, null, 2));

  // Summary
  const runtimeCount = components.filter((c) => c.properties?.some((p) => p.name === "roycss:dependencyType" && p.value === "runtime")).length;
  const devCount = components.filter((c) => c.properties?.some((p) => p.name === "roycss:dependencyType" && p.value === "dev")).length;
  const missingLicense = components.filter((c) => !c.licenses || c.licenses.length === 0).length;
  const missingVersion = components.filter((c) => c.version === "unknown").length;

  console.log("═══════════════════════════════════════════════════════════");
  console.log(" RoyCSS SBOM — CycloneDX 1.4");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(` Generated:        ${sbom.metadata.timestamp}`);
  console.log(` Application:      ${rootPkg.name}@${rootPkg.version}`);
  console.log(` Serial:           ${sbom.serialNumber}`);
  console.log("");
  console.log(` Components:       ${components.length}`);
  console.log(`   Runtime deps:   ${runtimeCount}`);
  console.log(`   Dev deps:       ${devCount}`);
  console.log(`   Missing license:${missingLicense}`);
  console.log(`   Missing version:${missingVersion}`);
  console.log("");
  console.log(` Overrides applied: ${Object.keys(overrides).length}`);
  for (const k of Object.keys(overrides).sort()) {
    const v = typeof overrides[k] === "string" ? (overrides[k] as string) : JSON.stringify(overrides[k]);
    console.log(`   ${k.padEnd(28)} → ${v}`);
  }
  console.log("");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(` ✅ SBOM written to: ${SBOM_PATH}`);
  console.log("═══════════════════════════════════════════════════════════");

  return 0;
}

try {
  process.exit(main());
} catch (err) {
  console.error("sbom.ts: uncaught error:", err);
  process.exit(2);
}
