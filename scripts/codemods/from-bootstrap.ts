/**
 * from-bootstrap.ts — inbound codemod (PF-015, issue #95)
 *
 * Bootstrap 5 component/utility classes → RoyCSS classes.
 *
 * Policy: every mapped target is a class the RoyCSS catalog really ships
 * (loaders, cards, buttons, nav, forms, state effects). Bootstrap classes
 * that are layout shells or have no RoyCSS counterpart (`card-body`,
 * `table`, `btn-lg`, …) are mapped to `null` — recognized, kept in place
 * and reported — so they are never silently rewritten.
 *
 * All targets validated against the live catalog by
 * tests/unit/codemods/mappings.test.ts.
 */

import { cliMain, defineTableCodemod } from "./lib/engine";
import type { MappingTable } from "./lib/mapper";

export const MAPPINGS: MappingTable = {
  // ── buttons ─────────────────────────────────────────────────────────────
  // Bootstrap variants → closest RoyCSS button effects (interaction styles,
  // not colors — RoyCSS is theme-agnostic).
  "btn-primary": "roycss-btn-glow",
  "btn-secondary": "roycss-btn-outline-fill",
  "btn-success": "roycss-btn-pulse",
  "btn-danger": "roycss-btn-neon",
  "btn-warning": "roycss-btn-lift",
  "btn-info": "roycss-btn-gradient",
  "btn-light": "roycss-btn-glass-press-b18",
  "btn-dark": "roycss-btn-3d-push",
  "btn-outline-primary": "roycss-btn-outline-fill",
  "btn-outline-secondary": "roycss-btn-outline-fill",
  "btn-outline-success": "roycss-btn-outline-fill",
  "btn-outline-danger": "roycss-btn-outline-fill",
  "btn-outline-warning": "roycss-btn-outline-fill",
  "btn-outline-info": "roycss-btn-outline-fill",
  "btn-outline-light": "roycss-btn-outline-fill",
  "btn-outline-dark": "roycss-btn-outline-fill",
  // sizing / shells: no RoyCSS equivalent → kept + reported
  btn: null,
  "btn-lg": null,
  "btn-sm": null,
  "btn-group": null,
  "btn-close": null,
  "btn-link": null,
  "btn-toolbar": null,

  // ── cards ───────────────────────────────────────────────────────────────
  card: "roycss-card-glassmorphism",
  "card-hover": "roycss-card-hover-lift",
  "card-body": null,
  "card-title": null,
  "card-text": null,
  "card-header": null,
  "card-footer": null,
  "card-img-top": null,
  "card-group": null,

  // ── alerts → RoyCSS state cards ─────────────────────────────────────────
  // (bare `alert` is the Bootstrap shell — recognized, kept, reported)
  alert: null,
  "alert-success": "roycss-card-success-state",
  "alert-danger": "roycss-card-error-state",
  "alert-warning": "roycss-card-notification",
  "alert-info": "roycss-card-notification",
  "alert-primary": null,
  "alert-secondary": null,
  "alert-light": null,
  "alert-dark": null,
  "alert-heading": null,
  "alert-link": null,
  "alert-dismissible": null,

  // ── badges → RoyCSS glass badge pill ────────────────────────────────────
  badge: "roycss-glass-badge-pill-b18",
  "badge-pill": "roycss-glass-badge-pill-b18",
  "badge-primary": "roycss-glass-badge-pill-b18",
  "badge-secondary": "roycss-glass-badge-pill-b18",
  "badge-success": "roycss-glass-badge-pill-b18",
  "badge-danger": "roycss-glass-badge-pill-b18",
  "badge-warning": "roycss-glass-badge-pill-b18",
  "badge-info": "roycss-glass-badge-pill-b18",
  "badge-light": "roycss-glass-badge-pill-b18",
  "badge-dark": "roycss-glass-badge-pill-b18",

  // ── modal ───────────────────────────────────────────────────────────────
  "modal-content": "roycss-card-glassmorphism",
  "modal-backdrop": "roycss-modal-backdrop-blur",
  modal: null,
  "modal-dialog": null,
  "modal-header": null,
  "modal-body": null,
  "modal-footer": null,
  "modal-title": null,
  fade: null,
  show: null,

  // ── spinners → RoyCSS loaders ───────────────────────────────────────────
  "spinner-border": "roycss-loader-spinner",
  "spinner-border-sm": "roycss-loader-spinner",
  "spinner-grow": "roycss-loader-pulse-circle",
  "spinner-grow-sm": "roycss-loader-pulse-circle",

  // ── progress → RoyCSS loader bars ───────────────────────────────────────
  "progress-bar": "roycss-loader-progress-bar",
  "progress-bar-striped": "roycss-loader-progress-bar",
  "progress-bar-animated": "roycss-loader-indeterminate",
  progress: null,

  // ── placeholders / skeletons ────────────────────────────────────────────
  placeholder: "roycss-loader-skeleton",
  "placeholder-glow": "roycss-state-skeleton-pulse",
  "placeholder-wave": "roycss-state-skeleton-wave",

  // ── navigation → RoyCSS nav effects ─────────────────────────────────────
  navbar: "roycss-glass-nav-bar-b18",
  "nav-tabs": "roycss-nav-tabs-underline",
  "nav-pills": "roycss-nav-tabs-underline",
  breadcrumb: "roycss-nav-breadcrumb",
  pagination: "roycss-nav-pagination",
  accordion: "roycss-nav-accordion",
  "dropdown-menu": "roycss-nav-dropdown",
  "navbar-brand": null,
  "navbar-nav": null,
  "navbar-expand": null,
  nav: null,
  "nav-item": null,
  "nav-link": null,
  "breadcrumb-item": null,
  "page-item": null,
  "page-link": null,
  "accordion-item": null,
  "accordion-button": null,
  "accordion-body": null,
  "accordion-collapse": null,
  dropdown: null,
  "dropdown-item": null,
  "dropdown-toggle": null,

  // ── forms → RoyCSS form effects ─────────────────────────────────────────
  "form-switch": "roycss-form-toggle-switch",
  "form-floating": "roycss-form-label-float",
  "is-invalid": "roycss-form-error-shake",
  "is-valid": "roycss-form-success-check",
  "form-control": null,
  "form-control-lg": null,
  "form-control-sm": null,
  "form-label": null,
  "form-select": null,
  "form-check": null,
  "form-check-input": null,
  "form-check-label": null,
  "form-range": null,
  "form-text": null,
  "input-group": null,
  "input-group-text": null,
  "was-validated": null,
  "invalid-feedback": null,
  "valid-feedback": null,

  // ── misc components with no RoyCSS counterpart → kept + reported ────────
  toast: "roycss-state-toast-slide",
  "toast-body": null,
  "toast-header": null,
  table: null,
  "table-striped": null,
  "table-bordered": null,
  "table-hover": null,
  "table-sm": null,
  "table-responsive": null,
  carousel: null,
  "carousel-inner": null,
  "carousel-item": null,
  "list-group": null,
  "list-group-item": null,
  offcanvas: null,
  "offcanvas-body": null,
  tooltip: null,
  "tooltip-inner": null,
  popover: null,
  "popover-body": null,
  collapse: null,
  "visually-hidden": null,
};

export const codemod = defineTableCodemod({
  id: "from-bootstrap",
  kind: "inbound",
  label: "Bootstrap 5 → RoyCSS",
  description:
    "Map Bootstrap buttons, cards, alerts, badges, spinners, nav and form classes to RoyCSS effect classes; shells and unmatched components are kept and reported.",
  mappings: MAPPINGS,
});


// ─── Standalone entry: bun scripts/codemods/from-bootstrap.ts <glob> [--write] ───
if (import.meta.main) {
  process.exit(cliMain(codemod, process.argv.slice(2)));
}

export default codemod;
