import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { existsSync } from "node:fs";

/**
 * Security-claims ⇄ shipped-headers alignment (issue #192).
 *
 * Go-live API QA (round 9-b) found the security copy claims
 * "X-Frame-Options: DENY" + "HSTS" while the shipped frontend headers had
 * neither (only CSP frame-ancestors). Issue #192 chose the "make the
 * claims true" option: both headers are now set in `next.config.ts`
 * (every route) AND on the proxy's hard-404 response (the one bypass of
 * config headers), with the exact HSTS value the docs have always
 * documented.
 *
 * This gate pins the alignment so the copy and the config can't drift
 * apart again. It is source-level (vitest runs in node, no HTTP server) —
 * the same convention as theme-persistence.test.ts.
 */

const ROOT = join(__dirname, "..", "..");

const DOCUMENTED_HSTS = "max-age=63072000; includeSubDomains; preload";

const nextConfigSrc = readFileSync(join(ROOT, "next.config.ts"), "utf8");
const proxySrc = readFileSync(join(ROOT, "src/proxy.ts"), "utf8");

/** The FAQ copy lives in faq-section.tsx (or faq-data.ts once extracted). */
function readFaqCopy(): string {
  const dataFile = join(ROOT, "src/lib/faq-data.ts");
  if (existsSync(dataFile)) return readFileSync(dataFile, "utf8");
  return readFileSync(join(ROOT, "src/components/roycss/faq-section.tsx"), "utf8");
}

describe("security headers are actually shipped (issue #192)", () => {
  it("next.config.ts sets X-Frame-Options: DENY", () => {
    expect(nextConfigSrc).toContain('key: "X-Frame-Options"');
    expect(nextConfigSrc).toContain('value: "DENY"');
  });

  it("next.config.ts sets HSTS with the documented value", () => {
    expect(nextConfigSrc).toContain('key: "Strict-Transport-Security"');
    expect(nextConfigSrc).toContain(`value: "${DOCUMENTED_HSTS}"`);
  });

  it("the proxy hard-404 carries both headers (config-headers bypass)", () => {
    // unknownEffect404() builds its own NextResponse, which never sees
    // next.config headers() — the headers must be set on the response.
    const fnStart = proxySrc.indexOf("function unknownEffect404()");
    const fnSrc = proxySrc.slice(fnStart, proxySrc.indexOf("}", proxySrc.indexOf("});", fnStart)));
    expect(fnSrc).toContain('"X-Frame-Options": "DENY"');
    expect(fnSrc).toContain(`"Strict-Transport-Security":\n        "${DOCUMENTED_HSTS}"`);
  });

  it("prod CSP still bans framing via frame-ancestors 'none' (belt + suspenders)", () => {
    expect(proxySrc).toContain("\"frame-ancestors 'none'\"");
  });
});

describe("security-claims copy matches the shipped headers (issue #192)", () => {
  const faq = readFaqCopy();
  const policy = readFileSync(
    join(ROOT, "security/SECURITY-POLICY.md"),
    "utf8",
  );
  const cspDoc = readFileSync(join(ROOT, "security/CSP.md"), "utf8");

  it("FAQ answer claims X-Frame-Options: DENY and HSTS (now true)", () => {
    expect(faq).toContain("X-Frame-Options: DENY");
    expect(faq).toContain("HSTS");
  });

  it("SECURITY-POLICY.md documents the same belt-and-suspenders pair", () => {
    expect(policy).toContain("**`X-Frame-Options: DENY`**");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain(DOCUMENTED_HSTS);
  });

  it("CSP.md implementation section shows the real header set", () => {
    expect(cspDoc).toContain('{ key: "X-Frame-Options", value: "DENY" }');
    expect(cspDoc).toContain(DOCUMENTED_HSTS);
  });

  it("no doc still instructs the removed vitest basic reporter", () => {
    // vitest 4+ removed the built-in `basic` reporter (ERR_LOAD_URL) — the
    // runbook now explicitly warns against it instead of using it.
    const runbook = readFileSync(join(ROOT, "docs/RUNBOOK.md"), "utf8");
    expect(runbook).not.toMatch(/vitest run --reporter=basic/);
    expect(runbook).toContain("DEFAULT reporter");
  });
});
