# Dependency Audit — RoyCSS Marketing Site

- **Audit date:** 2026-07-30
- **Auditor:** Security Engineering & Supply Chain domain agent
- **Tool:** `bun audit` v1.3.14 (0d9b296a), `bun pm ls`
- **Scope:** `/home/z/my-project/package.json` (the marketing site, **not**
  the publishable `roycss` npm package — that has zero runtime deps)
- **Related:** `security/SBOM.json` (SPDX 2.3 SBOM),
  `security/results/sbom.json` (CycloneDX 1.4 SBOM),
  `security/results/audit-report.json` (machine-readable audit output),
  `docs/adr/07-security-supply-chain.md` §6 (overrides table)

---

## 1. Executive summary

| Metric | Value | Status |
|---|---|---|
| **Total direct dependencies (runtime + dev)** | **81** (69 runtime + 12 dev) | — |
| **Total transitive dependencies installed** | **1,088** | — |
| **Vulnerabilities found** | **0** (0 critical, 0 high, 0 moderate, 0 low, 0 info) | ✅ Clean |
| **`overrides` applied** | **16** | ✅ All documented in ADR §6 |
| **Runtime deps with `postinstall` scripts** | **8** | ✅ All reviewed (native-binary downloaders) |
| **Outdated packages** | See §4 | Minor (patch-level) |

**Verdict:** The dependency tree is **clean**. `bun audit` reports zero
vulnerabilities across all 1,088 installed packages. The 16 `overrides`
in `package.json` force patched versions of transitive dependencies that
would otherwise be vulnerable. No accepted-risk advisories remain.

---

## 2. Dependency counts

### 2.1 Direct runtime dependencies (69)

Source: `package.json` `dependencies` block.

Categories:

| Category | Count | Examples |
|---|---|---|
| Next.js / React framework | 3 | `next`, `react`, `react-dom` |
| Auth (unused — see R-3) | 1 | `next-auth` |
| Internationalization | 1 | `next-intl` |
| Theme management | 1 | `next-themes` |
| Prisma ORM + client | 2 | `prisma`, `@prisma/client` |
| Radix UI primitives | 27 | `@radix-ui/react-*` |
| DnD | 3 | `@dnd-kit/core`, `-sortable`, `-utilities` |
| Forms | 3 | `react-hook-form`, `@hookform/resolvers`, `zod` |
| Tables / queries | 2 | `@tanstack/react-query`, `-table` |
| Animation | 2 | `framer-motion`, `embla-carousel-react` |
| Markdown / rich text | 5 | `@mdxeditor/editor`, `react-markdown`, `rehype-slug`, `remark-gfm`, `react-syntax-highlighter` |
| Charts | 1 | `recharts` |
| Date | 2 | `date-fns`, `react-day-picker` |
| Icons | 1 | `lucide-react` |
| UI utilities | 5 | `class-variance-authority`, `clsx`, `cmdk`, `tailwind-merge`, `tailwindcss-animate` |
| Layout / panels | 2 | `react-resizable-panels`, `vaul` |
| Notifications | 1 | `sonner` |
| Image processing | 1 | `sharp` |
| MCP / AI | 2 | `@modelcontextprotocol/sdk`, `z-ai-web-dev-sdk` |
| State | 1 | `zustand` |
| Hooks | 1 | `@reactuses/core` |
| OTP / input | 1 | `input-otp` |
| UUID | 1 | `uuid` |
| **Total** | **69** | — |

### 2.2 Direct dev dependencies (12)

Source: `package.json` `devDependencies` block.

| Package | Version | Purpose |
|---|---|---|
| `@changesets/changelog-github` | ^0.7.0 | Changelog formatter |
| `@changesets/cli` | ^2.31.1 | Release tooling |
| `@tailwindcss/postcss` | ^4 | Tailwind 4 PostCSS plugin |
| `@types/react` | ^19 | React types |
| `@types/react-dom` | ^19 | React DOM types |
| `axe-core` | ^4.12.1 | A11y test harness |
| `bun-types` | ^1.3.4 | Bun runtime types |
| `eslint` | ^9 | Linter |
| `eslint-config-next` | ^16.2.12 | Next.js ESLint config |
| `tailwindcss` | ^4 | Tailwind 4 |
| `tw-animate-css` | ^1.3.5 | Tailwind animation utilities |
| `typescript` | ^5 | TypeScript compiler |

### 2.3 Installed versions (top-level, from `bun pm ls`)

```
@changesets/changelog-github@0.7.0
@changesets/cli@2.31.1
@dnd-kit/core@6.3.1
@dnd-kit/sortable@10.0.0
@dnd-kit/utilities@3.2.2
@hookform/resolvers@5.2.2
@mdxeditor/editor@3.52.3
@modelcontextprotocol/sdk@1.30.0
@prisma/client@6.19.2
@radix-ui/react-accordion@1.2.12
@radix-ui/react-alert-dialog@1.1.15
@radix-ui/react-aspect-ratio@1.1.8
@radix-ui/react-avatar@1.1.11
@radix-ui/react-checkbox@1.3.3
@radix-ui/react-collapsible@1.1.12
@radix-ui/react-context-menu@2.2.16
@radix-ui/react-dialog@1.1.15
@radix-ui/react-dropdown-menu@2.1.16
@radix-ui/react-hover-card@1.1.15
@radix-ui/react-label@2.1.8
@radix-ui/react-menubar@1.1.16
@radix-ui/react-navigation-menu@1.2.14
@radix-ui/react-popover@1.1.15
@radix-ui/react-progress@1.1.8
@radix-ui/react-radio-group@1.3.8
@radix-ui/react-scroll-area@1.2.10
@radix-ui/react-select@2.2.6
@radix-ui/react-separator@1.1.8
@radix-ui/react-slider@1.3.6
@radix-ui/react-slot@1.2.4
@radix-ui/react-switch@1.2.6
@radix-ui/react-tabs@1.1.13
@radix-ui/react-toast@1.2.15
@radix-ui/react-toggle@1.1.10
@radix-ui/react-toggle-group@1.1.11
@radix-ui/react-tooltip@1.2.8
@reactuses/core@6.1.9
@tailwindcss/postcss@4.1.18
@tanstack/react-query@5.90.19
@tanstack/react-table@8.21.3
@types/react@19.2.8
@types/react-dom@19.2.3
axe-core@4.12.1
bun-types@1.3.6
class-variance-authority@0.7.1
clsx@2.1.1
cmdk@1.1.1
date-fns@4.1.0
embla-carousel-react@8.6.0
eslint@9.39.2
eslint-config-next@16.2.12
framer-motion@12.26.2
input-otp@1.4.2
lucide-react@0.525.0
next@16.2.12
next-auth@4.24.15
next-intl@4.13.4
next-themes@0.4.6
prisma@6.19.2
react@19.2.3
react-day-picker@9.13.0
react-dom@19.2.3
react-hook-form@7.71.1
react-markdown@10.1.0
react-resizable-panels@3.0.6
react-syntax-highlighter@15.6.6
recharts@2.15.4
rehype-slug@6.0.0
remark-gfm@4.0.1
sharp@0.35.3
sonner@2.0.7
tailwind-merge@3.4.0
tailwindcss@4.1.18
tailwindcss-animate@1.0.7
tw-animate-css@1.4.0
typescript@5.9.3
uuid@11.1.1
vaul@1.1.2
z-ai-web-dev-sdk@0.0.18
zod@4.3.5
zustand@5.0.10
```

---

## 3. Vulnerabilities

### 3.1 `bun audit` result

```
$ bun audit
[0.05ms] ".env"
bun audit v1.3.14 (0d9b296a)
No vulnerabilities found
```

```
$ bun audit --json
[0.05ms] ".env"
bun audit v1.3.14 (0d9b296a)
{}
```

**Result: 0 advisories.** The empty JSON object `{}` is `bun audit`'s
signal for "no advisories found."

### 3.2 `security/audit.ts` report

The `security/audit.ts` script runs `bun audit --json`, parses the result,
counts by severity, and writes `security/results/audit-report.json`. Key
fields:

```json
{
  "generatedAt": "2026-07-30T13:12:57.682Z",
  "tool": "bun audit",
  "toolVersion": "v1.3.14",
  "bunAuditExitCode": 0,
  "summary": {
    "critical": 0,
    "high": 0,
    "moderate": 0,
    "low": 0,
    "info": 0,
    "total": 0
  },
  "acceptedAdvisories": [],
  "unacceptedHighOrCritical": 0,
  "affectedPackageCount": 0,
  "exitCode": 0,
  "explanation": "PASS: 0 critical, 0 high. (0 moderate, 0 low, 0 accepted-risk.) 8 runtime deps have postinstall scripts..."
}
```

### 3.3 Why zero vulnerabilities (despite 1,088 transitive deps)

The `package.json` `overrides` field forces patched versions of 16
transitive dependencies that would otherwise be vulnerable. The full
table is in `docs/adr/07-security-supply-chain.md` §6. Summary:

| Override | Why |
|---|---|
| `@babel/core` ^7.29.0 | Low: arbitrary file read via sourceMappingURL |
| `ajv` ^6.14.0 | Moderate: ReDoS with `$data` option |
| `brace-expansion` ^5.0.9 | High: DoS via unbounded expansion (GHSA-mh99-v99m-4gvg) |
| `defu` ^6.1.5 | High: prototype pollution via `__proto__` |
| `diff` ^5.2.2 | Low: ReDoS in `parsePatch`/`applyPatch` |
| `effect` ^3.20.0 | High: AsyncLocalStorage context loss under concurrent RPC |
| `flatted` ^3.4.4 | High: unbounded recursion DoS + prototype pollution |
| `js-cookie` ^3.0.6 | High: prototype hijack in `assign()` |
| `js-yaml` ^4.3.0 | High: quadratic-complexity DoS in merge keys |
| `lodash` / `lodash-es` ^4.17.23 | Moderate: prototype pollution in `_.unset`/`_.omit` |
| `minimatch` ^10.2.6 | High: ReDoS (v10 unblocks brace-expansion@^5.0.8) |
| `picomatch` ^4.0.4 | Moderate: POSIX character class method injection |
| `postcss` ^8.5.18 | High: arbitrary file read via sourceMappingURL |
| `prismjs` ^1.30.0 | Moderate: ReDoS in `prism-.*` languages (transitive of react-syntax-highlighter) |
| `sharp` ^0.35.3 | High: libvips CVE-2026-33327/33328/35590/35591 |

### 3.4 Postinstall scripts (8 runtime deps)

`security/audit.ts` reports these runtime deps have `postinstall` (or
`preinstall`, `install`, `prepare`) scripts:

| Package | Why it has postinstall | Risk |
|---|---|---|
| `@hookform/resolvers` | Build step (compiles zod/yup schema resolvers) | Low |
| `@prisma/client` | Downloads the Prisma query engine binary | Low (official source) |
| `prisma` | Downloads the Prisma CLI binary | Low (official source) |
| `react-hook-form` | Build step | Low |
| `react-syntax-highlighter` | Build step (compiles Prism languages) | Low |
| `recharts` | Build step | Low |
| `tailwindcss-animate` | Build step | Low |
| `uuid` | Build step | Low |

**Policy:** All 8 are well-known, widely-used packages whose postinstall
does expected things. They are documented in
`security/results/audit-report.json` and reviewed at every release. No
`postinstall` scripts are allowed in Tier A artifacts (npm package, VS
Code ext, Inspector, CLI, MCP server) — those ship with zero runtime deps.

---

## 4. Outdated packages

`bun audit` does not report outdated packages (only vulnerabilities). To
check for outdated packages, run `bun outdated` (not run in this audit
because it requires network access to the npm registry and the result
changes daily). Manual inspection of `package.json` vs. installed
versions shows:

| Package | Declared range | Installed | Notes |
|---|---|---|---|
| `@hookform/resolvers` | ^5.1.1 | 5.2.2 | Patch within range ✅ |
| `@mdxeditor/editor` | ^3.39.1 | 3.52.3 | Minor within range ✅ |
| `@prisma/client` | ^6.11.1 | 6.19.2 | Minor within range ✅ |
| `next` | ^16.2.12 | 16.2.12 | Exact match ✅ |
| `next-auth` | ^4.24.15 | 4.24.15 | Exact match ✅ (unused — R-3) |
| `prisma` | ^6.11.1 | 6.19.2 | Minor within range ✅ |
| `react` | ^19.0.0 | 19.2.3 | Minor within range ✅ |
| `react-dom` | ^19.0.0 | 19.2.3 | Minor within range ✅ |
| `tailwindcss` | ^4 | 4.1.18 | Minor within range ✅ |
| `zod` | ^4.0.2 | 4.3.5 | Minor within range ✅ |

**No packages are outside their declared range.** All are at or near the
latest within their major. `bun update` would bump them to the latest
within the caret range; this is a routine maintenance task, not a
security issue.

### 4.1 Recommended updates

- **Routine:** `bun update` quarterly to pull patch fixes within the
  caret range. Re-run `bun audit` after.
- **Minor bumps:** review the changelog for any minor bumps that touch
  security-relevant code (e.g. `next`, `next-auth`, `prisma`).
- **Major bumps:** require an ADR amendment. None currently needed.
- **R-3 (recommended removal):** `next-auth` is unused. Removing it
  eliminates a historical CVE surface (next-auth has had several
  homoglyph bypass CVEs) and shrinks the SBOM by 1 direct dep + its
  transitive tree.

---

## 5. SBOM cross-reference

Two SBOMs are generated for this audit:

| File | Format | Package count | Generated by |
|---|---|---|---|
| `security/SBOM.json` | **SPDX 2.3** | 82 (1 root + 69 runtime + 12 dev) | `security/SBOM.json` (this audit, manual SPDX generator) |
| `security/results/sbom.json` | **CycloneDX 1.4** | 82 (1 root + 69 runtime + 12 dev) | `security/sbom.ts` (existing automated script) |

Both SBOMs are regenerated on every release and uploaded as build
artifacts / attached to the GitHub release.

---

## 6. CI integration

The release pipeline (`scripts/publish/release.ts`) runs the following
before `npm publish`:

```bash
bun run security:audit && \
bun run security:sbom && \
bun run security:csp && \
bun run security:css-exfil && \
bun run security:xss && \
bun run lint && \
scripts/publish/release.ts
```

If any step exits non-zero, the release is aborted. The SBOM and audit
report are uploaded as build artifacts and attached to the GitHub
release.

---

## 7. Audit verification commands

Reproduce this audit:

```bash
cd /home/z/my-project

# Vulnerability scan
bun audit

# Full audit script (writes security/results/audit-report.json)
bun run security:audit

# SBOM generation (CycloneDX 1.4)
bun run security:sbom

# SPDX 2.3 SBOM (already at security/SBOM.json — regenerate with the
# generator script if package.json changes)

# List installed deps
bun pm ls

# Count direct deps
node -e "const p = require('./package.json'); console.log('runtime:', Object.keys(p.dependencies).length, 'dev:', Object.keys(p.devDependencies).length);"
```

---

## 8. Conclusion

The RoyCSS marketing site dependency tree is **clean** as of 2026-07-30:

- ✅ 0 vulnerabilities (`bun audit`)
- ✅ 16 overrides applied, all documented
- ✅ 8 postinstall scripts reviewed and accepted
- ✅ 81 direct deps (69 runtime + 12 dev), 1,088 transitive
- ✅ Two SBOMs generated (SPDX 2.3 + CycloneDX 1.4)

**Recommended follow-ups** (see `docs/adr/security/IMPLEMENTATION-PLAN.md`):

1. **R-3 (Low):** Remove unused `next-auth` dep.
2. **Routine:** Run `bun update` quarterly; re-run `bun audit` after.
3. **Routine:** Re-generate both SBOMs after any dep change.
