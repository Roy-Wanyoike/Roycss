/**
 * Test runner — sets up the `vscode` mock BEFORE requiring the test files,
 * so that when the test file imports the code under test, the code under
 * test sees our mock `vscode` module instead of trying to load the real
 * one (which is only available inside the VSCode extension host).
 *
 * Run:  node ./out/tests/runTest.js
 */

// ─── Mock the `vscode` module ───
// This must happen BEFORE any code under test is required, because
// TypeScript compiles `import` statements to top-level `require()` calls
// that run immediately when the module is loaded. If we set up the mock
// inside the test file, the import statements in that file will have
// already tried (and failed) to load the real `vscode` module.

const FAKE_VSCODE_PATH = "/__mock__/vscode.js";

const vscodeMock = {
  CompletionItem: class MockCompletionItem {
    label: string;
    kind?: number;
    detail?: string;
    documentation?: unknown;
    insertText?: string;
    filterText?: string;
    sortText?: string;
    tags?: number[];
    constructor(label: string, kind?: number) {
      this.label = label;
      if (kind !== undefined) this.kind = kind;
    }
  },
  CompletionItemKind: {
    Class: 7,
    Method: 1,
    Function: 3,
    Variable: 4,
  } as Record<string, number>,
  CompletionItemTag: { Deprecated: 1 } as Record<string, number>,
  CompletionList: class MockCompletionList {
    items: unknown[];
    isIncomplete: boolean;
    constructor(items: unknown[], isIncomplete = false) {
      this.items = items;
      this.isIncomplete = isIncomplete;
    }
  },
  MarkdownString: class MockMarkdownString {
    value = "";
    isTrusted = false;
    supportThemeIcons = false;
    appendMarkdown(s: string): this {
      this.value += s;
      return this;
    }
  },
  workspace: {
    getConfiguration(section: string): {
      get<T>(key: string, defaultValue: T): T;
    } {
      const values: Record<string, unknown> =
        section === "roycss"
          ? {
              maxCompletionItems: 1569,
              recentlyUsedLimit: 50,
              enableHoverPreview: true,
              hoverLinkTarget: "roycss.com",
            }
          : {};
      return {
        get<T>(key: string, defaultValue: T): T {
          return key in values ? (values[key] as T) : defaultValue;
        },
      };
    },
  },
  window: {
    createOutputChannel(): { appendLine(_s: string): void } {
      return { appendLine: () => {} };
    },
  },
  Disposable: class {
    static from(..._disps: unknown[]): { dispose(): void } {
      return { dispose: () => {} };
    }
  },
};

// Install the mock by patching Node's module loader.
const Module = require("module");
const origResolveFilename = Module._resolveFilename;
Module._resolveFilename = function (
  request: string,
  parent: unknown,
  isMain?: boolean,
  options?: unknown,
): string {
  if (request === "vscode") {
    return FAKE_VSCODE_PATH;
  }
  return origResolveFilename.call(this, request, parent, isMain, options);
};
Module._cache[FAKE_VSCODE_PATH] = {
  exports: vscodeMock,
  loaded: true,
  id: FAKE_VSCODE_PATH,
  path: "/__mock__",
  filename: FAKE_VSCODE_PATH,
  children: [],
  paths: [],
  require: require,
};

// ─── Now load the test files (they will see our mock vscode) ───
require("./completion.test");
