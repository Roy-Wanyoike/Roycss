# Codemod migration guide

RoyCSS ships a codemod migration library (`scripts/codemods/`) with inbound
migrations **from** the frameworks developers are already on (Tailwind,
Bootstrap, Animate.css, Material UI, Chakra UI), outbound migrations **to**
plain CSS and Tailwind (lock-in prevention), and a report-only V1 → V2
scaffold. All of it is wired into the CLI:

```bash
roycss migrate <codemod> <glob> [--write]        # dry-run by default
node cli/index.js migrate from-bootstrap --help  # per-codemod help
bun scripts/codemods/from-tailwind.ts <glob>     # standalone script form
```

## Codemods

| id | direction | mappings | what it does |
| --- | --- | --- | --- |
| `from-tailwind` | inbound | 15 | `animate-*` → RoyCSS animation families, `shadow-*` → Material elevation, `backdrop-blur-*` → frosted glass. Layout utilities (`flex`, `gap-4`, …) stay as-is. |
| `from-bootstrap` | inbound | 56 | buttons, cards, alerts, badges, spinners, progress, nav, form state → RoyCSS effects. Shells (`card-body`, `table`, `btn-lg`) are kept + reported. |
| `from-animate-css` | inbound | 58 | `animate__fadeIn` → `roycss-fade-in`, `animate__slideInUp` → `roycss-slide-in-bottom`, attention seekers, one-shot entrances. Directional semantics preserved 1:1. |
| `from-mui` | inbound | 54 | top `Mui*` global classes → closest RoyCSS effects. Emotion hashes (`css-1a2b3c`) are never guessed. |
| `from-chakra` | inbound | 32 | top `chakra-*` DOM classes → closest RoyCSS effects. Layout primitives stay untouched. |
| `to-vanilla-css` | outbound | 1,976 (full catalog) | `roycss-*` → prefix-stripped plain classes **and** emits a self-contained CSS block (`--out roycss-vanilla.css`, default written on `--write`). |
| `to-tailwind` | outbound | 12 | `roycss-*` → closest *core* Tailwind utilities. Approximate mappings are flagged `~` for review. |
| `v1-to-v2` | scaffold | report-only | inventories V1 usage (`roycss-*` classes + V1 imports) to size a future migration. Transformation is blocked until the V2 `@roycss/*` packages ship (PF-042). |

## Safety model (identical for every codemod)

- **Dry-run is the default.** `--write` applies the rewrite in place.
- **Unknown classes are never transformed, always reported** (`? unknown —
  left untouched`). Framework runtime hashes (emotion `css-*`, `Muirtl-*`)
  fall in this bucket by design — a conservative codemod never guesses.
- **Recognized-but-untranslatable** classes map to `null`: kept in place,
  reported as `= kept — no RoyCSS equivalent`.
- **Whitespace is preserved byte-for-byte.** Only the token ranges inside
  `class="…"` / `className="…"` string attributes are rewritten; dynamic
  bindings (`className={expr}`) and look-alike attributes (`data-class=`)
  are skipped.
- **Idempotent.** Every target is a RoyCSS class (or plain/Tailwind class
  outbound) that the next run skips. Running twice is a no-op — pinned by
  tests.
- **Mapping targets are validated against the live catalog.**
  `tests/unit/codemods/mappings.test.ts` fails the build if any inbound
  target (or outbound key) is not a class the library really ships.

## Example session

```console
$ node cli/index.js migrate from-bootstrap "src/**/*.html"

migrate from-bootstrap — Bootstrap 5 → RoyCSS (3 files, dry-run)

src/pages/index.html — changed: 4 replaced, 2 kept (no equivalent), 1 unknown, 0 already roycss
  ✓ btn-primary → roycss-btn-glow
  ✓ card → roycss-card-glassmorphism
  = card-body kept — no RoyCSS equivalent
  ? hero-banner unknown — left untouched

migrate from-bootstrap: 3 files scanned, 3 changed
  classes replaced:      9
  unknown:               2 — hero-banner, css-1q2w3e
  mode: dry-run (use --write to apply)
```

Apply with `--write`, then import the referenced classes' CSS via
`roycss add <effect-id>` or `roycss export`.

## Outbound: leaving RoyCSS without lock-in

```bash
roycss migrate to-vanilla-css src/ --write --out roycss-vanilla.css
```

Rewrites `roycss-fade-in` → `fade-in` in markup and writes
`roycss-vanilla.css` containing the exact catalog CSS with selectors
rewritten the same way — a self-contained stylesheet that no longer needs
the RoyCSS package. `@keyframes roy-*` names are kept verbatim (already
namespaced).

## Library API

Every codemod is a pure transform plus shared machinery — usable without
the CLI:

```ts
import { codemod } from "scripts/codemods/from-bootstrap";

const result = codemod.transform(source);
// result.output       — transformed source (whitespace preserved)
// result.replaced     — [{ from, to }] pairs actually applied
// result.unknown      — classes not in the mapping table (kept + reported)
// result.kept         — recognized classes with no equivalent
// result.alreadyRoycss— RoyCSS classes found (skipped by inbound codemods)
```

Shared core lives in `scripts/codemods/lib/`: `class-scanner.ts`
(class/className tokenizer with absolute offsets), `mapper.ts`
(`applyMapping(source, table, options)`), `reporter.ts` (uniform per-file
and summary reporting), `engine.ts` (codemod definitions, glob → files,
dry-run/`--write` execution, standalone `cliMain`), `catalog.ts` (the live
class set from `src/lib`, used to validate every mapping).

## Tests

`tests/unit/codemods/` — every codemod has a six-fixture standard suite
(golden output, unknown-class safety, no-op, idempotency, whitespace
preservation, engine/reporter integration) plus semantic specs, and
`mappings.test.ts` proves every mapping resolves against the real catalog.
Run with `bunx vitest run tests/unit`.
