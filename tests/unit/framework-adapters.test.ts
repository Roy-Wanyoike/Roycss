import { describe, it, expect } from "vitest";
import {
  getFrameworkExamples,
  frameworkLabels,
  defaultFrameworkExamples,
  type FrameworkExample,
  type FrameworkId,
} from "@/lib/framework-adapters";

const EXPECTED_FRAMEWORKS: FrameworkId[] = [
  "vanilla",
  "react",
  "vue",
  "angular",
  "svelte",
  "nextjs",
];

/**
 * The framework-adapters module is the copy-paste surface every developer
 * hits first when integrating RoyCSS. If a framework is missing or its usage
 * snippet doesn't reference the right class, the developer bounces.
 */
describe("getFrameworkExamples", () => {
  it("returns exactly 6 framework examples", () => {
    const examples = getFrameworkExamples("btn-shine", "Shine Button");
    expect(examples).toHaveLength(6);
  });

  it("returns one example per expected FrameworkId", () => {
    const examples = getFrameworkExamples("btn-shine", "Shine Button");
    const ids = examples.map((e) => e.id);
    expect(ids.sort()).toEqual([...EXPECTED_FRAMEWORKS].sort());
  });

  it("gives every example a non-empty install, import, and usage snippet", () => {
    const examples = getFrameworkExamples("btn-shine", "Shine Button");
    for (const ex of examples) {
      expect(ex.install.trim().length, `empty install in ${ex.id}`).toBeGreaterThan(0);
      expect(ex.import.trim().length, `empty import in ${ex.id}`).toBeGreaterThan(0);
      expect(ex.usage.trim().length, `empty usage in ${ex.id}`).toBeGreaterThan(0);
      expect(ex.label.trim().length, `empty label in ${ex.id}`).toBeGreaterThan(0);
      expect(ex.description.trim().length, `empty description in ${ex.id}`).toBeGreaterThan(0);
    }
  });

  it("embeds the `.roycss-<effectId>` class in every usage snippet", () => {
    const effectId = "btn-shine";
    const examples = getFrameworkExamples(effectId, "Shine Button");
    const expectedClass = `.roycss-${effectId}`.slice(1); // strip leading dot for substring check
    for (const ex of examples) {
      // The class may appear as `class="roycss-<id>"` or `className="roycss-<id>"`.
      expect(ex.usage, `${ex.id} usage missing roycss-${effectId}`).toContain(expectedClass);
    }
  });

  it("uses the canonical effect name (sanitized) inside the usage snippet", () => {
    const examples = getFrameworkExamples("btn-shine", "Shine Button");
    for (const ex of examples) {
      expect(ex.usage).toContain("Shine Button");
    }
  });

  it("strips HTML-unsafe characters from the effect name in the usage snippet", () => {
    const malicious = `<script>alert("x")</script>`;
    const examples = getFrameworkExamples("btn-x", malicious);
    for (const ex of examples) {
      // The sanitization regex /[<>"'`]/g strips angle brackets, quotes, and
      // backticks from the effect NAME. The Vue framework template legitimately
      // contains `<script setup lang="ts">…</script>` tags — those are
      // framework syntax, not user input, so we must NOT assert they're
      // absent. Instead we assert the malicious payload (with its quotes) is
      // gone: the literal `alert("x")` should never appear because the
      // double-quotes are stripped.
      expect(ex.usage).not.toContain('alert("x")');
      expect(ex.usage).not.toContain("alert('x')");
      // The sanitized button text should be `scriptalert(x)/script`.
      expect(ex.usage).toContain("scriptalert(x)/script");
    }
  });

  it("returns examples whose labels match the frameworkLabels map", () => {
    const examples = getFrameworkExamples("btn-shine", "Shine Button");
    for (const ex of examples) {
      expect(ex.label).toBe(frameworkLabels[ex.id]);
    }
  });
});

describe("frameworkLabels", () => {
  it("has an entry for every expected FrameworkId", () => {
    for (const id of EXPECTED_FRAMEWORKS) {
      expect(frameworkLabels[id], `missing label for ${id}`).toBeDefined();
      expect(frameworkLabels[id].length).toBeGreaterThan(0);
    }
  });

  it("uses unique labels (dropdown labels must not collide)", () => {
    const labels = Object.values(frameworkLabels);
    expect(new Set(labels).size).toBe(labels.length);
  });
});

describe("defaultFrameworkExamples", () => {
  it("is a non-empty array of FrameworkExample objects", () => {
    expect(Array.isArray(defaultFrameworkExamples)).toBe(true);
    expect(defaultFrameworkExamples.length).toBe(6);
    for (const ex of defaultFrameworkExamples) {
      const _typecheck: FrameworkExample = ex;
      expect(_typecheck.id).toBeDefined();
    }
  });

  it("embeds the `.roycss-btn-shine` class in every usage snippet", () => {
    for (const ex of defaultFrameworkExamples) {
      expect(ex.usage).toContain("roycss-btn-shine");
    }
  });
});

describe("framework coverage matrix", () => {
  // Sanity matrix: for each (framework, field) pair, the example must mention
  // a recognizable install/import token so a developer copying the snippet
  // actually lands on a working setup.
  const matrix: Array<{ id: FrameworkId; field: "install" | "import"; needle: string }> = [
    { id: "vanilla", field: "install", needle: "roycss" },
    { id: "vanilla", field: "import", needle: "roycss" },
    { id: "react", field: "install", needle: "npm install" },
    { id: "react", field: "import", needle: "roycss/dist" },
    { id: "vue", field: "import", needle: "createApp" },
    { id: "angular", field: "import", needle: "angular.json" },
    { id: "svelte", field: "import", needle: "roycss/dist" },
    { id: "nextjs", field: "import", needle: "layout.tsx" },
  ];

  it("matches the expected install/import patterns per framework", () => {
    const examples = getFrameworkExamples("btn-shine", "Shine Button");
    const byId = new Map(examples.map((e) => [e.id, e]));
    for (const { id, field, needle } of matrix) {
      const ex = byId.get(id);
      expect(ex, `no example for ${id}`).toBeDefined();
      expect(ex![field], `${id}.${field} missing needle "${needle}"`).toContain(needle);
    }
  });
});
