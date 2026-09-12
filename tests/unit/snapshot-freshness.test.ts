import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { effects } from "@/lib/roycss-effects";

/**
 * PF-049 — snapshot-freshness gate.
 *
 * The repo ships three copies of the effects catalog:
 *
 *   - `src/lib/roycss-effects.ts` (via the batch modules) — the SOURCE catalog;
 *   - `dist/effects.json` — the published npm payload (`roycss` package);
 *   - `mcp-server/effects.json` — the MCP server's runtime data.
 *
 * dist and mcp are build snapshots: nothing forces them to be regenerated
 * when `src` changes, so they can silently drift stale. This has happened
 * before — the retired CLI catalog snapshot sat 390 effects behind src until
 * it was dropped, and the MCP copy drifted in the fix/mcp-data-sync incident.
 * These tests pin the invariants so CI catches the drift instead of shipping it:
 *
 *   1. dist effect count == src effect count;
 *   2. dist ids == src ids (set equality, both directions);
 *   3. mcp-server/effects.json is byte-identical (md5) to dist/effects.json;
 *   4. the total count stays pinned at 1959 — lockstep with the pinned count
 *      in tests/unit/effects.test.ts (bump both together when the catalog grows).
 */

/** Repo root — derived from this test file (tests/unit/) so cwd doesn't matter. */
const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const DIST_EFFECTS_PATH = join(ROOT, "dist/effects.json");
const MCP_EFFECTS_PATH = join(ROOT, "mcp-server/effects.json");

/** The fields of dist/effects.json entries this gate needs. */
interface EffectSnapshot {
  id: string;
}

const distEffects: EffectSnapshot[] = JSON.parse(readFileSync(DIST_EFFECTS_PATH, "utf8"));
const srcIds = new Set(effects.map((e) => e.id));
const distIds = new Set(distEffects.map((e) => e.id));

/** md5 of a file's raw bytes — proves two snapshots are byte-identical. */
function md5(path: string): string {
  return createHash("md5").update(readFileSync(path)).digest("hex");
}

describe("snapshot freshness (PF-049)", () => {
  it("ships a dist snapshot with the same effect count as the src catalog", () => {
    expect(
      distEffects.length,
      "dist/effects.json is stale — run `bun run build:package` to regenerate it",
    ).toBe(effects.length);
  });

  it("ships a dist snapshot whose ids match the src catalog exactly (set equality)", () => {
    const missingFromDist = [...srcIds].filter((id) => !distIds.has(id));
    const extraInDist = [...distIds].filter((id) => !srcIds.has(id));
    expect(
      missingFromDist,
      `effects in src but missing from dist (stale snapshot): ${missingFromDist.slice(0, 10).join(", ")}`,
    ).toEqual([]);
    expect(
      extraInDist,
      `effects in dist but absent from src (stale snapshot): ${extraInDist.slice(0, 10).join(", ")}`,
    ).toEqual([]);
  });

  it("keeps mcp-server/effects.json byte-identical to dist/effects.json (sync hazard lock)", () => {
    // mcp-server/index.ts loads ./effects.json with a dist fallback chain;
    // a drifted local copy silently serves stale effect data to MCP clients.
    expect(md5(MCP_EFFECTS_PATH)).toBe(md5(DIST_EFFECTS_PATH));
  });

  it("pins the total catalog size at 1959 (lockstep with effects.test.ts)", () => {
    expect(effects.length).toBe(1959);
    expect(distEffects.length).toBe(1959);
  });
});
