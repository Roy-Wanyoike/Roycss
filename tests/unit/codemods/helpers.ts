/**
 * helpers.ts — shared test machinery for the codemod suite (PF-015, issue #95)
 *
 * Every codemod must pass the same six-fixture standard suite: a golden
 * fixture transform, unknown-class safety, a no-op case, idempotency,
 * byte-exact whitespace preservation and engine/reporter integration.
 * Codemod-specific semantics live in the per-codemod test files.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";

import type { CodemodDefinition } from "../../../scripts/codemods/lib/engine";
import { runCodemodOnFiles } from "../../../scripts/codemods/lib/engine";
import { formatFileReport, formatSummary } from "../../../scripts/codemods/lib/reporter";

export const FIXTURES_DIR = join(__dirname, "fixtures");

/** Read a fixture file from tests/unit/codemods/fixtures/. */
export function fixture(name: string): string {
  return readFileSync(join(FIXTURES_DIR, name), "utf-8");
}

export interface StandardSuiteSpec {
  def: CodemodDefinition;
  /** Golden input / expected-output fixture file names. */
  inputFixture: string;
  expectedFixture: string;
  /** One concrete table entry used for surgical assertions. */
  sample: { from: string; to: string };
  /**
   * A class that must land in the `unknown` bucket. Inbound codemods report
   * any unmapped class; outbound codemods report only unknown `roycss-*`.
   */
  unknownClass: string;
}

/**
 * The standard six-fixture suite every codemod must pass (issue #95
 * acceptance: golden output, unknown-class safety, no-op, idempotency,
 * whitespace preservation, reporter integration).
 */
export function standardCodemodSuite(spec: StandardSuiteSpec): void {
  const { def, inputFixture, expectedFixture, sample, unknownClass } = spec;

  describe(`${def.id} — standard codemod suite (issue #95)`, () => {
    it("1. golden fixture: transforms the corpus exactly as pinned", () => {
      const result = def.transform(fixture(inputFixture));
      expect(result.output).toBe(fixture(expectedFixture));
      expect(result.replaced.length).toBeGreaterThan(0);
    });

    it("2. unknown classes are never transformed and always reported", () => {
      const src = `<div class="${unknownClass} plain-token">x</div>`;
      const result = def.transform(src);
      expect(result.output).toBe(src);
      expect(result.unknown).toContain(unknownClass);
      expect(result.replaced).toEqual([]);
    });

    it("3. no-op: markup without recognized classes is returned unchanged", () => {
      const src = `<main class="hero wrapper"><p>plain markup</p></main>`;
      const result = def.transform(src);
      expect(result.output).toBe(src);
      expect(result.replaced).toEqual([]);
      expect(result.unknown.length + result.ignored.length).toBeGreaterThan(0);
    });

    it("4. idempotency: running the codemod twice yields the same output", () => {
      const once = def.transform(fixture(inputFixture));
      const twice = def.transform(once.output);
      expect(twice.output).toBe(once.output);
      expect(twice.replaced).toEqual([]);
    });

    it("5. whitespace inside class attributes is preserved byte-for-byte", () => {
      const src = `<div class="  ${sample.from}\n\t${sample.from}  ${sample.from}">x</div>`;
      const result = def.transform(src);
      expect(result.output).toBe(
        `<div class="  ${sample.to}\n\t${sample.to}  ${sample.to}">x</div>`,
      );
    });

    it("6. engine + reporter: dry-run produces per-file report and summary", () => {
      const file = join(FIXTURES_DIR, inputFixture);
      const { reports, summary } = runCodemodOnFiles(def, [file], { write: false });
      expect(reports).toHaveLength(1);
      expect(reports[0].changed).toBe(true);
      expect(summary.codemod).toBe(def.id);
      expect(summary.files).toBe(1);
      expect(summary.filesChanged).toBe(1);
      expect(summary.classesReplaced).toBeGreaterThan(0);
      expect(summary.wrote).toBe(false);
      const fileReport = formatFileReport(reports[0], true);
      expect(fileReport).toContain(`${file} — changed`);
      expect(fileReport).toMatch(/✓ .+ → .+/);
      expect(formatSummary(summary)).toContain(`migrate ${def.id}: 1 file scanned, 1 changed`);
      // dry-run must not modify the fixture on disk
      expect(readFileSync(file, "utf-8")).toBe(fixture(inputFixture));
    });
  });
}
