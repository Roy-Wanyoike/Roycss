/**
 * RoyCSS — Surgical i18n/RTL Fixes
 *
 * Applies the top-20 surgical physical-property → logical-property fixes
 * and the top-20 OKLCH color-format fixes to `src/lib/effects-batch-*.ts`.
 *
 * This script is IDEMPOTENT: it uses string replacement and only modifies
 * the exact target strings. Running it multiple times has no effect after
 * the first run.
 *
 * Run: `bun run tests/i18n/apply-fixes.ts`
 *
 * NOTE: A parallel agent process appears to periodically run `git reset --hard HEAD`
 * which discards tracked-file changes. This script exists so the fixes can be
 * re-applied quickly if they get reverted. The design docs in
 * `docs/adr/i18n-rtl/` and the audit scripts in `tests/i18n/` are untracked
 * files and survive the reset.
 */

import * as fs from "node:fs";
import * as path from "node:path";

const ROOT = path.resolve(__dirname, "..", "..");

interface Fix {
  file: string;
  description: string;
  find: string;
  replace: string;
}

const fixes: Fix[] = [
  // ─── effects-batch-10.ts: HSL box-shadow with hue-cycling variable → OKLCH ───
  {
    file: "src/lib/effects-batch-10.ts",
    description: "property-color-shift: hsl(var hue) box-shadow → oklch(var hue)",
    find: "box-shadow: 0 12px 30px hsl(var(--roy-b10-pcs-hue) 90% 55% / 0.4);",
    replace: "box-shadow: 0 12px 30px oklch(0.627 0.241 var(--roy-b10-pcs-hue) / 0.4);",
  },
  {
    file: "src/lib/effects-batch-10.ts",
    description: "property-hue-cycle: hsl(var hue) box-shadow → oklch(var hue)",
    find: "box-shadow: 0 12px 30px hsl(var(--roy-b10-phc-hue) 80% 60% / 0.5);",
    replace: "box-shadow: 0 12px 30px oklch(0.627 0.241 var(--roy-b10-phc-hue) / 0.5);",
  },

  // ─── effects-batch-18.ts: #fff hex in -webkit-mask → oklch(1 0 0) ───
  {
    file: "src/lib/effects-batch-18.ts",
    description: "hover-border-trace-b18: #fff mask hex → oklch(1 0 0)",
    find: "  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);",
    replace: "  -webkit-mask: linear-gradient(oklch(1 0 0) 0 0) content-box, linear-gradient(oklch(1 0 0) 0 0);",
  },

  // ─── effects-batch-21.ts ───
  {
    file: "src/lib/effects-batch-21.ts",
    description: "ferrum-text-typewriter: border-right → border-inline-end (typing cursor)",
    find: "  border-right: 2px solid oklch(0.627 0.164 271.53);",
    replace: "  border-inline-end: 2px solid oklch(0.627 0.164 271.53);",
  },
  {
    file: "src/lib/effects-batch-21.ts",
    description: "ferrum-hover-overlay-slide: left → inset-inline-start (slide animation)",
    find: `.roycss-ferrum-hover-overlay-slide::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: color-mix(in oklch, oklch(0 0 0) 45%, transparent);
  transition: left 0.4s ease;
  z-index: 1;
}
.roycss-ferrum-hover-overlay-slide:hover::before {
  left: 0;
}`,
    replace: `.roycss-ferrum-hover-overlay-slide::before {
  content: '';
  position: absolute;
  top: 0;
  inset-inline-start: -100%;
  width: 100%;
  height: 100%;
  background: color-mix(in oklch, oklch(0 0 0) 45%, transparent);
  transition: inset-inline-start 0.4s ease;
  z-index: 1;
}
.roycss-ferrum-hover-overlay-slide:hover::before {
  inset-inline-start: 0;
}`,
  },
  {
    file: "src/lib/effects-batch-21.ts",
    description: "ferrum-hover-swipe: left → inset-inline-start (swipe animation)",
    find: `.roycss-ferrum-hover-swipe::before {
  content: '';
  position: absolute;
  top: 0;
  left: -110%;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, oklch(0.795 0.172 323.15), oklch(0.673 0.193 16.23));
  transform: skewX(-15deg);
  transition: left 0.5s cubic-bezier(0.65, 0, 0.35, 1);
  z-index: -1;
}
.roycss-ferrum-hover-swipe:hover::before {
  left: 0;
}`,
    replace: `.roycss-ferrum-hover-swipe::before {
  content: '';
  position: absolute;
  top: 0;
  inset-inline-start: -110%;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, oklch(0.795 0.172 323.15), oklch(0.673 0.193 16.23));
  transform: skewX(-15deg);
  transition: inset-inline-start 0.5s cubic-bezier(0.65, 0, 0.35, 1);
  z-index: -1;
}
.roycss-ferrum-hover-swipe:hover::before {
  inset-inline-start: 0;
}`,
  },
  {
    file: "src/lib/effects-batch-21.ts",
    description: "ferrum-hover-bg-slide: left:0 → inset-inline-start:0 (stretch)",
    find: `.roycss-ferrum-hover-bg-slide::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 0;`,
    replace: `.roycss-ferrum-hover-bg-slide::before {
  content: '';
  position: absolute;
  bottom: 0;
  inset-inline-start: 0;
  width: 100%;
  height: 0;`,
  },
  {
    file: "src/lib/effects-batch-21.ts",
    description: "ferrum-text-glitch: left:0 → inset-inline-start:0 (full-width overlay)",
    find: `.roycss-ferrum-text-glitch::after {
  content: attr(data-text);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}`,
    replace: `.roycss-ferrum-text-glitch::after {
  content: attr(data-text);
  position: absolute;
  top: 0;
  inset-inline-start: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}`,
  },

  // ─── effects-batch-22.ts ───
  {
    file: "src/lib/effects-batch-22.ts",
    description: "ferrum-bg-aurora: left:-50% → inset-inline-start:-50% (corner positioning)",
    find: "  top: -50%; left: -50%;",
    replace: "  top: -50%; inset-inline-start: -50%;",
  },
  {
    file: "src/lib/effects-batch-22.ts",
    description: "ferrum-bg-smoke: left:-50px → inset-inline-start:-50px",
    find: "  top: -50px; left: -50px;",
    replace: "  top: -50px; inset-inline-start: -50px;",
  },
  {
    file: "src/lib/effects-batch-22.ts",
    description: "ferrum-bg-smoke: right:-70px → inset-inline-end:-70px",
    find: "  bottom: -70px; right: -70px;",
    replace: "  bottom: -70px; inset-inline-end: -70px;",
  },
  {
    file: "src/lib/effects-batch-22.ts",
    description: "ferrum-bg-lava: left:30% → inset-inline-start:30%",
    find: "  left: 30%; bottom: -20%;\n  animation: roy-ferrum-lava-rise1 5s ease-in-out infinite;",
    replace: "  inset-inline-start: 30%; bottom: -20%;\n  animation: roy-ferrum-lava-rise1 5s ease-in-out infinite;",
  },
  {
    file: "src/lib/effects-batch-22.ts",
    description: "ferrum-bg-lava: left:60% → inset-inline-start:60%",
    find: "  left: 60%; bottom: -20%;\n  animation: roy-ferrum-lava-rise2 6s ease-in-out infinite;",
    replace: "  inset-inline-start: 60%; bottom: -20%;\n  animation: roy-ferrum-lava-rise2 6s ease-in-out infinite;",
  },
  {
    file: "src/lib/effects-batch-22.ts",
    description: "ferrum-img-shutter: left:0/right:0/left:auto → inset-inline-* (paired shutter)",
    find: `.roycss-ferrum-img-shutter::before {
  left: 0;
  transform: translateX(-100%);
}
.roycss-ferrum-img-shutter::after {
  content: '';
  right: 0;
  left: auto;
  transform: translateX(100%);
}`,
    replace: `.roycss-ferrum-img-shutter::before {
  inset-inline-start: 0;
  transform: translateX(-100%);
}
.roycss-ferrum-img-shutter::after {
  content: '';
  inset-inline-end: 0;
  inset-inline-start: auto;
  transform: translateX(100%);
}`,
  },
  {
    file: "src/lib/effects-batch-22.ts",
    description: "ferrum-loader-heartbeat: border-right+padding-right → border-inline-end+padding-inline-end (typing cursor)",
    find: "border-right: 3px solid currentColor;\npadding-right: 4px;",
    replace: "border-inline-end: 3px solid currentColor;\npadding-inline-end: 4px;",
  },
  {
    file: "src/lib/effects-batch-22.ts",
    description: "ferrum-loader-heartbeat: btn-outline-draw border-left+border-right → border-inline-start+end",
    find: `    border-left: 2px solid oklch(0.541 0.247 293.01);
    border-right: 2px solid oklch(0.541 0.247 293.01);`,
    replace: `    border-inline-start: 2px solid oklch(0.541 0.247 293.01);
    border-inline-end: 2px solid oklch(0.541 0.247 293.01);`,
  },
  {
    file: "src/lib/effects-batch-22.ts",
    description: "ferrum-loader-heartbeat: btn-slide-icon padding-right:48px → padding-inline-end:48px",
    find: "    padding-right: 48px;",
    replace: "    padding-inline-end: 48px;",
  },
  {
    file: "src/lib/effects-batch-22.ts",
    description: "ferrum-loader-heartbeat: btn-slide-icon arrow right:12px → inset-inline-end:12px",
    find: `    top: 50%;
    right: 12px;`,
    replace: `    top: 50%;
    inset-inline-end: 12px;`,
  },
  {
    file: "src/lib/effects-batch-22.ts",
    description: "ferrum-loader-hourglass: border-left+right → border-inline-start+end (1st pair)",
    find: `  border-left: 16px solid transparent;
  border-right: 16px solid transparent;
  border-top: 20px solid oklch(0.627 0.233 303.9);
  transform: translate(-50%, -50%) translateY(4px);`,
    replace: `  border-inline-start: 16px solid transparent;
  border-inline-end: 16px solid transparent;
  border-top: 20px solid oklch(0.627 0.233 303.9);
  transform: translate(-50%, -50%) translateY(4px);`,
  },
  {
    file: "src/lib/effects-batch-22.ts",
    description: "ferrum-loader-hourglass: border-left+right → border-inline-start+end (2nd pair)",
    find: `  border-left: 16px solid transparent;
  border-right: 16px solid transparent;`,
    replace: `  border-inline-start: 16px solid transparent;
  border-inline-end: 16px solid transparent;`,
  },
  {
    file: "src/lib/effects-batch-22.ts",
    description: "ferrum-loader-pencil: border-left+right → border-inline-start+end",
    find: `  border-left: 4px solid transparent;
  border-right: 4px solid transparent;`,
    replace: `  border-inline-start: 4px solid transparent;
  border-inline-end: 4px solid transparent;`,
  },
  {
    file: "src/lib/effects-batch-22.ts",
    description: "ferrum-loader-ring: border-left-color+right-color → border-inline-start-color+end-color",
    find: `  border-left-color: oklch(0.652 0.241 354.31);
  border-right-color: oklch(0.652 0.241 354.31);`,
    replace: `  border-inline-start-color: oklch(0.652 0.241 354.31);
  border-inline-end-color: oklch(0.652 0.241 354.31);`,
  },

  // ─── effects-batch-23.ts ───
  {
    file: "src/lib/effects-batch-23.ts",
    description: "ferrum-skeleton-wave: left:-100% → inset-inline-start:-100% (shimmer animation)",
    find: `.roycss-ferrum-skeleton-wave::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
        90deg,
        transparent 0%,
        color-mix(in oklch, oklch(1 0 0) 30%, transparent) 25%,
        color-mix(in oklch, oklch(1 0 0) 60%, transparent) 50%,
        color-mix(in oklch, oklch(1 0 0) 30%, transparent) 75%,
        transparent 100%
    );
    animation: roy-ferrum-skeleton-wave 2s ease-in-out infinite;
}

@keyframes roy-ferrum-skeleton-wave {

    0%   { left: -100%; }
    100% { left: 100%; }

}`,
    replace: `.roycss-ferrum-skeleton-wave::after {
    content: '';
    position: absolute;
    top: 0;
    inset-inline-start: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
        90deg,
        transparent 0%,
        color-mix(in oklch, oklch(1 0 0) 30%, transparent) 25%,
        color-mix(in oklch, oklch(1 0 0) 60%, transparent) 50%,
        color-mix(in oklch, oklch(1 0 0) 30%, transparent) 75%,
        transparent 100%
    );
    animation: roy-ferrum-skeleton-wave 2s ease-in-out infinite;
}

@keyframes roy-ferrum-skeleton-wave {

    0%   { inset-inline-start: -100%; }
    100% { inset-inline-start: 100%; }

}`,
  },
  {
    file: "src/lib/effects-batch-23.ts",
    description: "ferrum-skeleton-circle: left:-100% → inset-inline-start:-100% (shimmer animation)",
    find: `.roycss-ferrum-skeleton-circle::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
        90deg,
        transparent 0%,
        color-mix(in oklch, oklch(1 0 0) 40%, transparent) 50%,
        transparent 100%
    );
    animation: roy-ferrum-skeleton-circle 1.5s ease-in-out infinite;
}

@keyframes roy-ferrum-skeleton-circle {

    0%   { left: -100%; }
    100% { left: 100%; }

}`,
    replace: `.roycss-ferrum-skeleton-circle::after {
    content: '';
    position: absolute;
    top: 0;
    inset-inline-start: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
        90deg,
        transparent 0%,
        color-mix(in oklch, oklch(1 0 0) 40%, transparent) 50%,
        transparent 100%
    );
    animation: roy-ferrum-skeleton-circle 1.5s ease-in-out infinite;
}

@keyframes roy-ferrum-skeleton-circle {

    0%   { inset-inline-start: -100%; }
    100% { inset-inline-start: 100%; }

}`,
  },
  {
    file: "src/lib/effects-batch-23.ts",
    description: "ferrum-tab-underline: left:50%/0 + transition left → inset-inline-start (expand-from-center)",
    find: `    bottom: -2px;
    left: 50%;
    width: 0;
    height: 2px;
    background-color: oklch(0.658 0.169 248.81);
    transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), left 0.3s cubic-bezier(0.4, 0, 0.2, 1);`,
    replace: `    bottom: -2px;
    inset-inline-start: 50%;
    width: 0;
    height: 2px;
    background-color: oklch(0.658 0.169 248.81);
    transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), inset-inline-start 0.3s cubic-bezier(0.4, 0, 0.2, 1);`,
  },
  {
    file: "src/lib/effects-batch-23.ts",
    description: "ferrum-tab-underline: hover left:0 → inset-inline-start:0",
    find: `.roycss-ferrum-tab-underline:hover::after {
    width: 100%;
    left: 0;
}`,
    replace: `.roycss-ferrum-tab-underline:hover::after {
    width: 100%;
    inset-inline-start: 0;
}`,
  },

  // ─── effects-batch-24.ts ───
  {
    file: "src/lib/effects-batch-24.ts",
    description: "ferrum-sunset: left:0+right:0 → inset-inline-start:0+end:0 (paired stretch)",
    find: `  bottom: 0;
  left: 0;
  right: 0;
  height: 20%;`,
    replace: `  bottom: 0;
  inset-inline-start: 0;
  inset-inline-end: 0;
  height: 20%;`,
  },
];

function main() {
  console.log(`\nApplying ${fixes.length} surgical fixes...\n`);
  let applied = 0;
  let skipped = 0;
  let failed = 0;

  for (const fix of fixes) {
    const fullPath = path.join(ROOT, fix.file);
    if (!fs.existsSync(fullPath)) {
      console.log(`  ✗ ${fix.file}: file not found`);
      failed++;
      continue;
    }
    const src = fs.readFileSync(fullPath, "utf8");
    if (src.includes(fix.replace)) {
      console.log(`  ○ ${fix.file}: already applied (${fix.description})`);
      skipped++;
      continue;
    }
    if (!src.includes(fix.find)) {
      console.log(`  ! ${fix.file}: find-string not present — ${fix.description}`);
      failed++;
      continue;
    }
    const updated = src.replace(fix.find, fix.replace);
    fs.writeFileSync(fullPath, updated);
    console.log(`  ✓ ${fix.file}: ${fix.description}`);
    applied++;
  }

  console.log(`\n──────────────────────────────────────────────`);
  console.log(`Applied: ${applied} | Already-applied: ${skipped} | Failed: ${failed}`);
  console.log(`──────────────────────────────────────────────\n`);
}

main();
