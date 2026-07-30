# Threat Model 03 — Documentation Site Overlay

- **ADR:** `docs/adr/03-docs-site.md`
- **Owner:** Principal Engineer, Documentation Site domain
- **Date:** 2025-01-20
- **Status:** Approved

---

## 1. Scope

This threat model covers the RoyCSS documentation overlay: a client-side,
full-screen modal that renders 19 markdown documents from a build-time-generated
JSON file (`src/components/docs/docs-content.json`).

**In scope:**
- Markdown content rendering (`react-markdown` + `remark-gfm` + `rehype-slug`)
- Build-time content compilation (`scripts/build-docs.ts`)
- In-memory search across doc content
- TOC anchor scrolling
- Overlay lifecycle (open, close, body-scroll lock)

**Out of scope:**
- Server-side rendering (the overlay is a client component)
- External doc sources (all docs are local files committed to the repo)
- Authenticated docs (all docs are public — they live in the public GitHub repo)

---

## 2. Assets

| Asset | Sensitivity | Notes |
|-------|-------------|-------|
| Doc markdown content | Low | Already public in GitHub repo |
| Doc titles & TOC structure | Low | Already public |
| User search query | Low | Stays in browser memory; never sent to a server |
| Currently-viewed doc state | Low | Client-only; no telemetry |
| Build script `scripts/build-docs.ts` | Medium | Misconfiguration could leak non-doc files into the JSON |

---

## 3. Threat Agents

| Agent | Capability | Motivation |
|-------|-----------|------------|
| Malicious contributor | Can submit a PR adding `<script>` to a `.md` file | Deface site, steal tokens |
| Compromised dependency | Can hijack `react-markdown` or `remark-gfm` at install time | RCE in build, XSS in client |
| Curious user | Can open devtools, modify DOM, type `javascript:` in inputs | Information disclosure (low — all data is already public) |

---

## 4. Threats (STRIDE)

### T1 — XSS via Markdown Content (Spoofing / Tampering / Elevation of Privilege)

**Description:** A markdown file contains raw HTML like
`<script>alert(document.cookie)</script>` or `<img src=x onerror=...>`. If the
renderer executes raw HTML, an attacker can run arbitrary JavaScript in the
user's session.

**Likelihood:** Medium (the docs are in a public repo; anyone can PR).

**Impact:** High (full session compromise if the user is logged into another
service on the same origin — though RoyCSS has no auth, a stolen session
cookie for a third-party service on `localhost:3000` could leak).

**Mitigation:**
- ✅ Use `react-markdown` v10 **without** `rehype-raw`. By default, react-markdown
  escapes all raw HTML and renders it as plain text. There is no code path that
  calls `dangerouslySetInnerHTML`.
- ✅ Do not pass `urlTransform` that allows `javascript:` URLs. The default
  `urlTransform` in react-markdown v10 sanitizes dangerous protocols.
- ✅ Defense-in-depth: at build time, `scripts/build-docs.ts` could optionally
  strip `<script>` blocks. (Skipped in v1 because react-markdown already
  neutralizes them at render time — adding build-time stripping is redundant.)
- ✅ Audit: search the 19 docs for `<script` — currently 0 occurrences.

**Residual risk:** Low. The only way to render raw HTML is to add `rehype-raw`
to the renderer pipeline, which we explicitly do not do.

### T2 — XSS via Search Result Highlighting (Spoofing)

**Description:** The search component highlights matching substrings in doc
titles/snippets. If we used `dangerouslySetInnerHTML` to inject `<mark>` tags
around matches, an attacker who controls doc content could craft a title like
`<img src=x onerror=alert(1)>` and have it execute when search highlights it.

**Likelihood:** Low (requires attacker to land a malicious title in the repo).

**Impact:** High (same as T1).

**Mitigation:**
- ✅ Search highlighting uses **React children**, not `dangerouslySetInnerHTML`.
  We split the matched string into `[before, match, after]` and render them as
  three `<span>` elements with the middle one styled as a highlight. React
  escapes the text content automatically.
- ✅ Search results list titles as plain `{doc.title}` React expressions.

**Residual risk:** Very low.

### T3 — XSS via TOC Anchor IDs (Spoofing)

**Description:** TOC entries are generated from `## H2` heading text. If a
heading contains `"><script>alert(1)</script>`, the slugified ID could be
malicious and — if injected via `dangerouslySetInnerHTML` — execute.

**Likelihood:** Very Low (heading text would need to be carefully crafted).

**Impact:** High.

**Mitigation:**
- ✅ Slug generation in `scripts/build-docs.ts` strips all characters except
  `[a-z0-9-]`. Any `<`, `>`, `"`, `'` characters are removed. The resulting
  ID is safe to use as an HTML attribute.
- ✅ The slug is rendered as a plain React `id={slug}` prop, not via
  `dangerouslySetInnerHTML`.
- ✅ `rehype-slug` (used at runtime) also generates GitHub-style slugs and
  validates them — so even if our build-time slug differed, the runtime ID
  would still be safe.

**Residual risk:** Negligible.

### T4 — Bundle Size Bloat (Denial of Service — Client-side)

**Description:** Adding new docs increases `docs-content.json` size. If the
file grows past ~5 MB, loading it on a slow connection degrades the overlay
open time below the 300 ms budget, effectively DoSing mobile users.

**Likelihood:** Medium (docs grow over time).

**Impact:** Medium (poor UX, not a security breach).

**Mitigation:**
- ✅ The JSON is lazy-loaded via `await import("./docs-content.json")`. It only
  loads when the user opens the overlay — main-page performance is unaffected.
- ✅ A skeleton loader displays during the import, so the user sees feedback
  within 16 ms of clicking "Docs".
- ✅ Benchmark `docs/benchmarks/03-docs-site.md` §3.4 tracks JSON size; if it
  crosses 2 MB we will split per-doc JSON chunks.
- ✅ Current size: ~818 KB of source markdown → ~820 KB JSON (negligible overhead).

**Residual risk:** Low.

### T5 — Compromised Dependency (Supply Chain)

**Description:** A future `bun install` pulls a malicious version of
`react-markdown`, `remark-gfm`, or `rehype-slug` that injects runtime XSS.

**Likelihood:** Low (all three are well-maintained, signed packages from
the unified/remark ecosystem).

**Impact:** Critical (full client compromise).

**Mitigation:
- ✅ Pin exact versions in `package.json` (no `^` ranges for these three).
  - `remark-gfm@4.0.1`
  - `rehype-slug@6.0.0`
  - (`react-markdown` is already pinned to `^10.1.0` — could tighten to `10.1.0` in a future PR.)
- ✅ Run `bun audit` in CI (future work — not currently wired).
- ✅ Review the renderer pipeline before any new rehype/remark plugin is added.
  Specifically: never add `rehype-raw` without an explicit DOMPurify pass.

**Residual risk:** Low.

### T6 — Sensitive File Inclusion at Build Time (Information Disclosure)

**Description:** `scripts/build-docs.ts` reads files from `docs/`. If the
glob pattern is too broad (e.g., `**/*.md`), it could accidentally include
internal ADRs, threat models, or scratch files into the public JSON.

**Likelihood:** Low (the script uses an explicit allowlist of filenames).

**Impact:** Medium (could leak internal discussions).

**Mitigation:
- ✅ The build script uses an **explicit allowlist** of doc filename prefixes
  (`LABS-*`, `PLATFORM-VISION`, `ENTERPRISE-REVIEW`, etc.) rather than a
  wildcard glob. Files in `docs/adr/`, `docs/threat-models/`, `docs/plans/`,
  `docs/benchmarks/`, `docs/checklists/`, and `docs/screenshots/` are
  explicitly excluded.
- ✅ The script logs the list of included files at the end of the run, so
  the operator can audit what was bundled.

**Residual risk:** Very low.

### T7 — Body Scroll Lock Leak (Tampering — UX, not security)

**Description:** When the overlay closes via an unusual path (e.g., unmount
during animation), `document.body.style.overflow` may remain `"hidden"`,
freezing the page.

**Likelihood:** Medium (race conditions in framer-motion's AnimatePresence).

**Impact:** Low (UX bug, not a security issue).

**Mitigation:**
- ✅ The overlay's `useEffect` cleanup restores `document.body.style.overflow`
  to its original value on unmount.
- ✅ A `useEffect` with a 5-second safety timer double-checks and resets
  overflow if the overlay is closed but body is still locked.

**Residual risk:** Low.

### T8 — Open Redirect via Anchor Links (Spoofing)

**Description:** TOC anchor links use `#slug` hrefs. If the slug contained
`//evil.com`, a click could navigate away from the site.

**Likelihood:** Very Low (slugs are sanitized per T3).

**Impact:** Low (phishing risk if attacker controls external site).

**Mitigation:**
- ✅ Slug sanitization (T3) strips `/` and `:` characters.
- ✅ TOC clicks use `element.scrollIntoView()` rather than `window.location.hash`
  assignment, so no navigation occurs even with a malformed hash.

**Residual risk:** Negligible.

---

## 5. Build-Time vs. Runtime Parsing — Decision Matrix

| Approach | XSS surface | Bundle | First-doc render | Maintenance |
|----------|-------------|--------|-------------------|-------------|
| **Build-time JSON + runtime react-markdown** (chosen) | Low — no raw HTML | Lazy chunk, ~820 KB | <50 ms per doc (cached) | Add file + rerun script |
| Runtime `fs.readFileSync` in client component | Impossible (no fs in browser) | N/A | N/A | N/A |
| Runtime markdown fetching from API | Low — same renderer | Smaller JSON, fetched per-doc | Network-bound (~200 ms) | Needs API endpoint |
| Build-time HTML compilation (marked at build) | Medium — must sanitize at build | Larger (HTML > MD) | <10 ms (just innerHTML) | Lose React integration |

**Chosen:** Build-time JSON + runtime react-markdown. This gives us the safety
of runtime React rendering (no `dangerouslySetInnerHTML`) with the speed of
build-time pre-parsing (TOC is pre-computed).

---

## 6. Cumulative Risk

After applying the mitigations above:

| Threat | Initial risk | Residual risk |
|--------|--------------|---------------|
| T1 Markdown XSS | High | Low |
| T2 Search XSS | High | Very Low |
| T3 TOC XSS | Medium | Negligible |
| T4 Bundle bloat | Medium | Low |
| T5 Supply chain | Critical | Low |
| T6 Sensitive file leak | Medium | Very Low |
| T7 Scroll lock leak | Low | Low |
| T8 Open redirect | Low | Negligible |

**Overall residual risk:** Low. The documentation overlay does not introduce
any new attack surface beyond what already exists in the marketing site
(`react-markdown` is already a dependency).

---

## 7. Ongoing Controls

1. **Pre-merge check:** Any PR adding a new `.md` file under `docs/` must
   also update `scripts/build-docs.ts`'s category mapping if the filename
   doesn't match an existing prefix.
2. **Annual review:** Re-audit the renderer pipeline (react-markdown plugins)
   once per year to ensure no `rehype-raw` or similar has been added.
3. **Size monitoring:** If `docs-content.json` crosses 2 MB, split into
   per-doc chunks (see ADR §4.2).
4. **Dependency audit:** Run `bun audit` before each release.
