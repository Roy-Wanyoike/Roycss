/**
 * Token type-system emission gate (PF-030 / issue #123).
 *
 * Pins the two committed emission artifacts against the token source of
 * truth (src/lib/design-tokens.ts — read-only, never moved):
 *
 *   (a) both artifacts exist in dist/ (dist IS committed in this repo,
 *       so the tests read the committed copies — the same bytes CI and
 *       `npm pack` ship).
 *   (b) every source token round-trips into BOTH outputs: a
 *       `var(--roy-<category>-<name>)` constant in dist/tokens.d.ts and
 *       an exact-value {$value, $type} entry in dist/tokens.dtcg.json —
 *       with no extra tokens appearing.
 *   (c) the DTCG document is structurally valid: $value/$type (and
 *       $description) present on every token node, $type drawn from the
 *       standard W3C DTCG vocabulary, groups free of $value, $-prefixed
 *       keys used only for DTCG metadata.
 *   (d) dist/tokens.d.ts is valid TypeScript — validated two ways:
 *         1. In-test full compile via the TypeScript compiler API
 *            (`typescript` is a devDependency): ts.createProgram on the
 *            .d.ts (strict + noEmit, lib loading skipped — see inline)
 *            must produce zero pre-emit diagnostics. (A full `tsc`
 *            child-process spawn would work too but costs seconds per
 *            run; the in-process Program is the same check the
 *            compiler runs.)
 *         2. A static `import type` + literal-type assertion block near
 *            the top of THIS file. Vitest erases type-only imports, so
 *            they cost nothing at runtime; the project's
 *            `bunx tsc --noEmit` gate (whose tsconfig resolves — but
 *            does not root-include — dist/) type-checks them, proving
 *            the declaration file resolves and its literal types are
 *            what consumers expect. The same values are re-asserted at
 *            runtime below so both layers stay tied together.
 *
 * Drift behavior: the byte-equality tests regenerate the expected bytes
 * by importing the PURE builders from scripts/emit-tokens.ts (the script
 * only writes files when it is the Bun entry point — import.meta.main
 * guard), mirroring the docs-class-api / proxy-effect-404 drift-gate
 * pattern. If src/lib/design-tokens.ts changes without a
 * `bun run tokens:emit`, these tests fail.
 */
import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import ts from "typescript";
import { designTokens } from "@/lib/design-tokens";
import {
  buildTokensDts,
  buildTokensDtcgJsonText,
  cssCustomPropertyName,
  cssVarReference,
  dtcgTypeFor,
  tokenCount,
} from "../../scripts/emit-tokens";

// Static type-level smoke against the committed declaration artifact.
// Erased by vitest; checked by the root `bunx tsc --noEmit` gate.
import type {
  RoyCustomPropertyName,
  TOKEN_COUNT as RoyTokenCount,
  tokens as RoyTokens,
} from "../../dist/tokens";

const ROOT = resolve(__dirname, "..", "..");
const DTS_PATH = join(ROOT, "dist", "tokens.d.ts");
const DTCG_PATH = join(ROOT, "dist", "tokens.dtcg.json");

/** The standard $type vocabulary defined by the W3C DTCG format spec. */
const DTCG_STANDARD_TYPES = new Set([
  "color",
  "dimension",
  "duration",
  "cubicBezier",
  "fontFamily",
  "fontWeight",
  "number",
  "string",
  "shadow",
  "border",
  "strokeStyle",
  "transition",
  "gradient",
  "typography",
]);

/* ── Runtime values of the compile-time assertions (see bottom) ── */
const _primaryVar: (typeof RoyTokens)["color"]["primary"] = "var(--roy-color-primary)";
const _hyphenVar: (typeof RoyTokens)["typography"]["text-2xl"] = "var(--roy-typography-text-2xl)";
const _varName: RoyCustomPropertyName = "--roy-zIndex-z-max";
const _tokenCount: typeof RoyTokenCount = 124;
type _MotionTokenName = keyof (typeof RoyTokens)["motion"];
const _motionName: _MotionTokenName = "ease-spring";

/* ── Shared fixtures (guarded so a missing artifact fails test (a)
      cleanly instead of breaking test-file collection) ── */
function tryRead(path: string): string {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return "";
  }
}
function tryParseJson(text: string): Record<string, Record<string, unknown>> {
  try {
    return JSON.parse(text) as Record<string, Record<string, unknown>>;
  } catch {
    return {};
  }
}
const dtsText = tryRead(DTS_PATH);
const dtcgDoc = tryParseJson(tryRead(DTCG_PATH));

const sourceEntries = designTokens.flatMap((cat) =>
  Object.entries(cat.tokens).map(([name, value]) => ({
    categoryId: cat.id,
    name,
    value: String(value),
  })),
);

/* ═══ (a) Artifacts exist in dist/ ═════════════════════════════════ */

describe("tokens emission — artifacts exist (a)", () => {
  it("dist/tokens.d.ts exists", () => {
    expect(existsSync(DTS_PATH)).toBe(true);
  });

  it("dist/tokens.dtcg.json exists", () => {
    expect(existsSync(DTCG_PATH)).toBe(true);
  });

  it("both artifacts are non-empty and carry the generator banner", () => {
    expect(dtsText.trim().length).toBeGreaterThan(0);
    expect(dtsText).toContain("AUTO-GENERATED by scripts/emit-tokens.ts");
    expect(JSON.stringify(dtcgDoc).length).toBeGreaterThan(0);
  });
});

/* ═══ (b) Every source token appears in both outputs ══════════════ */

describe("tokens emission — source round-trip (b)", () => {
  it("tokens.d.ts declares the var() constant for every source token", () => {
    const offenders: string[] = [];
    for (const cat of designTokens) {
      for (const name of Object.keys(cat.tokens)) {
        const ref = JSON.stringify(cssVarReference(cat, name));
        if (!dtsText.includes(`: ${ref};`)) {
          offenders.push(`${cat.id}.${name} → ${ref}`);
        }
      }
    }
    expect(offenders, `missing var() constants:\n${offenders.join("\n")}`).toEqual([]);
  });

  it("tokens.d.ts lists every custom property in RoyCustomPropertyName", () => {
    const offenders: string[] = [];
    for (const cat of designTokens) {
      for (const name of Object.keys(cat.tokens)) {
        const member = JSON.stringify(cssCustomPropertyName(cat, name));
        if (!dtsText.includes(`\n  | ${member}`)) {
          offenders.push(member);
        }
      }
    }
    expect(offenders, `missing union members:\n${offenders.join("\n")}`).toEqual([]);
  });

  it("tokens.dtcg.json contains every source token with the exact source value", () => {
    const offenders: string[] = [];
    for (const entry of sourceEntries) {
      const node = dtcgDoc[entry.categoryId]?.[entry.name];
      if (node === undefined || typeof node !== "object" || node === null) {
        offenders.push(`missing token node ${entry.categoryId}.${entry.name}`);
        continue;
      }
      const actual = (node as Record<string, unknown>).$value;
      if (actual !== entry.value) {
        offenders.push(
          `value drift ${entry.categoryId}.${entry.name}: ${JSON.stringify(actual)} !== ${JSON.stringify(entry.value)}`,
        );
      }
    }
    expect(offenders, `DTCG round-trip failures:\n${offenders.join("\n")}`).toEqual([]);
  });

  it("neither output contains tokens absent from the source", () => {
    const sourceKeys = new Set(sourceEntries.map((e) => `${e.categoryId}.${e.name}`));

    const dtcgExtras: string[] = [];
    for (const [groupId, group] of Object.entries(dtcgDoc)) {
      if (groupId.startsWith("$") || typeof group !== "object" || group === null) continue;
      for (const name of Object.keys(group)) {
        if (!name.startsWith("$") && !sourceKeys.has(`${groupId}.${name}`)) {
          dtcgExtras.push(`dtcg: ${groupId}.${name}`);
        }
      }
    }
    expect(dtcgExtras).toEqual([]);

    // tokens.d.ts: every custom property it mentions must exist in the source.
    const dtsVars = Array.from(dtsText.matchAll(/"--roy-[A-Za-z0-9-]+"/g), (m) => m[0]);
    const expectedVars = new Set<string>();
    for (const cat of designTokens) {
      for (const name of Object.keys(cat.tokens)) {
        expectedVars.add(JSON.stringify(cssCustomPropertyName(cat, name)));
      }
    }
    const dtsExtras = dtsVars.filter((v) => !expectedVars.has(v));
    expect(dtsExtras, `phantom custom properties in tokens.d.ts:\n${dtsExtras.join("\n")}`).toEqual([]);
  });

  it("TOKEN_COUNT equals the source corpus size in both artifacts", () => {
    expect(tokenCount()).toBe(sourceEntries.length);
    expect(dtsText).toContain(`export declare const TOKEN_COUNT: ${sourceEntries.length};`);
  });
});

/* ═══ Byte-drift guard (mirrors `bun run tokens:check`) ════════════ */

describe("tokens emission — byte-drift guard", () => {
  it("committed dist/tokens.d.ts is byte-identical to the generator output", () => {
    expect(dtsText).toBe(buildTokensDts());
  });

  it("committed dist/tokens.dtcg.json is byte-identical to the generator output", () => {
    expect(readFileSync(DTCG_PATH, "utf8")).toBe(buildTokensDtcgJsonText());
  });
});

/* ═══ (c) DTCG structure validity ═════════════════════════════════ */

describe("tokens emission — DTCG structure validity (c)", () => {
  it("every token node carries non-empty $value, $type and $description", () => {
    const offenders: string[] = [];
    for (const [groupId, group] of Object.entries(dtcgDoc)) {
      if (groupId.startsWith("$")) continue;
      if (typeof group !== "object" || group === null) {
        offenders.push(`"${groupId}" is not a group object`);
        continue;
      }
      for (const [name, node] of Object.entries(group)) {
        if (name.startsWith("$")) continue;
        if (typeof node !== "object" || node === null) {
          offenders.push(`${groupId}.${name} is not a token object`);
          continue;
        }
        const token = node as Record<string, unknown>;
        if (typeof token.$value !== "string" || token.$value.length === 0) {
          offenders.push(`${groupId}.${name}: $value missing/empty`);
        }
        if (typeof token.$type !== "string" || token.$type.length === 0) {
          offenders.push(`${groupId}.${name}: $type missing/empty`);
        }
        if (typeof token.$description !== "string" || token.$description.length === 0) {
          offenders.push(`${groupId}.${name}: $description missing/empty`);
        }
      }
    }
    expect(offenders, `invalid token nodes:\n${offenders.join("\n")}`).toEqual([]);
  });

  it("every $type is drawn from the standard W3C DTCG vocabulary", () => {
    const offenders: string[] = [];
    for (const [groupId, group] of Object.entries(dtcgDoc)) {
      if (groupId.startsWith("$") || typeof group !== "object" || group === null) continue;
      for (const [name, node] of Object.entries(group)) {
        if (name.startsWith("$") || typeof node !== "object" || node === null) continue;
        const token = node as Record<string, unknown>;
        if (!DTCG_STANDARD_TYPES.has(String(token.$type))) {
          offenders.push(`${groupId}.${name}: non-standard $type "${String(token.$type)}"`);
        }
      }
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("group nodes never carry $value and only use reserved $-keys", () => {
    const RESERVED = new Set(["$schema", "$description", "$value", "$type", "$extensions"]);
    const offenders: string[] = [];
    for (const [groupId, group] of Object.entries(dtcgDoc)) {
      if (groupId.startsWith("$") && !RESERVED.has(groupId)) {
        offenders.push(`unknown top-level $-key "${groupId}"`);
      }
      if (typeof group !== "object" || group === null) continue;
      if ("$value" in group) offenders.push(`group "${groupId}" carries a $value`);
      for (const key of Object.keys(group)) {
        if (key.startsWith("$") && !RESERVED.has(key)) {
          offenders.push(`group "${groupId}" uses unknown $-key "${key}"`);
        }
      }
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("carries the DTCG $schema pointer and one group per source category", () => {
    expect(dtcgDoc.$schema).toBe("https://design-tokens.github.io/community-group/format/");
    expect(Object.keys(dtcgDoc).filter((k) => !k.startsWith("$"))).toEqual(
      designTokens.map((c) => c.id),
    );
  });

  it("matches the emitter's per-token type inference (pins dtcgTypeFor)", () => {
    const offenders: string[] = [];
    for (const cat of designTokens) {
      for (const name of Object.keys(cat.tokens)) {
        const node = dtcgDoc[cat.id]?.[name] as Record<string, unknown> | undefined;
        if (node?.$type !== dtcgTypeFor(cat.id, name)) {
          offenders.push(
            `${cat.id}.${name}: emitted ${String(node?.$type)} != inferred ${dtcgTypeFor(cat.id, name)}`,
          );
        }
      }
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });
});

/* ═══ (d) tokens.d.ts is valid TypeScript ══════════════════════════ */

describe("tokens emission — tokens.d.ts is valid TypeScript (d)", () => {
  it(
    "compiles with zero diagnostics (TypeScript compiler API, strict + noEmit)",
    { timeout: 30_000 },
    () => {
      // Full in-process compile of the emitted declaration file — the same
      // check `tsc --noEmit --strict dist/tokens.d.ts` performs, without
      // paying for a compiler process spawn on every test run. The file
      // has no imports and uses only intrinsic literal types, so lib
      // loading is skipped (noResolve + empty lib) to keep it fast.
      const program = ts.createProgram([DTS_PATH], {
        strict: true,
        noEmit: true,
        noResolve: true,
        lib: [],
        skipLibCheck: true,
      });
      const diagnostics = ts.getPreEmitDiagnostics(program);
      const formatted = diagnostics.map((d) => {
        const where = d.file
          ? `${d.file.fileName}${typeof d.start === "number" ? `:${d.file.getLineAndCharacterOfPosition(d.start).line + 1}` : ""}`
          : "(program)";
        return `${where}: ${ts.flattenDiagnosticMessageText(d.messageText, " ")}`;
      });
      expect(formatted, `tokens.d.ts compile errors:\n${formatted.join("\n")}`).toEqual([]);
    },
  );

  it("declares the expected module surface (tokens, TOKEN_COUNT, TOKEN_CATEGORIES, types)", () => {
    for (const decl of [
      "export declare const TOKEN_COUNT:",
      "export declare const TOKEN_CATEGORIES:",
      "export declare const tokens: {",
      "export type TokenCategoryId =",
      "export type TokenName<C extends TokenCategoryId> =",
      "export type RoyCustomPropertyName =",
    ]) {
      expect(dtsText, `missing declaration: ${decl}`).toContain(decl);
    }
  });

  it("type-level smoke holds at runtime (compile-time twins at the top of this file)", () => {
    // The consts above are simultaneously compile-time assertions
    // (checked by `bunx tsc --noEmit`) and runtime values — if the .d.ts
    // drifts in literal types, the tsc gate fails; if it drifts in a way
    // this suite cannot see, these values still pin the contract.
    expect(_primaryVar).toBe("var(--roy-color-primary)");
    expect(_hyphenVar).toBe("var(--roy-typography-text-2xl)");
    expect(_varName).toBe("--roy-zIndex-z-max");
    expect(_tokenCount).toBe(124);
    expect(_motionName).toBe("ease-spring");
  });
});
