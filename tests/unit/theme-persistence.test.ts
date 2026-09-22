import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  THEME_STORAGE_KEY,
  readStoredTheme,
  writeStoredTheme,
  resolveTheme,
  resolveInitialDark,
  type ThemeStorageLike,
} from "@/components/ui-library/foundation/theme-storage";

const ROOT = join(__dirname, "..", "..");

/**
 * Theme persistence (issue #160).
 *
 * Bug: toggling dark→light wrote `roycss-theme=light`, but on the next load
 * the ThemeToggle mount effect wrote `roycss-theme=dark` BEFORE its deferred
 * read ran — the stored value was clobbered by its own writer and the app
 * always came back dark.
 *
 * Contract under test:
 *   1. Init (pre-hydration script + provider) READS the stored key and
 *      validates it; missing/corrupt/"system" fall back to the OS preference.
 *   2. Init NEVER WRITES the key (guarded by a setItem spy).
 *   3. Only the user's toggle handler persists a value (source-level gate).
 *   4. The layout init script and the provider's shared module
 *      (`theme-storage.ts`) stay behaviorally equivalent.
 *
 * The vitest environment is `node` (no DOM, per vitest.config.ts), so the
 * init script is evaluated against mocked `localStorage`/`document`/
 * `window.matchMedia` and component-level behavior is gated with
 * source-level assertions — the same convention as toast-single-system.test.ts.
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
  return { storage: storage as ThemeStorageLike, writes };
}

/** Minimal document mock tracking the `dark` class + color-scheme style. */
function makeDocument() {
  const classes = new Set<string>(["dark"]); // <html className="dark"> SSR default
  return {
    documentElement: {
      classList: {
        contains: (name: string) => classes.has(name),
        toggle: (name: string, force?: boolean) => {
          const next = force ?? !classes.has(name);
          if (next) classes.add(name);
          else classes.delete(name);
        },
      },
      style: {} as Record<string, string>,
    },
    classes,
  };
}

/** Evaluate the literal pre-hydration init script extracted from layout.tsx. */
function runInitScript(opts: {
  stored: string | null;
  systemPrefersDark: boolean;
  storage: ThemeStorageLike;
}) {
  const layoutSrc = readFileSync(join(ROOT, "src/app/layout.tsx"), "utf8");
  const match = layoutSrc.match(/const themeInitScript = `([^`]+)`;/);
  if (!match) throw new Error("themeInitScript not found in src/app/layout.tsx");
  const doc = makeDocument();
  const fn = new Function(
    "localStorage",
    "window",
    "document",
    match[1],
  ) as (ls: ThemeStorageLike, win: unknown, doc: unknown) => void;
  fn(
    opts.storage,
    { matchMedia: () => ({ matches: opts.systemPrefersDark }) },
    doc,
  );
  return doc;
}

/* ─── 1. pre-hydration init script reads (never writes) the stored key ─── */

describe("pre-hydration theme init script (layout.tsx)", () => {
  it("uses the shared THEME_STORAGE_KEY", () => {
    const layoutSrc = readFileSync(join(ROOT, "src/app/layout.tsx"), "utf8");
    expect(layoutSrc).toContain(`'${THEME_STORAGE_KEY}'`);
  });

  it("stored 'light' → light theme before paint", () => {
    const { storage } = makeStorage({ [THEME_STORAGE_KEY]: "light" });
    const doc = runInitScript({ stored: "light", systemPrefersDark: true, storage });
    expect(doc.documentElement.classList.contains("dark")).toBe(false);
    expect(doc.documentElement.style.colorScheme).toBe("light");
  });

  it("stored 'dark' → dark theme before paint (even on light OS)", () => {
    const { storage } = makeStorage({ [THEME_STORAGE_KEY]: "dark" });
    const doc = runInitScript({ stored: "dark", systemPrefersDark: false, storage });
    expect(doc.documentElement.classList.contains("dark")).toBe(true);
    expect(doc.documentElement.style.colorScheme).toBe("dark");
  });

  it.each([
    ["missing", null],
    ["explicit 'system'", "system"],
    ["corrupt value", "banana"],
  ])("%s falls back to the OS preference", (_label, stored) => {
    const { storage } = makeStorage(
      stored === null ? {} : { [THEME_STORAGE_KEY]: stored as string },
    );
    const dark = runInitScript({ stored, systemPrefersDark: true, storage });
    expect(dark.documentElement.classList.contains("dark")).toBe(true);
    const light = runInitScript({ stored, systemPrefersDark: false, storage });
    expect(light.documentElement.classList.contains("dark")).toBe(false);
  });

  it("NEVER writes the storage key on init (issue #160 regression guard)", () => {
    const { storage, writes } = makeStorage({ [THEME_STORAGE_KEY]: "light" });
    runInitScript({ stored: "light", systemPrefersDark: false, storage });
    expect(writes).toEqual([]);
  });
});

/* ─── 2. shared theme-storage module (provider init logic) ──────────── */

describe("theme-storage — provider init reads stored value (mock localStorage)", () => {
  it("readStoredTheme returns valid stored values", () => {
    for (const value of ["light", "dark", "system"] as const) {
      const { storage } = makeStorage({ [THEME_STORAGE_KEY]: value });
      expect(readStoredTheme(storage)).toBe(value);
    }
  });

  it("readStoredTheme returns null for missing or corrupt values", () => {
    expect(readStoredTheme(makeStorage().storage)).toBeNull();
    expect(readStoredTheme(makeStorage({ [THEME_STORAGE_KEY]: "nord" }).storage)).toBeNull();
    expect(readStoredTheme(null)).toBeNull();
  });

  it("readStoredTheme survives a throwing storage (private mode)", () => {
    const throwing = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };
    expect(readStoredTheme(throwing)).toBeNull();
  });

  it("writeStoredTheme persists, readStoredTheme reads it back", () => {
    const { storage } = makeStorage();
    writeStoredTheme(storage, "light");
    expect(readStoredTheme(storage)).toBe("light");
  });

  it("writeStoredTheme tolerates a throwing storage", () => {
    const throwing = {
      getItem: () => null,
      setItem: () => {
        throw new Error("quota");
      },
    };
    expect(() => writeStoredTheme(throwing, "dark")).not.toThrow();
  });

  it("resolveTheme honors the OS preference only for 'system'", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
    expect(resolveTheme("light", true)).toBe("light");
  });

  it.each([
    ["light", false, false],
    ["light", true, false],
    ["dark", false, true],
    ["dark", true, true],
    [null, false, false],
    [null, true, true],
    ["system", false, false],
    ["system", true, true],
    ["corrupt", false, false],
    ["corrupt", true, true],
  ] as const)(
    "resolveInitialDark(stored=%p, osDark=%p) → dark=%p",
    (stored, osDark, expected) => {
      const { storage } = makeStorage(
        stored && stored !== "corrupt" ? { [THEME_STORAGE_KEY]: stored } : stored === "corrupt" ? { [THEME_STORAGE_KEY]: "corrupt" } : {},
      );
      expect(resolveInitialDark(storage, osDark)).toBe(expected);
    },
  );
});

/* ─── 3. script ⇄ module equivalence ────────────────────────────────── */

describe("init script ⇄ theme-storage equivalence", () => {
  const CASES: Array<{
    name: string;
    stored: Record<string, string>;
    osDark: boolean;
    expectDark: boolean;
  }> = [
    { name: "stored light / dark OS", stored: { "roycss-theme": "light" }, osDark: true, expectDark: false },
    { name: "stored dark / light OS", stored: { "roycss-theme": "dark" }, osDark: false, expectDark: true },
    { name: "stored system / dark OS", stored: { "roycss-theme": "system" }, osDark: true, expectDark: true },
    { name: "stored system / light OS", stored: { "roycss-theme": "system" }, osDark: false, expectDark: false },
    { name: "nothing stored / dark OS", stored: {}, osDark: true, expectDark: true },
    { name: "nothing stored / light OS", stored: {}, osDark: false, expectDark: false },
    { name: "corrupt stored / dark OS", stored: { "roycss-theme": "/theme" }, osDark: true, expectDark: true },
    { name: "corrupt stored / light OS", stored: { "roycss-theme": "/theme" }, osDark: false, expectDark: false },
  ];

  for (const c of CASES) {
    it(c.name, () => {
      const { storage } = makeStorage(c.stored);
      const doc = runInitScript({
        stored: c.stored["roycss-theme"] ?? null,
        systemPrefersDark: c.osDark,
        storage,
      });
      expect(doc.documentElement.classList.contains("dark")).toBe(c.expectDark);
      expect(
        resolveInitialDark(
          makeStorage(c.stored).storage,
          c.osDark,
        ),
      ).toBe(c.expectDark);
    });
  }
});

/* ─── 4. only the user toggle writes (source-level gates) ───────────── */

describe("theme writers — only the user toggle persists (issue #160)", () => {
  const pageSrc = readFileSync(
    join(ROOT, "src/components/roycss/roycss-page.tsx"),
    "utf8",
  );
  const toggleStart = pageSrc.indexOf("function ThemeToggle()");
  const toggleEnd = pageSrc.indexOf("\nfunction ", toggleStart);
  const toggleSrc = pageSrc.slice(toggleStart, toggleEnd);

  it("ThemeToggle writes the preference exactly once — in the toggle handler", () => {
    const writes = toggleSrc.split("localStorage.setItem").length - 1;
    expect(writes).toBe(1);
    const handlerStart = toggleSrc.indexOf("const toggleTheme");
    expect(handlerStart).toBeGreaterThan(-1);
    expect(toggleSrc.indexOf("localStorage.setItem")).toBeGreaterThan(handlerStart);
  });

  it("ThemeToggle mount effect only reads (no setItem before the handler)", () => {
    const effectStart = toggleSrc.indexOf("useEffect(");
    const effectEnd = toggleSrc.indexOf("}, []);", effectStart);
    const mountEffect = toggleSrc.slice(effectStart, effectEnd);
    expect(mountEffect).not.toContain("setItem");
    expect(mountEffect).toContain("classList.contains");
  });

  it("ThemeProvider never calls localStorage directly (delegates to theme-storage)", () => {
    const providerSrc = readFileSync(
      join(ROOT, "src/components/ui-library/foundation/theme-provider.tsx"),
      "utf8",
    );
    expect(providerSrc).not.toContain("localStorage.setItem");
    expect(providerSrc).toContain("readStoredTheme(window.localStorage)");
    expect(providerSrc).toContain("writeStoredTheme(window.localStorage");
  });
});
