/**
 * next-intl timeZone pin (issue #274).
 *
 * Without an explicit `timeZone`, next-intl falls back to the host
 * environment (the ENVIRONMENT_FALLBACK warning in dev logs) and bakes the
 * server TZ into prerendered markup — a cross-environment mismatch class the
 * moment any date/number formatting lands. The fix pins `timeZone: "UTC"` in
 * BOTH next-intl entry points:
 *   1. src/i18n/request.ts   — getRequestConfig return (server render)
 *   2. src/i18n/locale-provider.tsx — NextIntlClientProvider prop (client)
 *
 * Source-pin rather than import-and-inspect: next-intl/server pulls the
 * `server-only` package, which is un-importable in a plain node vitest
 * environment. This matches the repo's existing source-pin gates
 * (css-lint/important-audit/toast-single-system style).
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..", "..");

const requestTs = readFileSync(join(ROOT, "src/i18n/request.ts"), "utf-8");
const providerTsx = readFileSync(
  join(ROOT, "src/i18n/locale-provider.tsx"),
  "utf-8",
);

describe("next-intl timeZone is pinned to UTC (issue #274)", () => {
  it("getRequestConfig return includes timeZone: \"UTC\"", () => {
    // The return object of the default-exported getRequestConfig callback.
    expect(requestTs).toContain('timeZone: "UTC"');
    // Exactly one declaration — a second (conflicting) override would
    // resurrect the environment-fallback mismatch this pin exists for.
    expect(requestTs.match(/timeZone\s*:/g) ?? []).toHaveLength(1);
    // Guard against a sloppy non-UTC value slipping in later.
    expect(requestTs).not.toMatch(/timeZone\s*:\s*"(?!UTC)/);
  });

  it("NextIntlClientProvider receives timeZone=\"UTC\"", () => {
    // The provider JSX in LocaleProvider (src/i18n/locale-provider.tsx).
    expect(providerTsx).toContain('timeZone="UTC"');
    // Exactly one prop site in the provider.
    expect(providerTsx.match(/timeZone\s*=\s*["{]/g) ?? []).toHaveLength(1);
    // No non-UTC literal value anywhere in the provider.
    expect(providerTsx).not.toMatch(/timeZone\s*=\s*"(?!UTC)/);
  });

  it("provider still forwards locale + messages alongside timeZone", () => {
    // The timeZone pin must not come at the cost of the hydration contract:
    // the provider still owns locale/messages (hydration contract, #129 PR-B).
    expect(providerTsx).toMatch(/<NextIntlClientProvider/);
    expect(providerTsx).toMatch(/locale=\{locale\}/);
    expect(providerTsx).toMatch(/messages=\{MESSAGES\[locale\]\}/);
  });
});
