/**
 * RoyCSS Inspector — content-script scan unit test.
 *
 * Pure-JS test that stubs a fake DOM (no JSDOM dependency) and exercises
 * the `scan()` function exported from content-script.js via
 * globalThis.__roycssInspector.
 *
 * Run: bun test inspector/tests/content.test.js
 *   or: node --test inspector/tests/content.test.js
 *
 * The test loads content-script.js in a sandbox that stubs:
 *   - `document` with a fake querySelectorAll
 *   - `performance` with a stub
 *   - `chrome` undefined (so the entry-point IIFE is skipped)
 *   - `window` undefined (so pagehide listener is skipped)
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/* ─── Test framework shim ─────────────────────────────────── */
/* Use bun:test if available; fall back to node:test. */

let test, expect;
try {
  const bun = await import("bun:test");
  test = bun.test;
  expect = bun.expect;
} catch (_e) {
  const node = await import("node:test");
  test = (name, fn) => node.test(name, fn);
  expect = (actual) => ({
    toBe: (expected) => {
      if (actual !== expected) {
        throw new Error(`expected ${JSON.stringify(actual)} to be ${JSON.stringify(expected)}`);
      }
    },
    toEqual: (expected) => {
      const a = JSON.stringify(actual);
      const b = JSON.stringify(expected);
      if (a !== b) throw new Error(`expected ${a} to equal ${b}`);
    },
    toBeGreaterThan: (n) => {
      if (!(actual > n)) throw new Error(`expected ${actual} to be > ${n}`);
    },
    toContain: (s) => {
      if (typeof actual !== "string" || actual.indexOf(s) === -1) {
        throw new Error(`expected ${JSON.stringify(actual)} to contain ${JSON.stringify(s)}`);
      }
    },
  });
}

/* ─── Stub DOM ────────────────────────────────────────────── */

function makeEl(cls, ancestors = []) {
  const el = {
    nodeType: 1,
    tagName: "DIV",
    _cls: cls,
    parentElement: null,
    getAttribute(name) {
      return name === "class" ? this._cls : null;
    },
    getBoundingClientRect() {
      return { left: 0, top: 0, width: 100, height: 50 };
    },
  };
  let cursor = el;
  for (const tag of ancestors) {
    const parent = {
      nodeType: 1,
      tagName: tag,
      parentElement: null,
      children: [cursor],
    };
    cursor.parentElement = parent;
    cursor = parent;
  }
  return el;
}

function makeDoc(elements) {
  return {
    querySelectorAll(sel) {
      if (sel === '[class*="roycss-"]') return elements.slice();
      return [];
    },
  };
}

/* ─── Load content-script in a stubbed global context ─────── */

function loadContentScript(documentStub) {
  const sandbox = {
    document: documentStub,
    performance: { now: () => Date.now() },
    setTimeout: () => 0,
    clearTimeout: () => {},
    WeakSet,
    Map,
    Set,
    Array,
    Date,
    Math,
    JSON,
    RegExp,
    Error,
    console,
    globalThis: {},
  };
  sandbox.globalThis = sandbox;
  sandbox.window = undefined;
  sandbox.chrome = undefined;

  const src = readFileSync(join(__dirname, "..", "content-script.js"), "utf8");
  const keys = Object.keys(sandbox);
  const vals = Object.values(sandbox);
  // Use `new Function` here ONLY in the test harness. The content script
  // itself never uses eval/Function — see REVIEW-CHECKLIST.md item 6.
  const factory = new Function(
    ...keys,
    `"use strict";\n${src}\nreturn globalThis.__roycssInspector;`,
  );
  return factory(...vals);
}

/* ─── Tests ───────────────────────────────────────────────── */

test("scan() returns empty result for empty DOM", async () => {
  const api = await loadContentScript(makeDoc([]));
  const result = api.scan(makeDoc([]));
  expect(result.count).toBe(0);
  expect(result.uniqueEffectCount).toBe(0);
  expect(result.effects.length).toBe(0);
  expect(result.ok).toBe(true);
});

test("scan() finds a single roycss-* class", async () => {
  const api = await loadContentScript(makeDoc([makeEl("roycss-pulse-glow")]));
  const result = api.scan();
  expect(result.count).toBe(1);
  expect(result.uniqueEffectCount).toBe(1);
  expect(result.effects[0].id).toBe("pulse-glow");
  expect(result.effects[0].className).toBe("roycss-pulse-glow");
  expect(result.effects[0].count).toBe(1);
});

test("scan() handles multiple roycss-* classes on one element", async () => {
  const api = await loadContentScript(
    makeDoc([makeEl("foo roycss-pulse-glow bar roycss-bounce-in")]),
  );
  const result = api.scan();
  expect(result.count).toBe(2);
  expect(result.uniqueEffectCount).toBe(2);
});

test("scan() counts duplicate effect ids across elements", async () => {
  const api = await loadContentScript(
    makeDoc([makeEl("roycss-arrow"), makeEl("roycss-arrow"), makeEl("roycss-arrow")]),
  );
  const result = api.scan();
  expect(result.count).toBe(3);
  expect(result.uniqueEffectCount).toBe(1);
  expect(result.effects[0].id).toBe("arrow");
  expect(result.effects[0].count).toBe(3);
});

test("scan() sorts effects by count desc then id asc", async () => {
  const api = await loadContentScript(
    makeDoc([
      makeEl("roycss-aaa"),
      makeEl("roycss-bbb"),
      makeEl("roycss-bbb"),
      makeEl("roycss-ccc"),
      makeEl("roycss-ccc"),
      makeEl("roycss-ccc"),
    ]),
  );
  const result = api.scan();
  expect(result.effects.map((e) => e.id)).toEqual(["ccc", "bbb", "aaa"]);
});

test("scan() ignores non-roycss classes", async () => {
  const api = await loadContentScript(
    makeDoc([
      makeEl("button primary"),
      makeEl("roycss-pulse-glow"),
      makeEl("card hover"),
    ]),
  );
  const result = api.scan();
  expect(result.count).toBe(1);
  expect(result.effects[0].id).toBe("pulse-glow");
});

test("scan() skips ids longer than MAX_ID_LEN (64)", async () => {
  const longId = "a".repeat(65);
  const api = await loadContentScript(makeDoc([makeEl(`roycss-${longId}`)]));
  const result = api.scan();
  expect(result.count).toBe(0);
});

test("scan() skips empty roycss- prefix", async () => {
  const api = await loadContentScript(makeDoc([makeEl("roycss-")]));
  const result = api.scan();
  expect(result.count).toBe(0);
});

test("scan() caps samples per effect at 5", async () => {
  const api = await loadContentScript(
    makeDoc(Array.from({ length: 10 }, () => makeEl("roycss-arrow"))),
  );
  const result = api.scan();
  expect(result.effects[0].count).toBe(10);
  expect(result.effects[0].samples.length).toBe(5);
});

test("buildSamplePath returns a > -joined path of tag names", async () => {
  const api = await loadContentScript(makeDoc([]));
  const el = makeEl("roycss-pulse-glow", ["BODY", "HTML"]);
  const path = api.buildSamplePath(el);
  expect(path).toContain("HTML");
  expect(path).toContain("BODY");
});

test("ROYCSS_CLASS_RE matches roycss-* tokens", async () => {
  const api = await loadContentScript(makeDoc([]));
  const re = api.ROYCSS_CLASS_RE;
  re.lastIndex = 0;
  const m = re.exec("foo roycss-pulse-glow bar");
  expect(m[1]).toBe("pulse-glow");
});

test("scan() handles the live localhost:3000 dataset shape", async () => {
  // Simulate the top 5 effects observed on localhost:3000 via agent-browser:
  // arrow (13), faq-item (7), faq-trigger (7), faq-chevron (7), faq-content (7)
  const api = await loadContentScript(
    makeDoc([
      ...Array.from({ length: 13 }, () => makeEl("roycss-arrow")),
      ...Array.from({ length: 7 }, () => makeEl("roycss-faq-item")),
      ...Array.from({ length: 7 }, () => makeEl("roycss-faq-trigger")),
      ...Array.from({ length: 7 }, () => makeEl("roycss-faq-chevron")),
      ...Array.from({ length: 7 }, () => makeEl("roycss-faq-content")),
    ]),
  );
  const result = api.scan();
  expect(result.count).toBe(41);
  expect(result.uniqueEffectCount).toBe(5);
  expect(result.effects[0].id).toBe("arrow");
  expect(result.effects[0].count).toBe(13);
  // The next four all have count=7; tiebreak is id asc.
  expect(result.effects[1].id).toBe("faq-chevron");
  expect(result.effects[2].id).toBe("faq-content");
  expect(result.effects[3].id).toBe("faq-item");
  expect(result.effects[4].id).toBe("faq-trigger");
});

/* ─── Summary ─────────────────────────────────────────────── */

console.log("[content.test.js] All tests registered.");
