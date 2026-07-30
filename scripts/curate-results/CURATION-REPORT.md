# RoyCSS Effect Curation Report

> Generated: 2026-07-30T14:21:44.756Z · Schema: `roycss.curation.v1`

## 1. Executive Summary

- **Total effects audited:** 1569
- **Unique effect IDs:** 1569
- **Average quality score:** 8.19 / 10 (tier distribution: A=1021, B=547, C=1, D=0)
- **Low-quality effects (overall < 5):** 0
- **Duplicate clusters found:** 321 (involving 754 effects)
- **Tag normalizations applied:** 961 (across 693 effects)
- **Miscategorized effects detected:** 210
- **Deprecation candidates:** 407
- **Merge candidates:** 296
- **Improve candidates:** 1
- **Blocked removals (referenced by recipes/patterns):** 1

**Per-dimension averages:**

| Dimension | Avg score |
|---|---|
| correctness | 9.95 |
| completeness | 8.44 |
| performance | 9.79 |
| accessibility | 7.81 |
| uniqueness | 4.96 |

**Overall quality histogram:**

  0-1   |░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░| 0
  2-3   |░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░| 0
  4-5   |░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░| 1
  6-7   |████████████████░░░░░░░░░░░░░░| 547
  8-9   |██████████████████████████████| 1021
  10    |░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░| 0

## 2. Category Distribution

| Category | Count | Avg quality | Min | Max | Low-quality (# < 5) |
|---|---|---|---|---|---|
| Animations (`animations`) | 312 | 7.92 | 6.8 | 9.4 | 0 |
| Visual Effects (`visual`) | 258 | 8.17 | 6.4 | 9.6 | 0 |
| Backgrounds (`backgrounds`) | 128 | 8.39 | 7 | 9.2 | 0 |
| Hover Effects (`hover`) | 110 | 8.03 | 7.4 | 9 | 0 |
| Text Effects (`text`) | 101 | 8.36 | 6.8 | 9.4 | 0 |
| Microinteractions (`microinteractions`) | 87 | 8.39 | 7 | 9.2 | 0 |
| Loaders (`loaders`) | 66 | 8.08 | 5.8 | 9.2 | 0 |
| Card Effects (`cards`) | 56 | 8.56 | 7 | 9.4 | 0 |
| Button Effects (`buttons`) | 55 | 8.13 | 7.4 | 8.8 | 0 |
| Particles (`particles`) | 52 | 8.09 | 6.4 | 8.8 | 0 |
| Scroll Effects (`scroll`) | 51 | 8.36 | 7.4 | 9 | 0 |
| Glass & Modern UI (`glass-ui`) | 50 | 8.31 | 7 | 9.2 | 0 |
| Forms & Inputs (`forms`) | 45 | 8.04 | 7 | 9.2 | 0 |
| Page Transitions (`page-transitions`) | 39 | 8.4 | 6.2 | 9 | 0 |
| 3D & Transforms (`3d-transforms`) | 31 | 7.82 | 7.2 | 8.6 | 0 |
| Borders (`borders`) | 30 | 8.56 | 7.2 | 9.2 | 0 |
| Navigation (`navigation`) | 30 | 8.15 | 7.2 | 9.2 | 0 |
| Miscellaneous (`misc`) | 29 | 8.48 | 7.2 | 9.2 | 0 |
| Cursor Effects (`cursor`) | 24 | 8.52 | 8 | 9.2 | 0 |
| Filters (`filters`) | 15 | 8.75 | 7.4 | 9.4 | 0 |

## 3. Top 10 Highest-Quality Effects

| # | ID | Name | Category | Overall | Tier |
|---|---|---|---|---|---|
| 1 | `vis-neumorphic` | Neumorphic Surface | visual | 9.6 | A |
| 2 | `text-neon-glow` | Neon Glow Text | text | 9.4 | A |
| 3 | `text-skew` | Skew Text | text | 9.4 | A |
| 4 | `filter-saturate` | Hyper Saturate | filters | 9.4 | A |
| 5 | `anim-wave-flag` | Wave Flag | animations | 9.4 | A |
| 6 | `card-neumorphic` | Neumorphic Card | cards | 9.4 | A |
| 7 | `jack-in-box` | Jack In The Box | animations | 9.2 | A |
| 8 | `text-gradient` | Gradient Text | text | 9.2 | A |
| 9 | `text-stroke` | Text Stroke | text | 9.2 | A |
| 10 | `text-highlight-marker` | Marker Highlight | text | 9.2 | A |

## 4. Bottom 10 Lowest-Quality Effects

| # | ID | Name | Category | Overall | Tier | Specific issues |
|---|---|---|---|---|---|---|
| 1 | `ferrum-loader-heartbeat` | Heartbeat | loaders | 5.8 | C | performance=2, uniqueness=2 |
| 2 | `ferrum-dissolve` | Dissolve | page-transitions | 6.2 | B | completeness=4, uniqueness=2 |
| 3 | `ferrum-watercolor` | Watercolor | visual | 6.4 | B | completeness=0, uniqueness=2 |
| 4 | `ferrum-topographic` | Topographic | visual | 6.4 | B | completeness=0, uniqueness=2 |
| 5 | `ferrum-kaleidoscope` | Kaleidoscope | visual | 6.4 | B | completeness=0, uniqueness=2 |
| 6 | `ferrum-blueprint` | Blueprint | visual | 6.4 | B | completeness=0, uniqueness=2 |
| 7 | `ferrum-fireflies` | Fireflies | particles | 6.4 | B | completeness=4, uniqueness=2 |
| 8 | `ferrum-sunset` | Sunset | particles | 6.6 | B | completeness=4, uniqueness=2 |
| 9 | `ferrum-vibrate` | Vibrate | animations | 6.8 | B | completeness=5, uniqueness=2 |
| 10 | `ferrum-stretch` | Stretch | animations | 6.8 | B | completeness=5, uniqueness=2 |

## 5. Duplicate Clusters

Found **321** clusters involving **754** effects.

### Cluster 1: canonical `slide-out-top` — _merge_

| Effect ID | Name | Similarity | Reason |
|---|---|---|---|
| `slide-out-top` **(canonical)** | Slide Out Top | 1.000 | name similarity 1.00 ≥ 0.85 |
| `slide-out-bottom` | Slide Out Bottom | 1.000 | name similarity 1.00 ≥ 0.85 |
| `slide-out-left` | Slide Out Left | 1.000 | name similarity 1.00 ≥ 0.85 |
| `slide-out-right` | Slide Out Right | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-slide-out-left` | Slide Out Left | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-slide-out-right` | Slide Out Right | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-slide-out-bottom` | Slide Out Bottom | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-slide-out-top` | Slide Out Top | 1.000 | name similarity 1.00 ≥ 0.85 |

### Cluster 2: canonical `hover-flip` — _merge_

| Effect ID | Name | Similarity | Reason |
|---|---|---|---|
| `hover-flip` **(canonical)** | Flip | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-hover-flip` | Flip | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-icon-flip` | Flip | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-btn-flip` | Flip | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-card-flip` | Flip | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-page-flip` | Flip | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-text-flip` | Flip | 1.000 | name similarity 1.00 ≥ 0.85 |

### Cluster 3: canonical `text-underline-draw` — _merge_

| Effect ID | Name | Similarity | Reason |
|---|---|---|---|
| `text-underline-draw` **(canonical)** | Underline Draw | 1.000 | name similarity 1.00 ≥ 0.85 |
| `form-underline-draw` | Underline Draw | 1.000 | name similarity 1.00 ≥ 0.85 |
| `hover-underline-grow` | Underline Grow | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-hover-underline-grow` | Underline Grow | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-tab-underline-group` | Underline Group | 0.867 | name similarity 0.87 ≥ 0.85 |
| `ferrum-form-underline-draw` | Underline Draw | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-text-underline-draw` | Underline Draw | 1.000 | name similarity 1.00 ≥ 0.85 |

### Cluster 4: canonical `fade-in-down` — _merge_

| Effect ID | Name | Similarity | Reason |
|---|---|---|---|
| `fade-in-down` **(canonical)** | Fade In Down | 1.000 | name similarity 1.00 ≥ 0.85 |
| `fade-in-left` | Fade In Left | 1.000 | name similarity 1.00 ≥ 0.85 |
| `fade-in-right` | Fade In Right | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-fade-in-down` | Fade In Down | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-fade-in-left` | Fade In Left | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-fade-in-right` | Fade In Right | 1.000 | name similarity 1.00 ≥ 0.85 |

### Cluster 5: canonical `fade-out-up` — _merge_

| Effect ID | Name | Similarity | Reason |
|---|---|---|---|
| `fade-out-up` **(canonical)** | Fade Out Up | 1.000 | name similarity 1.00 ≥ 0.85 |
| `fade-out-left` | Fade Out Left | 1.000 | name similarity 1.00 ≥ 0.85 |
| `fade-out-right` | Fade Out Right | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-fade-out-left` | Fade Out Left | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-fade-out-right` | Fade Out Right | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-fade-out-up` | Fade Out Up | 1.000 | name similarity 1.00 ≥ 0.85 |

### Cluster 6: canonical `material-elevation-1` — _merge_

| Effect ID | Name | Similarity | Reason |
|---|---|---|---|
| `material-elevation-1` **(canonical)** | Material Elevation 1 | 1.000 | name similarity 1.00 ≥ 0.85 |
| `material-elevation-3` | Material Elevation 3 | 1.000 | name similarity 1.00 ≥ 0.85 |
| `material-elevation-5` | Material Elevation 5 | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-material-elevation-1` | Material Elevation 1 | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-material-elevation-3` | Material Elevation 3 | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-material-elevation-5` | Material Elevation 5 | 1.000 | name similarity 1.00 ≥ 0.85 |

### Cluster 7: canonical `ferrum-pulse` — _merge_

| Effect ID | Name | Similarity | Reason |
|---|---|---|---|
| `ferrum-pulse` **(canonical)** | Pulse | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-loader-pulse` | Pulse | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-skeleton-pulse` | Pulse | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-radio-pulse` | Pulse | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-icon-pulse` | Pulse | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-btn-pulse` | Pulse | 1.000 | name similarity 1.00 ≥ 0.85 |

### Cluster 8: canonical `hover-bounce` — _merge_

| Effect ID | Name | Similarity | Reason |
|---|---|---|---|
| `hover-bounce` **(canonical)** | Bounce | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-bounce` | Bounce | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-loader-bounce` | Bounce | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-icon-bounce` | Bounce | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-btn-bounce` | Bounce | 1.000 | name similarity 1.00 ≥ 0.85 |

### Cluster 9: canonical `loader-ripple` — _merge_

| Effect ID | Name | Similarity | Reason |
|---|---|---|---|
| `loader-ripple` **(canonical)** | Ripple | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-hover-ripple` | Ripple | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-loader-ripple` | Ripple | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-btn-ripple` | Ripple | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-cursor-ripple` | Ripple | 1.000 | name similarity 1.00 ≥ 0.85 |

### Cluster 10: canonical `nav-menu-slide` — _merge_

| Effect ID | Name | Similarity | Reason |
|---|---|---|---|
| `nav-menu-slide` **(canonical)** | Menu Slide | 1.000 | name similarity 1.00 ≥ 0.85 |
| `nav-menu-scale` | Menu Scale | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-nav-menu-fade` | Menu Fade | 0.824 | compound similarity (name 0.70, css 0.95) |
| `ferrum-nav-menu-scale` | Menu Scale | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-nav-menu-slide` | Menu Slide | 1.000 | name similarity 1.00 ≥ 0.85 |

### Cluster 11: canonical `heartbeat` — _merge_

| Effect ID | Name | Similarity | Reason |
|---|---|---|---|
| `heartbeat` **(canonical)** | Heartbeat | 1.000 | name similarity 1.00 ≥ 0.85 |
| `micro-heart-beat-b18` | Heart Beat | 0.900 | name similarity 0.90 ≥ 0.85 |
| `ferrum-heartbeat` | Heartbeat | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-loader-heartbeat` | Heartbeat | 1.000 | name similarity 1.00 ≥ 0.85 |

### Cluster 12: canonical `flip-in-x` — _merge_

| Effect ID | Name | Similarity | Reason |
|---|---|---|---|
| `flip-in-x` **(canonical)** | Flip In X | 1.000 | name similarity 1.00 ≥ 0.85 |
| `flip-in-y` | Flip In Y | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-flip-in-x` | Flip In X | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-flip-in-y` | Flip In Y | 1.000 | name similarity 1.00 ≥ 0.85 |

### Cluster 13: canonical `hover-color-shift` — _merge_

| Effect ID | Name | Similarity | Reason |
|---|---|---|---|
| `hover-color-shift` **(canonical)** | Color Shift | 1.000 | name similarity 1.00 ≥ 0.85 |
| `visual-color-shift` | Color Shift | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-hover-color-shift` | Color Shift | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-visual-color-shift` | Color Shift | 1.000 | name similarity 1.00 ≥ 0.85 |

### Cluster 14: canonical `hover-skew` — _merge_

| Effect ID | Name | Similarity | Reason |
|---|---|---|---|
| `hover-skew` **(canonical)** | Skew | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-hover-skew` | Skew | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-btn-skew` | Skew | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-text-skew` | Skew | 1.000 | name similarity 1.00 ≥ 0.85 |

### Cluster 15: canonical `btn-border-draw` — _merge_

| Effect ID | Name | Similarity | Reason |
|---|---|---|---|
| `hover-border-draw` | Border Draw | 1.000 | name similarity 1.00 ≥ 0.85 |
| `btn-border-draw` **(canonical)** | Border Draw | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-btn-border-draw` | Border Draw | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-hover-border-draw` | Border Draw | 1.000 | name similarity 1.00 ≥ 0.85 |

### Cluster 16: canonical `rotate-x` — _merge_

| Effect ID | Name | Similarity | Reason |
|---|---|---|---|
| `rotate-x` **(canonical)** | Rotate X | 1.000 | name similarity 1.00 ≥ 0.85 |
| `rotate-y` | Rotate Y | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-rotate-x` | Rotate X | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-rotate-y` | Rotate Y | 1.000 | name similarity 1.00 ≥ 0.85 |

### Cluster 17: canonical `btn-border-glow` — _merge_

| Effect ID | Name | Similarity | Reason |
|---|---|---|---|
| `btn-border-glow` **(canonical)** | Border Glow | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-hover-border-glow` | Border Glow | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-btn-border-glow` | Border Glow | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-glass-border-glow` | Border Glow | 1.000 | name similarity 1.00 ≥ 0.85 |

### Cluster 18: canonical `misc-fireflies` — _merge_

| Effect ID | Name | Similarity | Reason |
|---|---|---|---|
| `misc-fireflies` **(canonical)** | Fireflies | 1.000 | name similarity 1.00 ≥ 0.85 |
| `particles-fireflies` | Fireflies | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-fireflies` | Fireflies | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-misc-fireflies` | Misc Fireflies | 0.972 | css similarity 0.97 ≥ 0.95 |

### Cluster 19: canonical `slide-in-top` — _merge_

| Effect ID | Name | Similarity | Reason |
|---|---|---|---|
| `slide-in-top` **(canonical)** | Slide In Top | 1.000 | name similarity 1.00 ≥ 0.85 |
| `slide-in-bottom` | Slide In Bottom | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-slide-in-bottom` | Slide In Bottom | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-slide-in-top` | Slide In Top | 1.000 | name similarity 1.00 ≥ 0.85 |

### Cluster 20: canonical `blink` — _merge_

| Effect ID | Name | Similarity | Reason |
|---|---|---|---|
| `blink` **(canonical)** | Blink | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-text-blink` | Blink | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-skeleton-blink` | Blink | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-blink` | Blink | 1.000 | name similarity 1.00 ≥ 0.85 |

### Cluster 21: canonical `visual-neon-pulse` — _merge_

| Effect ID | Name | Similarity | Reason |
|---|---|---|---|
| `visual-neon-pulse` **(canonical)** | Neon Pulse | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-hover-neon-pulse` | Neon Pulse | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-border-neon-pulse` | Neon Pulse | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-visual-neon-pulse` | Neon Pulse | 1.000 | name similarity 1.00 ≥ 0.85 |

### Cluster 22: canonical `apple-material-thin` — _merge_

| Effect ID | Name | Similarity | Reason |
|---|---|---|---|
| `apple-material-thin` **(canonical)** | Apple Material Thin | 1.000 | name similarity 1.00 ≥ 0.85 |
| `apple-material-thick` | Apple Material Thick | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-apple-material-thick` | Apple Material Thick | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-apple-material-thin` | Apple Material Thin | 1.000 | name similarity 1.00 ≥ 0.85 |

### Cluster 23: canonical `neon-sign` — _merge_

| Effect ID | Name | Similarity | Reason |
|---|---|---|---|
| `neon-sign` **(canonical)** | Neon Sign | 1.000 | name similarity 1.00 ≥ 0.85 |
| `text-neon-sign-b19` | Neon Sign | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-neon-sign` | Neon Sign | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-text-neon-sign` | Neon Sign | 1.000 | name similarity 1.00 ≥ 0.85 |

### Cluster 24: canonical `ferrum-bg-liquid` — _merge_

| Effect ID | Name | Similarity | Reason |
|---|---|---|---|
| `ferrum-bg-liquid` **(canonical)** | Liquid | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-btn-liquid` | Liquid | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-glass-liquid` | Liquid | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-page-liquid` | Liquid | 1.000 | name similarity 1.00 ≥ 0.85 |

### Cluster 25: canonical `bounce-in` — _merge_

| Effect ID | Name | Similarity | Reason |
|---|---|---|---|
| `bounce-in` **(canonical)** | Bounce In | 1.000 | name similarity 1.00 ≥ 0.85 |
| `micro-bounce-in` | Bounce In | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-bounce-in` | Bounce In | 1.000 | name similarity 1.00 ≥ 0.85 |

### Cluster 26: canonical `shake` — _merge_

| Effect ID | Name | Similarity | Reason |
|---|---|---|---|
| `shake` **(canonical)** | Shake | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-shake` | Shake | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-icon-shake` | Shake | 1.000 | name similarity 1.00 ≥ 0.85 |

### Cluster 27: canonical `float` — _merge_

| Effect ID | Name | Similarity | Reason |
|---|---|---|---|
| `float` **(canonical)** | Float | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-hover-float` | Float | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-float` | Float | 1.000 | name similarity 1.00 ≥ 0.85 |

### Cluster 28: canonical `wobble` — _merge_

| Effect ID | Name | Similarity | Reason |
|---|---|---|---|
| `wobble` **(canonical)** | Wobble | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-wobble` | Wobble | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-icon-wobble` | Wobble | 1.000 | name similarity 1.00 ≥ 0.85 |

### Cluster 29: canonical `tada` — _merge_

| Effect ID | Name | Similarity | Reason |
|---|---|---|---|
| `tada` **(canonical)** | Tada | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-tada` | Tada | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-icon-tada` | Tada | 1.000 | name similarity 1.00 ≥ 0.85 |

### Cluster 30: canonical `swing` — _merge_

| Effect ID | Name | Similarity | Reason |
|---|---|---|---|
| `swing` **(canonical)** | Swing | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-swing` | Swing | 1.000 | name similarity 1.00 ≥ 0.85 |
| `ferrum-icon-swing` | Swing | 1.000 | name similarity 1.00 ≥ 0.85 |

... and 291 more clusters (see `duplicates.json` for the full list).

## 6. Tag Normalization Summary

Applied **961** normalizations across **693** effects.

**Top 20 most common normalizations:**

| From | To | Count |
|---|---|---|
| `animated` | `keyframes` | 376 |
| `hover` | `interactive` | 123 |
| `loader` | `spinner` | 68 |
| `in` | `entrance` | 50 |
| `animate` | `keyframes` | 47 |
| `motion` | `keyframes` | 45 |
| `spinner` | `spin` | 42 |
| `visual` | `decoration` | 33 |
| `out` | `exit` | 31 |
| `effect` | `keyframes` | 28 |
| `spring` | `bounce` | 27 |
| `navigation` | `nav` | 16 |
| `animation` | `keyframes` | 14 |
| `elastic` | `bounce` | 7 |
| `breathing` | `breathe` | 7 |
| `floating` | `float` | 6 |
| `rubber` | `stretch` | 5 |
| `waves` | `wave` | 4 |
| `rotating` | `rotate` | 2 |
| `shake` | _stripped (id-mirror)_ | 1 |

**Uncontrolled tags (not in TAG_VOCABULARY):** 1474 unique tags found in the normalized output.

Top 20 uncontrolled tags (candidates for promotion to TAG_VOCABULARY):

| Tag | Count |
|---|---|
| `scroll` | 54 |
| `scrolling` | 30 |
| `outline` | 25 |
| `page` | 25 |
| `translate` | 25 |
| `game` | 23 |
| `color` | 21 |
| `grid` | 20 |
| `expand` | 18 |
| `opacity` | 18 |
| `loop` | 14 |
| `pattern` | 14 |
| `underline` | 14 |
| `bar` | 13 |
| `circle` | 13 |
| `light` | 13 |
| `micro` | 13 |
| `painting` | 13 |
| `pointer` | 13 |
| `tilt` | 13 |

## 7. Miscategorization Findings

Found **210** effects whose name/tags suggest a different category than assigned.

| Effect ID | Name | Declared | Suggested | Confidence | Reason |
|---|---|---|---|---|---|
| `card-flip` | Card Flip | 3d-transforms | cards | 4× | keywords suggest 'cards' (score 4) over '3d-transforms' (score 1) |
| `transform-origin-spin` | Transform Origin Spin | 3d-transforms | animations | 4× | keywords suggest 'animations' (score 4) over '3d-transforms' (score 1) |
| `rotate-x` | Rotate X | 3d-transforms | animations | 4× | keywords suggest 'animations' (score 4) over '3d-transforms' (score 1) |
| `rotate-y` | Rotate Y | 3d-transforms | animations | 5× | keywords suggest 'animations' (score 5) over '3d-transforms' (score 1) |
| `blur-in` | Blur In | animations | filters | 5× | keywords suggest 'filters' (score 5) over 'animations' (score 0) |
| `blur-in-up` | Blur In Up | animations | filters | 5× | keywords suggest 'filters' (score 5) over 'animations' (score 0) |
| `blur-out` | Blur Out | animations | filters | 5× | keywords suggest 'filters' (score 5) over 'animations' (score 0) |
| `blur-out-down` | Blur Out Down | animations | filters | 5× | keywords suggest 'filters' (score 5) over 'animations' (score 0) |
| `scale-compress` | Scale Compress | animations | hover | 4× | keywords suggest 'hover' (score 4) over 'animations' (score 0) |
| `spring-in` | Spring In | animations | loaders | 2× | keywords suggest 'loaders' (score 4) over 'animations' (score 2) |
| `visual-border-beam` | Border Beam | visual | borders | 4× | keywords suggest 'borders' (score 4) over 'visual' (score 1) |
| `visual-aurora-border` | Aurora Border | visual | backgrounds | 5× | keywords suggest 'backgrounds' (score 5) over 'visual' (score 1) |
| `visual-shadow-pulse` | Shadow Pulse | visual | animations | 4× | keywords suggest 'animations' (score 4) over 'visual' (score 1) |
| `visual-gradient-text-animated` | Animated Gradient Text | visual | animations | 4× | keywords suggest 'animations' (score 4) over 'visual' (score 1) |
| `visual-gradient-mesh` | Animated Mesh Gradient | visual | backgrounds | 9× | keywords suggest 'backgrounds' (score 9) over 'visual' (score 1) |
| `visual-frost-blur` | Frost Blur | visual | glass-ui | 5× | keywords suggest 'glass-ui' (score 5) over 'visual' (score 1) |
| `visual-mask-fade` | Mask Fade Reveal | visual | animations | 4× | keywords suggest 'animations' (score 4) over 'visual' (score 1) |
| `visual-backdrop-blur-heavy` | Heavy Backdrop Blur | visual | filters | 8× | keywords suggest 'filters' (score 8) over 'visual' (score 1) |
| `visual-hue-rotate-loop` | Hue Rotate Loop | visual | animations | 4× | keywords suggest 'animations' (score 4) over 'visual' (score 1) |
| `visual-saturation-pulse` | Saturation Pulse | visual | animations | 4× | keywords suggest 'animations' (score 4) over 'visual' (score 1) |
| `visual-glass-reflection` | Glass Reflection | visual | glass-ui | 5× | keywords suggest 'glass-ui' (score 5) over 'visual' (score 1) |
| `visual-neon-pulse` | Neon Pulse | visual | animations | 4× | keywords suggest 'animations' (score 4) over 'visual' (score 1) |
| `material-spring-up` | Material Spring Up | animations | loaders | 4× | keywords suggest 'loaders' (score 4) over 'animations' (score 0) |
| `material-spring-down` | Material Spring Down | animations | loaders | 4× | keywords suggest 'loaders' (score 4) over 'animations' (score 0) |
| `material-container-transform` | Material Container Transform | animations | forms | 4× | keywords suggest 'forms' (score 4) over 'animations' (score 0) |
| `apple-flip-spring` | Apple Flip Spring | animations | loaders | 4× | keywords suggest 'loaders' (score 4) over 'animations' (score 0) |
| `linear-glow-border` | Linear Glow Border | hover | borders | 4× | keywords suggest 'borders' (score 4) over 'hover' (score 1) |
| `linear-magnetic-pull` | Linear Magnetic Pull | hover | cursor | 5× | keywords suggest 'cursor' (score 5) over 'hover' (score 0) |
| `linear-gradient-sweep` | Linear Gradient Sweep | hover | backgrounds | 4× | keywords suggest 'backgrounds' (score 4) over 'hover' (score 0) |
| `linear-text-glow` | Linear Text Glow | hover | text | 4× | keywords suggest 'text' (score 4) over 'hover' (score 0) |
... and 180 more (see `curation-report.json` for the full list).

## 8. Recommendations

### 8.1 Deprecate (407)

Effects with overall < 4.0, uniqueness < 3.0 (near-duplicate), or correctness < 3.0 (stub/broken). Removal is **advisory** — see `ADR.md` §4.

| Effect ID | Reason |
|---|---|
| `flip-in-y` | uniqueness 2 < 3.0 (near-duplicate) |
| `hover-border-draw` | uniqueness 2 < 3.0 (near-duplicate) |
| `bg-animated-gradient` | uniqueness 2 < 3.0 (near-duplicate) |
| `rotate-y` | uniqueness 2 < 3.0 (near-duplicate) |
| `form-underline-draw` | uniqueness 2 < 3.0 (near-duplicate) |
| `nav-menu-scale` | uniqueness 2 < 3.0 (near-duplicate) |
| `misc-ripple-click` | uniqueness 2 < 3.0 (near-duplicate) |
| `fade-in-left` | uniqueness 2 < 3.0 (near-duplicate) |
| `fade-in-right` | uniqueness 2 < 3.0 (near-duplicate) |
| `fade-out-left` | uniqueness 2 < 3.0 (near-duplicate) |
| `fade-out-right` | uniqueness 2 < 3.0 (near-duplicate) |
| `slide-in-bottom` | uniqueness 2 < 3.0 (near-duplicate) |
| `slide-out-bottom` | uniqueness 2 < 3.0 (near-duplicate) |
| `slide-out-left` | uniqueness 2 < 3.0 (near-duplicate) |
| `slide-out-right` | uniqueness 2 < 3.0 (near-duplicate) |
| `glass-claymorphism` | uniqueness 2 < 3.0 (near-duplicate) |
| `particles-rain` | uniqueness 2 < 3.0 (near-duplicate) |
| `particles-fireflies` | uniqueness 2 < 3.0 (near-duplicate) |
| `particles-bubbles` | uniqueness 2 < 3.0 (near-duplicate) |
| `micro-toggle-switch` | uniqueness 2 < 3.0 (near-duplicate) |
| `micro-dropdown-reveal` | uniqueness 2 < 3.0 (near-duplicate) |
| `visual-gradient-text-animated` | uniqueness 2 < 3.0 (near-duplicate) |
| `visual-color-shift` | uniqueness 2 < 3.0 (near-duplicate) |
| `visual-hue-rotate-loop` | uniqueness 2 < 3.0 (near-duplicate) |
| `apple-material-thick` | uniqueness 2 < 3.0 (near-duplicate) |
| `material-elevation-3` | uniqueness 2 < 3.0 (near-duplicate) |
| `material-elevation-5` | uniqueness 2 < 3.0 (near-duplicate) |
| `anim-liquid-metal-b18` | uniqueness 2 < 3.0 (near-duplicate) |
| `anim-pulse-ring-expand-b18` | uniqueness 2 < 3.0 (near-duplicate) |
| `bg-mesh-gradient-b18` | uniqueness 2 < 3.0 (near-duplicate) |
| `bg-noise-texture-b18` | uniqueness 2 < 3.0 (near-duplicate) |
| `bg-gradient-mesh-animated-b18` | uniqueness 2 < 3.0 (near-duplicate) |
| `vis-chrome-surface-b18` | uniqueness 2 < 3.0 (near-duplicate) |
| `micro-heart-beat-b18` | uniqueness 2 < 3.0 (near-duplicate) |
| `anim-morph-blob` | uniqueness 2 < 3.0 (near-duplicate) |
| `text-neon-sign-b19` | uniqueness 2 < 3.0 (near-duplicate) |
| `bg-stripe-diagonal` | uniqueness 2 < 3.0 (near-duplicate) |
| `hover-slide-bg` | uniqueness 2 < 3.0 (near-duplicate) |
| `hover-underline-grow` | uniqueness 2 < 3.0 (near-duplicate) |
| `micro-bounce-in` | uniqueness 2 < 3.0 (near-duplicate) |
| `micro-pulse-attention` | uniqueness 2 < 3.0 (near-duplicate) |
| `card-spotlight-b19` | uniqueness 2 < 3.0 (near-duplicate) |
| `ferrum-fade-in` | uniqueness 2 < 3.0 (near-duplicate) |
| `ferrum-slide-in-left` | uniqueness 2 < 3.0 (near-duplicate) |
| `ferrum-slide-in-right` | uniqueness 2 < 3.0 (near-duplicate) |
| `ferrum-zoom-in` | uniqueness 2 < 3.0 (near-duplicate) |
| `ferrum-bounce-in` | uniqueness 2 < 3.0 (near-duplicate) |
| `ferrum-flip-in-x` | uniqueness 2 < 3.0 (near-duplicate) |
| `ferrum-flip-in-y` | uniqueness 2 < 3.0 (near-duplicate) |
| `ferrum-fade-in-up` | uniqueness 2 < 3.0 (near-duplicate) |
... and 357 more (see `curation-report.json`).

### 8.2 Merge (296)

Clusters with recommendation `merge` (max similarity ≥ 0.95). These are near-exact duplicates — keep the canonical, drop the rest.

| Cluster canonical | Members | Max similarity |
|---|---|---|
| `slide-out-top` | `slide-out-top`, `slide-out-bottom`, `slide-out-left`, `slide-out-right`, `ferrum-slide-out-left`, `ferrum-slide-out-right`, `ferrum-slide-out-bottom`, `ferrum-slide-out-top` | 1.000 |
| `hover-flip` | `hover-flip`, `ferrum-hover-flip`, `ferrum-icon-flip`, `ferrum-btn-flip`, `ferrum-card-flip`, `ferrum-page-flip`, `ferrum-text-flip` | 1.000 |
| `text-underline-draw` | `text-underline-draw`, `form-underline-draw`, `hover-underline-grow`, `ferrum-hover-underline-grow`, `ferrum-tab-underline-group`, `ferrum-form-underline-draw`, `ferrum-text-underline-draw` | 1.000 |
| `fade-in-down` | `fade-in-down`, `fade-in-left`, `fade-in-right`, `ferrum-fade-in-down`, `ferrum-fade-in-left`, `ferrum-fade-in-right` | 1.000 |
| `fade-out-up` | `fade-out-up`, `fade-out-left`, `fade-out-right`, `ferrum-fade-out-left`, `ferrum-fade-out-right`, `ferrum-fade-out-up` | 1.000 |
| `material-elevation-1` | `material-elevation-1`, `material-elevation-3`, `material-elevation-5`, `ferrum-material-elevation-1`, `ferrum-material-elevation-3`, `ferrum-material-elevation-5` | 1.000 |
| `ferrum-pulse` | `ferrum-pulse`, `ferrum-loader-pulse`, `ferrum-skeleton-pulse`, `ferrum-radio-pulse`, `ferrum-icon-pulse`, `ferrum-btn-pulse` | 1.000 |
| `hover-bounce` | `hover-bounce`, `ferrum-bounce`, `ferrum-loader-bounce`, `ferrum-icon-bounce`, `ferrum-btn-bounce` | 1.000 |
| `loader-ripple` | `loader-ripple`, `ferrum-hover-ripple`, `ferrum-loader-ripple`, `ferrum-btn-ripple`, `ferrum-cursor-ripple` | 1.000 |
| `nav-menu-slide` | `nav-menu-slide`, `nav-menu-scale`, `ferrum-nav-menu-fade`, `ferrum-nav-menu-scale`, `ferrum-nav-menu-slide` | 1.000 |
| `heartbeat` | `heartbeat`, `micro-heart-beat-b18`, `ferrum-heartbeat`, `ferrum-loader-heartbeat` | 1.000 |
| `flip-in-x` | `flip-in-x`, `flip-in-y`, `ferrum-flip-in-x`, `ferrum-flip-in-y` | 1.000 |
| `hover-color-shift` | `hover-color-shift`, `visual-color-shift`, `ferrum-hover-color-shift`, `ferrum-visual-color-shift` | 1.000 |
| `hover-skew` | `hover-skew`, `ferrum-hover-skew`, `ferrum-btn-skew`, `ferrum-text-skew` | 1.000 |
| `btn-border-draw` | `hover-border-draw`, `btn-border-draw`, `ferrum-btn-border-draw`, `ferrum-hover-border-draw` | 1.000 |
| `rotate-x` | `rotate-x`, `rotate-y`, `ferrum-rotate-x`, `ferrum-rotate-y` | 1.000 |
| `btn-border-glow` | `btn-border-glow`, `ferrum-hover-border-glow`, `ferrum-btn-border-glow`, `ferrum-glass-border-glow` | 1.000 |
| `misc-fireflies` | `misc-fireflies`, `particles-fireflies`, `ferrum-fireflies`, `ferrum-misc-fireflies` | 1.000 |
| `slide-in-top` | `slide-in-top`, `slide-in-bottom`, `ferrum-slide-in-bottom`, `ferrum-slide-in-top` | 1.000 |
| `blink` | `blink`, `ferrum-text-blink`, `ferrum-skeleton-blink`, `ferrum-blink` | 1.000 |
| `visual-neon-pulse` | `visual-neon-pulse`, `ferrum-hover-neon-pulse`, `ferrum-border-neon-pulse`, `ferrum-visual-neon-pulse` | 1.000 |
| `apple-material-thin` | `apple-material-thin`, `apple-material-thick`, `ferrum-apple-material-thick`, `ferrum-apple-material-thin` | 1.000 |
| `neon-sign` | `neon-sign`, `text-neon-sign-b19`, `ferrum-neon-sign`, `ferrum-text-neon-sign` | 1.000 |
| `ferrum-bg-liquid` | `ferrum-bg-liquid`, `ferrum-btn-liquid`, `ferrum-glass-liquid`, `ferrum-page-liquid` | 1.000 |
| `bounce-in` | `bounce-in`, `micro-bounce-in`, `ferrum-bounce-in` | 1.000 |
| `shake` | `shake`, `ferrum-shake`, `ferrum-icon-shake` | 1.000 |
| `float` | `float`, `ferrum-hover-float`, `ferrum-float` | 1.000 |
| `wobble` | `wobble`, `ferrum-wobble`, `ferrum-icon-wobble` | 1.000 |
| `tada` | `tada`, `ferrum-tada`, `ferrum-icon-tada` | 1.000 |
| `swing` | `swing`, `ferrum-swing`, `ferrum-icon-swing` | 1.000 |
... and 266 more (see `duplicates.json`).

### 8.3 Improve (1)

Effects with overall 4.0–5.9 (C tier). Worth saving — targeted remediation per the dimension flags.

| Effect ID | Issues to address |
|---|---|
| `ferrum-loader-heartbeat` | performance=2, uniqueness=2 |

### 8.4 Blocked removals (1)

Deprecation candidates that are **referenced by recipes or patterns** — cannot be removed until the reference is migrated.

| Effect ID | Referenced by |
|---|---|
| `anim-pulse-ring-expand-b18` | recipe:loading-ring-pulse, recipe:notification-pulse-badge |

---

_This report is regenerated on every run of `bun run scripts/curate-effects.ts`. Do not edit by hand — edit the source data or the taxonomy module and re-run._
