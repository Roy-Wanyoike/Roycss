import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  MODULE_STATUS,
  MODULE_STATUSES,
  MODULE_STATUS_META,
  getModuleStatus,
  getModuleStatusMeta,
  isModuleLive,
  type ModuleStatus,
} from "@/lib/module-status";

/**
 * PF-012 / issue #86 — registry guard tests.
 *
 * The marketing site used to show "Live" badges on product cards whose
 * backend modules deliberately return mock/static data. `src/lib/
 * module-status.ts` is now the single source of truth, and these tests
 * keep it honest:
 *
 *  1. Every backend module that documents a mock/limited implementation —
 *     either via a `Future:` comment in `backend-node/src/modules/<mod>/
 *     service.ts` (scanned dynamically below) or via the PF-012 module
 *     list in `docs/PENDING-FEATURES.md` (F4/F5/F6/F7/F9–F12/F14/F15) —
 *     MUST be registered as a NON-live status ("demo" or "catalog-only").
 *     The test fails if a documented-mock module is marked live.
 *
 *  2. Every `module="…"` key used by badge components in `src/components`
 *     must exist in the registry, so badges can never drift from it.
 *
 *  3. Presentation copy is unambiguous: non-live badges say "not live"
 *     and never reuse the "Live" label.
 */

/** Repo root — derived from this test file (tests/unit/) so cwd doesn't matter. */
const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const BACKEND_MODULES_DIR = join(ROOT, "backend-node/src/modules");
const COMPONENTS_DIR = join(ROOT, "src/components");

/** Module list from docs/PENDING-FEATURES.md §PF-012 acceptance bullets. */
const PF012_DOCUMENTED_MOCK_MODULES: readonly string[] = [
  "analytics", // F4 — static snapshot KPIs
  "mcp", // F5 — catalog, executeTool is mock
  "edge", // F6 — mock regions
  "plugin-hub", // F7 — mock plugins
  "live", // F9 — in-memory sessions/cursors/chat
  "accessibility", // F10 — mock audit fallback
  "digital-twin", // F11 — mock simulation fallback
  "devtools", // F12 — mock inspection fallback
  "refactor", // F14 — mock transform variance
  "scaffold", // F15 — template-only
  "generator", // F15 — template-only
];

/** Walk backend-node/src/modules and collect modules with `Future:` comments. */
function findFutureCommentedModules(): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(BACKEND_MODULES_DIR)) {
    const dir = join(BACKEND_MODULES_DIR, entry);
    if (!statSync(dir).isDirectory()) continue;
    const service = join(dir, "service.ts");
    try {
      const src = readFileSync(service, "utf8");
      if (/^\s*?\*?\s*Future:/m.test(src)) found.push(entry);
    } catch {
      // module without service.ts — nothing to audit
    }
  }
  return found;
}

/** Walk src/components and collect every `module="…"` badge key in use. */
function findBadgeModuleKeysInComponents(): string[] {
  const keys: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        walk(full);
        continue;
      }
      if (!/\.(tsx|ts)$/.test(entry)) continue;
      const src = readFileSync(full, "utf8");
      for (const match of src.matchAll(/module="([a-z0-9-]+)"/g)) {
        keys.push(match[1]);
      }
    }
  };
  walk(COMPONENTS_DIR);
  return keys;
}

describe("module-status registry", () => {
  it("only contains the three documented statuses", () => {
    for (const status of Object.values(MODULE_STATUS)) {
      expect(MODULE_STATUSES).toContain(status);
    }
  });

  it("maps every documented-mock module (PF-012 list) to a non-live status", () => {
    for (const key of PF012_DOCUMENTED_MOCK_MODULES) {
      const status = getModuleStatus(key);
      expect(
        MODULE_STATUS[key],
        `PF-012 documents ${key} as mock/limited — registry must not say "live"`,
      ).toBeDefined();
      expect(status === "live", `${key} is documented as mock — got "${status}"`).toBe(false);
    }
  });

  it("maps every backend module with a `Future:` comment to a non-live status", () => {
    const futureModules = findFutureCommentedModules();
    // Sanity: the audit documented at least the four known Future: modules.
    expect(futureModules).toEqual(
      expect.arrayContaining(["edge", "plugin-hub", "mcp", "recipes"]),
    );

    for (const key of futureModules) {
      const status = getModuleStatus(key);
      expect(
        MODULE_STATUS[key],
        `backend-node module "${key}" carries a Future: comment — it must be registered`,
      ).toBeDefined();
      expect(status === "live", `${key} has a Future: comment — got "${status}"`).toBe(false);
    }
  });

  it("registers every module key used by badge components (no drift)", () => {
    const usedKeys = findBadgeModuleKeysInComponents();
    expect(usedKeys.length).toBeGreaterThanOrEqual(37); // the 37 backend-wired cards
    for (const key of new Set(usedKeys)) {
      expect(
        MODULE_STATUS[key],
        `component badge uses module="${key}" but the registry has no entry for it`,
      ).toBeDefined();
    }
  });

  it("resolves unknown module keys to a non-live status (fail honest)", () => {
    expect(getModuleStatus("definitely-not-a-module")).toBe("demo");
    expect(isModuleLive("definitely-not-a-module")).toBe(false);
  });

  it("keeps copy unambiguous: non-live statuses say \"not live\" and never reuse the Live label", () => {
    for (const status of MODULE_STATUSES) {
      const meta = MODULE_STATUS_META[status as ModuleStatus];
      if (status === "live") {
        expect(meta.label).toBe("Live");
        continue;
      }
      expect(meta.label).not.toBe("Live");
      expect(meta.description).toMatch(/not live/i);
    }
    expect(MODULE_STATUS_META.demo.text).toBe("Demo data — not live");
    expect(getModuleStatusMeta("mcp").text).toBe("Catalog only");
    expect(getModuleStatusMeta("mcp").label).toBe("Catalog");
  });

  it("covers both live and non-live lookups for coverage of every helper branch", () => {
    expect(isModuleLive("version")).toBe(true);
    expect(isModuleLive("analytics")).toBe(false);
    expect(getModuleStatusMeta("version").label).toBe("Live");
    expect(getModuleStatus("recipes")).toBe("catalog-only");
  });
});
