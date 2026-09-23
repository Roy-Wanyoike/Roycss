/**
 * Unit tests — the boot-time `.env` loader (issue #208).
 *
 *   1. parseDotenv — comments, blank lines, `export`, quotes, inline
 *      comments, CRLF, malformed lines are skipped (never thrown),
 *   2. applyDotenv — shell environment wins over the file,
 *   3. loadDotenv — missing `.env` is a silent no-op; a present file
 *      lands in the target.
 *
 * The loader runs as the first import of src/index.ts; these tests pin
 * the contract it must uphold for `cp .env.example .env && bun run dev`
 * to boot (issue #208's acceptance criterion).
 */
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  applyDotenv,
  loadDotenv,
  parseDotenv,
} from "../../src/config/dotenv.js";

describe("parseDotenv (issue #208)", () => {
  it("1. parses KEY=VALUE, skipping comments and blank lines", () => {
    expect(
      parseDotenv(
        [
          "# ─── Server ───",
          "",
          "PORT=4000",
          "LOG_LEVEL=info",
        ].join("\n"),
      ),
    ).toEqual([
      ["PORT", "4000"],
      ["LOG_LEVEL", "info"],
    ]);
  });

  it("2. strips an optional `export ` prefix", () => {
    expect(parseDotenv("export PORT=4000")).toEqual([["PORT", "4000"]]);
  });

  it("3. strips matching surrounding quotes (single and double)", () => {
    expect(
      parseDotenv('DATABASE_URL="file:./dev.db"\nMAIL_FROM=\'RoyCSS <x@y.z>\''),
    ).toEqual([
      ["DATABASE_URL", "file:./dev.db"],
      ["MAIL_FROM", "RoyCSS <x@y.z>"],
    ]);
  });

  it("4. drops inline comments outside quotes", () => {
    expect(parseDotenv("PORT=4000 # dev port\nNODE_ENV=development#no-space")).toEqual([
      ["PORT", "4000"],
      // A `#` without a leading space is part of the value — shell-style.
      ["NODE_ENV", "development#no-space"],
    ]);
  });

  it("5. handles CRLF line endings", () => {
    expect(parseDotenv("PORT=4000\r\nLOG_LEVEL=info\r\n")).toEqual([
      ["PORT", "4000"],
      ["LOG_LEVEL", "info"],
    ]);
  });

  it("6. skips malformed lines instead of throwing", () => {
    expect(
      parseDotenv("no-equals-sign\n=empty-key\n1BAD=no\nGOOD=1"),
    ).toEqual([["GOOD", "1"]]);
  });
});

describe("applyDotenv (issue #208)", () => {
  it("7. never overrides variables already present (shell wins)", () => {
    const target: Record<string, string | undefined> = {
      DATABASE_URL: "from-the-shell",
    };
    applyDotenv(
      [
        ["DATABASE_URL", "file:./dev.db"],
        ["JWT_SECRET", "from-the-file"],
      ],
      target,
    );
    expect(target.DATABASE_URL).toBe("from-the-shell");
    expect(target.JWT_SECRET).toBe("from-the-file");
  });
});

describe("loadDotenv (issue #208)", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "dotenv-test-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("8. is a silent no-op when .env is missing (fresh clone)", () => {
    const target: Record<string, string | undefined> = {};
    expect(() => loadDotenv(dir, target)).not.toThrow();
    expect(target).toEqual({});
  });

  it("9. loads a present .env from the given cwd into the target", () => {
    writeFileSync(join(dir, ".env"), "PORT=4321\nJWT_SECRET=\"abc\"\n");
    const target: Record<string, string | undefined> = {};
    loadDotenv(dir, target);
    expect(target.PORT).toBe("4321");
    expect(target.JWT_SECRET).toBe("abc");
  });

  it("10. a shell-provided value beats the file (end-to-end precedence)", () => {
    writeFileSync(join(dir, ".env"), "PORT=4321\n");
    const target: Record<string, string | undefined> = { PORT: "5432" };
    loadDotenv(dir, target);
    expect(target.PORT).toBe("5432");
  });
});
