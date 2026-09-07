/**
 * from-mui.test.ts — Material UI → RoyCSS inbound codemod (PF-015, #95)
 */

import { describe, it, expect } from "vitest";

import { codemod, MAPPINGS } from "../../../scripts/codemods/from-mui";
import { standardCodemodSuite } from "./helpers";

standardCodemodSuite({
  def: codemod,
  inputFixture: "mui-input.txt",
  expectedFixture: "mui-expected.txt",
  sample: { from: "MuiButton-containedPrimary", to: "roycss-btn-glow" },
  unknownClass: "definitely-not-a-mui-class",
});

describe("from-mui — semantics", () => {
  it("maps button variant fragments to RoyCSS button effects", () => {
    const r = codemod.transform(`<button class="MuiButton-contained MuiFab-root">Go</button>`);
    expect(r.output).toBe(`<button class="roycss-btn-gradient roycss-btn-pulse">Go</button>`);
  });

  it("maps surfaces (Card, Paper, AppBar, Dialog) to RoyCSS card/nav effects", () => {
    const r = codemod.transform(
      `<div class="MuiCard-root MuiAppBar-root MuiDialogBackdrop-root">x</div>`,
    );
    expect(r.output).toBe(
      `<div class="roycss-card-glassmorphism roycss-glass-nav-bar-b18 roycss-modal-backdrop-blur">x</div>`,
    );
  });

  it("maps alert severity variants to RoyCSS state cards", () => {
    const r = codemod.transform(`<div class="MuiAlert-standardError MuiAlert-filledSuccess">!</div>`);
    expect(r.output).toBe(`<div class="roycss-card-error-state roycss-card-success-state">!</div>`);
  });

  it("maps progress/skeleton feedback classes to the RoyCSS loader family", () => {
    const r = codemod.transform(`<div class="MuiLinearProgress-root MuiSkeleton-pulse">…</div>`);
    expect(r.output).toBe(`<div class="roycss-loader-progress-bar roycss-state-skeleton-pulse">…</div>`);
  });

  it("never touches emotion hashes — they are unknown by design", () => {
    const src = `<div class="css-1a2b3c Muirtl-xyz makeStyles-foo">x</div>`;
    const r = codemod.transform(src);
    expect(r.output).toBe(src);
    expect(r.unknown).toEqual(["css-1a2b3c", "Muirtl-xyz", "makeStyles-foo"]);
    expect(r.replaced).toEqual([]);
  });

  it("keeps shell classes (roots, cells, toolbars) — recognized, no equivalent", () => {
    const src = `<div class="MuiToolbar-root MuiTableCell-root MuiTooltip-tooltip">x</div>`;
    const r = codemod.transform(src);
    expect(r.output).toBe(src);
    expect(r.kept).toEqual(expect.arrayContaining(["MuiToolbar-root", "MuiTableCell-root", "MuiTooltip-tooltip"]));
    expect(r.unknown).toEqual([]);
  });

  it("exposes a non-null mapping count matching the exported table", () => {
    const nonNull = Object.values(MAPPINGS).filter((v) => v !== null && v !== undefined).length;
    expect(codemod.mappingCount?.()).toBe(nonNull);
    expect(nonNull).toBeGreaterThanOrEqual(40);
    expect(codemod.id).toBe("from-mui");
  });
});
