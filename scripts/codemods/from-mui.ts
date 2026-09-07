/**
 * from-mui.ts — inbound codemod (PF-015, issue #95)
 *
 * Material UI global class fragments (the top-40 `Mui*` classes users
 * reference in `className` props and style overrides) → closest RoyCSS
 * classes.
 *
 * MUI's emotion-generated hashed classes (`css-1a2b3c`, `Muirtl-xyz`) are
 * never mapped — they stay untouched and are reported as unknown, because
 * guessing what a hash renders is exactly the kind of silent wrongness this
 * library refuses. Shell classes (`MuiToolbar-root`, `MuiTableCell-root`, …)
 * map to `null`: recognized, kept, reported.
 *
 * Every non-null target is validated against the live catalog by
 * tests/unit/codemods/mappings.test.ts.
 */

import { cliMain, defineTableCodemod } from "./lib/engine";
import type { MappingTable } from "./lib/mapper";

/** Emotion / runtime hashes (`css-1a2b3c`, `Muirtl-*`, `makeStyles-*`) are
 * deliberately NOT in any list: they fall through to the `unknown` bucket —
 * kept untouched and reported — exactly as issue #95 requires. */

export const MAPPINGS: MappingTable = {
  // ── buttons ─────────────────────────────────────────────────────────────
  "MuiButton-contained": "roycss-btn-gradient",
  "MuiButton-containedPrimary": "roycss-btn-glow",
  "MuiButton-containedSecondary": "roycss-btn-outline-fill",
  "MuiButton-outlined": "roycss-btn-outline-fill",
  "MuiButton-outlinedPrimary": "roycss-btn-outline-fill",
  "MuiButton-outlinedSecondary": "roycss-btn-outline-fill",
  "MuiButton-text": null,
  "MuiButton-textPrimary": null,
  "MuiButton-textSecondary": null,
  "MuiButton-root": null,
  "MuiIconButton-root": null,
  "MuiFab-root": "roycss-btn-pulse",
  "MuiToggleButton-root": null,
  "MuiButtonGroup-root": null,

  // ── surfaces ────────────────────────────────────────────────────────────
  "MuiCard-root": "roycss-card-glassmorphism",
  "MuiCardMedia-root": null,
  "MuiCardContent-root": null,
  "MuiCardActions-root": null,
  "MuiPaper-root": "roycss-card-glassmorphism",
  "MuiAppBar-root": "roycss-glass-nav-bar-b18",
  "MuiToolbar-root": null,
  "MuiDrawer-paper": null,
  "MuiAccordion-root": "roycss-nav-accordion",
  "MuiAccordionSummary-root": null,
  "MuiExpansionPanel-root": null,

  // ── overlays ────────────────────────────────────────────────────────────
  "MuiDialog-paper": "roycss-card-glassmorphism",
  "MuiDialogBackdrop-root": "roycss-modal-backdrop-blur",
  "MuiBackdrop-root": "roycss-modal-backdrop-blur",
  "MuiModal-root": null,
  "MuiSnackbarContent-root": "roycss-card-notification",
  "MuiMenu-paper": "roycss-nav-dropdown",
  "MuiMenuItem-root": null,
  "MuiTooltip-tooltip": null,
  "MuiPopper-root": null,

  // ── feedback ────────────────────────────────────────────────────────────
  "MuiAlert-root": "roycss-card-notification",
  "MuiAlert-standardSuccess": "roycss-card-success-state",
  "MuiAlert-standardError": "roycss-card-error-state",
  "MuiAlert-standardWarning": "roycss-card-notification",
  "MuiAlert-standardInfo": "roycss-card-notification",
  "MuiAlert-filledSuccess": "roycss-card-success-state",
  "MuiAlert-filledError": "roycss-card-error-state",
  "MuiAlert-filledWarning": "roycss-card-notification",
  "MuiAlert-filledInfo": "roycss-card-notification",
  "MuiSnackbar-root": "roycss-state-toast-slide",

  // ── chips / badges / avatars ────────────────────────────────────────────
  "MuiChip-root": "roycss-glass-badge-pill-b18",
  "MuiChip-filled": "roycss-glass-badge-pill-b18",
  "MuiChip-outlined": "roycss-glass-badge-pill-b18",
  "MuiBadge-badge": "roycss-glass-badge-pill-b18",
  "MuiAvatar-root": "roycss-card-profile-avatar",
  "MuiAvatar-img": null,

  // ── progress / loading ──────────────────────────────────────────────────
  "MuiCircularProgress-root": "roycss-loader-spinner",
  "MuiCircularProgress-indeterminate": "roycss-loader-circle-notch",
  "MuiLinearProgress-root": "roycss-loader-progress-bar",
  "MuiLinearProgress-bar": "roycss-loader-indeterminate",
  "MuiSkeleton-root": "roycss-loader-skeleton",
  "MuiSkeleton-wave": "roycss-state-skeleton-wave",
  "MuiSkeleton-pulse": "roycss-state-skeleton-pulse",

  // ── form controls ───────────────────────────────────────────────────────
  "MuiSwitch-root": "roycss-form-toggle-switch",
  "MuiSwitch-track": "roycss-form-toggle-switch",
  "MuiSwitch-thumb": "roycss-form-toggle-switch",
  "MuiCheckbox-root": "roycss-form-checkbox-custom",
  "MuiRadio-root": "roycss-form-radio-custom",
  "MuiInputBase-root": "roycss-form-focus-glow",
  "MuiOutlinedInput-root": "roycss-form-focus-glow",
  "MuiFilledInput-root": "roycss-form-underline-draw",
  "MuiInputLabel-root": "roycss-form-label-float",
  "MuiFormLabel-root": "roycss-form-label-float",
  "MuiFormHelperText-root": null,
  "MuiSelect-root": null,
  "MuiNativeSelect-root": null,
  "MuiSlider-root": null,
  "MuiAutocomplete-root": null,

  // ── navigation / data ───────────────────────────────────────────────────
  "MuiTabs-root": null,
  "MuiTab-root": "roycss-nav-tabs-underline",
  "MuiTabs-indicator": "roycss-nav-tabs-underline",
  "MuiBreadcrumbs-root": "roycss-nav-breadcrumb",
  "MuiBreadcrumbs-li": null,
  "MuiPagination-root": "roycss-nav-pagination",
  "MuiPaginationItem-root": "roycss-nav-pagination",
  "MuiStepper-root": "roycss-nav-stepper",
  "MuiStep-root": null,
  "MuiStepLabel-root": null,
  "MuiTable-root": null,
  "MuiTableCell-root": null,
  "MuiTableContainer-root": null,
  "MuiTableHead-root": null,
  "MuiTableBody-root": null,
};

export const codemod = defineTableCodemod({
  id: "from-mui",
  kind: "inbound",
  label: "Material UI → RoyCSS",
  description:
    "Map the top Mui* global class fragments to closest RoyCSS effect classes; shells and emotion hashes are kept untouched and reported.",
  mappings: MAPPINGS,
});


// ─── Standalone entry: bun scripts/codemods/from-mui.ts <glob> [--write] ───
if (import.meta.main) {
  process.exit(cliMain(codemod, process.argv.slice(2)));
}

export default codemod;
