/**
 * Generate AI-conformance artifacts (issue #124 / PF-021 content half).
 *
 * Emits four artifacts into dist/, ALL derived from the live effect catalog
 * (src/lib/roycss-effects) and the real package.json surfaces — zero
 * hand-maintained class names, counts, or import paths:
 *
 *   1. dist/roycss.rules.md           — llms.txt-style rules file for AI
 *                                        assistants: what RoyCSS is, the real
 *                                        class naming convention, the real
 *                                        import surfaces, ground-truth counts,
 *                                        correct/incorrect usage examples
 *                                        (3 canonical effects, picked
 *                                        programmatically), constraint rules
 *                                        (never invent r-* classes, …).
 *   2. dist/roycss.system-prompt.md   — paste-ready system prompt for coding
 *                                        assistants: the rules content plus
 *                                        structured usage guidance (query the
 *                                        MCP server, use the CLI, read the
 *                                        manifest — the repo's REAL surfaces).
 *   3. dist/roycss.grammar.json       — machine-readable grammar: class-name
 *                                        pattern(s), category enumeration,
 *                                        modifiers (none), outliers — computed
 *                                        from the actual catalog.
 *   4. dist/roycss.training-pairs.jsonl — instruction→output pairs composed
 *                                        from templates over REAL effect
 *                                        names/categories/descriptions, plus
 *                                        anti-pairs for the documented failure
 *                                        modes (r-* prefix fiction, phantom
 *                                        import path, phantom CDN host, wrong
 *                                        case, modifier suffixes, typos).
 *
 * Determinism: no timestamps, no randomness — two runs on the same catalog
 * produce byte-identical output (required for --check).
 *
 * Self-validation (fails the run, not the consumer):
 *   - every `roycss-*` class token referenced in every artifact must exist in
 *     the catalog (the docs-class-api.test.ts approach: case-mismatch teaching
 *     tokens are invisible to extraction; declared counter-examples — the
 *     grammar's `counterExamples` and each anti-pair's `negativeExample` —
 *     are the only exemptions, one declared fiction per mention);
 *   - the class-name pattern must round-trip against ALL real class names;
 *   - every comma-grouped count stated in any artifact must equal a computed
 *     catalog truth.
 *
 * Usage:
 *   bun run scripts/generate-ai-artifacts.ts           # (re)generate
 *   bun run scripts/generate-ai-artifacts.ts --check   # CI drift gate —
 *   bun run gen:ai   /   bun run ai:check              # exit 1 when the
 *                                                       # committed files are
 *                                                       # stale
 *
 * Drift is additionally guarded by tests/unit/ai-artifacts.test.ts, which
 * re-derives the ground truth from the live catalog and cross-checks the
 * committed artifacts (zero phantom classes, truthful counts, grammar
 * round-trip, pair-count floor of 200).
 *
 * Wired into the dist generation pipeline at the end of
 * scripts/build-package.ts (next to generate-build-artifacts.ts).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { effects } from "../src/lib/roycss-effects";
import { categoryMeta, categoryOrder } from "../src/lib/roycss-types";
import type { CSSEffect, EffectCategory } from "../src/lib/roycss-types";

const CHECK_MODE = process.argv.includes("--check");

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const DIST_DIR = join(ROOT, "dist");

const ARTIFACT_FILES = [
  "roycss.rules.md",
  "roycss.system-prompt.md",
  "roycss.grammar.json",
  "roycss.training-pairs.jsonl",
] as const;

// ─── package.json surfaces (the REAL import paths) ─────────────────────────

interface PkgJson {
  version: string;
  description: string;
  exports: Record<string, string | Record<string, string>>;
}
const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as PkgJson;

/** Real subpath exports, rendered for the rules file. Subpaths only — rendered file paths would leak non-class `roycss-*` tokens. */
const EXPORT_SUBPATHS: Array<[subpath: string, use: string]> = [
  ["roycss", "typed catalog as a JS module (dist/effects.js)"],
  ["roycss/css", "the full stylesheet — every effect class (readable build)"],
  ["roycss/css/min", "the minified stylesheet — same rules, smaller payload"],
  ["roycss/effects.json", "full catalog data: id, name, category, description, tags, cssCode"],
  ["roycss/class-index", "every class name with category, effectId, and properties"],
  ["roycss/motion-library", "the motion-related subset of the catalog"],
  ["roycss/critical.css", "curated critical-effects subset for above-the-fold styles"],
  ["roycss/fallbacks", "optional progressive-enhancement layer for older browsers"],
];
function exportKeyFor(subpath: string): string {
  // "roycss/css" → "./css", "roycss/effects.json" → "./effects.json", "roycss" → "."
  return subpath === "roycss" ? "." : subpath.replace(/^roycss/, ".");
}
for (const [sub] of EXPORT_SUBPATHS) {
  if (!(exportKeyFor(sub) in pkg.exports)) {
    throw new Error(`package.json exports does not contain the ${sub} surface — fix EXPORT_SUBPATHS`);
  }
}

// ─── catalog facts (all computed — the single source of truth) ──────────────

/** All `roycss-*` class selectors defined by an effect's own CSS. */
function classesOf(effect: CSSEffect): string[] {
  return Array.from((effect.cssCode ?? "").matchAll(/\.((?:roycss-)[a-zA-Z0-9-]+)/g), (m) => m[1]!);
}

/** The class you put on the element: `roycss-<id>` when present (all but one effect), else the first declared class. */
function primaryClassOf(effect: CSSEffect): string {
  const classes = classesOf(effect);
  return classes.includes(`roycss-${effect.id}`) ? `roycss-${effect.id}` : classes[0]!;
}

/** Emitted by scripts/build-package.ts BASE_CSS into dist/roycss.css — the only class outside the catalog's cssCode. */
const BASE_UTILITY_CLASSES: readonly string[] = ["roycss-sr-only"];

const primaryClasses = new Set<string>();
const allClasses = new Set<string>(BASE_UTILITY_CLASSES);
const idToClassOutliers: Array<{ effectId: string; className: string }> = [];

for (const e of effects) {
  const primary = primaryClassOf(e);
  primaryClasses.add(primary);
  if (primary !== `roycss-${e.id}`) {
    idToClassOutliers.push({ effectId: e.id, className: primary });
  }
  for (const c of classesOf(e)) allClasses.add(c);
}

const auxiliaryClasses = [...allClasses]
  .filter((c) => !primaryClasses.has(c) && !BASE_UTILITY_CLASSES.includes(c))
  .sort();

const categoryCounts = new Map<EffectCategory, number>();
for (const cat of categoryOrder) categoryCounts.set(cat, 0);
for (const e of effects) {
  const n = categoryCounts.get(e.category);
  if (n === undefined) throw new Error(`effect ${e.id} has unknown category ${e.category}`);
  categoryCounts.set(e.category, n + 1);
}

const modifierClassCount = [...allClasses].filter((c) => c.includes("--")).length;
const digitLeadingIds = effects.filter((e) => /^[0-9]/.test(e.id)).map((e) => e.id);
const namingFamilies = {
  ferrum: effects.filter((e) => e.id.startsWith("ferrum-")).length,
  vfx: effects.filter((e) => e.id.startsWith("vfx-")).length,
  batchSuffix: effects.filter((e) => /-b\d+$/.test(e.id)).length,
};

/** Top id-stem prefixes per category — proves "category-led stems are common" with real numbers. */
function topStems(cat: EffectCategory, n: number): string[] {
  const freq = new Map<string, number>();
  for (const e of effects) {
    if (e.category !== cat) continue;
    const stem = e.id.split("-")[0]!;
    freq.set(stem, (freq.get(stem) ?? 0) + 1);
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, n)
    .map(([stem, count]) => `${stem}- (${count})`);
}

/** The 3 canonical example effects, picked programmatically: shortest id in each of these categories, catalog order as tie-break. */
const CANONICAL_CATEGORIES: EffectCategory[] = ["buttons", "text", "loaders"];
function canonicalPick(cat: EffectCategory): CSSEffect {
  const inCat = effects.filter((e) => e.category === cat);
  if (inCat.length === 0) throw new Error(`canonical pick: category ${cat} has no effects`);
  return inCat.reduce((best, e) => (e.id.length < best.id.length ? e : best));
}
const canonicalEffects = CANONICAL_CATEGORIES.map(canonicalPick);

/** 1959 → "1,959" (deterministic — no locale dependence). */
function fmt(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

const TOTAL_EFFECTS = effects.length;
const TOTAL_CATEGORIES = categoryOrder.length;
const TOTAL_CLASSES = allClasses.size;

// ─── the real class-name grammar, validated by round-trip ───────────────────

const CLASS_PATTERN = "^roycss-[a-z0-9]+(?:-[a-z0-9]+)*$";
const classPatternRe = new RegExp(CLASS_PATTERN);
for (const c of allClasses) {
  if (!classPatternRe.test(c)) {
    throw new Error(`grammar round-trip failure: real class "${c}" does not match ${CLASS_PATTERN}`);
  }
}

// ─── minimal HTML derivation (driven by the effect's own preview metadata) ─

function wrapperTag(e: CSSEffect): "button" | "h2" | "div" | "section" {
  switch (e.previewType) {
    case "button":
      return "button";
    case "text":
      return "h2";
    case "background":
      return "section";
    default:
      return "div";
  }
}

function minimalHtml(e: CSSEffect): string {
  const cls = primaryClassOf(e);
  const children = e.childCount ? "<span></span>".repeat(e.childCount) : "";
  switch (e.previewType) {
    case "button":
      return `<button class="${cls}">${e.previewText ?? "Hover me"}</button>`;
    case "text":
      return `<h2 class="${cls}">${e.previewText ?? "RoyCSS"}</h2>`;
    case "loader":
      return `<div class="${cls}" role="status" aria-label="Loading">${children}</div>`;
    case "card":
      return `<div class="${cls}">${e.previewText ?? "Card content"}</div>`;
    case "background":
      return `<section class="${cls}"></section>`;
    case "box":
      return `<div class="${cls}">${e.previewText ?? ""}</div>`;
  }
}

function nounFor(e: CSSEffect): string {
  switch (e.previewType) {
    case "button":
      return "button";
    case "text":
      return "headline";
    case "loader":
      return "loading indicator";
    case "card":
      return "card";
    case "background":
      return "hero section";
    case "box":
      return "div";
  }
}

// ─── training pairs (deterministic templates over REAL catalog entries) ─────

interface TrainingPair {
  id: string;
  kind: "positive" | "anti";
  template: string;
  /** Present when the pair is anchored to one real effect. */
  effectId?: string;
  /** Anti-pairs only: the known failure mode being corrected. */
  failureMode?: string;
  /** Anti-pairs only: the exact fiction token the instruction shows (exempted from class validation). */
  negativeExample?: string;
  instruction: string;
  output: string;
  /** Every real class the output teaches. */
  validClasses: string[];
}

const pairs: TrainingPair[] = [];
function addPair(p: TrainingPair): void {
  pairs.push(p);
}

/** Deterministic sampling: every `stride`-th effect, starting at `offset`. */
function strideSample<T>(list: readonly T[], stride: number, offset: number): T[] {
  return list.filter((_, i) => (i + offset) % stride === 0);
}

const IMPORT_BLOCK =
  'Import the stylesheet once, app-wide:\n\n```css\n@import "roycss/css/min";\n```\n(or `import "roycss/css/min";` from JS — same rules)';

// 1. add-effect — per-effect pairs over a stride sample of the catalog.
for (const e of strideSample(effects, 9, 0)) {
  const cls = primaryClassOf(e);
  addPair({
    id: `add-${String(pairs.length + 1).padStart(4, "0")}`,
    kind: "positive",
    template: "add-effect",
    effectId: e.id,
    instruction: `Add a ${e.name} effect to my ${nounFor(e)} using RoyCSS.`,
    output: `Use the \`${cls}\` class — the ${e.name} effect (${categoryMeta[e.category].label} category):\n\n\`\`\`html\n${minimalHtml(e)}\n\`\`\`\n\n${IMPORT_BLOCK}`,
    validClasses: [cls],
  });
}

// 2. category-pick — one canonical pick per category (shortest id, catalog-order tie-break).
const CATEGORY_CONTEXT: Record<EffectCategory, string> = {
  animations: "an entrance moment",
  hover: "interactive cards",
  text: "a hero headline",
  backgrounds: "a hero section",
  loaders: "a data fetch",
  "3d-transforms": "a product showcase",
  buttons: "a primary CTA",
  cards: "a feature grid",
  borders: "a callout panel",
  filters: "an image gallery",
  forms: "a login form",
  navigation: "a top navigation",
  scroll: "a long landing page",
  cursor: "an immersive page",
  "page-transitions": "route changes",
  "glass-ui": "a dashboard",
  particles: "an ambient hero",
  microinteractions: "a like button",
  visual: "a premium hero",
  physics: "a playful landing page",
  liquid: "a creative landing page",
  morphing: "an icon toggle",
  "status-state": "a settings page",
  audio: "a music section",
  retro: "an arcade-themed page",
  "data-viz": "a dashboard",
  immersive: "a fullscreen experience",
  "advanced-text": "a cinematic hero",
  misc: "a unique flourish",
};
for (const cat of categoryOrder) {
  const context = CATEGORY_CONTEXT[cat];
  if (!context) throw new Error(`CATEGORY_CONTEXT is missing category ${cat} — add a context string`);
  const pick = canonicalPick(cat);
  const cls = primaryClassOf(pick);
  const count = categoryCounts.get(cat)!;
  addPair({
    id: `cat-${cat}`,
    kind: "positive",
    template: "category-pick",
    effectId: pick.id,
    instruction: `Suggest one good ${categoryMeta[cat].label} effect for ${context}.`,
    output: `Use \`${cls}\` (${pick.name}) — one of ${fmt(count)} ${categoryMeta[cat].label} effects:\n\n\`\`\`html\n${minimalHtml(pick)}\n\`\`\`\n\nWhat it does: ${pick.description}\n\nBrowse every category with counts: \`npx roycss categories\`.`,
    validClasses: [cls],
  });
}

// 3. intent-by-tag — natural-language intents resolved to the first real effect carrying the tag.
const INTENTS: Array<{ query: string; tag: string }> = [
  { query: "Make my button glow", tag: "glow" },
  { query: "I need something that draws attention to a CTA", tag: "attention" },
  { query: "Give my hero text a neon look", tag: "neon" },
  { query: "Add a spinner for my loading state", tag: "spinner" },
  { query: "Show a skeleton while content loads", tag: "skeleton" },
  { query: "Make the card feel like glass", tag: "glass" },
  { query: "Add confetti when the user succeeds", tag: "confetti" },
  { query: "A typewriter effect for my headline", tag: "typewriter" },
  { query: "A glitch effect for error emphasis", tag: "glitch" },
  { query: "A gradient background for my hero", tag: "gradient" },
  { query: "Shake the input on validation error", tag: "shake" },
  { query: "Float the card gently", tag: "float" },
  { query: "An aurora background for a landing page", tag: "aurora" },
  { query: "Particles in the page background", tag: "particles" },
  { query: "A ripple when the button is clicked", tag: "ripple" },
  { query: "A wave animation under the text", tag: "wave" },
  { query: "A magnetic hover on a button", tag: "magnetic" },
  { query: "A spotlight that follows the cursor", tag: "spotlight" },
  { query: "An underline animation on links", tag: "underline" },
  { query: "A shine sweep across the button", tag: "sweep" },
  { query: "A jelly wobble on hover", tag: "jelly" },
  { query: "A spring entrance for cards", tag: "spring" },
  { query: "Reveal elements as the user scrolls", tag: "reveal" },
  { query: "Parallax depth in the hero", tag: "parallax" },
  { query: "A 3D tilt on hover", tag: "tilt" },
  { query: "A holographic card surface", tag: "holographic" },
  { query: "A CRT retro screen vibe", tag: "crt" },
  { query: "A metallic text treatment", tag: "metallic" },
  { query: "An elastic bounce entrance", tag: "elastic" },
  { query: "A retro synthwave aesthetic", tag: "retro" },
];
for (const { query, tag } of INTENTS) {
  const matches = effects.filter((e) => e.tags.includes(tag));
  if (matches.length === 0) {
    throw new Error(`INTENTS references tag "${tag}" which no catalog effect carries — fix INTENTS`);
  }
  const pick = matches[0]!;
  const cls = primaryClassOf(pick);
  addPair({
    id: `intent-${tag}`,
    kind: "positive",
    template: "intent-by-tag",
    effectId: pick.id,
    instruction: `${query} — what RoyCSS class should I use?`,
    output: `Use \`${cls}\` (${pick.name}, ${categoryMeta[pick.category].label} category):\n\n\`\`\`html\n${minimalHtml(pick)}\n\`\`\`\n\n${matches.length} effect${matches.length === 1 ? "" : "s"} in the catalog carry the "${tag}" tag. See them all: \`npx roycss search ${tag}\`.`,
    validClasses: [cls],
  });
}

// 4. verify-class — "is this a real class?" answered with real metadata.
for (const e of strideSample(effects, 65, 3)) {
  const cls = primaryClassOf(e);
  addPair({
    id: `verify-${e.id}`,
    kind: "positive",
    template: "verify-class",
    effectId: e.id,
    instruction: `Is ${cls} a real RoyCSS class?`,
    output: `Yes. \`${cls}\` is the ${e.name} effect (${categoryMeta[e.category].label} category, ${fmt(categoryCounts.get(e.category)!)} effects there). ${e.description}\n\nFastest terminal check: \`npx roycss info ${e.id}\`.`,
    validClasses: [cls],
  });
}

// 5. import-howto — the real import/install/CLI surfaces.
const IMPORT_HOWTO: Array<{ instruction: string; output: string }> = [
  {
    instruction: "How do I import RoyCSS into my app?",
    output: 'Import the global stylesheet once, app-wide:\n\n```js\nimport "roycss/css";      // readable build\nimport "roycss/css/min";  // minified — same rules\n```\n\nOr from CSS:\n\n```css\n@import "roycss/css/min";\n```',
  },
  {
    instruction: "How do I install RoyCSS?",
    output: "```bash\nnpm install roycss     # or: pnpm add roycss / yarn add roycss / bun add roycss\n```\n\nThen import the stylesheet:\n\n```css\n@import \"roycss/css/min\";\n```",
  },
  {
    instruction: "How do I load RoyCSS from a CDN without a build step?",
    output: '```html\n<link rel="stylesheet" href="https://unpkg.com/roycss@2/dist/roycss.min.css" crossorigin />\n```\n\n`@2` is a major pin (auto patch/minor updates); pin the exact version for full reproducibility (`https://unpkg.com/roycss@2.0.0/dist/roycss.min.css`).',
  },
  {
    instruction: "Where do I get the full RoyCSS catalog as JSON for my tooling?",
    output: 'Read the `roycss/effects.json` export from the installed package:\n\n```js\nimport catalog from "roycss/effects.json"; // array of { id, name, category, description, tags, previewType, … }\n```\n\nThe MCP server and the CLI read this same data — it is the catalog ground truth.',
  },
  {
    instruction: "How do I get a list of every RoyCSS class name?",
    output: 'Read the `roycss/class-index` export: an array of `{ className, category, effectId, properties }` rows — one per class selector in the stylesheet. Pair it with `roycss/effects.json` when you need names and descriptions too.',
  },
  {
    instruction: `How do I ship only a few RoyCSS effects instead of all ${fmt(TOTAL_EFFECTS)}?`,
    output: "The package is one stylesheet by design — subset it with the CLI instead of inventing per-effect imports:\n\n```bash\nnpx roycss export btn-glow hover-push-up text-gradient --out src/styles/roycss.css\n\n# Or a whole category\nnpx roycss export --category buttons --out src/styles/roycss.css\n```",
  },
  {
    instruction: "What is the difference between roycss/css and roycss/css/min?",
    output: "Same rules, different formatting. `roycss/css` is the readable build (comments, formatted); `roycss/css/min` is the minified twin. Use the minified one in production.",
  },
  {
    instruction: "How do I check whether a RoyCSS class exists from the terminal?",
    output: "```bash\nnpx roycss info <effect-id>   # fuzzy-matches typos and suggests real effects\nnpx roycss doctor             # scans your whole project for unknown classes\n```",
  },
  {
    instruction: "How do I search RoyCSS effects from the terminal?",
    output: '```bash\nnpx roycss search "neon"      # keyword search over names/descriptions/tags\nnpx roycss categories         # all categories with effect counts\n```',
  },
  {
    instruction: "What data files does the roycss package export?",
    output: "Three data subpaths plus two auxiliary stylesheets:\n\n- `roycss/effects.json` — the full catalog (id, name, category, description, tags, cssCode)\n- `roycss/class-index` — every class name with its effect and properties\n- `roycss/motion-library` — the motion-related catalog subset\n- `roycss/critical.css` — a curated above-the-fold subset\n- `roycss/fallbacks` — an optional progressive-enhancement layer for older browsers",
  },
];
for (const q of IMPORT_HOWTO) {
  addPair({
    id: `howto-${String(pairs.length + 1).padStart(4, "0")}`,
    kind: "positive",
    template: "import-howto",
    instruction: q.instruction,
    output: q.output,
    validClasses: [],
  });
}

// 6. anti-r-prefix — the documented r-* fiction (audit F-01/F-02).
for (const e of strideSample(effects, 65, 1)) {
  const cls = primaryClassOf(e);
  const neg = `r-${e.id}`;
  addPair({
    id: `anti-r-${e.id}`,
    kind: "anti",
    template: "anti-r-prefix",
    failureMode: "r-prefix-fiction",
    effectId: e.id,
    instruction: `Add the ${neg} class to my ${nounFor(e)}.`,
    output: `\`${neg}\` does not exist. RoyCSS has no \`r-*\` short forms — every class is fully prefixed with \`roycss-\`. The real class for the ${e.name} effect is \`${cls}\`:\n\n\`\`\`html\n${minimalHtml(e)}\n\`\`\``,
    negativeExample: neg,
    validClasses: [cls],
  });
}

// 7. anti-wrong-import — the phantom `roycss/effects.css` export path.
const ANTI_IMPORT: Array<{ instruction: string; output: string }> = [
  {
    instruction: 'I added `@import "roycss/effects.css";` to my stylesheet but the styles don\u2019t load — what\u2019s wrong?',
    output: "`roycss/effects.css` is not a real export — that path has never existed in the package (it comes from an old docs-drift era). The stylesheet subpaths are `roycss/css` (full) and `roycss/css/min` (minified):\n\n```css\n@import \"roycss/css/min\";\n```",
  },
  {
    instruction: 'Why does `import "roycss/effects.css";` fail to resolve in my bundler?',
    output: "Because the package does not export `roycss/effects.css`. There is one global stylesheet by design. Import the real one:\n\n```js\nimport \"roycss/css/min\";\n```\n\n(`roycss/effects.json` exists — but it is catalog data for tooling, not a stylesheet.)",
  },
  {
    instruction: "Which CSS file do I import for the effect classes — roycss/effects.css?",
    output: "No — `roycss/effects.css` does not exist. The real stylesheet imports are `roycss/css` (readable) and `roycss/css/min` (minified). There is no per-category or per-effect CSS import: the package is one stylesheet on purpose.",
  },
  {
    instruction: 'My build fails on `cannot resolve "roycss/effects.css"`. Is my install broken?',
    output: "Your install is fine — the import path is wrong. `roycss/effects.css` has never been an export of the roycss package. Use:\n\n```css\n@import \"roycss/css/min\";\n```\n\nand the build will resolve.",
  },
  {
    instruction: "I copied `@import \"roycss/effects.css\"` from a blog post and nothing happens.",
    output: "That path is a phantom — it appears in old third-party write-ups but was never in the package's export map. The real stylesheet subpaths are `roycss/css` and `roycss/css/min`:\n\n```css\n@import \"roycss/css/min\";\n```",
  },
  {
    instruction: "Does roycss ship separate CSS files per category, like roycss/effects.css?",
    output: "No. The roycss package is deliberately ONE global stylesheet (`roycss/css` / `roycss/css/min`) — a single source of truth, no drift between files. When you need a subset, generate it with the CLI: `npx roycss export <effect-ids> --out <file>`.",
  },
];
for (const q of ANTI_IMPORT) {
  addPair({
    id: `anti-import-${String(pairs.length + 1).padStart(4, "0")}`,
    kind: "anti",
    template: "anti-wrong-import",
    failureMode: "wrong-import-path",
    instruction: q.instruction,
    output: q.output,
    negativeExample: "roycss/effects.css",
    validClasses: [],
  });
}

// 8. anti-cdn — the phantom cdn.roycss.org host.
const CDN_REAL = "https://unpkg.com/roycss@2/dist/roycss.min.css";
const ANTI_CDN: Array<{ instruction: string; output: string }> = [
  {
    instruction: "Should I load RoyCSS from https://cdn.roycss.org/roycss.css?",
    output: `No — \`cdn.roycss.org\` is not a real RoyCSS host (it appears in old copied snippets and silently 404s). Use a public CDN that actually mirrors npm:\n\n\`\`\`html\n<link rel="stylesheet" href="${CDN_REAL}" crossorigin />\n\`\`\``,
  },
  {
    instruction: 'My `<link href="https://cdn.roycss.org/roycss.min.css">` returns 404. Why?',
    output: `Because \`cdn.roycss.org\` does not exist — there is no official RoyCSS CDN host. Load the same file from unpkg instead:\n\n\`\`\`html\n<link rel="stylesheet" href="${CDN_REAL}" crossorigin />\n\`\`\``,
  },
  {
    instruction: "Is there an official RoyCSS CDN at cdn.roycss.org?",
    output: `No. The CDN examples in the official docs use unpkg:\n\n\`\`\`html\n<link rel="stylesheet" href="${CDN_REAL}" crossorigin />\n\`\`\`\n\nPin the exact version (\`https://unpkg.com/roycss@${pkg.version}/dist/roycss.min.css\`) for full reproducibility.`,
  },
  {
    instruction: "Which CDN hosts roycss — I keep seeing cdn.roycss.org in old tutorials?",
    output: `cdn.roycss.org is a phantom host from copied snippets — it has never served the package. Use unpkg (jsDelivr works too, same npm tarball):\n\n\`\`\`html\n<link rel="stylesheet" href="${CDN_REAL}" crossorigin />\n\`\`\``,
  },
  {
    instruction: "Fix this: a script tag loads RoyCSS from cdn.roycss.org before my app boots.",
    output: `Two problems: RoyCSS is a stylesheet, not a script — and \`cdn.roycss.org\` is not a real host. Replace with a stylesheet link from unpkg:\n\n\`\`\`html\n<link rel="stylesheet" href="${CDN_REAL}" crossorigin />\n\`\`\``,
  },
  {
    instruction: "Is https://cdn.roycss.org/roycss.css down right now?",
    output: `It was never up — \`cdn.roycss.org\` is a phantom host, not an outage. The working CDN URL is:\n\n\`\`\`html\n<link rel="stylesheet" href="${CDN_REAL}" crossorigin />\n\`\`\``,
  },
];
for (const q of ANTI_CDN) {
  addPair({
    id: `anti-cdn-${String(pairs.length + 1).padStart(4, "0")}`,
    kind: "anti",
    template: "anti-cdn",
    failureMode: "phantom-cdn-host",
    instruction: q.instruction,
    output: q.output,
    negativeExample: "cdn.roycss.org",
    validClasses: [],
  });
}

// 9. anti-case — case-variant fiction.
function misCased(e: CSSEffect): string {
  return `roycss-${e.id.split("-").map((seg) => seg.charAt(0).toUpperCase() + seg.slice(1)).join("-")}`;
}
for (const e of strideSample(effects, 244, 5)) {
  const cls = primaryClassOf(e);
  const neg = misCased(e);
  addPair({
    id: `anti-case-${e.id}`,
    kind: "anti",
    template: "anti-case",
    failureMode: "wrong-case",
    effectId: e.id,
    instruction: `Why doesn't \`${neg}\` style anything?`,
    output: `Class names are case-sensitive and RoyCSS ships only lowercase kebab-case ids — \`${neg}\` matches nothing. The real class is \`${cls}\`:\n\n\`\`\`html\n${minimalHtml(e)}\n\`\`\``,
    negativeExample: neg,
    validClasses: [cls],
  });
}

// 10. anti-modifier — the `--modifier` suffix fiction.
for (const e of strideSample(effects, 244, 7)) {
  const cls = primaryClassOf(e);
  const neg = `${cls}--lg`;
  addPair({
    id: `anti-mod-${e.id}`,
    kind: "anti",
    template: "anti-modifier",
    failureMode: "modifier-suffix-fiction",
    effectId: e.id,
    instruction: `Can I size the effect with \`${neg}\` for a larger variant?`,
    output: `No — RoyCSS has no modifier suffixes: zero classes in the shipped stylesheet contain \`--\`, so \`${neg}\` does not exist. Use \`${cls}\` as-is; customize by copying the effect's CSS (every class is self-contained) or by overriding the custom properties the effect defines.`,
    negativeExample: neg,
    validClasses: [cls],
  });
}

// 11. anti-typo — close-but-wrong ids.
function typoOf(id: string): string {
  return id.length > 4 ? id.slice(0, -1) : `${id.slice(0, -2)}${id.slice(-1)}${id.slice(-2, -1)}`;
}
const catalogIds = new Set(effects.map((e) => e.id));
for (const e of strideSample(effects, 244, 9)) {
  const cls = primaryClassOf(e);
  const negId = typoOf(e.id);
  if (catalogIds.has(negId)) {
    throw new Error(`anti-typo pair for ${e.id}: the typo "${negId}" is itself a real catalog id — adjust typoOf`);
  }
  addPair({
    id: `anti-typo-${e.id}`,
    kind: "anti",
    template: "anti-typo",
    failureMode: "typo-id",
    effectId: e.id,
    instruction: `npx roycss info says "${negId}" is not found — did I misspell it?`,
    output: `Yes — "${negId}" is not in the catalog. The real effect id is \`${e.id}\` (${e.name}, class \`${cls}\`). \`npx roycss info ${e.id}\` confirms it; \`npx roycss doctor\` scans your whole project for such typos.`,
    negativeExample: negId,
    validClasses: [cls],
  });
}

if (pairs.length < 200) {
  throw new Error(`training-pairs floor not met: composed ${pairs.length} pairs (need >= 200)`);
}

const trainingPairsJsonl = pairs.map((p) => JSON.stringify(p)).join("\n") + "\n";

// ─── artifact 1 + 2: the rules file and the system prompt ───────────────────

const outlierSentence =
  idToClassOutliers.length === 0
    ? "For every effect in the catalog, the class is exactly `roycss-` + the effect id."
    : idToClassOutliers.length === 1
      ? `For every effect except one, the class is exactly \`roycss-\` + the effect id. The single documented outlier: the effect \`${idToClassOutliers[0]!.effectId}\` ships the class \`${idToClassOutliers[0]!.className}\`.`
      : `For ${fmt(TOTAL_EFFECTS - idToClassOutliers.length)} of ${fmt(TOTAL_EFFECTS)} effects the class is exactly \`roycss-\` + the effect id. Documented outliers: ${idToClassOutliers.map((o) => `\`${o.effectId}\` → \`${o.className}\``).join(", ")}.`;

const canonicalSections = canonicalEffects
  .map((e) => {
    const cls = primaryClassOf(e);
    const tag = wrapperTag(e);
    return `### ${e.name} — \`${cls}\` (${categoryMeta[e.category].label} category)

${e.description}

\`\`\`html
<!-- Correct — real class, full prefix, lowercase kebab -->
${minimalHtml(e)}
\`\`\`

\`\`\`html
<!-- Incorrect — r-* fiction (does not exist) -->
<${tag} class="r-${e.id}">…</${tag}>

<!-- Incorrect — wrong case (matches nothing) -->
<${tag} class="${misCased(e)}">…</${tag}>
\`\`\``;
  })
  .join("\n\n");

const rulesBody = `## What RoyCSS is

RoyCSS (npm package \`roycss\`, v${pkg.version}) is a pure-CSS effects framework:
${fmt(TOTAL_EFFECTS)} production-ready effect classes across ${TOTAL_CATEGORIES} categories —
zero JavaScript runtime, OKLCH colors, logical properties, container queries, and
scroll-driven animations. One global stylesheet; no build step required.

Site: https://roycss.com · repo: https://github.com/Roy-Wanyoike/Roycss

## Class naming — the real convention

1. **Every effect class is fully prefixed:** \`roycss-<effect-id>\`. Examples straight
   from the catalog: \`.roycss-btn-glow\`, \`.roycss-hover-push-up\`, \`.roycss-text-shimmer\`.
2. **Effect ids are lowercase kebab-case**, matching \`${CLASS_PATTERN}\` (validated
   against every one of the ${fmt(TOTAL_CLASSES)} real class names). Digits are allowed —
   ${digitLeadingIds.length} catalog ids start with a digit (${digitLeadingIds.map((id) => `\`${id}\``).join(", ")}).
3. **The class is the id.** ${outlierSentence}
4. **Category-led stems are common but not guaranteed.** Most ids start with a category
   stem — in Animations the top stems are ${topStems("animations", 3).join(", ")}. Large curated
   sub-families exist: ${namingFamilies.ferrum} \`ferrum-*\` effects, ${namingFamilies.vfx} \`vfx-*\` effects,
   and ${namingFamilies.batchSuffix} ids with a \`-b<number>\` batch suffix.
5. **${auxiliaryClasses.length} auxiliary selectors** (${auxiliaryClasses.slice(0, 4).map((c) => `\`.${c}\``).join(", ")}, …)
   only work as part of their parent effect's markup pattern — they are not standalone
   utilities. One base utility class exists: \`.roycss-sr-only\` (visually-hidden text for a11y).
6. **Zero modifier suffixes.** No class in the stylesheet contains \`--\` — there are no
   \`--lg\`/\`--sm\` variants of any effect. Customize by copying the effect's CSS or by
   overriding the custom properties the effect defines.

## Constraint rules — never do these

- **Never invent \`r-*\` classes.** \`r-btn-glow\`, \`r-hover-lift\`, \`r-loader-*\` do not
  exist and never did. This is documented history: a docs-vs-package drift once taught a
  short \`r-\` prefix (audit F-01/F-02); everything a reader copied silently did nothing.
  There are no short forms — always the full \`roycss-\` prefix.
- **Never emit case variants.** Class names are case-sensitive lowercase kebab-case;
  capitalized variants match nothing.
- **Never invent import paths.** There is no \`roycss/effects.css\` export and no
  \`cdn.roycss.org\` host. The real surfaces are the ones in the list below.
- **Never claim per-category or per-effect stylesheet imports.** The package is ONE
  stylesheet by design; subsetting is done with the CLI (\`npx roycss export …\`).
- **Never write a class you have not verified.** Query the MCP server, the CLI, or the
  manifest data first (see "Verifying" below). If you cannot verify it, say so.

## Import surfaces — the real ones (from the package export map)

${EXPORT_SUBPATHS.map(([sub, use]) => `- \`${sub}\` — ${use}`).join("\n")}

CDN (no build step): \`https://unpkg.com/roycss@2/dist/roycss.min.css\` (jsDelivr serves the
same npm tarball). Install: \`npm install roycss\` (or pnpm/yarn/bun).

## Usage examples — canonical, derived from the catalog

The three examples below are picked programmatically (shortest id per category,
catalog order as tie-break) from the live catalog — regenerate and they track it.

${canonicalSections}

## Ground-truth counts

| Fact | Value |
|---|---|
| Effects | ${fmt(TOTAL_EFFECTS)} |
| Categories | ${TOTAL_CATEGORIES} |
| Effect (primary) classes | ${fmt(primaryClasses.size)} — one per effect |
| Auxiliary classes | ${auxiliaryClasses.length} |
| Base utility classes | ${BASE_UTILITY_CLASSES.length} (\`.roycss-sr-only\`) |
| Total classes in the stylesheet | ${fmt(TOTAL_CLASSES)} |
| Modifier-suffix classes | ${modifierClassCount} (there are none) |
| Training pairs in \`roycss.training-pairs.jsonl\` | ${pairs.length} |

## Verifying — the ground-truth tools

- **MCP server** (in the RoyCSS repo at \`mcp-server/index.ts\`, run with \`bun\`;
  \`npx @roycss/mcp-server\` once published): \`search_effects\`, \`get_effect\`,
  \`list_categories\`, \`validate_class_name\`, \`suggest_for_intent\` — 13 tools total.
- **CLI** (\`npx roycss …\`): \`search <query>\`, \`info <effect-id>\` (fuzzy-matches typos),
  \`doctor\` (scans your source for unknown classes), \`export <ids> --out <file>\`,
  \`add <effect-id> --copy\`, \`categories\`, \`list\`.
- **Manifest data**: \`roycss/effects.json\` (the full catalog — the same data the MCP
  server and CLI read) and \`roycss/class-index\` (every class name).`;

const rulesMd = `# RoyCSS — rules for AI assistants

> llms.txt-style rules, generated from the live RoyCSS effect catalog by
> \`scripts/generate-ai-artifacts.ts\` — every class name, count, and import path
> below is derived from the shipped catalog; nothing is hand-maintained.
> Do not edit by hand — regenerate with \`bun run gen:ai\`; drift is gated by
> \`bun run ai:check\` and \`tests/unit/ai-artifacts.test.ts\`.
> Companion artifacts: \`roycss.system-prompt.md\` (paste-ready prompt),
> \`roycss.grammar.json\` (machine-readable grammar),
> \`roycss.training-pairs.jsonl\` (${pairs.length} instruction→output pairs).

${rulesBody}
`;

const systemPromptMd = `# RoyCSS system prompt for coding assistants

> Paste-ready: copy everything below the cut line into your assistant's system
> prompt / custom instructions. Generated from the live RoyCSS catalog by
> \`scripts/generate-ai-artifacts.ts\` — the same conformance guarantees as
> \`roycss.rules.md\`. Regenerate with \`bun run gen:ai\`.

--- cut here ---

${rulesBody}

## Working with RoyCSS — structured guidance

### Lookup order (use the first surface available to you)

1. **MCP server** — if the RoyCSS MCP server is connected, query it instead of
   guessing: \`search_effects\` (keyword/category/tag search over all ${fmt(TOTAL_EFFECTS)}
   effects), \`get_effect\` (full metadata for one id), \`validate_class_name\`
   (is this class real? — with closest-match suggestions), \`suggest_for_intent\`
   (UX intent → effects), \`list_categories\`.
2. **CLI** — \`npx roycss search <query>\`, \`npx roycss info <effect-id>\`,
   \`npx roycss doctor\` (scans the project for unknown classes),
   \`npx roycss export <effect-ids> --out <file>\`, \`npx roycss add <effect-id> --copy\`.
3. **Manifest** — read \`roycss/effects.json\` (full catalog: id, name, category,
   description, tags, cssCode) or \`roycss/class-index\` (every class name) from the
   installed package. The MCP server serves this same data.

### Response protocol

- Write a \`roycss-\` class only after verifying it against one of the surfaces above.
  If you cannot verify, say so explicitly instead of inventing a plausible-looking name.
- One effect per element per concern — effects are compositional but two classes
  fighting over \`transform\` will break each other.
- Minimal markup: a RoyCSS effect is one class on one element (plus any child
  elements the effect's pattern defines). No wrapper divs, no inline styles.
- Accessibility is part of the framework contract: loaders get \`role="status"\`,
  icon-only controls get \`.roycss-sr-only\` text, and \`prefers-reduced-motion\` is
  neutralized globally by the shipped stylesheet.
- When the user asks for an effect you cannot find, name what you searched and
  suggest the closest real effects by id — never a fabricated class.

### Failure modes to refuse on sight

- \`r-*\` short classes (\`r-btn-glow\`, \`r-hover-lift\`, …) — never existed.
- \`roycss/effects.css\` import path — never existed; the real stylesheet subpaths
  are \`roycss/css\` and \`roycss/css/min\`.
- \`cdn.roycss.org\` — a phantom host; real CDN URLs are unpkg/jsDelivr.
- Modifier suffixes (\`--lg\`, \`--sm\`) — zero classes contain \`--\`.
- Case variants — ids are lowercase kebab-case, nothing else matches.
`;

// ─── artifact 3: machine-readable grammar ───────────────────────────────────

const counterExamples = [
  `r-${canonicalEffects[0]!.id}`,
  misCased(canonicalEffects[0]!),
  `${primaryClassOf(canonicalEffects[0]!)}--lg`,
];

const grammar = {
  name: "roycss",
  version: pkg.version,
  description: `Machine-readable class grammar for the RoyCSS effects framework, derived from the live catalog (${fmt(TOTAL_EFFECTS)} effects / ${TOTAL_CATEGORIES} categories).`,
  generator: "scripts/generate-ai-artifacts.ts",
  regenerate: "bun run gen:ai",
  driftGate: "bun run ai:check (and tests/unit/ai-artifacts.test.ts)",
  classNamePattern: {
    pattern: CLASS_PATTERN,
    flags: "",
    description:
      "One class namespace: roycss- + lowercase kebab-case effect id. Digits allowed (catalog ids may start with a digit).",
    roundTrip: `validated against all ${fmt(TOTAL_CLASSES)} real class names at generation time`,
    examples: canonicalEffects.map((e) => primaryClassOf(e)),
    counterExamples,
  },
  categories: categoryOrder.map((cat) => ({
    id: cat,
    label: categoryMeta[cat].label,
    description: categoryMeta[cat].description,
    count: categoryCounts.get(cat)!,
    commonIdStems: topStems(cat, 3),
  })),
  modifiers: {
    exists: false,
    count: modifierClassCount,
    description:
      "No class in the stylesheet contains '--'. There are no --lg/--sm style variants; customize via the effect's own CSS/custom properties.",
  },
  baseUtilityClasses: [...BASE_UTILITY_CLASSES],
  auxiliaryClasses,
  auxiliaryClassNote: `${auxiliaryClasses.length} selectors that only appear inside their parent effect's own CSS/marker markup — not standalone utilities.`,
  idToClassRule: {
    rule: "className = 'roycss-' + effectId",
    exceptions: idToClassOutliers,
  },
  namingFamilies: {
    description: "Curated id sub-families present in the catalog (computed).",
    ferrum: namingFamilies.ferrum,
    vfx: namingFamilies.vfx,
    batchSuffix: namingFamilies.batchSuffix,
  },
  forbidden: {
    classPrefixes: ["r-"],
    modifierSuffixes: true,
    importPaths: ["roycss/effects.css"],
    cdnHosts: ["cdn.roycss.org"],
    note: "Each entry is a documented failure mode (docs-vs-package drift, audit F-01/F-02). See roycss.training-pairs.jsonl anti-pairs.",
  },
  imports: {
    install: "npm install roycss",
    stylesheet: ["roycss/css", "roycss/css/min"],
    data: ["roycss/effects.json", "roycss/class-index", "roycss/motion-library"],
    auxiliaryStylesheets: ["roycss/critical.css", "roycss/fallbacks"],
    cdn: CDN_REAL,
  },
  counts: {
    totalEffects: TOTAL_EFFECTS,
    totalCategories: TOTAL_CATEGORIES,
    primaryClasses: primaryClasses.size,
    auxiliaryClasses: auxiliaryClasses.length,
    baseUtilityClasses: BASE_UTILITY_CLASSES.length,
    totalClasses: TOTAL_CLASSES,
    modifierClasses: modifierClassCount,
    trainingPairs: pairs.length,
    digitLeadingIds: digitLeadingIds.length,
  },
};
const grammarJson = JSON.stringify(grammar, null, 2) + "\n";

// ─── self-validation (the conformance gates, run on every generation) ───────

/**
 * Extract every `roycss-*` class token from artifact text. Mirrors the
 * docs-class-api.test.ts canonical approach: case-mismatch teaching tokens
 * (`roycss-…` immediately followed by an uppercase letter) are stripped first —
 * real classes are lowercase kebab, so such tokens are negative examples.
 */
function extractClassTokens(text: string): string[] {
  const stripped = text.replace(/roycss-[a-z0-9-]+(?=[A-Z])/g, "");
  return Array.from(stripped.matchAll(/\broycss-[a-z0-9-]+/g), (m) => m[0]!);
}

/** Anti-pair fiction tokens, exactly as declared per record. */
const negativeExamples = new Set(
  pairs.flatMap((p) => (p.negativeExample ? [p.negativeExample] : [])),
);
/** The grammar's declared counter-examples (only roycss-* forms can match extraction). */
const grammarCounterExamples = new Set(counterExamples.filter((c) => c.startsWith("roycss-")));

function assertNoPhantomClasses(label: string, text: string, exemptions: ReadonlySet<string>): void {
  const offenders = extractClassTokens(text).filter((t) => !allClasses.has(t) && !exemptions.has(t));
  if (offenders.length > 0) {
    throw new Error(
      `phantom class check failed for ${label}: ${[...new Set(offenders)].slice(0, 10).join(", ")} do not exist in the catalog`,
    );
  }
}

assertNoPhantomClasses("roycss.rules.md", rulesMd, new Set());
assertNoPhantomClasses("roycss.system-prompt.md", systemPromptMd, new Set());
assertNoPhantomClasses("roycss.grammar.json", grammarJson, grammarCounterExamples);
assertNoPhantomClasses("roycss.training-pairs.jsonl", trainingPairsJsonl, negativeExamples);

// Every validClasses list must itself be real.
for (const p of pairs) {
  for (const c of p.validClasses) {
    if (!allClasses.has(c)) throw new Error(`pair ${p.id} teaches phantom class ${c}`);
  }
}

// Every comma-grouped count stated in any artifact must be a computed truth.
const allowedCommaNumbers = new Set([fmt(TOTAL_EFFECTS), fmt(TOTAL_CLASSES), fmt(primaryClasses.size)]);
function assertTruthfulCounts(label: string, text: string): void {
  const stated = Array.from(text.matchAll(/\b\d{1,3}(?:,\d{3})+\b/g), (m) => m[0]!);
  const bad = stated.filter((n) => !allowedCommaNumbers.has(n));
  if (bad.length > 0) {
    throw new Error(
      `count truthfulness failed for ${label}: stated ${[...new Set(bad)].join(", ")} — no computed truth matches`,
    );
  }
}
assertTruthfulCounts("roycss.rules.md", rulesMd);
assertTruthfulCounts("roycss.system-prompt.md", systemPromptMd);
assertTruthfulCounts("roycss.grammar.json", grammarJson);
assertTruthfulCounts("roycss.training-pairs.jsonl", trainingPairsJsonl);

// Grammar JSON count fields must equal the computed facts.
const countChecks: Array<[name: string, stated: number, computed: number]> = [
  ["totalEffects", grammar.counts.totalEffects, TOTAL_EFFECTS],
  ["totalCategories", grammar.counts.totalCategories, TOTAL_CATEGORIES],
  ["totalClasses", grammar.counts.totalClasses, TOTAL_CLASSES],
  ["primaryClasses", grammar.counts.primaryClasses, primaryClasses.size],
  ["auxiliaryClasses", grammar.counts.auxiliaryClasses, auxiliaryClasses.length],
  ["trainingPairs", grammar.counts.trainingPairs, pairs.length],
];
for (const [name, stated, computed] of countChecks) {
  if (stated !== computed) {
    throw new Error(`grammar count ${name}: stated ${stated}, computed ${computed}`);
  }
}

// ─── write (or check) ───────────────────────────────────────────────────────

const artifacts: Record<string, string> = {
  "roycss.rules.md": rulesMd,
  "roycss.system-prompt.md": systemPromptMd,
  "roycss.grammar.json": grammarJson,
  "roycss.training-pairs.jsonl": trainingPairsJsonl,
};

if (CHECK_MODE) {
  const stale: string[] = [];
  const missing: string[] = [];
  for (const name of ARTIFACT_FILES) {
    const path = join(DIST_DIR, name);
    if (!existsSync(path)) {
      missing.push(name);
      continue;
    }
    if (readFileSync(path, "utf8") !== artifacts[name]) {
      stale.push(name);
    }
  }
  if (missing.length > 0 || stale.length > 0) {
    const problems = [
      ...missing.map((n) => `dist/${n} is missing`),
      ...stale.map((n) => `dist/${n} is stale (differs from a fresh generation)`),
    ];
    console.error("✗ AI artifacts out of sync — regenerate with `bun run gen:ai`:");
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }
  console.log(
    `✓ AI artifacts in sync (${ARTIFACT_FILES.length} files, ${pairs.length} training pairs, ${fmt(TOTAL_EFFECTS)} effects)`,
  );
} else {
  mkdirSync(DIST_DIR, { recursive: true });
  for (const name of ARTIFACT_FILES) {
    writeFileSync(join(DIST_DIR, name), artifacts[name], "utf8");
  }
  console.log("Generating AI-conformance artifacts...");
  console.log(`  ✓ dist/roycss.rules.md (${(Buffer.byteLength(rulesMd) / 1024).toFixed(1)}KB)`);
  console.log(`  ✓ dist/roycss.system-prompt.md (${(Buffer.byteLength(systemPromptMd) / 1024).toFixed(1)}KB)`);
  console.log(`  ✓ dist/roycss.grammar.json (${(Buffer.byteLength(grammarJson) / 1024).toFixed(1)}KB)`);
  console.log(
    `  ✓ dist/roycss.training-pairs.jsonl (${pairs.length} pairs, ${(Buffer.byteLength(trainingPairsJsonl) / 1024).toFixed(1)}KB)`,
  );
  console.log("");
  console.log("✅ AI artifacts generated — all class tokens validated against the catalog");
  console.log(`   ${fmt(TOTAL_EFFECTS)} effects · ${TOTAL_CATEGORIES} categories · ${fmt(TOTAL_CLASSES)} classes · 0 phantoms`);
  const antiCount = pairs.filter((p) => p.kind === "anti").length;
  console.log(`   ${pairs.length} training pairs (${pairs.length - antiCount} positive / ${antiCount} anti)`);
}
