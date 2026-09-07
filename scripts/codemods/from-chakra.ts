/**
 * from-chakra.ts — inbound codemod (PF-015, issue #95)
 *
 * Chakra UI DOM classes (the top-40 `chakra-*` fragments users meet in
 * rendered markup and `className` overrides) → closest RoyCSS classes.
 *
 * Layout primitives (`chakra-stack`, `chakra-flex`, …) map to `null` —
 * recognized, kept, reported: RoyCSS is an effects library, not a layout
 * system. Emotion hashes (`css-1a2b3c`) are unknown by design and always
 * reported, never guessed.
 *
 * Every non-null target is validated against the live catalog by
 * tests/unit/codemods/mappings.test.ts.
 */

import { cliMain, defineTableCodemod } from "./lib/engine";
import type { MappingTable } from "./lib/mapper";

export const MAPPINGS: MappingTable = {
  // ── buttons ─────────────────────────────────────────────────────────────
  "chakra-button": "roycss-btn-glow",
  "chakra-button__icon": null,
  "chakra-iconbutton": "roycss-btn-press",
  "chakra-close-button": "roycss-btn-press",

  // ── inputs ──────────────────────────────────────────────────────────────
  "chakra-input": "roycss-form-focus-glow",
  "chakra-input__addon": null,
  "chakra-textarea": "roycss-form-underline-draw",
  "chakra-select": null,
  "chakra-form-control": null,
  "chakra-form-label": "roycss-form-label-float",
  "chakra-form__helper-text": null,
  "chakra-form__error-text": null,
  "chakra-form__required-indicator": null,
  "chakra-pin-input": null,

  // ── selection controls ──────────────────────────────────────────────────
  "chakra-switch__track": "roycss-form-toggle-switch",
  "chakra-switch__thumb": "roycss-form-toggle-switch",
  "chakra-switch__container": null,
  "chakra-checkbox__control": "roycss-form-checkbox-custom",
  "chakra-checkbox__label": null,
  "chakra-radio__control": "roycss-form-radio-custom",
  "chakra-radio__label": null,

  // ── surfaces ────────────────────────────────────────────────────────────
  "chakra-card": "roycss-card-glassmorphism",
  "chakra-card__body": null,
  "chakra-card__header": null,
  "chakra-card__footer": null,
  "chakra-stack": null,
  "chakra-flex": null,
  "chakra-grid": null,
  "chakra-box": null,
  "chakra-text": null,
  "chakra-heading": null,
  "chakra-container": null,
  "chakra-wrap": null,
  "chakra-divider": null,

  // ── feedback ────────────────────────────────────────────────────────────
  "chakra-alert": "roycss-card-notification",
  "chakra-alert__title": null,
  "chakra-alert__desc": null,
  "chakra-alert__icon": null,
  "chakra-spinner": "roycss-loader-spinner",
  "chakra-progress": "roycss-loader-progress-bar",
  "chakra-progress__track": "roycss-loader-progress-bar",
  "chakra-progress__bar": "roycss-loader-indeterminate",
  "chakra-skeleton": "roycss-loader-skeleton",
  "chakra-skeleton__text": "roycss-skeleton-text-lines",
  "chakra-toast": "roycss-state-toast-slide",

  // ── overlays ────────────────────────────────────────────────────────────
  "chakra-modal__content": "roycss-card-glassmorphism",
  "chakra-modal__overlay": "roycss-modal-backdrop-blur",
  "chakra-modal__header": null,
  "chakra-modal__body": null,
  "chakra-modal__footer": null,
  "chakra-modal__close-button": null,
  "chakra-drawer__content": null,
  "chakra-drawer__overlay": "roycss-modal-backdrop-blur",
  "chakra-popper": null,
  "chakra-tooltip": null,

  // ── data display ────────────────────────────────────────────────────────
  "chakra-badge": "roycss-glass-badge-pill-b18",
  "chakra-tag": "roycss-glass-badge-pill-b18",
  "chakra-tag__label": null,
  "chakra-avatar": "roycss-card-profile-avatar",
  "chakra-avatar__name": null,
  "chakra-code": null,
  "chakra-kbd": null,
  "chakra-table": null,
  "chakra-tabs__tab": "roycss-nav-tabs-underline",
  "chakra-tabs__tablist": null,
  "chakra-tabs__tabpanel": null,
  "chakra-breadcrumb": "roycss-nav-breadcrumb",
  "chakra-breadcrumb__link": null,
  "chakra-accordion": "roycss-nav-accordion",
  "chakra-accordion__item": null,
  "chakra-accordion__button": null,
  "chakra-accordion__panel": null,
  "chakra-pagination": "roycss-nav-pagination",
  "chakra-stepper": "roycss-nav-stepper",
  "chakra-steps": "roycss-nav-stepper",
  "chakra-menu__list": "roycss-nav-dropdown",
  "chakra-menu__item": null,
  "chakra-menu__button": null,
};

export const codemod = defineTableCodemod({
  id: "from-chakra",
  kind: "inbound",
  label: "Chakra UI → RoyCSS",
  description:
    "Map the top chakra-* class fragments to closest RoyCSS effect classes; layout primitives and emotion hashes are kept untouched and reported.",
  mappings: MAPPINGS,
});


// ─── Standalone entry: bun scripts/codemods/from-chakra.ts <glob> [--write] ───
if (import.meta.main) {
  process.exit(cliMain(codemod, process.argv.slice(2)));
}

export default codemod;
