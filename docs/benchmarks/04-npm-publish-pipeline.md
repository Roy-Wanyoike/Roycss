# Benchmark 04 — npm publish pipeline

> Re-baselined 2026-09 at catalog **v2.0.0** (1,983 effects / 29 categories,
> 61,112 CSS lines). Supersedes the original ≤ 15-file / ≤ 2 MB-unpacked
> targets, which were set when the tarball shipped 13 files (~970 KB
> compressed) and have been unmeetable since the AI-artifact, token, and
> fallback exports were deliberately added to the `files` array.

Measured with `bun run publish:validate` (isolated-temp-dir
`npm pack --dry-run --json`) against a freshly built `dist/`.

## Targets vs current

| Metric                      | Target            | Current (v2.0.0) | Gate               |
| --------------------------- | ----------------- | ---------------- | ------------------ |
| Tarball size (compressed)   | ≤ 1,200 KB        | 1,060.3 KB       | **hard fail**      |
| Number of files in tarball  | ≤ 24              | 20               | **hard fail**      |
| Unpacked size               | ≤ 8,192 KB        | 7,683.4 KB       | warn → hard fail\* |
| Forbidden artifacts         | 0 present         | 0                | **hard fail**      |
| Build time                  | < 30 s            | ~6 s             | informational      |
| Install time                | < 5 s             | ~1.5 s           | informational      |

\* Unpacked size is warn-only in `scripts/publish/validate.ts`; the hard
ceiling is the compressed tarball. Keep it that way: unpacked size is
dominated by deliberate dual-format exports (see rationale below).

## Rationale for the re-baseline

- **File count 15 → 24.** The `files` array now intentionally ships the AI
  tooling surface (`roycss.grammar.json`, `roycss.system-prompt.md`,
  `roycss.rules.md`, `roycss.training-pairs.jsonl`), the design-token surface
  (`tokens.d.ts`, `tokens.dtcg.json`), the discovery surface
  (`effects.json`, `class-index.json`, `motion-library.json`,
  `roycss.manifest.json`), and the compat layers (`roycss-critical.css`,
  `roycss-fallbacks.css`) on top of the core pair (`roycss.css`,
  `roycss.min.css`) plus the JS metadata triple (`effects.js` / `effects.cjs`
  / `effects.d.ts`). With npm's implicit `package.json`, `README.md`,
  `LICENSE`, that is exactly 20 files. Every one of those entries is an
  advertised export or documented subpath — deleting any of them is a
  breaking change, not a size fix.
- **Unpacked 2,048 KB → 8,192 KB.** The monolithic stylesheets
  (`roycss.css` 1.72 MB + `roycss.min.css` 1.41 MB) and the two tooling
  indexes (`class-index.json` 954 KB + `motion-library.json` 954 KB) alone
  exceed the old 2 MB target. npm charges by compressed size; unpacked
  overhead is the price of shipping human-readable + machine-readable
  formats side by side.
- **Tarball ceiling stays at 1,200 KB.** Current 1,060.3 KB leaves ~140 KB
  (13%) headroom; `dist/important-audit.json` (3.6 KB, gitignored,
  embeds absolute local paths) and `dist/pro-components.json` (unpublished
  backend catalog) are excluded via `files` negations AND enforced by the
  forbidden-artifacts list in `scripts/publish/validate.ts`.

## Assumption / headroom for per-category CSS splits (#217)

A follow-up change adds per-category CSS files under `dist/`. This baseline
assumes those artifacts are **either negated from the npm tarball
(`!dist/css-categories/*`) or add at most 4 files / ~100 KB compressed**
(headroom already baked into the 24-file and 1,200 KB targets — the split
content duplicates what `roycss.css` already ships). If the per-category
files ship wholesale in the tarball, **re-baseline this table in the same
PR** with a measured `publish:validate` run and an updated rationale — do
not silently bump the constants in `validate.ts`.

## Where the gates live

- `scripts/publish/validate.ts` — `TARGET_TARBALL_KB`, `TARGET_FILE_COUNT`,
  `TARGET_UNPACKED_KB`, `FORBIDDEN_ARTIFACTS` (hard gates + tarball listing).
- `scripts/publish/prepare.ts` — tarball ceiling (hard) + unpacked/file-count
  informational warnings (same targets).
- Run anytime: `bun run publish:validate` (no build required; pack runs in a
  temp dir against the current `dist/`).
