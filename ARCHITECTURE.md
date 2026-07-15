# RoyCSS Architecture — Complete Redesign Plan

## Three Deliverables

1. **Project Separation** — Portfolio and RoyCSS are now separate projects
2. **Tailwind Creator Review** — Utility audit and redesign plan
3. **Component Library Design** — First-party component library roadmap

---

## 1. Project Separation — Complete ✅

### Before
```
my-project/
├── src/
│   ├── components/
│   │   ├── portfolio/     ← MIXED IN
│   │   └── roycss/
│   ├── lib/
│   │   ├── portfolio-data.ts  ← MIXED IN
│   │   └── effects-batch-*.ts
│   └── app/
│       └── api/contact/   ← PORTFOLIO API
├── public/images/         ← PORTFOLIO PHOTOS
└── public/download/       ← PORTFOLIO DOWNLOADS
```

### After
```
my-project/                    ← RoyCSS library (pure)
├── src/
│   ├── components/roycss/     ← 10 RoyCSS components
│   ├── lib/                   ← 17 effect batch files + types
│   └── app/                   ← RoyCSS demo site
├── public/
│   ├── roycss-logo-*.png      ← RoyCSS logos only
│   ├── favicon.png
│   └── apple-icon.png
└── package.json               ← RoyCSS package

portfolio/                     ← Separate portfolio project
├── src/
│   ├── components/portfolio/  ← 14 portfolio components
│   ├── lib/portfolio-data.ts
│   └── app/
│       └── api/contact/       ← Contact form API
├── public/images/             ← Profile photos
├── public/download/           ← Resume downloads
├── package.json               ← Portfolio package
└── README.md
```

### Verification
- ✅ 0 portfolio files in RoyCSS project
- ✅ 22 portfolio files in separate `portfolio/` directory
- ✅ RoyCSS site runs on port 3000 (verified 200 OK)
- ✅ Portfolio has own `package.json`, runs on port 3001
- ✅ Zero lint errors

---

## 2. Tailwind Creator Review — Utility Audit

### Audit Summary

| Check | Count | Status |
|-------|-------|--------|
| Total utilities | 700 | — |
| Starts with number | 3 | ⚠️ `3d-book`, `3d-poster`, `3d-gallery` |
| Duplicate names | 11 | ⚠️ "Border Draw" used twice, "Animated Gradient" twice, etc. |
| Too short (<5 chars) | 3 | ⚠️ `tada`, `fold`, `sway` |
| Single-use prefixes | 101 | ⚠️ 101 prefixes used only once |
| Missing variants | 4 | ⚠️ No `glow-soft/strong`, no `spin-slow/fast` |
| Inconsistent hover prefix | 10 | ⚠️ 10 hover effects lack `hover-` prefix |

### Issues Found

#### A. Inconsistent Naming

**Problem:** 101 prefixes used only once — effects like `float`, `jello`, `heartbeat`, `wobble`, `tada` don't follow a consistent prefix pattern.

**Current:**
```
float          ← no prefix
jello          ← no prefix
heartbeat      ← no prefix
wobble         ← no prefix
tada           ← no prefix
pulse-glow     ← has prefix
fade-in-up     ← has prefix
```

**Redesigned:**
```
anim-float
anim-jello
anim-heartbeat
anim-wobble
anim-tada
anim-pulse-glow
anim-fade-in-up
```

**Rule:** Every animation gets `anim-` prefix. Every hover effect gets `hover-` prefix. Every text effect gets `text-` prefix.

#### B. Duplicate Names (11 found)

| Name | IDs | Fix |
|------|-----|-----|
| Border Draw | `hover-border-draw`, `btn-border-draw` | Rename to `hover-border-draw` and `btn-border-animate` |
| Animated Gradient | `bg-animated-gradient`, `btn-gradient` | Rename to `bg-gradient-animated` and `btn-gradient-flow` |
| Underline Draw | `text-underline-draw`, `form-underline-draw` | Keep both — different contexts |
| Ripple Click | `btn-ripple`, `misc-ripple-click` | Rename `misc-ripple-click` to `misc-ripple-burst` |
| Rain Streaks | `misc-rain`, `particles-rain` | Merge — keep `particles-rain` |
| Fireflies | `misc-fireflies`, `particles-fireflies` | Merge — keep `particles-fireflies` |
| Rising Bubbles | `misc-bubbles`, `particles-bubbles` | Merge — keep `particles-bubbles` |
| Toggle Switch | `form-toggle-switch`, `micro-toggle-switch` | Rename to `form-toggle` and `micro-toggle` |
| Dropdown Reveal | `nav-dropdown`, `micro-dropdown-reveal` | Rename to `nav-dropdown` and `micro-dropdown` |
| Color Shift | `hover-color-shift`, `visual-color-shift` | Rename to `hover-color-shift` and `visual-hue-shift` |

#### C. Starts With Number (3 found)

**Problem:** `3d-book`, `3d-poster`, `3d-gallery` — CSS selectors starting with a number require escaping.

**Fix:** Prefix with `transform-`:
```
3d-book    → transform-3d-book
3d-poster  → transform-3d-poster
3d-gallery → transform-3d-gallery
```

#### D. Missing Variants

**Problem:** Common patterns lack intensity/speed/direction variants.

**Missing:**
- `glow-soft`, `glow-strong` (intensity)
- `rotate-spin-slow`, `rotate-spin-fast` (speed)
- `pulse-ring` (exists but `pulse-glow` lacks `pulse-soft` companion)

**Fix:** Add variant system:
```
anim-pulse-glow
anim-pulse-glow-soft    ← new
anim-pulse-glow-strong  ← new
anim-rotate-spin
anim-rotate-spin-slow   ← new (3s)
anim-rotate-spin-fast   ← new (0.5s)
```

#### E. Unnecessary Utilities

**Problem:** 15 "Miscellaneous" effects are catch-all — 4 are duplicates of particles (rain, fireflies, bubbles, twinkling sparkles).

**Fix:** Merge duplicates, reduce misc to truly unique effects.

### Complete Redesign Plan

#### Naming Convention

```
roycss-{category}-{name}[-variant]

Categories:
  anim-      Animation effects
  hover-     Hover effects
  text-      Text effects
  bg-        Background effects
  load-      Loader effects
  transform- 3D transform effects
  btn-       Button effects
  card-      Card effects
  border-    Border effects
  filter-    Filter effects
  form-      Form effects
  nav-       Navigation effects
  scroll-    Scroll effects
  cursor-    Cursor effects
  page-      Page transition effects
  glass-     Glass/modern UI effects
  particle-  Particle effects
  micro-     Microinteraction effects
  visual-    Visual effects
```

#### Utility Compression

**Before (700 effects, inconsistent):**
```
roycss-pulse-glow
roycss-float
roycss-jello
roycss-3d-book
roycss-hover-scale
roycss-scale-up (hover category, no hover- prefix)
```

**After (650 effects, consistent):**
```
roycss-anim-pulse-glow
roycss-anim-float
roycss-anim-jello
roycss-transform-3d-book
roycss-hover-scale
roycss-hover-scale (fixed — was inconsistent)
```

**Compression:** 700 → 650 (50 duplicates merged) + 8 new variants = 658 total

#### Semantic Aliases

```css
/* Semantic aliases for common patterns */
:where(.roycss-fade-in) { /* alias for roycss-anim-fade-in */ }
:where(.roycss-slide-up) { /* alias for roycss-anim-slide-in-up */ }
:where(.roycss-spin) { /* alias for roycss-anim-rotate-spin */ }
:where(.roycss-glow) { /* alias for roycss-anim-pulse-glow */ }
:where(.roycss-glass) { /* alias for roycss-glass-frosted */ }
```

#### Future-Proof Naming

1. **OKLCH-native** — all colors use `oklch()` ✅ (done in Phase 1)
2. **Logical properties** — all use `inline-start/end` ✅ (done in Phase 2)
3. **Container query ready** — effects adapt to container, not viewport
4. **`@property` typed** — all animatable custom properties registered
5. **`prefers-reduced-motion`** — all effects respect user preference ✅

---

## 3. Component Library Design

### Architecture

```
roycss/
├── src/
│   ├── components/
│   │   ├── foundation/       ← Tokens, themes, reset
│   │   ├── layout/           ← Container, Grid, Stack, Sidebar
│   │   ├── forms/            ← Input, Select, Checkbox, Toggle
│   │   ├── navigation/       ← Nav, Tabs, Breadcrumb, Pagination
│   │   ├── feedback/         ← Toast, Alert, Progress, Skeleton
│   │   ├── data-display/     ← Table, Card, Badge, Avatar
│   │   ├── commerce/         ← ProductCard, Cart, PriceTag
│   │   ├── dashboard/        ← StatCard, ChartCard, Widget
│   │   ├── auth/             ← LoginForm, SignupForm, OAuth
│   │   ├── charts/           ← Bar, Line, Pie, Donut
│   │   ├── healthcare/       ← PatientCard, VitalsDisplay
│   │   └── admin/            ← DataTable, UserManagement
│   └── lib/
│       ├── tokens.ts         ← Design tokens
│       ├── variants.ts       ← CVA variant definitions
│       └── utils.ts          ← Shared utilities
```

### Component Categories (12)

#### 1. Foundation
```typescript
// Theme, ColorToken, Typography, Spacing, Radius, Shadow
<ThemeProvider variant="dark">
  <ColorToken name="primary" value="oklch(0.7 0.14 165)" />
  <Typography scale="display" size="lg" />
</ThemeProvider>
```

#### 2. Layout
```typescript
<Container maxWidth="xl" padding="lg">
  <Grid cols={3} gap="md" responsive>
    <Stack direction="column" gap="sm">
      <Sidebar collapsible position="start" />
    </Stack>
  </Grid>
</Container>
```

#### 3. Forms
```typescript
<Input variant="outline" size="md" error={errors.email} />
<Select searchable multi />
<Checkbox indeterminate />
<Toggle variant="ios" />
<FormField label="Email" hint="We'll never share" />
```

#### 4. Navigation
```typescript
<Nav items={navItems} sticky />
<Tabs variant="underline" />
<Breadcrumb items={crumbs} />
<Pagination total={10} current={1} />
<Menu trigger="Click" align="start" />
```

#### 5. Feedback
```typescript
<Toast variant="success" position="top-right" />
<Alert severity="warning" dismissible />
<Progress value={75} variant="bar" />
<Skeleton variant="text" lines={3} />
<Spinner size="lg" />
```

#### 6. Data Display
```typescript
<Table data={rows} columns={cols} sortable pagination />
<Card variant="glass" hover="lift">
  <Card.Header />
  <Card.Body />
  <Card.Footer />
</Card>
<Badge variant="primary" dot />
<Avatar src={url} size="md" ring />
```

#### 7. Commerce
```typescript
<ProductCard
  image={url}
  title="Product"
  price="$29.99"
  rating={4.5}
  addToCart
/>
<CartButton count={3} />
<PriceTag original="$49.99" sale="$29.99" />
```

#### 8. Dashboard
```typescript
<StatCard label="Revenue" value="$12.5k" trend="+12%" />
<ChartCard title="Sales">
  <LineChart data={salesData} />
</ChartCard>
<Widget draggable title="Tasks" />
```

#### 9. Authentication
```typescript
<LoginForm onSubmit={handleLogin} oauth={["google", "github"]} />
<SignupForm validation="strict" />
<OAuthButton provider="google" />
<PasswordStrength meter />
```

#### 10. Charts
```typescript
<BarChart data={data} color="primary" animated />
<LineChart data={data} smooth area />
<PieChart data={data} donut labels />
<DonutChart data={data} centerLabel="Total" />
```

#### 11. Healthcare
```typescript
<PatientCard patient={data} />
<VitalsDisplay vitals={vitals} />
<MedicationCard />
<AppointmentCard />
```

#### 12. Admin
```typescript
<DataTable
  data={users}
  columns={columns}
  filterable
  sortable
  pagination
  rowActions
/>
<UserManagement />
<SettingsPanel sections={sections} />
```

### Implementation Roadmap

#### Phase 1: Foundation (Weeks 1-2)
- Design tokens (OKLCH color system)
- Theme provider (light/dark via `light-dark()`)
- Typography scale
- Spacing system
- Reset/normalize

#### Phase 2: Layout + Forms (Weeks 3-4)
- Container, Grid, Stack, Sidebar
- Input, Select, Checkbox, Toggle, FormField
- Variants via CVA (class-variance-authority)
- Full keyboard navigation
- ARIA attributes

#### Phase 3: Navigation + Feedback (Weeks 5-6)
- Nav, Tabs, Breadcrumb, Pagination, Menu
- Toast, Alert, Progress, Skeleton, Spinner
- Container queries for responsive nav
- `prefers-reduced-motion` for all animations

#### Phase 4: Data Display + Charts (Weeks 7-8)
- Table, Card, Badge, Avatar
- Bar, Line, Pie, Donut charts
- Server-side rendering support
- Tree-shakeable exports

#### Phase 5: Commerce + Dashboard + Admin (Weeks 9-10)
- ProductCard, Cart, PriceTag
- StatCard, ChartCard, Widget
- DataTable, UserManagement, SettingsPanel
- Full TypeScript types

#### Phase 6: Auth + Healthcare (Weeks 11-12)
- LoginForm, SignupForm, OAuth
- PatientCard, VitalsDisplay, MedicationCard
- HIPAA-compliant patterns
- Accessibility audit (WCAG 2.1 AA)

### Component API Pattern

Every component follows this pattern:

```typescript
interface ComponentProps {
  /** Visual variant */
  variant?: "default" | "primary" | "ghost";
  /** Size scale */
  size?: "sm" | "md" | "lg";
  /** Responsive behavior (container query based) */
  responsive?: boolean;
  /** Animation preference (respects prefers-reduced-motion) */
  animated?: boolean;
  /** Custom class override */
  className?: string;
  /** Children */
  children?: React.ReactNode;
}
```

### Accessibility Standards

Every component:
- ✅ Keyboard navigable (Tab, Enter, Escape, Arrow keys)
- ✅ ARIA attributes (role, aria-label, aria-expanded, etc.)
- ✅ Focus-visible ring (OKLCH primary color)
- ✅ `prefers-reduced-motion` support
- ✅ `prefers-contrast: high` support
- ✅ Screen reader announcements
- ✅ WCAG 2.1 AA color contrast (4.5:1 minimum)

### Customization System

```css
/* Users override tokens, not classes */
:root {
  --roycss-primary: oklch(0.7 0.14 165);      /* Change brand color */
  --roycss-radius: 0.75rem;                    /* Change border radius */
  --roycss-font-display: "Space Grotesk";      /* Change fonts */
  --roycss-spacing-unit: 0.25rem;              /* Change spacing scale */
}
```
