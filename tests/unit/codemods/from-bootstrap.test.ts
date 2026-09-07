/**
 * from-bootstrap.test.ts — Bootstrap 5 → RoyCSS inbound codemod (PF-015, #95)
 */

import { describe, it, expect } from "vitest";

import { codemod, MAPPINGS } from "../../../scripts/codemods/from-bootstrap";
import { standardCodemodSuite } from "./helpers";

standardCodemodSuite({
  def: codemod,
  inputFixture: "bootstrap-input.html",
  expectedFixture: "bootstrap-expected.html",
  sample: { from: "btn-primary", to: "roycss-btn-glow" },
  unknownClass: "definitely-not-a-bootstrap-class",
});

describe("from-bootstrap — semantics", () => {
  it("maps button variants to RoyCSS button effects", () => {
    const r = codemod.transform(`<button class="btn btn-primary btn-outline-success">Go</button>`);
    expect(r.output).toBe(`<button class="btn roycss-btn-glow roycss-btn-outline-fill">Go</button>`);
  });

  it("maps spinners and progress onto the RoyCSS loader family", () => {
    const r = codemod.transform(
      `<div class="spinner-border spinner-grow progress-bar-animated placeholder-wave"></div>`,
    );
    expect(r.output).toBe(
      `<div class="roycss-loader-spinner roycss-loader-pulse-circle roycss-loader-indeterminate roycss-state-skeleton-wave"></div>`,
    );
  });

  it("maps navigation shells onto RoyCSS nav effects", () => {
    const r = codemod.transform(`<nav class="navbar nav-tabs pagination"></nav>`);
    expect(r.output).toBe(
      `<nav class="roycss-glass-nav-bar-b18 roycss-nav-tabs-underline roycss-nav-pagination"></nav>`,
    );
  });

  it("maps state alerts onto RoyCSS state cards, keeping the shell class", () => {
    const r = codemod.transform(`<div class="alert alert-danger">Boom</div>`);
    expect(r.output).toBe(`<div class="alert roycss-card-error-state">Boom</div>`);
    expect(r.kept).toContain("alert");
  });

  it("keeps layout shells with no RoyCSS equivalent (btn-lg, card-body, table…)", () => {
    const src = `<div class="card-body btn-lg table table-striped">x</div>`;
    const r = codemod.transform(src);
    expect(r.output).toBe(src);
    expect(r.kept).toEqual(expect.arrayContaining(["card-body", "btn-lg", "table", "table-striped"]));
    expect(r.unknown).toEqual([]);
  });

  it("maps form state classes onto RoyCSS form effects", () => {
    const r = codemod.transform(`<input class="is-invalid form-switch" />`);
    expect(r.output).toBe(`<input class="roycss-form-error-shake roycss-form-toggle-switch" />`);
  });

  it("exposes a non-null mapping count matching the exported table", () => {
    const nonNull = Object.values(MAPPINGS).filter((v) => v !== null && v !== undefined).length;
    expect(codemod.mappingCount?.()).toBe(nonNull);
    expect(nonNull).toBeGreaterThanOrEqual(40);
    expect(codemod.id).toBe("from-bootstrap");
  });
});
