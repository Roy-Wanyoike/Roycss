import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  FrameworkTabs,
  nextFrameworkTabId,
} from "@/components/roycss/framework-tabs";
import { getFrameworkExamples } from "@/lib/framework-adapters";
import type { FrameworkId } from "@/lib/framework-adapters";

/**
 * FrameworkTabs — the ARIA tabs switcher behind "Use in your framework"
 * (issue #246), shared by the effect detail DIALOG (framework-usage.tsx)
 * and the /effects/<id> page (FrameworkUsageSection).
 *
 * Pinned at three levels, mirroring the repo's test rigor:
 *   1. behavioral — the pure APG arrow-key model (nextFrameworkTabId);
 *   2. structural — a real renderToStaticMarkup pass asserting the SSR
 *      semantics (role=tablist/tab/tabpanel, aria-selected tracking the
 *      active stack, roving tabindex, hidden inactive panels, full
 *      aria-controls/labelledby wiring, all panels crawlable);
 *   3. source-level wiring — keyboard handler presence, unchanged copy
 *      paths, and the dialog/page call sites.
 */

const ROOT = join(__dirname, "..", "..");

const TABS_SRC = readFileSync(
  join(ROOT, "src/components/roycss/framework-tabs.tsx"),
  "utf8",
);
const USAGE_SRC = readFileSync(
  join(ROOT, "src/components/roycss/framework-usage.tsx"),
  "utf8",
);
const DIALOG_SRC = readFileSync(
  join(ROOT, "src/components/roycss/effect-detail-dialog.tsx"),
  "utf8",
);
const DETAIL_PAGE_SRC = readFileSync(
  join(ROOT, "src/app/effects/[id]/page.tsx"),
  "utf8",
);

/** Tab order = getFrameworkExamples order (vanilla → nextjs). */
const EXAMPLES = getFrameworkExamples(
  "hover-glow-border",
  "Hover Glow Border",
);
const IDS = EXAMPLES.map((e) => e.id);

describe("nextFrameworkTabId: APG arrow-key model (wrapping, automatic)", () => {
  it("ArrowRight moves to the next stack in tab order", () => {
    expect(nextFrameworkTabId(IDS, "vanilla", "ArrowRight")).toBe("react");
    expect(nextFrameworkTabId(IDS, "svelte", "ArrowRight")).toBe("nextjs");
  });

  it("ArrowRight wraps at the end of the list", () => {
    expect(nextFrameworkTabId(IDS, "nextjs", "ArrowRight")).toBe("vanilla");
  });

  it("ArrowLeft moves back and wraps at the start", () => {
    expect(nextFrameworkTabId(IDS, "react", "ArrowLeft")).toBe("vanilla");
    expect(nextFrameworkTabId(IDS, "vanilla", "ArrowLeft")).toBe("nextjs");
  });

  it("Home and End jump to the first/last stack", () => {
    expect(nextFrameworkTabId(IDS, "angular", "Home")).toBe("vanilla");
    expect(nextFrameworkTabId(IDS, "vanilla", "End")).toBe("nextjs");
  });

  it("an unknown current id falls back to the head before stepping", () => {
    expect(nextFrameworkTabId(IDS, "not-a-stack" as FrameworkId, "ArrowRight")).toBe(
      "react",
    );
    expect(nextFrameworkTabId(IDS, "not-a-stack" as FrameworkId, "Home")).toBe(
      "vanilla",
    );
  });

  it("a single-entry list is a fixed point for every key", () => {
    for (const key of ["ArrowRight", "ArrowLeft", "Home", "End"] as const) {
      expect(nextFrameworkTabId(["react"], "react", key)).toBe("react");
    }
  });
});

describe("FrameworkTabs SSR semantics (renderToStaticMarkup)", () => {
  const panels = EXAMPLES.map((ex) =>
    createElement("p", { key: ex.id }, `panel-content-${ex.id}`),
  );

  function render(initialActiveId?: FrameworkId): string {
    return renderToStaticMarkup(
      createElement(FrameworkTabs, { examples: EXAMPLES, panels, initialActiveId }),
    );
  }

  it("renders one tablist labeled 'Use in your framework' with six tabs", () => {
    const html = render("react");
    expect(html).toContain('role="tablist" aria-label="Use in your framework"');
    expect(html.match(/role="tab"/g)?.length).toBe(6);
    expect(html.match(/role="tabpanel"/g)?.length).toBe(6);
  });

  it("aria-selected tracks the active stack (exactly one true)", () => {
    const html = render("react");
    expect(html.match(/aria-selected="true"/g)?.length).toBe(1);
    expect(html.match(/aria-selected="false"/g)?.length).toBe(5);
    expect(html).toMatch(/id="[^"]+-tab-react" aria-selected="true"/);
  });

  it("defaults to the FIRST stack when no initialActiveId is passed", () => {
    const html = render();
    expect(html).toMatch(/id="[^"]+-tab-vanilla" aria-selected="true"/);
  });

  it("roving tabindex: exactly one tab in the page tab order", () => {
    const html = render("react");
    expect(html.match(/tabindex="0"/g)?.length).toBe(1);
    expect(html.match(/tabindex="-1"/g)?.length).toBe(5);
  });

  it("ALL panels stay mounted — inactive ones hidden (crawlability contract)", () => {
    const html = render("react");
    // Five hidden panels, one visible; no panel unmounted.
    expect(html.match(/ hidden=""/g)?.length).toBe(5);
    for (const ex of EXAMPLES) {
      expect(html).toContain(`panel-content-${ex.id}`);
    }
  });

  it("every tab↔panel pair is wired (aria-controls + aria-labelledby)", () => {
    const html = render("react");
    const controls = [...html.matchAll(/aria-controls="([^"]+)"/g)].map(
      (m) => m[1],
    );
    expect(controls.length).toBe(6);
    for (const panelId of controls) {
      // The referenced tabpanel id must exist in the document.
      expect(html).toContain(`id="${panelId}"`);
    }
    // panel → its own tab via aria-labelledby (same generated id base).
    expect(html).toMatch(
      /id="([^"]+)-panel-react" aria-labelledby="[^"]+-tab-react"/,
    );
  });

  it("the tab labels are the frameworkLabels strings", () => {
    const html = render("react");
    for (const ex of EXAMPLES) {
      expect(html).toContain(`>${ex.label}</button>`);
    }
  });
});

describe("FrameworkTabs source wiring (#246)", () => {
  it("is a client component implementing the APG keyboard interaction", () => {
    expect(TABS_SRC.trimStart().startsWith('"use client"')).toBe(true);
    expect(TABS_SRC).toContain('key !== "ArrowRight"');
    expect(TABS_SRC).toContain('key !== "ArrowLeft"');
    expect(TABS_SRC).toContain('key !== "Home"');
    expect(TABS_SRC).toContain('key !== "End"');
    expect(TABS_SRC).toContain("event.preventDefault()");
    // Focus moves WITH activation (automatic-activation tabs).
    expect(TABS_SRC).toContain(".focus()");
  });

  it("carries the full ARIA tab attribute set", () => {
    expect(TABS_SRC).toContain('role="tablist"');
    expect(TABS_SRC).toContain('aria-label="Use in your framework"');
    expect(TABS_SRC).toContain('role="tab"');
    expect(TABS_SRC).toContain("aria-selected={isCurrent}");
    expect(TABS_SRC).toContain("aria-controls={panelId(ex.id)}");
    expect(TABS_SRC).toContain("tabIndex={isCurrent ? 0 : -1}");
    expect(TABS_SRC).toContain('role="tabpanel"');
    expect(TABS_SRC).toContain("aria-labelledby={tabId(ex.id)}");
    expect(TABS_SRC).toContain("hidden={ex.id !== current.id}");
  });

  it("replaces the old aria-pressed toggle semantics everywhere", () => {
    expect(TABS_SRC).not.toContain("aria-pressed");
    expect(USAGE_SRC).not.toContain("aria-pressed");
  });

  it("the dialog keeps its copy path and its React default tab", () => {
    // Copy behavior unchanged: per-panel CopyButton writing the raw code.
    expect(USAGE_SRC).toContain("<CopyButton text={code} label={title} />");
    // Historical useState("react") seed preserved via initialActiveId.
    expect(USAGE_SRC).toContain('initialActiveId="react"');
    expect(DIALOG_SRC).toContain(
      "<FrameworkUsage effectId={effect.id} effectName={effect.name} />",
    );
  });

  it("the /effects/<id> page feeds page-built panels to FrameworkTabs", () => {
    expect(DETAIL_PAGE_SRC).toContain(
      "<FrameworkTabs examples={examples} panels={panels} />",
    );
    // Panel content is built in the page source — the docs CodeBlock (with
    // its own copy button) stays the single copy mechanism.
    expect(DETAIL_PAGE_SRC).toContain("code={example.install}");
    expect(DETAIL_PAGE_SRC).toContain("code={example.import}");
    expect(DETAIL_PAGE_SRC).toContain("code={example.usage}");
  });
});
