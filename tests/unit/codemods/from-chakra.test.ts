/**
 * from-chakra.test.ts — Chakra UI → RoyCSS inbound codemod (PF-015, #95)
 */

import { describe, it, expect } from "vitest";

import { codemod, MAPPINGS } from "../../../scripts/codemods/from-chakra";
import { standardCodemodSuite } from "./helpers";

standardCodemodSuite({
  def: codemod,
  inputFixture: "chakra-input.txt",
  expectedFixture: "chakra-expected.txt",
  sample: { from: "chakra-input", to: "roycss-form-focus-glow" },
  unknownClass: "definitely-not-a-chakra-class",
});

describe("from-chakra — semantics", () => {
  it("maps buttons and icon buttons to RoyCSS button effects", () => {
    const r = codemod.transform(`<button class="chakra-button chakra-iconbutton">OK</button>`);
    expect(r.output).toBe(`<button class="roycss-btn-glow roycss-btn-press">OK</button>`);
  });

  it("maps selection controls to the RoyCSS form family", () => {
    const r = codemod.transform(
      `<div class="chakra-switch__track chakra-checkbox__control chakra-radio__control">x</div>`,
    );
    expect(r.output).toBe(
      `<div class="roycss-form-toggle-switch roycss-form-checkbox-custom roycss-form-radio-custom">x</div>`,
    );
  });

  it("maps feedback classes (spinner, progress, skeleton, toast)", () => {
    const r = codemod.transform(
      `<div class="chakra-spinner chakra-progress__bar chakra-skeleton chakra-toast">x</div>`,
    );
    expect(r.output).toBe(
      `<div class="roycss-loader-spinner roycss-loader-indeterminate roycss-loader-skeleton roycss-state-toast-slide">x</div>`,
    );
  });

  it("maps overlay content/overlay pairs (modal, drawer)", () => {
    const r = codemod.transform(`<div class="chakra-modal__content chakra-drawer__overlay">x</div>`);
    expect(r.output).toBe(`<div class="roycss-card-glassmorphism roycss-modal-backdrop-blur">x</div>`);
  });

  it("keeps layout primitives (stack/flex/grid/box) — RoyCSS is not a layout system", () => {
    const src = `<div class="chakra-stack chakra-flex chakra-box chakra-text">x</div>`;
    const r = codemod.transform(src);
    expect(r.output).toBe(src);
    expect(r.kept).toEqual(expect.arrayContaining(["chakra-stack", "chakra-flex", "chakra-box", "chakra-text"]));
    expect(r.unknown).toEqual([]);
  });

  it("never touches emotion hashes — they are unknown by design", () => {
    const src = `<div class="css-hash-99 css-1xyz">x</div>`;
    const r = codemod.transform(src);
    expect(r.output).toBe(src);
    expect(r.unknown).toEqual(["css-hash-99", "css-1xyz"]);
    expect(r.replaced).toEqual([]);
  });

  it("exposes a non-null mapping count matching the exported table", () => {
    const nonNull = Object.values(MAPPINGS).filter((v) => v !== null && v !== undefined).length;
    expect(codemod.mappingCount?.()).toBe(nonNull);
    expect(nonNull).toBeGreaterThanOrEqual(25);
    expect(codemod.id).toBe("from-chakra");
  });
});
