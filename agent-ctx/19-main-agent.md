# Task ID: 19 — Agent: Main (Z.ai Code)

## Task
Fix remaining issues in the RoyCSS project and add 3D features inspired by originkit.dev.

## Previous Work Context
- See `/home/z/my-project/worklog.md` for full project history (Tasks 1-18).
- RoyCSS = 700-effect pure-CSS library with live previews, search, favorites, docs.
- Single-page Next.js 16 app rendered at `/`.
- All UI lives in `src/components/roycss/roycss-page.tsx`; global styles in `src/app/globals.css`.

## Work Log

### 1. Added "no results" search suggestions
- File: `src/components/roycss/roycss-page.tsx` (empty-state section after "Clear filters" button).
- Added a `<div>` containing a "Try one of these popular searches:" label and 6 chip buttons: **glow, spinner, glass, card, text, button**.
- Each chip sets `search` to that term, resets `activeCategory` to `"all"`, and refocuses the search input.

### 2. Added FAQ section (custom accordion — no Radix)
- Added new `FAQItem` + `FAQSection` components in `roycss-page.tsx`.
- Uses pure CSS `grid-template-rows: 0fr → 1fr` animation trick for smooth height animation, toggled via `data-open` attribute on the item.
- 6 Q&As (verbatim from task spec): framework support, JS inclusion, bundle size, dark mode, accessibility, color customization.
- Single-open accordion behavior (`openIndex` state, defaults to first item).
- Section is inserted between the Docs section and the Footer, with a `Separator` above and below.
- `id="faq"` anchor added for nav scroll.
- Also added FAQ buttons to the hero top-nav (desktop only) and footer nav for discoverability.

### 3. Added Animate.css migration table
- Added new `MigrationTable` component + `animateMigrationRows` data array (12 mappings — all from the spec).
- Mappings: `animate__bounce` → `roycss-anim-bounce-in`, `animate__flash` → `roycss-anim-flash`, `animate__pulse` → `roycss-anim-pulse-glow`, `animate__rubberBand` → `roycss-anim-rubber-band`, `animate__shake` → `roycss-anim-shake`, `animate__swing` → `roycss-anim-swing`, `animate__tada` → `roycss-anim-tada`, `animate__wobble` → `roycss-anim-wobble`, `animate__fadeIn` → `roycss-anim-fade-in`, `animate__fadeInUp` → `roycss-anim-fade-in-up`, `animate__slideInLeft` → `roycss-anim-slide-in-left`, `animate__zoomIn` → `roycss-anim-zoom-in`.
- Rendered inside the existing `#docs` section, directly after the DocCards grid, as a styled card with a horizontally-scrollable `<table>` on mobile.
- Custom `.roycss-migration-table` CSS in `globals.css` with sticky-feeling primary-tinted headers and hover row highlight.

### 4. Added 3D tilt card effect to hero logo
- Added new `TiltStage` React component wrapping the `RoyCSSHeroLogo`.
- `onMouseMove` handler computes pointer offset from element center and writes `--tilt-x` / `--tilt-y` CSS custom properties to the stage element (range ±15°).
- `onMouseLeave` resets tilt to 0.
- CSS (`.roycss-tilt-stage` + `.roycss-tilt-target`) applies `perspective: 800px` to the stage and `transform: rotateX(var(--tilt-x)) rotateY(var(--tilt-y)) scale(var(--tilt-scale))` to the target, with a `:hover` bump to `--tilt-scale: 1.04` for depth.
- Honors `prefers-reduced-motion` (disables tilt entirely).
- No layout shift; pure transform animation with `will-change: transform`.

### 5. Added floating 3D globe/sphere effect in hero
- Added a `<div className="roycss-sphere-3d" aria-hidden="true" />` as the first child of the hero's `-z-10` background layer.
- Pure CSS: built from a `conic-gradient` (primary + cyan/teal stops) for the surface, a radial `mask-image` to fake 3D spherical shading (light top-left, transparent bottom-right edge), and two `::before` / `::after` latitude rings rotated via `rotateX(70deg)`.
- Slowly rotates on Y + Z axes via the `roycss-sphere-spin` keyframe (22s linear infinite).
- Positioned center of hero, low opacity (`0.18`), behind content.
- Responsive via `clamp(18rem, 38vw, 32rem)`.
- Honors `prefers-reduced-motion` (animation: none).

### 6. Added 3D parallax depth to hero blobs
- Added three CSS classes: `.roycss-parallax-near`, `.roycss-parallax-mid`, `.roycss-parallax-far`, applied to the three existing hero blobs respectively.
- Wrapped in `@supports (animation-timeline: scroll())` + `@media (prefers-reduced-motion: no-preference)` for progressive enhancement.
- Each class sets a `--parallax-translate-z` (80px / 40px / 10px) and `--parallax-translate-amount` (-8% / -4% / -1%) — closer blobs move more, giving a parallax depth effect.
- Driven by `animation-timeline: scroll(root)` with `animation-range: 0 60vh` so the parallax runs over the first viewport height of scroll.
- Falls back gracefully to the existing `Parallax` Framer Motion component on browsers without scroll-timeline support (the CSS class is silently ignored).

### CSS additions (`src/app/globals.css`)
All new CSS uses **OKLCH colors**, **color-mix()**, **logical properties** (`inline-size`, `block-size`, `inset-inline-start`, `padding-block-*`), and **CSS nesting**. Sections:
- `.roycss-tilt-stage` + `.roycss-tilt-target` (3D tilt)
- `.roycss-sphere-3d` + `@keyframes roycss-sphere-spin` (3D rotating sphere)
- `.roycss-parallax-near/mid/far` + `@keyframes roycss-blob-float` (scroll-driven parallax)
- `.roycss-faq-item`, `.roycss-faq-trigger`, `.roycss-faq-chevron`, `.roycss-faq-content`, `.roycss-faq-content-inner` (custom accordion)
- `.roycss-migration-table` + responsive `@media (max-width: 640px)` block

### Cleanup
- Added `HelpCircle` to lucide-react imports (used in FAQ section).
- Initially added `Globe` import but didn't end up using it → removed to keep lint clean.

## Verification
- `bun run lint` → exit code **0**, zero errors, zero warnings.
- Dev server `bun run dev` is running on port 3000, returns HTTP 200 on `/`.
- `dev.log` shows healthy recompiles with no errors.
- HTML inspection (`curl -s http://localhost:3000/`) confirms all new content is server-rendered:
  - `Frequently Asked Questions` heading ✓
  - `Animate.css → RoyCSS Migration` heading ✓
  - All 6 FAQ question strings present ✓
  - Migration rows from `animate__bounce` → `animate__zoomIn` present ✓
  - `roycss-sphere-3d`, `roycss-tilt-stage`, `roycss-parallax-near` CSS classes in DOM ✓

## Stage Summary
All 6 task items completed end-to-end:
1. ✅ No-results search suggestions (6 chips)
2. ✅ FAQ section with custom hydration-safe accordion (6 Q&As)
3. ✅ Animate.css → RoyCSS migration table (12 mappings)
4. ✅ 3D tilt card effect on hero logo (mouse-driven, reduced-motion aware)
5. ✅ Floating 3D rotating sphere as hero background decoration (pure CSS)
6. ✅ Scroll-driven 3D parallax depth on hero blobs (progressive enhancement with fallback)

All CSS uses OKLCH colors, color-mix(), logical properties, and CSS nesting per spec.
Zero lint errors. Zero runtime errors. Page renders correctly.
