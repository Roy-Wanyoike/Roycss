import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  ANIMATION_PAUSE_STORAGE_KEY,
  readStoredAnimationPause,
  writeStoredAnimationPause,
  type AnimationPauseStorageLike,
} from "@/components/ui-library/foundation/animation-pause-storage";
import { PauseAnimationsToggle } from "@/components/roycss/pause-animations-toggle";

const ROOT = join(__dirname, "..", "..");

/**
 * Animation-pause persistence (issue #214 tail — WCAG 2.2.2 pause).
 *
 * Before this change the "Pause animations" toggle set
 * `html[data-animations-paused]` only in the DOM: reloading the page lost
 * the preference and every marquee/carousel resumed moving.
 *
 * Contract under test (mirrors theme-persistence.test.ts / issue #160):
 *   1. The pre-paint init script (layout.tsx) READS
 *      `roycss-animations-paused`, accepts only "true"/"false", and
 *      applies `data-animations-paused="true"` on <html> BEFORE first
 *      paint. It NEVER WRITES the key (guarded by a setItem spy).
 *   2. Only the user's toggle handler persists a value — exactly one
 *      write site, via the shared animation-pause-storage module
 *      (source-level gate).
 *   3. The layout init script and the shared module
 *      (`animation-pause-storage.ts`) stay behaviorally equivalent.
 *   4. The site CSS hooks the mechanism depends on are pinned: the site
 *      marquee's keyboard pause (`:focus-within`) and the globals.css
 *      freeze rules for both pause attributes.
 *
 * The vitest environment is `node` (no DOM, per vitest.config.ts), so the
 * init script is evaluated against mocked `localStorage`/`document` and
 * component-level behavior is gated with source-level assertions — the
 * same convention as tests/unit/theme-persistence.test.ts.
 */

/* ─── mocks ─────────────────────────────────────────────────── */

/** In-memory localStorage stand-in with a write spy. */
function makeStorage(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  const storage = {
    getItem: (key: string) => (map.has(key) ? map.get(key)! : null),
    setItem: (key: string, value: string) => {
      writes.push([key, value]);
      map.set(key, value);
    },
  };
  const writes: Array<[string, string]> = [];
  return { storage: storage as AnimationPauseStorageLike, writes };
}

/** Throwing storage stand-in (private browsing / quota). */
function makeThrowingStorage() {
  return {
    getItem: () => {
      throw new Error("blocked");
    },
    setItem: () => {
      throw new Error("blocked");
    },
  };
}

/** Minimal document mock tracking the data-animations-paused attribute. */
function makeDocument() {
  const attrs = new Map<string, string>();
  return {
    documentElement: {
      setAttribute: (name: string, value: string) => attrs.set(name, value),
      removeAttribute: (name: string) => attrs.delete(name),
      getAttribute: (name: string) => (attrs.has(name) ? attrs.get(name)! : null),
      hasAttribute: (name: string) => attrs.has(name),
    },
    attrs,
  };
}

/** Evaluate the literal pre-paint pause script extracted from layout.tsx. */
function runPauseInitScript(storage: AnimationPauseStorageLike) {
  const layoutSrc = readFileSync(join(ROOT, "src/app/layout.tsx"), "utf8");
  const match = layoutSrc.match(/const pauseInitScript = `([^`]+)`;/);
  if (!match) throw new Error("pauseInitScript not found in src/app/layout.tsx");
  const doc = makeDocument();
  const fn = new Function(
    "localStorage",
    "document",
    match[1],
  ) as (ls: AnimationPauseStorageLike, doc: unknown) => void;
  fn(storage, doc);
  return doc;
}

/* ─── 1. shared animation-pause-storage module ──────────────────────── */

describe("animation-pause-storage — read/write contract", () => {
  it("uses the roycss-* storage key convention", () => {
    expect(ANIMATION_PAUSE_STORAGE_KEY).toBe("roycss-animations-paused");
  });

  it("writeStoredAnimationPause persists, readStoredAnimationPause reads it back", () => {
    const { storage } = makeStorage();
    writeStoredAnimationPause(storage, true);
    expect(readStoredAnimationPause(storage)).toBe(true);
    writeStoredAnimationPause(storage, false);
    expect(readStoredAnimationPause(storage)).toBe(false);
  });

  it("stores only the exact strings 'true'/'false'", () => {
    const { storage, writes } = makeStorage();
    writeStoredAnimationPause(storage, true);
    writeStoredAnimationPause(storage, false);
    expect(writes).toEqual([
      [ANIMATION_PAUSE_STORAGE_KEY, "true"],
      [ANIMATION_PAUSE_STORAGE_KEY, "false"],
    ]);
  });

  it.each([
    ["missing", null],
    ["corrupt", "1"],
    ["corrupt", "TRUE"],
    ["corrupt", "yes"],
    ["corrupt", "paused"],
    ["corrupt", ""],
  ])("readStoredAnimationPause returns null for %s value %p", (_label, raw) => {
    const { storage } = makeStorage(
      raw === null ? {} : { [ANIMATION_PAUSE_STORAGE_KEY]: raw as string },
    );
    expect(readStoredAnimationPause(storage)).toBeNull();
  });

  it("readStoredAnimationPause returns null for null/undefined storage", () => {
    expect(readStoredAnimationPause(null)).toBeNull();
    expect(readStoredAnimationPause(undefined)).toBeNull();
  });

  it("readStoredAnimationPause survives a throwing storage (private mode)", () => {
    expect(readStoredAnimationPause(makeThrowingStorage())).toBeNull();
  });

  it("writeStoredAnimationPause tolerates a throwing storage", () => {
    expect(() => writeStoredAnimationPause(makeThrowingStorage(), true)).not.toThrow();
    expect(() => writeStoredAnimationPause(null, true)).not.toThrow();
  });
});

/* ─── 2. pre-paint init script (layout.tsx) ─────────────────────────── */

describe("pre-pause init script (layout.tsx)", () => {
  it("uses the shared ANIMATION_PAUSE_STORAGE_KEY", () => {
    const layoutSrc = readFileSync(join(ROOT, "src/app/layout.tsx"), "utf8");
    expect(layoutSrc).toContain(`'${ANIMATION_PAUSE_STORAGE_KEY}'`);
  });

  it("stored 'true' → data-animations-paused='true' on <html> before paint", () => {
    const { storage } = makeStorage({ [ANIMATION_PAUSE_STORAGE_KEY]: "true" });
    const doc = runPauseInitScript(storage);
    expect(doc.documentElement.getAttribute("data-animations-paused")).toBe("true");
  });

  it.each([
    ["missing", null],
    ["explicit 'false'", "false"],
    ["corrupt", "banana"],
    ["corrupt", "TRUE"],
  ])("%s stored value (%p) leaves animations running", (_label, stored) => {
    const { storage } = makeStorage(
      stored === null ? {} : { [ANIMATION_PAUSE_STORAGE_KEY]: stored as string },
    );
    const doc = runPauseInitScript(storage);
    expect(doc.documentElement.hasAttribute("data-animations-paused")).toBe(false);
  });

  it("survives a throwing storage without throwing or pausing", () => {
    expect(() => {
      const doc = runPauseInitScript(makeThrowingStorage());
      expect(doc.documentElement.hasAttribute("data-animations-paused")).toBe(false);
    }).not.toThrow();
  });

  it("NEVER writes the storage key on init (#160 regression class)", () => {
    const { storage, writes } = makeStorage({ [ANIMATION_PAUSE_STORAGE_KEY]: "true" });
    runPauseInitScript(storage);
    expect(writes).toEqual([]);
  });
});

/* ─── 3. script ⇄ module equivalence ────────────────────────────────── */

describe("init script ⇄ animation-pause-storage equivalence", () => {
  const CASES: Array<{
    name: string;
    stored: Record<string, string>;
    expectPaused: boolean;
    expectRead: boolean | null;
  }> = [
    { name: "stored true → paused", stored: { "roycss-animations-paused": "true" }, expectPaused: true, expectRead: true },
    { name: "stored false → running", stored: { "roycss-animations-paused": "false" }, expectPaused: false, expectRead: false },
    { name: "nothing stored → running", stored: {}, expectPaused: false, expectRead: null },
    { name: "corrupt stored → running", stored: { "roycss-animations-paused": "/pause" }, expectPaused: false, expectRead: null },
  ];

  for (const c of CASES) {
    it(c.name, () => {
      const { storage } = makeStorage(c.stored);
      const doc = runPauseInitScript(storage);
      expect(doc.documentElement.hasAttribute("data-animations-paused")).toBe(
        c.expectPaused,
      );
      // The script's fallback semantics match readStoredAnimationPause().
      expect(readStoredAnimationPause(storage)).toBe(c.expectRead);
    });
  }
});

/* ─── 4. only the user toggle writes (source-level gates) ───────────── */

describe("pause writers — only the user toggle persists (issue #214 tail)", () => {
  const toggleSrc = readFileSync(
    join(ROOT, "src/components/roycss/pause-animations-toggle.tsx"),
    "utf8",
  );

  it("exports the toggle component", () => {
    expect(typeof PauseAnimationsToggle).toBe("function");
  });

  it("PauseAnimationsToggle writes via the shared module exactly once — in the toggle handler", () => {
    expect(toggleSrc).toContain(
      'from "@/components/ui-library/foundation/animation-pause-storage"',
    );
    const calls = toggleSrc.split("writeStoredAnimationPause(window.localStorage").length - 1;
    expect(calls).toBe(1);
    const handlerStart = toggleSrc.indexOf("const toggle = () =>");
    expect(handlerStart).toBeGreaterThan(-1);
    expect(toggleSrc.indexOf("writeStoredAnimationPause(window.localStorage")).toBeGreaterThan(
      handlerStart,
    );
  });

  it("PauseAnimationsToggle never touches raw localStorage directly", () => {
    expect(toggleSrc).not.toContain("localStorage.setItem");
    // The only localStorage reference is the shared-module call site.
    const refs = toggleSrc.split("window.localStorage").length - 1;
    expect(refs).toBe(1);
  });

  it("PauseAnimationsToggle mount effect only reads the attribute (no writes, rAF-deferred)", () => {
    const effectStart = toggleSrc.indexOf("useEffect(");
    const effectEnd = toggleSrc.indexOf("}, []);", effectStart);
    const mountEffect = toggleSrc.slice(effectStart, effectEnd);
    expect(mountEffect).toContain("hasAttribute");
    expect(mountEffect).toContain("requestAnimationFrame");
    expect(mountEffect).not.toContain("writeStoredAnimationPause");
    expect(mountEffect).not.toContain("setItem");
  });

  it("the toggle keeps its constant accessible name + aria-pressed state", () => {
    // i18n note: the literal moved to messages/en.json (SiteHeader.pauseAnimations)
    // when #129 PR-A extracted chrome strings; the catalog value IS the stable name.
    const en = JSON.parse(
      readFileSync(join(ROOT, "messages/en.json"), "utf8"),
    ) as { SiteHeader: Record<string, string> };
    expect(en.SiteHeader.pauseAnimations).toBe("Pause animations");
    expect(toggleSrc).toContain('aria-label={t("pauseAnimations")}');
    expect(toggleSrc).toContain("aria-pressed={paused}");
  });

  it("the toggle handler sets the exact attribute the init script reads", () => {
    const layoutSrc = readFileSync(join(ROOT, "src/app/layout.tsx"), "utf8");
    const scriptAttr = layoutSrc.match(
      /pauseInitScript = `[^`]*setAttribute\('([^']+)'/,
    );
    expect(scriptAttr).not.toBeNull();
    expect(toggleSrc).toContain(`const HTML_ATTR = "${scriptAttr![1]}";`);
  });
});

/* ─── 5. site CSS hooks (the mechanism's contract with the stylesheet) ── */

describe("site CSS hooks for the pause mechanism (issue #214)", () => {
  const roycssCss = readFileSync(join(ROOT, "src/app/roycss.css"), "utf8");
  const globalsCss = readFileSync(join(ROOT, "src/app/globals.css"), "utf8");

  it("roycss.css pauses the site marquee on keyboard focus (:focus-within)", () => {
    const hookStart = roycssCss.indexOf(".roycss-marquee-wrapper");
    expect(hookStart).toBeGreaterThan(-1);
    const hookEnd = roycssCss.indexOf("}", roycssCss.indexOf("&:focus-within", hookStart));
    const focusRule = roycssCss.slice(
      roycssCss.indexOf("&:focus-within", hookStart),
      hookEnd,
    );
    expect(focusRule).toContain("&:focus-within .roycss-marquee-track");
    expect(focusRule).toContain("animation-play-state: paused");
  });

  it("roycss.css keeps the hover-pause behind @media (hover: hover) (no touch sticky-hover)", () => {
    expect(roycssCss).toMatch(
      /@media \(hover: hover\) \{[^}]*&\[data-pause-on-hover="true"\]:hover \.roycss-marquee-track \{[^}]*animation-play-state: paused;[^}]*\}/,
    );
  });

  it("globals.css freezes ALL site animations under html[data-animations-paused]", () => {
    expect(globalsCss).toContain('html[data-animations-paused="true"] *');
    expect(globalsCss).toContain('html[data-animations-paused="true"] *::before');
    expect(globalsCss).toContain('html[data-animations-paused="true"] *::after');
    const hookStart = globalsCss.indexOf('html[data-animations-paused="true"] *,');
    const hookEnd = globalsCss.indexOf("}", hookStart);
    expect(globalsCss.slice(hookStart, hookEnd)).toContain(
      "animation-play-state: paused !important",
    );
  });

  it("globals.css keeps the off-screen AnimationPauser hook ([data-animation-paused])", () => {
    expect(globalsCss).toContain('[data-animation-paused="true"]');
    const hookStart = globalsCss.indexOf('[data-animation-paused="true"]');
    const hookEnd = globalsCss.indexOf("}", hookStart);
    expect(globalsCss.slice(hookStart, hookEnd)).toContain(
      "animation-play-state: paused !important",
    );
  });
});
