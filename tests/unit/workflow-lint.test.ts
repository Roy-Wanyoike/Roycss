/**
 * Unit tests — workflow trigger lint (audit F-09 guard).
 *
 * The guard exists because a mangled `branches:` value (e.g. a flow
 * list with the opening `[` eaten) still parses as valid YAML — GitHub
 * Actions accepts it, and the workflow silently never runs. These tests
 * pin the accepted/rejected shapes AND run the guard against the
 * repo's committed workflows so a future mangle fails the suite.
 */
import { describe, expect, it } from "vitest";

import {
  WORKFLOWS_DIR,
  lintWorkflowFiles,
  lintWorkflowTriggers,
  validateTriggerValue,
} from "../../scripts/check-workflows.js";

describe("workflow trigger lint — value shapes (audit F-09)", () => {
  it("accepts the sane forms used across the repo's workflows", () => {
    const sane = [
      "[main]",
      '["main", "develop"]',
      "main",
      "release/*",
      '["v*"]',
      "[opened, synchronize]",
      "['main']", // single-quoted flow list is also valid YAML
      '"CI"',
      '["CI"]',
      "backend-node/src/modules/**", // paths-style glob in a bare value
      "[main],", // trailing comma from comment stripping is tolerated
    ];
    for (const value of sane) {
      expect(validateTriggerValue(value), `expected sane: ${value}`).toBeNull();
    }
  });

  it("rejects the mangled forms (the F-09 typo class)", () => {
    const mangled = [
      "ain]", // the historical typo shape — opener eaten
      "[main", // closer eaten
      "main]", // stray closer
      "ma[in]", // brackets mid-value
      "[main]]", // extra closer
      "]main[", // inverted
      "main extra", // space in a bracket-free scalar
    ];
    for (const value of mangled) {
      expect(
        validateTriggerValue(value),
        `expected rejection: ${value}`,
      ).not.toBeNull();
    }
  });

  it("flags the historical mangle with file + line numbers", () => {
    const violations = lintWorkflowTriggers(
      ["name: broken", "on:", "  pull_request:", "    branches: ain]"],
      "broken.yml",
    );
    expect(violations).toHaveLength(1);
    expect(violations[0]!.file).toBe("broken.yml");
    expect(violations[0]!.line).toBe(4);
    expect(violations[0]!.reason).toContain("unbalanced");
  });

  it("validates multi-line list items too", () => {
    const violations = lintWorkflowTriggers(
      ["on:", "  push:", "    tags:", "      - ain]", "      - v*"],
      "broken.yml",
    );
    expect(violations).toHaveLength(1);
    expect(violations[0]!.line).toBe(4);
  });

  it("ignores non-trigger keys with the same spelling elsewhere", () => {
    const violations = lintWorkflowTriggers(
      ["on:", "  push:", "    branches: [main]", "jobs:", "  build:", "    steps: []"],
      "clean.yml",
    );
    expect(violations).toEqual([]);
  });
});

describe("workflow trigger lint — the committed workflows", () => {
  it("passes on every .github/workflows/*.yml in the repo", () => {
    const { files, violations } = lintWorkflowFiles(WORKFLOWS_DIR);
    // The four known workflows: ci, deploy, lighthouse, release
    // (+ any added later — the guard lints whatever is committed).
    expect(files.length).toBeGreaterThanOrEqual(4);
    expect(violations).toEqual([]);
  });
});
