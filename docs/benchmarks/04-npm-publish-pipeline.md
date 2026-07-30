# Benchmarks 04 — npm Publish Pipeline

- **Owner:** Principal Engineer — RoyCSS Platform
- **Last measured:** 2026-07-30
- **Package:** `roycss@1.0.0`
- **Methodology:** All measurements taken on the reference build host (GitHub Actions `ubuntu-latest`, 4-core runner, Bun 1.3.x). Local measurements taken on the maintainer laptop may vary ±20%.

## 1. Targets

| #   | Metric                           | Target         | Why it matters                                                                              | Current status |
| --- | -------------------------------- | -------------- | ------------------------------------------------------------------------------------------- | -------------- |
| B-1 | Build time (`bun run build`)     | < **30 s**     | Keeps the publish loop tight; lets us ship a security fix in under a minute from `main`.     | ✅ ~2 s         |
| B-2 | Tarball size (compressed)        | < **500 KB**   | Fast `npm install` on bandwidth-constrained CI; small cache footprint in `node_modules`.    | ✅ ~410–498 KB  |
| B-3 | Install time (`npm install roycss`) | < **5 s**   | First-install UX in CI and on developer laptops.                                            | ✅ ~1.5 s       |
| B-4 | Unpacked size                    | < **2 MB**     | Keeps `node_modules` small; avoids bloating consumer Docker images.                         | ⚠️ ~3.6 MB (see §3) |
| B-5 | Number of files in tarball       | < **15**       | Faster filesystem traversal in CI; cleaner `npm ls` output; less surface for tar-slip attacks. | ✅ 10 files     |

## 2. Measurement Commands

```bash
# B-1 Build time
time bun run scripts/build-package.ts

# B-2 Tarball size (compressed) + B-4 Unpacked size + B-5 File count
bun run scripts/publish/validate.ts
# (validate.ts prints all three)

# B-2 (raw, authoritative — runs the same npm pack the registry will see)
npm pack --dry-run --json | jq '.[0] | {size, unpackedSize, fileCount, files: [.files[].path]}'

# B-3 Install time (cold cache — use a fresh temp dir)
mkdir -p /tmp/install-bench && cd /tmp/install-bench && rm -rf node_modules package-lock.json
time npm install roycss --no-audit --no-fund
```

## 3. Current Status (2026-07-30)

### B-1 Build time — ✅ PASS

```
$ time bun run scripts/build-package.ts
✅ RoyCSS build complete! (1569 effects across 20 categories)

real    0m1.927s
user    0m1.611s
sys     0m0.341s
```

### B-2 Tarball size (compressed) — ✅ PASS

CSS compresses extremely well (high redundancy in selectors + OKLCH color tokens). The `effects.json` metadata is the second-largest file but is also highly compressible (repeated `category` strings, repeated `tags`).

Measured via `npm pack --dry-run` from a temp dir with only the `files` array present:

```
roycss-1.0.0.tgz  ~410–498 KB  (gzip-equivalent)
```

`prepare.ts` will fail the publish gate if the compressed size exceeds 500 KB.

### B-3 Install time — ✅ PASS

`npm install roycss` is dominated by tarball download + extract; the package has **zero runtime dependencies** (`dependencies: {}`), so npm does not need to resolve a tree.

```
$ time npm install roycss --no-audit --no-fund
+ roycss@1.0.0

real    0m1.432s
```

### B-4 Unpacked size — ⚠️ ABOVE TARGET

Unpacked size on disk (sum of all files in `files` array):

| File                       | Size (bytes) | Size (KB) |
| -------------------------- | ------------ | --------- |
| `dist/roycss.css`          | 1,209,436    | 1181.1    |
| `dist/roycss.min.css`      | 1,013,439    | 989.7     |
| `dist/effects.json`        | 547,072      | 534.2     |
| `dist/effects.cjs`         | 414,081      | 404.4     |
| `dist/effects.js`          | 413,980      | 404.3     |
| `dist/effects.d.ts`        | 453          | 0.4       |
| `dist/roycss.min.css.map`  | 76           | 0.1       |
| `README.md`                | ~10,000      | ~10       |
| `LICENSE`                  | ~1,070       | ~1        |
| `CHANGELOG.md`             | ~5,000       | ~5        |
| **Total (unpacked)**       | ~3,614,607   | **~3.5 MB** |

The 2 MB target is exceeded by ~1.5 MB. The single biggest contributor is `dist/roycss.css` (the un-minified full source, ~1.18 MB) — it is shipped so that consumers can debug with readable CSS, but it nearly doubles the unpacked size.

**Mitigation options (pick one before v1.1):**

1. **Drop `roycss.css` from the tarball.** Ship only `roycss.min.css` + the source map (already 1.0 MB + 76 B = ~1.0 MB total). Consumers who want readable CSS can browse it on the docs site or in the GitHub repo. This brings unpacked size to **~2.4 MB**.
2. **Ship `roycss.css` only in a separate `roycss-source` package** (changesets multi-package). Brings `roycss` unpacked to **~2.4 MB** and `roycss-source` to **~1.2 MB**.
3. **Pre-gzip the CSS in the tarball** (`roycss.min.css.gz`) and add a `postinstall` script that decompresses it. Brings unpacked size to **~1.6 MB** but adds a postinstall hook (mild supply-chain smell).

**Decision:** Track as a known issue. The compressed tarball (B-2) is the metric that matters most for CI bandwidth and is well within budget. Defer the unpacked-size optimization to v1.1.

### B-5 Number of files — ✅ PASS

```
10 files  (7 in dist/ + README.md + LICENSE + CHANGELOG.md)
```

Well under the 15-file ceiling. `validate.ts` will fail the publish gate if file count exceeds 15.

## 4. Regression Gates

`scripts/publish/prepare.ts` enforces:

- ✅ B-2 compressed tarball < 500 KB → exit 1 if exceeded.
- ✅ B-5 file count < 15 → exit 1 if exceeded.
- ⚠️ B-4 unpacked size < 2 MB → **warns but does not fail** (current status is 3.5 MB; failing would block every publish until the v1.1 split).

B-1 (build time) and B-3 (install time) are not enforced in CI — they are informational and measured manually before each release.

## 5. Trend Log

| Date       | Version | Build (s) | Tarball (KB) | Install (s) | Unpacked (MB) | Files | Notes                          |
| ---------- | ------- | --------- | ------------ | ----------- | ------------- | ----- | ------------------------------- |
| 2026-07-30 | 1.0.0   | 1.9       | ~498         | 1.4         | 3.5           | 10    | Initial measurement. B-4 over. |

## 6. Future Hardening

- **Reproducible builds:** pin Bun version + `NODE_OPTIONS=--max-old-space-size=4096` to guarantee byte-identical tarballs across runs. Enables independent SLSA verification.
- **Tree-shakeable ESM:** split `effects.js` into per-category chunks so bundlers can drop unused categories (could cut effective install size by 50%+ for consumers who only want animations).
- **Brotli pre-compression** of the CSS, served via the CDN, for the `unpkg.com` direct-CDN install path (separate from the npm tarball).
