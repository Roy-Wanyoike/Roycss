/**
 * from-animate-css.test.ts — Animate.css → RoyCSS inbound codemod (PF-015, #95)
 */

import { describe, it, expect } from "vitest";

import { codemod, MAPPINGS } from "../../../scripts/codemods/from-animate-css";
import { standardCodemodSuite } from "./helpers";

standardCodemodSuite({
  def: codemod,
  inputFixture: "animate-css-input.html",
  expectedFixture: "animate-css-expected.html",
  sample: { from: "animate__fadeIn", to: "roycss-fade-in" },
  unknownClass: "definitely-not-an-animate-css-class",
});

describe("from-animate-css — semantics", () => {
  it("maps every directional fadeIn variant (incl. Big) onto fade-in families", () => {
    const r = codemod.transform(
      `<div class="animate__fadeInUp animate__fadeInLeftBig animate__fadeOutDown">x</div>`,
    );
    expect(r.output).toBe(`<div class="roycss-fade-in-up roycss-fade-in-left roycss-fade-out-down">x</div>`);
  });

  it("preserves slide direction semantics (slideInUp enters from the bottom edge)", () => {
    const r = codemod.transform(`<div class="animate__slideInUp animate__slideOutLeft">x</div>`);
    expect(r.output).toBe(`<div class="roycss-slide-in-bottom roycss-slide-out-left">x</div>`);
  });

  it("maps attention seekers onto their RoyCSS counterparts", () => {
    const r = codemod.transform(`<div class="animate__heartBeat animate__wobble animate__jello">x</div>`);
    expect(r.output).toBe(`<div class="roycss-heartbeat roycss-wobble roycss-jello">x</div>`);
  });

  it("keeps variants with no catalog counterpart (zoomOutDown, hinge) instead of guessing", () => {
    const src = `<div class="animate__zoomOutDown animate__hinge animate__flipOutX">x</div>`;
    const r = codemod.transform(src);
    expect(r.output).toBe(src);
    expect(r.kept).toEqual(expect.arrayContaining(["animate__zoomOutDown", "animate__hinge", "animate__flipOutX"]));
    expect(r.unknown).toEqual([]);
  });

  it("keeps speed and repeat modifiers (RoyCSS classes ship their own timing)", () => {
    const src = `<div class="animate__animated animate__fast animate__repeat_2">x</div>`;
    const r = codemod.transform(src);
    expect(r.output).toBe(src);
    expect(r.kept).toEqual(expect.arrayContaining(["animate__animated", "animate__fast", "animate__repeat_2"]));
  });

  it("maps one-shot entrances (roll, jackInTheBox, lightSpeedIn)", () => {
    const r = codemod.transform(`<div class="animate__rollIn animate__jackInTheBox">x</div>`);
    expect(r.output).toBe(`<div class="roycss-roll-in roycss-jack-in-box">x</div>`);
  });

  it("exposes a non-null mapping count matching the exported table", () => {
    const nonNull = Object.values(MAPPINGS).filter((v) => v !== null && v !== undefined).length;
    expect(codemod.mappingCount?.()).toBe(nonNull);
    expect(nonNull).toBeGreaterThanOrEqual(40);
    expect(codemod.id).toBe("from-animate-css");
  });
});
