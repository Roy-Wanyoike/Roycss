---
type: added
pr: 142
---

Added 12 new glassmorphism effects to the `glass-ui` category. New ids:
`roycss-glass-frost`, `roycss-glass-aurora`, `roycss-glass-shimmer`,
`roycss-glass-blur-soft`, `roycss-glass-blur-strong`,
`roycss-glass-saturation`, `roycss-glass-hue`, `roycss-glass-invert`,
`roycss-glass-grayscale`, `roycss-glass-sepia`, `roycss-glass-contrast`,
`roycss-glass-brightness`. All use `backdrop-filter: color-mix()` with
OKLCH lightness adjustments for theme-aware tinting.

<!--
  This file is a TEMPLATE — its filename starts with `_` so
  generate-changelog.ts skips it. Copy this file to a new file (without
  the leading underscore) and edit the frontmatter + body to add a real
  entry. Delete this comment block when you copy.

  Naming suggestion: <PR-number>-<short-slug>.md
    e.g. 142-glass-effects.md, 256-fix-loader-spin.md

  Frontmatter:
    type: one of added|changed|deprecated|removed|fixed|security (required)
    pr:   GitHub PR number (optional but recommended)

  Body:
    1-3 lines of markdown. First line becomes the bullet.
-->
