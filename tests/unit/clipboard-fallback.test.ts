import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  copyTextToClipboard,
  selectElementText,
  CLIPBOARD_FAILED_MESSAGE,
  CLIPBOARD_FAILED_RESET_MS,
} from "@/lib/clipboard";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { CopyButton } from "@/components/roycss/copy-button";

/**
 * Clipboard-failure UX fallback (P3 residual from the QA rounds, noted on
 * the recipes handleCopy). Pinned at three levels, mirroring the repo's
 * test rigor (cf. framework-tabs.test.ts):
 *
 *   1. behavioral — the shared util with mocked navigator/document:
 *      success path unchanged; Clipboard API rejects → legacy textarea +
 *      execCommand fallback invoked with the payload; BOTH fail → `false`
 *      (so the UI shows its "Copy failed" state); API absent → fallback;
 *      execCommand throwing → false with the textarea still removed.
 *   2. structural — renderToStaticMarkup passes asserting the always-on
 *      polite status region (role=status + aria-live=polite) exists in the
 *      idle DOM of the docs CodeBlock and the shared CopyButton.
 *   3. source-level wiring — the recipes button (the QA residual), the
 *      docs CodeBlock, CopyButton and the Copy-as hook all route through
 *      the shared helper, select the payload on total failure, auto-reset,
 *      and keep the success machine ("Copied!" + 2s) byte-for-byte.
 */

const ROOT = join(__dirname, "..", "..");
const PAYLOAD = ".roycss-hero-glow { /* recipe html */ }";

/* ─── 1. Behavioral: copyTextToClipboard ────────────────────── */

interface FakeTextarea {
  value: string;
  style: Record<string, string>;
  attributes: Record<string, string>;
  selectCalls: number;
  ranges: Array<[number, number]>;
  setAttribute(key: string, value: string): void;
  select(): void;
  setSelectionRange(start: number, end: number): void;
}

/** Stub window/document with a programmable execCommand; returns spies. */
function stubBrowserDom(
  options: { execCommand?: (command: string) => boolean } = {},
) {
  const created: FakeTextarea[] = [];
  const appended: FakeTextarea[] = [];
  const removed: FakeTextarea[] = [];
  const execCommandCalls: string[] = [];
  const document = {
    createElement(tag: string): FakeTextarea {
      const el: FakeTextarea = {
        value: "",
        style: {},
        attributes: {},
        selectCalls: 0,
        ranges: [],
        setAttribute(key, value) {
          el.attributes[key] = value;
        },
        select() {
          el.selectCalls += 1;
        },
        setSelectionRange(start, end) {
          el.ranges.push([start, end]);
        },
      };
      created.push(el);
      return el;
    },
    body: {
      appendChild(node: FakeTextarea) {
        appended.push(node);
      },
      removeChild(node: FakeTextarea) {
        removed.push(node);
      },
    },
    execCommand(command: string): boolean {
      execCommandCalls.push(command);
      return options.execCommand ? options.execCommand(command) : true;
    },
  };
  vi.stubGlobal("window", {});
  vi.stubGlobal("document", document);
  return { created, appended, removed, execCommandCalls };
}

function stubClipboard(writeText: (text: string) => Promise<void>) {
  const writeTextMock = vi.fn(writeText);
  vi.stubGlobal("navigator", { clipboard: { writeText: writeTextMock } });
  return writeTextMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("copyTextToClipboard (shared util)", () => {
  it("Clipboard API resolves → true; the legacy path is never touched (success path unchanged)", async () => {
    const dom = stubBrowserDom();
    const writeText = stubClipboard(async () => undefined);

    await expect(copyTextToClipboard(PAYLOAD)).resolves.toBe(true);

    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith(PAYLOAD);
    expect(dom.created).toHaveLength(0);
    expect(dom.execCommandCalls).toHaveLength(0);
  });

  it("Clipboard API rejects (NotAllowedError) → execCommand fallback invoked with the payload", async () => {
    const dom = stubBrowserDom();
    const writeText = stubClipboard(async () => {
      throw new DOMException("denied", "NotAllowedError");
    });

    await expect(copyTextToClipboard(PAYLOAD)).resolves.toBe(true);

    expect(writeText).toHaveBeenCalledTimes(1);
    // Exactly one off-screen textarea was created, fed, selected, used, removed.
    expect(dom.created).toHaveLength(1);
    const ta = dom.created[0];
    expect(ta.value).toBe(PAYLOAD);
    expect(ta.attributes.readonly).toBe("");
    expect(ta.style.position).toBe("fixed");
    expect(ta.style.inlineSize).toBe("1px");
    expect(ta.style.insetBlockStart).toBe("-9999px");
    expect(ta.style.opacity).toBe("0");
    expect(ta.selectCalls).toBe(1);
    expect(ta.ranges).toEqual([[0, PAYLOAD.length]]);
    expect(dom.execCommandCalls).toEqual(["copy"]);
    expect(dom.appended).toContain(ta);
    expect(dom.removed).toContain(ta);
  });

  it("Clipboard API absent (navigator.clipboard undefined) → falls back to execCommand", async () => {
    const dom = stubBrowserDom();
    vi.stubGlobal("navigator", {});

    await expect(copyTextToClipboard(PAYLOAD)).resolves.toBe(true);
    expect(dom.execCommandCalls).toEqual(["copy"]);
  });

  it("writeText missing (clipboard object without the method) → falls back to execCommand", async () => {
    const dom = stubBrowserDom();
    vi.stubGlobal("navigator", { clipboard: {} });

    await expect(copyTextToClipboard(PAYLOAD)).resolves.toBe(true);
    expect(dom.execCommandCalls).toEqual(["copy"]);
  });

  it("BOTH paths fail (writeText rejects + execCommand false) → false, so the UI shows its failed state", async () => {
    const dom = stubBrowserDom({ execCommand: () => false });
    stubClipboard(async () => {
      throw new DOMException("denied", "NotAllowedError");
    });

    await expect(copyTextToClipboard(PAYLOAD)).resolves.toBe(false);
    // The fallback was still attempted exactly once before giving up.
    expect(dom.execCommandCalls).toEqual(["copy"]);
    expect(dom.removed).toHaveLength(1);
  });

  it("execCommand throwing → false AND the textarea is still removed (no stray nodes)", async () => {
    const dom = stubBrowserDom({
      execCommand: () => {
        throw new Error("execCommand blocked");
      },
    });
    stubClipboard(async () => {
      throw new DOMException("denied", "NotAllowedError");
    });

    await expect(copyTextToClipboard(PAYLOAD)).resolves.toBe(false);
    expect(dom.appended).toHaveLength(1);
    expect(dom.removed).toHaveLength(1);
    expect(dom.removed[0]).toBe(dom.appended[0]);
  });

  it("outside a browser (no window/document) → false and the Clipboard API is never touched", async () => {
    const writeText = vi.fn(async () => undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    await expect(copyTextToClipboard(PAYLOAD)).resolves.toBe(false);
    expect(writeText).not.toHaveBeenCalled();
  });
});

/* ─── 1. Behavioral: selectElementText ──────────────────────── */

describe("selectElementText (manual-copy affordance)", () => {
  it("selects the element's contents via window.getSelection + Range", () => {
    const element = { nodeName: "CODE" } as unknown as Element;
    const calls: string[] = [];
    const range = {
      selectNodeContents(el: Element) {
        calls.push(`selectNodeContents:${el === element}`);
      },
    };
    const selection = {
      captured: [] as unknown[],
      removeAllRanges() {
        calls.push("removeAllRanges");
      },
      addRange(r: unknown) {
        calls.push("addRange");
        selection.captured.push(r);
      },
    };
    vi.stubGlobal("window", { getSelection: () => selection });
    vi.stubGlobal("document", {
      createRange() {
        calls.push("createRange");
        return range;
      },
    });

    expect(selectElementText(element)).toBe(true);
    expect(calls).toEqual([
      "createRange",
      "selectNodeContents:true",
      "removeAllRanges",
      "addRange",
    ]);
    expect(selection.captured).toEqual([range]);
  });

  it("returns false when there is no element", () => {
    expect(selectElementText(null)).toBe(false);
    expect(selectElementText(undefined)).toBe(false);
  });

  it("returns false when getSelection is unavailable (hardened env)", () => {
    vi.stubGlobal("window", {});
    vi.stubGlobal("document", {});
    expect(selectElementText({} as Element)).toBe(false);
  });

  it("returns false when getSelection returns null", () => {
    vi.stubGlobal("window", { getSelection: () => null });
    vi.stubGlobal("document", {});
    expect(selectElementText({} as Element)).toBe(false);
  });

  it("returns false when the selection API throws instead of leaking the error", () => {
    vi.stubGlobal("window", {
      getSelection: () => ({
        removeAllRanges() {},
        addRange() {
          throw new Error("selection blocked");
        },
      }),
    });
    vi.stubGlobal("document", { createRange: () => ({ selectNodeContents() {} }) });

    expect(selectElementText({} as Element)).toBe(false);
  });
});

/* ─── Failed-state constants ────────────────────────────────── */

describe("failed-state contract constants", () => {
  it("the failed message names the manual shortcut and the reset is a few seconds", () => {
    expect(CLIPBOARD_FAILED_MESSAGE).toBe("Copy failed — press Ctrl+C / ⌘C");
    expect(CLIPBOARD_FAILED_RESET_MS).toBe(4000);
  });
});

/* ─── 2. Structural: polite status region exists in idle DOM ── */

describe("SSR structure: copy affordances ship an always-on polite status region", () => {
  it("docs CodeBlock: copy button + empty role=status/aria-live=polite region when idle", () => {
    const html = renderToStaticMarkup(
      createElement(CodeBlock, { code: "const roycss = true;", language: "ts" }),
    );
    expect(html).toContain('aria-label="Copy code"');
    expect(html).toContain("Copy");
    expect(html).toContain("const roycss = true;");
    expect(html).toContain('<span role="status" aria-live="polite" class="sr-only"></span>');
  });

  it("shared CopyButton: copy pill + empty role=status/aria-live=polite region when idle", () => {
    const html = renderToStaticMarkup(
      createElement(CopyButton, { text: "roycss-hover-glow-border", label: "Install" }),
    );
    expect(html).toContain('aria-label="Copy install"');
    expect(html).toContain("Copy");
    expect(html).toContain('<span role="status" aria-live="polite" class="sr-only"></span>');
  });
});

/* ─── 3. Source-level wiring pins ───────────────────────────── */

describe("source wiring: shared util + failed-state UX at every user-facing copy path", () => {
  const RECIPES_SRC = readFileSync(
    join(ROOT, "src/components/roycss/recipes-section.tsx"),
    "utf8",
  );
  const COPY_BUTTON_SRC = readFileSync(
    join(ROOT, "src/components/roycss/copy-button.tsx"),
    "utf8",
  );
  const CODE_BLOCK_SRC = readFileSync(
    join(ROOT, "src/components/docs/CodeBlock.tsx"),
    "utf8",
  );
  const USAGE_SRC = readFileSync(
    join(ROOT, "src/components/roycss/framework-usage.tsx"),
    "utf8",
  );
  const HOOK_SRC = readFileSync(
    join(ROOT, "src/components/roycss/use-copy-format.ts"),
    "utf8",
  );

  it("recipes handleCopy (the P3 residual) routes through the shared helper and selects the payload on total failure", () => {
    expect(RECIPES_SRC).toContain('from "@/lib/clipboard"');
    expect(RECIPES_SRC).toContain("copyTextToClipboard(recipe.html)");
    expect(RECIPES_SRC).toContain("selectElementText(codeRef.current)");
    expect(RECIPES_SRC).toContain("{CLIPBOARD_FAILED_MESSAGE}");
    expect(RECIPES_SRC).toContain("ok ? 2000 : CLIPBOARD_FAILED_RESET_MS");
    expect(RECIPES_SRC).toContain("<code ref={codeRef}");
    // The old silent no-op is gone.
    expect(RECIPES_SRC).not.toContain("/* noop */");
  });

  it("recipes button announces the failed state politely and keeps the success machine byte-for-byte", () => {
    expect(RECIPES_SRC).toContain('role="status" aria-live="polite"');
    expect(RECIPES_SRC).toContain("copyFailed ? CLIPBOARD_FAILED_MESSAGE :");
    // Success path preserved: "Copied!" flash + 2s reset, unchanged markup.
    expect(RECIPES_SRC).toContain('<span className="text-emerald-500">Copied!</span>');
    expect(RECIPES_SRC).toContain("ok ? 2000 :");
  });

  it("shared CopyButton copies via the helper, takes payloadRef, and uses the shared failed-state constants", () => {
    expect(COPY_BUTTON_SRC).toContain("copyTextToClipboard(text)");
    expect(COPY_BUTTON_SRC).toContain("payloadRef");
    expect(COPY_BUTTON_SRC).toContain("selectElementText(payloadRef?.current ?? null)");
    expect(COPY_BUTTON_SRC).toContain("{CLIPBOARD_FAILED_MESSAGE}");
    expect(COPY_BUTTON_SRC).toContain("ok ? 2000 : CLIPBOARD_FAILED_RESET_MS");
    expect(COPY_BUTTON_SRC).toContain('role="status" aria-live="polite"');
  });

  it("docs CodeBlock delegates the fallback to the shared util (inline textarea duplicate removed)", () => {
    expect(CODE_BLOCK_SRC).toContain("copyTextToClipboard(code)");
    expect(CODE_BLOCK_SRC).toContain("selectElementText(codeRef.current)");
    expect(CODE_BLOCK_SRC).toContain("{CLIPBOARD_FAILED_MESSAGE}");
    expect(CODE_BLOCK_SRC).toContain("ok ? 2000 : CLIPBOARD_FAILED_RESET_MS");
    expect(CODE_BLOCK_SRC).toContain('role="status" aria-live="polite"');
    expect(CODE_BLOCK_SRC).not.toContain('document.createElement("textarea")');
    expect(CODE_BLOCK_SRC).toContain("<code ref={codeRef}");
  });

  it("dialog CodeBlocks hand CopyButton their <code> element as the payload selection target", () => {
    expect(USAGE_SRC).toContain("payloadRef={codeRef}");
    expect(USAGE_SRC).toContain("<code ref={codeRef}");
  });

  it("Copy-as rows (useCopyFormat) route through the helper; the error toast now means BOTH paths failed", () => {
    expect(HOOK_SRC).toContain("copyTextToClipboard(formatted)");
    expect(HOOK_SRC).toContain('toast.error("Failed to copy — please try again")');
    // Success path preserved.
    expect(HOOK_SRC).toContain("toast.success(`Copied as ${label}!`)");
    expect(HOOK_SRC).toContain("setTimeout(() => setCopiedFormat(null), 2000)");
  });
});
