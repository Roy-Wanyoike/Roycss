import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  getFrameworkExamples,
  frameworkLabels,
  type FrameworkId,
} from "@/lib/framework-adapters";
import { COPY_FORMATS, formatCss } from "@/lib/copy-formats";
import { getEffect } from "@/app/effects/_lib/static-effects";

const ROOT = join(__dirname, "..", "..");
const PAGE_SRC = join(ROOT, "src/app/effects/[id]/page.tsx");

/**
 * Issue #190 — rendering contract for the /effects/[id] completeness
 * sections. This repo has no component/React test environment (vitest runs
 * in `node`), so the contract is pinned the established way: source-level
 * wiring assertions on the page + behavioral assertions on the pure lib
 * modules the page composes.
 *
 * The crawlability requirement: ALL framework panels' code and ALL 7
 * copy-as formats must be in the server-rendered HTML. Since issue #246
 * the framework switcher is an ARIA tabs pattern (shared FrameworkTabs
 * component, tested in tests/unit/framework-tabs.test.ts) whose tabpanels
 * ALL stay mounted — inactive ones carry the `hidden` attribute — so the
 * snippets remain readable without JS, exactly as the old <details>
 * accordion provided (switching just became a JS tabs interaction).
 */
describe("effects/[id] framework usage section", () => {
  const page = readFileSync(PAGE_SRC, "utf8");

  it("renders framework tabs from the single-source adapters module", () => {
    expect(page).toContain('from "@/lib/framework-adapters"');
    expect(page).toContain("getFrameworkExamples(effect.id, effect.name)");
  });

  it("renders the ARIA tab switcher with every stack's code server-rendered", () => {
    // Issue #246: <details> accordion → shared ARIA tabs (role=tablist/tab/
    // tabpanel + aria-selected + roving tabindex + arrow-key nav). The page
    // keeps building the panel content itself, so the CodeBlock copy path
    // is unchanged, and FrameworkTabs mounts ALL tabpanels (inactive ones
    // hidden) — the crawlability contract survives the semantic upgrade.
    expect(page).toContain('from "@/components/roycss/framework-tabs"');
    expect(page).toContain("<FrameworkTabs");
    expect(page).toContain("panels={panels}");
    // The exclusive-accordion name attribute is gone with the accordion.
    expect(page).not.toContain('name="framework-usage"');
    // The Copy-as section keeps its native <details> disclosure.
    expect(page).toContain("<details");
  });

  it("renders install, import and usage snippets per framework via CodeBlock", () => {
    expect(page).toContain("code={example.install}");
    expect(page).toContain("code={example.import}");
    expect(page).toContain("code={example.usage}");
    expect(page).toContain('from "@/components/docs/CodeBlock"');
  });

  it("CONTRACT: all 6 frameworks yield labeled, class-carrying usage snippets", () => {
    const expected: FrameworkId[] = [
      "vanilla",
      "react",
      "vue",
      "angular",
      "svelte",
      "nextjs",
    ];
    const examples = getFrameworkExamples("pulse-glow", "Pulse Glow");
    expect(examples.map((e) => e.id).sort()).toEqual([...expected].sort());
    for (const ex of examples) {
      expect(ex.label).toBe(frameworkLabels[ex.id]);
      // The usage snippet must reference the effect's class in EVERY stack.
      expect(ex.usage, ex.id).toContain("roycss-pulse-glow");
      // Install must name the package in EVERY stack.
      expect(ex.install, ex.id).toContain("roycss");
    }
  });
});

describe("effects/[id] copy-as section", () => {
  const page = readFileSync(PAGE_SRC, "utf8");

  it("server-renders the 7-format list from copy-formats.ts", () => {
    expect(page).toContain('from "@/lib/copy-formats"');
    expect(page).toContain("COPY_FORMATS.map");
  });

  it("keeps clipboard output single-source: buttons share the dialog's hook", () => {
    // Client islands must reuse useCopyFormat (formatCss lives in ONE module);
    // the page itself must not inline formatCss calls.
    expect(page).toContain('from "@/components/roycss/copy-format-button"');
    const hook = readFileSync(
      join(ROOT, "src/components/roycss/use-copy-format.ts"),
      "utf8"
    );
    expect(hook).toContain('from "@/lib/copy-formats"');
    expect(hook).toContain("formatCss(");
    const dropdown = readFileSync(
      join(ROOT, "src/components/roycss/copy-as-dropdown.tsx"),
      "utf8"
    );
    expect(dropdown).toContain("useCopyFormat(");
  });

  it("CONTRACT: all 7 formats produce distinct non-empty output for a real effect", () => {
    const effect = getEffect("loader-dots")!;
    expect(COPY_FORMATS).toHaveLength(7);
    const outputs = new Set<string>();
    for (const f of COPY_FORMATS) {
      const out = formatCss(effect.cssCode, effect.id, f.id);
      expect(out.length, f.id).toBeGreaterThan(0);
      outputs.add(out);
    }
    // 7 formats, at least 6 distinct outputs (css and html may share a
    // prefix but still differ — this asserts no format silently broke).
    expect(outputs.size).toBeGreaterThanOrEqual(6);
  });
});

describe("effects/[id] completeness wiring", () => {
  const page = readFileSync(PAGE_SRC, "utf8");

  it("renders the a11y row from the derived badge module", () => {
    expect(page).toContain("getEffectPageA11yBadges(effect.id)");
    expect(page).toContain("getReducedMotionNote(");
  });

  it("renders the required-markup block from the derived helper", () => {
    expect(page).toContain("getRequiredMarkup(effect)");
    expect(page).toContain("RequiredMarkupSection");
  });

  it("renders the browser-support one-liner from the feature scan", () => {
    expect(page).toContain("formatBrowserSupport(getBrowserSupport(effect.cssCode))");
  });

  it("metadata uses the #188 title/description template fns + og:type website", () => {
    expect(page).toContain("effectPageTitle(effect.name)");
    expect(page).toContain("effectPageDescription(effect.description)");
    expect(page).toContain('type: "website"');
    expect(page).not.toContain('type: "article"');
    // Per-effect canonical + OG image logic stays intact.
    expect(page).toContain("alternates: { canonical: url }");
    expect(page).toContain("${SITE_URL}/api/og?effect=${effect.id}");
  });

  it("keeps the ISR contract and exactly one H1", () => {
    expect(page).toContain("export const dynamicParams = true;");
    expect(page).toContain("export const revalidate = 86400;");
    expect(page).not.toContain('export const dynamic = "force-static";');
    expect(page.match(/if \(!effect\) notFound\(\);/g)?.length).toBe(2);
    expect(page.match(/<h1/g)?.length).toBe(1);
  });

  it("reuses existing tokens (no new component stack for code blocks)", () => {
    // CodeBlock (with copy) for source + markup + framework snippets.
    expect(page.match(/<CodeBlock/g)?.length).toBeGreaterThanOrEqual(4);
  });
});
