/**
 * RoyCSS VSCode Extension — completion provider unit test
 *
 * This file is loaded by `runTest.ts`, which sets up the `vscode` mock
 * BEFORE requiring this file. The tests use dynamic `require()` calls to
 * load the code under test (rather than top-level `import` statements) so
 * that the mock is in place before the code under test runs.
 *
 * Run:  node ./out/tests/runTest.js
 */

import * as assert from "assert";
import type * as vscode from "vscode";

// ─── Load code under test (after the vscode mock is set up by runTest.ts) ───
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { RoyCSSCompletionProvider } = require("../src/completion-provider") as {
  RoyCSSCompletionProvider: new (recent: unknown) => vscode.CompletionItemProvider;
};
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { RecentlyUsed } = require("../src/recently-used") as {
  RecentlyUsed: new (ctx: unknown) => {
    list(): string[];
    record(className: string): void;
  };
};

const FAKE_EFFECTS_COUNT = 1569;

// ───────────────────────────────────────────────────────────────────────
// Minimal mocks for the vscode types the tests touch
// ───────────────────────────────────────────────────────────────────────

class MockMemento {
  private store = new Map<string, unknown>();
  get<T>(key: string, defaultValue: T): T {
    return this.store.has(key) ? (this.store.get(key) as T) : defaultValue;
  }
  async update(key: string, value: unknown): Promise<void> {
    this.store.set(key, value);
  }
}

class MockExtensionContext {
  workspaceState = new MockMemento();
  globalState = new MockMemento();
  subscriptions: { dispose(): unknown }[] = [];
  extensionPath = "/fake/extension/path";
  asAbsolutePath(p: string): string {
    return p;
  }
}

class MockTextDocument {
  private readonly lines: string[];
  readonly languageId: string;
  constructor(text: string, languageId = "html") {
    this.lines = text.split("\n");
    this.languageId = languageId;
  }
  lineAt(line: number): { text: string } {
    return { text: this.lines[line] || "" };
  }
  getText(): string {
    return this.lines.join("\n");
  }
}

class MockPosition {
  line: number;
  character: number;
  constructor(line: number, character: number) {
    this.line = line;
    this.character = character;
  }
}

// ───────────────────────────────────────────────────────────────────────
// Test runner
// ───────────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function runTest(name: string, fn: () => void): void {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed++;
    console.error(`  ✗ ${name}`);
    console.error(`    ${String((err as Error).message)}`);
    if (process.env.ROYCSS_TEST_VERBOSE) {
      console.error(`    ${String((err as Error).stack)}`);
    }
  }
}

console.log("RoyCSS VSCode Extension — completion test");
console.log("");

// ─── Test 1: provider returns >1000 items ───
runTest('returns >1000 completion items for class="roycss-"', () => {
  const ctx = new MockExtensionContext() as unknown as vscode.ExtensionContext;
  const recent = new RecentlyUsed(ctx);
  const provider = new RoyCSSCompletionProvider(recent);

  const doc = new MockTextDocument(
    `<div class="roycss-"></div>`,
    "html",
  ) as unknown as vscode.TextDocument;
  const pos = new MockPosition(0, 14) as unknown as vscode.Position;

  const result = provider.provideCompletionItems(
    doc,
    pos,
    {
      isCancellationRequested: false,
      onCancellationRequested: () => ({ dispose(): void {} }),
    } as unknown as vscode.CancellationToken,
    {
      triggerKind: 1,
      triggerCharacter: "-",
    } as unknown as vscode.CompletionContext,
  ) as { items: Array<{ label: string; insertText?: string; kind?: number; detail?: string }> };

  assert.ok(result, "provider must return a result");
  assert.ok(Array.isArray(result.items), "result.items must be an array");
  assert.ok(
    result.items.length > 1000,
    `expected >1000 items, got ${result.items.length}`,
  );
  assert.ok(
    result.items.length <= FAKE_EFFECTS_COUNT,
    `expected ≤${FAKE_EFFECTS_COUNT} items, got ${result.items.length}`,
  );
});

// ─── Test 2: items have the right shape ───
runTest("completion items have the correct shape", () => {
  const ctx = new MockExtensionContext() as unknown as vscode.ExtensionContext;
  const recent = new RecentlyUsed(ctx);
  const provider = new RoyCSSCompletionProvider(recent);

  const doc = new MockTextDocument(
    `<div class="roycss-"></div>`,
    "html",
  ) as unknown as vscode.TextDocument;
  const pos = new MockPosition(0, 14) as unknown as vscode.Position;

  const result = provider.provideCompletionItems(
    doc,
    pos,
    {
      isCancellationRequested: false,
      onCancellationRequested: () => ({ dispose(): void {} }),
    } as unknown as vscode.CancellationToken,
    {
      triggerKind: 1,
      triggerCharacter: "-",
    } as unknown as vscode.CompletionContext,
  ) as { items: Array<{ label: string; insertText?: string; kind?: number; detail?: string }> };

  const sample = result.items.slice(0, 5);
  for (const item of sample) {
    assert.ok(
      typeof item.label === "string" && item.label.startsWith(".roycss-"),
      `label must start with ".roycss-", got: ${item.label}`,
    );
    assert.ok(
      typeof item.insertText === "string" && item.insertText.startsWith("roycss-"),
      `insertText must start with "roycss-", got: ${item.insertText}`,
    );
    assert.strictEqual(item.kind, 7, "kind must be Class (7)");
    assert.ok(
      typeof item.detail === "string" && item.detail.length > 0,
      "detail must be a non-empty string",
    );
  }
});

// ─── Test 3: recently-used items are sorted first ───
runTest("recently-used items get sortText 0_ (so VSCode floats them to the top)", () => {
  const ctx = new MockExtensionContext() as unknown as vscode.ExtensionContext;
  const recent = new RecentlyUsed(ctx);
  // Record three classes as recently-used.
  recent.record("roycss-zoom-in");
  recent.record("roycss-pulse-glow");
  recent.record("roycss-fade-in-up");

  const provider = new RoyCSSCompletionProvider(recent);
  const doc = new MockTextDocument(
    `<div class="roycss-"></div>`,
    "html",
  ) as unknown as vscode.TextDocument;
  const pos = new MockPosition(0, 14) as unknown as vscode.Position;

  const result = provider.provideCompletionItems(
    doc,
    pos,
    {
      isCancellationRequested: false,
      onCancellationRequested: () => ({ dispose(): void {} }),
    } as unknown as vscode.CancellationToken,
    {
      triggerKind: 1,
      triggerCharacter: "-",
    } as unknown as vscode.CompletionContext,
  ) as { items: Array<{ label: string; insertText?: string; sortText?: string }> };

  // Simulate VSCode's sort by sortText (ascending).
  const sorted = [...result.items].sort((a, b) =>
    (a.sortText || "").localeCompare(b.sortText || ""),
  );
  const firstThree = sorted.slice(0, 3);

  // The first three (after sorting) should be the recently-used ones, in
  // most-recent-first order: fade-in-up, pulse-glow, zoom-in.
  const inserted = firstThree.map((i) => i.insertText);
  assert.deepStrictEqual(
    inserted,
    ["roycss-fade-in-up", "roycss-pulse-glow", "roycss-zoom-in"],
    `recently-used order should be most-recent first, got: ${JSON.stringify(inserted)}`,
  );

  // All non-recent items should have sortText starting with "1_".
  const nonRecent = sorted.slice(3);
  for (const item of nonRecent.slice(0, 5)) {
    assert.ok(
      item.sortText && item.sortText.startsWith("1_"),
      `non-recent item should have sortText "1_...", got: ${item.sortText}`,
    );
  }
});

// ─── Test 4: provider returns [] when cursor is not in a class context ───
runTest("returns [] when cursor is not in a class context", () => {
  const ctx = new MockExtensionContext() as unknown as vscode.ExtensionContext;
  const recent = new RecentlyUsed(ctx);
  const provider = new RoyCSSCompletionProvider(recent);

  // Cursor in the middle of <div>, not inside a class attribute.
  const doc = new MockTextDocument(
    `<div>Hello world</div>`,
    "html",
  ) as unknown as vscode.TextDocument;
  const pos = new MockPosition(0, 5) as unknown as vscode.Position;

  const result = provider.provideCompletionItems(
    doc,
    pos,
    {
      isCancellationRequested: false,
      onCancellationRequested: () => ({ dispose(): void {} }),
    } as unknown as vscode.CancellationToken,
    {
      triggerKind: 1,
      triggerCharacter: "",
    } as unknown as vscode.CompletionContext,
  );

  // The provider may return either `[]` (empty array) or
  // `CompletionList([], false)`. Both are valid "no completions" responses.
  if (Array.isArray(result)) {
    assert.strictEqual(result.length, 0, "expected empty array");
  } else {
    const list = result as { items: unknown[] };
    assert.ok(Array.isArray(list.items), "result.items must be an array");
    assert.strictEqual(list.items.length, 0, "expected 0 items outside a class context");
  }
});

// ─── Test 5: effects-data has 1569 entries (sanity check) ───
runTest("effects-data has 1569 entries", () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { effects } = require("../src/effects-data") as {
    effects: Array<{ id: string; name: string }>;
  };
  assert.strictEqual(effects.length, 1569, "effects must have exactly 1569 entries");
  // Verify no duplicate IDs.
  const ids = new Set(effects.map((e) => e.id));
  assert.strictEqual(ids.size, effects.length, "no duplicate IDs allowed");
});

// ─── Test 6: getCssCode returns a non-empty string for a known effect ───
runTest("getCssCode returns CSS for a known effect id", () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { getCssCode } = require("../src/effects-data") as {
    getCssCode: (id: string) => string | undefined;
  };
  const css = getCssCode("pulse-glow");
  assert.ok(typeof css === "string", "css must be a string");
  assert.ok(css && css.length > 0, "css must be non-empty");
  assert.ok(
    css && css.includes(".roycss-pulse-glow"),
    "css must reference .roycss-pulse-glow",
  );
});

console.log("");
console.log(`Result: ${passed} passed, ${failed} failed.`);
if (failed > 0) {
  process.exitCode = 1;
  console.error("❌ Some tests failed.");
} else {
  console.log("✅ All tests passed.");
}
