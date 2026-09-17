/**
 * Generate dist/roycss.manifest.json — the unified effect index (PF-042).
 *
 * ONE lean, machine-readable index for the whole 1,959-effect catalog,
 * aggregating per effect: id (entry key), name, category (group key),
 * maturity, quality score, a11y tier, css class name (classPrefix + key,
 * see below), preview type, and browser support. It is an INDEX, not a
 * payload: no cssCode, no descriptions, no tags — those already live in
 * dist/effects.json and dist/class-index.json. Target: < 300KB.
 *
 * Run:
 *   bun run gen:manifest                          (package.json alias)
 *   bun run scripts/generate-manifest.ts          (equivalent)
 *   bun run scripts/generate-manifest.ts --check  (drift gate: exits 1
 *                                                  if dist/roycss.manifest.json
 *                                                  is not byte-identical to a
 *                                                  fresh regeneration — same
 *                                                  pattern as the backend's
 *                                                  gen:openapi:check)
 *
 * The output is deterministic: no timestamps, no environment data,
 * category groups in categoryOrder, entries in catalog order — running
 * the generator twice is byte-stable, which is what makes --check sound.
 *
 * ─── Shape ─────────────────────────────────────────────────────────
 *
 *   {
 *     name, version (package.json), schema: 1, regenerate, classPrefix,
 *     maturity:    { stable|beta|experimental → one-line definition }
 *     a11yTiers:   { motion-safe|motion-caution → definition }
 *     browserTiers:{ tier → [chrome, firefox, safari] minimums }
 *     counts:      distributions (pinned by tests/unit/manifest.test.ts)
 *     effects: { <category>: { <effectId>: {
 *       name, maturity, quality (0–100), a11y, aria?, preview, browser
 *     } } }
 *
 * CSS class names: every effect's primary class is `roycss-<id>` — a
 * 100% regular mapping, verified per effect by the naming gate below
 * (rule 2) and re-verified by tests. The manifest therefore stores the
 * prefix ONCE (classPrefix) instead of repeating 7 bytes × 1,959
 * (~14KB); consumers build class names as `classPrefix + effectId`.
 * Entry keys are effect ids (the repo's canonical identifier — same key
 * convention as src/lib/effect-a11y.ts and dist/class-index.json rows).
 *
 * ─── Quality score ─────────────────────────────────────────────────
 *
 * Computed per effect by src/lib/effect-quality.ts →
 * computeEffectQualityScore (the module's effect half, activated by this
 * generator). Real signals only: a11y tags (src/lib/effect-a11y.ts),
 * description length (the catalog's per-effect documentation — there
 * are no per-effect doc pages), tag count, cssCode size, preview
 * presence, and two browser-support flags derived from the cssCode
 * (scroll-driven dependency, -webkit- fallback presence). Weights and
 * rationale are documented inside the module.
 *
 * ─── Maturity taxonomy (the mapping, from real signals only) ────────
 *
 *   experimental — ANY of:
 *     • limited-engine support: the cssCode uses scroll-driven
 *       animations (animation-timeline / scroll() / view()) —
 *       Chrome 115+/Safari 17.4+ and NO Firefox
 *       (docs/concepts/browser-support §scroll-driven);
 *     • quality < 60 (grade F — unpolished).
 *   stable — ALL of:
 *     • quality >= 80 (grade A or B — top-quartile polish);
 *     • a11y-clean: no requiresAria guidance (the cssCode does not
 *       hide real text, so the effect is safe to drop in without
 *       author-side ARIA decisions);
 *     • not experimental.
 *   beta — everything else (the default while an effect earns stable).
 *
 *   Category age was considered and deliberately NOT used: the founding
 *   order of categories IS derivable (batches 35–43 founded the 9
 *   newest categories: physics, liquid, morphing, retro, data-viz,
 *   immersive, advanced-text, status-state, audio), but any "old enough
 *   to be stable" batch cutoff would be an invented seasoning window —
 *   the catalog ships no per-effect release or usage telemetry that
 *   could justify one. The three signals above are the ones the repo
 *   can stand behind; the mapping lives here, documented, not hand-waved.
 *
 * ─── Browser support tiers ─────────────────────────────────────────
 *
 * Per-effect minimums derived from the features the cssCode actually
 * uses. The floor for every effect is the library's documented
 * dependency — prefers-reduced-motion support (Chrome 74 / Firefox 63 /
 * Safari 10.1, docs/concepts/browser-support §reduced-motion) — bumped
 * by each modern feature present:
 *
 *   base           [74, 63, 10.1]   timeless CSS only
 *   oklch          [111, 113, 15.4] oklch() colors
 *   color-mix      [111, 113, 16.2] color-mix()
 *   has            [105, 121, 15.4] :has()
 *   property       [85, 128, 16.4]  @property registered custom props
 *   container      [105, 110, 16]   container queries
 *   relative-color [119, 128, 16.4] relative color syntax (hsl(from …))
 *   light-dark     [123, 120, 17.5] light-dark()
 *   scroll-driven  [115, null, 17.4] scroll-driven animations (Firefox:
 *                                   not supported → null)
 *
 * The per-entry tier name is the "+"-joined list of features that each
 * raised at least one axis (e.g. "oklch+property"); features that raised
 * nothing are dropped (e.g. ":has()" under an oklch+property effect —
 * [105,121,15.4] is dominated by [111,128,16.4] — collapses to
 * "oklch+property"). The legend (browserTiers) maps every emitted tier
 * name to its [chrome, firefox, safari] triple; null means "not
 * supported in that engine".
 *
 * ─── Naming-convention gate (the ratchet) ───────────────────────────
 *
 * Validates every effect id / class / keyframe against the repo's
 * documented conventions (docs/concepts/class-naming — the /docs
 * route, there is no docs/concepts/*.md file — plus the tightened
 * rules already in scripts/validate-effects.ts):
 *
 *   1. id-kebab-case   — effect ids are lowercase kebab-case
 *                        (/^[a-z0-9]+(-[a-z0-9]+)*$/): no CamelCase,
 *                        no underscores, no leading/trailing/double
 *                        hyphens (docs anti-patterns list).
 *   2. primary-class   — the cssCode defines `.roycss-<id>`, the class
 *                        users apply (this is what makes the manifest's
 *                        classPrefix derivation safe).
 *   3. prefixed-compounds — every top-level rule selector compound that
 *                        contains class tokens contains at least one
 *                        roycss--prefixed class ("There are zero
 *                        unprefixed classes in the library"). Selectors
 *                        scoped under a roycss- class (descendants like
 *                        `.roycss-x .embers`, state compounds like
 *                        `.roycss-scroll-reveal-up.is-visible`) pass.
 *   4. class-kebab-case — every class token is kebab-case (no CamelCase,
 *                        no underscores).
 *   5. keyframes-prefix — every `@keyframes <name>` is `roy-`-prefixed
 *                        kebab-case (validate-effects rule 4, tightened
 *                        from substring-includes to a regex).
 *
 * The gate FAILS generation on any violation that is not in the
 * KNOWN_NAMING_VIOLATIONS baseline below, and also fails when a baseline
 * entry no longer matches exactly (count changed or effect fixed) —
 * update the baseline in lockstep when the catalog changes. This is a
 * ratchet: current violations are REPORTED, not fixed here (the catalog
 * is out of scope for this generator); new ones can never slip in.
 * Known violations are listed in the PR that introduced the gate.
 *
 * ─── Pipeline ──────────────────────────────────────────────────────
 *
 * Invoked at the end of scripts/build-package.ts (after
 * generate-build-artifacts.ts) — the same pipeline location as the
 * other dist generators. Unlike generate-build-artifacts.ts (whose
 * failure only warns), a manifest-gate failure aborts the build: the
 * naming gate is a policy gate, and shipping a manifest whose entries
 * violate the naming conventions is worse than failing the build.
 */

import { writeFileSync, readFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

import { effects } from "../src/lib/roycss-effects";
import { categoryOrder, type EffectCategory } from "../src/lib/roycss-types";
import { effectA11y, type EffectAriaReason } from "../src/lib/effect-a11y";
import { computeEffectQualityScore, scoreToGrade, type EffectGrade } from "../src/lib/effect-quality";

const ROOT = import.meta.dir.replace(/\/scripts$/, "");
const OUT_FILE = join(ROOT, "dist", "roycss.manifest.json");
const CHECK_MODE = process.argv.includes("--check");

/** Every RoyCSS class starts with this prefix (docs/concepts/class-naming §prefix). */
const CLASS_PREFIX = "roycss-";
/** Every @keyframes name starts with this prefix (scripts/validate-effects.ts rule 4). */
const KEYFRAMES_PREFIX = "roy-";

/* ─── Naming-convention rules (see header §gate) ────────────────── */

const KEBAB_CASE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const KEYFRAMES_NAME = new RegExp(`^${KEYFRAMES_PREFIX}[a-z0-9]+(-[a-z0-9]+)*$`);
const CLASS_TOKEN = /\.([a-zA-Z_][\w-]*)/g;

type NamingRule = "id-kebab-case" | "primary-class" | "prefixed-compounds" | "class-kebab-case" | "keyframes-prefix";

/**
 * Known naming violations (the ratchet baseline). Counts are per rule per
 * effect. Update in lockstep with the catalog — the gate fails when these
 * no longer match reality, in EITHER direction.
 *
 * ferrum-loader-heartbeat (batch 22) embeds a whole unprefixed `.btn-*`
 * demo suite (plus orphan declarations and camelCase keyframe REFERENCES
 * like `royTypingCursor`) after its legitimate rules — reported in the
 * gate's PR; fixing the catalog is deliberately out of scope here.
 */
const KNOWN_NAMING_VIOLATIONS: Record<string, Partial<Record<NamingRule, number>>> = {
  "ferrum-loader-heartbeat": { "prefixed-compounds": 127 },
};

/** Remove block comments so commented-out CSS cannot flip a rule. */
function stripCssComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

/**
 * CSS for FEATURE DETECTION: comments stripped and `@supports (…)`
 * condition texts removed (block bodies kept — a supported feature's
 * guarded rules are still the effect's real requirements). Without this,
 * feature-detection guards like `@supports not (animation-timeline:
 * --fake)` wrapping a no-op block (starting-style-drop-in) would
 * false-positive the scroll-driven tier. Genuine usage is unaffected:
 * scroll-driven effects declare `animation-timeline` in their unguarded
 * rules.
 */
function cssForFeatureDetection(css: string): string {
  return stripCssComments(css).replace(/@supports[^{]*\{/g, "{");
}

/**
 * Extract every rule selector from a cssCode, recursing into @media /
 * @supports blocks and skipping @keyframes bodies (keyframe steps are
 * not selectors). Chunks polluted by preceding orphan declarations (a
 * real catalog hazard — see ferrum-loader-heartbeat) are recovered by
 * taking the text after the last ";".
 */
function extractRuleSelectors(css: string): string[] {
  const src = stripCssComments(css);
  const selectors: string[] = [];
  let i = 0;
  const n = src.length;

  /** Consume one balanced {...} block without recording selectors. */
  function skipBlock(): void {
    let depth = 0;
    while (i < n) {
      const ch = src[i]!;
      if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) {
          i++;
          return;
        }
      }
      i++;
    }
  }

  /** Parse the sequence of rules inside one block level. */
  function parseRules(): void {
    while (i < n) {
      const start = i;
      while (i < n && src[i] !== "{" && src[i] !== "}") i++;
      const chunk = src.slice(start, i).trim();
      if (i >= n) return;
      if (src[i] === "}") {
        i++;
        return;
      }
      i++; // consumed '{'
      const selector = chunk.includes(";") ? chunk.slice(chunk.lastIndexOf(";") + 1).trim() : chunk;
      if (selector === "") {
        parseRules(); // malformed — still consume the block
        continue;
      }
      if (/^@keyframes\b/i.test(selector)) {
        skipBlock();
      } else if (selector.startsWith("@")) {
        parseRules(); // @media / @supports / @property — recurse
      } else {
        selectors.push(selector);
        parseRules(); // consume the declaration block
      }
    }
  }

  parseRules();
  return selectors;
}

/** Class tokens used in one selector compound. */
function classTokensOf(compound: string): string[] {
  return [...compound.matchAll(CLASS_TOKEN)].map((m) => m[1]!);
}

interface NamingViolations {
  /** effectId → rule → number of violations found. */
  found: Record<string, Partial<Record<NamingRule, number>>>;
  total: number;
}

/** Run the naming-convention gate over the whole catalog. */
function runNamingGate(): NamingViolations {
  const found: Record<string, Partial<Record<NamingRule, number>>> = {};
  let total = 0;

  const add = (effectId: string, rule: NamingRule, detail?: string): void => {
    const perEffect = (found[effectId] ??= {});
    perEffect[rule] = (perEffect[rule] ?? 0) + 1;
    total++;
    // Per-violation detail lines only for effects OUTSIDE the baseline —
    // known violations are summarized once below instead of spamming 127
    // lines into every build log.
    if (detail !== undefined && !(effectId in KNOWN_NAMING_VIOLATIONS)) {
      console.log(`    ✗ ${effectId} [${rule}] ${detail}`);
    }
  };

  for (const effect of effects) {
    const css = stripCssComments(effect.cssCode);

    // Rule 1 — id kebab-case.
    if (!KEBAB_CASE.test(effect.id)) add(effect.id, "id-kebab-case", `id "${effect.id}"`);

    // Rule 2 — primary class .roycss-<id> exists.
    if (!css.includes(`.${CLASS_PREFIX}${effect.id}`)) {
      add(effect.id, "primary-class", `cssCode defines no .${CLASS_PREFIX}${effect.id} rule`);
    }

    // Rules 3 + 4 — selector compounds + class token casing.
    for (const selector of extractRuleSelectors(effect.cssCode)) {
      for (const compound of selector.split(",")) {
        const classes = classTokensOf(compound.trim());
        if (classes.length === 0) continue; // element/universal/pseudo selectors
        if (!classes.some((c) => c.startsWith(CLASS_PREFIX))) {
          add(effect.id, "prefixed-compounds", `selector compound "${compound.trim()}" has no ${CLASS_PREFIX}* class`);
        }
      }
    }
    for (const m of css.matchAll(CLASS_TOKEN)) {
      if (!KEBAB_CASE.test(m[1]!)) add(effect.id, "class-kebab-case", `class token ".${m[1]}" is not kebab-case`);
    }

    // Rule 5 — @keyframes names are roy-<kebab>.
    for (const m of css.matchAll(/@keyframes\s+([\w-]+)/g)) {
      if (!KEYFRAMES_NAME.test(m[1]!)) add(effect.id, "keyframes-prefix", `@keyframes ${m[1]} is not ${KEYFRAMES_PREFIX}<kebab>`);
    }
  }

  return { found, total };
}

/**
 * Compare gate findings against the baseline ratchet.
 * Returns the list of gate failure messages (empty = pass).
 */
function diffAgainstBaseline(gate: NamingViolations): string[] {
  const failures: string[] = [];
  const knownIds = new Set(Object.keys(KNOWN_NAMING_VIOLATIONS));

  for (const [effectId, rules] of Object.entries(gate.found)) {
    const known = KNOWN_NAMING_VIOLATIONS[effectId];
    if (!known) {
      for (const [rule, count] of Object.entries(rules)) {
        failures.push(`NEW violation: ${effectId} [${rule}] ×${count} — fix the catalog or extend KNOWN_NAMING_VIOLATIONS.`);
      }
      continue;
    }
    for (const [rule, count] of Object.entries(rules)) {
      if ((known as Record<string, number>)[rule] !== count) {
        failures.push(
          `NEW violation: ${effectId} [${rule}] ×${count} (baseline records ×${(known as Record<string, number>)[rule] ?? 0}) — fix the catalog or update KNOWN_NAMING_VIOLATIONS.`,
        );
      }
    }
  }

  for (const effectId of knownIds) {
    if (!gate.found[effectId]) {
      failures.push(
        `STALE baseline: KNOWN_NAMING_VIOLATIONS records ${effectId} but the gate found no violations — remove the entry (ratchet tightens).`,
      );
      continue;
    }
    for (const rule of Object.keys(KNOWN_NAMING_VIOLATIONS[effectId]!)) {
      const actual = gate.found[effectId]![rule as NamingRule] ?? 0;
      const recorded = KNOWN_NAMING_VIOLATIONS[effectId]![rule as NamingRule] ?? 0;
      if (actual !== recorded) {
        failures.push(
          `STALE baseline: ${effectId} [${rule}] now ×${actual}, baseline records ×${recorded} — update KNOWN_NAMING_VIOLATIONS.`,
        );
      }
    }
  }

  return failures;
}

/* ─── Browser support tiers (see header §browser) ───────────────── */

interface BrowserFloor {
  chrome: number;
  firefox: number | null;
  safari: number | null;
}

/** Feature floors in canonical order (drives deterministic tier names). */
const BROWSER_FEATURES: Array<{ name: string; detect: RegExp; floor: BrowserFloor }> = [
  { name: "oklch", detect: /oklch\(/, floor: { chrome: 111, firefox: 113, safari: 15.4 } },
  { name: "color-mix", detect: /color-mix\(/, floor: { chrome: 111, firefox: 113, safari: 16.2 } },
  { name: "has", detect: /:has\(/, floor: { chrome: 105, firefox: 121, safari: 15.4 } },
  { name: "property", detect: /@property\b/, floor: { chrome: 85, firefox: 128, safari: 16.4 } },
  { name: "container", detect: /@container\b|container-type:/, floor: { chrome: 105, firefox: 110, safari: 16 } },
  {
    name: "relative-color",
    detect: /\b(?:hsl|rgb|oklch|lab|lch)\(\s*from\s/,
    floor: { chrome: 119, firefox: 128, safari: 16.4 },
  },
  { name: "light-dark", detect: /light-dark\(/, floor: { chrome: 123, firefox: 120, safari: 17.5 } },
  {
    name: "scroll-driven",
    detect: /animation-timeline\b|\bscroll\(|\bview\(/,
    floor: { chrome: 115, firefox: null, safari: 17.4 },
  },
];

/** The library's documented dependency floor: prefers-reduced-motion support. */
const BASE_FLOOR: BrowserFloor = { chrome: 74, firefox: 63, safari: 10.1 };

/** Derive the browser tier (name + floor) for one cssCode. */
function deriveBrowserTier(cssCode: string): { name: string; floor: BrowserFloor } {
  const css = cssForFeatureDetection(cssCode);
  const current: BrowserFloor = { ...BASE_FLOOR };
  const contributors: string[] = [];

  for (const feature of BROWSER_FEATURES) {
    if (!feature.detect.test(css)) continue;
    let raised = false;
    if (feature.floor.chrome > current.chrome) {
      current.chrome = feature.floor.chrome;
      raised = true;
    }
    if (feature.floor.firefox !== null) {
      if (current.firefox === null) {
        // already "unsupported" — stays null; not raised by this feature
      } else if (feature.floor.firefox > current.firefox) {
        current.firefox = feature.floor.firefox;
        raised = true;
      }
    } else if (current.firefox !== null) {
      current.firefox = null; // unsupported in Firefox — always a hard change
      raised = true;
    }
    if (feature.floor.safari !== null && current.safari !== null && feature.floor.safari > current.safari) {
      current.safari = feature.floor.safari;
      raised = true;
    }
    if (raised) contributors.push(feature.name);
  }

  return { name: contributors.length === 0 ? "base" : contributors.join("+"), floor: current };
}

/* ─── A11y tier + maturity (see header §maturity) ────────────────── */

type A11yTier = "motion-safe" | "motion-caution";
type Maturity = "stable" | "beta" | "experimental";

const A11Y_TIER_DESCRIPTIONS: Record<A11yTier, string> = {
  "motion-safe": "The effect's own cssCode ships a prefers-reduced-motion guard (docs/EFFECT-A11Y-TIERS.md §2).",
  "motion-caution":
    "No per-effect reduced-motion guard — covered by the global kill-switch in roycss.css; standalone copy-paste users may want their own guard.",
};

const MATURITY_DESCRIPTIONS: Record<Maturity, string> = {
  stable: "Quality >= 80 (grade A/B), a11y-clean (no aria guidance needed), universally supported. Safe defaults.",
  beta: "Solid but not yet stable: mid polish (quality 60–79) or needs author-side ARIA care. The default while earning stable.",
  experimental: "Limited-engine support (scroll-driven animations) or unpolished (quality < 60). Use with care.",
};

/** Map a quality score + real per-effect signals to the maturity tag. */
function deriveMaturity(quality: number, requiresAria: boolean, scrollDriven: boolean): Maturity {
  if (scrollDriven || quality < 60) return "experimental";
  if (quality >= 80 && !requiresAria) return "stable";
  return "beta";
}

/* ─── Manifest assembly ──────────────────────────────────────────── */

interface ManifestEntry {
  name: string;
  maturity: Maturity;
  quality: number;
  a11y: A11yTier;
  aria?: EffectAriaReason;
  preview: string;
  browser: string;
}

function buildManifest() {
  const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as { version: string };

  const grouped: Partial<Record<EffectCategory, Record<string, ManifestEntry>>> = {};
  const maturityCounts: Record<Maturity, number> = { stable: 0, beta: 0, experimental: 0 };
  const a11yCounts: Record<A11yTier, number> = { "motion-safe": 0, "motion-caution": 0 };
  let ariaRequired = 0;
  const gradeCounts: Record<EffectGrade, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  const browserTiers = new Map<string, BrowserFloor>();

  for (const effect of effects) {
    const a11y = effectA11y[effect.id];
    if (!a11y) {
      // The a11y drift gate (tests/unit/effect-a11y.test.ts) should have
      // caught this first — fail loudly rather than inventing tags.
      throw new Error(`effect-a11y.ts has no record for "${effect.id}" — run: bun run gen:a11y`);
    }

    const css = cssForFeatureDetection(effect.cssCode);
    const scrollDriven = /animation-timeline\b|\bscroll\(|\bview\(/.test(css);
    const webkitPrefixed = /-webkit-/.test(css);

    const quality = computeEffectQualityScore({
      descriptionLength: effect.description.length,
      tagCount: effect.tags.length,
      cssLength: effect.cssCode.length,
      hasPreview: true, // validated below — the catalog schema requires it
      motionSafe: a11y.motionSafe,
      requiresAria: a11y.requiresAria !== undefined,
      scrollDriven,
      webkitPrefixed,
    });
    const grade = scoreToGrade(quality);

    const browser = deriveBrowserTier(effect.cssCode);
    browserTiers.set(browser.name, browser.floor);

    const entry: ManifestEntry = {
      name: effect.name,
      maturity: deriveMaturity(quality, a11y.requiresAria !== undefined, scrollDriven),
      quality,
      a11y: a11y.motionSafe ? "motion-safe" : "motion-caution",
      preview: effect.previewType,
      browser: browser.name,
    };
    if (a11y.requiresAria) {
      entry.aria = a11y.requiresAria;
      ariaRequired++;
    }

    const bucket = (grouped[effect.category] ??= {});
    bucket[effect.id] = entry;

    maturityCounts[entry.maturity]++;
    a11yCounts[entry.a11y]++;
    gradeCounts[grade]++;
  }

  // hasPreview guard: the CSSEffect schema makes previewType required, but
  // the score treats a missing preview as degenerate — assert the reality
  // the manifest claims to score.
  const missingPreview = effects.filter(
    (e) => !["box", "text", "button", "loader", "card", "background"].includes(e.previewType),
  );
  if (missingPreview.length > 0) {
    throw new Error(
      `effects with invalid previewType (quality signal hasPreview): ${missingPreview.map((e) => e.id).slice(0, 5).join(", ")}`,
    );
  }

  const manifest = {
    name: "roycss",
    version: pkg.version,
    schema: 1,
    regenerate: "bun run gen:manifest",
    classPrefix: CLASS_PREFIX,
    maturity: MATURITY_DESCRIPTIONS,
    a11yTiers: A11Y_TIER_DESCRIPTIONS,
    browserTiers: Object.fromEntries([...browserTiers].map(([name, f]) => [name, [f.chrome, f.firefox, f.safari]])),
    counts: {
      effects: effects.length,
      categories: categoryOrder.filter((c) => grouped[c]).length,
      maturity: maturityCounts,
      a11y: { ...a11yCounts, "aria-required": ariaRequired },
      quality: gradeCounts,
    },
    effects: Object.fromEntries(categoryOrder.filter((c) => grouped[c]).map((c) => [c, grouped[c]])),
  };

  return { manifest, maturityCounts, a11yCounts, ariaRequired, gradeCounts };
}

/* ─── Main ───────────────────────────────────────────────────────── */

function main(): number {
  // 1. Naming-convention gate (fails generation on new/stale violations).
  console.log("Naming-convention gate (docs/concepts/class-naming)...");
  const gate = runNamingGate();
  const knownCount = Object.values(KNOWN_NAMING_VIOLATIONS).reduce(
    (sum, rules) => sum + Object.values(rules).reduce((a, b) => a + b, 0),
    0,
  );
  const gateFailures = diffAgainstBaseline(gate);
  console.log(
    `  violations found: ${gate.total} (baseline: ${knownCount}) across ${Object.keys(gate.found).length} effect(s)`,
  );
  if (gateFailures.length > 0) {
    for (const f of gateFailures) console.error(`  ❌ ${f}`);
    console.error("Generation aborted — the naming gate must pass (new violations or stale baseline).");
    return 1;
  }
  if (gate.total > 0) {
    console.log("  ⚠ known violations reported (catalog fixes are out of scope for the generator):");
    for (const [effectId, rules] of Object.entries(gate.found)) {
      console.log(`    ${effectId}: ${Object.entries(rules).map(([r, c]) => `${r} ×${c}`).join(", ")}`);
    }
  } else {
    console.log("  ✓ clean");
  }

  // 2. Build the manifest.
  const { manifest, maturityCounts, a11yCounts, ariaRequired, gradeCounts } = buildManifest();
  const json = JSON.stringify(manifest);
  const sizeKb = Buffer.byteLength(json, "utf8") / 1024;

  if (CHECK_MODE) {
    let current: string;
    try {
      current = readFileSync(OUT_FILE, "utf8");
    } catch {
      console.error(`✗ dist/roycss.manifest.json does not exist — run: bun run gen:manifest`);
      return 1;
    }
    if (current !== json) {
      console.error("✗ dist/roycss.manifest.json is out of sync with the catalog — run: bun run gen:manifest");
      return 1;
    }
    console.log(`✓ dist/roycss.manifest.json in sync (${sizeKb.toFixed(1)}KB, ${manifest.counts.effects} effects)`);
    return 0;
  }

  // 3. Emit (compact JSON — an index, not a payload; ~30 bytes/entry saved
  //    versus pretty-printing, which the <300KB budget cannot afford).
  mkdirSync(join(ROOT, "dist"), { recursive: true });
  writeFileSync(OUT_FILE, json, "utf8");

  console.log("");
  console.log(`Generated dist/roycss.manifest.json (${manifest.counts.effects} effects, ${sizeKb.toFixed(1)}KB)`);
  console.log(`  maturity:      ${maturityCounts.stable} stable · ${maturityCounts.beta} beta · ${maturityCounts.experimental} experimental`);
  console.log(`  quality:      A ${gradeCounts.A} · B ${gradeCounts.B} · C ${gradeCounts.C} · D ${gradeCounts.D} · F ${gradeCounts.F}`);
  console.log(`  a11y:         ${a11yCounts["motion-safe"]} motion-safe · ${a11yCounts["motion-caution"]} motion-caution · ${ariaRequired} aria-required`);
  console.log(`  browser tiers: ${Object.keys(manifest.browserTiers).join(", ")}`);
  return 0;
}

process.exit(main());
